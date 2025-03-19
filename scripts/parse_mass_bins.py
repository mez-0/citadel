import argparse
import concurrent.futures
import time
from pathlib import Path
from threading import Lock

from citadel import logger
from citadel.pe.parser import get_all_payload_ifo


def batch_process_files(directory, batch_size=1000):
    files = directory.glob("**/*")

    batch = []

    for file in files:
        if not file.is_file():
            continue

        batch.append(file)

        if len(batch) == batch_size:
            yield batch

            batch = []

    if batch:
        yield batch


def process_file(file, output_file, lock):
    pe_object = get_all_payload_ifo(str(file), ignore_functions=True, no_logging=True)
    if pe_object:
        result = pe_object.to_json()
        with lock:
            with output_file.open("a") as f:
                f.write(result + "\n")
        return result
    return None


def main():
    parser = argparse.ArgumentParser(description="Parse malware files")

    parser.add_argument(
        "-d",
        "--directory",
        type=str,
        help="Directory containing malware files",
        required=True,
    )
    parser.add_argument(
        "-b",
        "--batch-size",
        type=int,
        help="Batch size for processing files",
        default=1000,
    )
    parser.add_argument("-o", "--output", type=str, help="Output file", required=True)
    parser.add_argument(
        "-t",
        "--threads",
        type=int,
        help="Number of threads for processing files",
        default=4,
    )

    args = parser.parse_args()

    start_time = time.time()

    logger.info(f"Start Time: {time.ctime(start_time)}")

    directory = Path(args.directory)
    output_file = Path(args.output)

    lock = Lock()

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.threads) as executor:
        for batch in batch_process_files(directory, args.batch_size):
            futures = [
                executor.submit(process_file, file, output_file, lock) for file in batch
            ]
            concurrent.futures.wait(futures)

    end_time = time.time()

    logger.info(f"End Time: {time.ctime(end_time)}")

    execution_time = end_time - start_time

    logger.info(f"Execution time: {execution_time:.2f} seconds")


if __name__ == "__main__":
    main()
