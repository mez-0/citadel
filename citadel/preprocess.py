import argparse

from citadel import logger
from citadel.capa_handler import get_capa_reports
from citadel.import_catergories import get_function_mapping
from citadel.lookup_tlsh import find_similar_hashes
from citadel.models.PayloadFile import PayloadFile
from citadel.models.Task import Task
from citadel.yara_handler import match_yara_rules


async def pre_process(
    args: argparse.Namespace, task: Task, payload: PayloadFile = None
) -> Task:
    """
    handle any preprocessing of the samples

    :param args: the arguments passed to the program
    :type args: argparse.Namespace
    :param task: the task to be preprocessed
    :type task: Task
    :param payload: the payload to be used for preprocessing
    :type payload: SampleFile
    :return: an updated task
    :rtype: Task
    """

    logger.info(f"Preprocessing task: [bold blue]{task.uuid}")

    if args.yara:
        task.yara_matches = match_yara_rules(task.file_name, args.yara)
        if task.yara_matches:
            logger.good(f"Found {len(task.yara_matches)} yara matches", indent=1)

    if args.no_capa == False:
        task.capa_reports = get_capa_reports(task.file_name)
        if task.capa_reports:
            logger.good(f"Found {len(task.capa_reports)} capa reports", indent=1)

    if payload:
        task = get_function_mapping(task, payload)

        if task.function_mappings:
            logger.good(
                f"Found {len(task.function_mappings)} function mappings", indent=1
            )

        task.similar_tlsh_hashes = await find_similar_hashes(
            payload.tlsh, max_distance=args.tlsh_distance
        )

        if task.similar_tlsh_hashes:
            logger.good(
                f"Found {len(task.similar_tlsh_hashes)} similar TLSH hashes", indent=1
            )

    return task
