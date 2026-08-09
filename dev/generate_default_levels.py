#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path("/home/ubuntu/repos/caveshuttle")
DEFAULT_DIR = ROOT / "public" / "levelpacks" / "default"
CLASSIC_L1 = ROOT / "dev" / "external-levelpacks" / "classic" / "level1.def"

WIDTH = 82
SKY_ROWS = 5
BEDROCK_ROWS = 2


def read_header() -> list[str]:
    lines = CLASSIC_L1.read_text().splitlines()
    header = lines[:10]
    header[0] = f"{WIDTH:<12}; width"
    return header


def make_canvas(height: int) -> list[list[str]]:
    rows: list[list[str]] = []
    for y in range(height):
        if y < SKY_ROWS:
            row = [" "] * WIDTH
        elif y >= height - BEDROCK_ROWS:
            row = ["p"] * WIDTH
        else:
            row = ["p"] * WIDTH
            row[0] = "p"
            row[-1] = "p"
        rows.append(row)
    return rows


def stamp(rows: list[list[str]], x: int, y: int, *shape: str) -> None:
    for dy, line in enumerate(shape):
        yy = y + dy
        if not (0 <= yy < len(rows)):
            continue
        for dx, ch in enumerate(line):
            xx = x + dx
            if 0 <= xx < WIDTH:
                rows[yy][xx] = ch


def carve_rect(rows: list[list[str]], x: int, y: int, w: int, h: int, ch: str = " ") -> None:
    for yy in range(y, y + h):
        if 0 <= yy < len(rows):
            for xx in range(x, x + w):
                if 0 <= xx < WIDTH:
                    rows[yy][xx] = ch


def interp(anchors: list[tuple[int, int]], y: int) -> int:
    anchors = sorted(anchors)
    if y <= anchors[0][0]:
        return anchors[0][1]
    if y >= anchors[-1][0]:
        return anchors[-1][1]
    for (y0, x0), (y1, x1) in zip(anchors, anchors[1:]):
        if y0 <= y <= y1:
            if y1 == y0:
                return x1
            t = (y - y0) / (y1 - y0)
            return round(x0 + (x1 - x0) * t)
    return anchors[-1][1]


def carve_corridor(rows: list[list[str]], width: int, anchors: list[tuple[int, int]], pinches: dict[int, int] | None = None) -> None:
    pinches = pinches or {}
    for y in range(SKY_ROWS, len(rows) - BEDROCK_ROWS):
        center = interp(anchors, y)
        open_width = pinches.get(y, width)
        left = max(1, center - open_width // 2)
        right = min(WIDTH - 2, left + open_width - 1)
        for xx in range(left, right + 1):
            rows[y][xx] = " "


def carve_vertical_channel(rows: list[list[str]], x: int, y0: int, y1: int, w: int = 5) -> None:
    left = max(1, x - w // 2)
    right = min(WIDTH - 2, left + w - 1)
    for y in range(y0, y1 + 1):
        if 0 <= y < len(rows):
            for xx in range(left, right + 1):
                rows[y][xx] = " "


def add_checkpoint_run(rows: list[list[str]], x: int, y: int, length: int) -> None:
    for i in range(length):
        xx = x + i
        if 0 <= y < len(rows) and 0 <= xx < WIDTH:
            rows[y][xx] = "#"


def force_gate(rows: list[list[str]], x: int, y: int, height: int, button_row: int, button_col: int, button: str) -> None:
    for yy in range(max(SKY_ROWS, y - 2), min(len(rows) - BEDROCK_ROWS, y + height + 2)):
        for xx in range(1, WIDTH - 1):
            rows[yy][xx] = "p"
        for xx in range(x, min(x + 8, WIDTH - 1)):
            rows[yy][xx] = " "
    for yy in range(y, min(y + height, len(rows))):
        rows[yy][x:x + 8] = list("HppppppG")
    if 0 <= button_row < len(rows):
        for xx in range(1, WIDTH - 1):
            rows[button_row][xx] = "p"
        for xx in range(x, min(x + 8, WIDTH - 1)):
            rows[button_row][xx] = " "
        rows[button_row][button_col:button_col + 2] = list(button)


def level1() -> list[str]:
    h = 34
    rows = make_canvas(h)
    anchors = [(5, 41), (12, 37), (20, 45), (h - 3, 41)]
    carve_corridor(rows, 24, anchors)
    stamp(rows, interp(anchors, 9) - 3, 9, "def", "ghi", "jkl")
    stamp(rows, interp(anchors, 14) - 1, 14, "r   `a", "qr   bc", "ppppppp")
    stamp(rows, interp(anchors, 20) - 10, 20, "qrPQR", "pqrS", "pppqr")
    stamp(rows, 39, 27, "m0", "12", "34")
    stamp(rows, 41, 3, "*")
    return ["".join(r) for r in rows]


def level2() -> list[str]:
    h = 50
    rows = make_canvas(h)
    anchors = [(5, 41), (15, 36), (26, 47), (h - 3, 41)]
    carve_corridor(rows, 22, anchors, pinches={22: 14, 31: 14})
    stamp(rows, interp(anchors, 9) - 3, 9, "def", "ghi", "jkl")
    stamp(rows, interp(anchors, 14) - 8, 14, "uv[", "uvXYZ")
    stamp(rows, interp(anchors, 13) + 3, 13, "\\wx", "]^_wx")
    stamp(rows, interp(anchors, 18) - 2, 18, "r   `a", "qr   bc", "ppppppp")
    stamp(rows, interp(anchors, 24) - 10, 24, "qrPQR", "pqrS", "pppqr")
    stamp(rows, interp(anchors, 28) - 8, 28, "uv[", "uvXYZ")
    add_checkpoint_run(rows, interp(anchors, 20) - 2, 20, 8)
    add_checkpoint_run(rows, interp(anchors, 33) - 2 if False else 34, 33, 7)
    stamp(rows, 39, 42, "m0", "12", "34")
    stamp(rows, 41, 3, "*")
    return ["".join(r) for r in rows]


def level3() -> list[str]:
    h = 72
    rows = make_canvas(h)
    anchors = [(5, 41), (14, 35), (24, 48), (36, 38), (48, 45), (60, 36), (h - 3, 41)]
    carve_corridor(rows, 20, anchors, pinches={26: 12, 41: 12, 56: 11})
    stamp(rows, interp(anchors, 8) - 3, 8, "def", "ghi", "jkl")
    stamp(rows, interp(anchors, 16) - 8, 16, "uv[", "uvXYZ")
    stamp(rows, interp(anchors, 15) + 3, 15, "\\wx", "]^_wx")
    stamp(rows, interp(anchors, 24) - 3, 24, "r   `a", "qr   bc", "ppppppp")
    stamp(rows, interp(anchors, 33) - 10, 33, "qrPQR", "pqrS", "pppqr")
    stamp(rows, interp(anchors, 39) - 2, 39, "UVWst", "Tstpp")
    stamp(rows, interp(anchors, 46) - 2, 46, "r   `a", "qr   bc", "ppppppp")
    stamp(rows, interp(anchors, 53) - 8, 53, "uv[", "uvXYZ")
    stamp(rows, interp(anchors, 60) - 3, 60, "r   `a", "qr   bc", "ppppppp")
    add_checkpoint_run(rows, interp(anchors, 20) - 2, 20, 7)
    add_checkpoint_run(rows, interp(anchors, 41) - 2, 41, 8)
    add_checkpoint_run(rows, interp(anchors, 57) - 2, 57, 7)
    stamp(rows, 39, 64, "m0", "12", "34")
    stamp(rows, 41, 3, "*")
    return ["".join(r) for r in rows]


def level4() -> list[str]:
    h = 92
    rows = make_canvas(h)
    anchors = [(5, 41), (18, 34), (32, 48), (46, 37), (62, 45), (78, 38), (h - 3, 41)]
    carve_corridor(rows, 18, anchors, pinches={28: 12, 57: 10, 74: 10})
    stamp(rows, interp(anchors, 9) - 3, 9, "def", "ghi", "jkl")
    stamp(rows, interp(anchors, 18) - 8, 18, "uv[", "uvXYZ")
    stamp(rows, interp(anchors, 17) + 3, 17, "\\wx", "]^_wx")
    stamp(rows, interp(anchors, 27) - 3, 27, "r   `a", "qr   bc", "ppppppp")
    stamp(rows, interp(anchors, 35) - 10, 35, "qrPQR", "pqrS", "pppqr")
    stamp(rows, interp(anchors, 44) - 2, 44, "UVWst", "Tstpp")
    stamp(rows, interp(anchors, 52) - 3, 52, "r   `a", "qr   bc", "ppppppp")
    force_gate(rows, 39, 61, 3, 60, 40, "1N")
    add_checkpoint_run(rows, 32, 24, 8)
    add_checkpoint_run(rows, 35, 41, 8)
    add_checkpoint_run(rows, 37, 70, 7)
    stamp(rows, 39, 83, "m0", "12", "34")
    stamp(rows, 41, 3, "*")
    return ["".join(r) for r in rows]


def level5() -> list[str]:
    h = 120
    rows = make_canvas(h)
    anchors = [(5, 41), (16, 35), (28, 48), (42, 37), (58, 46), (74, 34), (92, 45), (h - 3, 41)]
    carve_corridor(rows, 18, anchors, pinches={25: 11, 50: 11, 67: 10, 84: 11, 101: 10})
    stamp(rows, interp(anchors, 9) - 3, 9, "def", "ghi", "jkl")
    stamp(rows, interp(anchors, 18) - 8, 18, "uv[", "uvXYZ")
    stamp(rows, interp(anchors, 17) + 3, 17, "\\wx", "]^_wx")
    stamp(rows, interp(anchors, 27) - 3, 27, "r   `a", "qr   bc", "ppppppp")
    stamp(rows, interp(anchors, 36) - 10, 36, "qrPQR", "pqrS", "pppqr")
    stamp(rows, interp(anchors, 44) - 2, 44, "UVWst", "Tstpp")
    stamp(rows, interp(anchors, 54) - 3, 54, "r   `a", "qr   bc", "ppppppp")
    stamp(rows, interp(anchors, 63) - 8, 63, "uv[", "uvXYZ")
    stamp(rows, interp(anchors, 73) + 3, 73, "\\wx", "]^_wx")
    stamp(rows, interp(anchors, 82) - 10, 82, "qrPQR", "pqrS", "pppqr")
    stamp(rows, interp(anchors, 91) - 2, 91, "UVWst", "Tstpp")
    force_gate(rows, 39, 101, 3, 100, 40, "1L")
    stamp(rows, interp(anchors, 76) - 1, 76, "`")
    add_checkpoint_run(rows, interp(anchors, 23) - 2, 23, 8)
    add_checkpoint_run(rows, interp(anchors, 41) - 2, 41, 7)
    add_checkpoint_run(rows, interp(anchors, 61) - 2, 61, 8)
    add_checkpoint_run(rows, interp(anchors, 80) - 2, 80, 7)
    add_checkpoint_run(rows, interp(anchors, 107) - 2, 107, 8)
    stamp(rows, 39, 113, "m0", "12", "34")
    stamp(rows, 41, 3, "*")
    return ["".join(r) for r in rows]


def level6() -> list[str]:
    h = 150
    rows = make_canvas(h)
    anchors = [(5, 41), (18, 35), (32, 48), (46, 36), (60, 45), (76, 34), (94, 46), (112, 37), (130, 44), (h - 3, 41)]
    carve_corridor(rows, 18, anchors, pinches={26: 11, 41: 11, 57: 10, 70: 11, 88: 10, 105: 11, 124: 10})
    stamp(rows, interp(anchors, 9) - 3, 9, "def", "ghi", "jkl")
    stamp(rows, interp(anchors, 18) - 8, 18, "uv[", "uvXYZ")
    stamp(rows, interp(anchors, 17) + 3, 17, "\\wx", "]^_wx")
    stamp(rows, interp(anchors, 28) - 3, 28, "r   `a", "qr   bc", "ppppppp")
    stamp(rows, interp(anchors, 37) - 10, 37, "qrPQR", "pqrS", "pppqr")
    stamp(rows, interp(anchors, 46) - 2, 46, "UVWst", "Tstpp")
    stamp(rows, interp(anchors, 56) - 3, 56, "r   `a", "qr   bc", "ppppppp")
    stamp(rows, interp(anchors, 65) - 8, 65, "uv[", "uvXYZ")
    stamp(rows, interp(anchors, 75) + 3, 75, "\\wx", "]^_wx")
    stamp(rows, interp(anchors, 84) - 10, 84, "qrPQR", "pqrS", "pppqr")
    stamp(rows, interp(anchors, 93) - 2, 93, "UVWst", "Tstpp")
    stamp(rows, interp(anchors, 104) - 8, 104, "uv[", "uvXYZ")
    stamp(rows, interp(anchors, 112) + 3, 112, "\\wx", "]^_wx")
    stamp(rows, interp(anchors, 131) - 10, 131, "qrPQR", "pqrS", "pppqr")
    stamp(rows, interp(anchors, 139) - 2, 139, "UVWst", "Tstpp")
    force_gate(rows, 39, 107, 3, 106, 40, "1L")
    stamp(rows, 40, 96, "1N")
    add_checkpoint_run(rows, interp(anchors, 24) - 2, 24, 8)
    add_checkpoint_run(rows, interp(anchors, 41) - 2, 41, 7)
    add_checkpoint_run(rows, interp(anchors, 63) - 2, 63, 8)
    add_checkpoint_run(rows, interp(anchors, 87) - 2, 87, 7)
    add_checkpoint_run(rows, interp(anchors, 126) - 2, 126, 8)
    add_checkpoint_run(rows, interp(anchors, 128) - 2, 128, 7)
    stamp(rows, 39, 136, "m0", "12", "34")
    stamp(rows, 41, 3, "*")
    return ["".join(r) for r in rows]


def write_level(path: Path, height: int, body: list[str]) -> None:
    header = read_header()
    header[1] = f"{height:<12}; height"
    content = "\n".join(header + body) + "\n"
    path.write_text(content)


def main() -> None:
    specs = [
        (1, level1()),
        (2, level2()),
        (3, level3()),
        (4, level4()),
        (5, level5()),
        (6, level6()),
    ]
    for idx, body in specs:
        out = DEFAULT_DIR / f"level{idx}.def"
        write_level(out, len(body), body)
        if idx == 6:
            text = out.read_text()
            out.write_text(text.replace("34pppppG", "34pppppp", 1))


if __name__ == "__main__":
    main()
