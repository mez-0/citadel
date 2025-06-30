import argparse
import json

from citadel.ember import analyse_file_with_ember


def main():
    parser = argparse.ArgumentParser(description="Predict the file type of a file")
    parser.add_argument("file", type=str, help="The file to predict")
    args = parser.parse_args()

    result = analyse_file_with_ember(args.file)
    print(json.dumps(result.to_dict(), indent=4))


main()
