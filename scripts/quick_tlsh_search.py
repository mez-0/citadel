import argparse
import asyncio

from citadel import logger
from citadel.lookup_tlsh import find_similar_hashes, report_tlsh_similarities


async def main():

    parser = argparse.ArgumentParser(description="Search for similar TLSH hashes")

    parser.add_argument("tlsh", help="TLSH hash to search for")

    parser.add_argument(
        "-d", "--distance", type=int, default=50, help="Maximum distance between hashes"
    )

    args = parser.parse_args()

    results = await find_similar_hashes(args.tlsh, max_distance=args.distance)

    if not results:
        logger.info("No similar hashes found")
        return

    report_tlsh_similarities(results)


if __name__ == "__main__":
    asyncio.run(main())
