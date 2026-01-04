import {decorateUI} from "../../util/ui-decorator.js";
import {attachHoldRepeat} from "../../util/hold-repeat.js";

export function renderInventoryList({
    container,
    slots,
    sortOrder = "desc",
    onUse,
    onHover,
    enableHoldRepeat = false,
    decrementOnUse = true,
}) {
    const weights = { Weak: 1, Mild: 2, Strong: 3, Potent: 4 };
    const sorted = [...(slots || [])].sort((a, b) => {
        let diff = a.item.resonance - b.item.resonance;
        if (diff === 0) {
            diff = weights[a.item.prefix] - weights[b.item.prefix];
        }
        return sortOrder === "desc" ? -diff : diff;
    });

    container.innerHTML = "";

    sorted.forEach(slot => {
        const row = document.createElement("div");
        row.className = "arcane-container-item tincture-row";

        const name = document.createElement("span");
        name.className = "w-40 name";
        const res = document.createElement("span");
        res.className = "w-20 resonance";
        const qty = document.createElement("span");
        qty.className = "w-20 quantity";
        const type = document.createElement("span");
        type.className = "w-20 type";

        row.append(name, res, qty, type);
        container.appendChild(row);

        decorateUI(row);

        row.dataset.item = JSON.stringify(slot.item);
        row.dataset.remaining = String(slot.count);

        name.textContent = `${slot.item.prefix} ${slot.item.name}`;
        res.textContent = `| *** ${slot.item.resonance}`;
        type.textContent = `| Type: ${slot.item._type}`;
        qty.textContent = `| Quantity: ${slot.count}`;

        if (onHover) {
            row.addEventListener("mouseenter", () => {
                onHover(JSON.parse(row.dataset.item));
            });
        }

        if (onUse) {
            const useOnce = () => {
                const itemDetails = JSON.parse(row.dataset.item);
                const remaining = Number(row.dataset.remaining || "0");
                if (remaining <= 0) return;
                onUse(itemDetails, row);
                if (decrementOnUse) {
                    row.dataset.remaining = String(remaining - 1);
                    qty.textContent = `| Quantity: ${row.dataset.remaining}`;
                }
            };

            row.addEventListener("click", useOnce);
            if (enableHoldRepeat) {
                attachHoldRepeat(row, useOnce, {
                    interval: 50,
                    startDelay: 250,
                    animateClass: "hold-repeat",
                    canRun: () => Number(row.dataset.remaining || "0") > 0,
                });
            }
        }
    });
}
