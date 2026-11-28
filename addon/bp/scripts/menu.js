import { ActionFormData } from "@minecraft/server-ui";
import { system, world } from "@minecraft/server";
import { ITEMS, RT_POINTS, WORLD_KEYS } from "./config.js";
import { giveKit } from "./commands.js";
import { giveItem } from "./utils.js";
import { buildMap } from "./worldgen.js";

function showRtMenu(player) {
  const form = new ActionFormData()
    .title("РТ точки")
    .body("Выбери точку для телепорта.");
  for (const point of RT_POINTS) form.button(`${point.name}\n§7${point.x}, ${point.z}`);
  form.show(player).then((response) => {
    if (response.canceled) return;
    const point = RT_POINTS[response.selection];
    if (!point) return;
    player.teleport({ x: point.x, y: point.y + 1, z: point.z });
    player.sendMessage(`§aТелепорт: ${point.name}`);
  }).catch(() => {});
}

function showHelp(player) {
  player.sendMessage("§6Rustage PDA§r");
  player.sendMessage("§7КПК: набор, патроны, РТ, карта.");
  player.sendMessage("§7AK-47: ПКМ — огонь, присесть + ПКМ — перезарядка.");
  player.sendMessage("§7Recycler: положи ресурсы и нажми ПКМ.");
}

export function handlePdaUse(event) {
  if (event.itemStack?.typeId !== ITEMS.pda) return;
  const player = event.source;
  const form = new ActionFormData()
    .title("КПК Rustage")
    .body("§7Остров, 4 РТ точки, AK-47.\nВыбери действие.")
    .button("Стартовый набор")
    .button("Патроны 5.56 x90")
    .button("Телепорт к РТ")
    .button("Перестроить карту")
    .button("Помощь");

  form.show(player).then((response) => {
    if (response.canceled) return;
    switch (response.selection) {
      case 0:
        giveKit(player);
        break;
      case 1:
        giveItem(player, ITEMS.ammo556, 90);
        player.sendMessage("§aПатроны 5.56 x90");
        break;
      case 2:
        showRtMenu(player);
        break;
      case 3:
        world.setDynamicProperty(WORLD_KEYS.mapBuilt, false);
        system.run(() => buildMap());
        player.sendMessage("§aКарта перестроена.");
        break;
      case 4:
        showHelp(player);
        break;
    }
  }).catch((error) => {
    player.sendMessage(`§cКПК недоступен: ${error}`);
  });
}
