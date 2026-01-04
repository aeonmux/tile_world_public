import {ServerEvent} from "../../constants/server_events.js";

window.notificationQueue = window.notificationQueue || [];
window.notificationShowing = window.notificationShowing || false;

window.collapseNotifications = function() {
    const container = document.getElementById('notification-toast-container');
    if (!container) return;
    const toasts = Array.from(container.querySelectorAll('.toast'));
    if (toasts.length === 0) {
        window.notificationShowing = false;
        return;
    }
    for (let i = 1; i < toasts.length; i++) {
        const t = toasts[i];
        const body = t.querySelector('.toast-body');
        if (body) {
            window.notificationQueue.push(body.textContent);
        }
        bootstrap.Toast.getOrCreateInstance(t).dispose();
        t.remove();
    }
    window.notificationShowing = true;
};

function createAndShow(message) {
    const container = document.getElementById('notification-toast-container');
    if (!container) return;

    const toastEl = document.createElement('div');
    toastEl.classList.add('toast', 'arcane-toast');
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.setAttribute('data-bs-delay', '5000');

    toastEl.innerHTML = `
<!--        <div class="toast-header">-->
<!--&lt;!&ndash;            <div class="arcane-container-header me-auto mb-0"> / Notification</div>&ndash;&gt;-->
<!--            <button type="button" class="btn-close btn-close-white ms-2 mb-1" data-bs-dismiss="toast" aria-label="Close"></button>-->
<!--        </div>-->
        <div class="toast-body">${message}</div>`;

    container.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl);
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
        window.notificationShowing = false;
        if (window.shiftMenuActive && window.notificationQueue.length) {
            window.showNextNotification();
        } else if (!window.shiftMenuActive) {
            while (window.notificationQueue.length) {
                createAndShow(window.notificationQueue.shift());
            }
        }
    });
    toast.show();
    window.notificationShowing = true;
}

window.showNextNotification = function() {
    if (window.notificationQueue.length) {
        createAndShow(window.notificationQueue.shift());
    }
};

window.showClientNotification = function(message) {
    if (window.shiftMenuActive) {
        if (window.notificationShowing) {
            window.notificationQueue.push(message);
        } else {
            createAndShow(message);
        }
    } else {
        createAndShow(message);
        while (window.notificationQueue.length) {
            createAndShow(window.notificationQueue.shift());
        }
    }
};

class ClientNotification extends HTMLElement {
    connectedCallback() {
        registerGnoSysServerEventHandler(ServerEvent.CLIENT_NOTIFICATION, message => {
            window.showClientNotification(message);
        });
    }
}

customElements.define('client-notification', ClientNotification);
