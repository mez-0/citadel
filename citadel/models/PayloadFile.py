import os
from dataclasses import dataclass, field
from pathlib import Path

from dataclasses_json import dataclass_json

from citadel.models.DetectItEasy import DetectItEasy


@dataclass_json
@dataclass
class BinaryFunction:
    offset: int = field(default_factory=int)
    name: str = field(default_factory=str)
    size: int = field(default_factory=int)
    is_pure: str = field(default_factory=str)
    realsz: int = field(default_factory=int)
    noreturn: bool = field(default_factory=bool)
    recursive: bool = field(default_factory=bool)
    stackframe: int = field(default_factory=int)
    calltype: str = field(default_factory=str)
    cost: int = field(default_factory=int)
    cc: int = field(default_factory=int)
    bits: int = field(default_factory=int)
    type: str = field(default_factory=str)
    nbbs: int = field(default_factory=int)
    tracecov: int = field(default_factory=int)
    is_lineal: bool = field(default_factory=bool)
    ninstrs: int = field(default_factory=int)
    edges: int = field(default_factory=int)
    ebbs: int = field(default_factory=int)
    signature: str = field(default_factory=str)
    minbound: int = field(default_factory=int)
    maxbound: int = field(default_factory=int)
    maxbbins: int = field(default_factory=int)
    midbbins: float = field(default_factory=float)
    ratbbins: float = field(default_factory=float)
    indegree: int = field(default_factory=int)
    outdegree: int = field(default_factory=int)
    nlocals: int = field(default_factory=int)
    nargs: int = field(default_factory=int)
    difftype: str = field(default_factory=str)


@dataclass_json
@dataclass
class BinaryEntrypoint:
    paddr: int = field(default_factory=int)
    vaddr: int = field(default_factory=int)
    baddr: int = field(default_factory=int)
    laddr: int = field(default_factory=int)
    haddr: int = field(default_factory=int)
    type: str = field(default_factory=str)


@dataclass_json
@dataclass
class BinaryString:
    vaddr: int = field(default_factory=int)
    paddr: int = field(default_factory=int)
    ordinal: int = field(default_factory=int)
    size: int = field(default_factory=int)
    length: int = field(default_factory=int)
    section: str = field(default_factory=str)
    type: str = field(default_factory=str)
    string: str = field(default_factory=str)


@dataclass_json
@dataclass
class BinaryImportExport:
    ordinal: int = field(default_factory=int)
    bind: str = field(default_factory=str)
    type: str = field(default_factory=str)
    name: str = field(default_factory=str)
    libname: str = field(default_factory=str)
    plt: int = field(default_factory=int)


@dataclass_json
@dataclass
class BinarySection:
    name: str = field(default_factory=str)
    size: int = field(default_factory=int)
    vsize: int = field(default_factory=int)
    perm: str = field(default_factory=str)
    flags: int = field(default_factory=int)
    paddr: int = field(default_factory=int)
    vaddr: int = field(default_factory=int)


@dataclass_json
@dataclass
class Certificate:
    serial_number: str = field(default_factory=str)
    subject: str = field(default_factory=str)
    issuer: str = field(default_factory=str)
    not_valid_before: str = field(default_factory=str)
    not_valid_after: str = field(default_factory=str)
    signature_hash_algorithm: str = field(default_factory=str)
    signature_algorithm_oid: str = field(default_factory=str)


@dataclass_json
@dataclass
class BinaryOptionalHeaders:
    addressofentrypoint: int = field(default_factory=int)
    baseofcode: int = field(default_factory=int)
    checksum: int = field(default_factory=int)
    dllcharacteristics: int = field(default_factory=int)
    filealignment: int = field(default_factory=int)
    imagedllcharacteristicsappcontainer: bool = field(default_factory=bool)
    imagedllcharacteristicsdynamicbase: bool = field(default_factory=bool)
    imagedllcharacteristicsforceintegrity: bool = field(default_factory=bool)
    imagedllcharacteristicsguardcf: bool = field(default_factory=bool)
    imagedllcharacteristicshighentropyva: bool = field(default_factory=bool)
    imagedllcharacteristicsnobind: bool = field(default_factory=bool)
    imagedllcharacteristicsnoisolation: bool = field(default_factory=bool)
    imagedllcharacteristicsnoseh: bool = field(default_factory=bool)
    imagedllcharacteristicsnxcompat: bool = field(default_factory=bool)
    imagedllcharacteristicsterminalserveraware: bool = field(default_factory=bool)
    imagedllcharacteristicswdmdriver: bool = field(default_factory=bool)
    imagebase: int = field(default_factory=int)
    loaderflags: int = field(default_factory=int)
    magic: int = field(default_factory=int)
    majorimageversion: int = field(default_factory=int)
    majorlinkerversion: int = field(default_factory=int)
    majoroperatingsystemversion: int = field(default_factory=int)
    majorsubsystemversion: int = field(default_factory=int)
    minorimageversion: int = field(default_factory=int)
    minorlinkerversion: int = field(default_factory=int)
    minoroperatingsystemversion: int = field(default_factory=int)
    minorsubsystemversion: int = field(default_factory=int)
    numberofrvaandsizes: int = field(default_factory=int)
    reserved1: int = field(default_factory=int)
    sectionalignment: int = field(default_factory=int)
    sizeofcode: int = field(default_factory=int)
    sizeofheaders: int = field(default_factory=int)
    sizeofheapcommit: int = field(default_factory=int)
    sizeofheapreserve: int = field(default_factory=int)
    sizeofimage: int = field(default_factory=int)
    sizeofinitializeddata: int = field(default_factory=int)
    sizeofstackcommit: int = field(default_factory=int)
    sizeofstackreserve: int = field(default_factory=int)
    sizeofuninitializeddata: int = field(default_factory=int)
    subsystem: int = field(default_factory=int)
    name: str = field(default_factory=str)


@dataclass_json
@dataclass
class PayloadFile:
    file_name: str = field(default_factory=str)
    file_size: int = field(default_factory=int)
    file_type: str = field(default_factory=str)
    timestamp: str = field(default_factory=str)
    entropy: float = field(default_factory=float)
    sha256: str = field(default_factory=str)
    tlsh: str = field(default_factory=str)
    architecture: str = field(default_factory=str)
    signed: bool = field(default_factory=bool)
    internal_name: str = field(default_factory=str)
    sections: list[BinarySection] = field(default_factory=list)
    imports: list[BinaryImportExport] = field(default_factory=list)
    exports: list[BinaryImportExport] = field(default_factory=list)
    functions: list[BinaryFunction] = field(default_factory=list)
    strings: list[BinaryString] = field(default_factory=list)
    entrypoint: list[BinaryEntrypoint] = field(default_factory=list)
    certificates: list[Certificate] = field(default_factory=list)
    optional_headers: BinaryOptionalHeaders = field(
        default_factory=BinaryOptionalHeaders
    )
    compilers: list[DetectItEasy] = field(default_factory=list)
    libraries: list[DetectItEasy] = field(default_factory=list)
    linkers: list[DetectItEasy] = field(default_factory=list)
    packers: list[DetectItEasy] = field(default_factory=list)
    sign_tools: list[DetectItEasy] = field(default_factory=list)
    tools: list[DetectItEasy] = field(default_factory=list)
    strings_file_path: str = field(default_factory=str)

    def __post_init__(self):
        if self.certificates:
            self.signed = True

        if self.sha256:
            p = Path.home()

            strings_dir = p / ".citadel" / "strings"

            strings_dir.mkdir(parents=True, exist_ok=True)

            self.strings_file_path = str(strings_dir / f"{self.sha256}.json")
