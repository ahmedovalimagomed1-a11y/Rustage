import { GameMode, ItemStack } from "@minecraft/server";
import { isAuthenticated, isCreator } from "./accounts.js";

const ADMIN_COMMANDS = new Set([
  "admin",
  "ahelp",
  "gm",
  "gmc",
  "gms",
  "gma",
  "gmsp",
  "give",
  "tp",
  "teleport",
  "heal",
  "clear"
]);

const VANILLA_CHEAT_COMMANDS = new Set([
  "gamemode",
  "gmc",
  "gms",
  "gma",
  "gmsp",
  "give",
  "item",
  "replaceitem",
  "teleport",
  "tp",
  "clear",
  "effect",
  "enchant",
  "xp",
  "experience",
  "setblock",
  "fill",
  "clone",
  "structure",
  "summon",
  "kill",
  "time",
  "weather",
  "gamerule",
  "difficulty",
  "whitelist",
  "allowlist",
  "save",
  "stop",
  "spawnpoint",
  "locate",
  "playsound",
  "music",
  "title",
  "tellraw",
  "trigger",
  "seed"
]);

const ADMIN_HELP = [
  "§6Rustage admin:",
  "§e!gmc §7творческий",
  "§e!gms §7выживание",
  "§e!gma §7приключение",
  "§e!gmsp §7наблюдатель",
  "§e!gm <creative|survival|adventure|spectator>",
  "§e!give <item_id> [amount]",
  "§e!tp <x> <y> <z>",
  "§e!heal",
  "§e!clear",
  "§e!build §7пересобрать карту",
  "§e!reset <name> §7сбросить аккаунт"
].join("\n");

function parseCommand(rawMessage) {
  const trimmed = String(rawMessage || "").trim();
  if (!trimmed) return null;
  const body = trimmed.startsWith("/") || trimmed.startsWith("!") ? trimmed.slice(1) : trimmed;
  const parts = body.split(/\s+/).filter(Boolean);
  return parts.length ? parts : null;
}

function inventory(player) {
  const component = player.getComponent("minecraft:inventory");
  return component && component.container && component.container.isValid ? component.container : null;
}

function resolveMode(token) {
  const mode = String(token || "").toLowerCase();
  if (mode === "creative" || mode === "c" || mode === "gmc") return GameMode.Creative;
  if (mode === "survival" || mode === "s" || mode === "gms") return GameMode.Survival;
  if (mode === "adventure" || mode === "a" || mode === "gma") return GameMode.Adventure;
  if (mode === "spectator" || mode === "sp" || mode === "gmsp") return GameMode.Spectator;
  return null;
}

function setMode(player, mode) {
  if (!mode) return "§cРежим: creative, survival, adventure, spectator.";
  player.setGameMode(mode);
  return `§aРежим установлен: ${mode}.`;
}

function giveItem(player, parts) {
  const typeId = String(parts[0] || "").toLowerCase();
  if (!/^[a-z0-9_.:-]+$/.test(typeId)) return "§cНекорректный item id.";
  const amount = parts[1] === undefined ? 1 : Number(parts[1]);
  if (!Number.isFinite(amount) || amount < 1 || amount > 6400) return "§cКоличество 1..6400.";
  try {
    const container = inventory(player);
    if (!container) return "§cИнвентарь недоступен.";
    const leftover = container.addItem(new ItemStack(typeId, Math.floor(amount)));
    if (leftover) player.dimension.spawnItem(leftover, player.location);
    return `§aВыдано: ${Math.floor(amount)} x ${typeId}.`;
  } catch {
    return "§cНеизвестный item id.";
  }
}

function teleportPlayer(player, parts) {
  const values = parts.slice(0, 3).map(Number);
  if (values.length !== 3 || values.some((value) => !Number.isFinite(value))) {
    return "§cФормат: !tp <x> <y> <z>";
  }
  const [x, y, z] = values.map((value) => Math.max(-3000000, Math.min(3000000, value)));
  player.teleport({ x, y, z });
  return `§aТелепорт: ${x}, ${y}, ${z}.`;
}

function healPlayer(player) {
  player.removeEffect("minecraft:wither");
  player.removeEffect("minecraft:poison");
  player.addEffect("minecraft:regeneration", 5, { amplifier: 2 });
  return "§aЗдоровье восстановлено.";
}

function clearInventory(player) {
  const container = inventory(player);
  if (!container) return "§cИнвентарь недоступен.";
  container.clearAll();
  return "§aИнвентарь очищен.";
}

export function handleAdminCommand(player, rawMessage) {
  const parts = parseCommand(rawMessage);
  if (!parts) return false;
  const command = (parts.shift() || "").toLowerCase();
  const isCustom = ADMIN_COMMANDS.has(command);
  const isVanillaCheat = VANILLA_CHEAT_COMMANDS.has(command);
  if (!isCustom && !isVanillaCheat) return false;

  if (!isAuthenticated(player) || !isCreator(player)) {
    player.sendMessage("§cКоманда только для создателя сервера: mmallaccia.");
    return true;
  }

  if (command === "admin" || command === "ahelp") {
    player.sendMessage(ADMIN_HELP);
    return true;
  }
  if (command === "gmc") {
    player.sendMessage(setMode(player, GameMode.Creative));
    return true;
  }
  if (command === "gms") {
    player.sendMessage(setMode(player, GameMode.Survival));
    return true;
  }
  if (command === "gma") {
    player.sendMessage(setMode(player, GameMode.Adventure));
    return true;
  }
  if (command === "gmsp") {
    player.sendMessage(setMode(player, GameMode.Spectator));
    return true;
  }
  if (command === "gm") {
    player.sendMessage(setMode(player, resolveMode(parts[0] || "")));
    return true;
  }
  if (command === "give") {
    player.sendMessage(giveItem(player, parts));
    return true;
  }
  if (command === "tp" || command === "teleport") {
    player.sendMessage(teleportPlayer(player, parts));
    return true;
  }
  if (command === "heal") {
    player.sendMessage(healPlayer(player));
    return true;
  }
  if (command === "clear") {
    player.sendMessage(clearInventory(player));
    return true;
  }
  return false;
}
