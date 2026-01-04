import {ServerEvent} from "../../constants/server_events.js";
import {STATUS_EFFECT_IMAGE_MAPPINGS} from "../../constants/status_effect_image_mappings.js";

class StatusRow extends HTMLElement {
    constructor() {
        super();
        this.statusRow = null;
        this.effectRow = null;
        this.sections = {};
        this.activeEffects = [];
    }

    connectedCallback() {
        
        this.statusRow = document.createElement('div');
        this.statusRow.classList.add('status-row');
        this.appendChild(this.statusRow);

        this.effectRow = document.createElement('div');
        this.effectRow.classList.add('status-row', 't-10');
        this.appendChild(this.effectRow);
        
        const createSection = (id, text) => {
            const section = document.createElement('div');
            section.classList.add('section');

            const header = document.createElement('div');
            header.classList.add('arcane-container-header');
            header.id = id;
            header.textContent = text;

            section.appendChild(header);
            this.statusRow.appendChild(section);

            this.sections[id] = header;
        };

        
        createSection('name', '');
        createSection('health', '');
        createSection('energy', '');
        createSection('pleroma', '');
        createSection('rank', '');

        registerGnoSysServerEventHandler(ServerEvent.PLAYER_UPDATE, playerInfo => {
            this.updateActiveEffects(playerInfo);
            this.sections['name'].textContent = playerInfo.name;
            this.sections['health'].textContent = `Vitality | ${playerInfo.health}/${playerInfo.max_health}`;
            this.sections['energy'].textContent = `Virility | ${playerInfo.energy}/${playerInfo.max_energy}`;
            this.sections['rank'].textContent = `*** ${playerInfo.rank}`;
            this.sections['pleroma'].textContent = `Pleroma | ${playerInfo.pleroma}`;
        });

        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift' && !e.repeat) {
                if (window.gameState && window.gameState !== "Playing") {
                    return;
                }
                if (this.statusRow) {
                    this.statusRow.classList.toggle('active');
                    this.effectRow.classList.toggle('active');
                }
            }
        });
    }

    updateActiveEffects(playerDetails) {
        
        const effectGroups = playerDetails.active_effects.reduce((map, ae) => {
            const name = ae.effect;
            if (!map[name]) map[name] = [];
            map[name].push(ae);
            return map;
        }, {});

        const currentIds = new Set(Object.keys(effectGroups));

        
        Object.keys(effectGroups).forEach(effect => {
            if (!this.querySelector(`#${effect}`)) {
                const wrapper = this.createStatusEffectElement(effect);
                this.effectRow.appendChild(wrapper);

                
                const icon = wrapper.querySelector('.status-effect-icon');
                requestAnimationFrame(() => {
                    icon.style.width = '3rem';
                });
            }
        });

        
        Object.entries(effectGroups).forEach(([effect, group]) => {
            const wrapper = this.querySelector(`#${effect}`);
            if (!wrapper) return;

            
            const totalCount = group.reduce((sum, ae) => sum + ae.time_remaining.count, 0);
            const totalLimit = group.reduce((sum, ae) => sum + ae.time_remaining.limit, 0);

            
            const pct = totalLimit > 0
                ? Math.max(0, Math.min(100, ((totalLimit - totalCount) / totalLimit) * 100))
                : 0;

            
            const bar = wrapper.querySelector('.progress-bar');
            bar.style.width = `${pct}%`;
            bar.setAttribute('aria-valuenow', Math.round(pct));

            
            const badge = wrapper.querySelector('.stack-badge');
            badge.textContent = group.length;
        });

        
        Array.from(this.effectRow.children).forEach(child => {
            if (!currentIds.has(child.id) && !child.classList.contains('removing')) {
                child.classList.add('removing');
                const icon = child.querySelector('.status-effect-icon');
                icon.style.width = '0';
                icon.addEventListener(
                    'transitionend',
                    () => child.remove(),
                    { once: true }
                );
            }
        });
    }

    createStatusEffectElement(effect) {
        
        const wrapper = document.createElement('div');
        wrapper.id = effect;
        wrapper.classList.add('status-effect-wrapper', 'text-center', 'me-2');
        wrapper.style.position = 'relative';

        
        const icon = document.createElement('img');
        icon.src = STATUS_EFFECT_IMAGE_MAPPINGS[effect];
        icon.classList.add('status-effect-icon', 'd-block', 'mx-auto');
        icon.style.width = '0';  
        wrapper.appendChild(icon);

        
        const badge = document.createElement('span');
        badge.classList.add(
            'stack-badge',
            'badge',
            'bg-secondary',
            'position-absolute',
            'top-0',
            'end-0'
        );
        badge.style.transform = 'translate(50%,-50%)';
        badge.textContent = '1';
        wrapper.appendChild(badge);

        
        const prog = document.createElement('div');
        prog.classList.add('progress', 'mt-1');
        prog.style.height = '4px';

        const bar = document.createElement('div');
        bar.classList.add('progress-bar');
        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-valuemin', '0');
        bar.setAttribute('aria-valuemax', '100');
        bar.style.width = '100%';
        prog.appendChild(bar);

        wrapper.appendChild(prog);
        return wrapper;
    }

}

customElements.define('status-row', StatusRow);
