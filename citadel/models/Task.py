import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import IntEnum

from dataclasses_json import dataclass_json

from citadel.models.Bytes import Bytes
from citadel.models.Capa import CapaReport
from citadel.models.EmberResult import EmberResult
from citadel.models.FunctionMapping import FunctionMapping
from citadel.models.Yara import Yara

STRING_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"


class TASK_STATUS(IntEnum):
    PENDING = 1
    IN_PROGRESS = 2
    COMPLETED = 3
    FAILED = 4

    def __str__(self) -> str:
        return self.name.lower()


def get_random_uuid() -> str:
    """
    generate a random uuid

    :return: a random uuid
    :rtype: str
    """

    return str(uuid.uuid4())


@dataclass_json
@dataclass
class Task:
    """uuid representing the task"""

    uuid: str = field(default_factory=get_random_uuid)

    """status of the task"""
    task_status: str = field(default=TASK_STATUS.PENDING.name)

    """time the task was sent"""
    time_sent: int = field(default_factory=int)

    """time sent in %Y-%m-%dT%H:%M:%S.%fZ"""
    time_sent_str: str = field(default_factory=str)

    """time updated in %Y-%m-%dT%H:%M:%S.%fZ"""
    time_updated_str: str = field(default_factory=str)

    """time the task was updated"""
    time_updated: int = field(default_factory=int)

    """sha256 hash of the file"""
    file_sha256: str = field(default_factory=str)

    """name of the file"""
    file_name: str = field(default_factory=str)

    """whether to enable static analysis"""
    enable_static_analysis: bool = field(default=True)

    """whether to enable dynamic analysis"""
    enable_dynamic_analysis: bool = field(default=False)

    """whether to double down on scanning"""
    enable_thorough_defender: bool = field(default=False)

    """the amsi result"""
    amsi_result: str = field(default_factory=str)

    """the defender result"""
    defender_result: str = field(default_factory=str)

    """list of threats"""
    threat_names: list = field(default_factory=list)

    """this is the byte range from 0 -> DETECTION_POINT"""
    zero_x_malicious_bytes: Bytes = field(default_factory=Bytes)

    """this is the byte range from CHUNK_SIZE - DETECTION_POINT"""
    x_y_malicious_bytes: Bytes = field(default_factory=Bytes)

    """a list of all matching sections"""
    thorough_malicious_bytes: list[Bytes] = field(default_factory=list[Bytes])

    """function mappings to groups"""
    function_mappings: list[FunctionMapping] = field(
        default_factory=list[FunctionMapping]
    )

    """all the capa reports"""
    capa_reports: list[CapaReport] = field(default_factory=list[CapaReport])

    """similar hashes"""
    similar_tlsh_hashes: list[dict] = field(default_factory=list[dict])

    """the yara matches"""
    yara_matches: list[Yara] = field(default_factory=list[Yara])

    """the ember result"""
    ember_result: EmberResult = field(default_factory=EmberResult)

    def __post_init__(self):
        if self.time_sent:
            self.time_sent_str = epoch_to_utc_string(self.time_sent)

        if self.time_updated:
            self.time_updated_str = epoch_to_utc_string(self.time_updated)


def epoch_to_utc_string(epoch):
    # Convert the epoch time to a timezone-aware datetime object in UTC
    dt = datetime.fromtimestamp(epoch, tz=timezone.utc)

    # Format the datetime object to the specified string format
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond:06d}Z"
