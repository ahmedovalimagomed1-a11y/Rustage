import { ItemStack, world } from "@minecraft/server";
import { ISLAND, ITEMS, RT_POINTS, SPAWN, WORLD_KEYS } from "./config.js";
import { safeRunCommand, setBlockSafe } from "./utils.js";

const overworld = () => world.getDimension("overworld");

function command(dimension, cmd) {
  return safeRunCommand(dimension, cmd);
}

function fillChest(dimension, x, y, z, rolls) {
  command(dimension, `setblock ${x} ${y} ${z} chest`);
  const block = dimension.getBlock({ x, y, z });
  const container = block?.getComponent("minecraft:inventory")?.container;
  if (!container) return;

  const pool = [
    [ITEMS.ammo556, 15, 45],
    [ITEMS.bandage, 1, 4],
    [ITEMS.syringe, 1, 2],
    [ITEMS.scrap, 2, 8],
    [ITEMS.gears, 1, 3],
    [ITEMS.techTrash, 1, 2],
    [ITEMS.metal, 1, 6],
    [ITEMS.sulfur, 1, 5],
    [ITEMS.charcoal, 2, 8],
    [ITEMS.cloth, 1, 5],
  ];

  for (let i = 0; i < rolls; i++) {
    const [typeId, min, max] = pool[Math.floor(Math.random() * pool.length)];
    const amount = min + Math.floor(Math.random() * (max - min + 1));
    container.addItem(new ItemStack(typeId, amount));
  }
}

function buildIsland(dimension) {
  command(dimension, `fill ${ISLAND.minX} ${ISLAND.stoneY} ${ISLAND.minZ} ${ISLAND.maxX} ${ISLAND.stoneY} ${ISLAND.maxZ} minecraft:stone`);
  command(dimension, `fill ${ISLAND.minX} ${ISLAND.dirtY} ${ISLAND.minZ} ${ISLAND.maxX} ${ISLAND.dirtY} ${ISLAND.maxZ} minecraft:dirt`);
  command(dimension, `fill ${ISLAND.minX} ${ISLAND.grassY} ${ISLAND.minZ} ${ISLAND.maxX} ${ISLAND.grassY} ${ISLAND.maxZ} minecraft:grass_block`);
  command(dimension, `fill ${ISLAND.minX} 82 ${ISLAND.minZ} ${ISLAND.maxX} 82 ${ISLAND.minZ} minecraft:oak_fence`);
  command(dimension, `fill ${ISLAND.minX} 82 ${ISLAND.maxZ} ${ISLAND.maxX} 82 ${ISLAND.maxZ} minecraft:oak_fence`);
  command(dimension, `fill ${ISLAND.minX} 82 ${ISLAND.minZ} ${ISLAND.minX} 82 ${ISLAND.maxZ} minecraft:oak_fence`);
  command(dimension, `fill ${ISLAND.maxX} 82 ${ISLAND.minZ} ${ISLAND.maxX} 82 ${ISLAND.maxZ} minecraft:oak_fence`);
}

function buildGasStation(dimension) {
  command(dimension, "fill 26 82 26 34 82 34 minecraft:stone_bricks");
  command(dimension, "fill 26 83 26 34 86 34 minecraft:stone_bricks");
  command(dimension, "fill 27 83 27 33 85 33 minecraft:air");
  command(dimension, "setblock 30 83 26 minecraft:air");
  command(dimension, "setblock 30 84 26 minecraft:air");
  command(dimension, "setblock 30 85 30 minecraft:lantern");
  fillChest(dimension, 30, 82, 30, 5);
}

function buildSphere(dimension) {
  const cx = -30;
  const cy = 87;
  const cz = 30;
  const radius = 5;
  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      for (let z = -radius; z <= radius; z++) {
        const dist = Math.sqrt(x * x + y * y + z * z);
        if (dist <= radius && dist > radius - 0.9) {
          setBlockSafe(dimension, cx + x, cy + y, cz + z, "minecraft:glass");
        } else if (dist <= radius - 0.9) {
          setBlockSafe(dimension, cx + x, cy + y, cz + z, "minecraft:air");
        }
      }
    }
  }
  setBlockSafe(dimension, cx, 82, cz, "minecraft:air");
  setBlockSafe(dimension, cx, 83, cz, "minecraft:air");
  fillChest(dimension, cx, 82, cz, 6);
}

function buildFactory(dimension) {
  command(dimension, "fill 24 82 -36 36 88 -24 minecraft:stone_bricks");
  command(dimension, "fill 25 83 -35 35 87 -25 minecraft:air");
  command(dimension, "setblock 30 83 -36 minecraft:air");
  command(dimension, "setblock 30 84 -36 minecraft:air");
  command(dimension, "fill 28 88 -32 32 88 -28 minecraft:iron_block");
  fillChest(dimension, 30, 82, -30, 6);
}

function buildPort(dimension) {
  command(dimension, "fill -38 82 -38 -22 82 -22 minecraft:oak_planks");
  command(dimension, "fill -38 83 -38 -38 85 -22 minecraft:oak_fence");
  command(dimension, "fill -22 83 -38 -22 85 -22 minecraft:oak_fence");
  command(dimension, "fill -30 83 -30 -30 86 -30 minecraft:oak_fence");
  command(dimension, "setblock -30 87 -30 minecraft:lantern");
  fillChest(dimension, -30, 83, -30, 6);
}

function buildRecycler(dimension) {
  setBlockSafe(dimension, SPAWN.x + 4, SPAWN.y, SPAWN.z, "rust:recycler");
  setBlockSafe(dimension, SPAWN.x - 4, SPAWN.y, SPAWN.z, "rust:tool_cupboard");
}

export function buildMap() {
  const dimension = overworld();
  if (world.getDynamicProperty(WORLD_KEYS.mapBuilt) === true) return;

  command(dimension, "gamerule sendcommandfeedback false");
  buildIsland(dimension);
  buildGasStation(dimension);
  buildSphere(dimension);
  buildFactory(dimension);
  buildPort(dimension);
  buildRecycler(dimension);

  for (const point of RT_POINTS) {
    command(dimension, `setblock ${point.x} 83 ${point.z} minecraft:torch`);
  }

  world.setDynamicProperty(WORLD_KEYS.mapBuilt, true);
  console.warn("[Rustage] island and RT points generated");
}
