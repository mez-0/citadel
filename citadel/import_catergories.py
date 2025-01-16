import csv
from pathlib import Path

import requests

from citadel import logger
from citadel.models.FunctionMapping import FunctionMapping
from citadel.models.PayloadFile import PayloadFile
from citadel.models.Task import Task

FUNCTION_MAPPING_URL = "https://gist.githubusercontent.com/mez-0/833314d8e920a17aa3ca703eabbfa4a5/raw/f98a3a6dae357c08a2b1b3252114350db66a56de/function-mappings.csv"

FUNCTION_MAPPING_FILE = "/tmp/function-mappings.csv"


def get_mapping_file() -> bool:
    """
    download the function mapping file from the URL

    :return: return true if the file is downloaded successfully or is already present
    :rtype: bool
    """

    if Path(FUNCTION_MAPPING_FILE).exists():
        return True

    try:
        response = requests.get(FUNCTION_MAPPING_URL)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logger.bad(f"Failed to download function mapping file: {e}")
        return False

    with open(FUNCTION_MAPPING_FILE, "wb") as f:
        f.write(response.content)
    return True


def parse_tsv_to_dict() -> dict:
    """
    parse the function mapping file to a dictionary

    :return: a dict containing the function mapping data
    :rtype: dict
    """

    function_mapping = {}

    with open(FUNCTION_MAPPING_FILE, "r") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            # Strip spaces from keys
            row = {key.strip(): value for key, value in row.items()}

            title = row.get("title")
            description = row.get("description")
            category = row.get("category")

            if not title:
                logger.bad(f"Title is missing in row: {row}")
                continue

            if not description:
                logger.bad(f"Description is missing in row: {row}")
                continue

            if not category:
                logger.bad(f"Category is missing in row: {row}")
                continue

            function_mapping[title.strip()] = {
                "description": description.strip(),
                "category": category.strip(),
            }

    return function_mapping


def get_function_mapping(task: Task, payload: PayloadFile) -> Task:
    """
    get the function mapping for the payload

    :param task: the task to update
    :type task: Task
    :param payload: the payload to get the function mapping for
    :type payload: PayloadFile
    :return: a task with the function mappings updated
    :rtype: Task
    """

    if not get_mapping_file():
        logger.bad("Function mapping file is not present!")
        return task

    function_mapping = parse_tsv_to_dict()

    payload_imports = payload.imports

    function_mapping_models = []

    for function_map_title, function_map_data in function_mapping.items():
        if "!" not in function_map_title:
            continue

        function_map_dll, function_map_function = function_map_title.split("!")
        function_map_description = function_map_data.get("description")
        function_map_category = function_map_data.get("category")

        for import_entry in payload_imports:
            # name of the dll
            import_entry_dll = import_entry.libname

            # name of the function
            import_entry_function = import_entry.name

            if function_map_dll.lower() == import_entry_dll.lower():
                if function_map_function == import_entry_function:
                    function_mapping_models.append(
                        FunctionMapping(
                            dll=function_map_dll,
                            function=function_map_function,
                            description=function_map_description,
                            category=function_map_category,
                        )
                    )
                    break

    if function_mapping_models:
        task.function_mappings = function_mapping_models

    return task
