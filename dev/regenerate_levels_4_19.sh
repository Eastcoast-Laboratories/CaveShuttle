#!/bin/bash
# Regenerate default levels 4-19 with progressive difficulty.
# The generator internally adds 100 columns to the requested width.
# Width rises from 50 (level 4) to 82 (level 19) base, yielding 150 -> 182.
# Height rises from 120 to 270.
# Bunker and fuel counts are exact targets and rise slowly.
set -e

for L in $(seq 4 19); do
  WIDTH=$(node -e "process.stdout.write(String(50 + Math.round((${L} - 4) * (82 - 50) / 15)))")
  HEIGHT=$(node -e "process.stdout.write(String(120 + (${L} - 4) * 10))")
  BUNKERS=$(node -e "process.stdout.write(String(Math.min(${L} - 2, 10)))")
  if [ "$L" -eq 4 ]; then
    FUEL=2
  else
    FUEL=$(node -e "process.stdout.write(String(Math.min(3 + Math.floor((${L} - 4) / 2), 8)))")
  fi
  SEED=$((${L} * 1000))

  echo "=== Generating level $L: ${WIDTH}x${HEIGHT}, bunkers=$BUNKERS, fuel=$FUEL, seed=$SEED ==="
  node public/level-editor/level-generator.js \
    --output public/levelpacks/default/level${L}.def \
    --seed $SEED \
    --width $WIDTH \
    --height $HEIGHT \
    --bunkers $BUNKERS \
    --fuel $FUEL \
    --require-door \
    --reject-warnings
done

echo "=== Validating levels 4-19 ==="
for L in $(seq 4 19); do
  node src/levels/level-validator.js public/levelpacks/default/level${L}.def
done

echo "=== Done ==="
