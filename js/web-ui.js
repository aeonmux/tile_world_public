import "./util/ui-decorator.js";
import "./components/mod.js";
import {ServerEvent} from "./constants/server_events.js";

async function prefetch() {
  let items = await window.electron.prefetch();
  gnoSysTransmitClientEvent("RegisterItems", JSON.stringify(items));
}

function init() {
  prefetch();
  handleFirstEvent();
  initAutoSave();
}

function showControlToasts() {
  document.querySelectorAll('#control-toast-container .toast')
      .forEach((toastEl, idx) => {
        const toast = new bootstrap.Toast(toastEl);
        setTimeout(() => toast.show(), idx * 500);
      });
}

function handleFirstEvent() {
  registerGnoSysServerEventHandler(ServerEvent.PLAYER_UPDATE, playerInfo => {
    window.sendPlayerInfoCount = window.sendPlayerInfoCount || 0;
    window.sendPlayerInfoCount++;
  });

  let controlToastShown = false;
  registerGnoSysServerEventHandler(ServerEvent.LOADING_PROGRESS, p =>{
      const spinnerStyle = document.getElementById('spinner')?.style;
      if (spinnerStyle) spinnerStyle.display = 'none';
      document.querySelector('login-modal')?.showAccountModal();
  })
  registerGnoSysServerEventHandler(ServerEvent.GAME_STATE_CHANGED, state => {
    window.gameState = state;
    if (state === "Playing" && !controlToastShown) {
      showControlToasts();
      controlToastShown = true;
    }
    if (state === "PrePlay") {
      const modalElement = document.querySelector("#gnosysNetworkModal");
      if (modalElement && window.bootstrap) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    }
  });
}

function initAutoSave() {
  registerGnoSysServerEventHandler(ServerEvent.PLAYER_UPDATE, playerInfo => {
    try {
        window.electron.persistSaveData(playerInfo)
    } catch (error) {
      console.error("COULD NOT PARSE PLAYER DATA");
    }
    window.playerInventory = playerInfo.inventory || null;
    window.dispatchEvent(
      new CustomEvent("player-inventory-updated", { detail: window.playerInventory })
    );
  });
}

export function startWebUI() {
  init();
}

export default startWebUI;
