export const NS = "rust";

export const ITEMS = {
  ak47: "rust:ak47",
  pda: "rust:pda",
  ammo556: "rust:ammo_556",
  syringe: "rust:syringe",
  bandage: "rust:bandage",
  wood: "rust:wood",
  stone: "rust:stone",
  metal: "rust:metal",
  sulfur: "rust:sulfur",
  charcoal: "rust:charcoal",
  cloth: "rust:cloth",
  gears: "rust:gears",
  techTrash: "rust:tech_trash",
  scrap: "rust:scrap",
};

export const BLOCKS = {
  recycler: "rust:recycler",
  toolCupboard: "rust:tool_cupboard",
};

export const MAG_SIZE = 30;
export const FIRE_COOLDOWN_TICKS = 6;
export const RELOAD_TICKS = 44;
export const BULLET_SPEED = 5.6;
export const BULLET_DAMAGE = 26;

export const SPAWN = { x: 0, y: 82, z: 0 };
export const ISLAND = {
  minX: -40,
  maxX: 40,
  minZ: -40,
  maxZ: 40,
  stoneY: 79,
  dirtY: 80,
  grassY: 81,
};

export const RT_POINTS = [
  { id: "gas", name: "Заправка", x: 30, y: 82, z: 30, radius: 18 },
  { id: "sphere", name: "Сфера", x: -30, y: 82, z: 30, radius: 18 },
  { id: "factory", name: "Завод", x: 30, y: 82, z: -30, radius: 18 },
  { id: "port", name: "Порт", x: -30, y: 82, z: -30, radius: 18 },
];

export const WORLD_KEYS = {
  mapBuilt: "rust:map_built_v1",
  joined: "rust:joined_v1",
  mag: "rust:ak_mag",
  lastShot: "rust:last_shot",
  reloadUntil: "rust:reload_until",
};
