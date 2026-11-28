import { ItemStack } from "@minecraft/server";
import { ITEMS } from "./config.js";

const RESOURCE_DROPS = {
  "minecraft:stone": [ITEMS.stone, 1, 2],
  "minecraft:cobblestone": [ITEMS.stone, 1, 2],
  "minecraft:deepslate": [ITEMS.stone, 1, 2],
  "minecraft:oak_log": [ITEMS.wood, 1, 2],
  "minecraft:birch_log": [ITEMS.wood, 1, 2],
  "minecraft:spruce_log": [ITEMS.wood, 1, 2],
  "minecraft:jungle_log": [ITEMS.wood, 1, 2],
  "minecraft:acacia_log": [ITEMS.wood, 1, 2],
  "minecraft:dark_oak_log": [ITEMS.wood, 1, 2],
  "minecraft:iron_ore": [ITEMS.metal, 1, 2],
  "minecraft:deepslate_iron_ore": [ITEMS.metal, 1, 2],
  "minecraft:copper_ore": [ITEMS.metal, 1, 1],
  "minecraft:coal_ore": [ITEMS.charcoal, 1, 2],
  "minecraft:deepslate_coal_ore": [ITEMS.charcoal, 1, 2],
  "minecraft:gold_ore": [ITEMS.techTrash, 1, 1],
  "minecraft:deepslate_gold_ore": [ITEMS.techTrash, 1, 1],
  "minecraft:redstone_ore": [ITEMS.gears, 1, 1],
};

export function handleBlockBreak(event) {
  const drop = RESOURCE_DROPS[event.block.typeId];
  if (!drop) return;
  const [typeId, min, max] = drop;
  const amount = min + Math.floor(Math.random() * (max - min + 1));
  event.dimension.spawnItem(new ItemStack(typeId, amount), event.block.location);
}
