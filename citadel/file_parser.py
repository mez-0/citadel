from citadel.models.PayloadFile import PayloadFile
from citadel.pe.meta import get_entropy_from_base64_string
from citadel.pe.parser import get_all_payload_ifo


def get_payload_info(file: str) -> PayloadFile:
    """
    get the PE info from the file

    :param file: path to the file
    :type file: str
    :return: the PE info
    :rtype: PayloadFile
    """

    return get_all_payload_ifo(file)


def get_malicious_bytes_entropy(base64: str) -> float:
    """
    get the entropy of the malicious bytes

    :param base64: the base64 string
    :type base64: str
    :return: the entropy
    :rtype: float
    """

    return get_entropy_from_base64_string(base64)
