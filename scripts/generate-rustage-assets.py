#!/usr/bin/env python3
import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ITEM_DIR = ROOT / "addon" / "rp" / "textures" / "items" / "rust"
BLOCK_DIR = ROOT / "addon" / "rp" / "textures" / "blocks" / "rust"

TRANSPARENT = (0, 0, 0, 0)
OUTLINE = (22, 20, 18, 255)


def png_chunk(tag, data):
    payload = tag + data
    return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)


def write_png(path, width, height, pixels):
    rows = bytearray()
    for y in range(height):
        rows.append(0)
        for x in range(width):
            rows.extend(pixels[y][x])
    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", header) + png_chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + png_chunk(b"IEND", b""))


def canvas(size):
    return [[TRANSPARENT for _ in range(size)] for _ in range(size)]


def rect(img, x0, y0, x1, y1, color):
    for y in range(max(0, y0), min(len(img), y1 + 1)):
        for x in range(max(0, x0), min(len(img[0]), x1 + 1)):
            img[y][x] = color


def line(img, x0, y0, x1, y1, color, width=1):
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        rect(img, x0 - width // 2, y0 - width // 2, x0 + width // 2, y0 + width // 2, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def circle(img, cx, cy, radius, color):
    for y in range(len(img)):
        for x in range(len(img[0])):
            if (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius:
                img[y][x] = color


def outline_rect(img, x0, y0, x1, y1, fill, edge=OUTLINE):
    rect(img, x0, y0, x1, y1, edge)
    rect(img, x0 + 1, y0 + 1, x1 - 1, y1 - 1, fill)


def item_ammo(img):
    for i, x in enumerate((8, 15, 22)):
        rect(img, x, 6, x + 5, 24, (122, 78, 26, 255))
        rect(img, x + 1, 7, x + 4, 19, (218, 168, 64, 255))
        rect(img, x + 2, 4, x + 3, 7, (236, 196, 88, 255))
        rect(img, x + 1, 21, x + 4, 25, (88, 52, 20, 255))


def item_syringe(img):
    line(img, 7, 25, 22, 10, OUTLINE, 5)
    line(img, 8, 24, 21, 11, (226, 238, 242, 255), 3)
    line(img, 14, 18, 20, 12, (186, 42, 42, 255), 2)
    line(img, 22, 10, 27, 5, (176, 190, 196, 255), 1)
    rect(img, 5, 23, 9, 27, (74, 84, 92, 255))


def item_bandage(img):
    outline_rect(img, 5, 8, 26, 24, (226, 218, 196, 255))
    rect(img, 8, 11, 23, 21, (244, 236, 216, 255))
    rect(img, 14, 9, 17, 23, (190, 42, 42, 255))
    rect(img, 8, 15, 23, 18, (190, 42, 42, 255))
    rect(img, 5, 12, 8, 20, (196, 188, 168, 255))


def item_wood(img):
    outline_rect(img, 5, 8, 26, 25, (112, 70, 34, 255))
    for y in (12, 16, 20, 24):
        line(img, 6, y, 25, y - 2, (72, 42, 20, 255), 1)
    circle(img, 8, 16, 4, (168, 116, 58, 255))
    circle(img, 8, 16, 2, (92, 54, 24, 255))


def item_stone(img):
    for points in (((5, 23), (10, 9), (24, 8), (28, 22), (22, 27), (10, 27)),):
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        for y in range(min(ys), max(ys) + 1):
            for x in range(min(xs), max(xs) + 1):
                if (x - 16) ** 2 + (y - 18) ** 2 <= 140:
                    img[y][x] = (116, 120, 122, 255)
    line(img, 9, 14, 20, 10, (166, 170, 172, 255), 2)
    line(img, 12, 23, 24, 20, (78, 82, 84, 255), 2)


def item_metal(img):
    outline_rect(img, 5, 11, 27, 23, (154, 164, 172, 255))
    rect(img, 7, 13, 25, 16, (212, 220, 226, 255))
    rect(img, 7, 20, 25, 22, (104, 112, 120, 255))


def item_sulfur(img):
    for x, y, r in ((10, 21, 4), (17, 17, 5), (23, 22, 4), (15, 24, 3)):
        circle(img, x, y, r, (228, 196, 46, 255))
    for x, y in ((9, 20), (17, 16), (23, 21)):
        rect(img, x, y, x + 1, y + 1, (248, 228, 112, 255))


def item_charcoal(img):
    for x, y, r in ((10, 20, 5), (18, 16, 6), (23, 23, 4)):
        circle(img, x, y, r, (48, 48, 48, 255))
    for x, y in ((8, 19), (17, 14), (23, 22)):
        rect(img, x, y, x + 2, y + 2, (82, 82, 82, 255))


def item_cloth(img):
    outline_rect(img, 6, 8, 26, 25, (194, 178, 146, 255))
    for y in (12, 16, 20, 24):
        line(img, 7, y, 25, y, (160, 142, 112, 255), 1)
    rect(img, 6, 8, 26, 10, (220, 204, 170, 255))


def item_gears(img):
    circle(img, 16, 16, 9, (104, 112, 120, 255))
    circle(img, 16, 16, 5, (192, 200, 208, 255))
    circle(img, 16, 16, 2, (44, 48, 54, 255))
    for angle in range(0, 360, 45):
        a = math.radians(angle)
        x = int(16 + math.cos(a) * 11)
        y = int(16 + math.sin(a) * 11)
        rect(img, x - 2, y - 2, x + 2, y + 2, (128, 136, 144, 255))


def item_tech_trash(img):
    outline_rect(img, 5, 7, 27, 26, (34, 82, 54, 255))
    for y in (11, 15, 19, 23):
        line(img, 7, y, 18, y, (86, 190, 112, 255), 1)
    for x in (11, 15, 20):
        line(img, x, 9, x, 24, (70, 150, 92, 255), 1)
    rect(img, 21, 11, 24, 14, (220, 190, 74, 255))


def item_scrap(img):
    for points in (((7, 10), (13, 7), (17, 13), (12, 18)), ((17, 14), (25, 12), (27, 20), (20, 23)), ((8, 19), (14, 22), (11, 27), (6, 24))):
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        for y in range(min(ys), max(ys) + 1):
            for x in range(min(xs), max(xs) + 1):
                img[y][x] = (142, 150, 156, 255)
        line(img, points[0][0], points[0][1], points[1][0], points[1][1], (202, 210, 216, 255), 1)


def block_recycler(img):
    rect(img, 0, 0, 15, 15, (46, 72, 52, 255))
    rect(img, 1, 1, 14, 14, (72, 106, 78, 255))
    rect(img, 3, 3, 12, 7, (28, 34, 32, 255))
    rect(img, 4, 4, 11, 6, (100, 190, 116, 255))
    rect(img, 4, 10, 11, 12, (38, 48, 42, 255))
    for x in (2, 13):
        rect(img, x, 2, x, 13, (24, 34, 28, 255))


def block_tool_cupboard(img):
    rect(img, 0, 0, 15, 15, (92, 62, 34, 255))
    rect(img, 1, 1, 14, 14, (132, 94, 54, 255))
    line(img, 8, 1, 8, 14, (72, 46, 24, 255), 1)
    rect(img, 2, 3, 6, 5, (184, 144, 92, 255))
    rect(img, 9, 3, 13, 5, (184, 144, 92, 255))
    rect(img, 6, 8, 7, 10, (44, 42, 38, 255))
    rect(img, 9, 8, 10, 10, (44, 42, 38, 255))


def main():
    items = {
        "ammo_556": item_ammo,
        "syringe": item_syringe,
        "bandage": item_bandage,
        "wood": item_wood,
        "stone": item_stone,
        "metal": item_metal,
        "sulfur": item_sulfur,
        "charcoal": item_charcoal,
        "cloth": item_cloth,
        "gears": item_gears,
        "tech_trash": item_tech_trash,
        "scrap": item_scrap,
    }
    for name, draw in items.items():
        img = canvas(32)
        draw(img)
        write_png(ITEM_DIR / f"{name}.png", 32, 32, img)

    for name, draw in {"recycler": block_recycler, "tool_cupboard": block_tool_cupboard}.items():
        img = canvas(16)
        draw(img)
        write_png(BLOCK_DIR / f"{name}.png", 16, 16, img)


if __name__ == "__main__":
    main()
