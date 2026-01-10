import {ServerEvent} from "../../constants/server_events.js";

class Log extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `<div class="log"></div>`;
        this._inactivityTimeout = null;
    }

    connectedCallback() {
        const logContainer = this.querySelector('.log');

        const setInactive = () => {
            logContainer.classList.add('inactive');
        };

        setInactive();
        registerGnoSysServerEventHandler(ServerEvent.NEW_LOG_MESSAGE, log => {
            clearTimeout(this._inactivityTimeout);
            logContainer.classList.remove('inactive');

            const now = new Date();
            const timeString = now.toLocaleTimeString();

            
            
            let hexColor = null;
            let message = log;
            if (log.startsWith('#')) {
                const colonIndex = log.indexOf(':');
                if (colonIndex !== -1) {
                    hexColor = log.substring(0, colonIndex).trim();
                    message = log.substring(colonIndex + 1).trim();
                }
            }

            const logEntry = document.createElement('div');
            logEntry.textContent = `/ ${timeString} / ${message}`;
            logEntry.classList.add('log-entry');

            if (hexColor) {
                logEntry.style.setProperty('--log-entry-color', hexColor);
            }

            
            logContainer.prepend(logEntry);
            logContainer.scrollTop = 0;

            
            const MAX_LOGS = 100;
            while (logContainer.children.length > MAX_LOGS) {
                logContainer.removeChild(logContainer.lastElementChild);
            }

            this._inactivityTimeout = setTimeout(setInactive, 3000);
        })
    }
}

customElements.define('arcane-log', Log);
