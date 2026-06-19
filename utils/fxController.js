// fxController.js

import { 
    getEffectParams, 
    setEffectParam, 
    getEffectParam,
    getAvailableEffects 
} from "../../utils/footswitchPreset.js";

console.log("fxController.js ver. 001 loaded");

// ============================================================
// STATO
// ============================================================

let isPanelOpen = false;
let effectGroups = {};

// ============================================================
// INIZIALIZZAZIONE
// ============================================================

export function initFxController() {
    console.log("🎛️ Inizializzazione FX Controller...");
    
    // Crea la UI se non esiste
    if (!document.getElementById('fx-panel')) {
        createUI();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Genera i controlli per gli effetti
    buildEffectControls();
    
    console.log("✅ FX Controller pronto!");
}

// ============================================================
// CREAZIONE UI
// ============================================================

function createUI() {
    // Crea il toggle button
    const toggle = document.createElement('button');
    toggle.id = 'fx-toggle';
    toggle.textContent = '🎛️';
    toggle.title = 'Toggle FX Panel';
    document.body.appendChild(toggle);
    
    // Crea il pannello
    const panel = document.createElement('div');
    panel.id = 'fx-panel';
    panel.style.display = 'none';
    panel.innerHTML = `
        <div class="fx-header">
            <h3>🎛️ FX Controls</h3>
            <button id="fx-close">✕</button>
        </div>
        <div class="fx-search">
            <input type="text" id="fx-search" placeholder="🔍 Cerca effetto...">
        </div>
        <div id="fx-content"></div>
        <div class="fx-footer">
            <button id="fx-reset">🔄 Reset All</button>
            <span id="fx-status">✅ Live</span>
        </div>
    `;
    document.body.appendChild(panel);
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
    const toggle = document.getElementById('fx-toggle');
    const panel = document.getElementById('fx-panel');
    const close = document.getElementById('fx-close');
    const search = document.getElementById('fx-search');
    const reset = document.getElementById('fx-reset');
    
    // Toggle panel
    toggle.addEventListener('click', () => {
        isPanelOpen = !isPanelOpen;
        panel.style.display = isPanelOpen ? 'flex' : 'none';
        panel.classList.toggle('open', isPanelOpen);
        toggle.textContent = isPanelOpen ? '✕' : '🎛️';
        toggle.style.background = isPanelOpen ? 
            'linear-gradient(135deg, #ff6b6b, #ee5a24)' : 
            'linear-gradient(135deg, #ff6b6b, #ee5a24)';
    });
    
    // Close
    close.addEventListener('click', () => {
        isPanelOpen = false;
        panel.style.display = 'none';
        panel.classList.remove('open');
        toggle.textContent = '🎛️';
    });
    
    // Search
    search.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.fx-group').forEach(group => {
            const name = group.dataset.effect.toLowerCase();
            group.style.display = name.includes(query) ? 'block' : 'none';
        });
    });
    
    // Reset all
    reset.addEventListener('click', resetAllEffects);
}

// ============================================================
// COSTRUISCI CONTROLLI
// ============================================================

function buildEffectControls() {
    const container = document.getElementById('fx-content');
    container.innerHTML = '';
    
    const effects = getAvailableEffects();
    
    // Ordina effetti per nome
    const sortedEffects = effects.sort();
    
    // Filtra solo effetti con parametri
    const effectsWithParams = sortedEffects.filter(name => {
        return getEffectParams(name) !== null;
    });
    
    if (effectsWithParams.length === 0) {
        container.innerHTML = '<div class="fx-no-results">Nessun effetto disponibile</div>';
        return;
    }
    
    effectsWithParams.forEach(effectName => {
        const params = getEffectParams(effectName);
        const group = createEffectGroup(effectName, params);
        container.appendChild(group);
    });
}

// ============================================================
// CREA GRUPPO EFFETTO
// ============================================================

function createEffectGroup(effectName, params) {
    const group = document.createElement('div');
    group.className = 'fx-group';
    group.dataset.effect = effectName;
    
    // Header
    const header = document.createElement('div');
    header.className = 'fx-group-header';
    header.innerHTML = `
        <h4>${formatEffectName(effectName)}</h4>
        <button class="fx-group-toggle active">▼</button>
    `;
    
    // Body
    const body = document.createElement('div');
    body.className = 'fx-group-body open';
    
    // Parametri
    Object.entries(params).forEach(([paramName, paramConfig]) => {
        const paramDiv = document.createElement('div');
        paramDiv.className = 'param';
        
        const currentValue = getEffectParam(effectName, paramName);
        const value = currentValue !== null ? currentValue : paramConfig.min;
        
        paramDiv.innerHTML = `
            <label>${paramConfig.label}</label>
            <input type="range" 
                   min="${paramConfig.min}" 
                   max="${paramConfig.max}" 
                   step="${paramConfig.step}" 
                   value="${value}"
                   data-effect="${effectName}"
                   data-param="${paramName}">
            <span class="value">${Number(value).toFixed(2)}</span>
            ${paramConfig.unit ? `<span class="unit">${paramConfig.unit}</span>` : ''}
        `;
        
        // Event listener
        const slider = paramDiv.querySelector('input[type="range"]');
        const valueDisplay = paramDiv.querySelector('.value');
        
        slider.addEventListener('input', () => {
            const val = parseFloat(slider.value);
            valueDisplay.textContent = val.toFixed(2);
            setEffectParam(effectName, paramName, val);
            
            // Aggiorna stato
            document.getElementById('fx-status').textContent = '⚡ Live';
            document.getElementById('fx-status').className = '';
            setTimeout(() => {
                document.getElementById('fx-status').textContent = '✅ Live';
                document.getElementById('fx-status').className = '';
            }, 500);
        });
        
        body.appendChild(paramDiv);
    });
    
    // Toggle gruppo
    const toggleBtn = header.querySelector('.fx-group-toggle');
    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('open');
        toggleBtn.classList.toggle('active');
    });
    
    group.appendChild(header);
    group.appendChild(body);
    
    return group;
}

// ============================================================
// RESET TUTTI GLI EFFETTI
// ============================================================

function resetAllEffects() {
    document.querySelectorAll('.fx-group .param input[type="range"]').forEach(slider => {
        const effectName = slider.dataset.effect;
        const paramName = slider.dataset.param;
        const defaultValue = parseFloat(slider.min);
        
        slider.value = defaultValue;
        const valueDisplay = slider.parentElement.querySelector('.value');
        if (valueDisplay) valueDisplay.textContent = defaultValue.toFixed(2);
        
        setEffectParam(effectName, paramName, defaultValue);
    });
    
    document.getElementById('fx-status').textContent = '🔄 Reset!';
    document.getElementById('fx-status').className = 'off';
    setTimeout(() => {
        document.getElementById('fx-status').textContent = '✅ Live';
        document.getElementById('fx-status').className = '';
    }, 1000);
}

// ============================================================
// UTILITY
// ============================================================

function formatEffectName(name) {
    // Converte camelCase o nomi con numeri in formato leggibile
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/(\d+)/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

// ============================================================
// ESPORTA (opzionale)
// ============================================================

export function toggleFxPanel() {
    const toggle = document.getElementById('fx-toggle');
    if (toggle) toggle.click();
}

export function isFxPanelOpen() {
    return isPanelOpen;
}