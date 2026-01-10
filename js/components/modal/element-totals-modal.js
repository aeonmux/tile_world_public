import {ServerEvent} from "../../constants/server_events.js";

class ElementTotalsModal extends HTMLElement {
    constructor() {
        super();
        this.previousInventoryJSON = "";
        this.isActive = false;
        this.innerHTML = `
      <div class="modal fade" id="elementsModal" tabindex="-1" aria-labelledby="elementsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content arcane-container" style="background: #1f1f23;">
            <div class="modal-header">
              <h1 class="modal-title arcane-container-header fs-5" id="elementsModalLabel">
                Inspect / Fragments
              </h1>
            </div>
            <div class="modal-body">
              <div class="element-totals-container"></div>
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
        const modalEl = this.querySelector("#elementsModal");
        if (modalEl) {
            modalEl.addEventListener("show.bs.modal", () => this.onShow());
            modalEl.addEventListener("hidden.bs.modal", () => this.onClose());
        }
    }

    onShow() {
        this.isActive = true;
        const slots = window.playerInventory?.slots || [];
        const json = JSON.stringify(slots);
        if (json !== this.previousInventoryJSON) {
            this.previousInventoryJSON = json;
        }
        this.renderTotals(slots);
    }

    onClose() {
        this.isActive = false;
        this.previousInventoryJSON = "";
        const container = this.querySelector(".element-totals-container");
        if (container) container.innerHTML = "";
    }

    renderTotals(slots) {
        const totals = new Map();

        slots.forEach(slot => {
            const count = Number(slot.count || 0);
            const items = slot.item?.sub_items || [];
            items.forEach(entry => {
                const element = entry.element;
                const qty = Number(entry.quantity || 0);
                const current = totals.get(element) || 0;
                totals.set(element, current + qty * count);
            });
        });

        const container = this.querySelector(".element-totals-container");
        container.innerHTML = "";

        const entries = Array.from(totals.entries())
            .map(([element, total]) => ({ element, total }))
            .filter(entry => entry.total > 0)
            .sort((a, b) => b.total - a.total);

        if (!entries.length) {
            const empty = document.createElement("div");
            empty.textContent = "No elemental units in inventory.";
            container.appendChild(empty);
            return;
        }

        const maxTotal = entries[0].total || 1;
        entries.forEach(entry => {
            const label = document.createElement("div");
            label.className = "d-flex justify-content-between small";
            const name = document.createElement("span");
            name.textContent = entry.element;
            const count = document.createElement("span");
            count.textContent = `${entry.total}u`;
            label.append(name, count);

            const progress = document.createElement("div");
            progress.className = "progress mb-2";
            const bar = document.createElement("div");
            bar.className = "progress-bar";
            bar.style.width = `${Math.round((entry.total / maxTotal) * 100)}%`;
            bar.setAttribute("role", "progressbar");
            bar.setAttribute("aria-valuenow", entry.total);
            bar.setAttribute("aria-valuemin", "0");
            bar.setAttribute("aria-valuemax", String(maxTotal));
            progress.appendChild(bar);

            container.append(label, progress);
        });
    }
}

customElements.define("elements-modal", ElementTotalsModal);
