import {ClientEvent} from "../../constants/client_events.js";
import {ServerEvent} from "../../constants/server_events.js";
import {decorateHerbPrefix} from "../../util/prefix_decorator.js";
import {formatTinctureName} from "../../util/word_splitter.js";
import {attachHoldRepeat} from "../../util/hold-repeat.js";

class BrewModal extends HTMLElement {

    constructor() {
        super();
        this.innerHTML = `
            <div class="modal fade" id="brewModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-xl">
                    <div class="modal-content arcane-container" style="background: #1f1f23;">
                        <div class="modal-header">
                            <h1 class="modal-title arcane-container-header fs-5" id="exampleModalLabel">Brew / Tincture</h1>
                        </div>
                        <div class="modal-body">
                            <div class="brew-container d-flex justify-content-around">
                                <div class="tinctures w-50" id="tinctures-container">
                                    <h6 class="arcane-container-header">Tinctures</h6>
                                </div>
                                <div class="ingredients w-50" id="ingredients-container">
                                <h6 class="arcane-container-header">Herbs</h6>
                        </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <div class="brew-button">
                                <div class="arcane-container-item" id="brew-button">Brew</div>
                            </div>
                            <div class="arcane-container-standalone-item">
                                <div class="arcane-container-item" data-bs-dismiss="modal">Exit</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.recipes = [];
        this.currentIngredientList = [];
        this.brewButtonEnabled = false;
        registerGnoSysServerEventHandler(ServerEvent.REGISTERED_ITEMS, registeredItems => {
            this.recipes = this.toRecipes(registeredItems);
            this.currentIngredientList = [];
        });

    }

    connectedCallback() {
        registerGnoSysServerEventHandler(ServerEvent.PLAYER_UPDATE, playerInfo => {
            this.updateView(playerInfo);
        });

        const brewButton = this.querySelector('#brew-button');
        if (brewButton) {
            const brewOnce = () => {
                const selected = this.querySelector('input[data-tincture]:checked');
                if (!(selected && this.brewButtonEnabled)) return;
                const selectedIngredients = this.querySelectorAll('input[data-ingredient]:checked');
                gnoSysTransmitClientEvent(ClientEvent.ADD_ITEM, `{
                        "_type": "Tincture",
                        "name": "${brewButton.dataset.name}",
                        "tile": "TINCTURE",
                        "prefix": "${brewButton.dataset.prefix}",
                        "resonance": ${brewButton.dataset.resonance},
                        "status_effects": [${selected.dataset.effects.split(",").map(p => `"${p}"`).join(",")}]
                    }`);
                [...selectedIngredients].map(s => s.dataset).forEach(ds => {
                    gnoSysTransmitClientEvent(ClientEvent.REMOVE_ITEM, `${ds.rawName}:${ds.prefix}:${ds.resonance}`);
                });
            };

            // Single click still brews once
            brewButton.addEventListener('click', brewOnce);

            // Hold-to-repeat, fires every 50ms after a short delay
            attachHoldRepeat(
                brewButton,
                () => brewOnce(),
                {
                    interval: 50,
                    startDelay: 250,
                    animateClass: 'hold-repeat',
                    canRun: () => this.brewButtonEnabled && !brewButton.classList.contains('btn-disabled')
                }
            );
        }
    }

    updateView(playerInfo){
        let newIngredientList = this.getIngredientListN(playerInfo);
        if (this.inventoriesEqual(newIngredientList, this.currentIngredientList)) {
            return;
        }
        this.currentIngredientList = newIngredientList;
        let currentCreatableList = this.getCurrentCreatableList(playerInfo, newIngredientList);
        this.updateIngredientList(playerInfo, newIngredientList);
        this.updateCreatableList(playerInfo, currentCreatableList);
        this.updateBrewButtonStatus();
    }

    updateBrewButtonStatus() {
        const brewButton          = this.querySelector('#brew-button');
        const selTinctureEl       = this.querySelector('input[data-tincture]:checked');
        const selIngredientEls    = Array.from(this.querySelectorAll('input[data-ingredient]:checked'));

        
        if (!selTinctureEl) {
            this._disableBrewButton(brewButton);
            return;
        }

        
        const required = JSON.parse(selTinctureEl.dataset.ingredients)
            .map(raw => this.normalizeName(raw));

        
        const selectedNorms = selIngredientEls.map(
            el => this.normalizeName(el.dataset.rawName)
        );

        
        const hasAll = required.every(req => selectedNorms.includes(req));
        const exactCount = selIngredientEls.length === required.length;

        if (hasAll && exactCount) {
            this.brewButtonEnabled = true;
            const WEIGHTS = { Weak: 1, Mild: 2, Strong: 3, Potent: 4 };
            const PREFIX_BY_WEIGHT = Object.entries(WEIGHTS)
                .reduce((acc, [name, w]) => { acc[w] = name; return acc }, {});
            const total = selIngredientEls.reduce(
                (sum, el) => sum + (WEIGHTS[el.dataset.prefix] || 1),
                0
            );
            const avg    = total / selIngredientEls.length;
            const w      = Math.max(1, Math.min(4, Math.floor(avg)));
            const prefix = PREFIX_BY_WEIGHT[w];
            const totalRes = selIngredientEls.reduce(
                (sum, el) => sum + (Number(el.dataset.resonance) || 0), 0
            );
            const avgRes  = Math.round(totalRes / selIngredientEls.length);
            const tincName= selTinctureEl.dataset.tincture;
            brewButton.innerHTML = `
            <span class="indicator">/ </span>
            Brew / ${prefix} / ${tincName} / ${avgRes}***
        `;
            brewButton.dataset.prefix    = prefix;
            brewButton.dataset.name      = tincName;
            brewButton.dataset.resonance = avgRes;
            brewButton.classList.remove('btn-disabled');
            brewButton.parentElement.classList.remove('w-20');
            brewButton.parentElement.classList.add("w-50");
        } else {
            this._disableBrewButton(brewButton);
        }
    }


    _disableBrewButton(brewButton) {
        this.brewButtonEnabled = false;
        delete brewButton.dataset.prefix;
        delete brewButton.dataset.name;
        delete brewButton.dataset.resonance;
        brewButton.innerHTML = `
        <span class="indicator">/ </span>
        Invalid Recipe
    `;
        brewButton.parentElement.classList.add("w-20");
        brewButton.parentElement.classList.remove("w-50");
        brewButton.classList.add('btn-disabled');
    }
    getSlotId(slot) {
        const norm   = this.normalizeName(slot.item.name);
        const prefix = slot.item.prefix;
        const reson  = slot.item.resonance;
        return `${norm}|${prefix}|${reson}`;
    };

    updateIngredientList(playerInfo, newIngredientList) {
        const ingContainer = this.querySelector('#ingredients-container');
        const ingredientElements = this.querySelectorAll('input[data-ingredient]');

        
        const selTincture = this.querySelector('input[data-tincture]:checked');
        const requiredNorms = selTincture
            ? JSON.parse(selTincture.dataset.ingredients)
                .map(raw => this.normalizeName(raw))
            : [];

        
        const existingIds = new Set(
            Array.from(ingredientElements).map(el => el.dataset.ingredient)
        );
        const countsById = newIngredientList.reduce((map, slot) => {
            map[this.getSlotId(slot)] = slot.count;
            return map;
        }, {});
        const newIds = new Set(Object.keys(countsById));

        
        Array.from(ingredientElements)
            .filter(el => !newIds.has(el.dataset.ingredient))
            .forEach(el => {
                const wrapper = el.closest('.checkbox-wrapper');
                if (wrapper) {
                    
                    if (requiredNorms.length) {
                        this.querySelectorAll('input[data-ingredient]').forEach(el => {
                            const wrapper = el.closest('.checkbox-wrapper');
                            if (!wrapper) return;
                            const norm = this.normalizeName(el.dataset.rawName);
                            if (requiredNorms.includes(norm)) {
                                wrapper.classList.remove('hidden-ingredient');
                            }
                        });
                    }
                    wrapper.remove();
                }
            });



        
        newIngredientList.forEach(slot => {
            const id = this.getSlotId(slot);
            if (!existingIds.has(id)) {
                this.createIngredientElement(slot);
            }
        });

        
        Object.entries(countsById).forEach(([id, newCount]) => {
            const checkbox = this.querySelector(`input[data-ingredient="${id}"]`);
            if (!checkbox) return;
            const oldCount = Number(checkbox.dataset.count);
            if (newCount !== oldCount) {
                checkbox.dataset.count = String(newCount);
                const container = checkbox.closest('.checkbox-wrapper');
                const desc      = container?.querySelector('.ingredient-description');
                const qtySpan   = desc?.querySelector('span.w-20:nth-child(3)');
                if (qtySpan) qtySpan.textContent = `| Quantity: ${newCount}`;
            }
        });

        
        ingContainer.querySelectorAll('.error-message').forEach(e => e.remove());
        if (!ingContainer.querySelector('.checkbox-wrapper')) {
            const err = document.createElement('span');
            err.classList.add('error-message');
            err.textContent = 'Err: No Herbs Found';
            ingContainer.appendChild(err);
        }

        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
    }


    createIngredientElement(itemSlot) {
        const ingredientsContainer = this.querySelector('#ingredients-container');
        const norm   = this.normalizeName(itemSlot.item.name);
        const prefix = itemSlot.item.prefix;
        const reson  = itemSlot.item.resonance;
        const id     = this.getSlotId(itemSlot);

        const wrapper = document.createElement('div');
        wrapper.classList.add('checkbox-wrapper');

        
        const selTinct = this.querySelector('input[data-tincture]:checked');
        if (selTinct) {
            const allowed = JSON.parse(selTinct.dataset.ingredients)
                .map(p => this.normalizeName(p));
            if (!allowed.includes(norm)) {
                wrapper.classList.add('hidden-ingredient');
            }
        }

        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('hidden-input');
        checkbox.dataset.ingredient = id;
        checkbox.dataset.rawName    = itemSlot.item.name;
        checkbox.dataset.prefix     = prefix;
        checkbox.dataset.resonance  = reson;
        checkbox.dataset.count      = itemSlot.count;

        const indicator = document.createElement('span');
        indicator.classList.add('checkbox-indicator');
        indicator.textContent = '/';

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('ingredient-description');
        nameSpan.innerHTML = `
      <span class="w-40"> ${decorateHerbPrefix(itemSlot.item.prefix)} ${itemSlot.item.name}</span>
      <span class="w-20">| *** ${reson}</span>
      <span class="w-20">| Quantity: ${itemSlot.count}</span>
    `;

        label.append(checkbox, indicator, nameSpan);
        wrapper.append(label);
        ingredientsContainer.append(wrapper);

        checkbox.addEventListener('change', () => {
            this.updateBrewButtonStatus();
            if (checkbox.checked) {
                indicator.textContent = '➜';
                label.classList.add('selected');
                wrapper.classList.add('selected');
                
                this.querySelectorAll('input[data-ingredient]').forEach(other => {
                    if (other !== checkbox &&
                        this.normalizeName(other.dataset.rawName) === norm
                    ) {
                        other.closest('.checkbox-wrapper').classList.add('hidden-ingredient');
                    }
                });
                
                this.querySelectorAll('input[data-tincture]').forEach(t => {
                    const ingr = JSON.parse(t.dataset.ingredients)
                        .map(p => this.normalizeName(p));
                    if (!ingr.includes(norm)) {
                        t.closest('.checkbox-wrapper').classList.add('hidden-ingredient');
                    }
                });
            } else {
                indicator.textContent = '/';
                label.classList.remove('selected');
                wrapper.classList.remove('selected');

                
                this.querySelectorAll('input[data-ingredient]').forEach(other => {
                    if (this.normalizeName(other.dataset.rawName) === norm) {
                        other.closest('.checkbox-wrapper').classList.remove('hidden-ingredient');
                    }
                });
                const selectedTinctures = this.querySelectorAll('input[data-tincture]:checked');
                if(!!selectedTinctures.length){
                    const selectedIngredients = this.querySelectorAll('input[data-ingredient]:checked');
                    if(selectedIngredients.length < 1){
                        this.resetAllCheckboxes();
                    }
                    return;
                }
                const tinctures = this.querySelectorAll('input[data-tincture]');
                const checkedEls = this.querySelectorAll('input[data-ingredient]:checked');
                const selected = Array.from(checkedEls, el => this.normalizeName(el.dataset.rawName));

                tinctures.forEach(tincture => {
                    const parentWrap = tincture.closest('.checkbox-wrapper');
                    
                    const ingredients = JSON.parse(tincture.dataset.ingredients)
                        .map(name => this.normalizeName(name));
                    if (selected.length === 0) {
                        parentWrap.classList.remove('hidden-ingredient');
                        return;
                    }
                    const matchesAll = selected.every(ing => ingredients.includes(ing));
                    parentWrap.classList.toggle('hidden-ingredient', !matchesAll);
                });

            }
            this.updateBrewButtonStatus();
        });
    }

    updateCreatableList(playerInfo, currentCreatableList) {
        const tincContainer = this.querySelector('#tinctures-container');
        
        tincContainer.querySelectorAll('.error-message').forEach(e => e.remove());

        
        const availableNorms = this.currentIngredientList
            .map(slot => this.normalizeName(slot.item.name));

        
        const fullyValid = new Set(
            Array.from(currentCreatableList).filter(recipeName => {
                const recipe = this.recipes.find(r => r.name === recipeName);
                if (!recipe) return false;
                const requiredNorms = recipe.ingredients.map(p => this.normalizeName(p));
                return requiredNorms.every(rn => availableNorms.includes(rn));
            })
        );

        
        this.querySelectorAll('input[data-tincture]').forEach(el => {
            if (!fullyValid.has(el.dataset.tincture)) {
                const wrap = el.closest('.checkbox-wrapper');
                if (wrap) {
                    wrap.remove();
                    this.resetAllCheckboxes();
                }
            }
        });

        
        const existing = new Set(
            Array.from(this.querySelectorAll('input[data-tincture]'))
                .map(el => el.dataset.tincture)
        );

        
        fullyValid.forEach(name => {
            if (!existing.has(name)) {
                const recipe = this.recipes.find(r => r.name === name);
                if (recipe) this.createCreatableElement(recipe);
            }
        });

        
        if (tincContainer.querySelectorAll('.checkbox-wrapper').length === 0) {
            const err = document.createElement('span');
            err.classList.add('error-message');
            err.textContent = 'Err: No brewable tinctures found';
            tincContainer.appendChild(err);
        }

        const wrappers = Array.from(
            tincContainer.querySelectorAll('.checkbox-wrapper')
        );
        wrappers.sort((a, b) => {
            const aCount = JSON.parse(
                a.querySelector('input[data-tincture]').dataset.ingredients
            ).length;
            const bCount = JSON.parse(
                b.querySelector('input[data-tincture]').dataset.ingredients
            ).length;
            return bCount - aCount;
        });
        
        wrappers.forEach(w => tincContainer.appendChild(w));
    }


    getQuantitySpan(rawName) {
        const checkbox = this.querySelector(`input[data-raw-name="${rawName}"]`);
        if (!checkbox) return null;
        const label = checkbox.parentElement;
        if (!label) return null;
        const qtySpans = label.querySelectorAll('.ingredient-description > span.w-20');
        return qtySpans[1] || null;
    }


    createCreatableElement(recipe) {
        const tincturesContainer = this.querySelector('#tinctures-container');

        
        const wrapper = document.createElement('div');
        wrapper.classList.add('checkbox-wrapper');

        
        const recipeSet = new Set(
            recipe.ingredients.map(raw => this.normalizeName(raw))
        );

        
        
        const selIngs = Array.from(
            this.querySelectorAll('input[data-ingredient]:checked')
        ).map(el => this.normalizeName(el.dataset.rawName));
        if (selIngs.length > 0 && !selIngs.every(name => recipeSet.has(name))) {
            wrapper.classList.add('hidden-ingredient');
        }

        
        const label    = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type                = 'checkbox';
        checkbox.classList.add('hidden-input');
        checkbox.dataset.tincture    = recipe.name;
        checkbox.dataset.effects = recipe.effects.join();
        
        checkbox.dataset.ingredients = JSON.stringify(recipe.ingredients);

        const indicator = document.createElement('span');
        indicator.classList.add('checkbox-indicator');
        indicator.textContent = '/';

        label.append(checkbox, indicator, recipe.name);
        wrapper.appendChild(label);
        tincturesContainer.appendChild(wrapper);

        
        checkbox.addEventListener('change', () => {
            this.updateBrewButtonStatus();
            if (checkbox.checked) {
                checkbox.checked = true;
                indicator.textContent = '➜';
                label.classList.add('selected');
                wrapper.classList.add('selected');

                
                this.querySelectorAll('input[data-ingredient]').forEach(ingChk => {
                    const name = this.normalizeName(ingChk.dataset.rawName);
                    const pw   = ingChk.closest('.checkbox-wrapper');
                    if (recipeSet.has(name)) {
                        
                    } else {
                        pw.classList.add('hidden-ingredient');
                    }
                });

                
                this.querySelectorAll('input[data-tincture]:not(:checked)')
                    .forEach(t => t.closest('.checkbox-wrapper').classList.add('hidden-ingredient'));
            } else {
                
                this.resetAllCheckboxes();
                this.querySelectorAll('.hidden-ingredient').forEach(el =>
                    el.classList.remove('hidden-ingredient')
                );
            }
        });
    }

    getCurrentCreatableList(playerInfo, ingredientList) {
        
        const countsByName = ingredientList.reduce((map, slot) => {
            map[this.normalizeName(slot.item.name)] = slot.count;
            return map;
        }, {});

        const availableCreatables = new Set();
        this.recipes.forEach(r => {
            
            const availableCount = r.ingredients.reduce((cnt, ing) => {
                return cnt + (countsByName[this.normalizeName(ing)] > 0 ? 1 : 0);
            }, 0);

            if (availableCount >= 1) {
                availableCreatables.add(r.name);
            }
        });

        return availableCreatables;
    }

    getIngredientList(playerInfo){
        const availableIngredients = {};
        playerInfo.inventory?.slots
            .filter(f => f.item._type === "Herb")
            .forEach(slot => {
                const name = this.normalizeName(this.getItemName(slot.item));
                availableIngredients[name] = slot.count;
        });
        return availableIngredients;
    }
    getIngredientListN(playerInfo){
        let filter = playerInfo.inventory?.slots.filter(f => f.item._type === "Herb");
        return filter;
    }
    toRecipes(data) {
        
        const herbs = data.items.filter(item =>
            item._type === "Herb" &&
            Array.isArray(item.status_effects) &&
            item.status_effects.length === 1
        );

        const recipesMap = new Map();

        
        const addRecipe = (effects, names) => {
            const title = `${effects.join(' ')}`;
            recipesMap.set(title, { name: formatTinctureName(effects), ingredients: names, effects });
        };

        
        herbs.forEach(h => {
            addRecipe(
                h.status_effects,
                [ h.name ]
            );
        });

        
        for (let i = 0; i < herbs.length; i++) {
            for (let j = i + 1; j < herbs.length; j++) {
                const e1 = herbs[i].status_effects[0];
                const e2 = herbs[j].status_effects[0];
                if (e1 === e2) continue;

                const effects = [e1, e2].sort();
                addRecipe(
                    effects,
                    [ herbs[i].name, herbs[j].name ]
                );
            }
        }

        
        for (let i = 0; i < herbs.length; i++) {
            for (let j = i + 1; j < herbs.length; j++) {
                for (let k = j + 1; k < herbs.length; k++) {
                    const e1 = herbs[i].status_effects[0];
                    const e2 = herbs[j].status_effects[0];
                    const e3 = herbs[k].status_effects[0];
                    const uniqueEffects = Array.from(new Set([e1, e2, e3]));
                    if (uniqueEffects.length < 3) continue;
                    const effects = uniqueEffects.sort();
                    addRecipe(
                        effects,
                        [ herbs[i].name, herbs[j].name, herbs[k].name ]
                    );
                }
            }
        }

        
        return Array.from(recipesMap.values());
    }


    getItemName(item) {
        return (typeof item === 'string') ? item : (item.name || '');
    }
    normalizeName(name) {
        return name?.toLowerCase().replace(/\s/g, '');
    }
    clearTinctures(){
        this.querySelectorAll('input[data-tincture]').forEach(chk => {
            chk.checked = false;
            const label = chk.parentElement;
            const wrap = chk.closest('.checkbox-wrapper');
            const ind = label.querySelector('.checkbox-indicator');
            if (ind) ind.textContent = '/';
            label.classList.remove('selected', 'hidden-ingredient');
            wrap && wrap.classList.remove('selected', 'hidden-ingredient');
        });

    }

    clearIngredients(){
        this.querySelectorAll('input[data-ingredient]').forEach(chk => {
            chk.checked = false;
            const label = chk.parentElement;
            const wrap = chk.closest('.checkbox-wrapper');
            const ind = label.querySelector('.checkbox-indicator');
            if (ind) ind.textContent = '/';
            label.classList.remove('selected', 'hidden-ingredient');
            wrap && wrap.classList.remove('selected', 'hidden-ingredient');
        });
    }


    resetAllCheckboxes() {
        this.updateBrewButtonStatus();
        this.clearTinctures()
        this.clearIngredients();
    }

    
    inventoriesEqual(inv1, inv2) {
        if(!inv2 || !inv1){
            return false;
        }
        
        const slotKey = slot =>
            `${this.normalizeName(slot.item.name)}|${slot.item.prefix}|${slot.item.resonance}`;

        
        const map1 = inv1.reduce((m, slot) => {
            m[slotKey(slot)] = slot.count;
            return m;
        }, {});
        const map2 = inv2.reduce((m, slot) => {
            m[slotKey(slot)] = slot.count;
            return m;
        }, {});

        
        const keys1 = Object.keys(map1).sort();
        const keys2 = Object.keys(map2).sort();
        if (keys1.length !== keys2.length) return false;
        return keys1.every((k, i) => keys2[i] === k && map1[k] === map2[k]);
    }
}

customElements.define('brew-modal', BrewModal);
