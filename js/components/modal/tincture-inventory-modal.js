import {ServerEvent} from "../../constants/server_events.js";
import {decorateUI} from "../../util/ui-decorator.js";
import {ClientEvent} from "../../constants/client_events.js";

class InventoryModal extends HTMLElement {
    constructor() {
        super();

        
        this.previousInventoryJSON = "";
        this.sortOrder = "desc";   
        this.lastSlots = [];

        this.innerHTML = `
      <div class="modal fade" id="inventoryModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content arcane-container" style="background: #1f1f23;">
            <div class="modal-header">
              <h1 class="modal-title arcane-container-header fs-5" id="exampleModalLabel">
                Consume / Tincture
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
              <!-- INVENTORY TABLE HERE -->
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
        registerGnoSysServerEventHandler(ServerEvent.PLAYER_UPDATE, (playerInfo) => {
            const slots = playerInfo.inventory.slots.filter(slot => slot.item._type === "Tincture");
            const json = JSON.stringify(slots);
            if (json === this.previousInventoryJSON) return;
            this.previousInventoryJSON = json;
            this.lastSlots = slots;
            this.renderSlots();
        });

        
        const sortBtn = this.querySelector("#sort-toggle");
        sortBtn.addEventListener("click", () => {
            
            this.sortOrder = this.sortOrder === "desc" ? "asc" : "desc";
            sortBtn.textContent = `Sort: ${this.sortOrder.toUpperCase()}`;
            this.renderSlots();
        });
    }

    renderSlots() {
        
        const weights = { Weak: 1, Mild: 2, Strong: 3, Potent: 4 };

        
        const sorted = [...this.lastSlots].sort((a, b) => {
            
            let diff = a.item.resonance - b.item.resonance;
            if (diff === 0) {
                
                diff = weights[a.item.prefix] - weights[b.item.prefix];
            }
            return this.sortOrder === "desc" ? -diff : diff;
        });

        
        const bodyHTML = sorted.map(slot => `
      <div class="arcane-container-item">
        <span class="w-40">${slot.item.prefix} ${slot.item.name}</span>
        <span class="w-20">| *** ${slot.item.resonance}</span>
        <span class="w-20">| Quantity: ${slot.count}</span>
        <span class="w-20">| Type: ${slot.item._type}</span>
      </div>
    `).join("");

        const body = this.querySelector(".modal-body");
        body.innerHTML = bodyHTML;
        decorateUI(document);

        
        sorted.forEach((slot, index) => {
            const el = body.children[index];
            
            el.dataset.item = JSON.stringify(slot.item);
            
            el.addEventListener("click", () => {
                const itemDetails = JSON.parse(el.dataset.item);
                gnoSysTransmitClientEvent(ClientEvent.USE_ITEM,`${itemDetails.name}:${itemDetails.prefix}:${itemDetails.resonance}` );

            });
        });
    }
}

customElements.define("inventory-modal", InventoryModal);
