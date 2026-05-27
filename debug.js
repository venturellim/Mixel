// debug.js — Debug Mode per Mixel

import { createDanceEngine } from './genres/dance/danceEngine.js';
import { createMetalEngine } from './genres/metal/metalEngine.js';
import { createOrchestraEngine } from './genres/orchestra/orchestraEngine.js';
import { createPianoEngine } from './genres/piano/pianoEngine.js';
import { createFunkyEngine } from './genres/funky/funkyEngine.js';

console.log("debug.js ver. 001 loaded");

// ============================================================
// CONFIGURAZIONE STILI PER GENERE
// ============================================================

const genreStyles = {
    dance: {
        name: "Dance",
        styles: [
            { name: "Gigi", params: { intensity: 0.3, mood: 0.4, complexity: 0.4, texture: 0.4 } },
            { name: "Prezioso", params: { intensity: 0.5, mood: 0.5, complexity: 0.5, texture: 0.5 } },
            { name: "Eiffel65", params: { intensity: 0.6, mood: 0.5, complexity: 0.8, texture: 0.7 } },
            { name: "GabryPonte", params: { intensity: 0.7, mood: 0.7, complexity: 0.5, texture: 0.5 } }
        ]
    },
    metal: {
        name: "Metal",
        styles: [
            { name: "HeavyMetal", params: { intensity: 0.5, mood: 0.5, complexity: 0.5, texture: 0.5 } },
            { name: "PowerMetal", params: { intensity: 0.75, mood: 0.7, complexity: 0.6, texture: 0.5 } },
            { name: "ThrashMetal", params: { intensity: 0.8, mood: 0.4, complexity: 0.7, texture: 0.6 } },
            { name: "DoomMetal", params: { intensity: 0.3, mood: 0.3, complexity: 0.4, texture: 0.5 } },
            { name: "ProgressiveMetal", params: { intensity: 0.6, mood: 0.5, complexity: 0.8, texture: 0.6 } },
            { name: "MelodicDeath", params: { intensity: 0.7, mood: 0.5, complexity: 0.6, texture: 0.5 } }
        ]
    },
    orchestra: {
        name: "Orchestra",
        styles: [
            { name: "Cinematic", params: { intensity: 0.5, mood: 0.5, complexity: 0.5, texture: 0.5 } },
            { name: "Epic", params: { intensity: 0.8, mood: 0.7, complexity: 0.6, texture: 0.5 } },
            { name: "Baroque", params: { intensity: 0.4, mood: 0.6, complexity: 0.7, texture: 0.4 } },
            { name: "Romantic", params: { intensity: 0.5, mood: 0.4, complexity: 0.5, texture: 0.6 } },
            { name: "Minimal", params: { intensity: 0.3, mood: 0.3, complexity: 0.3, texture: 0.3 } }
        ]
    },
    piano: {
        name: "Piano",
        styles: [
            { name: "Classic", params: { intensity: 0.5, mood: 0.5, complexity: 0.5, texture: 0.5 } },
            { name: "Modern", params: { intensity: 0.4, mood: 0.6, complexity: 0.4, texture: 0.4 } },
            { name: "Jazz", params: { intensity: 0.6, mood: 0.6, complexity: 0.6, texture: 0.5 } },
            { name: "Drammatico", params: { intensity: 0.7, mood: 0.3, complexity: 0.5, texture: 0.5 } },
            { name: "Ambient", params: { intensity: 0.3, mood: 0.4, complexity: 0.3, texture: 0.3 } }
        ]
    },
    funky: {
        name: "Funky",
        styles: [
            { name: "ClassicFunk", params: { intensity: 0.5, mood: 0.5, complexity: 0.5, texture: 0.5 } },
            { name: "SoulFunk", params: { intensity: 0.4, mood: 0.3, complexity: 0.4, texture: 0.5 } },
            { name: "JazzFunk", params: { intensity: 0.6, mood: 0.5, complexity: 0.8, texture: 0.6 } },
            { name: "PartyFunk", params: { intensity: 0.8, mood: 0.7, complexity: 0.5, texture: 0.5 } }
        ]
    }
};

// ============================================================
// STATO DEBUG
// ============================================================
let debugActive = false;
let debugPanel = null;
let clickCount = 0;
let clickTimeout = null;
let vConsoleLoaded = false;

// ============================================================
// FUNZIONI PRINCIPALI
// ============================================================

function loadVConsole() {
    if (vConsoleLoaded) return;
    
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/vconsole@latest/dist/vconsole.min.js';
    script.onload = () => {
        new VConsole();
        vConsoleLoaded = true;
        console.log("✅ VConsole caricata");
    };
    document.head.appendChild(script);
}

function createDebugPanel() {
    if (debugPanel) return;

    debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 400px;
        max-width: 90%;
        background: rgba(20, 20, 30, 0.98);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 20px;
        z-index: 20000;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        border: 1px solid rgba(255,255,255,0.2);
        font-family: 'Segoe UI', system-ui, sans-serif;
        display: none;
    `;

    debugPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #fff;">🐛 Debug Mode</h3>
            <button id="debug-close" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        
        <div style="margin-bottom: 15px;">
            <button id="debug-console" style="background: #0a6eff; border: none; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-right: 10px;">
                📱 Apri Console
            </button>
            <button id="debug-reset" style="background: #ff4444; border: none; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer;">
                🔄 Reset
            </button>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="color: #aaa; display: block; margin-bottom: 5px;">Genere:</label>
            <select id="debug-genre" style="width: 100%; padding: 8px; border-radius: 8px; background: #2a2a3a; color: #fff; border: 1px solid #4a4a5a;">
                ${Object.entries(genreStyles).map(([key, g]) => `<option value="${key}">${g.name}</option>`).join('')}
            </select>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="color: #aaa; display: block; margin-bottom: 5px;">Stile:</label>
            <select id="debug-style" style="width: 100%; padding: 8px; border-radius: 8px; background: #2a2a3a; color: #fff; border: 1px solid #4a4a5a;">
                ${genreStyles.dance.styles.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
            </select>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="color: #aaa; display: block; margin-bottom: 5px;">Parametri forzati:</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <label style="font-size: 11px; color: #888;">Intensity:</label>
                    <input type="range" id="debug-intensity" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
                    <span id="debug-intensity-val" style="font-size: 10px; color: #0a6eff;">0.50</span>
                </div>
                <div>
                    <label style="font-size: 11px; color: #888;">Mood:</label>
                    <input type="range" id="debug-mood" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
                    <span id="debug-mood-val" style="font-size: 10px; color: #0a6eff;">0.50</span>
                </div>
                <div>
                    <label style="font-size: 11px; color: #888;">Complexity:</label>
                    <input type="range" id="debug-complexity" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
                    <span id="debug-complexity-val" style="font-size: 10px; color: #0a6eff;">0.50</span>
                </div>
                <div>
                    <label style="font-size: 11px; color: #888;">Texture:</label>
                    <input type="range" id="debug-texture" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
                    <span id="debug-texture-val" style="font-size: 10px; color: #0a6eff;">0.50</span>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="color: #aaa; display: block; margin-bottom: 5px;">Note disponibili (debug):</label>
            <textarea id="debug-notes" readonly style="width: 100%; height: 60px; background: #1a1a2a; color: #0a6eff; border: 1px solid #3a3a4a; border-radius: 8px; font-size: 10px; font-family: monospace; padding: 5px;"></textarea>
        </div>
        
        <button id="debug-elabora" style="width: 100%; background: linear-gradient(90deg, #00c853, #00f5d4); border: none; color: #000; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 10px;">
            🚀 ELABORA (DEBUG)
        </button>
    `;

    document.body.appendChild(debugPanel);
    attachDebugEvents();
}

function attachDebugEvents() {
    // Close button
    document.getElementById('debug-close').onclick = () => {
        debugPanel.style.display = 'none';
        debugActive = false;
    };
    
    // Console button
    document.getElementById('debug-console').onclick = () => {
        loadVConsole();
    };
    
    // Reset button
    document.getElementById('debug-reset').onclick = () => {
        document.getElementById('debug-intensity').value = '0.5';
        document.getElementById('debug-mood').value = '0.5';
        document.getElementById('debug-complexity').value = '0.5';
        document.getElementById('debug-texture').value = '0.5';
        updateSliderValues();
    };
    
    // Genre select
    document.getElementById('debug-genre').onchange = (e) => {
        const genre = e.target.value;
        const styles = genreStyles[genre].styles;
        const styleSelect = document.getElementById('debug-style');
        styleSelect.innerHTML = styles.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        
        // Aggiorna note
        updateNotesDisplay(genre, styles[0].name);
    };
    
    // Style select
    document.getElementById('debug-style').onchange = (e) => {
        const genre = document.getElementById('debug-genre').value;
        const styleName = e.target.value;
        updateNotesDisplay(genre, styleName);
    };
    
    // Sliders
    ['intensity', 'mood', 'complexity', 'texture'].forEach(param => {
        const slider = document.getElementById(`debug-${param}`);
        const valSpan = document.getElementById(`debug-${param}-val`);
        slider.oninput = () => {
            valSpan.textContent = parseFloat(slider.value).toFixed(2);
        };
    });
    
    // Elabora button
    document.getElementById('debug-elabora').onclick = () => {
        const genre = document.getElementById('debug-genre').value;
        const styleName = document.getElementById('debug-style').value;
        const params = {
            intensity: parseFloat(document.getElementById('debug-intensity').value),
            mood: parseFloat(document.getElementById('debug-mood').value),
            complexity: parseFloat(document.getElementById('debug-complexity').value),
            texture: parseFloat(document.getElementById('debug-texture').value)
        };
        
        triggerDebugEngine(genre, styleName, params);
    };
}

function updateSliderValues() {
    ['intensity', 'mood', 'complexity', 'texture'].forEach(param => {
        const val = document.getElementById(`debug-${param}`).value;
        document.getElementById(`debug-${param}-val`).textContent = parseFloat(val).toFixed(2);
    });
}

function updateNotesDisplay(genre, styleName) {
    const notesArea = document.getElementById('debug-notes');
    const style = genreStyles[genre]?.styles.find(s => s.name === styleName);
    if (style) {
        notesArea.value = `Stile: ${styleName}\nParametri: ${JSON.stringify(style.params, null, 2)}`;
    } else {
        notesArea.value = `Stile: ${styleName}\nParametri personalizzati (usa slider)`;
    }
}

function triggerDebugEngine(genre, styleName, forcedParams) {
    console.log(`🐛 DEBUG MODE: ${genre} | ${styleName}`);
    console.log("Parametri forzati:", forcedParams);
    
    // Chiudi il pannello debug
    if (debugPanel) debugPanel.style.display = 'none';
    debugActive = false;
    
    // Verifica che le funzioni necessarie esistano
    if (typeof createDanceEngine === 'undefined' && 
        typeof createMetalEngine === 'undefined' &&
        typeof createOrchestraEngine === 'undefined' &&
        typeof createPianoEngine === 'undefined' &&
        typeof createFunkyEngine === 'undefined') {
        
        console.error("❌ Engine non disponibili");
        alert("Attendi il caricamento completo dell'app prima di usare debug");
        return;
    }
    
    // Crea parametri fake con lo stile forzato
    const fakeParams = {
        dna: Math.floor(Math.random() * 1000000),
        imageParams: {
            brightness: forcedParams.intensity,
            energy: forcedParams.intensity * 0.8 + forcedParams.complexity * 0.2,
            texture: forcedParams.texture,
            complexity: forcedParams.complexity,
            direction: 0.5,
            colorTemperature: forcedParams.mood
        },
        global: {
            intensity: forcedParams.intensity,
            mood: forcedParams.mood,
            complexity: forcedParams.complexity,
            texture: forcedParams.texture,
            motion: 0,
            colorTemperature: forcedParams.mood
        },
        harmony: {
            tonalCenter: "C4",
            scaleProfile: "naturalMinor"
        },
        rhythm: {
            tempoProfile: 120 + forcedParams.intensity * 60,
            timeSignature: "4/4"
        },
        structure: {},
        genreParams: {
            // Forza lo stile scelto
            forcedStyle: styleName
        }
    };
    
    // Sovrascrivi globalPhotoParams
    if (window.globalPhotoParams !== undefined) {
        window.globalPhotoParams = fakeParams;
    }
    
    // Ferma l'engine corrente se esiste
    if (window.currentEngine) {
        try {
            window.currentEngine.stop();
        } catch(e) {}
        window.currentEngine = null;
    }
    
    // Nascondi il pannello dei generi se visibile
    const genrePanel = document.getElementById('genrePanel');
    if (genrePanel) {
        genrePanel.classList.remove('show');
        setTimeout(() => genrePanel.classList.add('hidden'), 100);
    }
    
    // Chiudi anche FX panel se aperto
    const fxPanel = document.getElementById('fxPanel');
    if (fxPanel) fxPanel.classList.remove('show');
    
    // Mostra l'interfaccia player se nascosta
    const spectrumPanel = document.getElementById('spectrumPanel');
    const playerPanel = document.getElementById('playerPanel');
    const btnSpartito = document.getElementById('btnSpartito');
    const previewImage = document.getElementById('previewImage');
    
    if (spectrumPanel) spectrumPanel.classList.remove('hidden');
    if (playerPanel) playerPanel.classList.remove('hidden');
    if (btnSpartito) btnSpartito.classList.remove('hidden');
    
    // Zoom dell'immagine
    if (previewImage) {
        previewImage.classList.add('zoomed-out');
        setTimeout(() => {
            previewImage.classList.add('moved-up');
        }, 100);
    }
    
    // Crea l'engine direttamente in base al genere scelto
    let engine = null;
    
    switch(genre) {
        case 'dance':
            if (typeof createDanceEngine === 'function') {
                engine = createDanceEngine(fakeParams, window.scoreUI);
            }
            break;
        case 'metal':
            if (typeof createMetalEngine === 'function') {
                engine = createMetalEngine(fakeParams, window.scoreUI);
            }
            break;
        case 'orchestra':
            if (typeof createOrchestraEngine === 'function') {
                engine = createOrchestraEngine(fakeParams, window.scoreUI);
            }
            break;
        case 'piano':
            if (typeof createPianoEngine === 'function') {
                engine = createPianoEngine(fakeParams, window.scoreUI);
            }
            break;
        case 'funky':
            if (typeof createFunkyEngine === 'function') {
                engine = createFunkyEngine(fakeParams, window.scoreUI);
            }
            break;
        default:
            console.error("Genere non riconosciuto:", genre);
            alert(`Genere "${genre}" non supportato`);
            return;
    }
    
    if (!engine) {
        console.error("❌ Engine non creato per il genere:", genre);
        alert(`Errore nella creazione dell'engine per ${genre}`);
        return;
    }
    
    // Salva l'engine
    window.currentEngine = engine;
    
    // Inizializza UI player (se necessario)
    if (typeof initPlayerUI === 'function') {
        // Aggiorna i tempi
        const totalTimeEl = document.getElementById('totalTime');
        if (totalTimeEl && engine.totalDuration) {
            const formatTime = (sec) => {
                const m = Math.floor(sec / 60);
                const s = Math.floor(sec % 60).toString().padStart(2, '0');
                return `${m}:${s}`;
            };
            totalTimeEl.textContent = formatTime(engine.totalDuration);
        }
    }
    
    // Inizializza FX panel
    if (typeof initFxPanel === 'function' && engine.mixerData) {
        initFxPanel(engine.mixerData);
    }
    
    // Avvia la riproduzione automaticamente (opzionale)
    setTimeout(() => {
        if (window.currentEngine && typeof window.currentEngine.play === 'function') {
            window.currentEngine.play();
            console.log(`🚀 Debug: avvio automatico di ${genre} - ${styleName}`);
        }
    }, 500);
    
    // Mostra notifica
    showDebugNotification(`${genre.toUpperCase()} - ${styleName}`);
    
    console.log(`✅ Debug: ${genre} - ${styleName} avviato!`);
}

// Funzione per notifica temporanea
function showDebugNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = `🐛 DEBUG: ${message}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #00c853;
        color: #000;
        padding: 8px 16px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        font-weight: bold;
        z-index: 20001;
        animation: fadeOut 2s ease forwards;
    `;
    
    // Aggiungi animazione se non esiste
    if (!document.querySelector('#debug-notification-style')) {
        const style = document.createElement('style');
        style.id = 'debug-notification-style';
        style.textContent = `
            @keyframes fadeOut {
                0% { opacity: 1; transform: translateX(0); }
                70% { opacity: 1; transform: translateX(0); }
                100% { opacity: 0; transform: translateX(100px); display: none; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

// ============================================================
// INIZIALIZZAZIONE DEBUG MODE
// ============================================================

function initDebugMode() {
    // Trova il logo (elemento in alto a sinistra)
    const logo = document.querySelector('.hero-logo') || 
                  document.querySelector('.logo') || 
                  document.getElementById('logo') ||
                  document.querySelector('header img') ||
                  document.querySelector('h1');
    
    if (!logo) {
        console.warn("⚠️ Logo non trovato, debug mode non inizializzato");
        return;
    }
    
    logo.style.cursor = 'pointer';
    logo.style.position = 'relative';
    logo.style.zIndex = '100';
    
    logo.addEventListener('click', (e) => {
        e.stopPropagation();
        clickCount++;
        
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            clickCount = 0;
        }, 1000);
        
        if (clickCount >= 7) {
            clickCount = 0;
            if (!debugPanel) createDebugPanel();
            debugPanel.style.display = 'block';
            debugActive = true;
            console.log("🐛 Debug Mode attivata!");
        }
    });
    
    console.log("🐛 Debug Mode pronta (clicca 7 volte sul logo)");
}

// Esporta per uso esterno
export { initDebugMode, genreStyles, triggerDebugEngine };

// Auto-inizializzazione quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDebugMode);
} else {
    initDebugMode();
}