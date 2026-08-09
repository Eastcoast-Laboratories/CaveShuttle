#!/bin/bash

# Script to pad level file lines with 'p' to make all rows equal length
# Usage: ./pad-level.sh <target_length> <input_file> [output_file]
# If output_file is not specified, modifies input_file in place

TARGET_LENGTH=$1
INPUT_FILE=$2
OUTPUT_FILE=${3:-$INPUT_FILE}

if [ -z "$TARGET_LENGTH" ] || [ -z "$INPUT_FILE" ]; then
    echo "Usage: $0 <target_length> <input_file> [output_file]"
    echo "Example: $0 79 level2.def level2_padded.def"
    exit 1
fi

# Create temporary file
TEMP_FILE=$(mktemp)

# Copy header lines (first 10 lines) unchanged
head -n 10 "$INPUT_FILE" > "$TEMP_FILE"

# Process layout lines (lines 11 onwards) using awk
awk -v target="$TARGET_LENGTH" '
    BEGIN { surface_found = 0 }
    NR >= 11 {
        len = length($0)
        # Detect surface: first line reaching at least target length that has a non-space character
        # at both the left edge (column 1) and the right edge (column target) - this is the loop
        # line where the tunnel wall wraps around from one side of the screen to the other.
        if (!surface_found && len >= target && substr($0, 1, 1) != " " && substr($0, target, 1) != " ") {
            surface_found = 1
        }
        if (len < target) {
            if (surface_found) {
                # At or below surface - pad with p
                padding = ""
                for (i = 0; i < target - len; i++) padding = padding "p"
                print $0 padding
            } else {
                # Above surface - pad with spaces (preserve content)
                printf "%-*s\n", target, $0
            }
        } else if (len > target) {
            # Truncate
            print substr($0, 1, target)
        } else {
            # Exact length
            print $0
        }
    }
' "$INPUT_FILE" >> "$TEMP_FILE"

# Move to output file
mv "$TEMP_FILE" "$OUTPUT_FILE"

echo "Padded $INPUT_FILE to $OUTPUT_FILE with target length $TARGET_LENGTH"
