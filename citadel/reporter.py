from rich.console import Console
from rich.table import Table

from citadel import logger
from citadel.bytes_handler import get_ascii_bytes, pretty_print_bytes
from citadel.file_parser import get_malicious_bytes_entropy
from citadel.lookup_tlsh import report_tlsh_similarities
from citadel.models.PayloadFile import PayloadFile
from citadel.models.Task import Task


async def print_report(
    task: Task,
    payload: PayloadFile,
    show_ascii_bytes: bool = False,
) -> None:
    """

    print the report for the task

    :param task: the task object
    :type task: Task
    :param payload: the payload object
    :type payload: PayloadFile
    :param show_ascii_bytes: whether to show the ascii bytes (default: False)
    :type show_ascii_bytes: bool
    """

    console = Console()

    amsi_colour = "green" if task.amsi_result == "AMSI_RESULT_NOT_DETECTED" else "red"

    defender_colour = (
        "green" if task.defender_result == "DEFENDER_RESULT_NOT_DETECTED" else "red"
    )

    logger.info(f"Task UUID: [bold blue]{task.uuid}")

    logger.info(f"SHA256: [bold blue]{task.file_sha256}", indent=1)

    logger.info(f"TLSH: [bold blue]{payload.tlsh}", indent=1)

    logger.info(f"File name: [bold blue]{task.file_name}", indent=1)

    logger.info(f"Status: [bold green]{task.task_status}", indent=1)

    logger.info(f"Time sent: [bold blue]{task.time_sent}", indent=1)

    logger.info(f"Time updated: [bold blue]{task.time_updated}", indent=1)

    logger.info(
        f"Time taken: [bold blue]{task.time_updated - task.time_sent}s",
        indent=1,
    )

    logger.info(f"AMSI result: [bold {amsi_colour}]{task.amsi_result}", indent=1)

    logger.info(
        f"Defender result: [bold {defender_colour}]{task.defender_result}",
        indent=1,
    )

    if task.threat_names:
        logger.info(
            f"Threat names: [bold red]{', '.join(task.threat_names)}",
            indent=1,
        )

    if task.zero_x_malicious_bytes.base64_bytes:
        task.zero_x_malicious_bytes.ascii_byte_representation = get_ascii_bytes(
            task.zero_x_malicious_bytes.base64_bytes
        )

        task.zero_x_malicious_bytes.entropy = get_malicious_bytes_entropy(
            task.zero_x_malicious_bytes.base64_bytes
        )

        entropy_colour = "red" if task.zero_x_malicious_bytes.entropy > 6.1 else "green"

        logger.info(
            f"[bold orchid1][0 -> X][/bold orchid1] Malicious bytes entropy: [bold {entropy_colour}]{task.zero_x_malicious_bytes.entropy}",
            indent=1,
        )

    if task.x_y_malicious_bytes.base64_bytes:
        task.x_y_malicious_bytes.ascii_byte_representation = get_ascii_bytes(
            task.x_y_malicious_bytes.base64_bytes
        )

        task.x_y_malicious_bytes.entropy = get_malicious_bytes_entropy(
            task.x_y_malicious_bytes.base64_bytes
        )

        entropy_colour = "red" if task.x_y_malicious_bytes.entropy > 6.1 else "green"

        logger.info(
            f"[bold orchid1][X -> Y][/bold orchid1] Malicious bytes entropy: [bold {entropy_colour}]{task.x_y_malicious_bytes.entropy}",
            indent=1,
        )

    elif task.thorough_malicious_bytes:
        for idx, b in enumerate(task.thorough_malicious_bytes):

            b.ascii_byte_representation = get_ascii_bytes(b.base64_bytes)
            b.entropy = get_malicious_bytes_entropy(b.base64_bytes)

            entropy_colour = "red" if b.entropy > 6.1 else "green"

            logger.info(
                f"Malicious bytes entropy {idx}: [bold {entropy_colour}]{b.entropy}",
                indent=1,
            )
    else:
        logger.bad("No malicious bytes found.", indent=1)

    file_entropy_colour = "red" if payload.entropy > 6.1 else "green"

    logger.info(
        f"File Entropy: [bold {file_entropy_colour}]{payload.entropy}",
        indent=1,
    )

    if task.function_mappings:
        category_counts = {}
        for fm in task.function_mappings:
            if fm.category not in category_counts:
                category_counts[fm.category] = 1
            else:
                category_counts[fm.category] += 1

        category_counts = dict(
            sorted(category_counts.items(), key=lambda item: item[1], reverse=True)
        )

        logger.info("Function mappings:", indent=1)

        for category, count in category_counts.items():
            logger.info(
                f"[bold blue]{category}[/bold blue]: [bold red]{count}",
                indent=2,
            )

    if task.capa_reports:
        if task.capa_reports:
            mitre_table = Table(title=f"Capa report: MITRE ATT&CK")
            mitre_table.add_column("ID", style="bold blue")
            mitre_table.add_column("Name", style="bold blue")
            mitre_table.add_column("Tactic", style="bold blue")
            mitre_table.add_column("Technique", style="bold blue")
            mitre_table.add_column("Subtechnique", style="bold blue")

            mbc_table = Table(title=f"Capa report Malware Behaviour Catalog")
            mbc_table.add_column("Name", style="bold blue")
            mbc_table.add_column("Objective", style="bold blue")
            mbc_table.add_column("Behavior", style="bold blue")
            mbc_table.add_column("Method", style="bold blue")

            for report in task.capa_reports:
                if report.mitre_techniques:
                    for mt in report.mitre_techniques:
                        subtechnique = mt.subtechnique if mt.subtechnique else ""
                        mitre_table.add_row(
                            mt.tid, report.name, mt.tactic, mt.technique, subtechnique
                        )

                if report.malware_behaviour_catalogs:
                    for mbc in report.malware_behaviour_catalogs:
                        mbc_table.add_row(
                            report.name, mbc.objective, mbc.behavior, mbc.method
                        )

            console.print(mitre_table)
            print()
            console.print(mbc_table)

    if task.yara_matches:
        print()
        yara_table = Table(title="Yara Matches")
        yara_table.add_column("Name", style="bold blue")
        yara_table.add_column("Description", style="bold blue")
        yara_table.add_column("Author", style="bold blue")
        yara_table.add_column("Reference", style="bold blue")
        yara_table.add_column("Date", style="bold blue")

        for yara in task.yara_matches:
            yara_table.add_row(
                yara.name,
                yara.description,
                yara.author,
                yara.reference,
                yara.date,
            )

        console.print(yara_table)

    if task.similar_tlsh_hashes:
        report_tlsh_similarities(task.similar_tlsh_hashes)

    if show_ascii_bytes and task.zero_x_malicious_bytes.base64_bytes:
        pretty_print_bytes(task.zero_x_malicious_bytes.base64_bytes, "0 -> X")

    if show_ascii_bytes and task.x_y_malicious_bytes.base64_bytes:
        pretty_print_bytes(task.x_y_malicious_bytes.base64_bytes, "X -> Y")
