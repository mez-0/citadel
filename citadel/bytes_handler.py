import base64

from rich.console import Console
from rich.panel import Panel

from citadel import logger


def pretty_print_bytes(base64_bytes: str, title: str) -> None:
    """
    pretty print the base64 bytes

    :param base64_bytes: the base64 bytes to decode
    :type base64_bytes: str
    :param title: the title of the panel
    :type title: str
    """

    a = get_ascii_bytes(base64_bytes)

    if not a:
        logger.bad(f"Failed to get ascii bytes for {base64_bytes}")
        return

    # Adding emojis and coloring the hex values
    colored_output = []
    for line in a.split("\n"):
        hex_part, ascii_part = line[:48], line[48:]
        colored_hex = " ".join(f"[bold cyan]{byte}[/]" for byte in hex_part.split())
        colored_output.append(f"{colored_hex} {ascii_part}")

    panel_content = "\n".join(colored_output)
    panel = Panel(
        panel_content,
        title=f"🔍 ASCII Bytes: {title}",
        expand=False,
        border_style="bold magenta",
    )

    console = Console()

    console.print(panel)


def get_ascii_bytes(base64_bytes: str) -> str:
    """
    convert the base64 bytes to ascii

    :param base64_bytes: the base64 bytes to decode
    :type base64_bytes: str
    :return: the ascii bytes
    :rtype: str
    """
    try:
        byte_data = base64.b64decode(base64_bytes)
    except base64.binascii.Error as e:
        logger.bad(f"Error decoding base64: {e}")
        return ""

    result = []
    for i in range(0, len(byte_data), 16):
        chunk = byte_data[i : i + 16]

        # Hexadecimal representation with consistent spacing
        hex_chunk = " ".join(f"{b:02x}" for b in chunk)

        # ASCII representation with printable characters and dots for non-printable ones
        ascii_chunk = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)

        # Formatting the output, wrapping the hex chunk if necessary to avoid very wide output
        result.append(f"{hex_chunk:<48} {ascii_chunk}")

    return "\n".join(result)
