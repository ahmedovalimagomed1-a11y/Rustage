import { ItemStack } from "@minecraft/server";

export function inventory(player) {
  const component = player.getComponent("minecraft:inventory");
  return component && component.container && component.container.isValid ? component.container : null;
}

export function giveItem(player, typeId, amount) {
  const container = inventory(player);
  if (!container || amount <= 0) return;
  const leftover = container.addItem(new ItemStack(typeId, amount));
  if (leftover) player.dimension.spawnItem(leftover, player.location);
}

export function findItem(player, typeId) {
  const container = inventory(player);
  if (!container) return null;
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (item && item.typeId === typeId) return { container, slot, item };
  }
  return null;
}

export function removeItems(player, typeId, amount) {
  let remaining = amount;
  while (remaining > 0) {
    const found = findItem(player, typeId);
    if (!found) return false;
    const take = Math.min(found.item.amount, remaining);
    const left = found.item.amount - take;
    found.container.setItem(found.slot, left > 0 ? new ItemStack(found.item.typeId, left) : undefined);
    remaining -= take;
  }
  return true;
}

export function countItems(player, typeId) {
  const container = inventory(player);
  let total = 0;
  if (!container) return total;
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (item && item.typeId === typeId) total += item.amount;
  }
  return total;
}

export function clearInventory(player) {
  const container = inventory(player);
  if (!container) return;
  for (let slot = 0; slot < container.size; slot++) {
    if (container.getItem(slot)) container.setItem(slot, undefined);
  }
}

export function dropInventory(player, typeIds) {
  const container = inventory(player);
  if (!container) return;
  for (const typeId of typeIds) {
    const amount = countItems(player, typeId);
    if (amount <= 0) continue;
    removeItems(player, typeId, amount);
    player.dimension.spawnItem(new ItemStack(typeId, amount), player.location);
  }
}

export function randomBetween(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
