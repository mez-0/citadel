from dataclasses import dataclass, field

import motor.motor_asyncio
from dataclasses_json import dataclass_json
from pymongo import collection

from citadel import logger
from citadel.enums import COLLECTION_MAPPINGS, MONGO_COLLECTIONS


@dataclass_json
@dataclass
class DatabaseResponse:
    """
    a response from the database
    """

    amount_inserted: int = field(default_factory=int)
    """the amount of objects added"""

    amount_updated: int = field(default_factory=int)
    """the amount of objects updated"""

    amount_deleted: int = field(default_factory=int)
    """the amount of objects deleted"""

    message: str = field(default_factory=str)
    """any messages from the database"""

    inserted_objects: list[object] = field(default_factory=list)
    """the objects added"""

    updated_objects: list[object] = field(default_factory=list)
    """the objects updated"""

    deleted_objects: list[object] = field(default_factory=list)
    """the objects deleted"""


class CitadelDatabaseApi:
    def __init__(
        self,
        mongo_user: str = "",
        mongo_password: str = "",
        mongo_host: str = "127.0.0.1",
        debug: bool = False,
    ) -> None:
        """

        initial the mongodb client

        :param mongo_user: the user to auth with, defaults to ""
        :type mongo_user: str, optional
        :param mongo_password: the password to auth with, defaults to ""
        :type mongo_password: str, optional
        :param mongo_host: where to auth, defaults to "127.0.0.1"
        :type mongo_host: str, optional
        :param debug: if debugging is enabled, defaults to False
        :type debug: bool, optional
        """

        self.debug = debug

        self.mongo_user = mongo_user
        self.mongo_password = mongo_password
        self.mongo_host = mongo_host

        if self.mongo_user and self.mongo_password:
            self.mongo_uri = (
                f"mongodb://{self.mongo_user}:{self.mongo_password}@{mongo_host}:27017/"
            )
        else:
            self.mongo_uri = f"mongodb://{mongo_host}:27017/"

        self.client = motor.motor_asyncio.AsyncIOMotorClient(self.mongo_uri)

        self.db = self.client.citadel

    async def status_check(self) -> bool:
        """
        check if the db is online

        :return: return True if the db is online, False otherwise
        :rtype: bool
        """

        return await self.db.command("ping") == {"ok": 1.0}

    async def get_all_objects(
        self,
        collections: MONGO_COLLECTIONS,
    ) -> list[object]:
        """

        get all the objects from the database

        :param collections: the collection to get from
        :type collections: MONGO_COLLECTIONS
        :raises ValueError: raises a value error if the collection is invalid
        :return: returns a list of all the objects
        :rtype: list[object]
        """

        db_collection = await self.get_collection(collections)

        logger.debug(f"Collection: {db_collection}", self.debug)

        if db_collection == None:
            raise ValueError("Invalid collection")

        logger.debug("Getting object type", self.debug)

        object_type = await self.get_object_type(collections)

        logger.debug(f"Object type: {object_type}", self.debug)

        if object_type == None:
            raise ValueError("Invalid collection")

        documents = await db_collection.find().to_list(length=None)

        if not documents:
            return []

        objects = []

        # for every object found in json format
        for doc in documents:

            # convert it back
            o = object_type.from_dict(doc)

            # now we can append it to the list
            objects.append(o)

        return objects

    async def get_object_by_uuid(
        self, uuid: str, collections: MONGO_COLLECTIONS
    ) -> object:
        """

        get an object by its uuid

        :param uuid: the uuid to get
        :type uuid: str
        :param collections: the collection to get from
        :type collections: MONGO_COLLECTIONS
        :return: the object found
        :rtype: object
        """

        logger.debug(f"Getting object by uuid: {uuid}", self.debug)

        db_collection = await self.get_collection(collections)

        logger.debug(f"Collection: {db_collection}", self.debug)

        if db_collection == None:
            raise ValueError("Invalid collection")

        logger.debug("Getting object type", self.debug)

        object_Type = await self.get_object_type(collections)

        logger.debug(f"Object type: {object_Type}", self.debug)

        if object_Type == None:
            raise ValueError("Invalid collection")

        found_object = await db_collection.find_one({"uuid": uuid})

        if found_object:
            return object_Type.from_dict(found_object)
        else:
            return None

    async def add_singular_object_to_db(
        self,
        new_object: object,
        collections: MONGO_COLLECTIONS,
    ) -> DatabaseResponse:
        """
        add an object to the database

        :param new_object: object to add
        :type new_object: object
        :param collections: where to add the object
        :type collections: MONGO_COLLECTIONS
        :return: a response from the database
        :rtype: DatabaseResponse
        """

        logger.debug(
            f"Adding 1 object to {str(collections).lower()}",
            self.debug,
        )

        database_response = DatabaseResponse()

        database_response.amount_inserted = await self.do_insertion(
            [new_object], collections
        )

        return database_response

    async def update_singular_object_in_db(
        self,
        updated_object: object,
        collections: MONGO_COLLECTIONS,
    ) -> DatabaseResponse:
        """
        update an object in the database

        :param updated_object: object to update
        :type updated_object: object
        :param collections: where to update the object
        :type collections: MONGO_COLLECTIONS
        :return: a response from the database
        :rtype: DatabaseResponse
        """

        logger.debug(
            f"Updating 1 object in {str(collections).lower()}",
            self.debug,
        )

        database_response = DatabaseResponse()

        database_response.amount_updated = await self.do_update(
            [updated_object], collections
        )

        return database_response

    async def get_completed_tasks(self, collections: MONGO_COLLECTIONS) -> list[object]:
        """
        get all completed tasks

        :param collections: the collection to get from
        :type collections: MONGO_COLLECTIONS
        :return: a list of all completed tasks
        :rtype: list[object]
        """

        db_collection = await self.get_collection(collections)

        logger.debug(f"Collection: {db_collection}", self.debug)

        if db_collection == None:
            raise ValueError("Invalid collection")

        logger.debug("Getting object type", self.debug)

        object_type = await self.get_object_type(collections)

        logger.debug(f"Object type: {object_type}", self.debug)

        if object_type == None:
            raise ValueError("Invalid collection")

        documents = await db_collection.find({"task_status": "COMPLETED"}).to_list(
            length=None
        )

        if not documents:
            return []

        objects = []

        # for every object found in json format
        for doc in documents:

            # convert it back
            o = object_type.from_dict(doc)

            # now we can append it to the list
            objects.append(o)

        return objects

    async def get_payload_by_sha256(self, sha256: str) -> object:
        """
        get a payload by its sha256

        :param sha256: the sha256 to get
        :type sha256: str
        :return: the payload found
        :rtype: object
        """

        logger.debug(f"Getting payload by sha256: {sha256}", self.debug)

        db_collection = await self.get_collection(MONGO_COLLECTIONS.PAYLOADS)

        logger.debug(f"Collection: {db_collection}", self.debug)

        if db_collection == None:
            raise ValueError("Invalid collection")

        logger.debug("Getting object type", self.debug)

        object_type = await self.get_object_type(MONGO_COLLECTIONS.PAYLOADS)

        logger.debug(f"Object type: {object_type}", self.debug)

        if object_type == None:
            raise ValueError("Invalid collection")

        found_object = await db_collection.find_one({"sha256": sha256})

        if found_object:
            return object_type.from_dict(found_object)
        else:
            return None

    async def get_collection(
        self, collections: MONGO_COLLECTIONS
    ) -> collection.Collection:
        """
        determine which collection to get

        :param collections: the enum to get the collection from
        :type collections: MONGO_COLLECTIONS
        :return: a collection
        :rtype: pymongo.collection.Collection
        """

        # for every collection available
        for available_collection in MONGO_COLLECTIONS:
            # see if the input collection matches
            if collections == available_collection:
                # if it does, then get the collection from the database
                name = str(collections).lower()

                logger.debug(f"Found collection: {name}", self.debug)

                # return the collection
                return self.db[name]
        else:
            logger.warning(
                f"Invalid collection '{collections}' whilst getting collection"
            )
            return None

    async def get_object_type(self, collections: MONGO_COLLECTIONS) -> object:
        """
        from the collection, get the object mapping

        :param collections: collection to get the object type from
        :type collections: MONGO_COLLECTIONS
        :raises ValueError: raises a value error if the collection is invalid
        :return: the object type
        :rtype: object
        """

        if collections in COLLECTION_MAPPINGS:
            logger.debug(
                f"Found object type: {COLLECTION_MAPPINGS[collections]}", self.debug
            )
            return COLLECTION_MAPPINGS[collections]
        else:
            raise ValueError(
                f"Invalid collection '{collections}' whilst getting object type"
            )

    async def do_insertion(
        self, inserts: list[object], collections: MONGO_COLLECTIONS
    ) -> int:
        """
        insert into the database

        :param inserts: the objects to insert
        :type inserts: list[object]
        :param collections: collection to insert into
        :type collections: MONGO_COLLECTIONS
        :raises ValueError: the collection is invalid
        :return: amount inserted
        :rtype: int
        """

        logger.debug(
            f"Inserting {len(inserts)} objects into {str(collections).lower()}",
            self.debug,
        )

        db_collection = await self.get_collection(collections)

        if db_collection == None:
            raise ValueError(f"Invalid collection '{collections}'")

        try:
            amount_inserted = 0

            insertions = await db_collection.insert_many([p.to_dict() for p in inserts])

            amount_inserted += len(insertions.inserted_ids)

            return amount_inserted

        except Exception as e:
            logger.bad(f"Failed to insert into {collections} database: {e}")
            return 0

    async def do_update(
        self, updates: list[object], collections: MONGO_COLLECTIONS
    ) -> int:
        """
        update the database

        :param updates: the objects to update
        :type updates: list[object]
        :param collections: collection to update
        :type collections: MONGO_COLLECTIONS
        :raises ValueError: the collection is invalid
        :return: amount updated
        :rtype: int
        """

        logger.debug(
            f"Updating {len(updates)} objects in {str(collections).lower()}",
            self.debug,
        )

        db_collection = await self.get_collection(collections)

        if db_collection == None:
            raise ValueError(f"Invalid collection '{collections}'")

        try:
            amount_updated = 0

            for update in updates:
                await db_collection.update_one(
                    {"uuid": update.uuid}, {"$set": update.to_dict()}
                )

                amount_updated += 1

            return amount_updated

        except Exception as e:
            logger.bad(f"Failed to update {collections} database: {e}")
            return 0
