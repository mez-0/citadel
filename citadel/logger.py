from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from inspect import stack
from pathlib import Path

from rich import print
from rich.console import Console


@dataclass
class Frame:
    filename: str
    line: int


class Mode(Enum):
    GOOD = 1
    FAIL = 2
    INFO = 3
    DANGER = 4
    DEBUG = 5
    WARNING = 6
    EXCEPTION = 7

    def __str__(self):
        return self.name.lower()


console = Console()


def log(
    string: str,
    mode: Mode,
    indent: int,
    show_highlight: bool = True,
    frame_message: str = None,
    end: str = "\n",
) -> None:
    date = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

    # Styling configuration
    styles = {
        Mode.GOOD: "bold chartreuse3 underline",
        Mode.FAIL: "bold red underline",
        Mode.INFO: "bold deep_sky_blue2 underline",
        Mode.DANGER: "bold red underline",
        Mode.DEBUG: "bold orchid1 underline",
        Mode.WARNING: "bold gold1 underline",
        Mode.EXCEPTION: "bold red underline underline",
    }

    # Get the style for this mode
    style = styles[mode]

    # ASCII connector
    connector = "|>"

    # Build the timestamp portion
    timestamp = f"[grey50]{date}[/grey50] " if indent == 0 else ""

    # Build the header - only shown if not indented
    header = f"[{style}]{mode.name}[/{style}]" if indent == 0 else ""

    # Handle indentation
    if indent == 0:
        indent_str = ""
    else:
        base_spacing = " " * 10

        # indent_spacing = " " * ((indent - 1) * 2)

        indent_style = style.replace("underline", "")

        indent_str = (
            # " " * (indent * 2)
            base_spacing
            # + indent_spacing
            + f"[{indent_style}]{connector}[/{indent_style}]"
        )

    # Construct message
    message_parts = [timestamp, header]
    if indent > 0:
        message_parts.insert(0, indent_str)
    else:
        message_parts.insert(0, " ")  # Small padding for non-indented messages

    message = "".join(message_parts) + f" [white]{string}[/white]"

    # Add frame info for debug
    if mode == Mode.DEBUG and frame_message:
        message += f" [grey37]({frame_message})[/grey37]"

    console.print(message, highlight=show_highlight, end=end)
    log_to_file(string, date, str(mode))


def log_to_file(string: str, date: str, mode: str) -> None:
    log_directory = Path("~/.citadel/logs").expanduser()
    log_directory.mkdir(parents=True, exist_ok=True)
    log_file = log_directory / f"{get_executing_file()}.log"
    write_mode = "a" if log_file.exists() else "w"

    with open(log_file, write_mode) as f:
        f.write(f"{date} [{mode.upper()}] {string}\n")


def info(
    message: str, indent: int = 0, show_highlight: bool = True, end: str = "\n"
) -> None:
    log(message, Mode.INFO, indent, show_highlight, end=end)


def good(
    message: str, indent: int = 0, show_highlight: bool = True, end: str = "\n"
) -> None:
    log(message, Mode.GOOD, indent, show_highlight, end=end)


def bad(
    message: str, indent: int = 0, show_highlight: bool = True, end: str = "\n"
) -> None:
    log(message, Mode.FAIL, indent, show_highlight, end=end)


def danger(
    message: str, indent: int = 0, show_highlight: bool = True, end: str = "\n"
) -> None:
    log(message, Mode.DANGER, indent, show_highlight, end=end)


def warning(
    message: str, indent: int = 0, show_highlight: bool = True, end: str = "\n"
) -> None:
    log(message, Mode.WARNING, indent, show_highlight, end=end)


def debug(
    message: str,
    enable: bool,
    indent: int = 0,
    show_highlight: bool = True,
    end: str = "\n",
) -> None:
    if not enable:
        return
    frame = get_frame_info()
    frame_message = f"{frame.filename}:{frame.line}"
    log(message, Mode.DEBUG, indent, show_highlight, frame_message, end=end)


def exception(message: str, show_locals=False, show_highlight: bool = True) -> None:
    log(message, Mode.EXCEPTION, 0, show_highlight)
    print()
    Console().print_exception(extra_lines=5, show_locals=show_locals)


def get_frame_info() -> Frame:
    frames = stack()
    offset = 2
    if len(frames) >= offset:
        required_frame = frames[offset]
        return Frame(
            filename=required_frame.filename.split("/")[-1], line=required_frame.lineno
        )


def get_executing_file() -> str:
    frames = stack()
    try:
        required_frame = frames[-1]
        filename = required_frame.filename.split("/")[-1]
        return filename.replace(".py", "")
    except:
        return __file__
