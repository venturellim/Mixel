//
// common.js — versione universale per tutti i generi
//

import * as Tone from "https://esm.sh/tone";

console.log("common.js ver. 019.1 FINALE loaded");

// ======================================================
// 🎚 MASTER BUS & MASTERING
// ======================================================

export const masterEQ = new Tone.EQ3({ low: 0, mid: 0, high: 0 });
export const masterLimiter = new Tone.Limiter(-1);
masterEQ.chain(masterLimiter, Tone.Destination);

// ======================================================
// 🎵 LOGGING
// ======================================================

export function logNote(instrumentName, note, time) {
    console.log("%c🎵 " + instrumentName + " → " + note + " @ " + time, "color:#4CAF50; font-weight:bold;");
}

// ======================================================
// 🎨 LOADER WIN11 CON DUE BARRE
// ======================================================

let win11Overlay = null;
let win11ProgressBar = null;
let win11Percent = null;
let win11Status = null;
let win11Title = null;
let win11Subtitle = null;
let win11GenreBar = null;
let win11GenrePercent = null;
let win11GenreName = null;

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
            "padding: 28px 32px; min-width: 360px; text-align: center;" +
            "box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);" +
        "}" +
        ".win11-icon { margin-bottom: 20px; }" +
        ".win11-icon svg { width: 48px; height: 48px; animation: win11-pulse 1.5s ease-in-out infinite; }" +
        "@keyframes win11-pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }" +
        ".win11-title { font-size: 16px; font-weight: 500; color: #fff; margin-bottom: 8px; }" +
        ".win11-subtitle { font-size: 13px; color: rgba(255, 255, 255, 0.6); margin-bottom: 20px; }" +
        ".win11-bar-container { background: rgba(255, 255, 255, 0.1); border-radius: 10px; height: 6px; overflow: hidden; margin-bottom: 8px; }" +
        ".win11-progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, #0a6eff, #3b82f6, #60a5fa); border-radius: 10px; transition: width 0.3s; position: relative; overflow: hidden; }" +
        ".win11-progress-bar::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent); animation: win11-shimmer 1.5s infinite; transform: translateX(-100%); }" +
        "@keyframes win11-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }" +
        ".win11-percent { font-size: 12px; font-weight: 500; color: #60a5fa; text-align: right; font-family: monospace; margin-bottom: 16px; }" +
        ".win11-genre-label { font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-align: left; }" +
        ".win11-genre-bar-container { background: rgba(255, 255, 255, 0.08); border-radius: 8px; height: 4px; overflow: hidden; margin-bottom: 4px; }" +
        ".win11-genre-progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, #60a5fa, #3b82f6, #0a6eff); border-radius: 8px; transition: width 0.3s; }" +
        ".win11-genre-percent { font-size: 10px; color: #60a5fa; text-align: right; font-family: monospace; margin-bottom: 8px; }" +
        ".win11-status { font-size: 11px; color: rgba(255, 255, 255, 0.4); margin-top: 16px; }" +
        ".win11-divider { margin: 12px 0 8px 0; border-top: 1px solid rgba(255, 255, 255, 0.1); }";
    document.head.appendChild(style);
}

function initWin11Loader() {
    injectWin11LoaderStyle();
    
    if (win11Overlay) return;
    
    win11Overlay = document.createElement("div");
    win11Overlay.id = "win11-loader-overlay";
    win11Overlay.className = "win11-overlay";
    win11Overlay.innerHTML = 
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
            '<div class="win11-divider"></div>' +
            '<div class="win11-genre-label" id="win11-genre-label">Caricamento genere...</div>' +
            '<div class="win11-genre-bar-container">' +
                '<div class="win11-genre-progress-bar" id="win11-genre-progress-bar"></div>' +
            '</div>' +
            '<div class="win11-genre-percent" id="win11-genre-percent">0%</div>' +
            '<div class="win11-status" id="win11-status">Inizializzazione</div>' +
        '</div>';
    
    win11ProgressBar = win11Overlay.querySelector("#win11-progress-bar");
    win11Percent = win11Overlay.querySelector("#win11-percent");
    win11Status = win11Overlay.querySelector("#win11-status");
    win11Title = win11Overlay.querySelector("#win11-title");
    win11Subtitle = win11Overlay.querySelector("#win11-subtitle");
    win11GenreBar = win11Overlay.querySelector("#win11-genre-progress-bar");
    win11GenrePercent = win11Overlay.querySelector("#win11-genre-percent");
    win11GenreName = win11Overlay.querySelector("#win11-genre-label");
    
    document.body.appendChild(win11Overlay);
}

function updateWin11UI(totalPercent, genrePercent, genreName, genreCurrent, genreTotal, status, title, subtitle) {
    if (win11ProgressBar) win11ProgressBar.style.width = Math.min(100, Math.max(0, totalPercent)) + "%";
    if (win11Percent) win11Percent.textContent = Math.floor(totalPercent) + "%";
    
    if (win11GenreBar) win11GenreBar.style.width = Math.min(100, Math.max(0, genrePercent)) + "%";
    if (win11GenrePercent) win11GenrePercent.textContent = Math.floor(genrePercent) + "%";
    if (win11GenreName && genreName) win11GenreName.textContent = genreName + ": " + genreCurrent + "/" + genreTotal;
    
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
// 📦 CARICAMENTO STRUMENTI (DURATA MINIMA 10 SECONDI)
// ======================================================

export async function waitForInstruments(genres) {
    initWin11Loader();
    
    // Calcola totale strumenti solo per la UI
    var totalInstruments = 0;
    var genreList = [];
    var displayNames = { dance: "Dance", metal: "Metal", orchestra: "Orchestra", piano: "Piano" };
    
    for (var g in genres) {
        totalInstruments += genres[g];
        genreList.push({
            name: g,
            displayName: displayNames[g] || g,
            count: genres[g]
        });
    }
    
    console.log("🎵 Caricamento " + totalInstruments + " strumenti (durata minima 10 secondi)");
    
    var overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = "none";
    
    updateWin11UI(0, 0, "Inizializzazione", 0, 0, "Avvio...", "Caricamento strumenti", "Preparazione dei campioni...");
    showWin11UI();
    
    // Calcola confini generi
    var boundaries = [];
    var cumulative = 0;
    for (var i = 0; i < genreList.length; i++) {
        var g = genreList[i];
        boundaries.push({
            name: g.displayName,
            count: g.count,
            start: cumulative,
            end: cumulative + g.count
        });
        cumulative += g.count;
    }
    
    // Avvia animazione (10 secondi)
    var startTime = Date.now();
    var TOTAL_DURATION_MS = 10000;
    
    var animationInterval = setInterval(function() {
        var elapsed = Date.now() - startTime;
        var totalPercent = Math.min(100, (elapsed / TOTAL_DURATION_MS) * 100);
        
        var targetIndex = Math.floor((totalPercent / 100) * totalInstruments);
        var currentBoundary = boundaries[0];
        for (var b = 0; b < boundaries.length; b++) {
            if (targetIndex < boundaries[b].end) {
                currentBoundary = boundaries[b];
                break;
            }
        }
        
        var genreLoaded = Math.max(0, targetIndex - currentBoundary.start);
        var genrePercent = (genreLoaded / currentBoundary.count) * 100;
        
        updateWin11UI(
            totalPercent,
            genrePercent,
            currentBoundary.name,
            genreLoaded,
            currentBoundary.count,
            "Caricamento " + currentBoundary.name + "... (" + Math.floor(totalPercent) + "%)"
        );
        
        if (totalPercent >= 100) {
            clearInterval(animationInterval);
        }
    }, 50);
    
    // Aspetta il caricamento REALE (ma anche se finisce prima, aspetta l'animazione)
    var loadedPromise = Tone.loaded();
    
    // Aspetta sia il caricamento reale che l'animazione (minimo 10 secondi)
    await Promise.all([
        loadedPromise,
        new Promise(function(resolve) {
            setTimeout(resolve, TOTAL_DURATION_MS);
        })
    ]);
    
    clearInterval(animationInterval);
    
    console.log("✅ Caricamento completato!");
    
    // Assicura 100% e chiudi
    updateWin11UI(100, 100, "Completato!", totalInstruments, totalInstruments, "Tutti gli strumenti pronti!");
    await new Promise(function(r) { setTimeout(r, 500); });
    
    hideWin11UI();
}

let __loadedCount = 0;
let __totalInstruments = 0;

export function registerInstrumentLoaded() {
    __loadedCount++;
    console.log("📦 registerInstrumentLoaded: " + __loadedCount + "/" + __totalInstruments);
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
