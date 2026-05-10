//
// common.js — versione universale per tutti i generi
// Contiene SOLO:
// - master bus
// - EQ/mastering
// - utilities generiche
// - logging note
// - loader stile Win11
//
// Nessun sampler, nessun effetto, nessuna logica metal.
// Tutto ciò che è strumento → va nella cartella del genere.
//

import * as Tone from "https://esm.sh/tone";

console.log("common.js ver. 006 loaded");

// ======================================================
// 🎚 MASTER BUS & MASTERING
// ======================================================

// EQ principale
export const masterEQ = new Tone.EQ3({
    low: 0,
    mid: 0,
    high: 0
});

// Limiter globale (ultimo anello della catena)
export const masterLimiter = new Tone.Limiter(-1);

// Catena corretta: EQ → Limiter → Destination
masterEQ.chain(masterLimiter, Tone.Destination);


// ======================================================
// 🎵 LOGGING UNIVERSALE
// ======================================================

export function logNote(instrumentName, note, time) {
    console.log(
        `%c🎵 ${instrumentName} → ${note} @ ${time}`,
        "color:#4CAF50; font-weight:bold;"
    );
}


// ======================================================
// 📦 LOADER STILE WIN11
// ======================================================

let win11Overlay = null;
let currentTotal = 0;
let currentCount = 0;
let resolveWait = null;

// Inietta lo stile CSS Win11
function injectWin11LoaderStyle() {
    if (document.getElementById("win11-loader-style")) return;
    
    const style = document.createElement("style");
    style.id = "win11-loader-style";
    style.textContent = `
        .win11-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Segoe UI', 'Segoe UI Variable', system-ui, sans-serif;
            animation: win11-fadeIn 0.2s ease;
        }
        
        @keyframes win11-fadeIn {
            from { opacity: 0; backdrop-filter: blur(0px); }
            to { opacity: 1; backdrop-filter: blur(8px); }
        }
        
        .win11-loader {
            background: rgba(32, 32, 32, 0.85);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 28px 32px;
            min-width: 320px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
            animation: win11-slideUp 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }
        
        @keyframes win11-slideUp {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .win11-icon { margin-bottom: 20px; }
        
        .win11-icon svg {
            width: 48px;
            height: 48px;
            animation: win11-pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes win11-pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
        }
        
        .win11-title {
            font-size: 16px;
            font-weight: 500;
            color: #fff;
            margin-bottom: 8px;
        }
        
        .win11-subtitle {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 20px;
        }
        
        .win11-bar-container {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            height: 6px;
            overflow: hidden;
            margin-bottom: 12px;
        }
        
        .win11-progress-bar {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #0a6eff, #3b82f6, #60a5fa);
            border-radius: 10px;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .win11-progress-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            animation: win11-shimmer 1.5s infinite;
            transform: translateX(-100%);
        }
        
        @keyframes win11-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .win11-percent {
            font-size: 12px;
            font-weight: 500;
            color: #60a5fa;
            text-align: right;
            font-family: monospace;
        }
        
        .win11-status {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.4);
            margin-top: 16px;
        }
    `;
    document.head.appendChild(style);
}

function getOrCreateLoader() {
    injectWin11LoaderStyle();
    
    if (win11Overlay && win11Overlay.parentNode) {
        return win11Overlay;
    }
    
    const existingLoader = document.getElementById("win11-loader-overlay");
    if (existingLoader) existingLoader.remove();
    
    win11Overlay = document.createElement("div");
    win11Overlay.id = "win11-loader-overlay";
    win11Overlay.className = "win11-overlay";
    win11Overlay.innerHTML = `
        <div class="win11-loader">
            <div class="win11-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    <path d="M2 17L12 22L22 17" stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    <path d="M2 12L12 17L22 12" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
            </div>
            <div class="win11-title" id="win11-title">Caricamento strumenti</div>
            <div class="win11-subtitle" id="win11-subtitle">Preparazione del tuo mix...</div>
            <div class="win11-bar-container">
                <div class="win11-progress-bar" id="win11-progress-bar"></div>
            </div>
            <div class="win11-percent" id="win11-percent">0%</div>
            <div class="win11-status" id="win11-status">Inizializzazione</div>
        </div>
    `;
    
    document.body.appendChild(win11Overlay);
    return win11Overlay;
}

export function showLoader(title = "Caricamento strumenti", subtitle = "Preparazione...") {
    const overlay = getOrCreateLoader();
    const titleEl = document.getElementById("win11-title");
    const subtitleEl = document.getElementById("win11-subtitle");
    const progressBar = document.getElementById("win11-progress-bar");
    const percentEl = document.getElementById("win11-percent");
    
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
    if (progressBar) progressBar.style.width = "0%";
    if (percentEl) percentEl.textContent = "0%";
    
    overlay.style.display = "flex";
}

export function updateLoaderProgress(percent, status = null) {
    const progressBar = document.getElementById("win11-progress-bar");
    const percentEl = document.getElementById("win11-percent");
    const statusEl = document.getElementById("win11-status");
    
    if (progressBar) progressBar.style.width = Math.min(100, Math.max(0, percent)) + "%";
    if (percentEl) percentEl.textContent = Math.floor(percent) + "%";
    if (statusEl && status) statusEl.textContent = status;
}

export function hideLoader() {
    if (win11Overlay) {
        win11Overlay.style.display = "none";
    }
}

// Sistema di caricamento strumenti (mantenuto per compatibilità)
export function registerInstrumentLoaded() {
    currentCount++;
    const percent = (currentCount / currentTotal) * 100;
    updateLoaderProgress(percent, `Caricamento ${currentCount}/${currentTotal}`);
    
    if (resolveWait && currentCount >= currentTotal) {
        resolveWait();
        resolveWait = null;
    }
}

export async function waitForInstruments(total, genreName = "strumenti") {
    currentTotal = total;
    currentCount = 0;
    
    showLoader(`Caricamento ${genreName}`, "Preparazione dei campioni...");
    updateLoaderProgress(0, `Avvio caricamento (0/${total})`);
    
    if (currentCount >= currentTotal) {
        hideLoader();
        return;
    }
    
    await new Promise((resolve) => {
        resolveWait = resolve;
    });
    
    hideLoader();
    currentTotal = 0;
    currentCount = 0;
}


// ======================================================
// 🧰 UTILITIES GENERICHE
// ======================================================

// Clamp MIDI note range
export function clampNote(note, minMidi, maxMidi) {
    const midi = Tone.Frequency(note).toMidi();
    if (midi < minMidi || midi > maxMidi) return null;
    return note;
}

// Prende un elemento da una scala ciclicamente
export function pickFromScale(scale, step) {
    return scale[step % scale.length];
}

// Random deterministico
export function createSeededRandom(seed) {
    return function () {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

// Humanizzazione temporale
export function humanizeTime(time, rand, amount = 0.008) {
    const offset = (rand() - 0.5) * amount;
    return time + offset;
}

// Humanizzazione velocity
export function humanizeVelocity(rand, base = 1) {
    const variation = 0.85 + rand() * 0.3;
    return base * variation;
}