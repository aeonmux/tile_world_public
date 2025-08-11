export function splitWords(text, _class) {
    return text.split(' ').flatMap((word, index) => {
        const span = document.createElement('span');
        let splitter = document.createElement('span');
        span.classList.add(_class ? _class : "n");
        splitter.classList.add();
        splitter.textContent = "+>"
        span.textContent = word;
        return index > 0 ? [splitter, span] : [span];
    });
}

const TinctureNamePart = Object.freeze({
    Vitalized: {f_name: "Vitalization", prefix: false},
    Charged: {f_name: "Charged", prefix: true},
    Limber: {f_name: "Relieving", prefix: false},
    IronSkinned: {f_name: "Tough", prefix: true},
    Wired: {f_name: "Wired", prefix: true},
    Swift: {f_name: "Swiftness", prefix: false},
    Blessed: {f_name: "Blessed", prefix: false},
    Aware: {f_name: "Awareness", prefix: false},
    Focused: {f_name: "Focus", prefix: false},
    Virile: {f_name: "Vigor", prefix: false},
});

export function formatTinctureName(effects) {
    
    const parts = effects.map(key => {
        const part = TinctureNamePart[key];
        if (!part) throw new Error(`Unknown tincture key: ${key}`);
        return part;
    });

    
    const prefixes = parts
        .filter(p => p.prefix)
        .map(p => p.f_name);

    const bases = parts
        .filter(p => !p.prefix)
        .map(p => p.f_name);

    
    const prefixText = prefixes.length
        ? prefixes.join(' ') + ' '
        : '';

    
    const baseText = bases.length > 1
        ? bases.join(' & ')
        : bases[0] || '';

    
    if (bases.length) {
        return `${prefixText}Tincture of ${baseText}`;
    }

    
    if (prefixes.length) {
        return `${prefixText}Tincture`;
    }

    
    return 'Tincture';
}

export function splitWordsHTMLString(text, _class) {
    return splitWords(text, _class)
        .map(el => el.outerHTML)
        .join('');
}
