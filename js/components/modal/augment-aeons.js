import {decorateUI} from "../../util/ui-decorator.js";
import {ServerEvent} from "../../constants/server_events.js";
import {ClientEvent} from "../../constants/client_events.js";
import {attachHoldRepeat} from "../../util/hold-repeat.js";

class AeonModal extends HTMLElement {
    constructor() {
        super();
        this.emanations = [];
        this.pleroma = 0;
        this.previousInventoryJSON = "";
        this.previousPleroma = null;
        this.innerHTML = `
<div class="modal fade" id="aeonModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content arcane-container" style="background: #1f1f23;">
            <div class="modal-header">
                <h1 class="modal-title arcane-container-header fs-5" id="exampleModalLabel">Amplify / Emanations</h1>
            </div>
            <div class="modal-body">
                <!-- EMANATION LIST -->
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
            const slots = playerInfo.inventory.slots.filter(slot => slot.item._type === "Emanation");
            const json = JSON.stringify(slots);
            const pleroma = playerInfo.pleroma;

            if (json === this.previousInventoryJSON && pleroma === this.previousPleroma) return;

            this.previousInventoryJSON = json;
            this.previousPleroma = pleroma;
            this.emanations = slots;
            this.pleroma = pleroma;
            this.renderEmanations();
        });
    }

    renderEmanations() {
        const weights = { Weak: 1, Mild: 2, Strong: 3, Potent: 4 };

        const groups = {};
        this.emanations.forEach(slot => {
            const name = slot.item.name;
            if (!groups[name]) groups[name] = [];
            groups[name].push(slot);
        });

        const entries = Object.entries(groups).map(([name, slots]) => {
            let cost = 0;
            let count = 0;
            let top = slots[0];
            slots.forEach(s => {
                cost += s.item.resonance * s.count;
                console.log(s.item.resonance, s.count);
                count += s.count;
                if (s.item.resonance > top.item.resonance) top = s;
            });
            return { name, slots, cost, count, prefix: top.item.prefix, resonance: top.item.resonance };
        });

        entries.sort((a, b) => {
            let diff = a.resonance - b.resonance;
            if (diff === 0) {
                diff = weights[a.prefix] - weights[b.prefix];
            }
            return -diff;
        });

        const body = this.querySelector(".modal-body");

        const desiredOrder = entries.map(e => e.name);
        const desiredSet = new Set(desiredOrder);

        // Remove entries that no longer exist
        [...body.querySelectorAll('[data-emanation-name]')]
            .forEach(row => {
                if (!desiredSet.has(row.dataset.emanationName)) row.remove();
            });

        const ensureRow = (entry) => {
            let row = body.querySelector(`[data-emanation-name="${entry.name}"]`);
            if (!row) {
                row = document.createElement('div');
                row.className = 'd-flex justify-content-start';
                row.dataset.emanationName = entry.name;

                const left = document.createElement('div');
                left.className = 'arcane-container-standalone-item w-70 mx-2';
                const leftItem = document.createElement('div');
                leftItem.className = 'arcane-container-item';
                const nameSpan = document.createElement('span');
                nameSpan.className = 'w-40 name';
                const resSpan = document.createElement('span');
                resSpan.className = 'w-20 resonance';
                const qtySpan = document.createElement('span');
                qtySpan.className = 'w-20 quantity';
                leftItem.append(nameSpan, resSpan, qtySpan);
                left.appendChild(leftItem);

                const right = document.createElement('div');
                right.className = 'arcane-container-standalone-item mx-2';
                const btn = document.createElement('div');
                btn.className = 'arcane-container-item amplify-btn';
                btn.dataset.name = entry.name;
                right.appendChild(btn);

                row.append(left, right);
                body.appendChild(row);

                // Decorate only new UI pieces
                decorateUI(left);
                decorateUI(right);

                // Attach action handlers once
                const amplifyOnce = () => {
                    if (btn.classList.contains('btn-disabled')) return;
                    const name = btn.dataset.name;
                    gnoSysTransmitClientEvent(ClientEvent.AMPLIFY_EMANATION, name);
                };
                btn.addEventListener('click', amplifyOnce);
                attachHoldRepeat(btn, amplifyOnce, {
                    interval: 50,
                    startDelay: 250,
                    animateClass: 'hold-repeat',
                    canRun: () => !btn.classList.contains('btn-disabled')
                });
            }
            return row;
        };

        // Upsert and update values without replacing elements
        entries.forEach(entry => {
            const row = ensureRow(entry);
            const nameEl = row.querySelector('.name');
            const resEl = row.querySelector('.resonance');
            const qtyEl = row.querySelector('.quantity');
            const btnEl = row.querySelector('.amplify-btn');

            const disabled = this.pleroma < entry.cost;

            nameEl.textContent = `${entry.prefix} Emanation of ${entry.name}`;
            resEl.textContent = `| *** ${entry.resonance}`;
            qtyEl.textContent = `| Quantity: ${entry.count}`;
            btnEl.textContent = `Amplify / -${entry.cost} Pleroma`;
            btnEl.dataset.cost = String(entry.cost);
            btnEl.classList.toggle('btn-disabled', disabled);
        });

        // Reorder according to desired sort
        desiredOrder.forEach(name => {
            const row = body.querySelector(`[data-emanation-name="${name}"]`);
            if (row) body.appendChild(row);
        });
    }
}

customElements.define('aeon-modal', AeonModal);
