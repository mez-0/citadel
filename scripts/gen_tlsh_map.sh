#!/bin/bash

if [ -z "$2" ]; then
    echo "Usage: $0 <jsonl_file> <output_file>"
    exit 1
fi

JSONL="$1"
OUTPUT_FILE="$2"

/usr/bin/cat $JSONL | jq -c 'select(.sha256 and .tlsh) | {(.tlsh): .sha256}' > $OUTPUT_FILE