//
// common.js — versione universale per tutti i generi
// Contiene SOLO:
// - master bus
// - EQ/mastering
// - utilities generiche
// - sistema di caricamento strumenti (generico)
// - logging note
// - loader stile Win11 (durata fissa 10 secondi)
//

import * as Tone from "https://esm.sh/tone";

console.log("common.js ver. 013 loaded");

// ======================================================
// 🎚 MASTER BUS & MASTERING
// ======================================================

export const masterEQ = new Tone.EQ3({
    low: 0,
    mid: 0,
    high: 0
});

export const masterLimiter = new Tone.Limiter(-1);
masterEQ.chain(masterLimiter, Tone.Destination);


// ======================================================
// 🎵 LOGGING UNIVERSALE
// ======================================================

export function logNote(instrumentName, note, time) {
    console.log(
        "%c🎵 " + instrumentName + " → " + note + " @ " + time,
        "color:#4CAF50; font-weight:bold;"
    );
}

// ======================================================
// 🎨 LOADER GRAFICO STILE WIN11
// ======================================================

let win11Overlay = null;
let win11ProgressBar = null;
let win11Percent = null;
let win11Status = null;
let win11Title = null;
let win11Subtitle = null;

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
            z-index: 10001;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
        
        .win11-loader {
            background: rgba(32, 32, 32, 0.85);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 28px 32px;
            min-width: 320px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
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
            transition: width 0.3s;
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

function initWin11Loader() {
    injectWin11LoaderStyle();
    
    if (win11Overlay) return;
    
    win11Overlay = document.createElement("div");
    win11Overlay.id = "win11-loader-overlay";
    win11Overlay.className = "win11-overlay";
    win11Overlay.innerHTML = 
        '<div class="win11-loader">' +
            '<div class="win11-icon">' +
                '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                    '<path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
                    '<path d="M2 17L12 22L22 17" stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
                    '<path d="M2 12L12 17L22 12" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
                '</svg>' +
            '</div>' +
            '<div class="win11-title" id="win11-title">Caricamento strumenti</div>' +
            '<div class="win11-subtitle" id="win11-subtitle">Preparazione del tuo mix...</div>' +
            '<div class="win11-bar-container">' +
                '<div class="win11-progress-bar" id="win11-progress-bar"></div>' +
            '</div>' +
            '<div class="win11-percent" id="win11-percent">0%</div>' +
            '<div class="win11-status" id="win11-status">Inizializzazione</div>' +
        '</div>';
    
    win11ProgressBar = win11Overlay.querySelector("#win11-progress-bar");
    win11Percent = win11Overlay.querySelector("#win11-percent");
    win11Status = win11Overlay.querySelector("#win11-status");
    win11Title = win11Overlay.querySelector("#win11-title");
    win11Subtitle = win11Overlay.querySelector("#win11-subtitle");
    
    document.body.appendChild(win11Overlay);
}

function updateWin11UI(percent, status, title, subtitle) {
    if (win11ProgressBar) win11ProgressBar.style.width = Math.min(100, Math.max(0, percent)) + "%";
    if (win11Percent) win11Percent.textContent = Math.floor(percent) + "%";
    if (win11Status && status) win11Status.textContent = status;
    if (win11Title && title) win11Title.textContent = title;
    if (win11Subtitle && subtitle) win11Subtitle.textContent = subtitle;
}

function showWin11UI() {
    if (win11Overlay) win11Overlay.style.display = "flex";
}

function hideWin11UI() {
    if (win11Overlay) win11Overlay.style.display = "none";
}

// ======================================================
// 📦 SISTEMA DI CARICAMENTO STRUMENTI (DURATA FISSA 10 SECONDI)
// ======================================================

let __loadedCount = 0;

export function registerInstrumentLoaded() {
    __loadedCount++;
}

export async function waitForInstruments(total, genreName) {
    initWin11Loader();
    
    // Nome di default
    if (!genreName) genreName = "strumenti";
    
    const overlay = document.getElementById("loadingOverlay");
    const bar = document.getElementById("loadingBar");
    const text = document.getElementById("loadingText");
    
    // Nascondi il vecchio overlay se esiste
    if (overlay) overlay.style.display = "none";
    
    // Mostra il nuovo loader Win11
    updateWin11UI(0, "Avvio...", "Caricamento " + genreName, "Preparazione dei campioni...");
    showWin11UI();

    // Calcola il delay tra ogni strumento per una durata totale di 10 secondi
    const TOTAL_DURATION_MS = 10000; // 10 secondi totali
    const delayPerInstrument = TOTAL_DURATION_MS / total;
    
    console.log("⏱️ Caricamento " + genreName + ": " + total + " strumenti, delay " + Math.floor(delayPerInstrument) + "ms l'uno (totale " + (TOTAL_DURATION_MS/1000) + "s)");

    function update() {
        var percent = Math.floor((__loadedCount / total) * 100);
        // Aggiorna anche il vecchio (per compatibilità)
        if (bar) bar.style.width = percent + "%";
        if (text) text.innerText = "Caricamento strumenti… " + percent + "%";
        // Aggiorna il nuovo Win11
        updateWin11UI(percent, "Caricamento " + __loadedCount + "/" + total + " - " + percent + "%");
    }

    while (__loadedCount < total) {
        update();
        
        // Delay calcolato in base al numero di strumenti
        if (__loadedCount < total - 1) {
            await new Promise(function(res) { setTimeout(res, delayPerInstrument); });
        } else {
            await new Promise(function(res) { setTimeout(res, 500); });
        }
    }

    update();
    await new Promise(function(res) { setTimeout(res, 500); });
    
    hideWin11UI();
    __loadedCount = 0;
}


// ======================================================
// 🧰 UTILITIES GENERICHE
// ======================================================

export function clampNote(note, minMidi, maxMidi) {
    var midi = Tone.Frequency(note).toMidi();
    if (midi < minMidi || midi > maxMidi) return null;
    return note;
}

export function pickFromScale(scale, step) {
    return scale[step % scale.length];
}

export function createSeededRandom(seed) {
    return function() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

export function humanizeTime(time, rand, amount) {
    if (amount === undefined) amount = 0.008;
    var offset = (rand() - 0.5) * amount;
    return time + offset;
}

export function humanizeVelocity(rand, base) {
    if (base === undefined) base = 1;
    var variation = 0.85 + rand() * 0.3;
    return base * variation;
}