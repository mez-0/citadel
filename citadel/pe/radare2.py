import json
import os

import r2pipe

from citadel.models.PayloadFile import (
    BinaryEntrypoint,
    BinaryFunction,
    BinaryImportExport,
    BinarySection,
    BinaryString,
    PayloadFile,
)


def get_radare_data(file_path: str) -> PayloadFile:
    """
    parse a binary file using radare2

    :param file_path: path to the file
    :type file_path: str
    :return: a binary file object
    :rtype: BinaryFile
    """

    with Radare2Handler(file_path) as handler:
        return handler.parse_sample()


class Radare2Handler:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.arch, self.bits = None, None
        self.r2 = None

    def __enter__(self):
        self.r2 = self._open_r2()
        self.arch, self.bits = self.get_arch_and_bits()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        if self.r2:
            self.r2.quit()

    def _open_r2(self, temp_file=None) -> object:
        """Helper method to open Radare2 with default settings."""
        r2 = r2pipe.open(temp_file or self.file_path)
        r2.cmd("e bin.relocs.apply=true")
        r2.cmd("e log.level=0")
        return r2

    def parse_sample(self) -> PayloadFile:
        """
        parse the binary file and return the information from r2

        :return: the binary file information as a dataclass
        :rtype: BinaryFile
        """

        bf = PayloadFile(
            file_name=self.file_path,
            architecture=self.arch,
            file_size=os.path.getsize(self.file_path),
            sections=self.get_sections(),
            imports=self.get_imports(),
            exports=self.get_exports(),
            functions=self.get_binary_functions(),
            strings=self.get_strings(),
            entrypoint=self.get_entrypoint(),
        )

        return bf

    def disassemble_bytearray(
        self, byte_array: bytes, chunk_offset: int = 0, instructions: int = 20
    ) -> str:
        """
        Disassemble a byte array using Radare2.

        :param byte_array: The byte array to disassemble.
        :type byte_array: bytes
        :param chunk_offset: The offset of the chunk within the binary file, defaults to 0.
        :type chunk_offset: int, optional
        :param instructions: The number of instructions to disassemble, defaults to 20.
        :type instructions: int, optional
        :return: The disassembled instructions as a string.
        :rtype: str
        """

        temp_file = "/tmp/chunk.bin"

        with open(temp_file, "wb") as f:
            f.write(byte_array)

        try:
            # Open the full file to analyze its memory layout
            self.r2.cmd("aaa")  # Analyze all

            segments = self.r2.cmdj("iSj")  # Get segments in JSON

            # Determine the effective base address for the chunk
            effective_base_addr = self._calculate_base_addr(segments, chunk_offset)

            # Open the chunk file for disassembly
            r2_chunk = self._open_r2(temp_file)

            with Radare2Handler(temp_file) as r2_chunk:
                r2_chunk.cmd(f"e asm.arch={self.arch}")
                r2_chunk.cmd(f"e asm.bits={self.bits}")
                r2_chunk.cmd(f"om 0 {len(byte_array)} {effective_base_addr}")
                r2_chunk.cmd("aa")
                disasm = r2_chunk.cmd(f"pd {instructions}")
        finally:
            os.remove(temp_file)

        return disasm

    def _calculate_base_addr(self, segments, chunk_offset):
        """Calculate the base address of the chunk using the full file's segment information."""
        for segment in segments:
            paddr = segment.get("paddr", 0)  # File offset of the segment
            size = segment.get("size", 0)
            vaddr = segment.get("vaddr", 0)  # Virtual address of the segment

            # Check if the chunk offset falls within this segment
            if paddr <= chunk_offset < paddr + size:
                return vaddr + (chunk_offset - paddr)

        # Default to the chunk offset if no segment matches
        return chunk_offset

    def get_binary_functions(self) -> list[BinaryFunction]:
        """
        Retrieve functions in a binary file.

        :return: the functions in the binary file
        :rtype: list[FunctionInfo]
        """

        self.r2.cmd("aaa")

        functions_json_str = self.r2.cmd("aflj")

        if not functions_json_str:
            return []

        return self.get_sample_str_as_object(
            BinaryFunction, functions_json_str, "functions"
        )

    def get_entrypoint(self) -> list[BinaryEntrypoint]:
        """
        get the entrypoint of the binary file

        :return: the entrypoint of the binary file
        :rtype: list[Entrypoint]
        """

        entrypoint_json_str = self.r2.cmd("iej")

        if not entrypoint_json_str:
            return []

        return self.get_sample_str_as_object(
            BinaryEntrypoint, entrypoint_json_str, "entrypoint"
        )

    def get_strings(self) -> list[BinaryString]:
        """
        Retrieve strings in a binary file.

        :return: the strings in the binary file
        :rtype: list[BinaryString]
        """

        strings_json_str = self.r2.cmd("izzj")

        if not strings_json_str:
            return []

        return self.get_sample_str_as_object(BinaryString, strings_json_str, "strings")

    def get_imports(self) -> list[BinaryImportExport]:
        """
        Retrieve imports in a binary file.

        :return: the imports in the binary file
        :rtype: list[BinaryImportExport]
        """

        imports_json_str = self.r2.cmd("iij")

        if not imports_json_str:
            return []

        return self.get_sample_str_as_object(
            BinaryImportExport, imports_json_str, "imports"
        )

    def get_exports(self) -> list[BinaryImportExport]:
        """
        Retrieve exports in a binary file.

        :return: the exports in the binary file
        :rtype: list[BinaryImportExport]
        """

        exports_json_str = self.r2.cmd("iEj")

        if not exports_json_str:
            return []

        return self.get_sample_str_as_object(
            BinaryImportExport, exports_json_str, "exports"
        )

    def get_sections(self) -> list[BinarySection]:
        """
        get the sections of the binary file

        :return: the sections of the binary file
        :rtype: list[BinarySection]
        """

        sections_json_str = self.r2.cmd("iSj")

        if not sections_json_str:
            return []

        return self.get_sample_str_as_object(
            BinarySection, sections_json_str, "sections"
        )

    def get_arch_and_bits(self) -> tuple[str, str]:
        """
        Get the architecture and bits of the binary file.

        :return: the architecture and bits of the binary file
        :rtype: tuple[str, int]
        """

        info = json.loads(self.r2.cmd("iIj"))
        arch = info.get("arch", "unknown")
        bits = info.get("bits", "unknown")

        return arch, bits

    def get_sample_str_as_object(
        self, obj: object, json_str: str, title: str
    ) -> list[object]:
        """

        convert the json r2 string to an object

        :param obj: the object to convert to
        :type obj: object
        :param json_str: the json string to convert from r2
        :type json_str: str
        :param title: title for the log
        :type title: str
        :return: the object
        :rtype: list[object]
        """

        objects = []

        try:
            list_of_dicts = json.loads(json_str)

            for d in list_of_dicts:
                objects.append(obj.from_dict(d))

        except:
            return []

        return objects
