import { world } from "@minecraft/server";
import { ITEMS, RT_POINTS, WORLD_KEYS } from "./config.js";
import { buildMap } from "./worldgen.js";
import { giveItem } from "./utils.js";

const SHORT_ITEMS = {
  ak47: ITEMS.ak47,
  ammo: ITEMS.ammo556,
  ammo556: ITEMS.ammo556,
  syringe: ITEMS.syringe,
  bandage: ITEMS.bandage,
  wood: ITEMS.wood,
  stone: ITEMS.stone,
  metal: ITEMS.metal,
  sulfur: ITEMS.sulfur,
  charcoal: ITEMS.charcoal,
  cloth: ITEMS.cloth,
  gears: ITEMS.gears,
  tech: ITEMS.techTrash,
  tech_trash: ITEMS.techTrash,
  scrap: ITEMS.scrap,
};

function resolveItem(value) {
  if (!value) return undefined;
  if (value.startsWith("rust:")) return value;
  return SHORT_ITEMS[value];
}

function requirePlayer(event) {
  const entity = event.sourceEntity;
  if (!entity || entity.typeId !== "minecraft:player") return undefined;
  return entity;
}

function sendHelp(player) {
  player.sendMessage("§6Rustage commands§r");
  player.sendMessage("§7/scriptevent rust:give <item> [amount]§r");
  player.sendMessage("§7/scriptevent rust:kit§r");
  player.sendMessage("§7/scriptevent rust:ammo [amount]§r");
  player.sendMessage("§7/scriptevent rust:heal§r");
  player.sendMessage("§7/scriptevent rust:tprt <gas|sphere|factory|port>§r");
  player.sendMessage("§7/scriptevent rust:rt§r");
  player.sendMessage("§7/scriptevent rust:buildmap§r");
}

export function giveKit(player) {
  giveItem(player, ITEMS.ak47, 1);
  giveItem(player, ITEMS.ammo556, 90);
  giveItem(player, ITEMS.bandage, 5);
  giveItem(player, ITEMS.syringe, 2);
  giveItem(player, ITEMS.scrap, 10);
  player.sendMessage("§aСтартовый набор выдан.");
}

export function handleScriptEvent(event) {
  const player = requirePlayer(event);
  const [command, ...args] = event.message.trim().split(/\s+/);

  if (event.id === "rust:help") {
    if (player) sendHelp(player);
    return;
  }

  if (!player) return;

  if (event.id === "rust:give") {
    const typeId = resolveItem(args[0]);
    const amount = Math.max(1, Math.min(2304, Number(args[1] ?? 1) || 1));
    if (!typeId) {
      player.sendMessage("§cНеизвестный предмет. Пример: rust:give ak47 1");
      return;
    }
    giveItem(player, typeId, amount);
    player.sendMessage(`§aВыдано: ${typeId} x${amount}`);
    return;
  }

  if (event.id === "rust:kit") {
    giveKit(player);
    return;
  }

  if (event.id === "rust:ammo") {
    const amount = Math.max(1, Math.min(2304, Number(args[0] ?? 90) || 90));
    giveItem(player, ITEMS.ammo556, amount);
    player.sendMessage(`§aПатроны 5.56 x${amount}`);
    return;
  }

  if (event.id === "rust:heal") {
    const health = player.getComponent("minecraft:health");
    if (health) health.setCurrentValue(health.effectiveMax);
    player.addEffect("minecraft:saturation", 1, { amplifier: 10, showParticles: false });
    player.sendMessage("§aЗдоровье восстановлено.");
    return;
  }

  if (event.id === "rust:rt") {
    player.sendMessage("§6РТ точки§r");
    for (const point of RT_POINTS) {
      player.sendMessage(`§7${point.id}§r — ${point.name} (${point.x}, ${point.z})`);
    }
    return;
  }

  if (event.id === "rust:tprt") {
    const point = RT_POINTS.find((entry) => entry.id === args[0]);
    if (!point) {
      player.sendMessage("§cУкажи точку: gas, sphere, factory или port.");
      return;
    }
    player.teleport({ x: point.x, y: point.y + 1, z: point.z });
    player.sendMessage(`§aТелепорт: ${point.name}`);
    return;
  }

  if (event.id === "rust:buildmap") {
    world.setDynamicProperty(WORLD_KEYS.mapBuilt, false);
    buildMap();
    player.sendMessage("§aКарта перестроена.");
  }
}
