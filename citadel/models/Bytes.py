from dataclasses import dataclass, field

from dataclasses_json import dataclass_json


@dataclass_json
@dataclass
class Bytes:
    base64_bytes: str = field(default_factory=str)
    ascii_byte_representation: str = field(default_factory=str)
    entropy: float = field(default_factory=float)
