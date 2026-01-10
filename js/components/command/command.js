import {decorateUI} from "../../util/ui-decorator.js";

class ArcaneCommand extends HTMLElement {
    constructor() {
        super();
        
        this.innerHTML = ` 
       <div class="px-1">
          <div class="active-menu hidden arcane-container">
            <!-- Persona section starts expanded -->
            <div class="arcane-container-header">⬡ Persona</div>
            <div class="arcane-container-item hex-collapse" id="statusItem">Check / Status</div>
            
            <!-- Equipment section starts collapsed -->
            <div class="arcane-container-header">⬡ Equipment</div>
            <div class="arcane-container-item hex-collapse" id="inventoryItem">View / Inventory</div>
            <div class="arcane-container-item hex-collapse" id="elementsItem">Alchemical / Breakdown</div>
            <div class="arcane-container-item hex-collapse" id="elementsItem">Consume / Tinctures</div>
            
            <!-- System section starts collapsed -->
            <div class="arcane-container-header">⬡ System</div>
            <div class="arcane-container-item hex-collapse" id="settingsItem">Configure / Settings</div>
            <div class="arcane-container-item hex-collapse" id="logoutItem">Log-Out</div>
          </div>
      </div>
    `;
    }

    connectedCallback() {
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift' && !e.repeat) {
                if (window.gameState && window.gameState !== "Playing") {
                    return;
                }
                const activeMenu = this.querySelector('.active-menu');
                if (activeMenu) {
                    activeMenu.classList.toggle('hidden');
                }
            }
        });

        
        const headers = this.querySelectorAll('.arcane-container-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const currentText = header.textContent.trim();
                const isExpanded = currentText.startsWith('⬢');
                const newSymbol = isExpanded ? '⬡' : '⬢';
                header.textContent = newSymbol + header.textContent.slice(1);

                let sibling = header.nextElementSibling;
                while (sibling && !sibling.classList.contains('arcane-container-header')) {
                    if (isExpanded) {
                        sibling.classList.add('hex-collapse');
                    } else {
                        sibling.classList.remove('hex-collapse');
                    }
                    sibling = sibling.nextElementSibling;
                }
            });
        });

        
        const modalMappings = [
            { itemId: 'statusItem', modalId: 'statusModal' },
            { itemId: 'aeonItem', modalId: 'aeonModal' },
            { itemId: 'honeItem', modalId: 'honeModal' },
            { itemId: 'brewItem', modalId: 'brewModal' },
            { itemId: 'settingsItem', modalId: 'settingsModal' },
            { itemId: 'distillItem', modalId: 'distillModal' },
            { itemId: 'inventoryItem', modalId: 'inventoryModal' },
            { itemId: 'elementsItem', modalId: 'elementsModal' },
            { itemId: 'refineItem', modalId: 'refineModal' }
        ];

        // Items whose modals are not yet functional should be disabled
        const disabledItems = [
            // 'statusItem',
            // 'aeonItem',
            'honeItem',
            'refineItem',
            'distillItem',
            'settingsItem'
        ];

        
        this._modalInstances = this._modalInstances || {};
        const logoutElement = this.querySelector(`#logoutItem`);
        logoutElement.addEventListener('click', ()=>{
            window.location.reload()
        });
        modalMappings.forEach(({ itemId, modalId }) => {
            const menuItem = this.querySelector(`#${itemId}`);
            if (!menuItem) return;

            if (disabledItems.includes(itemId)) {
                menuItem.classList.add('menu-disabled');
                return;
            }

            menuItem.addEventListener('click', () => {
                if (window.bootstrap) {

                    if (!this._modalInstances[itemId]) {
                        const modalElement = document.querySelector(`#${modalId}`);
                        if (modalElement) {
                            this._modalInstances[itemId] = new bootstrap.Modal(modalElement);
                        } else {
                            console.warn(`Modal element with id "${modalId}" not found.`);
                            return;
                        }
                    }
                    this._modalInstances[itemId].show();
                    decorateUI(document);
                } else {
                    console.warn("Bootstrap's JavaScript is not loaded or modal element is missing.");
                }
            });
        });

        decorateUI(document);
        console.log('ArcaneCommand component added to the page.');
    }
}

customElements.define('arcane-command', ArcaneCommand);
