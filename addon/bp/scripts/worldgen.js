import { world, system } from "@minecraft/server";
import {
  MAP_RADIUS,
  SPAWN,
  LOGIN_LOBBY,
  SPHERE_CENTER,
  SPHERE_RADIUS,
  MARKET_EAST,
  MARKET_WEST,
  GAS_STATION
} from "./config.js";

const DONE_KEY = "rustage:worldgen:v5";
const MARKER = { x: 5, y: 80, z: 0 };
const queue = [];
let runner = null;
let building = false;

function addFill(x1, y1, z1, x2, y2, z2, block) {
  queue.push({ type: "fill", x1, y1, z1, x2, y2, z2, block });
}

function addBlock(x, y, z, block) {
  queue.push({ type: "block", x, y, z, block });
}

function safeFill(dimension, task) {
  try {
    dimension.runCommand(`fill ${task.x1} ${task.y1} ${task.z1} ${task.x2} ${task.y2} ${task.z2} ${task.block}`);
  } catch {}
}

function safeBlock(dimension, task) {
  try {
    dimension.setBlockType({ x: task.x, y: task.y, z: task.z }, task.block);
  } catch {}
}

function buildSpawnHub() {
  const { x, y, z } = SPAWN;
  addFill(x - 7, y - 2, z - 7, x + 7, y - 2, z + 7, "minecraft:polished_andesite");
  addFill(x - 6, y - 1, z - 6, x - 6, y + 3, z + 6, "minecraft:oak_log");
  addFill(x + 6, y - 1, z - 6, x + 6, y + 3, z + 6, "minecraft:oak_log");
  addFill(x - 6, y + 4, z - 6, x + 6, y + 4, z + 6, "minecraft:glass");
  addFill(x - 5, y - 1, z - 5, x + 5, y - 1, z - 5, "minecraft:oak_planks");
  addFill(x - 5, y - 1, z + 5, x + 5, y - 1, z + 5, "minecraft:oak_planks");
  addBlock(x - 2, y - 1, z + 2, "minecraft:crafting_table");
  addBlock(x + 2, y - 1, z + 2, "minecraft:furnace");
  addBlock(x, y - 1, z + 3, "minecraft:chest");
  addBlock(x - 4, y - 1, z - 2, "minecraft:bed");
  addBlock(x - 6, y + 2, z - 3, "minecraft:torch");
  addBlock(x + 6, y + 2, z + 3, "minecraft:torch");
  addBlock(MARKER.x, MARKER.y, MARKER.z, "minecraft:barrier");
}

function buildLoginLobby() {
  const { x, y, z } = LOGIN_LOBBY;
  addFill(x - 4, y - 1, z - 4, x + 4, y - 1, z + 4, "minecraft:polished_andesite");
  addFill(x - 4, y, z - 4, x + 4, y + 10, z - 4, "minecraft:barrier");
  addFill(x - 4, y, z + 4, x + 4, y + 10, z + 4, "minecraft:barrier");
  addFill(x - 4, y, z - 4, x - 4, y + 10, z + 4, "minecraft:barrier");
  addFill(x + 4, y, z - 4, x + 4, y + 10, z + 4, "minecraft:barrier");
  addFill(x - 4, y + 10, z - 4, x + 4, y + 10, z + 4, "minecraft:barrier");
  addBlock(x, y, z, "minecraft:gold_block");
}

function buildMapBoundary() {
  const r = MAP_RADIUS;
  const y = 90;
  addFill(-r, y, -r, r, y, -r, "minecraft:bedrock");
  addFill(-r, y, r, r, y, r, "minecraft:bedrock");
  addFill(-r, y, -r, -r, y, r, "minecraft:bedrock");
  addFill(r, y, -r, r, y, r, "minecraft:bedrock");
  addFill(-r, y + 1, -r, r, y + 4, -r, "minecraft:glass");
  addFill(-r, y + 1, r, r, y + 4, r, "minecraft:glass");
  addFill(-r, y + 1, -r, -r, y + 4, r, "minecraft:glass");
  addFill(r, y + 1, -r, r, y + 4, r, "minecraft:glass");
  for (let offset = -r; offset <= r; offset += 25) {
    addBlock(offset, y + 5, -r, "minecraft:glowstone");
    addBlock(offset, y + 5, r, "minecraft:glowstone");
    addBlock(-r, y + 5, offset, "minecraft:glowstone");
    addBlock(r, y + 5, offset, "minecraft:glowstone");
  }
}

function buildRoads() {
  addFill(0, 64, -3, MARKET_EAST.x, 64, 3, "minecraft:gravel");
  addFill(MARKET_WEST.x, 64, -3, 0, 64, 3, "minecraft:gravel");
  addFill(GAS_STATION.x, 64, GAS_STATION.z, GAS_STATION.x, 64, MARKET_WEST.z, "minecraft:gravel");
  addFill(MARKET_WEST.x - 3, 64, 0, MARKET_WEST.x + 3, 64, 0, "minecraft:gravel");
  addFill(MARKET_EAST.x - 3, 64, 0, MARKET_EAST.x + 3, 64, 0, "minecraft:gravel");
}

function buildSphere() {
  const { x: cx, y: cy, z: cz } = SPHERE_CENTER;
  const radius = SPHERE_RADIUS;
  addFill(cx - 22, cy - 6, cz - 22, cx + 22, cy - 6, cz + 22, "minecraft:polished_andesite");
  addFill(cx - 3, cy - 5, cz - 3, cx + 3, cy - 2, cz + 3, "minecraft:glowstone");
  for (let dy = -radius; dy <= radius; dy += 2) {
    const ring = Math.sqrt(Math.max(0, radius * radius - dy * dy));
    if (ring < 1) continue;
    const steps = Math.max(24, Math.floor(ring * 2.6));
    for (let step = 0; step < steps; step++) {
      const angle = (step / steps) * Math.PI * 2;
      const x = cx + Math.round(Math.cos(angle) * ring);
      const z = cz + Math.round(Math.sin(angle) * ring);
      const block = step % 9 === 0 ? "minecraft:glowstone" : "minecraft:glass";
      addBlock(x, cy + dy, z, block);
    }
  }
  addFill(cx - 6, cy - 6, cz - 6, cx + 6, cy - 6, cz + 6, "minecraft:gold_block");
}

function buildMarket(center, roofColor) {
  const { x, y, z } = center;
  addFill(x - 18, y, z - 14, x + 18, y, z + 14, "minecraft:polished_andesite");
  addFill(x - 18, y + 1, z - 14, x + 18, y + 1, z + 14, "minecraft:carpet");
  for (let offset = -12; offset <= 12; offset += 8) {
    addFill(x + offset - 2, y + 1, z - 6, x + offset + 2, y + 1, z - 2, "minecraft:oak_planks");
    addFill(x + offset - 2, y + 2, z - 6, x + offset + 2, y + 4, z - 6, "minecraft:oak_log");
    addFill(x + offset - 2, y + 5, z - 6, x + offset + 2, y + 5, z - 2, roofColor);
    addBlock(x + offset, y + 2, z - 4, "minecraft:chest");
    addFill(x + offset - 2, y + 1, z + 2, x + offset + 2, y + 1, z + 6, "minecraft:oak_planks");
    addFill(x + offset - 2, y + 2, z + 6, x + offset + 2, y + 4, z + 6, "minecraft:oak_log");
    addFill(x + offset - 2, y + 5, z + 2, x + offset + 2, y + 5, z + 6, roofColor);
    addBlock(x + offset, y + 2, z + 4, "minecraft:chest");
  }
  addFill(x - 1, y + 1, z - 12, x + 1, y + 1, z + 12, "minecraft:gold_block");
}

function buildGasStation() {
  const { x, y, z } = GAS_STATION;
  addFill(x - 18, y, z - 14, x + 18, y, z + 14, "minecraft:polished_andesite");
  addFill(x - 16, y + 1, z - 12, x + 16, y + 1, z + 12, "minecraft:blackstone");
  addFill(x - 15, y + 7, z - 11, x + 15, y + 7, z + 11, "minecraft:red_concrete");
  for (let px = -10; px <= 10; px += 10) {
    addFill(x + px, y + 1, z - 4, x + px, y + 6, z - 4, "minecraft:emerald_block");
    addBlock(x + px, y + 4, z - 3, "minecraft:redstone_lamp");
  }
  addFill(x - 4, y + 1, z + 6, x + 4, y + 4, z + 10, "minecraft:bricks");
  addBlock(x, y + 2, z + 10, "minecraft:chest");
}

function enqueueStructures() {
  buildLoginLobby();
  buildSpawnHub();
  buildMapBoundary();
  buildRoads();
  buildSphere();
  buildMarket(MARKET_EAST, "minecraft:red_wool");
  buildMarket(MARKET_WEST, "minecraft:blue_wool");
  buildGasStation();
}

function startRunner() {
  if (runner !== null) return;
  const dimension = world.getDimension("overworld");
  runner = system.runInterval(() => {
    const budget = 600;
    for (let processed = 0; processed < budget && queue.length > 0; processed++) {
      const task = queue.shift();
      if (task.type === "fill") safeFill(dimension, task);
      if (task.type === "block") safeBlock(dimension, task);
    }
    if (queue.length !== 0) return;
    safeBlock(dimension, { x: MARKER.x, y: MARKER.y, z: MARKER.z, block: "minecraft:barrier" });
    system.clearRun(runner);
    runner = null;
    building = false;
    world.setDynamicProperty(DONE_KEY, "done");
    console.log("[Rustage] worldgen complete");
    world.sendMessage("§aRustage world generation complete.");
  }, 1);
}

function isBuilt() {
  if (world.getDynamicProperty(DONE_KEY) === "done") return true;
  try {
    const dimension = world.getDimension("overworld");
    const block = dimension.getBlockType(MARKER);
    return block?.id === "minecraft:barrier";
  } catch {
    return false;
  }
}

export function buildWorld() {
  if (building) return false;
  if (isBuilt()) {
    console.log(`[Rustage] worldgen skip ${DONE_KEY}=${world.getDynamicProperty(DONE_KEY)}`);
    world.setDynamicProperty(DONE_KEY, "done");
    return false;
  }
  building = true;
  queue.length = 0;
  enqueueStructures();
  world.setDynamicProperty(DONE_KEY, "building");
  console.log("[Rustage] worldgen started");
  world.sendMessage("§eRustage world generation started.");
  startRunner();
  return true;
}

export function initWorldgen() {
  world.afterEvents.worldLoad.subscribe(() => {
    buildWorld();
  });
}
