import {ServerEvent} from "../../../constants/server_events.js";
import {decorateUI} from "../../../util/ui-decorator.js";

let initialized = false;

export function initPersonaTab(root) {
    if (initialized) return;
    initialized = true;
    const personaTab = root.querySelector("#gn-persona-content");
    if (personaTab) {
        personaTab.innerHTML = `
         
            <div class="row g-2" id="gn-persona-gear">
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
        personaTab.querySelectorAll("[data-equipment-type]").forEach((el) => {
            el.addEventListener("click", () => {
                const equipmentType = el.dataset.equipmentType || "--";
                const equipmentLabel = el.dataset.equipmentLabel || equipmentType;
                const equipmentRoot = document.querySelector("equipment-select-modal");
                if (equipmentRoot && typeof equipmentRoot.setEquipmentType === "function") {
                    equipmentRoot.setEquipmentType(equipmentType, equipmentLabel);
                }
                const networkEl = document.querySelector("#gnosysNetworkModal");
                const networkModal = networkEl ? bootstrap.Modal.getInstance(networkEl) : null;
                if (networkModal) networkModal.hide();
                const equipmentEl = document.querySelector("#equipmentSelectModal");
                const equipmentModal = equipmentEl ? new bootstrap.Modal(equipmentEl) : null;
                if (equipmentModal) equipmentModal.show();
            });
        });
    }
    registerGnoSysServerEventHandler(ServerEvent.PLAYER_UPDATE, (playerInfo) => {
        const equipment = playerInfo.inventory?.equipment || {};
        const slots = playerInfo.inventory?.slots || [];
        const byId = new Map(
            slots
                .filter((slot) => slot?.item?.id)
                .map((slot) => [slot.item.id, slot.item])
        );
        personaTab.querySelectorAll("[data-equipment-key]").forEach((el) => {
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

    });
}
