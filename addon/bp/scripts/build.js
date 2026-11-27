import { isAuthenticated } from "./accounts.js";
import { countItems, removeItems } from "./inventory.js";

const ITEM_WOOD = "rustage:wood";
const ITEM_STONE = "rustage:stone";
const ITEM_METAL = "rustage:metal";
const ITEM_SCRAP = "rustage:scrap";
const ITEM_HAMMER = "rustage:hammer";

const PLANS = {
  wood_floor: { block: "rustage:wood_floor", item: ITEM_WOOD, amount: 1, label: "деревянный пол" },
  stone_floor: { block: "rustage:stone_floor", item: ITEM_STONE, amount: 1, label: "каменный пол" },
  metal_floor: { block: "rustage:metal_floor", item: ITEM_METAL, amount: 1, label: "металлический пол" },
  wood_wall: { block: "rustage:wood_wall", item: ITEM_WOOD, amount: 2, label: "деревянная стена" },
  stone_wall: { block: "rustage:stone_wall", item: ITEM_STONE, amount: 2, label: "каменная стена" },
  metal_wall: { block: "rustage:metal_wall", item: ITEM_METAL, amount: 2, label: "металлическая стена" }
};

const TIER_FLOOR = { wood: "wood_floor", stone: "stone_floor", metal: "metal_floor" };
const TIER_WALL = { wood: "wood_wall", stone: "stone_wall", metal: "metal_wall" };

const UPGRADE = {
  "rustage:wood_floor": { block: "rustage:stone_floor", item: ITEM_STONE, amount: 1 },
  "rustage:wood_wall": { block: "rustage:stone_wall", item: ITEM_STONE, amount: 2 },
  "rustage:stone_floor": { block: "rustage:metal_floor", item: ITEM_METAL, amount: 1 },
  "rustage:stone_wall": { block: "rustage:metal_wall", item: ITEM_METAL, amount: 2 }
};

const PLAN_KEY = "rustage:buildplan:v1";

function getPlan(player) {
  try {
    const saved = player.getDynamicProperty(PLAN_KEY);
    if (typeof saved === "string" && PLANS[saved]) return saved;
  } catch {}
  return "wood_floor";
}

function setPlan(player, plan) {
  player.setDynamicProperty(PLAN_KEY, plan);
}

function planList() {
  return Object.keys(PLANS).join(", ");
}

function canAfford(player, item, amount) {
  return countItems(player, item) >= amount;
}

function blockAt(dimension, location) {
  try {
    return dimension.getBlockType(location).id;
  } catch {
    return "minecraft:air";
  }
}

function targetFromView(player, maxDistance = 8) {
  const origin = { x: player.location.x, y: player.location.y + 1.55, z: player.location.z };
  const direction = player.getViewDirection();
  const length = Math.hypot(direction.x, direction.y, direction.z) || 1;
  const ray = { x: direction.x / length, y: direction.y / length, z: direction.z / length };
  const target = player.dimension.getBlockFromRay(origin, ray, { maxDistance });
  if (!target) return null;
  return { location: target.location, block: target, direction: ray };
}

function placementLocation(target) {
  const { location, direction } = target;
  const x = location.x + (Math.abs(direction.x) > 0.45 ? Math.sign(direction.x) : 0);
  const y = location.y + (direction.y > 0.55 ? 1 : direction.y < -0.55 ? -1 : 0);
  const z = location.z + (Math.abs(direction.z) > 0.45 ? Math.sign(direction.z) : 0);
  return { x, y, z };
}

function placePlanBlock(player) {
  const target = targetFromView(player);
  if (!target) return "§cПосмотри на блок, рядом с которым строить.";
  const location = placementLocation(target);
  if (blockAt(player.dimension, location) !== "minecraft:air") {
    location.y = target.location.y + 1;
    if (blockAt(player.dimension, location) !== "minecraft:air") return "§cМесто для стройки занято.";
  }
  const plan = PLANS[getPlan(player)];
  if (!canAfford(player, plan.item, plan.amount)) {
    return `§cНужно ${plan.amount} x ${plan.item}. Добывай ресурсы.`;
  }
  if (!removeItems(player, plan.item, plan.amount)) return "§cНе хватает материалов.";
  player.dimension.setBlockType(location, plan.block);
  return `§aПоставлено: ${plan.label}.`;
}

function upgradeTarget(player) {
  const target = targetFromView(player);
  if (!target) return "§cПосмотри на постройку Rustage.";
  const upgrade = UPGRADE[target.block.typeId];
  if (!upgrade) return "§cЭту постройку нельзя улучшить киянкой.";
  if (!canAfford(player, upgrade.item, upgrade.amount)) {
    return `§cДля улучшения нужно ${upgrade.amount} x ${upgrade.item}.`;
  }
  if (!removeItems(player, upgrade.item, upgrade.amount)) return "§cНе хватает материалов.";
  player.dimension.setBlockType(target.location, upgrade.block);
  return "§aПостройка улучшена.";
}

export function handleHammerUse(player) {
  if (!player || !isAuthenticated(player)) return false;
  const container = player.getComponent("minecraft:inventory");
  if (!container || !container.container || !container.container.isValid) return false;
  let hasHammer = false;
  for (let slot = 0; slot < container.container.size; slot++) {
    const item = container.container.getItem(slot);
    if (item && item.typeId === ITEM_HAMMER) {
      hasHammer = true;
      break;
    }
  }
  if (!hasHammer) return false;
  const target = targetFromView(player);
  if (target && UPGRADE[target.block.typeId]) player.sendMessage(upgradeTarget(player));
  else player.sendMessage(placePlanBlock(player));
  return true;
}

function buildBase(player) {
  const planName = getPlan(player);
  const tier = planName.split("_")[0];
  const floorPlan = PLANS[TIER_FLOOR[tier]];
  const wallPlan = PLANS[TIER_WALL[tier]];
  const floorCount = 9;
  const wallCount = 14;
  const floorCost = floorPlan.amount * floorCount;
  const wallCost = wallPlan.amount * wallCount;
  const totalCost = floorCost + wallCost;
  if (countItems(player, floorPlan.item) < totalCost) {
    return `§cДля плана ${tier} нужно ${totalCost} x ${floorPlan.item}.`;
  }
  if (!removeItems(player, floorPlan.item, totalCost)) return "§cНе хватает материалов.";
  const cx = Math.floor(player.location.x);
  const cy = Math.floor(player.location.y) - 1;
  const cz = Math.floor(player.location.z);
  const dimension = player.dimension;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      dimension.setBlockType({ x: cx + dx, y: cy, z: cz + dz }, floorPlan.block);
    }
  }
  for (let level = 1; level <= 2; level++) {
    for (let dx = -1; dx <= 1; dx++) {
      dimension.setBlockType({ x: cx + dx, y: cy + level, z: cz - 1 }, wallPlan.block);
      if (!(dx === 0 && level === 1)) {
        dimension.setBlockType({ x: cx + dx, y: cy + level, z: cz + 1 }, wallPlan.block);
      }
    }
    dimension.setBlockType({ x: cx - 1, y: cy + level, z: cz }, wallPlan.block);
    dimension.setBlockType({ x: cx + 1, y: cy + level, z: cz }, wallPlan.block);
  }
  player.teleport({ x: cx + 0.5, y: cy + 1, z: cz + 0.5 });
  return `§aПлан ${tier} построен: пол 3x3, стены 2 блока, вход с юга.`;
}

export function handleBuildCommand(player, rawMessage) {
  if (!player || !isAuthenticated(player)) return false;
  const trimmed = String(rawMessage || "").trim();
  if (!trimmed) return false;
  const parts = trimmed.replace(/^[!/]/, "").split(/\s+/).filter(Boolean);
  const command = (parts.shift() || "").toLowerCase();
  if (command !== "plan" && command !== "bp") return false;
  const arg = (parts[0] || "").toLowerCase();
  if (!arg || arg === "list") {
    player.sendMessage(`§6Планы Rustage: ${planList()}. Текущий: ${getPlan(player)}.`);
    return true;
  }
  if (PLANS[arg]) {
    setPlan(player, arg);
    player.sendMessage(`§aВыбран план: ${PLANS[arg].label}. Киянкой ставь блоки.`);
    return true;
  }
  if (arg === "build") {
    player.sendMessage(buildBase(player));
    return true;
  }
  if (arg === "upgrade") {
    player.sendMessage(upgradeTarget(player));
    return true;
  }
  player.sendMessage(`§cНеизвестный план. Доступно: ${planList()}, build, upgrade.`);
  return true;
}

export function initBuilding() {}
