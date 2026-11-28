import { ItemStack } from "@minecraft/server";

export function getInventory(player) {
  return player.getComponent("minecraft:inventory")?.container;
}

export function getSelectedItem(player) {
  const inventory = getInventory(player);
  if (!inventory) return undefined;
  return inventory.getItem(player.selectedSlotIndex);
}

export function countItem(player, typeId) {
  const inventory = getInventory(player);
  if (!inventory) return 0;
  let total = 0;
  for (let slot = 0; slot < inventory.size; slot++) {
    const stack = inventory.getItem(slot);
    if (stack?.typeId === typeId) total += stack.amount;
  }
  return total;
}

export function removeItem(player, typeId, amount) {
  const inventory = getInventory(player);
  if (!inventory) return 0;
  let left = amount;
  for (let slot = 0; slot < inventory.size && left > 0; slot++) {
    const stack = inventory.getItem(slot);
    if (stack?.typeId !== typeId) continue;
    const take = Math.min(stack.amount, left);
    stack.amount -= take;
    left -= take;
    inventory.setItem(slot, stack.amount > 0 ? stack : undefined);
  }
  return amount - left;
}

export function giveItem(player, typeId, amount) {
  const inventory = getInventory(player);
  if (!inventory) return false;
  const stack = new ItemStack(typeId, amount);
  const leftover = inventory.addItem(stack);
  if (leftover) player.dimension.spawnItem(leftover, player.location);
  return true;
}

export function consumeSelected(player, amount = 1) {
  const inventory = getInventory(player);
  if (!inventory) return false;
  const stack = inventory.getItem(player.selectedSlotIndex);
  if (!stack) return false;
  if (stack.amount < amount) return false;
  stack.amount -= amount;
  inventory.setItem(player.selectedSlotIndex, stack.amount > 0 ? stack : undefined);
  return true;
}

export function distance2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function add(a, b, scale = 1) {
  return { x: a.x + b.x * scale, y: a.y + b.y * scale, z: a.z + b.z * scale };
}

export function safeRunCommand(dimension, command) {
  try {
    return dimension.runCommand(command);
  } catch (error) {
    console.warn(`[Rustage] command failed: ${command} :: ${error}`);
    return undefined;
  }
}

export function setBlockSafe(dimension, x, y, z, typeId) {
  try {
    const block = dimension.getBlock({ x, y, z });
    if (block) block.setType(typeId);
  } catch (error) {
    console.warn(`[Rustage] setBlock failed at ${x},${y},${z}: ${error}`);
  }
}

export function playClick(player) {
  player.playSound("random.click", { volume: 0.35, pitch: 1.2 });
}
