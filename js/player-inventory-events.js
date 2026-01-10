import {ServerEvent} from "./constants/server_events.js";

function normalizeSlotsForUi(container) {
  if (!container) return container;
  const slots = container.slots;
  if (Array.isArray(slots)) return container;
  if (slots && typeof slots === "object") {
    return { ...container, slots: Object.values(slots) };
  }
  return container;
}

export function initPlayerInventoryEvents() {
  registerGnoSysServerEventHandler(ServerEvent.PLAYER_UPDATE, playerInfo => {
    try {
      window.electron.persistSaveData(playerInfo);
    } catch (error) {
      console.error("COULD NOT PARSE PLAYER DATA");
    }
    if (playerInfo?.name) {
      window.playerName = playerInfo.name;
    }
    window.playerInventory = normalizeSlotsForUi(playerInfo.inventory || null);
    window.dispatchEvent(
      new CustomEvent("player-inventory-updated", { detail: window.playerInventory })
    );
  });

  registerGnoSysServerEventHandler(ServerEvent.HEAP_UPDATE, heapInfo => {
    try {
      console.log("HEAP UPDATE");
      const heapOwner = heapInfo?.owner_name || window.playerName || "unknown";
      window.electron.persistHeapData({ name: heapOwner, heap: heapInfo });
    } catch (error) {
      console.error("COULD NOT PARSE PLAYER DATA");
    }
    window.playerHeap = normalizeSlotsForUi(heapInfo || null);
    window.dispatchEvent(
      new CustomEvent("player-heap-updated", { detail: window.playerHeap })
    );
  });
}
