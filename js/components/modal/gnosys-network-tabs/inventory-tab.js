import {renderInventoryList} from "../inventory-list.js";
import {decorateUI} from "../../../util/ui-decorator.js";
import {ClientEvent} from "../../../constants/client_events.js";

let initialized = false;

export function initInventoryTab(root) {
    if (initialized) return;
    initialized = true;

    const inventoryRoot = root.querySelector("#gn-inventory-content");
    if (!inventoryRoot) return;

    inventoryRoot.innerHTML = `
        <div class="row g-2">
            <div class="col-6">
                <div class="arcane-container-header mb-2">/ Stack</div>
                <div id="gn-inventory-stack" style="max-height: 50vh; overflow-y: auto;"></div>
            </div>
            <div class="col-6">
                <div class="arcane-container-header mb-2">/ Heap</div>
                <div id="gn-inventory-heap" style="max-height: 50vh; overflow-y: auto;"></div>
            </div>
        </div>
    `;

    let isActive = false;
    let modalVisible = false;
    const stackCollapseState = {};
    const heapCollapseState = {};

    const renderInventory = () => {
        if (!isActive || !modalVisible) return;
        const stackEl = inventoryRoot.querySelector("#gn-inventory-stack");
        const heapEl = inventoryRoot.querySelector("#gn-inventory-heap");
        if (!stackEl || !heapEl) return;
        renderInventoryList({
            container: stackEl,
            slots: window.playerInventory?.slots || [],
            sortOrder: "desc",
            onUse: (itemDetails) => {
                gnoSysTransmitClientEvent(ClientEvent.MOVE_TO_HEAP, itemDetails.id);
            },
            onHover: () => {},
            collapseState: stackCollapseState,
        });
        if (window.playerHeap?.slots) {
            renderInventoryList({
                container: heapEl,
                slots: window.playerHeap?.slots || [],
                sortOrder: "desc",
                onUse: (itemDetails) => {
                    gnoSysTransmitClientEvent(ClientEvent.MOVE_TO_STACK, itemDetails.id);
                },
                onHover: () => {},
                collapseState: heapCollapseState,
            });
        } else {
            heapEl.innerHTML = "<div class=\"arcane-container-item\">Heap coming soon.</div>";
        }
        decorateUI(document);
    };

    const clearInventory = () => {
        const stackEl = inventoryRoot.querySelector("#gn-inventory-stack");
        const heapEl = inventoryRoot.querySelector("#gn-inventory-heap");
        if (stackEl) stackEl.innerHTML = "";
        if (heapEl) heapEl.innerHTML = "";
    };

    const modalEl = document.querySelector("#gnosysNetworkModal");
    if (modalEl) {
        modalEl.addEventListener("show.bs.modal", () => {
            modalVisible = true;
            renderInventory();
        });
        modalEl.addEventListener("hidden.bs.modal", () => {
            modalVisible = false;
            isActive = false;
            clearInventory();
        });
    }

    const inventoryTabBtn = root.querySelector("#gn-tab-inventory-btn");
    if (inventoryTabBtn) {
        inventoryTabBtn.addEventListener("shown.bs.tab", () => {
            isActive = true;
            renderInventory();
        });
        inventoryTabBtn.addEventListener("hidden.bs.tab", () => {
            isActive = false;
            clearInventory();
        });
    }

    window.addEventListener("player-inventory-updated", () => {
        renderInventory();
    });
    window.addEventListener("player-heap-updated", () => {
        renderInventory();
    });
}
