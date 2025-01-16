import base64
import hashlib
import math
from collections import Counter
from datetime import datetime
from pathlib import Path

import magic
import tlsh

DATE_TIME_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"


def standardise_epoch_time(epoch: int) -> str:
    """
    standardise the epoch time by parsing it and then converting it back to a string

    :param epoch: the epoch time to standardise
    :type epoch: int
    :return: a standardised datetime string
    :rtype: str
    """

    try:
        return datetime.fromtimestamp(epoch).strftime(DATE_TIME_FORMAT)

    except:
        return ""


def get_file_type(path: str) -> str:
    """
    get the type of a file

    :param path: the path to the file
    :type path: str
    :return: the type of the file
    :rtype: str
    """

    try:
        mime = magic.Magic(mime=True)
        return mime.from_file(path)
    except:
        return ""


def get_shannon_entropy(b: bytearray) -> float:
    """
    calculate the shannon entropy of a bytearray

    :param b: the bytearray to calculate the entropy of
    :type b: bytearray
    :return: a float representing the entropy
    :rtype: float
    """

    # Convert the bytearray to a list of integers for easier manipulation
    data = list(b)

    # Get the number of bytes in the input data
    data_size = len(data)

    # Count the occurrences of each byte in the input data
    byte_counts = Counter(data)

    # Calculate the Shannon Entropy value
    entropy = 0.0
    for count in byte_counts.values():
        # Calculate the probability of each byte occurrence in the data
        probability = count / data_size
        # Calculate the contribution to entropy for each byte
        entropy -= probability * math.log2(probability)

    return entropy


def get_file_sha256(path: str) -> str:
    """
    get the sha256 hash of a file

    :param path: the path to the file
    :type path: str
    :return: a hex string representing the sha256 hash of the file
    :rtype: str
    """

    sha256_hash = hashlib.sha256()

    try:
        # Open the file in binary read mode
        with open(path, "rb") as file:
            # Read the file in chunks to avoid memory issues for large files
            for chunk in iter(lambda: file.read(4096), b""):
                sha256_hash.update(chunk)

        # Get the hexadecimal representation of the hash
        hex_hash = sha256_hash.hexdigest()

        return hex_hash
    except:
        return ""


def get_file_tlsh(path: str) -> str:
    """
    get the tlsh hash of a file

    :param path: the file path
    :type path: str
    :return: the tlsh hash of the file
    :rtype: str
    """
    try:
        return tlsh.hash(open(path, "rb").read())

    except:
        return ""


def get_file_size(path: str) -> int:
    """
    get the size of a file in bytes

    :param path: the path to the file
    :type path: str
    :return: the size of the file in bytes
    :rtype: int
    """

    try:
        return Path(path).stat().st_size
    except:
        return 0


def get_bytearray_from_base64(s: str) -> bytearray:
    """
    from a base64 string, get the bytearray

    :param s: the base64 string
    :type s: str
    :return: a bytearray of the base64 string
    :rtype: bytearray
    """

    return bytearray(base64.b64decode(s))


def get_entropy_from_base64_string(s: str) -> float:
    """
    calculate the entropy of a base64 string after converting it to a bytearray

    :param s: the base64 string to decode and calculate the entropy of
    :type s: str
    :return: the entropy of the base64 strings contents
    :rtype: float
    """

    b = get_bytearray_from_base64(s)

    return get_shannon_entropy(b)


def get_file_entropy(path: str) -> float:
    """
    get the entropy of a file

    :param path: path to file
    :type path: str
    :return: the entropy of the file
    :rtype: float
    """

    with open(path, "rb") as file:
        b = bytearray(file.read())
        return get_shannon_entropy(b)
