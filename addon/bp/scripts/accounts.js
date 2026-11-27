import { world } from "@minecraft/server";
import { createPasswordRecordAsync, verifyPasswordRecordAsync } from "./crypto.js";
import { LOGIN_LOBBY, SPAWN } from "./config.js";
import { clearInventory } from "./inventory.js";

const ACCOUNTS_KEY = "rustage:accounts:v1";
const CREATOR_KEY = "rustage:creator:v1";
const CREATOR_NAME = "mmallaccia";
const CREATOR_EMAIL = "Koshmarcar@gmail.com";
const ITERATIONS = 20000;
const SPAWN_POINT = SPAWN;

const sessions = new Map();
let accounts = {};
let creatorId = null;
let loaded = false;

export function initAccounts() {
  world.afterEvents.worldLoad.subscribe(() => {
    load();
  });
  world.afterEvents.playerLeave.subscribe((event) => {
    sessions.delete(event.playerId);
  });
}

function ensureLoaded() {
  if (!loaded) load();
}

function load() {
  loaded = true;
  try {
    const raw = world.getDynamicProperty(ACCOUNTS_KEY);
    accounts = raw && typeof raw === "string" ? JSON.parse(raw) : {};
    const creatorRecord = accounts[CREATOR_NAME];
    creatorId = creatorRecord && creatorRecord.identity ? creatorRecord.identity : null;
  } catch {
    accounts = {};
    creatorId = null;
  }
  if (!accounts || typeof accounts !== "object" || Array.isArray(accounts)) accounts = {};
}

function save() {
  world.setDynamicProperty(ACCOUNTS_KEY, JSON.stringify(accounts));
  world.setDynamicProperty(CREATOR_KEY, creatorId || "");
}

function normalizedName(name) {
  return String(name || "").trim().toLowerCase();
}

function accountKey(player) {
  return normalizedName(player.name) + ":" + (player.xuid || "offline");
}

function recordFor(player) {
  return accounts[normalizedName(player.name)];
}

export function isAuthenticated(player) {
  ensureLoaded();
  return sessions.get(player.id)?.active === true;
}

export function isCreator(player) {
  ensureLoaded();
  return normalizedName(player.name) === CREATOR_NAME;
}

export function enforceLoginLobby() {
  for (const player of world.getAllPlayers()) {
    if (isAuthenticated(player)) continue;
    const location = player.location;
    const dx = location.x - LOGIN_LOBBY.x;
    const dy = location.y - LOGIN_LOBBY.y;
    const dz = location.z - LOGIN_LOBBY.z;
    if (dx * dx + dy * dy + dz * dz > 16) {
      player.teleport(LOGIN_LOBBY);
    }
    clearInventory(player);
    player.onScreenDisplay.setActionBar("§cRustage: напиши !register пароль пароль или !login пароль");
  }
}

function register(player, password, confirmation, done) {
  const user = normalizedName(player.name);
  if (!user) return done("§cНекорректное имя игрока.");
  if (accounts[user]) return done("§cЭтот аккаунт уже зарегистрирован. Используй !login пароль.");
  if (password.length < 8) return done("§cПароль минимум 8 символов.");
  if (password !== confirmation) return done("§cПароли не совпадают.");
  const playerName = player.name;
  const playerId = player.id;
  const dimensionId = player.dimension.id;
  const seed = `${user}:${playerId}:${Date.now()}:${Math.random()}:${dimensionId}`;
  createPasswordRecordAsync(password, seed, accountKey(player), ITERATIONS, (record) => {
    accounts[user] = {
      user: playerName,
      identity: playerId,
      createdAt: Date.now(),
      ...record
    };
    if (normalizedName(playerName) === CREATOR_NAME) {
      creatorId = playerId;
      world.setDynamicProperty(CREATOR_KEY, creatorId);
    }
    world.setDynamicProperty(ACCOUNTS_KEY, JSON.stringify(accounts));
    sessions.set(playerId, { active: true, user, at: Date.now() });
    const live = world.getPlayers().find((candidate) => candidate.id === playerId);
    if (live) live.teleport(SPAWN_POINT);
    done("§aАккаунт создан. Пароль сохранён как salted PBKDF2-SHA256 hash. Команды: !admin, !kit. Добро пожаловать в Rustage.");
  });
}

function login(player, password, done) {
  const user = normalizedName(player.name);
  const record = recordFor(player);
  if (!record) return done("§cАккаунт не найден. Сначала !register пароль пароль.");
  const playerId = player.id;
  verifyPasswordRecordAsync(password, record, accountKey(player), (valid) => {
    if (!valid) return done("§cНеверный пароль.");
    sessions.set(playerId, { active: true, user, at: Date.now() });
    const live = world.getPlayers().find((candidate) => candidate.id === playerId);
    if (live) live.teleport(SPAWN_POINT);
    done("§aВход выполнен. С возвращением в Rustage.");
  });
}

function logout(player) {
  sessions.delete(player.id);
  player.teleport(LOGIN_LOBBY);
  return "§eВы вышли из аккаунта. !login пароль";
}

function resetAccount(player, targetName) {
  if (!isCreator(player)) return "§cКоманда только для создателя сервера.";
  const target = normalizedName(targetName);
  if (!accounts[target]) return "§cАккаунт не найден.";
  delete accounts[target];
  save();
  return `§eАккаунт ${target} сброшен. Игрок должен заново выполнить /register.`;
}

export function handleAccountCommand(player, rawMessage, done) {
  ensureLoaded();
  const trimmed = String(rawMessage || "").trim();
  if (!trimmed) return false;
  const body = trimmed.startsWith("/") || trimmed.startsWith("!") ? trimmed.slice(1) : trimmed;
  const parts = body.split(/\s+/).filter(Boolean);
  const command = (parts.shift() || "").toLowerCase();
  const respond = (text) => {
    if (typeof done === "function") done(text);
    else player.sendMessage(text);
  };
  let response = null;
  if (command === "register" || command === "reg") {
    register(player, parts[0] || "", parts[1] || "", respond);
    return true;
  } else if (command === "login") {
    login(player, parts[0] || "", respond);
    return true;
  } else if (command === "logout") {
    response = logout(player);
  } else if (command === "creator") {
    response = `§6Rustage создан: ${CREATOR_NAME} (${CREATOR_EMAIL})`;
  } else if (command === "reset" && isCreator(player)) {
    response = resetAccount(player, parts[0] || "");
  } else if (command === "help" || command === "rustage") {
    response = "§6Rustage: !register пароль пароль, !login пароль, !logout, !creator, !kit, !sell, !buy ammo|pill|gas|food|water, !rad, !plan list|build|upgrade, !admin";
  }
  if (response === null) return false;
  respond(response);
  return true;
}
