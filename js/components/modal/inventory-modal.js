import {ClientEvent} from "../../constants/client_events.js";
import {renderInventoryList} from "./inventory-list.js";
import {decorateUI} from "../../util/ui-decorator.js";

class InventoryModal extends HTMLElement {
    constructor() {
        super();

        
        this.sortOrder = "desc";
        this.isActive = false;

        this.innerHTML = `
      <div class="modal fade" id="inventoryModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content arcane-container" style="background: #1f1f23;">
            <div class="modal-header">
              <h1 class="modal-title arcane-container-header fs-5" id="exampleModalLabel">
                 View / Inventory
              </h1>
              <button 
                type="button" 
                id="sort-toggle" 
                class="btn btn-secondary btn-sm ms-auto"
              >
                Sort: DESC
              </button>
            </div>
            <div class="modal-body">
               <div class="row">
                   <div class="col-10 inventory-items-container"></div>
                   <div class="col-2">
                     <div class="inspector">
                       <div class="inspector-body"></div>
                     </div>
                   </div>
               </div>
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

        const sortBtn = this.querySelector("#sort-toggle");
        sortBtn.addEventListener("click", () => {
            
            this.sortOrder = this.sortOrder === "desc" ? "asc" : "desc";
            sortBtn.textContent = `Sort: ${this.sortOrder.toUpperCase()}`;
            this.renderSlots();
        });

        const modalEl = this.querySelector("#inventoryModal");
        if (modalEl) {
            modalEl.addEventListener("show.bs.modal", () => this.onShow());
            modalEl.addEventListener("hidden.bs.modal", () => this.onClose());
        }
    }

    onShow() {
        this.isActive = true;
        this.renderSlots();
    }

    onClose() {
        this.isActive = false;
        const body = this.querySelector(".modal-body");
        if (!body) return;
        const container = body.querySelector(".inventory-items-container");
        const inspector = body.querySelector(".inspector-body");
        if (container) container.innerHTML = "";
        if (inspector) inspector.innerHTML = "";
    }

    renderSlots() {
        if (!this.isActive) return;
        const body = this.querySelector(".modal-body");
        const container = body.querySelector(".inventory-items-container");
        const inspector = body.querySelector(".inspector-body");
        renderInventoryList({
            container,
            slots: window.playerInventory?.slots || [],
            sortOrder: this.sortOrder,
            onUse: (itemDetails) => {
                gnoSysTransmitClientEvent(
                    ClientEvent.USE_ITEM,
                    `${itemDetails.name}:${itemDetails.prefix}:${itemDetails.resonance}`
                );
            },
            onHover: (itemDetails) => {
                this.renderInspector(inspector, itemDetails);
            },
            enableHoldRepeat: true,
            decrementOnUse: true,
        });
    }

    renderInspector(container, itemDetails) {
        container.innerHTML = "";

        if (!itemDetails.sub_items || !itemDetails.sub_items.length) {
            const empty = document.createElement("div");
            empty.textContent = "No composition data.";
            container.appendChild(empty);
            return;
        }

        const items = [...itemDetails.sub_items].sort((a, b) => b.quantity - a.quantity);
        items.forEach(entry => {
            const label = document.createElement("div");
            label.className = "d-flex justify-content-between small";
            const name = document.createElement("span");
            name.textContent = entry.element;
            const pct = document.createElement("span");
            pct.textContent = `${entry.quantity}u`;
            label.append(name, pct);

            const progress = document.createElement("div");
            progress.className = "progress mb-2";
            const bar = document.createElement("div");
            bar.className = "progress-bar";
            bar.style.width = `${entry.quantity}%`;
            bar.setAttribute("role", "progressbar");
            bar.setAttribute("aria-valuenow", entry.quantity);
            bar.setAttribute("aria-valuemin", "0");
            bar.setAttribute("aria-valuemax", "100");
            progress.appendChild(bar);

            container.append(label, progress);
        });
    }
}

customElements.define("inventory-modal", InventoryModal);
