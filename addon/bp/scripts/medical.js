import { ITEMS } from "./config.js";
import { consumeSelected, playClick } from "./utils.js";

function heal(player, amount) {
  const health = player.getComponent("minecraft:health");
  if (!health) return false;
  if (health.currentValue >= health.effectiveMax) {
    player.onScreenDisplay.setActionBar("Здоровье полное");
    playClick(player);
    return false;
  }
  health.setCurrentValue(Math.min(health.effectiveMax, health.currentValue + amount));
  return true;
}

export function handleMedicalUse(event) {
  const player = event.source;
  const item = event.itemStack;
  if (!item) return;

  if (item.typeId === ITEMS.syringe) {
    if (!consumeSelected(player, 1)) return;
    heal(player, 8);
    player.addEffect("minecraft:regeneration", 80, { amplifier: 0, showParticles: false });
    player.playSound("random.drink", { volume: 0.8, pitch: 1.1 });
    player.onScreenDisplay.setActionBar("Шприц использован");
    return;
  }

  if (item.typeId === ITEMS.bandage) {
    if (!consumeSelected(player, 1)) return;
    heal(player, 4);
    player.playSound("random.bandage", { volume: 0.8, pitch: 1.0 });
    player.onScreenDisplay.setActionBar("Бинт использован");
  }
}
