#!/bin/bash
# Regenerate levels 1-3 with the new 100-column right-side extension.
# The generator internally adds 100 columns to the requested width.
set -e

for L in 1 2 3; do
  case $L in
    1) WIDTH=82; HEIGHT=34; BUNKERS=0; FUEL=0 ;;
    2) WIDTH=82; HEIGHT=50; BUNKERS=0; FUEL=1 ;;
    3) WIDTH=82; HEIGHT=72; BUNKERS=0; FUEL=2 ;;
  esac
  SEED=$((${L} * 1000))

  echo "=== Generating level $L: ${WIDTH}x${HEIGHT}, bunkers=$BUNKERS, fuel=$FUEL, seed=$SEED ==="
  node public/level-editor/level-generator.js \
    --output public/levelpacks/default/level${L}.def \
    --seed $SEED \
    --width $WIDTH \
    --height $HEIGHT \
    --bunkers $BUNKERS \
    --fuel $FUEL \
    --reject-warnings
done

echo "=== Validating levels 1-3 ==="
for L in 1 2 3; do
  node src/levels/level-validator.js public/levelpacks/default/level${L}.def
done

echo "=== Done ==="
