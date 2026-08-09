#!/usr/bin/env python3
"""Generate a classic 4-6 style level for CaveShuttle.

Design: winding cave from top (* in sky) to bottom (pod holder m).
Sections:
  1. Sky + qr slope entry (rows 0-26)
  2. uv slope with bunker + flat corridor (rows 27-40)
  3. Reactor niche with P bunker guard + fuel (rows 41-55)
  4. wx slope with \ bunker + checkpoint (rows 56-68)
  5. Door passage with button (rows 69-78)
  6. st slope with U bunker + fuel niches (rows 79-90)
  7. qr slope + narrow shaft to pod holder (rows 91-105)
  8. Bedrock floor (rows 106-119)
"""

WIDTH = 82
HEIGHT = 120

HEADER = [
    "82",
    str(HEIGHT),
    "17",
    "5",
    "25",
    "  0  84 164 ; background/tractor (wall color)",
    "164   0   0 ; gun/reactor/stand (bunker color)",
    "  0 164   0 ; pod/blip (pod color)",
    "  0 164 164 ; text (text color)",
    "164  84  84 ; shield (shield color)",
]


def make_row():
    return list('p' * WIDTH)


def set_range(row, start, end, ch):
    for i in range(start, end):
        if 0 <= i < WIDTH:
            row[i] = ch


def set_char(row, col, ch):
    if 0 <= col < WIDTH:
        row[col] = ch


def row_to_str(row):
    return ''.join(row)


# Pre-allocate all rows as solid wall
rows = [make_row() for _ in range(HEIGHT)]

# Helper: set a horizontal corridor segment
def corridor(r, left_wall_end, right_wall_start):
    """Set row r: p [0..left_wall_end), space [left_wall_end..right_wall_start), p [right_wall_start..WIDTH)"""
    set_range(rows[r], 0, left_wall_end, 'p')
    set_range(rows[r], left_wall_end, right_wall_start, ' ')
    set_range(rows[r], right_wall_start, WIDTH, 'p')


# ============================================================
# SECTION 1: Sky + qr slope entry (rows 0-26)
# ============================================================
# Sky: rows 0-16 all open
for r in range(17):
    rows[r] = list(' ' * WIDTH)
set_char(rows[14], 23, '*')

# qr slope descending right: rows 17-22
# qr shifts 2 cols right per row. Rock on left, open on right.
qr_start = 11
for i in range(6):
    r = 17 + i
    c = qr_start + i * 2
    set_range(rows[r], 0, c, 'p')
    set_char(rows[r], c, 'q')
    set_char(rows[r], c + 1, 'r')
    set_range(rows[r], c + 2, 62, ' ')
    set_range(rows[r], 62, WIDTH, 'p')

# Flat corridor: rows 23-26
for r in range(23, 27):
    corridor(r, 23, 62)

# Fuel depot 1: niche in right wall at cols 62-63, rows 24-25
# Backtick and a are on row 24, b and c on row 25, p floor at row 26
set_char(rows[24], 62, '`')
set_char(rows[24], 63, 'a')
set_char(rows[25], 62, 'b')
set_char(rows[25], 63, 'c')

# ============================================================
# SECTION 2: uv slope with bunker + flat corridor (rows 27-40)
# ============================================================
# uv slope: shifts 2 cols LEFT per row. Rock on LEFT, open on RIGHT.
# Start uv at col 58, go down to col 48
for i in range(5):
    r = 27 + i
    c = 58 - i * 2
    set_range(rows[r], 0, c, 'p')
    set_char(rows[r], c, 'u')
    set_char(rows[r], c + 1, 'v')
    set_range(rows[r], c + 2, 62, ' ')
    set_range(rows[r], 62, WIDTH, 'p')

# Bunker [ at end of uv slope, row 32: open space on right
r = 32
c = 58 - 5 * 2  # = 48
set_range(rows[r], 0, c, 'p')
set_char(rows[r], c, 'u')
set_char(rows[r], c + 1, 'v')
set_char(rows[r], c + 2, '[')
set_range(rows[r], c + 3, 62, ' ')
set_range(rows[r], 62, WIDTH, 'p')

# XYZ below bunker, row 33
r = 33
set_range(rows[r], 0, c, 'p')
set_char(rows[r], c, 'X')
set_char(rows[r], c + 1, 'Y')
set_char(rows[r], c + 2, 'Z')
set_range(rows[r], c + 3, 62, ' ')
set_range(rows[r], 62, WIDTH, 'p')

# Flat corridor: rows 34-40
for r in range(34, 41):
    corridor(r, 23, 62)

# Fuel depot 2: niche in right wall at cols 62-63, rows 36-37
set_char(rows[36], 62, '`')
set_char(rows[36], 63, 'a')
set_char(rows[37], 62, 'b')
set_char(rows[37], 63, 'c')

# ============================================================
# SECTION 3: Reactor niche with P bunker guard (rows 41-55)
# ============================================================
# qr slope descending right with PQR bunker, rows 41-43
# qrPQR at row 41, ppqrS at row 42, ppppqr at row 43
r = 41
corridor(r, 23, 62)
set_char(rows[r], 23, 'q')
set_char(rows[r], 24, 'r')
set_char(rows[r], 25, 'P')
set_char(rows[r], 26, 'Q')
set_char(rows[r], 27, 'R')

r = 42
corridor(r, 23, 62)
set_char(rows[r], 23, 'p')
set_char(rows[r], 24, 'p')
set_char(rows[r], 25, 'q')
set_char(rows[r], 26, 'r')
set_char(rows[r], 27, 'S')

r = 43
corridor(r, 23, 62)
set_char(rows[r], 23, 'p')
set_char(rows[r], 24, 'p')
set_char(rows[r], 25, 'p')
set_char(rows[r], 26, 'p')
set_char(rows[r], 27, 'q')
set_char(rows[r], 28, 'r')

# Reactor in left niche: rows 45-47, cols 6-8
# Open the niche from the corridor (col 23) leftward to col 6
# Row 44: narrow opening from corridor to reactor niche
r = 44
set_range(rows[r], 0, 5, 'p')
set_range(rows[r], 5, 23, ' ')   # open passage to reactor
set_range(rows[r], 23, 62, ' ')  # main corridor
set_range(rows[r], 62, WIDTH, 'p')

for r in range(45, 48):
    set_range(rows[r], 0, 5, 'p')
    if r == 45:
        set_char(rows[r], 6, 'd')
        set_char(rows[r], 7, 'e')
        set_char(rows[r], 8, 'f')
    elif r == 46:
        set_char(rows[r], 6, 'g')
        set_char(rows[r], 7, 'h')
        set_char(rows[r], 8, 'i')
    else:
        set_char(rows[r], 6, 'j')
        set_char(rows[r], 7, 'k')
        set_char(rows[r], 8, 'l')
    set_range(rows[r], 9, 62, ' ')
    set_range(rows[r], 62, WIDTH, 'p')

# Row 48: close reactor niche floor
r = 48
set_range(rows[r], 0, 9, 'p')
set_range(rows[r], 9, 62, ' ')
set_range(rows[r], 62, WIDTH, 'p')

# Flat corridor: rows 49-55
for r in range(49, 56):
    corridor(r, 23, 62)

# Checkpoint at row 55
set_range(rows[55], 25, 32, '#')

# ============================================================
# SECTION 4: wx slope with \ bunker + checkpoint (rows 56-68)
# ============================================================
# Row 56: corridor connecting section 3 to section 4
corridor(56, 23, 62)

# Respawn * at row 57
r = 57
corridor(r, 23, 62)
set_char(rows[r], 40, '*')

# wx slope descending right: rows 58-62
# wx shifts 2 cols right per row. Rock on RIGHT, open on LEFT.
for i in range(5):
    r = 58 + i
    c = 40 + i * 2
    set_range(rows[r], 0, 23, 'p')
    set_range(rows[r], 23, c, ' ')
    set_char(rows[r], c, 'w')
    set_char(rows[r], c + 1, 'x')
    set_range(rows[r], c + 2, WIDTH, 'p')

# \ bunker at end of wx slope, row 63
r = 63
c = 40 + 5 * 2  # = 50
set_range(rows[r], 0, 23, 'p')
set_range(rows[r], 23, c, ' ')
set_char(rows[r], c, '\\')
set_char(rows[r], c + 1, 'w')
set_char(rows[r], c + 2, 'x')
set_range(rows[r], c + 3, WIDTH, 'p')

# ]^_ below \ bunker, row 64
r = 64
set_range(rows[r], 0, 23, 'p')
set_range(rows[r], 23, c, ' ')
set_char(rows[r], c, ']')
set_char(rows[r], c + 1, '^')
set_char(rows[r], c + 2, '_')
set_char(rows[r], c + 3, 'w')
set_char(rows[r], c + 4, 'x')
set_range(rows[r], c + 5, WIDTH, 'p')

# Flat corridor: rows 65-68
for r in range(65, 69):
    corridor(r, 23, 62)

# Fuel depot 3: niche in right wall at cols 62-63, rows 66-67
set_char(rows[66], 62, '`')
set_char(rows[66], 63, 'a')
set_char(rows[67], 62, 'b')
set_char(rows[67], 63, 'c')

# ============================================================
# SECTION 5: Door passage with button (rows 69-78)
# ============================================================
# Button N on right wall, row 69
r = 69
corridor(r, 23, 62)
set_char(rows[r], 61, 'N')

# Flat corridor: rows 70-72
for r in range(70, 73):
    corridor(r, 23, 62)

# Door H...G: rows 73-75, H at col 40, G at col 47
for r in range(73, 76):
    set_range(rows[r], 0, 23, 'p')
    set_range(rows[r], 23, 40, ' ')
    set_char(rows[r], 40, 'H')
    set_range(rows[r], 41, 47, 'p')
    set_char(rows[r], 47, 'G')
    set_range(rows[r], 48, 62, ' ')
    set_range(rows[r], 62, WIDTH, 'p')

# Flat corridor: rows 76-78
for r in range(76, 79):
    corridor(r, 23, 62)

# ============================================================
# SECTION 6: st slope with U bunker + fuel (rows 79-90)
# ============================================================
# st slope descending left: rows 79-83
# st shifts 2 cols LEFT per row. Rock on RIGHT, open on LEFT.
for i in range(5):
    r = 79 + i
    c = 56 - i * 2
    set_range(rows[r], 0, 23, 'p')
    set_range(rows[r], 23, c, ' ')
    set_char(rows[r], c, 's')
    set_char(rows[r], c + 1, 't')
    set_range(rows[r], c + 2, WIDTH, 'p')

# UVWst U bunker on slope, rows 84-86
r = 84
c = 56 - 5 * 2  # = 46
set_range(rows[r], 0, 23, 'p')
set_range(rows[r], 23, c, ' ')
set_char(rows[r], c, 'U')
set_char(rows[r], c + 1, 'V')
set_char(rows[r], c + 2, 'W')
set_char(rows[r], c + 3, 's')
set_char(rows[r], c + 4, 't')
set_range(rows[r], c + 5, WIDTH, 'p')

r = 85
set_range(rows[r], 0, 23, 'p')
set_range(rows[r], 23, c, ' ')
set_char(rows[r], c, 'T')
set_char(rows[r], c + 1, 's')
set_char(rows[r], c + 2, 't')
set_range(rows[r], c + 3, WIDTH, 'p')

r = 86
set_range(rows[r], 0, 23, 'p')
set_range(rows[r], 23, c, ' ')
set_char(rows[r], c, 's')
set_char(rows[r], c + 1, 't')
set_range(rows[r], c + 2, WIDTH, 'p')

# Flat corridor: rows 87-90
for r in range(87, 91):
    corridor(r, 23, 50)

# Fuel depot 4: niche in right wall at cols 50-51, rows 88-89
set_char(rows[88], 50, '`')
set_char(rows[88], 51, 'a')
set_char(rows[89], 50, 'b')
set_char(rows[89], 51, 'c')

# ============================================================
# SECTION 7: qr slope + narrow shaft to pod holder (rows 91-105)
# ============================================================
# qr slope descending right: rows 91-95
for i in range(5):
    r = 91 + i
    c = 23 + i * 2
    set_range(rows[r], 0, c, 'p')
    set_char(rows[r], c, 'q')
    set_char(rows[r], c + 1, 'r')
    set_range(rows[r], c + 2, 50, ' ')
    set_range(rows[r], 50, WIDTH, 'p')

# Continue corridor: rows 96-98
for r in range(96, 99):
    corridor(r, 33, 50)

# Fuel depot 5: in corridor at cols 33-34, rows 96-97
set_char(rows[96], 33, '`')
set_char(rows[96], 34, 'a')
set_char(rows[97], 33, 'b')
set_char(rows[97], 34, 'c')

# Narrow vertical shaft: rows 99-102
for r in range(99, 103):
    set_range(rows[r], 0, 38, 'p')
    set_range(rows[r], 38, 44, ' ')
    set_range(rows[r], 44, WIDTH, 'p')

# Pod holder: rows 103-105
# m at col 39, 0 at col 40
r = 103
set_range(rows[r], 0, 38, 'p')
set_range(rows[r], 38, 44, ' ')
set_char(rows[r], 39, 'm')
set_char(rows[r], 40, '0')
set_range(rows[r], 41, 44, ' ')
set_range(rows[r], 44, WIDTH, 'p')

r = 104
set_range(rows[r], 0, 38, 'p')
set_range(rows[r], 38, 44, ' ')
set_char(rows[r], 39, '1')
set_char(rows[r], 40, '2')
set_range(rows[r], 41, 44, ' ')
set_range(rows[r], 44, WIDTH, 'p')

r = 105
set_range(rows[r], 0, 38, 'p')
set_range(rows[r], 38, 44, ' ')
set_char(rows[r], 39, '3')
set_char(rows[r], 40, '4')
set_range(rows[r], 41, 44, ' ')
set_range(rows[r], 44, WIDTH, 'p')

# Bedrock floor: rows 106-119 (already pre-allocated as wall)

# Write output
lines = HEADER[:]
for row in rows:
    lines.append(row_to_str(row))

with open('/var/www/Thrust/dev/level_generated_classic4to6.def', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

print(f"Generated {HEIGHT} rows, width {WIDTH}")
