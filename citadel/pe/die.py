import json

import die

from citadel.models.DetectItEasy import DetectItEasy
from citadel.models.PayloadFile import PayloadFile


def get_die_data(file: str) -> PayloadFile:

    result = die.scan_file(
        str(file),
        die.ScanFlags.RESULT_AS_JSON | die.ScanFlags.ALL_TYPES_SCAN,
        str(die.database_path / "db"),
    )

    if not result:
        return None

    result = json.loads(result)

    if not result:
        return None

    payload_file = PayloadFile(file_name=file)

    detects = result.get("detects", [])

    for detect in detects:
        values = detect.get("values", [])

        if not values:
            continue

        for value in values:
            name = value.get("name", "")

            if not name or name == "unknown":
                continue

            version = value.get("version", "")

            if not version:
                continue

            info = value.get("info", "")
            string = value.get("string", "")
            type_ = value.get("type", "").lower()

            if not type_:
                continue

            detect_it_easy = DetectItEasy(
                info=info, name=name, string=string, type=type_, version=version
            )

            if type_ == "compiler":
                payload_file.compilers.append(detect_it_easy)
            elif type_ == "library":
                payload_file.libraries.append(detect_it_easy)
            elif type_ == "linker":
                payload_file.linkers.append(detect_it_easy)
            elif type_ == "packer":
                payload_file.packers.append(detect_it_easy)
            elif type_ == "sign tool":
                payload_file.sign_tools.append(detect_it_easy)
            elif type_ == "tool":
                payload_file.tools.append(detect_it_easy)
            else:
                continue

    return payload_file
