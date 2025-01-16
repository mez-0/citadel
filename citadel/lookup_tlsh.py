import asyncio
import sys

import tlsh
from motor.motor_asyncio import AsyncIOMotorClient

from citadel import logger


async def find_similar_hashes(input_tlsh: str, max_distance: int = 50) -> list:
    """
    find_similar_hashes searches the MongoDB database for similar TLSH hashes

    :param input_tlsh: the TLSH hash to search for
    :type input_tlsh: str
    :param max_distance: distance between hashes, defaults to 50
    :type max_distance: int, optional
    :return: list of similar hashes
    :rtype: list
    """

    client = AsyncIOMotorClient("mongodb://localhost:27017")

    db = client.citadel

    tlsh_collection = db.tlsh

    cursor = tlsh_collection.find()
    similar_hashes = []

    async for record in cursor:
        for db_tlsh, db_sha256 in record.items():
            if db_tlsh == "_id":
                continue

            try:
                distance = tlsh.diff(input_tlsh, db_tlsh)
                if distance <= max_distance:
                    similar_hashes.append(
                        {"tlsh": db_tlsh, "sha256": db_sha256, "distance": distance}
                    )
            except ValueError:
                logger.warning(f"Skipping invalid TLSH: {db_tlsh}")

    if similar_hashes:
        similar_hashes.sort(key=lambda x: x["distance"])

    return similar_hashes


def report_tlsh_similarities(results: list) -> None:
    """
    report the similar hashes found

    :param results: hashes found
    :type results: list
    """

    if not results:
        logger.info("No similar hashes found")
        return

    logger.info(f"Found {len(results)} similar hashes:", indent=1)

    print_cap = 20

    if len(results) > print_cap:
        logger.info(f"Printing first {print_cap} results", indent=2)
        results = results[:print_cap]

    for result in results:
        distance_colour = get_distance_colour(result["distance"])

        logger.info(
            f"[bold {distance_colour}] TLSH: {result['tlsh']}, SHA256: {result['sha256']}, Distance: {result['distance']}",
            indent=2,
        )


def get_distance_colour(distance: int, input_distance: int = 50) -> str:
    """
    get_distance_colour returns a colour based on the distance between hashes

    :param distance: distance between hashes
    :type distance: int
    :param input_distance: the input distance, defaults to 50
    :type input_distance: int, optional
    :return: colour
    :rtype: str
    """

    if distance == 0:
        return "bright_red"
    elif distance <= input_distance / 2:
        return "dark_orange3"
    else:
        return "bright_yellow"
