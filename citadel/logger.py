from datetime import datetime
from enum import IntEnum

from rich.console import Console

console = Console()


def get_current_time():
    """
    get the current date and time
    """
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%fZ")


class LogMode(IntEnum):
    GOOD = 1
    BAD = 2
    INFO = 3
    WARNING = 4
    DEBUG = 6


def log(message: str, mode: LogMode, indent: int = 0) -> None:
    """
    handle the internal logging

    :param message: what to log
    :type message: str
    :param mode: which mode to log in
    :type mode: LogMode
    :param indent: how much to indent the message
    :type indent: int
    """

    style = None

    if mode == LogMode.GOOD:
        style = "bold spring_green3"

    elif mode == LogMode.BAD:
        style = "bold red3"

    elif mode == LogMode.INFO:
        style = "bold deep_sky_blue4"

    elif mode == LogMode.WARNING:
        style = "bold dark_orange"

    elif mode == LogMode.DEBUG:
        style = "bold bright_cyan"

    else:
        raise ValueError("Invalid log mode")

    if indent:
        spacing = " " * (indent * 4)
        console.print(f"{spacing}[{style}]|_[/{style}] {message}")
    else:
        time = get_current_time()
        console.print(f"[[{style}]{time}[/{style}]] {message}")


def good(message: str, indent: int = 0):
    log(message, LogMode.GOOD, indent=indent)


def bad(message: str, indent: int = 0):
    log(message, LogMode.BAD, indent=indent)


def info(message: str, indent: int = 0):
    log(message, LogMode.INFO, indent=indent)


def warning(message: str, indent: int = 0):
    log(message, LogMode.WARNING, indent=indent)


def debug(message: str, indent: int = 0, enabled: bool = False):
    if enabled:
        log(message, LogMode.DEBUG, indent=indent)
