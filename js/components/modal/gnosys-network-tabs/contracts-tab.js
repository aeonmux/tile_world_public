import {ServerEvent} from "../../../constants/server_events.js";

let initialized = false;

export function initContractsTab(root) {
    if (initialized) return;
    initialized = true;
    registerGnoSysServerEventHandler(ServerEvent.REGISTERED_ITEMS, (itemsPayload) => {
        const list = root.querySelector("#gn-contracts-list");
        if (!list) return;
        const items = itemsPayload?.items || [];
        const contracts = items.filter(item => item._type === "Aeon");
        list.innerHTML = "";
        if (!contracts.length) {
            const empty = document.createElement("div");
            empty.className = "arcane-container-item";
            empty.textContent = "No contracts registered.";
            list.appendChild(empty);
            return;
        }
        contracts.forEach(item => {
            const row = document.createElement("div");
            row.className = "arcane-container-item";
            row.textContent = item.name;
            row.dataset.contractName = item.name;
            list.appendChild(row);
        });
    });

    const contractsList = root.querySelector("#gn-contracts-list");
    if (contractsList) {
        contractsList.addEventListener("click", (event) => {
            const row = event.target.closest(".arcane-container-item");
            if (!row || !row.dataset.contractName) return;
            const detailsEl = document.querySelector("#contractDetailsModal");
            const detailsModal = detailsEl ? new bootstrap.Modal(detailsEl) : null;
            const networkEl = root.querySelector("#gnosysNetworkModal");
            const networkModal = networkEl ? bootstrap.Modal.getInstance(networkEl) : null;
            if (networkModal) networkModal.hide();
            if (detailsModal) detailsModal.show();
        });
    }
}
