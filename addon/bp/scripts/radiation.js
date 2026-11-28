import { system, world } from "@minecraft/server";
import { RT_POINTS } from "./config.js";
import { distance2D } from "./utils.js";

export function startRadiation() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      if (player.dimension.id !== "minecraft:overworld") continue;
      for (const point of RT_POINTS) {
        if (distance2D(player.location, point) > point.radius) continue;
        player.addEffect("minecraft:wither", 60, { amplifier: 0, showParticles: false });
        player.addEffect("minecraft:nausea", 100, { amplifier: 0, showParticles: false });
        player.onScreenDisplay.setActionBar(`Радиация: ${point.name}`);
        break;
      }
    }
  }, 40);
}
