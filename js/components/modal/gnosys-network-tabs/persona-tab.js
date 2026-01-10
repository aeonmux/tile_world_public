import {ensurePersonaLayout, renderPersonaEquipment} from "../persona-shared.js";

let initialized = false;

export function initPersonaTab(root) {
    if (initialized) return;
    initialized = true;
    const personaTab = root.querySelector("#gn-persona-content");
    let isActive = false;
    ensurePersonaLayout(personaTab);
    const renderPersona = () => {
        if (!isActive) return;
        renderPersonaEquipment(personaTab);
    };

    const modalEl = document.querySelector("#gnosysNetworkModal");
    if (modalEl) {
        modalEl.addEventListener("show.bs.modal", () => {
            isActive = true;
            renderPersona();
        });
        modalEl.addEventListener("hidden.bs.modal", () => {
            isActive = false;
        });
    }

    window.addEventListener("player-inventory-updated", () => {
        renderPersona();
    });
}
