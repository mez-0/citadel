import lief


def get_internal_file_name(file: str) -> str:
    """
    get the internal file name of a PE file

    :param file: the path to the file
    :type file: str
    :return: the internal file name
    :rtype: str
    """

    with open(file, "rb") as f:
        file_bytes = f.read()

    l = lief.PE.parse(raw=list(file_bytes))

    if not l:
        return ""

    export = l.get_export()

    if not export:
        return ""

    name = export.name

    if ".dll" in name or ".exe" in name:
        return name
    else:
        return ""
