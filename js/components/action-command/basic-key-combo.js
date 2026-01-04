import {runWaitThenActionTimer} from "../../util/action-timer.js";

class ActionCommandBasicCombo extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div class="action-accent" id="actionAccent">
                <div class="action-slots">
                    <div class="slot"></div>
                    <div class="slot"></div>
                    <div class="slot"></div>
                    <div class="slot"></div>
                </div>
                <kbd class="action-key transparent"><span id="actionKey">?</span></kbd>
            </div>
        `;
    }

    connectedCallback() {
        const slots = Array.from(this.querySelectorAll(".slot"));
        let element = this.querySelector("#actionKey");
        let  actionKey = this.querySelector(".action-key");
        runWaitThenActionTimer({
            waitMs: 5000,
            tickMs: 1000,
            actionMs: 4000,
            onWaitTick: ({ tick, totalTicks, remaining }) => {
                slots[tick].classList.add("lit");
                console.log(`Tick ${tick + 1}/${totalTicks} — ${Math.ceil(remaining / 1000)}s left`);
            },

            onWaitStart: () => console.log("Waiting..."),
            onWaitEnd: () => console.log("Action window open!"),

            onActionStart: () =>  {
                actionKey.classList.remove("transparent");
                element.textContent = "W";
            },
            onActionEnd: () => console.log("ACTION END"),

            keyFilter: (e) => ["1", "2", "3", "4"].includes(e.key),
        });
    }

}

customElements.define('basic-key-combo', ActionCommandBasicCombo);
