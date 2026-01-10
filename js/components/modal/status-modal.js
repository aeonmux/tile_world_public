import {ensurePersonaLayout, renderPersonaEquipment} from "./persona-shared.js";

class StatusModal extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div class="modal fade" id="statusModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content arcane-container" style="background: #1f1f23;">
                        <div class="modal-header">
                            <h1 class="modal-title arcane-container-header fs-5" id="exampleModalLabel">Check / Status </h1>
                        </div>
                        <div class="modal-body">
                            <div id="status-persona-content"></div>
                        </div>
                        <div class="modal-footer">
                            <div class="arcane-container-standalone-item">
                                <div class="arcane-container-item" data-bs-dismiss="modal">Exit</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        const content = this.querySelector("#status-persona-content");
        let isActive = false;
        ensurePersonaLayout(content);

        const renderStatus = () => {
            if (!isActive) return;
            renderPersonaEquipment(content);
        };

        const modalEl = this.querySelector("#statusModal");
        if (modalEl) {
            modalEl.addEventListener("show.bs.modal", () => {
                isActive = true;
                renderStatus();
            });
            modalEl.addEventListener("hidden.bs.modal", () => {
                isActive = false;
            });
        }

        window.addEventListener("player-inventory-updated", () => {
            renderStatus();
        });
    }
}

customElements.define('status-modal', StatusModal);
