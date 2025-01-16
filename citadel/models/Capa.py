from dataclasses import dataclass, field

from dataclasses_json import dataclass_json


@dataclass_json
@dataclass
class MitreTechnique:
    parts: list = field(default_factory=list)
    tactic: str = field(default_factory=str)
    technique: str = field(default_factory=str)
    subtechnique: str = field(default_factory=str)
    tid: str = field(default_factory=str)


@dataclass_json
@dataclass
class MalwareBehaviourCatalog:
    parts: list = field(default_factory=list)
    objective: str = field(default_factory=str)
    behavior: str = field(default_factory=str)
    method: str = field(default_factory=str)
    mid: str = field(default_factory=str)


@dataclass_json
@dataclass
class CapaReport:
    name: str = field(default_factory=str)
    namespace: str = field(default_factory=str)
    description: str = field(default_factory=str)
    mitre_techniques: list[MitreTechnique] = field(default_factory=list[MitreTechnique])
    malware_behaviour_catalogs: list[MalwareBehaviourCatalog] = field(
        default_factory=list[MalwareBehaviourCatalog]
    )
    references: list = field(default_factory=list)
    rule: str = field(default_factory=str)
