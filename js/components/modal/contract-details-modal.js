class ContractDetailsModal extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div class="modal fade" id="contractDetailsModal" tabindex="-1" aria-labelledby="contractDetailsLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content arcane-container" style="background: #1f1f23;">
                        <div class="modal-header">
                            <h1 class="modal-title arcane-container-header fs-5" id="contractDetailsLabel">Contract / Details</h1>
                        </div>
                        <div class="modal-body">
                            <div class="arcane-container-item">Details coming soon.</div>
                        </div>
                        <div class="modal-footer d-flex">
                            <div class="arcane-container-standalone-item">
                                <div class="arcane-container-item" id="contractCommit">Commit</div>
                            </div>
                            <div class="arcane-container-standalone-item ms-auto">
                                <div class="arcane-container-item" id="contractExit">Exit</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        const exitBtn = this.querySelector("#contractExit");
        if (exitBtn) {
            exitBtn.addEventListener("click", () => {
                const detailsEl = this.querySelector("#contractDetailsModal");
                const detailsModal = detailsEl ? bootstrap.Modal.getInstance(detailsEl) : null;
                if (detailsModal) detailsModal.hide();
                const networkEl = document.querySelector("#gnosysNetworkModal");
                const networkModal = networkEl ? new bootstrap.Modal(networkEl) : null;
                if (networkModal) networkModal.show();
            });
        }
    }
}

customElements.define("contract-details-modal", ContractDetailsModal);
