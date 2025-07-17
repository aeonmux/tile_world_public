import {ServerEvent} from "../../constants/server_events.js";
import {decorateUI} from "../../util/ui-decorator.js";
import {ClientEvent} from "../../constants/client_events.js";

class HexGateDialer extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div class="modal fade" id="hexGateDial" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content arcane-container" style="background: #1f1f23;">
                        <div class="modal-header">
                            <h1 class="modal-title arcane-container-header fs-5" id="exampleModalLabel">Dial / HexField </h1>
                        </div>
                        <div class="modal-body">
                           <p>Select Destination Address...</p>
                           <div id="hex-address-list" style="overflow-y:auto;"></div>
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

        this._maxAddresses = 100;
    }

    _randomColor() {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 60%)`;
    }

    connectedCallback() {
        registerGnoSysServerEventHandler(ServerEvent.WARP, addrList => {
            const list = this.querySelector('#hex-address-list');
            if (list) {
                list.innerHTML = '';
                if (addrList && Array.isArray(addrList.addresses)) {
                    addrList.addresses.forEach(addr => {
                        const div = document.createElement('div');

                        div.classList.add('arcane-container-item');
                        const name = document.createElement('span');
                        name.classList.add('w-20');
                        name.classList.add('hex-address');
                        name.style.color = this._randomColor();
                        name.textContent = `${addr.address}`;
                        const intensity = document.createElement('span');
                        intensity.classList.add('w-20');
                        intensity.textContent = `| *** ${addr.intensity}`;

                        const biome = document.createElement('span');
                        biome.classList.add('w-20');
                        biome.textContent = `| Biome: ${addr.biome}`;

                        const haz = document.createElement('span');
                        haz.classList.add('w-50');
                        haz.textContent = "| " + addr.hazards.join(', ');
                        div.appendChild(name);
                        div.appendChild(intensity);
                        div.appendChild(biome);
                        div.appendChild(haz);
                        div.addEventListener('click', () => {
                            document.querySelectorAll('.modal.show').forEach(modalEl => {
                                bootstrap.Modal.getOrCreateInstance(modalEl).hide();
                            });
                            gnoSysTransmitClientEvent(ClientEvent.DIAL_HEX_ADDRESS, addr.address);
                        })
                        list.appendChild(div);
                    });
                }
                this._trimList(list);
                decorateUI(list);
            }
            if (window.bootstrap) {
                const modalElement = document.querySelector(`#hexGateDial`);
                if (modalElement) {
                    let modal = new bootstrap.Modal(modalElement);
                    modal.show();
                } else {
                    console.warn(`Modal element with id hexGateDial" not found.`);
                    return;
                }
            } else {
                console.warn("Bootstrap's JavaScript is not loaded or modal element is missing.");
            }
        });
    }


    _trimList(list) {
        while (list.children.length > this._maxAddresses) {
            const first = list.firstChild;
            const height = first.offsetHeight;
            list.removeChild(first);
            list.scrollTop -= height;
        }
    }
}

customElements.define('hex-gate-dialer', HexGateDialer);
