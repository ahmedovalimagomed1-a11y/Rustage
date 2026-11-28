import { BLOCKS, ITEMS } from "./config.js";
import { countItem, giveItem, playClick, removeItem } from "./utils.js";

const SCRAP_LOOT = [ITEMS.metal, ITEMS.gears, ITEMS.cloth, ITEMS.wood, ITEMS.stone];
const TECH_LOOT = [ITEMS.gears, ITEMS.metal, ITEMS.scrap, ITEMS.techTrash];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function recycle(player, input, pool, label) {
  if (countItem(player, input) <= 0) return false;
  removeItem(player, input, 1);
  const output = randomFrom(pool);
  giveItem(player, output, 1 + Math.floor(Math.random() * 3));
  player.playSound("random.anvil_use", { volume: 0.5, pitch: 1.2 });
  player.onScreenDisplay.setActionBar(`${label} переработан`);
  return true;
}

export function handleBlockInteract(event) {
  if (!event.isFirstEvent) return;
  const player = event.player;
  const block = event.block;

  if (block.typeId === BLOCKS.recycler) {
    if (recycle(player, ITEMS.scrap, SCRAP_LOOT, "Металлолом")) return;
    if (recycle(player, ITEMS.techTrash, TECH_LOOT, "Техлом")) return;
    player.onScreenDisplay.setActionBar("Нужен металлолом или техлом");
    playClick(player);
    return;
  }

  if (block.typeId === BLOCKS.toolCupboard) {
    player.onScreenDisplay.setActionBar("Шкаф инструментов: территория отмечена");
    playClick(player);
  }
}
