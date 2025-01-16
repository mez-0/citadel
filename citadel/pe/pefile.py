import pefile
from asn1crypto import cms
from cryptography import x509
from cryptography.hazmat.backends import default_backend

from citadel.models.PayloadFile import BinaryOptionalHeaders, Certificate, PayloadFile
from citadel.pe.meta import standardise_epoch_time


def get_optional_header_fields(pe: pefile.PE) -> BinaryOptionalHeaders:
    """
    get the optional header fields from a PE file

    :param pe: the pe object
    :type pe: pefile.PE
    :return: a object containing the optional header fields
    :rtype: BinaryOptionalHeaders
    """

    obj = BinaryOptionalHeaders()

    # Check if the optional header is present
    if hasattr(pe, "OPTIONAL_HEADER"):
        optional_header_fields = {}

        # Iterate over the fields in the optional header and store them in the dictionary
        for field_name in dir(pe.OPTIONAL_HEADER):
            if field_name == "DATA_DIRECTORY":
                continue
            if not field_name.startswith("__"):  # Ignore special methods
                value = getattr(pe.OPTIONAL_HEADER, field_name)
                if not callable(value):  # Ignore methods, we only want attributes
                    setattr(obj, field_name.lower(), value)

    return obj


def get_time_stamp(pe: pefile.PE) -> str:
    """
    get the time stamp from a PE file

    :param pe: the pe object
    :type pe: pefile.PE
    :return: the time stamp
    :rtype: str
    """
    try:
        return pe.FILE_HEADER.dump_dict()["TimeDateStamp"]["Value"].split("[")[1][:-1]
    except:
        return ""


def get_certificate_info(pe: pefile.PE, file_path: str) -> list[Certificate]:
    """

    get the certificate information from a PE file

    :param pe: the pe object
    :type pe: pefile.PE
    :param file_path: the path to the file
    :type file_path: str
    :return: the certificate information
    :rtype: list[Certificate]
    """

    try:
        # check if file is signed
        signature_offset = pe.OPTIONAL_HEADER.DATA_DIRECTORY[
            pefile.DIRECTORY_ENTRY["IMAGE_DIRECTORY_ENTRY_SECURITY"]
        ].VirtualAddress

        signature_length = pe.OPTIONAL_HEADER.DATA_DIRECTORY[
            pefile.DIRECTORY_ENTRY["IMAGE_DIRECTORY_ENTRY_SECURITY"]
        ].Size

        with open(file_path, "rb") as f:
            f.seek(signature_offset)
            data = f.read(signature_length)

        signature = cms.ContentInfo.load(data[8:])

        cert_objects = []

        for cert in signature["content"]["certificates"]:
            parsed_cert = x509.load_der_x509_certificate(cert.dump(), default_backend())

            serial_number = parsed_cert.serial_number
            subject = parsed_cert.subject.rfc4514_string()
            issuer = parsed_cert.issuer.rfc4514_string()
            not_valid_before = parsed_cert.not_valid_before_utc.timestamp()
            not_valid_after = parsed_cert.not_valid_after_utc.timestamp()
            signature_hash_algorithm = parsed_cert.signature_hash_algorithm.name
            signature_algorithm_oid = parsed_cert.signature_algorithm_oid._name

            cert_objects.append(
                Certificate(
                    serial_number=str(serial_number),
                    subject=subject,
                    issuer=issuer,
                    not_valid_before=standardise_epoch_time(not_valid_before),
                    not_valid_after=standardise_epoch_time(not_valid_after),
                    signature_hash_algorithm=signature_hash_algorithm,
                    signature_algorithm_oid=signature_algorithm_oid,
                )
            )

        return cert_objects
    except:
        return []


def parse_pe(file: str) -> PayloadFile:
    """
    get pe components specifc to pefile

    :param file: the input file
    :type file: str
    :return: an updated BinaryFile object
    :rtype: BinaryFile
    """
    with open(file, "rb") as f:
        pe = pefile.PE(data=f.read())

        optional_headers = get_optional_header_fields(pe)

        timestamp = get_time_stamp(pe)

        certificates = get_certificate_info(pe, file)

        return PayloadFile(
            optional_headers=optional_headers,
            timestamp=timestamp,
            certificates=certificates,
        )
