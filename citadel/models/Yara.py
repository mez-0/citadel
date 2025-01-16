from dataclasses import dataclass, field

from dataclasses_json import dataclass_json


@dataclass_json
@dataclass
class Yara:
    name: str = field(default_factory=str)
    description: str = field(default_factory=str)
    author: str = field(default_factory=str)
    reference: str = field(default_factory=str)
    date: str = field(default_factory=str)
    rule_id: str = field(default_factory=str)
    strings: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
