from dataclasses import dataclass, field

from dataclasses_json import dataclass_json


@dataclass_json
@dataclass
class DetectItEasy:
    info: str = field(default_factory=str)
    name: str = field(default_factory=str)
    string: str = field(default_factory=str)
    type: str = field(default_factory=str)
    version: str = field(default_factory=str)
