#!/usr/bin/env python3
"""Generate 10 fundamentally different CaveShuttle levels for the default pack."""

import os

WIDTH = 82
HEIGHT = 120
HEADER = [
    str(WIDTH),
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

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "levelpacks", "default")


def make_rows():
    return [list("p" * WIDTH) for _ in range(HEIGHT)]


def set_char(rows, r, c, ch):
    if 0 <= r < HEIGHT and 0 <= c < WIDTH:
        rows[r][c] = ch


def set_range(rows, r, c0, c1, ch):
    for c in range(max(0, c0), min(WIDTH, c1)):
        rows[r][c] = ch


def corridor(rows, r, left_end, right_start):
    set_range(rows, r, left_end, right_start, ' ')


def vcorridor(rows, r0, r1, c0, c1):
    for r in range(max(0, r0), min(HEIGHT, r1)):
        set_range(rows, r, c0, c1, ' ')


def place_fuel(rows, r, c):
    set_char(rows, r, c, '`')
    set_char(rows, r, c + 1, 'a')
    set_char(rows, r + 1, c, 'b')
    set_char(rows, r + 1, c + 1, 'c')


def place_reactor(rows, r, c):
    set_char(rows, r, c, 'd')
    set_char(rows, r, c + 1, 'e')
    set_char(rows, r, c + 2, 'f')
    set_char(rows, r + 1, c, 'g')
    set_char(rows, r + 1, c + 1, 'h')
    set_char(rows, r + 1, c + 2, 'i')
    set_char(rows, r + 2, c, 'j')
    set_char(rows, r + 2, c + 1, 'k')
    set_char(rows, r + 2, c + 2, 'l')


def place_pod(rows, r, c):
    set_char(rows, r, c, 'm')
    set_char(rows, r, c + 1, '0')
    set_char(rows, r + 1, c, '1')
    set_char(rows, r + 1, c + 1, '2')
    set_char(rows, r + 2, c, '3')
    set_char(rows, r + 2, c + 1, '4')


def place_door_row(rows, r, hc, gc):
    set_char(rows, r, hc, 'H')
    set_char(rows, r, gc, 'G')
    for c in range(hc + 1, gc):
        set_char(rows, r, c, 'p')


def place_bunker_p(rows, r, c):
    """P bunker on qr slope: qrPQR / ppqrS / pppqr"""
    set_char(rows, r, c, 'q')
    set_char(rows, r, c + 1, 'r')
    set_char(rows, r, c + 2, 'P')
    set_char(rows, r, c + 3, 'Q')
    set_char(rows, r, c + 4, 'R')
    set_char(rows, r + 1, c + 2, 'p')
    set_char(rows, r + 1, c + 3, 'q')
    set_char(rows, r + 1, c + 4, 'r')
    set_char(rows, r + 1, c + 5, 'S')
    set_char(rows, r + 2, c + 3, 'p')
    set_char(rows, r + 2, c + 4, 'q')
    set_char(rows, r + 2, c + 5, 'r')


def place_bunker_u(rows, r, c):
    """U bunker on st slope: UVWst / Tstpp / ppppp"""
    set_char(rows, r, c, 'U')
    set_char(rows, r, c + 1, 'V')
    set_char(rows, r, c + 2, 'W')
    set_char(rows, r, c + 3, 's')
    set_char(rows, r, c + 4, 't')
    set_char(rows, r + 1, c, 'T')
    set_char(rows, r + 1, c + 1, 's')
    set_char(rows, r + 1, c + 2, 't')


def place_bunker_bracket(rows, r, c):
    """[ bunker on uv slope: uv[ / XYZ"""
    set_char(rows, r, c, 'u')
    set_char(rows, r, c + 1, 'v')
    set_char(rows, r, c + 2, '[')
    set_char(rows, r + 1, c, 'X')
    set_char(rows, r + 1, c + 1, 'Y')
    set_char(rows, r + 1, c + 2, 'Z')


def place_bunker_backslash(rows, r, c):
    """\\ bunker on wx slope: \\wx / ]^_wx"""
    set_char(rows, r, c, '\\')
    set_char(rows, r, c + 1, 'w')
    set_char(rows, r, c + 2, 'x')
    set_char(rows, r + 1, c, ']')
    set_char(rows, r + 1, c + 1, '^')
    set_char(rows, r + 1, c + 2, '_')
    set_char(rows, r + 1, c + 3, 'w')
    set_char(rows, r + 1, c + 4, 'x')


def write_level(filename, rows):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, 'w') as f:
        for line in HEADER:
            f.write(line + '\n')
        for row in rows:
            f.write(''.join(row) + '\n')
    print(f"  wrote {path}")


def sky_rows(rows, top=0, bottom=17):
    for r in range(top, bottom):
        set_range(rows, r, 0, WIDTH, ' ')


# ============================================================
# Level 7: Horizontal Maze - left-to-right flow
# ============================================================
def gen_level7():
    rows = make_rows()
    sky_rows(rows, 0, 17)
    set_char(rows, 5, 10, '*')

    # Horizontal corridors at different heights connected by vertical shafts
    # Corridor 1: rows 17-24, cols 3-70
    for r in range(17, 25):
        corridor(rows, r, 3, 70)
    # Fuel 1
    place_fuel(rows, 21, 15)
    # Fuel 2
    place_fuel(rows, 21, 50)

    # Vertical shaft: cols 67-73, rows 24-34
    vcorridor(rows, 24, 35, 67, 73)

    # Corridor 2: rows 34-42, cols 5-73 (right to left)
    for r in range(34, 43):
        corridor(rows, r, 5, 73)
    # Bunker P on slope
    place_bunker_p(rows, 36, 10)
    # Fuel 3
    place_fuel(rows, 39, 55)

    # Vertical shaft: cols 5-11, rows 42-52
    vcorridor(rows, 42, 53, 5, 11)

    # Corridor 3: rows 52-60, cols 5-70
    for r in range(52, 61):
        corridor(rows, r, 5, 70)
    # Reactor niche
    place_reactor(rows, 54, 60)
    # Fuel 4
    place_fuel(rows, 57, 20)

    # Door: cols 5-70, rows 60-62 (wall-to-wall)
    for r in range(60, 63):
        place_door_row(rows, r, 5, 70)
    # Button N
    set_char(rows, 57, 68, 'N')

    # Vertical shaft: cols 65-73, rows 63-75
    vcorridor(rows, 63, 76, 65, 73)

    # Corridor 4: rows 75-83, cols 5-73
    for r in range(75, 84):
        corridor(rows, r, 5, 73)
    # Bunker U
    place_bunker_u(rows, 77, 50)
    # Fuel 5
    place_fuel(rows, 80, 10)

    # Vertical shaft: cols 5-11, rows 83-95
    vcorridor(rows, 83, 96, 5, 11)

    # Corridor 5: rows 95-103, cols 5-70
    for r in range(95, 104):
        corridor(rows, r, 5, 70)
    # Bunker bracket
    place_bunker_bracket(rows, 97, 60)

    # Pod shaft: cols 38-44, rows 103-116
    vcorridor(rows, 103, 117, 38, 44)
    place_pod(rows, 113, 39)

    # Floor
    for r in range(117, HEIGHT):
        set_range(rows, r, 0, WIDTH, 'p')

    write_level("level7.def", rows)


# ============================================================
# Level 8: Spiral Descent
# ============================================================
def gen_level8():
    rows = make_rows()
    sky_rows(rows, 0, 17)
    set_char(rows, 8, 40, '*')

    # Spiral: each "ring" is a horizontal corridor + vertical shaft
    # Ring 1: top, going right, rows 17-24, cols 10-72
    for r in range(17, 25):
        corridor(rows, r, 10, 72)
    place_fuel(rows, 21, 20)
    # Down right side: cols 68-74, rows 24-34
    vcorridor(rows, 24, 35, 68, 74)

    # Ring 2: going left, rows 34-42, cols 8-74
    for r in range(34, 43):
        corridor(rows, r, 8, 74)
    place_fuel(rows, 38, 55)
    place_bunker_p(rows, 36, 15)
    # Down left side: cols 6-12, rows 42-52
    vcorridor(rows, 42, 53, 6, 12)

    # Ring 3: going right, rows 52-60, cols 6-70
    for r in range(52, 61):
        corridor(rows, r, 6, 70)
    place_fuel(rows, 56, 30)
    place_reactor(rows, 54, 55)
    # Down right: cols 66-72, rows 60-70
    vcorridor(rows, 60, 71, 66, 72)

    # Ring 4: going left, rows 70-78, cols 6-72
    for r in range(70, 79):
        corridor(rows, r, 6, 72)
    place_fuel(rows, 74, 50)
    place_bunker_u(rows, 72, 20)
    # Door wall-to-wall
    for r in range(78, 81):
        place_door_row(rows, r, 6, 72)
    set_char(rows, 75, 70, 'N')

    # Down left: cols 6-12, rows 81-90
    vcorridor(rows, 81, 91, 6, 12)

    # Ring 5: going right, rows 90-98, cols 6-68
    for r in range(90, 99):
        corridor(rows, r, 6, 68)
    place_fuel(rows, 94, 40)
    place_bunker_backslash(rows, 92, 55)

    # Pod shaft: cols 38-44, rows 98-116
    vcorridor(rows, 98, 117, 38, 44)
    place_pod(rows, 113, 39)

    for r in range(117, HEIGHT):
        set_range(rows, r, 0, WIDTH, 'p')

    write_level("level8.def", rows)


# ============================================================
# Level 9: Twin Shafts - two parallel vertical shafts
# ============================================================
def gen_level9():
    rows = make_rows()
    sky_rows(rows, 0, 17)
    set_char(rows, 5, 20, '*')

    # Left shaft: cols 5-30, Right shaft: cols 50-75
    # Connecting tunnels at several heights

    # Top section: both shafts open
    vcorridor(rows, 17, 50, 5, 30)
    vcorridor(rows, 17, 50, 50, 75)

    # Connect tunnel 1: rows 25-28
    for r in range(25, 29):
        corridor(rows, r, 5, 75)
    place_fuel(rows, 27, 35)
    place_fuel(rows, 27, 42)

    # Close left shaft, keep right
    vcorridor(rows, 29, 45, 50, 75)
    place_bunker_bracket(rows, 30, 55)

    # Connect tunnel 2: rows 45-48
    for r in range(45, 49):
        corridor(rows, r, 5, 75)
    place_reactor(rows, 46, 10)
    place_fuel(rows, 46, 60)

    # Close right shaft, keep left
    vcorridor(rows, 49, 65, 5, 30)
    place_bunker_p(rows, 50, 20)

    # Connect tunnel 3: rows 65-68
    for r in range(65, 69):
        corridor(rows, r, 5, 75)
    place_fuel(rows, 67, 35)
    place_fuel(rows, 67, 45)

    # Door wall-to-wall
    for r in range(68, 71):
        place_door_row(rows, r, 5, 75)
    set_char(rows, 66, 73, 'N')

    # Right shaft continues
    vcorridor(rows, 71, 85, 50, 75)
    place_bunker_u(rows, 72, 55)

    # Connect tunnel 4: rows 85-88
    for r in range(85, 89):
        corridor(rows, r, 5, 75)
    place_fuel(rows, 87, 30)

    # Left shaft to pod
    vcorridor(rows, 89, 105, 5, 30)
    place_bunker_backslash(rows, 90, 15)

    # Converge to pod shaft: rows 105-116, cols 36-44
    for r in range(105, 110):
        corridor(rows, r, 5, 75)
    vcorridor(rows, 108, 117, 36, 44)
    place_pod(rows, 113, 39)

    for r in range(117, HEIGHT):
        set_range(rows, r, 0, WIDTH, 'p')

    write_level("level9.def", rows)


# ============================================================
# Level 10: Zigzag Canyon - sharp alternating slopes
# ============================================================
def gen_level10():
    rows = make_rows()
    sky_rows(rows, 0, 17)
    set_char(rows, 8, 40, '*')

    # Zigzag: qr slopes going right, then st slopes going left, repeat
    # Section 1: qr going right, rows 17-26
    for i in range(10):
        r = 17 + i
        c = 10 + i * 3
        if c + 2 < WIDTH - 10:
            set_range(rows, r, 0, c, 'p')
            set_char(rows, r, c, 'q')
            set_char(rows, r, c + 1, 'r')
            set_range(rows, r, c + 2, WIDTH - 5, ' ')
            set_range(rows, r, WIDTH - 5, WIDTH, 'p')

    # Flat section with fuel
    for r in range(27, 32):
        corridor(rows, r, 35, 70)
    place_fuel(rows, 28, 50)

    # Section 2: st going left, rows 32-42
    for i in range(10):
        r = 32 + i
        c = 65 - i * 3
        if c > 5:
            set_range(rows, r, 0, 5, 'p')
            set_range(rows, r, 5, c, ' ')
            set_char(rows, r, c, 's')
            set_char(rows, r, c + 1, 't')
            set_range(rows, r, c + 2, WIDTH, 'p')

    # Flat with bunker + fuel
    for r in range(42, 48):
        corridor(rows, r, 10, 60)
    place_bunker_p(rows, 43, 15)
    place_fuel(rows, 45, 45)

    # Section 3: qr going right again, rows 48-58
    for i in range(10):
        r = 48 + i
        c = 10 + i * 3
        if c + 2 < WIDTH - 10:
            set_range(rows, r, 0, c, 'p')
            set_char(rows, r, c, 'q')
            set_char(rows, r, c + 1, 'r')
            set_range(rows, r, c + 2, WIDTH - 5, ' ')
            set_range(rows, r, WIDTH - 5, WIDTH, 'p')

    # Flat with reactor + fuel
    for r in range(58, 64):
        corridor(rows, r, 35, 70)
    place_reactor(rows, 59, 55)
    place_fuel(rows, 61, 40)

    # Door wall-to-wall
    for r in range(64, 67):
        place_door_row(rows, r, 35, 70)
    set_char(rows, 61, 68, 'N')

    # Section 4: st going left, rows 67-77
    for i in range(10):
        r = 67 + i
        c = 65 - i * 3
        if c > 5:
            set_range(rows, r, 0, 5, 'p')
            set_range(rows, r, 5, c, ' ')
            set_char(rows, r, c, 's')
            set_char(rows, r, c + 1, 't')
            set_range(rows, r, c + 2, WIDTH, 'p')

    # Flat with bunker + fuel
    for r in range(77, 83):
        corridor(rows, r, 10, 60)
    place_bunker_u(rows, 78, 45)
    place_fuel(rows, 80, 20)

    # Pod shaft
    vcorridor(rows, 83, 117, 36, 44)
    place_pod(rows, 113, 39)

    for r in range(117, HEIGHT):
        set_range(rows, r, 0, WIDTH, 'p')

    write_level("level10.def", rows)


# ============================================================
# Level 11: Cavern Hop - large open caverns connected by narrow passages
# ============================================================
def gen_level11():
    rows = make_rows()
    sky_rows(rows, 0, 17)
    set_char(rows, 5, 40, '*')

    # Cavern 1: rows 17-30, cols 5-75
    for r in range(17, 31):
        corridor(rows, r, 5, 75)
    place_fuel(rows, 22, 10)
    place_fuel(rows, 22, 65)
    place_bunker_bracket(rows, 25, 60)

    # Narrow passage 1: cols 36-42, rows 30-38
    vcorridor(rows, 30, 39, 36, 42)

    # Cavern 2: rows 38-52, cols 5-75
    for r in range(38, 53):
        corridor(rows, r, 5, 75)
    place_reactor(rows, 42, 10)
    place_fuel(rows, 45, 60)
    place_bunker_p(rows, 48, 50)

    # Narrow passage 2: cols 36-42, rows 52-60
    vcorridor(rows, 52, 61, 36, 42)

    # Cavern 3: rows 60-74, cols 5-75
    for r in range(60, 75):
        corridor(rows, r, 5, 75)
    place_fuel(rows, 64, 20)
    place_bunker_backslash(rows, 67, 55)

    # Door wall-to-wall in passage
    for r in range(74, 77):
        place_door_row(rows, r, 5, 75)
    set_char(rows, 70, 73, 'N')

    # Cavern 4: rows 77-92, cols 5-75
    for r in range(77, 93):
        corridor(rows, r, 5, 75)
    place_fuel(rows, 82, 50)
    place_bunker_u(rows, 85, 15)

    # Narrow passage 3: cols 36-42, rows 92-100
    vcorridor(rows, 92, 101, 36, 42)

    # Cavern 5: rows 100-110, cols 5-75
    for r in range(100, 111):
        corridor(rows, r, 5, 75)
    place_fuel(rows, 104, 30)

    # Pod shaft
    vcorridor(rows, 110, 117, 36, 44)
    place_pod(rows, 113, 39)

    for r in range(117, HEIGHT):
        set_range(rows, r, 0, WIDTH, 'p')

    write_level("level11.def", rows)


# ============================================================
# Level 12: Reactor Gauntlet - multiple reactors, winding path
# ============================================================
def gen_level12():
    rows = make_rows()
    sky_rows(rows, 0, 17)
    set_char(rows, 5, 40, '*')

    # Winding path with reactors in side niches
    # Section 1: corridor rows 17-25, cols 5-50
    for r in range(17, 26):
        corridor(rows, r, 5, 50)
    place_reactor(rows, 20, 55)
    # Niche for reactor
    for r in range(19, 23):
        corridor(rows, r, 50, 62)
    place_fuel(rows, 23, 15)

    # Section 2: vertical shaft cols 5-12, rows 25-38
    vcorridor(rows, 25, 39, 5, 12)

    # Section 3: corridor rows 38-48, cols 5-70
    for r in range(38, 49):
        corridor(rows, r, 5, 70)
    place_reactor(rows, 41, 8)
    place_bunker_p(rows, 44, 30)
    place_fuel(rows, 46, 55)

    # Section 4: vertical shaft cols 63-70, rows 48-60
    vcorridor(rows, 48, 61, 63, 70)

    # Section 5: corridor rows 60-70, cols 10-70
    for r in range(60, 71):
        corridor(rows, r, 10, 70)
    place_reactor(rows, 63, 15)
    place_bunker_bracket(rows, 65, 55)
    place_fuel(rows, 68, 40)

    # Door wall-to-wall
    for r in range(70, 73):
        place_door_row(rows, r, 10, 70)
    set_char(rows, 67, 68, 'N')

    # Section 6: vertical shaft cols 10-17, rows 73-85
    vcorridor(rows, 73, 86, 10, 17)

    # Section 7: corridor rows 85-95, cols 10-65
    for r in range(85, 96):
        corridor(rows, r, 10, 65)
    place_bunker_u(rows, 88, 40)
    place_fuel(rows, 92, 20)

    # Pod shaft
    vcorridor(rows, 95, 117, 36, 44)
    place_pod(rows, 113, 39)

    for r in range(117, HEIGHT):
        set_range(rows, r, 0, WIDTH, 'p')

    write_level("level12.def", rows)


# ============================================================
# Level 13: Vertical Obstacle Course - narrow shaft with protrusions
# ============================================================
def gen_level13():
    rows = make_rows()
    sky_rows(rows, 0, 17)
    set_char(rows, 5, 40, '*')

    # Main vertical shaft: cols 30-52, rows 17-116
    vcorridor(rows, 17, 117, 30, 52)

    # Alternating wall protrusions from left and right
    # Left protrusion 1: cols 30-42, rows 22-25
    for r in range(22, 26):
        set_range(rows, r, 30, 43, 'p')
    place_fuel(rows, 27, 45)

    # Right protrusion 2: cols 40-52, rows 32-35
    for r in range(32, 36):
        set_range(rows, r, 39, 52, 'p')
    place_bunker_p(rows, 36, 35)

    # Left protrusion 3: cols 30-42, rows 42-45
    for r in range(42, 46):
        set_range(rows, r, 30, 43, 'p')
    place_fuel(rows, 47, 45)

    # Right protrusion 4: cols 40-52, rows 52-55
    for r in range(52, 56):
        set_range(rows, r, 39, 52, 'p')
    place_reactor(rows, 56, 33)

    # Left protrusion 5: cols 30-42, rows 62-65
    for r in range(62, 66):
        set_range(rows, r, 30, 43, 'p')
    place_bunker_bracket(rows, 66, 47)

    # Door across shaft
    for r in range(70, 73):
        place_door_row(rows, r, 30, 52)
    set_char(rows, 67, 50, 'N')

    # Right protrusion 6: cols 40-52, rows 75-78
    for r in range(75, 79):
        set_range(rows, r, 39, 52, 'p')
    place_fuel(rows, 80, 35)

    # Left protrusion 7: cols 30-42, rows 85-88
    for r in range(85, 89):
        set_range(rows, r, 30, 43, 'p')
    place_bunker_backslash(rows, 89, 45)

    # Right protrusion 8: cols 40-52, rows 95-98
    for r in range(95, 99):
        set_range(rows, r, 39, 52, 'p')
    place_fuel(rows, 100, 35)

    # Pod area
    vcorridor(rows, 105, 117, 36, 44)
    place_pod(rows, 113, 39)

    for r in range(117, HEIGHT):
        set_range(rows, r, 0, WIDTH, 'p')

    write_level("level13.def", rows)


# ============================================================
# Level 14: Diamond Cross - cross/diamond shaped corridors
# ============================================================
def gen_level14():
    rows = make_rows()
    sky_rows(rows, 0, 17)
    set_char(rows, 5, 40, '*')

    # Vertical center shaft: cols 36-44, rows 17-116
    vcorridor(rows, 17, 117, 36, 44)

    # Horizontal arms at various heights
    # Arm 1: rows 25-30, cols 5-75
    for r in range(25, 31):
        corridor(rows, r, 5, 75)
    place_fuel(rows, 27, 10)
    place_fuel(rows, 27, 65)
    place_bunker_p(rows, 28, 20)

    # Arm 2: rows 40-45, cols 10-70
    for r in range(40, 46):
        corridor(rows, r, 10, 70)
    place_reactor(rows, 42, 15)
    place_bunker_bracket(rows, 43, 60)
    place_fuel(rows, 44, 50)

    # Arm 3: rows 55-60, cols 5-75
    for r in range(55, 61):
        corridor(rows, r, 5, 75)
    place_fuel(rows, 57, 20)
    place_fuel(rows, 57, 55)

    # Door wall-to-wall
    for r in range(60, 63):
        place_door_row(rows, r, 5, 75)
    set_char(rows, 57, 73, 'N')

    # Arm 4: rows 70-75, cols 10-70
    for r in range(70, 76):
        corridor(rows, r, 10, 70)
    place_bunker_u(rows, 72, 45)
    place_fuel(rows, 74, 15)

    # Arm 5: rows 85-90, cols 5-75
    for r in range(85, 91):
        corridor(rows, r, 5, 75)
    place_bunker_backslash(rows, 87, 50)
    place_fuel(rows, 89, 20)

    # Arm 6: rows 100-105, cols 10-70
    for r in range(100, 106):
        corridor(rows, r, 10, 70)
    place_fuel(rows, 102, 40)

    # Pod
    place_pod(rows, 113, 39)

    for r in range(117, HEIGHT):
        set_range(rows, r, 0, WIDTH, 'p')

    write_level("level14.def", rows)


# ============================================================
# Level 15: Fuel Run - wide cave with fuel everywhere, few bunkers
# ============================================================
def gen_level15():
    rows = make_rows()
    sky_rows(rows, 0, 17)
    set_char(rows, 5, 40, '*')

    # Wide open cave with shelves
    # Main cave: rows 17-55, cols 5-75
    for r in range(17, 56):
        corridor(rows, r, 5, 75)

    # Shelves (wall protrusions from sides)
    for r in range(25, 28):
        set_range(rows, r, 5, 20, 'p')
    for r in range(33, 36):
        set_range(rows, r, 60, 75, 'p')
    for r in range(42, 45):
        set_range(rows, r, 5, 25, 'p')
    for r in range(50, 53):
        set_range(rows, r, 55, 75, 'p')

    # Fuel depots everywhere
    place_fuel(rows, 20, 10)
    place_fuel(rows, 20, 65)
    place_fuel(rows, 30, 50)
    place_fuel(rows, 38, 15)
    place_fuel(rows, 47, 45)
    place_fuel(rows, 54, 30)

    # Single bunker
    place_bunker_p(rows, 22, 40)

    # Narrow section with reactor
    vcorridor(rows, 55, 65, 30, 50)
    place_reactor(rows, 58, 35)

    # Door
    for r in range(65, 68):
        place_door_row(rows, r, 30, 50)
    set_char(rows, 62, 48, 'N')

    # Lower cave: rows 68-100, cols 5-75
    for r in range(68, 101):
        corridor(rows, r, 5, 75)

    # More shelves
    for r in range(75, 78):
        set_range(rows, r, 55, 75, 'p')
    for r in range(85, 88):
        set_range(rows, r, 5, 20, 'p')

    place_bunker_u(rows, 72, 30)
    place_fuel(rows, 80, 50)
    place_fuel(rows, 92, 40)

    # Pod shaft
    vcorridor(rows, 100, 117, 36, 44)
    place_pod(rows, 113, 39)

    for r in range(117, HEIGHT):
        set_range(rows, r, 0, WIDTH, 'p')

    write_level("level15.def", rows)


# ============================================================
# Level 16: The Gauntlet - maximum difficulty, dense everything
# ============================================================
def gen_level16():
    rows = make_rows()
    sky_rows(rows, 0, 17)
    set_char(rows, 5, 40, '*')

    # Tight winding path with dense bunkers, doors, and obstacles

    # Section 1: narrow corridor rows 17-22, cols 10-70
    for r in range(17, 23):
        corridor(rows, r, 10, 70)
    place_bunker_p(rows, 19, 15)
    place_fuel(rows, 20, 55)

    # qr slope section: rows 22-32
    for i in range(10):
        r = 22 + i
        c = 10 + i * 3
        if c + 2 < WIDTH - 10:
            set_range(rows, r, 0, c, 'p')
            set_char(rows, r, c, 'q')
            set_char(rows, r, c + 1, 'r')
            set_range(rows, r, c + 2, WIDTH - 5, ' ')
            set_range(rows, r, WIDTH - 5, WIDTH, 'p')
    place_bunker_bracket(rows, 28, 60)

    # Flat with reactor
    for r in range(32, 38):
        corridor(rows, r, 35, 70)
    place_reactor(rows, 33, 55)
    place_fuel(rows, 36, 40)

    # Door 1
    for r in range(38, 41):
        place_door_row(rows, r, 35, 70)
    set_char(rows, 35, 68, 'N')

    # st slope section: rows 41-51
    for i in range(10):
        r = 41 + i
        c = 65 - i * 3
        if c > 5:
            set_range(rows, r, 0, 5, 'p')
            set_range(rows, r, 5, c, ' ')
            set_char(rows, r, c, 's')
            set_char(rows, r, c + 1, 't')
            set_range(rows, r, c + 2, WIDTH, 'p')
    place_bunker_backslash(rows, 47, 20)

    # Flat with bunkers
    for r in range(51, 57):
        corridor(rows, r, 10, 65)
    place_bunker_u(rows, 52, 45)
    place_fuel(rows, 55, 20)

    # Door 2
    for r in range(57, 60):
        place_door_row(rows, r, 10, 65)
    set_char(rows, 54, 63, 'N')

    # uv slope section: rows 60-70
    for i in range(10):
        r = 60 + i
        c = 60 - i * 3
        if c > 5:
            set_range(rows, r, 0, 5, 'p')
            set_range(rows, r, 5, c, ' ')
            set_char(rows, r, c, 'u')
            set_char(rows, r, c + 1, 'v')
            set_range(rows, r, c + 2, WIDTH, 'p')
    place_bunker_bracket(rows, 66, 15)

    # Flat with fuel
    for r in range(70, 76):
        corridor(rows, r, 10, 65)
    place_fuel(rows, 72, 30)
    place_fuel(rows, 72, 50)

    # wx slope section: rows 76-86
    for i in range(10):
        r = 76 + i
        c = 10 + i * 3
        if c + 2 < WIDTH - 10:
            set_range(rows, r, 0, c, 'p')
            set_char(rows, r, c, 'w')
            set_char(rows, r, c + 1, 'x')
            set_range(rows, r, c + 2, WIDTH - 5, ' ')
            set_range(rows, r, WIDTH - 5, WIDTH, 'p')
    place_bunker_backslash(rows, 82, 55)

    # Final corridor
    for r in range(86, 95):
        corridor(rows, r, 30, 60)
    place_fuel(rows, 89, 40)
    place_bunker_p(rows, 91, 35)

    # Pod shaft
    vcorridor(rows, 95, 117, 36, 44)
    place_pod(rows, 113, 39)

    for r in range(117, HEIGHT):
        set_range(rows, r, 0, WIDTH, 'p')

    write_level("level16.def", rows)


# ============================================================
# Main
# ============================================================
if __name__ == '__main__':
    print("Generating 10 new levels...")
    gen_level7()
    gen_level8()
    gen_level9()
    gen_level10()
    gen_level11()
    gen_level12()
    gen_level13()
    gen_level14()
    gen_level15()
    gen_level16()
    print("Done.")
