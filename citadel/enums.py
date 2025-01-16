from enum import IntEnum

from citadel.models.PayloadFile import PayloadFile
from citadel.models.Task import Task


class MONGO_COLLECTIONS(IntEnum):
    TASKS = 1
    PAYLOADS = 2

    def __str__(self) -> str:
        return self.name.lower()


COLLECTION_MAPPINGS = {
    MONGO_COLLECTIONS.PAYLOADS: PayloadFile,
    MONGO_COLLECTIONS.TASKS: Task,
}
