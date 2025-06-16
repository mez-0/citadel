from enum import IntEnum
from pathlib import Path

import lightgbm as lgb
import magic
import pefile
import thrember
from huggingface_hub import hf_hub_download

from citadel import logger
from citadel.models.EmberResult import EmberResult
from citadel.pe.meta import get_file_type


class FileType(IntEnum):
    """Enumeration of supported file types for EMBER analysis."""

    UNKNOWN = 0
    WIN32 = 1
    WIN64 = 2
    DOTNET = 3
    APK = 4
    ELF = 5
    PDF = 6


MODEL_MAP = {
    FileType.WIN32: "EMBER2024_Win32.model",
    FileType.WIN64: "EMBER2024_Win64.model",
    FileType.DOTNET: "EMBER2024_Dot_Net.model",
    FileType.APK: "EMBER2024_APK.model",
    FileType.ELF: "EMBER2024_ELF.model",
    FileType.PDF: "EMBER2024_PDF.model",
}

MODEL_DIR = Path("~/.citadel/models").expanduser()

if not MODEL_DIR.exists():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


def detect_file_type(file_path: str) -> FileType:
    """
    Detect the file type of a file.

    :param file_path: The path to the file to detect the type of.
    :type file_path: str
    :return: The type of the file.
    :rtype: FileType
    """

    try:
        mime_type = magic.from_file(file_path, mime=True)

        with open(file_path, "rb") as f:
            header = f.read(1024)

        # simple file type detection
        if mime_type == "application/pdf" or header.startswith(b"%PDF"):
            return FileType.PDF

        if mime_type == "application/zip" and file_path.lower().endswith(".apk"):
            return FileType.APK

        if b"AndroidManifest.xml" in header:
            return FileType.APK

        if header.startswith(b"\x7fELF"):
            return FileType.ELF

        if header.startswith(b"MZ"):
            try:
                pe = pefile.PE(file_path)

                # check for .NET
                if hasattr(pe.OPTIONAL_HEADER, "DATA_DIRECTORY"):
                    for entry in pe.OPTIONAL_HEADER.DATA_DIRECTORY:
                        if (
                            entry.name == "IMAGE_DIRECTORY_ENTRY_COM_DESCRIPTOR"
                            and entry.VirtualAddress != 0
                        ):
                            return FileType.DOTNET

                # check architecture
                if pe.OPTIONAL_HEADER.Magic == 0x10B:
                    return FileType.WIN32
                elif pe.OPTIONAL_HEADER.Magic == 0x20B:
                    return FileType.WIN64

            except:
                return FileType.WIN32

        return FileType.UNKNOWN

    except Exception as e:
        logger.bad(f"Error detecting file type: {e}")
        return FileType.UNKNOWN


def download_model(model_filename: str, model_dir: Path) -> Path:
    """
    Download the model from the Hugging Face Hub.

    :param model_filename: The name of the model to download.
    :type model_filename: str
    :param model_dir: The directory to save the model to.
    :type model_dir: Path
    :return: The path to the downloaded model.
    :rtype: Path
    """

    if Path(model_dir / model_filename).exists():
        return Path(model_dir / model_filename)

    try:

        model_path = hf_hub_download(
            repo_id="joyce8/EMBER2024-benchmark-models",
            filename=model_filename,
            local_dir=str(model_dir),
        )

        return Path(model_path)

    except Exception as e:
        logger.bad(f"Failed to download {model_filename}: {e}")
        return None


def predict_file(file_path: str, model_path: Path) -> EmberResult | None:
    """
    Predict the malware score for a single file.

    :param file_path: The path to the file to predict the score of.
    :type file_path: str
    :param model_path: The path to the model to use for prediction.
    :type model_path: Path
    :return: The result of the prediction.
    :rtype: EmberResult | None
    """

    try:
        model = lgb.Booster(model_file=str(model_path))

        with open(file_path, "rb") as f:
            file_data = f.read()

        # thrember.predict_sample returns a float, not an object
        score = thrember.predict_sample(model, file_data)

        return EmberResult(
            file_path=str(file_path.resolve()),
            score=score,
            model_name=model_path.name,
        )

    except Exception as e:
        logger.bad(f"Error predicting {file_path}: {e}")
        return None


def analyse_file_with_ember(file_path: str) -> EmberResult:
    """
    Analyze a single file and return the result of the analysis containg EmberResult.

    :param file_path: The path to the file to analyze.
    :type file_path: str
    :return: The result of the analysis.
    :rtype: EmberResult
    """

    # set the result to an empty EmberResult
    ember_result = EmberResult()

    # check if the file exists
    file_path = Path(file_path)

    # if the file does not exist, return the empty EmberResult
    if not file_path.exists():
        logger.bad(f"File {file_path} does not exist")
        return ember_result

    # get the file type
    file_type = detect_file_type(file_path)

    # if the file type is not in the MODEL_MAP, return the empty EmberResult
    if file_type == FileType.UNKNOWN or file_type not in MODEL_MAP:
        logger.warning(
            f"File type {file_type.name} not supported, cannot predict with Ember"
        )
        return ember_result

    # get or download the model
    model_filename = MODEL_MAP[file_type]

    model_path = MODEL_DIR / model_filename

    if not model_path.exists():
        model_path = download_model(model_filename, MODEL_DIR)
        if not model_path:
            logger.bad(f"Failed to download {model_filename}")
            return ember_result

    # make the prediction
    ember_result = predict_file(file_path.resolve(), model_path)
    if not ember_result:
        logger.bad(f"Failed to predict {file_path}")
        return ember_result

    ember_result.model_name = model_filename

    # return the result
    return ember_result
