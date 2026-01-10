import {ClientEvent} from "../../constants/client_events.js";
import {renderInventoryList} from "./inventory-list.js";
import {decorateUI} from "../../util/ui-decorator.js";

class EquipmentSelectModal extends HTMLElement {
    constructor() {
        super();
        this.currentEquipmentType = "";
        this.currentEquipmentLabel = "";
        this.lastSlots = [];
        this.isActive = false;
        this.collapseState = {};
        this.innerHTML = `
            <div class="modal fade" id="equipmentSelectModal" tabindex="-1" aria-labelledby="equipmentSelectLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content arcane-container" style="background: #1f1f23;">
                        <div class="modal-header">
                            <h1 class="modal-title arcane-container-header fs-5" id="equipmentSelectLabel">Select / <span id="equipment-select-context">--</span></h1>
                        </div>
                        <div class="modal-body">
                            <div class="equipment-select-list"></div>
                        </div>
                        <div class="modal-footer d-flex">
                            <div class="arcane-container-standalone-item ms-auto">
                                <div class="arcane-container-item" id="equipmentSelectExit">Exit</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        window.addEventListener("player-inventory-updated", (event) => {
            const slots = event?.detail?.slots || [];
            this.lastSlots = slots;
            if (this.isActive) {
                this.renderSlots();
            }
        });

        const exitBtn = this.querySelector("#equipmentSelectExit");

        if (exitBtn) {
            exitBtn.addEventListener("click", () => {
                const detailsEl = this.querySelector("#equipmentSelectModal");
                const detailsModal = detailsEl ? bootstrap.Modal.getInstance(detailsEl) : null;
                if (detailsModal) detailsModal.hide();
                this.openReturnModal();
            });
        }

        const modalEl = this.querySelector("#equipmentSelectModal");
        if (modalEl) {
            modalEl.addEventListener("show.bs.modal", () => this.onShow());
            modalEl.addEventListener("hidden.bs.modal", () => this.onClose());
        }
    }

    onShow() {
        this.isActive = true;
        const slots = window.playerInventory?.slots || [];
        if (JSON.stringify(this.lastSlots) !== JSON.stringify(slots)) {
            this.lastSlots = slots;
        }
        this.renderSlots();
    }

    onClose() {
        this.isActive = false;
        const list = this.querySelector(".equipment-select-list");
        if (list) list.innerHTML = "";
    }

    setEquipmentType(type, label) {
        this.currentEquipmentType = type || "";
        this.currentEquipmentLabel = label || type || "";
        const contextEl = this.querySelector("#equipment-select-context");
        if (contextEl) {
            contextEl.textContent = this.currentEquipmentLabel || "--";
        }
        this.renderSlots();
    }

    renderSlots() {
        if (!this.isActive) return;
        const list = this.querySelector(".equipment-select-list");
        if (!list) return;
        if (!this.currentEquipmentType) {
            list.innerHTML = "";
            return;
        }
        const filtered = (this.lastSlots || []).filter((slot) => {
            const equipment_details = slot?.item?.equipment_details;
            if (!equipment_details || typeof equipment_details !== "object") return false;
            const types = equipment_details.equipmentType;
            return Array.isArray(types) && types.includes(this.currentEquipmentType);
        });
        renderInventoryList({
            container: list,
            slots: filtered,
            sortOrder: "desc",
            onUse: (itemDetails) => {
                gnoSysTransmitClientEvent(
                    ClientEvent.EQUIP_ITEM,
                    JSON.stringify({
                        id: itemDetails.id,
                        equipment_slot: this.currentEquipmentType,
                    })
                );
                const detailsEl = this.querySelector("#equipmentSelectModal");
                const detailsModal = detailsEl ? bootstrap.Modal.getInstance(detailsEl) : null;
                if (detailsModal) detailsModal.hide();
                this.openReturnModal();
            },
            collapseState: this.collapseState,
        });
        decorateUI(this);

    }

    openReturnModal() {
        if (window.gameState === "Playing") {
            const statusEl = document.querySelector("#statusModal");
            const statusModal = statusEl ? new bootstrap.Modal(statusEl) : null;
            if (statusModal) statusModal.show();
            return;
        }
        const networkEl = document.querySelector("#gnosysNetworkModal");
        const networkModal = networkEl ? new bootstrap.Modal(networkEl) : null;
        if (networkModal) networkModal.show();
    }
}

customElements.define("equipment-select-modal", EquipmentSelectModal);
