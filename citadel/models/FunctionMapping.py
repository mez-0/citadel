from dataclasses import dataclass, field

from dataclasses_json import dataclass_json


@dataclass_json
@dataclass
class FunctionMapping:
    dll: str = field(default_factory=str)
    function: str = field(default_factory=str)
    description: str = field(default_factory=str)
    category: str = field(default_factory=str)
