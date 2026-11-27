import { world, system } from "@minecraft/server";
import { initAccounts, handleAccountCommand, enforceLoginLobby } from "./accounts.js";
import { handleAdminCommand } from "./admin.js";
import { initGameplay, handleGameCommand, ensureStarterKit } from "./gameplay.js";
import { initWorldgen, buildWorld } from "./worldgen.js";

function isGameCommand(message) {
  const body = String(message || "").trim().replace(/^[!/]/, "").split(/\s+/)[0].toLowerCase();
  return ["kit", "sell", "buy", "rad", "build", "plan", "bp"].includes(body);
}

function handleChat(player, message, event) {
  if (!player) return;
  const body = String(message || "").trim().replace(/^[!/]/, "");
  const authCommand = /^(register|reg|login)\b/i.test(body);
  const handledAccount = handleAdminCommand(player, message) || handleAccountCommand(player, message, (response) => {
    const live = world.getPlayers().find((candidate) => candidate.id === player.id);
    if (!live) return;
    live.sendMessage(response);
    if (authCommand) ensureStarterKit(live);
  });
  const handledGame = !handledAccount && isGameCommand(message);
  if (handledGame) system.run(() => handleGameCommand(player, message));
  if ((handledAccount || handledGame) && event) event.cancel = true;
}

initAccounts();
initGameplay();
initWorldgen();

const beforeChat = world.beforeEvents && world.beforeEvents.chatSend;
if (beforeChat && typeof beforeChat.subscribe === "function") {
  beforeChat.subscribe((event) => {
    handleChat(event.sender || event.player, event.message, event);
  });
} else {
  const afterChat = world.afterEvents && world.afterEvents.chatSend;
  if (afterChat && typeof afterChat.subscribe === "function") {
    afterChat.subscribe((event) => {
      handleChat(event.sender || event.player, event.message, event);
    });
  }
}

system.runInterval(enforceLoginLobby, 20);
system.runTimeout(() => {
  buildWorld();
  console.log("[Rustage] scripts online");
  world.sendMessage("§6Rustage загружен. !register пароль пароль | !login пароль | !help");
}, 20);
