from dataclasses import dataclass, field

from dataclasses_json import dataclass_json


@dataclass_json
@dataclass
class EmberResult:
    file_path: str = field(default_factory=str)
    score: float = field(default_factory=float)
    prediction: str = field(default_factory=str)
    model_name: str = field(default_factory=str)

    def __post_init__(self):
        if self.score >= 0.9:
            self.prediction = "malicious"
        elif self.score >= 0.5:
            self.prediction = "suspicious"
        else:
            self.prediction = "benign"
