import "./status-modal.js"
import "./augment-aeons.js"
import "./tincture-inventory-modal.js"
import "./hone-sword.js"
import "./refine-bow.js"
import "./brew-tincture.js"
import "./distil-poison.js"
import "./configure-settings.js"
import "./login.js"
import "./hex_gate_dialer.js"

class Modals extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <status-modal></status-modal>
            <aeon-modal></aeon-modal>
            <inventory-modal></inventory-modal>
            <hone-modal></hone-modal>
            <refine-modal></refine-modal>
            <brew-modal></brew-modal>
            <distill-modal></distill-modal>
            <settings-modal></settings-modal>
            <login-modal></login-modal>
            <hex-gate-dialer></hex-gate-dialer>
        `;
    }

    connectedCallback() {

    }
}

customElements.define('arcane-modals', Modals);