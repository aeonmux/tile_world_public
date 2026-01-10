import {decorateUI} from "../../util/ui-decorator.js";

const PERSONA_HTML = `
    <div class="row g-2 persona-gear">
        <div class="col-2 persona-gear-list">
            <div class="arcane-container-item persona-gear-label">Head</div>
            <div class="arcane-container-item persona-gear-label">Chest</div>
            <div class="arcane-container-item persona-gear-label">Ranged Weapon</div>
            <div class="arcane-container-item persona-gear-label">Melee Weapon</div>
            <div class="arcane-container-item persona-gear-label">Flask</div>
            <div class="arcane-container-item persona-gear-label">Flask</div>
            <div class="arcane-container-item persona-gear-label">Legs</div>
            <div class="arcane-container-item persona-gear-label">Feet</div>
        </div>
        <div class="col-10 persona-gear-slots">
            <div class="arcane-container-item persona-gear-row persona-gear-trigger" data-equipment-type="Head" data-equipment-label="Head" data-equipment-key="head">
                Select...
            </div>
            <div class="arcane-container-item persona-gear-row persona-gear-trigger" data-equipment-type="Chest" data-equipment-label="Chest" data-equipment-key="chest">
                Select...
            </div>
            <div class="arcane-container-item persona-gear-row persona-gear-trigger" data-equipment-type="RangedWeapon" data-equipment-label="Ranged Weapon" data-equipment-key="ranged_weapon">
                Select...
            </div>
            <div class="arcane-container-item persona-gear-row persona-gear-trigger" data-equipment-type="MeleeWeapon" data-equipment-label="Melee Weapon" data-equipment-key="melee_weapon">
                Select...
            </div>
            <div class="arcane-container-item persona-gear-row persona-gear-trigger" data-equipment-type="Flask1" data-equipment-label="Flask 1" data-equipment-key="flask_1">
                Select...
            </div>
            <div class="arcane-container-item persona-gear-row persona-gear-trigger" data-equipment-type="Flask2" data-equipment-label="Flask 2" data-equipment-key="flask_2">
                Select...
            </div>
            <div class="arcane-container-item persona-gear-row persona-gear-trigger" data-equipment-type="Legs" data-equipment-label="Legs" data-equipment-key="legs">
                Select...
            </div>
            <div class="arcane-container-item persona-gear-row persona-gear-trigger" data-equipment-type="Feet" data-equipment-label="Feet" data-equipment-key="feet">
                Select...
            </div>
        </div>
    </div>
`;

export function ensurePersonaLayout(container) {
    if (!container) return;
    if (!container.querySelector(".persona-gear")) {
        container.innerHTML = PERSONA_HTML;
    }
    container.querySelectorAll("[data-equipment-type]").forEach((el) => {
        if (el.dataset.personaBound) return;
        el.dataset.personaBound = "true";
        el.addEventListener("click", () => {
            const equipmentType = el.dataset.equipmentType || "--";
            const equipmentLabel = el.dataset.equipmentLabel || equipmentType;
            const equipmentRoot = document.querySelector("equipment-select-modal");
            if (equipmentRoot && typeof equipmentRoot.setEquipmentType === "function") {
                equipmentRoot.setEquipmentType(equipmentType, equipmentLabel);
            }
            const modalRoot = container.closest(".modal");
            if (modalRoot) {
                const modal = bootstrap.Modal.getInstance(modalRoot);
                if (modal) modal.hide();
            }
            const equipmentEl = document.querySelector("#equipmentSelectModal");
            const equipmentModal = equipmentEl ? new bootstrap.Modal(equipmentEl) : null;
            if (equipmentModal) equipmentModal.show();
        });
    });
}

export function renderPersonaEquipment(container) {
    if (!container) return;
    const equipment = window.playerInventory?.equipment || {};
    const slots = window.playerInventory?.slots || [];
    const byId = new Map(
        slots
            .filter((slot) => slot?.item?.id)
            .map((slot) => [slot.item.id, slot.item])
    );
    container.querySelectorAll("[data-equipment-key]").forEach((el) => {
        const key = el.dataset.equipmentKey;
        const value = key ? equipment[key] : null;
        if (!value) {
            el.textContent = "Select...";
            return;
        }
        const item = byId.get(value);
        if (item) {
            const prefix = item.prefix ? `${item.prefix} ` : "";
            el.textContent = `${prefix}${item.name}`;
            return;
        }
        el.textContent = value;
    });
    decorateUI(document);
}
