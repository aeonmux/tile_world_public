import {ClientEvent} from "../../constants/client_events.js";
import {initContractsTab} from "./gnosys-network-tabs/contracts-tab.js";
import {initNetworkTab} from "./gnosys-network-tabs/network-tab.js";
import {initPersonaTab} from "./gnosys-network-tabs/persona-tab.js";
import {initTradingTab} from "./gnosys-network-tabs/trading-tab.js";
import {decorateUI} from "../../util/ui-decorator.js";
import {initInventoryTab} from "./gnosys-network-tabs/inventory-tab.js";

class GnoSysNetworkModal extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div class="modal fade" id="gnosysNetworkModal" tabindex="-1" aria-labelledby="gnosysNetworkLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content arcane-container" style="background: #1f1f23;">
                        <div class="modal-header">
                            <h1 class="modal-title arcane-container-header fs-5" id="gnosysNetworkLabel">GnoSys / Network</h1>
                        </div>
                        <div class="modal-body">
                            <ul class="nav nav-tabs" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#gn-tab-persona" type="button" role="tab">
                                        Persona
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#gn-tab-inventory" type="button" role="tab" id="gn-tab-inventory-btn">
                                        Inventory
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#gn-tab-contracts" type="button" role="tab">
                                        Aeon Contracts
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#gn-tab-trading" type="button" role="tab">
                                        Trading
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#gn-tab-network" type="button" role="tab">
                                        Network Feed
                                    </button>
                                </li>
                                 <li class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#gn-tab-manual" type="button" role="tab">
                                       Operator Manual
                                    </button>
                                </li>
                            </ul>
                            <div class="tab-content mt-3">
                                <div class="tab-pane fade show active" id="gn-tab-persona" role="tabpanel">
                                    <div id="gn-persona-content"></div>
                                </div>
                                <div class="tab-pane fade" id="gn-tab-inventory" role="tabpanel">
                                    <div id="gn-inventory-content"></div>
                                </div>
                                <div class="tab-pane fade" id="gn-tab-contracts" role="tabpanel">
                                    <div id="gn-contracts-list">
                                        <div class="arcane-container-item">No contracts registered.</div>
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="gn-tab-trading" role="tabpanel">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus laoreet, velit at luctus tristique, massa justo aliquet lorem.
                                </div>
                                <div class="tab-pane fade" id="gn-tab-network" role="tabpanel">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Sed posuere, orci nec luctus posuere, purus orci efficitur nisi.
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <div class="arcane-container-standalone-item">
                                <div class="arcane-container-item" id="gnosysNetworkLogout">Log-Out</div>
                            </div>
                            <div class="arcane-container-standalone-item ms-auto">
                                <div class="arcane-container-item" id="gnosysNetworkPlay">Enter / Kenoma</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        const modalEl = this.querySelector("#gnosysNetworkModal");
        if (modalEl) {
            modalEl.addEventListener('show.bs.modal', () => {
                this._blockShift = (e) => {
                    if (e.key === 'Shift') {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                };
                decorateUI(document);
                document.addEventListener('keydown', this._blockShift, true);
            });
            modalEl.addEventListener('hidden.bs.modal', () => {
                if (this._blockShift) {
                    document.removeEventListener('keydown', this._blockShift, true);
                    this._blockShift = null;
                }
            });
        }

        initPersonaTab(this);
        initInventoryTab(this);
        initContractsTab(this);
        initTradingTab(this);
        initNetworkTab(this);

        const inventoryTabBtn = this.querySelector("#gn-tab-inventory-btn");
        if (inventoryTabBtn) {
            inventoryTabBtn.addEventListener("shown.bs.tab", () => {
                const playBtn = this.querySelector("#gnosysNetworkPlay");
                if (playBtn) {
                    playBtn.textContent = "Move All To Heap";
                    playBtn.dataset.mode = "inventory";
                }
            });
            inventoryTabBtn.addEventListener("hidden.bs.tab", () => {
                const playBtn = this.querySelector("#gnosysNetworkPlay");
                if (playBtn) {
                    playBtn.textContent = "Enter / Kenoma";
                    playBtn.dataset.mode = "";
                }
            });
        }

        const playBtn = this.querySelector("#gnosysNetworkPlay");
        if (playBtn) {
            playBtn.addEventListener("click", () => {
                if (playBtn.dataset.mode === "inventory") {
                    gnoSysTransmitClientEvent(ClientEvent.MOVE_ALL_TO_HEAP);
                    return;
                }
                gnoSysTransmitClientEvent(ClientEvent.START_GAME);
                const modalEl = this.querySelector("#gnosysNetworkModal");
                const inst = bootstrap.Modal.getInstance(modalEl);
                if (inst) inst.hide();
                const dialEl = document.querySelector("#hexGateDial");
                if (dialEl) {
                    const dialModal = new bootstrap.Modal(dialEl);
                    dialModal.show();
                }
            });
        }

        const logoutBtn = this.querySelector("#gnosysNetworkLogout");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                window.location.reload();
            });
        }
    }
}

customElements.define("gnosys-network-modal", GnoSysNetworkModal);
