from citadel import logger
from citadel.models.PayloadFile import PayloadFile
from citadel.pe.die import get_die_data
from citadel.pe.lief import get_internal_file_name
from citadel.pe.meta import (
    get_file_entropy,
    get_file_sha256,
    get_file_size,
    get_file_tlsh,
    get_file_type,
)
from citadel.pe.pefile import parse_pe
from citadel.pe.radare2 import get_radare_data


def get_all_payload_ifo(
    file_path: str, ignore_functions: bool = False, no_logging: bool = False
) -> PayloadFile:
    """
    parse a pe file using radare2 and pefile

    :param file_path: path to the file
    :type file_path: str
    :param ignore_functions: whether to ignore functions or not
    :type ignore_functions: bool
    :param no_logging: whether to log or not
    :type no_logging: bool
    :return: a binary file object
    :rtype: BinaryFile
    """

    base_model = PayloadFile(
        file_name=file_path,
        file_size=get_file_size(file_path),
        entropy=get_file_entropy(file_path),
        file_type=get_file_type(file_path),
        sha256=get_file_sha256(file_path),
        tlsh=get_file_tlsh(file_path),
        internal_name=get_internal_file_name(file_path),
    )

    try:
        radare2_binary_file = get_radare_data(file_path)

        if radare2_binary_file:
            base_model.architecture = radare2_binary_file.architecture
            base_model.entrypoint = radare2_binary_file.entrypoint
            base_model.imports = radare2_binary_file.imports
            base_model.exports = radare2_binary_file.exports
            base_model.sections = radare2_binary_file.sections
            base_model.strings = radare2_binary_file.strings
            if not ignore_functions:
                base_model.functions = radare2_binary_file.functions
            if not no_logging:
                logger.good(f"Successfully updated model with radare2", indent=1)
        else:
            if not no_logging:
                logger.warning(f"Failed to update model with radare2", indent=1)
    except Exception as e:
        if not no_logging:
            logger.bad(f"Error updating model with radare2: {e}", indent=1)

    try:
        pe_binary_file = parse_pe(file_path)

        if pe_binary_file:
            base_model.optional_headers = pe_binary_file.optional_headers
            base_model.timestamp = pe_binary_file.timestamp
            base_model.certificates = pe_binary_file.certificates
            if not no_logging:
                logger.good(f"Successfully updated model with pefile", indent=1)
        else:
            if not no_logging:
                logger.warning(f"Failed to update model with pefile", indent=1)
    except Exception as e:
        if not no_logging:
            logger.bad(f"Error updating model with pefile: {e}", indent=1)

    try:
        die_binary_file = get_die_data(file_path)

        if die_binary_file:
            base_model.compilers = die_binary_file.compilers
            base_model.libraries = die_binary_file.libraries
            base_model.linkers = die_binary_file.linkers
            base_model.packers = die_binary_file.packers
            base_model.sign_tools = die_binary_file.sign_tools
            base_model.tools = die_binary_file.tools
            if not no_logging:
                logger.good(f"Successfully updated model with die", indent=1)
        else:
            if not no_logging:
                logger.warning(f"Failed to update model with die", indent=1)
    except Exception as e:
        if not no_logging:
            logger.bad(f"Error updating model with die: {e}", indent=1)

    return base_model
