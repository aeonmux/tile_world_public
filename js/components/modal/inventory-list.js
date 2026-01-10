import {decorateUI} from "../../util/ui-decorator.js";

export function renderInventoryList({
    container,
    slots,
    sortOrder = "desc",
    onUse,
    onHover,
    collapseState = {},
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

    const groups = new Map();
    sorted.forEach((slot) => {
        const groupType = slot?.item?._type || "Unknown";
        if (!groups.has(groupType)) groups.set(groupType, []);
        groups.get(groupType).push(slot);
    });

    const sortedGroupKeys = Array.from(groups.keys()).sort((a, b) =>
        String(a).localeCompare(String(b))
    );

    sortedGroupKeys.forEach((groupType) => {
        const groupSlots = groups.get(groupType) || [];
        const isExpanded = collapseState[groupType] === true;
        const header = document.createElement("div");
        header.className = "arcane-container-item tincture-row";
        header.textContent = `${isExpanded ? "-" : "+"} ${groupType}`;
        container.appendChild(header);

        const groupEl = document.createElement("div");
        groupEl.style.display = isExpanded ? "" : "none";
        container.appendChild(groupEl);

        header.addEventListener("click", () => {
            const nextExpanded = collapseState[groupType] !== true;
            collapseState[groupType] = nextExpanded;
            header.textContent = `${nextExpanded ? "-" : "+"} ${groupType}`;
            groupEl.style.display = nextExpanded ? "" : "none";
            decorateUI(document);
        });

        groupSlots
            .sort((a, b) => b.item.resonance - a.item.resonance)
            .forEach(slot => {
            const row = document.createElement("div");
            row.className = "arcane-container-sub-item arcane-container-item tincture-row";

            const name = document.createElement("span");
            name.className = "w-40 name";
            const res = document.createElement("span");
            res.className = "w-20 resonance";
            const type = document.createElement("span");
            type.className = "w-20 type";

            row.append(name, res, type);
            groupEl.appendChild(row);

            decorateUI(row);

            row.dataset.item = JSON.stringify(slot.item);
            name.textContent = `${slot.item.prefix} ${slot.item.name}`;
            res.textContent = `| *** ${slot.item.resonance}`;
            type.textContent = `| Type: ${slot.item._type}`;

            if (onHover) {
                row.addEventListener("mouseenter", () => {
                    onHover(JSON.parse(row.dataset.item));
                });
            }

            if (onUse) {
                const useOnce = () => {
                    const itemDetails = JSON.parse(row.dataset.item);
                    onUse(itemDetails, row);
                };

                row.addEventListener("click", useOnce);
            }
            });
    });
    decorateUI(document);
}
