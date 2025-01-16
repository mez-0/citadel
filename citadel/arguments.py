import argparse

from rich_argparse import RichHelpFormatter


def get_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="🏰 Citadel", formatter_class=RichHelpFormatter
    )

    parser.add_argument("-f", "--file", type=str, help="File to process", metavar="")

    parser.add_argument(
        "-d", "--directory", type=str, help="Directory to process", metavar=""
    )

    parser.add_argument(
        "-y", "--yara", type=str, help="Yara rule(s) to apply", metavar="", default=""
    )

    parser.add_argument(
        "--thorough-defender",
        action="store_true",
        help="Enable thorough defender (default: False, may take a while)",
    )

    parser.add_argument(
        "--show-ascii-bytes",
        action="store_true",
        help="Show ASCII bytes",
    )

    parser.add_argument(
        "--tlsh-distance",
        type=int,
        help="TLSH distance (default: 50)",
        metavar="",
        default=50,
    )

    parser.add_argument(
        "--no-defender", action="store_true", help="Only run the preprocessing modules"
    )

    parser.add_argument("--no-capa", action="store_true", help="Do not run capa")

    return parser.parse_args()
