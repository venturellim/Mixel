// debug.js — Versione COMPLETA per mobile

import { createDanceEngine } from './genres/dance/danceEngine.js';
import { createMetalEngine } from './genres/metal/metalEngine.js';
import { createOrchestraEngine } from './genres/orchestra/orchestraEngine.js';
import { createPianoEngine } from './genres/piano/pianoEngine.js';
import { createFunkyEngine } from './genres/funky/funkyEngine.js';
import { loadDancePack } from "./genres/dance/danceInstruments.js";
import { loadMetalPack } from "./genres/metal/metalInstruments.js";
import { loadOrchestraPack } from "./genres/orchestra/orchestraInstruments.js";
import { loadPianoPack } from "./genres/piano/pianoInstruments.js";
import { loadFunkyPack } from "./genres/funky/funkyInstruments.js";

console.log("🐛 debug.js Ver. 005 loaded");


// ============================================================
// STATO DEBUG
// ============================================================
let debugActive = false;
let debugPanel = null;
let clickCount = 0;
let clickTimeout = null;
let vConsoleLoaded = false;

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
        { name: "BalladMode", params: { intensity: 0.25, mood: 0.45, complexity: 0.25, texture: 0.75 } },
        { name: "EpicMetal", params: {
        intensity: 0.72,
        mood: 0.78,
        complexity: 0.45,
        texture: 0.62
    } },
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
// FUNZIONE PER TRIGGERARE DEBUG
// ============================================================

function triggerDebugMode(genre, styleName, forcedParams) {
    console.log(`🐛 DEBUG MODE: ${genre} | ${styleName}`);
    console.log("Parametri forzati:", forcedParams);
    
    // Chiudi il pannello debug
    if (debugPanel) debugPanel.style.display = 'none';
    debugActive = false;
    
    // ============================================================
    // COSTRUISCI params DIRETTAMENTE (come da photoToMusicParams)
    // ============================================================
    const params = {
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
            scaleProfile: forcedParams.intensity > 0.66 ? "harmonicMinor" : "naturalMinor"
        },
        rhythm: {
            tempoProfile: 90 + forcedParams.intensity * 70,
            timeSignature: "4/4"
        },
        structure: {
            intro: forcedParams.intensity < 0.33 ? 8 : forcedParams.intensity < 0.66 ? 4 : 2,
            verse: forcedParams.intensity < 0.33 ? 16 : forcedParams.intensity < 0.66 ? 8 : 6,
            chorus: forcedParams.intensity < 0.33 ? 8 : forcedParams.intensity < 0.66 ? 8 : 6,
            solo: forcedParams.intensity < 0.33 ? 4 : forcedParams.intensity < 0.66 ? 8 : 12,
            outro: forcedParams.intensity < 0.33 ? 8 : forcedParams.intensity < 0.66 ? 4 : 2
        },
        genreParams: {}
    };
    
    // Ferma engine corrente
    if (window.currentEngine) {
        try { window.currentEngine.stop(); } catch(e) {}
        window.currentEngine = null;
    }
    
    // Nascondi pannello generi e FX
    const genrePanel = document.getElementById('genrePanel');
    if (genrePanel) {
        genrePanel.classList.remove('show');
        genrePanel.classList.add('hidden');
    }
    const fxPanel = document.getElementById('fxPanel');
    if (fxPanel) fxPanel.classList.remove('show');
    
    // Mostra UI player
    const spectrumPanel = document.getElementById('spectrumPanel');
    const playerPanel = document.getElementById('playerPanel');
    const btnSpartito = document.getElementById('btnSpartito');
    const previewImage = document.getElementById('previewImage');
    
    if (spectrumPanel) spectrumPanel.classList.remove('hidden');
    if (playerPanel) playerPanel.classList.remove('hidden');
    if (btnSpartito) btnSpartito.classList.remove('hidden');
    
    if (previewImage) {
        previewImage.classList.add('zoomed-out');
        setTimeout(() => previewImage.classList.add('moved-up'), 100);
    }
    
    // ============================================================
    // CHIAMA DIRETTAMENTE L'ENGINE DEL GENERE SELEZIONATO
    // ============================================================
    let engine = null;
    
    switch(genre) {
        case 'dance':
        instruments = await loadDancePack();
        await Tone.loaded();
            engine = createDanceEngine(params, window.scoreUI, instruments);
            break;
        case 'metal':
        instruments = await loadMetalPack();
        await Tone.loaded();
            engine = createMetalEngine(params, window.scoreUI, instruments);
            break;
        case 'orchestra':
        instruments = await loadOrchestraPack();
        await Tone.loaded();
            engine = createOrchestraEngine(params, window.scoreUI, instruments);
            break;
        case 'piano':
        instruments = await loadPianoPack();
        await Tone.loaded();
            engine = createPianoEngine(params, window.scoreUI, instruments);
            break;
        case 'funky':
        instruments = await loadFunkyPack();
        await Tone.loaded();
            engine = createFunkyEngine(params, window.scoreUI, instruments);
            break;
        default:
            console.error("Genere non riconosciuto:", genre);
            return;
    }
    
    if (!engine) {
        console.error("❌ Engine non creato");
        return;
    }
    
    window.currentEngine = engine;
    
    // Aggiorna UI tempi
    const totalTimeEl = document.getElementById('totalTime');
    if (totalTimeEl && engine.totalDuration) {
        const formatTime = (sec) => {
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };
        totalTimeEl.textContent = formatTime(engine.totalDuration);
    }
    
    // Inizializza FX panel
    if (typeof initFxPanel !== 'undefined' && engine.mixerData) {
        initFxPanel(engine.mixerData);
    }
    
    // Avvia
    setTimeout(() => {
        if (window.currentEngine && typeof window.currentEngine.play === 'function') {
            window.currentEngine.play();
            console.log(`🚀 Debug: ${genre} - ${styleName} avviato!`);
        }
    }, 500);
    
    // Notifica visiva
    showDebugNotification(`${genre.toUpperCase()} - ${styleName}`);
}

// Notifica toast visibile
function showToast(message) {
    const existing = document.querySelector('#debug-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'debug-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 150px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.85);
        color: #00f5d4;
        padding: 10px 20px;
        border-radius: 30px;
        font-size: 12px;
        z-index: 20001;
        white-space: nowrap;
        font-family: monospace;
        border: 1px solid #00f5d4;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ============================================================
// CREAZIONE PANNEL DEBUG
// ============================================================

function createDebugPanel() {

function setDebugSliders(params) {
    const { intensity, mood, complexity, texture } = params;

    const set = (id, value) => {
        const slider = document.getElementById(`debug-${id}`);
        const valSpan = document.getElementById(`debug-${id}-val`);
        slider.value = value;
        valSpan.textContent = value.toFixed(2);
    };

    set("intensity", intensity);
    set("mood", mood);
    set("complexity", complexity);
    set("texture", texture);
}

    if (debugPanel && document.body.contains(debugPanel)) return debugPanel;
    if (debugPanel) debugPanel.remove();

    debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 85%;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        background: rgba(20, 20, 30, 0.98);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 20px;
        z-index: 20000;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        border: 1px solid #00f5d4;
        font-family: system-ui, -apple-system, sans-serif;
        display: none;
    `;

    debugPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #00f5d4;">🐛 Debug Mode</h3>
            <button id="debug-close" style="background: none; border: none; color: #fff; font-size: 28px; cursor: pointer;">&times;</button>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="color: #aaa; display: block; margin-bottom: 5px;">Genere:</label>
            <select id="debug-genre" style="width: 100%; padding: 10px; border-radius: 10px; background: #2a2a3a; color: #fff; border: 1px solid #4a4a5a; font-size: 14px;">
                ${Object.entries(genreStyles).map(([key, g]) => `<option value="${key}">${g.name}</option>`).join('')}
            </select>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="color: #aaa; display: block; margin-bottom: 5px;">Stile:</label>
            <select id="debug-style" style="width: 100%; padding: 10px; border-radius: 10px; background: #2a2a3a; color: #fff; border: 1px solid #4a4a5a; font-size: 14px;">
                ${genreStyles.dance.styles.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
            </select>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="color: #aaa; display: block; margin-bottom: 5px;">Parametri:</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <label style="font-size: 11px; color: #888;">Intensity:</label>
                    <input type="range" id="debug-intensity" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
                    <span id="debug-intensity-val" style="font-size: 10px; color: #00f5d4;">0.50</span>
                </div>
                <div>
                    <label style="font-size: 11px; color: #888;">Mood:</label>
                    <input type="range" id="debug-mood" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
                    <span id="debug-mood-val" style="font-size: 10px; color: #00f5d4;">0.50</span>
                </div>
                <div>
                    <label style="font-size: 11px; color: #888;">Complexity:</label>
                    <input type="range" id="debug-complexity" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
                    <span id="debug-complexity-val" style="font-size: 10px; color: #00f5d4;">0.50</span>
                </div>
                <div>
                    <label style="font-size: 11px; color: #888;">Texture:</label>
                    <input type="range" id="debug-texture" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
                    <span id="debug-texture-val" style="font-size: 10px; color: #00f5d4;">0.50</span>
                </div>
            </div>
        </div>
        
        <button id="debug-elabora" style="width: 100%; background: linear-gradient(90deg, #00c853, #00f5d4); border: none; color: #000; padding: 14px; border-radius: 12px; font-weight: bold; font-size: 16px; cursor: pointer; margin-top: 10px;">
            🚀 ELABORA
        </button>
        
        <div style="margin-top: 15px; font-size: 10px; color: #666; text-align: center;">
            ⚡ Test diretto - ignora selezione generi
        </div>
    `;

    document.body.appendChild(debugPanel);
    
    // Event listeners
    document.getElementById('debug-close').onclick = () => {
        debugPanel.style.display = 'none';
    };
    
    document.getElementById('debug-genre').onchange = (e) => {
    const genre = e.target.value;
    const styles = genreStyles[genre].styles;
    const styleSelect = document.getElementById('debug-style');

    // aggiorna lista stili
    styleSelect.innerHTML = styles.map(s => `<option value="${s.name}">${s.name}</option>`).join('');

    // imposta parametri del primo stile
    const first = styles[0].params;
    setDebugSliders(first);
};

document.getElementById('debug-style').onchange = (e) => {
    const genre = document.getElementById('debug-genre').value;
    const styleName = e.target.value;

    const style = genreStyles[genre].styles.find(s => s.name === styleName);
    if (style) setDebugSliders(style.params);
};

    
    ['intensity', 'mood', 'complexity', 'texture'].forEach(param => {
        const slider = document.getElementById(`debug-${param}`);
        const valSpan = document.getElementById(`debug-${param}-val`);
        slider.oninput = () => {
            valSpan.textContent = parseFloat(slider.value).toFixed(2);
        };
    });
    
    document.getElementById('debug-elabora').onclick = () => {
        const genre = document.getElementById('debug-genre').value;
        const styleName = document.getElementById('debug-style').value;
        const forcedParams = {
            intensity: parseFloat(document.getElementById('debug-intensity').value),
            mood: parseFloat(document.getElementById('debug-mood').value),
            complexity: parseFloat(document.getElementById('debug-complexity').value),
            texture: parseFloat(document.getElementById('debug-texture').value)
        };
        debugPanel.style.display = 'none';
        triggerDebugMode(genre, styleName, forcedParams);
    };
    
    return debugPanel;
}

// ============================================================
// BOTTONE FLUTTANTE PER MOBILE
// ============================================================

function createFloatingButton() {
    const btn = document.createElement('div');
    btn.innerHTML = '🐛';
    btn.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 15px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #1a1a2a, #0a0a1a);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        border: 2px solid #00f5d4;
        cursor: pointer;
        transition: all 0.3s;
    `;
    btn.onclick = () => {
        const panel = createDebugPanel();
        panel.style.display = 'block';
    };
    document.body.appendChild(btn);
}

// ============================================================
// ESPORTA PER USO ESTERNO
// ============================================================

window.triggerDebugMode = triggerDebugMode;
window.showToast = showToast;

// ============================================================
// INIZIALIZZA
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        createFloatingButton();
        console.log("🐛 Debug ready - click sul bottone 🐛");
    });
} else {
    createFloatingButton();
    console.log("🐛 Debug ready - click sul bottone 🐛");
}