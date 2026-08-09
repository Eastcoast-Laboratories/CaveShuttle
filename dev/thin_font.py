# Creates a thin variant of the Commodore 64 Rounded font by applying
# a negative weight change to all glyphs using FontForge.
#
# Requirements: FontForge must be installed (apt install fontforge)
#
# Usage:
#   fontforge -script thin_font.py "../public/fonts/Commodore Rounded v1.2.ttf" "Commodore Rounded Thin75 v1.2.ttf"
#
# The output font has familyname "Commodore 64 Rounded Thin75" and
# is referenced in CSS as font-family: "Commodore 64 Thin75"
# (see src/ui/cave-theme.css @font-face declaration).

import fontforge
import sys

src = sys.argv[1]
dst = sys.argv[2]

font = fontforge.open(src)

# Fix PostScript name
font.fontname = "CommodoreRoundedThin75"
font.familyname = "Commodore 64 Rounded Thin75"
font.fullname = "Commodore 64 Rounded Thin75"

for glyph in font.glyphs():
    try:
        # Negative weight change thins the strokes
        glyph.changeWeight(-75, 'auto', 0, 0, 'auto')
    except Exception as e:
        print(f"Skipping glyph {glyph.glyphname}: {e}")
        continue

font.generate(dst)
font.close()
print(f"Done: {dst}")
