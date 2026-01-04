export function runWaitThenActionTimer({
                                           waitMs = 0,
                                           actionMs = 0,

                                           tickMs = null,              // e.g. 1000 for 1s ticks
                                           onWaitTick = () => {},      // (info) => void

                                           // Keyboard
                                           target = window,
                                           keyFilter = null,
                                           useCapture = true,

                                           // Callbacks
                                           onWaitStart = () => {},
                                           onWaitEnd = () => {},
                                           onActionStart = () => {},
                                           onActionEnd = () => {},
                                           onKeyDuringWait = () => {},
                                           onKeyDuringAction = () => {},
                                           onCancel = () => {},
                                       } = {}) {
    let phase = "idle";

    let waitKeyPressed = false;
    let actionKeyPressed = false;

    let waitTimeoutId = null;
    let actionTimeoutId = null;
    let tickIntervalId = null;

    const startTime = performance.now();

    const shouldCount = (e) =>
        typeof keyFilter === "function" ? keyFilter(e) : true;

    const onKeyDown = (e) => {
        if (!shouldCount(e)) return;

        if (phase === "wait") {
            waitKeyPressed = true;
            onKeyDuringWait(e);
        } else if (phase === "action") {
            actionKeyPressed = true;
            onKeyDuringAction(e);
        }
    };

    const addListener = () =>
        target.addEventListener("keydown", onKeyDown, { capture: useCapture });

    const removeListener = () =>
        target.removeEventListener("keydown", onKeyDown, { capture: useCapture });

    const clearTimers = () => {
        if (waitTimeoutId) clearTimeout(waitTimeoutId);
        if (actionTimeoutId) clearTimeout(actionTimeoutId);
        if (tickIntervalId) clearInterval(tickIntervalId);
    };

    const startActionPhase = () => {
        phase = "action";
        clearInterval(tickIntervalId);

        onActionStart({ waitKeyPressed });

        if (actionMs <= 0) {
            onActionEnd({ waitKeyPressed, actionKeyPressed });
            cleanup();
            return;
        }

        actionTimeoutId = setTimeout(() => {
            onActionEnd({ waitKeyPressed, actionKeyPressed });
            cleanup();
        }, actionMs);
    };

    const cleanup = () => {
        phase = "done";
        clearTimers();
        removeListener();
    };

    const cancel = () => {
        if (phase === "done" || phase === "canceled") return;
        phase = "canceled";
        clearTimers();
        removeListener();
        onCancel({ waitKeyPressed, actionKeyPressed });
    };

    // ---- WAIT PHASE ----
    addListener();

    if (waitMs > 0) {
        phase = "wait";
        onWaitStart();

        const waitStart = performance.now();

        if (tickMs && tickMs > 0) {
            let tickCount = 0;
            const totalTicks = Math.ceil(waitMs / tickMs);

            tickIntervalId = setInterval(() => {
                const now = performance.now();
                const elapsed = now - waitStart;
                const remaining = Math.max(waitMs - elapsed, 0);

                onWaitTick({
                    tick: tickCount,
                    totalTicks,
                    elapsed,
                    remaining,
                    progress: elapsed / waitMs,
                });

                tickCount++;

                if (elapsed >= waitMs) {
                    clearInterval(tickIntervalId);
                }
            }, tickMs);
        }

        waitTimeoutId = setTimeout(() => {
            onWaitEnd({ waitKeyPressed });
            startActionPhase();
        }, waitMs);
    } else {
        // No wait phase
        onWaitStart();
        onWaitEnd({ waitKeyPressed: false });
        startActionPhase();
    }

    return {
        cancel,
        getState: () => ({
            phase,
            waitKeyPressed,
            actionKeyPressed,
            waitMs,
            actionMs,
        }),
    };
}
