import { system, world } from "@minecraft/server";
import { SPAWN, WORLD_KEYS } from "./config.js";
import { handleScriptEvent, giveKit } from "./commands.js";
import { handleMedicalUse } from "./medical.js";
import { handleBlockInteract } from "./recycler.js";
import { startRadiation } from "./radiation.js";
import { handleBlockBreak } from "./resources.js";
import { handleWeaponUse } from "./weapons.js";
import { buildMap } from "./worldgen.js";

world.afterEvents.worldInitialize.subscribe(() => {
  system.run(() => buildMap());
});

world.afterEvents.playerSpawn.subscribe((event) => {
  if (!event.initialSpawn) return;
  const player = event.player;
  system.run(() => {
    player.teleport(SPAWN);
    if (!player.getDynamicProperty(WORLD_KEYS.joined)) {
      giveKit(player);
      player.setDynamicProperty(WORLD_KEYS.joined, true);
    }
    player.sendMessage("§6Rustage 1.21.50§r — остров, 4 РТ точки, AK-47.");
    player.sendMessage("§7AK-47: ПКМ — огонь, присесть + ПКМ — перезарядка.§r");
    player.sendMessage("§7/scriptevent rust:help — команды.§r");
  });
});

world.afterEvents.itemUse.subscribe(handleWeaponUse);
world.afterEvents.itemUse.subscribe(handleMedicalUse);
world.afterEvents.playerInteractWithBlock.subscribe(handleBlockInteract);
world.afterEvents.playerBreakBlock.subscribe(handleBlockBreak);
system.afterEvents.scriptEventReceive.subscribe(handleScriptEvent);

startRadiation();
system.runTimeout(() => buildMap(), 40);
