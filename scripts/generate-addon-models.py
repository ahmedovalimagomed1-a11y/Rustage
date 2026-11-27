import json
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BP_ITEMS_DIR = ROOT / "addon" / "bp" / "items"
RP_ITEMS_DIR = ROOT / "addon" / "rp" / "items"
RP_MODELS_DIR = ROOT / "addon" / "rp" / "models" / "entity"
RP_ATTACHABLES_DIR = ROOT / "addon" / "rp" / "attachables"
RP_ANIMATIONS_DIR = ROOT / "addon" / "rp" / "animations"
RP_TEXTURES_DIR = ROOT / "addon" / "rp" / "textures" / "items"

TEXTURE_SIZE = 32
ITEMS = {
    "ak47": {
        "identifier": "rustage:ak47",
        "bounds": [14, 8, 1],
        "colors": ((28, 28, 32), (168, 132, 74), (12, 12, 14)),
        "parts": [
            ([-6, 0, -1], [8, 3, 2], [0, 0]),
            ([-10, 0.2, -0.7], [5, 2, 1.4], [8, 0]),
            ([2, 1.1, -0.35], [7, 0.7, 0.7], [16, 0]),
            ([-2, -3, -0.7], [2, 3, 1.4], [24, 0]),
            ([-4, -2, -0.5], [1.5, 2, 1], [0, 8]),
            ([7, 1.7, -0.25], [0.5, 1, 0.5], [8, 8]),
            ([-3, -1.4, -0.5], [2.5, 0.3, 1], [16, 8]),
        ],
        "first": {"rotation": [27, -39, -159], "position": [0, 14.5, 2.4], "scale": 0.8},
        "third": {"rotation": [-20, -32.5, 0], "position": [0, 19, -4], "scale": 0.85},
    },
    "ammo": {
        "identifier": "rustage:ammo",
        "bounds": [4, 4, 4],
        "colors": ((54, 50, 42), (220, 184, 92), (16, 14, 12)),
        "parts": [
            ([-1.5, -1.5, -1.5], [3, 3, 3], [0, 0]),
            ([-1.5, 0.4, -1.7], [3, 0.8, 0.4], [8, 0]),
            ([-1.7, -0.6, -1.5], [0.4, 1.2, 3], [16, 0]),
        ],
        "first": {"rotation": [0, 0, 0], "position": [0, 15, 2], "scale": 0.75},
        "third": {"rotation": [0, 0, 0], "position": [0, 18, -2], "scale": 0.8},
    },
    "scrap": {
        "identifier": "rustage:scrap",
        "bounds": [5, 4, 4],
        "colors": ((74, 78, 82), (150, 156, 160), (20, 22, 24)),
        "parts": [
            ([-2, -1, -1], [3, 2, 2], [0, 0]),
            ([1, -1.5, -1], [2, 3, 2], [8, 0]),
            ([-1, 1, 0], [2, 1, 2], [16, 0]),
        ],
        "first": {"rotation": [10, 20, 0], "position": [0, 15, 2], "scale": 0.75},
        "third": {"rotation": [10, 20, 0], "position": [0, 18, -2], "scale": 0.8},
    },
    "metal": {
        "identifier": "rustage:metal",
        "bounds": [5, 3, 4],
        "colors": ((78, 84, 92), (196, 204, 210), (22, 26, 30)),
        "parts": [
            ([-2, -1, -1.5], [4, 1.2, 3], [0, 0]),
            ([-1.5, 0.2, -1.2], [3, 1, 2.4], [8, 0]),
            ([-1, 1.2, -0.9], [2, 0.8, 1.8], [16, 0]),
        ],
        "first": {"rotation": [0, 0, 0], "position": [0, 15, 2], "scale": 0.75},
        "third": {"rotation": [0, 0, 0], "position": [0, 18, -2], "scale": 0.8},
    },
    "rad_pill": {
        "identifier": "rustage:rad_pill",
        "bounds": [4, 3, 3],
        "colors": ((236, 240, 235), (64, 200, 120), (30, 40, 35)),
        "parts": [
            ([-1.7, -1, -1], [3.4, 2, 2], [0, 0]),
            ([-0.4, -1, -1], [0.8, 2, 2], [8, 0]),
            ([1.4, -0.65, -0.7], [0.6, 1.3, 1.4], [16, 0]),
        ],
        "first": {"rotation": [0, 0, 0], "position": [0, 15, 2], "scale": 0.75},
        "third": {"rotation": [0, 0, 0], "position": [0, 18, -2], "scale": 0.8},
    },
    "market_coin": {
        "identifier": "rustage:market_coin",
        "bounds": [4, 1, 4],
        "colors": ((120, 82, 20), (246, 196, 72), (48, 32, 8)),
        "parts": [
            ([-1.6, -0.5, -1.6], [3.2, 0.5, 3.2], [0, 0]),
            ([-1.2, 0, -1.2], [2.4, 0.4, 2.4], [8, 0]),
            ([-0.4, 0.4, -0.4], [0.8, 0.2, 0.8], [16, 0]),
        ],
        "first": {"rotation": [0, 0, 0], "position": [0, 15, 2], "scale": 0.75},
        "third": {"rotation": [0, 0, 0], "position": [0, 18, -2], "scale": 0.8},
    },
    "gas_can": {
        "identifier": "rustage:gas_can",
        "bounds": [5, 6, 4],
        "colors": ((108, 44, 32), (232, 112, 62), (24, 14, 12)),
        "parts": [
            ([-2, -2, -1.5], [4, 4, 3], [0, 0]),
            ([-1.2, -2.6, -0.9], [2.4, 0.8, 1.8], [8, 0]),
            ([1.8, 0.6, -0.4], [1.2, 0.6, 0.8], [16, 0]),
            ([-1, -3.2, -0.5], [2, 0.6, 1], [24, 0]),
        ],
        "first": {"rotation": [0, 0, 0], "position": [0, 15, 2], "scale": 0.75},
        "third": {"rotation": [0, 0, 0], "position": [0, 18, -2], "scale": 0.8},
    },
    "stone": {
        "identifier": "rustage:stone",
        "bounds": [5, 4, 5],
        "colors": ((86, 90, 92), (160, 166, 168), (24, 26, 28)),
        "parts": [
            ([-2, -1.5, -2], [4, 3, 4], [0, 0]),
            ([-1.2, 1.2, -1], [2.4, 0.8, 2], [8, 0]),
        ],
        "first": {"rotation": [0, 0, 0], "position": [0, 15, 2], "scale": 0.75},
        "third": {"rotation": [0, 0, 0], "position": [0, 18, -2], "scale": 0.8},
    },
    "wood": {
        "identifier": "rustage:wood",
        "bounds": [5, 4, 4],
        "colors": ((104, 72, 38), (186, 138, 78), (32, 20, 10)),
        "parts": [
            ([-2, -1.5, -1.6], [4, 3, 3.2], [0, 0]),
            ([-1.2, 1, -1], [2.4, 0.8, 2], [8, 0]),
        ],
        "first": {"rotation": [0, 0, 0], "position": [0, 15, 2], "scale": 0.75},
        "third": {"rotation": [0, 0, 0], "position": [0, 18, -2], "scale": 0.8},
    },
    "hammer": {
        "identifier": "rustage:hammer",
        "bounds": [6, 8, 3],
        "colors": ((78, 62, 46), (194, 176, 144), (28, 22, 18)),
        "parts": [
            ([-0.7, -4, -0.7], [1.4, 7, 1.4], [0, 0]),
            ([-2.5, 2, -1], [5, 2, 2], [8, 0]),
            ([-3.2, 2.6, -0.8], [1, 1.4, 1.6], [16, 0]),
        ],
        "first": {"rotation": [-20, 0, 0], "position": [0, 15, 2], "scale": 0.8},
        "third": {"rotation": [-20, 0, 0], "position": [0, 18, -2], "scale": 0.85},
    },
    "berries": {
        "identifier": "rustage:berries",
        "bounds": [4, 4, 4],
        "colors": ((72, 24, 48), (222, 54, 88), (24, 10, 22)),
        "parts": [
            ([-1.7, -1.6, -1.6], [3.4, 3.2, 3.2], [0, 0]),
            ([-0.8, 1.2, -0.8], [1.6, 0.8, 1.6], [8, 0]),
        ],
        "first": {"rotation": [0, 0, 0], "position": [0, 15, 2], "scale": 0.7},
        "third": {"rotation": [0, 0, 0], "position": [0, 18, -2], "scale": 0.75},
    },
    "cooked_meat": {
        "identifier": "rustage:cooked_meat",
        "bounds": [5, 4, 4],
        "colors": ((108, 46, 34), (206, 118, 76), (36, 16, 12)),
        "parts": [
            ([-2, -1.5, -1.5], [4, 3, 3], [0, 0]),
            ([-1, 1, -0.8], [2, 0.7, 1.6], [8, 0]),
        ],
        "first": {"rotation": [0, 0, 0], "position": [0, 15, 2], "scale": 0.75},
        "third": {"rotation": [0, 0, 0], "position": [0, 18, -2], "scale": 0.8},
    },
    "water": {
        "identifier": "rustage:water",
        "bounds": [4, 5, 4],
        "colors": ((28, 72, 116), (96, 186, 236), (14, 30, 52)),
        "parts": [
            ([-1.6, -2, -1.6], [3.2, 3.2, 3.2], [0, 0]),
            ([-1, 1.2, -1], [2, 0.8, 2], [8, 0]),
        ],
        "first": {"rotation": [0, 0, 0], "position": [0, 15, 2], "scale": 0.7},
        "third": {"rotation": [0, 0, 0], "position": [0, 18, -2], "scale": 0.75},
    },
}


def png_chunk(tag, data):
    payload = tag + data
    return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)


def model_pixel(base, accent, dark):
    def color(x, y, width, height):
        if x < 2 or y < 2 or x >= width - 2 or y >= height - 2:
            return dark
        if 8 <= x < 16 and 8 <= y < 16:
            return accent
        if 18 <= x < 26 and 4 <= y < 10:
            return accent
        if 4 <= x < 10 and 18 <= y < 26:
            return accent
        if y in (7, 19) and 2 <= x < width - 2:
            return dark
        return base
    return color


def write_png(path, width, height, pixel):
    rows = bytearray()
    for y in range(height):
        rows.append(0)
        for x in range(width):
            rows.extend(pixel(x, y, width, height))
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", header) + png_chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + png_chunk(b"IEND", b""))


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def geometry_document(name, spec):
    bone_name = f"rustage_{name}"
    cubes = []
    for origin, size, uv in spec["parts"]:
        cubes.append({"origin": origin, "size": size, "uv": uv})
    return {
        "format_version": "1.16.0",
        "minecraft:geometry": [
            {
                "description": {
                    "identifier": f"geometry.rustage.{name}",
                    "texture_width": TEXTURE_SIZE,
                    "texture_height": TEXTURE_SIZE,
                    "visible_bounds_width": spec["bounds"][0],
                    "visible_bounds_height": spec["bounds"][1],
                    "visible_bounds_offset": [0, spec["bounds"][2], 0],
                },
                "bones": [
                    {
                        "name": bone_name,
                        "binding": "query.item_slot_to_bone_name(context.item_slot)",
                        "pivot": [0, 0, 0],
                        "cubes": cubes,
                    }
                ],
            }
        ],
    }


def attachable_document(name, spec):
    return {
        "format_version": "1.10.0",
        "minecraft:attachable": {
            "description": {
                "identifier": spec["identifier"],
                "materials": {
                    "default": "entity",
                    "enchanted": "entity_alphatest_glint",
                },
                "textures": {
                    "default": f"textures/items/{name}_model",
                    "enchanted": "textures/misc/enchanted_item_glint",
                },
                "geometry": {"default": f"geometry.rustage.{name}"},
                "animations": {
                    "hold_first_person": f"animation.rustage.{name}.hold_first_person",
                    "hold_third_person": f"animation.rustage.{name}.hold_third_person",
                },
                "scripts": {
                    "animate": [
                        {"hold_first_person": "context.is_first_person == 1.0"},
                        {"hold_third_person": "context.is_first_person == 0.0"},
                    ]
                },
                "render_controllers": ["controller.render.item_default"],
            }
        },
    }


def animation_document(name, spec):
    bone_name = f"rustage_{name}"
    return {
        "format_version": "1.10.0",
        "animations": {
            f"animation.rustage.{name}.hold_first_person": {
                "loop": True,
                "bones": {bone_name: spec["first"]},
            },
            f"animation.rustage.{name}.hold_third_person": {
                "loop": True,
                "bones": {bone_name: spec["third"]},
            },
        },
    }


def patch_behavior_items():
    for path in sorted(BP_ITEMS_DIR.glob("*.json")):
        document = json.loads(path.read_text())
        item = document.get("minecraft:item", {})
        components = item.setdefault("components", {})
        components["minecraft:hand_equipped"] = True
        components.pop("minecraft:render_offsets", None)
        path.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n")


def main():
    patch_behavior_items()
    for name, spec in ITEMS.items():
        base, accent, dark = spec["colors"]
        write_png(RP_TEXTURES_DIR / f"{name}_model.png", TEXTURE_SIZE, TEXTURE_SIZE, model_pixel(base, accent, dark))
        write_json(RP_MODELS_DIR / f"rustage_{name}.geo.json", geometry_document(name, spec))
        write_json(RP_ATTACHABLES_DIR / f"rustage_{name}.entity.json", attachable_document(name, spec))
        write_json(RP_ANIMATIONS_DIR / f"rustage_{name}.animation.json", animation_document(name, spec))


if __name__ == "__main__":
    main()
