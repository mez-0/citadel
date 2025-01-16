import asyncio
import json

import motor.motor_asyncio


async def upload_tlsh_map():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")

    db = client.citadel

    tlsh_collection = db.tlsh

    with open("tlsh_sha256_map.jsonl") as f:
        for line in f:
            line = line.strip()
            tlsh_sha256_map = json.loads(line)
            await tlsh_collection.insert_one(tlsh_sha256_map)


if __name__ == "__main__":
    asyncio.run(upload_tlsh_map())
