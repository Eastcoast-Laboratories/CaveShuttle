import fontforge
import sys

src = sys.argv[1]
dst = sys.argv[2]

font = fontforge.open(src)

# Fix PostScript name
font.fontname = "CommodoreRoundedThin"
font.familyname = "Commodore 64 Rounded Thin"
font.fullname = "Commodore 64 Rounded Thin"

for glyph in font.glyphs():
    try:
        # Negative weight change thins the strokes
        glyph.changeWeight(-25, 'auto', 0, 0, 'auto')
    except Exception as e:
        print(f"Skipping glyph {glyph.glyphname}: {e}")
        continue

font.generate(dst)
font.close()
print(f"Done: {dst}")
