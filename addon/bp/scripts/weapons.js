import { system } from "@minecraft/server";
import {
  BULLET_DAMAGE,
  BULLET_SPEED,
  FIRE_COOLDOWN_TICKS,
  ITEMS,
  MAG_SIZE,
  RELOAD_TICKS,
  WORLD_KEYS,
} from "./config.js";
import { add, countItem, playClick, removeItem } from "./utils.js";

function getMag(player) {
  const value = player.getDynamicProperty(WORLD_KEYS.mag);
  return typeof value === "number" ? value : MAG_SIZE;
}

function setMag(player, value) {
  player.setDynamicProperty(WORLD_KEYS.mag, Math.max(0, Math.min(MAG_SIZE, value)));
}

function reload(player) {
  const now = system.currentTick;
  const until = player.getDynamicProperty(WORLD_KEYS.reloadUntil);
  if (typeof until === "number" && now < until) return;

  const mag = getMag(player);
  const needed = MAG_SIZE - mag;
  if (needed <= 0) {
    player.onScreenDisplay.setActionBar("Магазин полон");
    playClick(player);
    return;
  }

  const available = countItem(player, ITEMS.ammo556);
  if (available < needed) {
    player.onScreenDisplay.setActionBar(`Нужно ${needed} патронов 5.56`);
    playClick(player);
    return;
  }

  removeItem(player, ITEMS.ammo556, needed);
  setMag(player, MAG_SIZE);
  player.setDynamicProperty(WORLD_KEYS.reloadUntil, now + RELOAD_TICKS);
  player.playSound("rust.ak47.reload", { volume: 0.9, pitch: 1.0 });
  player.onScreenDisplay.setActionBar("Перезарядка...");
}

function shoot(player) {
  const now = system.currentTick;
  const until = player.getDynamicProperty(WORLD_KEYS.reloadUntil);
  if (typeof until === "number" && now < until) return;

  const lastShot = player.getDynamicProperty(WORLD_KEYS.lastShot);
  if (typeof lastShot === "number" && now - lastShot < FIRE_COOLDOWN_TICKS) return;

  const mag = getMag(player);
  if (mag <= 0) {
    player.onScreenDisplay.setActionBar("Магазин пуст — присядь и ПКМ для перезарядки");
    playClick(player);
    return;
  }

  const head = player.getHeadLocation();
  const direction = player.getViewDirection();
  const origin = add(head, direction, 0.9);
  let bullet;
  try {
    bullet = player.dimension.spawnEntity("rust:bullet", origin);
  } catch (error) {
    console.warn(`[Rustage] bullet spawn failed: ${error}`);
    return;
  }

  const projectile = bullet.getComponent("minecraft:projectile");
  if (!projectile) {
    bullet.remove();
    return;
  }

  projectile.owner = player;
  projectile.shoot(
    {
      x: direction.x * BULLET_SPEED,
      y: direction.y * BULLET_SPEED,
      z: direction.z * BULLET_SPEED,
    },
    { uncertainty: 0.015 },
  );

  setMag(player, mag - 1);
  player.setDynamicProperty(WORLD_KEYS.lastShot, now);
  player.playSound("rust.ak47.fire", { volume: 1.0, pitch: 1.0 });
  player.onScreenDisplay.setActionBar(`AK-47  ${mag - 1}/${MAG_SIZE}  |  урон ${BULLET_DAMAGE}`);
}

export function handleWeaponUse(event) {
  const player = event.source;
  const item = event.itemStack;
  if (!item || item.typeId !== ITEMS.ak47) return;

  if (player.isSneaking) {
    reload(player);
    return;
  }

  shoot(player);
}
