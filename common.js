//
// common.js — versione universale per tutti i generi
// Contiene SOLO:
// - master bus
// - EQ/mastering
// - utilities generiche
// - sistema di caricamento strumenti (generico)
// - logging note
// - loader stile Win11 (durata fissa 10 secondi con delay forzato)
//

import * as Tone from "https://esm.sh/tone";

console.log("common.js ver. 014 loaded");

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
    
    var style = document.createElement("style");
    style.id = "win11-loader-style";
    style.textContent = 
        ".win11-overlay {" +
            "position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px);" +
            "display: none; align-items: center; justify-content: center; z-index: 10001;" +
            "font-family: 'Segoe UI', system-ui, sans-serif;" +
        "}" +
        ".win11-loader {" +
            "background: rgba(32, 32, 32, 0.85); backdrop-filter: blur(20px); border-radius: 16px;" +
            "padding: 28px 32px; min-width: 320px; text-align: center;" +
            "box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);" +
        "}" +
        ".win11-icon { margin-bottom: 20px; }" +
        ".win11-icon svg { width: 48px; height: 48px; animation: win11-pulse 1.5s ease-in-out infinite; }" +
        "@keyframes win11-pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }" +
        ".win11-title { font-size: 16px; font-weight: 500; color: #fff; margin-bottom: 8px; }" +
        ".win11-subtitle { font-size: 13px; color: rgba(255, 255, 255, 0.6); margin-bottom: 20px; }" +
        ".win11-bar-container { background: rgba(255, 255, 255, 0.1); border-radius: 10px; height: 6px; overflow: hidden; margin-bottom: 12px; }" +
        ".win11-progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, #0a6eff, #3b82f6, #60a5fa); border-radius: 10px; transition: width 0.3s; position: relative; overflow: hidden; }" +
        ".win11-progress-bar::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent); animation: win11-shimmer 1.5s infinite; transform: translateX(-100%); }" +
        "@keyframes win11-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }" +
        ".win11-percent { font-size: 12px; font-weight: 500; color: #60a5fa; text-align: right; font-family: monospace; }" +
        ".win11-status { font-size: 11px; color: rgba(255, 255, 255, 0.4); margin-top: 16px; }";
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
// 📦 SISTEMA DI CARICAMENTO STRUMENTI (CON DELAY FORZATO)
// ======================================================

let __loadedCount = 0;
let __totalInstruments = 0;

export function registerInstrumentLoaded() {
    __loadedCount++;
    console.log("📦 registerInstrumentLoaded: " + __loadedCount + "/" + __totalInstruments);
}

export async function waitForInstruments(total, genreName) {
    if (!genreName) genreName = "strumenti";
    
    initWin11Loader();
    
    // Resetta i contatori
    __loadedCount = 0;
    __totalInstruments = total;
    
    var overlay = document.getElementById("loadingOverlay");
    var bar = document.getElementById("loadingBar");
    var text = document.getElementById("loadingText");
    
    // Nascondi il vecchio overlay
    if (overlay) overlay.style.display = "none";
    
    // Mostra il nuovo loader
    updateWin11UI(0, "Avvio...", "Caricamento " + genreName, "Preparazione dei campioni...");
    showWin11UI();
    
    // Calcola delay per strumento (durata totale 10 secondi)
    var TOTAL_DURATION_MS = 10000;
    var delayPerStep = TOTAL_DURATION_MS / total;
    
    console.log("⏱️ " + genreName + ": " + total + " strumenti, delay " + Math.floor(delayPerStep) + "ms per step, totale " + (TOTAL_DURATION_MS/1000) + "s");
    
    // Forza il delay indipendentemente dal conteggio reale
    for (var i = 0; i <= total; i++) {
        var percent = Math.floor((i / total) * 100);
        
        // Aggiorna le UI
        if (bar) bar.style.width = percent + "%";
        if (text) text.innerText = "Caricamento strumenti… " + percent + "%";
        updateWin11UI(percent, "Caricamento " + i + "/" + total + " - " + percent + "%");
        
        // Delay (ultimo step incluso)
        if (i < total) {
            await new Promise(function(res) { setTimeout(res, delayPerStep); });
        }
    }
    
    // Delay finale per far vedere il 100%
    await new Promise(function(res) { setTimeout(res, 300); });
    
    // Nascondi loader
    hideWin11UI();
    
    // Resetta contatori
    __loadedCount = 0;
    __totalInstruments = 0;
}