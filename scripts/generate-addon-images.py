import os
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ITEM_DIR = ROOT / "addon" / "rp" / "textures" / "items"
BLOCK_DIR = ROOT / "addon" / "rp" / "textures" / "blocks"
BP_DIR = ROOT / "addon" / "bp"
RP_DIR = ROOT / "addon" / "rp"

ITEMS = {
    "ak47": ((28, 28, 32), (168, 132, 74)),
    "ammo": ((54, 50, 42), (220, 184, 92)),
    "scrap": ((74, 78, 82), (150, 156, 160)),
    "metal": ((78, 84, 92), (196, 204, 210)),
    "rad_pill": ((42, 92, 66), (132, 226, 150)),
    "market_coin": ((120, 82, 20), (246, 196, 72)),
    "gas_can": ((108, 44, 32), (232, 112, 62)),
    "stone": ((86, 90, 92), (160, 166, 168)),
    "wood": ((104, 72, 38), (186, 138, 78)),
    "hammer": ((78, 62, 46), (194, 176, 144)),
    "berries": ((72, 24, 48), (222, 54, 88)),
    "cooked_meat": ((108, 46, 34), (206, 118, 76)),
    "water": ((28, 72, 116), (96, 186, 236)),
}

BLOCKS = {
    "wood_floor": ((104, 72, 38), (186, 138, 78)),
    "stone_floor": ((86, 90, 92), (160, 166, 168)),
    "metal_floor": ((72, 78, 86), (188, 198, 206)),
    "wood_wall": ((96, 66, 36), (172, 126, 70)),
    "stone_wall": ((78, 82, 84), (146, 152, 154)),
    "metal_wall": ((64, 70, 78), (176, 186, 194)),
}


def png_chunk(tag, data):
    payload = tag + data
    return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)


def write_png(path, width, height, pixel):
    rows = bytearray()
    for y in range(height):
        rows.append(0)
        for x in range(width):
            rows.extend(pixel(x, y, width, height))
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", header) + png_chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + png_chunk(b"IEND", b""))


def item_pixel(base, accent):
    def color(x, y, width, height):
        if x == 0 or y == 0 or x == width - 1 or y == height - 1:
            return (16, 16, 18)
        if 4 <= y <= 6 and 3 <= x <= 12:
            return accent
        if 8 <= y <= 10 and 5 <= x <= 11:
            return accent
        if x in (7, 8) and 11 <= y <= 13:
            return accent
        return base
    return color


def block_pixel(base, accent):
    def color(x, y, width, height):
        if x % 8 == 0 or y % 8 == 0:
            return (22, 24, 26)
        if (x + y) % 11 < 3:
            return accent
        return base
    return color


def pack_pixel(x, y, width, height):
    cx = width / 2
    cy = height / 2
    if (x - cx) ** 2 + (y - cy) ** 2 > (width * 0.42) ** 2:
        return (16, 18, 22)
    if abs(x - cx) < width * 0.08 or abs(y - cy) < height * 0.08:
        return (236, 196, 86)
    return (92, 44, 32)


def main():
    for name, (base, accent) in ITEMS.items():
        write_png(ITEM_DIR / f"{name}.png", 16, 16, item_pixel(base, accent))
    for name, (base, accent) in BLOCKS.items():
        write_png(BLOCK_DIR / f"{name}.png", 16, 16, block_pixel(base, accent))
    write_png(BP_DIR / "pack_icon.png", 128, 128, pack_pixel)
    write_png(RP_DIR / "pack_icon.png", 128, 128, pack_pixel)


if __name__ == "__main__":
    main()
