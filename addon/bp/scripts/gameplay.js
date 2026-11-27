import { world, system, ItemStack } from "@minecraft/server";
import { isAuthenticated } from "./accounts.js";
import { buildWorld } from "./worldgen.js";
import { GAS_STATION, RADIATION_CENTER, RADIATION_RADIUS } from "./config.js";
import { giveItem, findItem, removeItems, countItems, dropInventory, randomBetween } from "./inventory.js";
import { handleBuildCommand, handleHammerUse } from "./build.js";

const ITEM_AK = "rustage:ak47";
const ITEM_AMMO = "rustage:ammo";
const ITEM_SCRAP = "rustage:scrap";
const ITEM_METAL = "rustage:metal";
const ITEM_PILL = "rustage:rad_pill";
const ITEM_COIN = "rustage:market_coin";
const ITEM_GAS = "rustage:gas_can";
const ITEM_STONE = "rustage:stone";
const ITEM_WOOD = "rustage:wood";
const ITEM_HAMMER = "rustage:hammer";
const ITEM_BERRIES = "rustage:berries";
const ITEM_MEAT = "rustage:cooked_meat";
const ITEM_WATER = "rustage:water";

const welcomed = new Set();

const DROP_TABLE = {
  "minecraft:stone": { item: ITEM_STONE, min: 1, max: 3 },
  "minecraft:cobblestone": { item: ITEM_STONE, min: 1, max: 3 },
  "minecraft:andesite": { item: ITEM_STONE, min: 1, max: 3 },
  "minecraft:diorite": { item: ITEM_STONE, min: 1, max: 3 },
  "minecraft:granite": { item: ITEM_STONE, min: 1, max: 3 },
  "minecraft:deepslate": { item: ITEM_STONE, min: 1, max: 3 },
  "minecraft:gravel": { item: ITEM_STONE, min: 1, max: 2 },
  "minecraft:sand": { item: ITEM_STONE, min: 1, max: 2 },
  "minecraft:oak_log": { item: ITEM_WOOD, min: 2, max: 4 },
  "minecraft:spruce_log": { item: ITEM_WOOD, min: 2, max: 4 },
  "minecraft:birch_log": { item: ITEM_WOOD, min: 2, max: 4 },
  "minecraft:jungle_log": { item: ITEM_WOOD, min: 2, max: 4 },
  "minecraft:acacia_log": { item: ITEM_WOOD, min: 2, max: 4 },
  "minecraft:dark_oak_log": { item: ITEM_WOOD, min: 2, max: 4 },
  "minecraft:oak_planks": { item: ITEM_WOOD, min: 1, max: 2 },
  "minecraft:coal_ore": { item: ITEM_SCRAP, min: 2, max: 3 },
  "minecraft:deepslate_coal_ore": { item: ITEM_SCRAP, min: 2, max: 3 },
  "minecraft:iron_ore": { item: ITEM_METAL, min: 2, max: 3 },
  "minecraft:deepslate_iron_ore": { item: ITEM_METAL, min: 2, max: 3 },
  "minecraft:gold_ore": { item: ITEM_COIN, min: 2, max: 4 },
  "minecraft:deepslate_gold_ore": { item: ITEM_COIN, min: 2, max: 4 },
  "minecraft:diamond_ore": { item: ITEM_METAL, min: 4, max: 6 },
  "minecraft:deepslate_diamond_ore": { item: ITEM_METAL, min: 4, max: 6 },
  "minecraft:oak_leaves": { item: ITEM_BERRIES, min: 1, max: 2 },
  "minecraft:spruce_leaves": { item: ITEM_BERRIES, min: 1, max: 2 }
};

const DEATH_RESOURCES = [ITEM_STONE, ITEM_WOOD, ITEM_SCRAP, ITEM_METAL, ITEM_COIN, ITEM_AMMO, ITEM_PILL, ITEM_MEAT, ITEM_WATER];
const RUST_ITEM_USE = new Set([ITEM_HAMMER, ITEM_AK, ITEM_PILL, ITEM_GAS]);

function normalizedDirection(direction) {
  const length = Math.hypot(direction.x, direction.y, direction.z) || 1;
  return { x: direction.x / length, y: direction.y / length, z: direction.z / length };
}

function spreadDirection(direction, spread) {
  const noise = spread * 0.5;
  return normalizedDirection({
    x: direction.x + (Math.random() - 0.5) * noise,
    y: direction.y + (Math.random() - 0.5) * noise,
    z: direction.z + (Math.random() - 0.5) * noise
  });
}

function fireAk(player) {
  if (!removeItems(player, ITEM_AMMO, 1)) {
    player.sendMessage("§cНет патронов. Купи: !buy ammo");
    return;
  }
  const origin = { x: player.location.x, y: player.location.y + 1.55, z: player.location.z };
  const direction = spreadDirection(player.getViewDirection(), 0.055);
  const candidates = player.dimension.getEntities({ location: origin, maxDistance: 80 });
  let target = null;
  let targetDistance = Infinity;
  for (const entity of candidates) {
    if (entity.id === player.id) continue;
    const dx = entity.location.x - origin.x;
    const dy = entity.location.y + 0.8 - origin.y;
    const dz = entity.location.z - origin.z;
    const distance = Math.hypot(dx, dy, dz);
    if (distance < 0.5 || distance > 80) continue;
    const alignment = (dx * direction.x + dy * direction.y + dz * direction.z) / distance;
    if (alignment < 0.965 || distance >= targetDistance) continue;
    const wall = player.dimension.getBlockFromRay(origin, direction, { maxDistance: Math.max(1, distance - 0.6) });
    if (wall) continue;
    target = entity;
    targetDistance = distance;
  }
  player.dimension.spawnParticle("minecraft:explosion_emitter", {
    x: origin.x + direction.x * 1.5,
    y: origin.y + direction.y * 1.5,
    z: origin.z + direction.z * 1.5
  });
  if (target) {
    target.applyDamage(25, { damagingEntity: player });
    player.sendMessage("§aПопадание.");
  }
}

function useRadPill(player) {
  if (!removeItems(player, ITEM_PILL, 1)) {
    player.sendMessage("§cНет таблеток. Купи: !buy pill");
    return;
  }
  player.removeEffect("minecraft:wither");
  player.sendMessage("§aРадиация нейтрализована.");
}

function useGasCan(player) {
  const station = GAS_STATION;
  const dx = player.location.x - station.x;
  const dz = player.location.z - station.z;
  if (dx * dx + dz * dz > 400) {
    player.sendMessage("§cКанистра используется только на АЗС.");
    return;
  }
  if (!removeItems(player, ITEM_GAS, 1)) return;
  giveItem(player, ITEM_COIN, 8);
  player.sendMessage("§aКанистра сдана: +8 монет.");
}

function dismantleBuiltBlock(player, block) {
  if (!findItem(player, ITEM_HAMMER)) return false;
  const rewards = {
    "rustage:wood_floor": ITEM_WOOD,
    "rustage:stone_floor": ITEM_STONE,
    "rustage:metal_floor": ITEM_METAL,
    "rustage:wood_wall": ITEM_WOOD,
    "rustage:stone_wall": ITEM_STONE,
    "rustage:metal_wall": ITEM_METAL
  };
  const reward = rewards[block.typeId];
  if (!reward) return false;
  block.setType("minecraft:air");
  giveItem(player, reward, 1);
  player.sendMessage("§eПостройка разобрана киянкой.");
  return true;
}

function applyMining(playerId, dimensionId, location, typeId) {
  const player = world.getPlayers().find((candidate) => candidate.id === playerId);
  if (!player) return;
  const block = world.getDimension(dimensionId).getBlock(location);
  if (!block || block.typeId !== typeId) return;
  if (dismantleBuiltBlock(player, block)) return;
  const drop = DROP_TABLE[typeId];
  if (!drop) return;
  block.setType("minecraft:air");
  player.dimension.spawnItem(new ItemStack(drop.item, randomBetween(drop.min, drop.max)), {
    x: location.x + 0.5,
    y: location.y + 0.5,
    z: location.z + 0.5
  });
}

function handleMining(event) {
  const player = event.player;
  const block = event.block;
  if (!player || !block) return;
  event.cancel = true;
  if (!isAuthenticated(player)) return;
  const playerId = player.id;
  const dimensionId = player.dimension.id;
  const location = { x: block.location.x, y: block.location.y, z: block.location.z };
  const typeId = block.typeId;
  system.run(() => applyMining(playerId, dimensionId, location, typeId));
}

function dispatchItemUse(player, typeId) {
  if (!player || !isAuthenticated(player)) return;
  if (typeId === ITEM_HAMMER) handleHammerUse(player);
  else if (typeId === ITEM_AK) fireAk(player);
  else if (typeId === ITEM_PILL) useRadPill(player);
  else if (typeId === ITEM_GAS) useGasCan(player);
}

function handleItemUse(event) {
  const player = event.source;
  if (!player) return;
  if (!isAuthenticated(player)) {
    event.cancel = true;
    return;
  }
  const typeId = event.itemStack && event.itemStack.typeId;
  if (!typeId || !RUST_ITEM_USE.has(typeId)) return;
  event.cancel = true;
  const playerId = player.id;
  system.run(() => {
    const live = world.getPlayers().find((candidate) => candidate.id === playerId);
    if (live) dispatchItemUse(live, typeId);
  });
}

function handleRadInterval() {
  for (const player of world.getAllPlayers()) {
    if (!isAuthenticated(player)) continue;
    const dx = player.location.x - RADIATION_CENTER.x;
    const dz = player.location.z - RADIATION_CENTER.z;
    if (dx * dx + dz * dz <= RADIATION_RADIUS * RADIATION_RADIUS) {
      player.addEffect("minecraft:wither", 8, { amplifier: 0 });
      player.onScreenDisplay.setActionBar("§2☢ RADIATION — !buy pill");
    }
  }
}

function handleDeath(event) {
  const dead = event.deadPlayer || event.player || event.deadEntity;
  if (!dead) return;
  const playerId = dead.id;
  system.run(() => {
    const live = world.getPlayers().find((candidate) => candidate.id === playerId);
    if (!live) return;
    dropInventory(live, DEATH_RESOURCES);
    giveItem(live, ITEM_STONE, 12);
    giveItem(live, ITEM_WOOD, 12);
    giveItem(live, ITEM_BERRIES, 4);
    live.sendMessage("§eТы погиб, но выжил: получены камень, дерево и еда.");
  });
}

function giveKit(player) {
  if (!isAuthenticated(player)) return "§cСначала !register или !login.";
  giveItem(player, ITEM_HAMMER, 1);
  giveItem(player, ITEM_AK, 1);
  giveItem(player, ITEM_AMMO, 32);
  giveItem(player, ITEM_PILL, 2);
  giveItem(player, ITEM_STONE, 32);
  giveItem(player, ITEM_WOOD, 48);
  giveItem(player, ITEM_METAL, 12);
  giveItem(player, ITEM_SCRAP, 12);
  giveItem(player, ITEM_BERRIES, 6);
  giveItem(player, ITEM_MEAT, 6);
  giveItem(player, ITEM_WATER, 4);
  return "§aСтартовый набор Rustage выдан.";
}

export function ensureStarterKit(player) {
  if (!player || welcomed.has(player.id)) return false;
  if (!isAuthenticated(player)) return false;
  welcomed.add(player.id);
  giveKit(player);
  return true;
}

function sellItems(player) {
  if (!isAuthenticated(player)) return "§cСначала !register или !login.";
  let earned = 0;
  const scrap = countItems(player, ITEM_SCRAP);
  if (removeItems(player, ITEM_SCRAP, scrap)) earned += scrap;
  const metal = countItems(player, ITEM_METAL);
  if (removeItems(player, ITEM_METAL, metal)) earned += metal * 2;
  const stone = countItems(player, ITEM_STONE);
  if (removeItems(player, ITEM_STONE, stone)) earned += Math.floor(stone / 4);
  if (earned === 0) return "§cНечего продавать. Добывай руду, лом и камень.";
  giveItem(player, ITEM_COIN, earned);
  return `§aПродано за ${earned} монет.`;
}

function buyItem(player, item) {
  if (!isAuthenticated(player)) return "§cСначала !register или !login.";
  const offers = {
    ammo: { item: ITEM_AMMO, amount: 16, price: 8 },
    pill: { item: ITEM_PILL, amount: 2, price: 10 },
    gas: { item: ITEM_GAS, amount: 1, price: 20 },
    food: { item: ITEM_MEAT, amount: 4, price: 6 },
    water: { item: ITEM_WATER, amount: 4, price: 4 }
  };
  const offer = offers[item];
  if (!offer) return "§cКупить можно: ammo, pill, gas, food, water.";
  if (countItems(player, ITEM_COIN) < offer.price) return `§cНужно ${offer.price} монет.`;
  if (!removeItems(player, ITEM_COIN, offer.price)) return "§cНедостаточно монет.";
  giveItem(player, offer.item, offer.amount);
  return `§aКуплено: ${offer.amount} x ${offer.item} за ${offer.price} монет.`;
}

function radiationStatus(player) {
  if (!isAuthenticated(player)) return "§cСначала !register или !login.";
  const dx = player.location.x - RADIATION_CENTER.x;
  const dz = player.location.z - RADIATION_CENTER.z;
  const inside = dx * dx + dz * dz <= RADIATION_RADIUS * RADIATION_RADIUS;
  return inside ? "§cТы в радиационной зоне. Используй !buy pill." : "§aРадиации нет.";
}

export function initGameplay() {
  world.beforeEvents.playerBreakBlock.subscribe(handleMining);
  world.beforeEvents.itemUse.subscribe(handleItemUse);
  const deathEvents = world.afterEvents && world.afterEvents.playerDeath;
  if (deathEvents && typeof deathEvents.subscribe === "function") {
    deathEvents.subscribe(handleDeath);
  }
  const entityDieEvents = world.afterEvents && world.afterEvents.entityDie;
  if (entityDieEvents && typeof entityDieEvents.subscribe === "function") {
    entityDieEvents.subscribe((event) => {
      const entity = event.deadEntity || event.entity;
      if (entity && entity.typeId === "minecraft:player") handleDeath(entity);
    });
  }
  system.runInterval(handleRadInterval, 20);
}

export function handleGameCommand(player, rawMessage) {
  if (handleBuildCommand(player, rawMessage)) return true;
  const trimmed = String(rawMessage || "").trim();
  if (!trimmed) return false;
  const body = trimmed.startsWith("/") || trimmed.startsWith("!") ? trimmed.slice(1) : trimmed;
  const parts = body.split(/\s+/).filter(Boolean);
  const command = (parts.shift() || "").toLowerCase();
  let response = null;
  if (command === "kit") response = giveKit(player);
  if (command === "sell") response = sellItems(player);
  if (command === "buy") response = buyItem(player, (parts[0] || "").toLowerCase());
  if (command === "rad") response = radiationStatus(player);
  if (command === "build" && isAuthenticated(player)) response = "§6План постройки: !plan list, !plan wood_floor, !plan build, !plan upgrade.";
  if (command === "build" && !isAuthenticated(player)) response = "§cСначала !register или !login.";
  if (response === null) return false;
  player.sendMessage(response);
  return true;
}
