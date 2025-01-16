import argparse
import asyncio
from datetime import datetime
from pathlib import Path

from citadel import logger
from citadel.arguments import get_args
from citadel.db import CitadelDatabaseApi
from citadel.enums import MONGO_COLLECTIONS
from citadel.file_parser import get_pe_info
from citadel.models.PayloadFile import PayloadFile
from citadel.models.Task import TASK_STATUS, Task
from citadel.preprocess import pre_process
from citadel.reporter import print_report


async def add_file_to_db(
    api: CitadelDatabaseApi,
    file: str,
    pe_info: PayloadFile,
    args: argparse.Namespace,
) -> Task:
    """
    Add a file to the database.

    :param api: the CitadelDatabaseApi instance
    :type api: CitadelDatabaseApi
    :param file: file to add
    :type file: str
    :param pe_info: the PE info structure
    :type pe_info: PayloadWindowsNative
    :param args: the arguments from the command line
    :type args: argparse.Namespace
    :return: the task that was added to the database
    :rtype: Task
    """

    logger.info(f"SHA256: [bold blue]{pe_info.sha256}", indent=1)
    logger.info(f"TLSH: [bold blue]{pe_info.tlsh}", indent=1)

    task = Task(
        time_sent=int(datetime.now().timestamp()),
        file_sha256=pe_info.sha256,
        file_name=str(Path(file).resolve()),
        enable_thorough_defender=args.thorough_defender,
        task_status=(
            TASK_STATUS.PENDING.name
            if not args.no_defender
            else TASK_STATUS.COMPLETED.name
        ),
    )

    logger.info(f"Task UUID: [bold blue]{task.uuid}", indent=1)

    print()

    task = await pre_process(args, task, payload=pe_info)

    response = await api.add_singular_object_to_db(task, MONGO_COLLECTIONS.TASKS)

    if response.amount_inserted == 1:
        logger.good("Task successfully added to database.", indent=1)
    else:
        logger.bad("Failed to add task to database.", indent=1)

    response = await api.add_singular_object_to_db(pe_info, MONGO_COLLECTIONS.PAYLOADS)

    if response.amount_inserted == 1:
        logger.good("PE info successfully added to database.", indent=1)
    else:
        logger.bad("Failed to add PE info to database.", indent=1)

    return task


def get_files(args: argparse.Namespace) -> list[str]:
    files = []

    if args.file:
        files.append(str(Path(args.file).resolve()))
    elif args.directory:
        for file in Path(args.directory).rglob("*"):
            if file.is_file():
                files.append(str(file.resolve()))
    return files


async def main():
    args = get_args()

    if args.file and args.directory:
        logger.bad("Please provide either a file or a directory, not both.")
        return

    files = get_files(args)

    if not files:
        logger.bad("No files found.")
        return

    api = CitadelDatabaseApi()

    new_tasks = []

    for file in files:
        logger.info(f"Processing file: [bold blue]{file}")

        pe_info = get_pe_info(file)

        if not pe_info:
            logger.bad(f"Failed to parse PE file: {file}")
            continue

        task = await add_file_to_db(api, file, pe_info, args)
        if task:
            new_tasks.append(task)
        else:
            logger.bad(f"Failed to add file: {file}")

    if args.no_defender:
        return

    print()

    logger.info("Waiting for results...")

    reported = []

    while True:
        if len(reported) == len(new_tasks):
            break

        db_tasks = await api.get_completed_tasks(MONGO_COLLECTIONS.TASKS)

        for task in db_tasks:

            if task.uuid not in [t.uuid for t in new_tasks]:
                continue

            if task.uuid in reported:
                continue

            payload = await api.get_payload_by_sha256(task.file_sha256)

            if not payload:
                logger.bad(f"Failed to retrieve payload for task: {task.uuid}")
                continue

            await print_report(task, payload, show_ascii_bytes=args.show_ascii_bytes)

            response = await api.update_singular_object_in_db(
                task, MONGO_COLLECTIONS.TASKS
            )

            reported.append(task.uuid)

            if response.amount_updated == 1:
                logger.good("Task successfully updated in database.", indent=1)
            else:
                logger.bad("Failed to update task in database.", indent=1)


if __name__ == "__main__":
    asyncio.run(main())
