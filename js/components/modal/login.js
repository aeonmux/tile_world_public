import {decorateUI} from "../../util/ui-decorator.js";
import {ServerEvent} from "../../constants/server_events.js";

class LoginModal extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = this.getTemplate();
        this.modals = {};
    }

    
    getTemplate() {
        return `
            <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content arcane-container" style="background: #1f1f23;">
                        <div class="modal-header">
                            <h1 class="modal-title arcane-container-header fs-5" id="exampleModalLabel">/ New Account</h1>
                        </div>
                        <div class="modal-body">
                          <form class="mx-5 px-5">
                              <div class="mb-3">
                                <input type="text" placeholder="/ Username..." id="username">
                              </div>
                          </form> 
                        </div>
                        <div class="modal-footer">
                            <div class="arcane-container-standalone-item">
                                <div class="arcane-container-item" id="createNewSave" data-bs-dismiss="modal">Create</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal fade" id="accountModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content arcane-container" style="background: #1f1f23;">
                        <div class="modal-header">
                            <h1 class="modal-title arcane-container-header fs-5" id="exampleModalLabel">/ Accounts</h1>
                        </div>
                        <div class="modal-body">
                                <!-- Accounts will be loaded here -->
                        </div>
                        <div class="modal-footer d-flex">
                            <div class="arcane-container-standalone-item">
                                <div class="arcane-container-item" id="invokeCreateUser" data-bs-dismiss="modal">New Account</div>
                            </div>
                            <div class="arcane-container-standalone-item ms-auto">
                                <div class="arcane-container-item" id="deleteAllAccounts">Delete / All</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    
    initializeModals() {
        const loginModalElement = document.querySelector("#loginModal");
        const accountModalElement = document.querySelector("#accountModal");
        this.modals.login = new bootstrap.Modal(loginModalElement);
        this.modals.account = new bootstrap.Modal(accountModalElement);
    }

    
    bindEventListeners() {
        const createButton = this.querySelector('#createNewSave');
        if (createButton) {
            createButton.addEventListener('click', () => this.createNewSave());
        }

        const invokeCreateAccountButton = this.querySelector('#invokeCreateUser');
        if (invokeCreateAccountButton) {
            invokeCreateAccountButton.addEventListener('click', () => this.modals.login.show());
        }

        const deleteAllBtn = this.querySelector('#deleteAllAccounts');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', async () => {
                if (!window.electron) return;
                const ok = confirm('Purge all accounts? This cannot be undone.');
                if (!ok) return;
                const res = await window.electron.deleteAllSaves();
                if (res?.success) {
                    this.loadAccountData();
                } else {
                    console.warn('Failed to delete all saves', res?.error);
                }
            });
        }
    }

    
    async loadAccountData() {
        if (!window.electron) {
            console.warn('Save data is not available. Ensure it is exposed via preload.');
            return;
        }
        try {
            const saveData = await window.electron.findSaveData();

            const accountsContainer = this.querySelector("#accountModal .modal-body");
            if (accountsContainer) {
                accountsContainer.innerHTML = ''; 
                Object.keys(saveData).forEach(key => {
                    const account = saveData[key];
                    const row = document.createElement('div');
                    row.classList.add('d-flex', 'justify-content-between', 'align-items-center');

                    // Left: account info (click to load)
                    const infoWrap = document.createElement('div');
                    infoWrap.classList.add('arcane-container-standalone-item', 'w-70', 'mx-2');
                    const infoItem = document.createElement('div');
                    infoItem.classList.add('arcane-container-item');
                    infoItem.innerHTML = `
                        <span class="w-20">${account.name}</span>
                        <span class="w-20">| Rank: ${account.rank}</span>
                        <span class="w-20">| Pleroma: ${account.pleroma}</span>
                        <span class="w-20">| Playtime: 12:23:22</span>
                    `;
                    infoItem.addEventListener('click', async () => {
                        if (window.electron && typeof window.electron.findHeapData === "function") {
                            try {
                                const heap = await window.electron.findHeapData(account.name);
                                if (heap) {
                                    console.log("sending heap data ");
                                    gnoSysTransmitClientEvent("LoadHeap", JSON.stringify(heap));
                                }
                            } catch (error) {
                                console.error("Error loading heap data:", error);
                            }
                        }
                        gnoSysTransmitClientEvent("LoadSave", JSON.stringify(account));
                        this.modals.account.hide();
                    });
                    infoWrap.appendChild(infoItem);

                    // Right: delete button
                    const delWrap = document.createElement('div');
                    delWrap.classList.add('arcane-container-standalone-item', 'mx-2');
                    const delBtn = document.createElement('div');
                    delBtn.classList.add('arcane-container-item');
                    delBtn.textContent = 'Delete / Account';
                    delBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (!window.electron) return;
                        const ok = confirm(`Delete account \"${account.name}\"?`);
                        if (!ok) return;
                        const res = await window.electron.deleteSave(account.name);
                        if (res?.success) {
                            this.loadAccountData();
                        } else {
                            console.warn('Failed to delete account', res?.error);
                        }
                    });
                    delWrap.appendChild(delBtn);

                    row.append(infoWrap, delWrap);
                    accountsContainer.appendChild(row);
                });
                decorateUI(document);
            }
        } catch (error) {
            console.error("Error loading account data:", error);
        }
    }

    
    async createNewSave() {
        this.modals.account.show();
        if (!window.electron) return;

        const usernameInput = this.querySelector('#username');
        if (!usernameInput) return;
        const username = usernameInput.value.trim();

        try {
            const saveData = await window.electron.findSaveData();
            if (!Object.keys(saveData).includes(username)) {
                gnoSysTransmitClientEvent("CreateUser", username);

                handleGnosysServerEventOnce(ServerEvent.PLAYER_UPDATE, this.handleNewSave.bind(this))
            }
        } catch (error) {
            console.error("Error creating new save:", error);
        }
    }


    handleNewSave(playerInfo) {
        console.log(playerInfo.name);
        if (window.electron && typeof window.electron.createNewSave === "function") {
            window.electron.createNewSave(playerInfo).then(() => {
                this.loadAccountData();
            });
        }
    }

    showAccountModal() {
        const accountEl = document.getElementById('accountModal');
        const loginEl = document.getElementById('loginModal');
        const accountVisible = accountEl?.classList.contains('show');
        const loginVisible = loginEl?.classList.contains('show');

        if (!accountVisible && !loginVisible) {
            this.modals.account.show();
        }
    }


    connectedCallback() {
        this.initializeModals();
        this.bindEventListeners();
        this.loadAccountData();
        decorateUI(document);
    }

}

customElements.define('login-modal', LoginModal);
