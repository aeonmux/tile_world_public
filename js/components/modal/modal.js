import "./status-modal.js"
import "./augment-aeons.js"
import "./inventory-modal.js"
import "./element-totals-modal.js"
import "./hone-sword.js"
import "./refine-bow.js"
import "./brew-tincture.js"
import "./distil-poison.js"
import "./configure-settings.js"
import "./login.js"
import "./hex_gate_dialer.js"
import "./gnosys-network-modal.js"
import "./contract-details-modal.js"
import "./equipment-select.js"

class Modals extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <status-modal></status-modal>
            <aeon-modal></aeon-modal>
            <inventory-modal></inventory-modal>
            <elements-modal></elements-modal>
            <hone-modal></hone-modal>
            <refine-modal></refine-modal>
<!--            <brew-modal></brew-modal>-->
            <distill-modal></distill-modal>
            <settings-modal></settings-modal>
            <login-modal></login-modal>
            <hex-gate-dialer></hex-gate-dialer>
            <gnosys-network-modal></gnosys-network-modal>
            <contract-details-modal></contract-details-modal>
            <equipment-select-modal></equipment-select-modal>
        `;
    }

    connectedCallback() {

    }
}

customElements.define('arcane-modals', Modals);
