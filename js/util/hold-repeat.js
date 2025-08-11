// Reusable press-and-hold utility for repeat actions
// Usage: attachHoldRepeat(el, action, { interval: 50, startDelay: 300, animateClass: 'hold-repeat', canRun })

export function attachHoldRepeat(el, action, opts = {}) {
    const interval = Number(opts.interval ?? 50);          // ms between events
    const startDelay = Number(opts.startDelay ?? 300);     // ms before repeating starts
    const animateClass = opts.animateClass || 'hold-repeat';
    const canRun = typeof opts.canRun === 'function' ? opts.canRun : () => true;

    let holdTimer = null;  // setTimeout for startDelay
    let tickTimer = null;  // setInterval for repeats
    let isHolding = false;

    const clearTimers = () => {
        if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
        if (tickTimer) {
            clearInterval(tickTimer);
            tickTimer = null;
        }
    };

    const stop = () => {
        if (!isHolding) return;
        isHolding = false;
        clearTimers();
        el.classList.remove(animateClass);
    };

    const start = () => {
        if (isHolding) return;
        if (!canRun()) return;
        isHolding = true;
        el.classList.add(animateClass);

        // Fire once immediately for responsiveness
        if (canRun()) action();

        // After a short delay, begin repeating at the requested cadence
        holdTimer = setTimeout(() => {
            // Guard in case conditions changed
            if (!isHolding || !canRun()) {
                stop();
                return;
            }
            tickTimer = setInterval(() => {
                if (!canRun()) {
                    stop();
                    return;
                }
                action();
            }, interval);
        }, startDelay);
    };

    // Pointer and touch support
    const onDown = (e) => {
        // Only primary button
        if (e.type === 'mousedown' && e.button !== 0) return;
        start();
    };
    const onUp = () => stop();
    const onLeave = () => stop();

    el.addEventListener('mousedown', onDown);
    el.addEventListener('touchstart', onDown, {passive: true});
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    el.addEventListener('mouseleave', onLeave);

    // Escape to cancel
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') stop();
    });

    // Cleanup helper for callers if they need to detach
    return () => {
        stop();
        el.removeEventListener('mousedown', onDown);
        el.removeEventListener('touchstart', onDown);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('touchend', onUp);
        el.removeEventListener('mouseleave', onLeave);
    };
}

