//
// common.js — versione universale per tutti i generi
// - master bus, EQ, limiter
// - logging note
// - loader Win11 con due barre di avanzamento
//

import * as Tone from "https://esm.sh/tone";

console.log("common.js ver. 020 loaded");

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
let win11Bar = null;
let win11Percent = null;
let win11Status = null;
let win11Title = null;
let win11Subtitle = null;
let win11GenreBar = null;
let win11GenrePercent = null;
let win11GenreName = null;

function createLoader() {
    if (win11Overlay) return win11Overlay;
    
    var style = document.createElement("style");
    style.textContent = `
        .win11-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.75);
            backdrop-filter: blur(8px); display: none; align-items: center;
            justify-content: center; z-index: 10001; font-family: 'Segoe UI', sans-serif;
        }
        .win11-loader { background: rgba(32,32,32,0.85); backdrop-filter: blur(20px);
            border-radius: 16px; padding: 28px 32px; min-width: 360px; text-align: center; }
        .win11-icon svg { width: 48px; height: 48px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); } }
        .win11-title { font-size: 16px; font-weight: 500; color: #fff; margin-bottom: 8px; }
        .win11-subtitle { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 20px; }
        
        /* Barra principale */
        .win11-bar-container { background: rgba(255,255,255,0.1); border-radius: 10px;
            height: 6px; overflow: hidden; margin-bottom: 8px; }
        .win11-progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg,#0a6eff,#3b82f6,#60a5fa);
            border-radius: 10px; transition: width 0.3s; position: relative; overflow: hidden; }
        .win11-progress-bar::after { content: ''; position: absolute; inset: 0;
            background: linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
            animation: shimmer 1.5s infinite; transform: translateX(-100%); }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .win11-percent { font-size: 12px; font-weight: 500; color: #60a5fa; text-align: right; font-family: monospace; margin-bottom: 16px; }
        
        /* Barra del genere corrente */
        .win11-genre-label { font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px; text-align: left; }
        .win11-genre-bar-container { background: rgba(255,255,255,0.08); border-radius: 8px;
            height: 4px; overflow: hidden; margin-bottom: 4px; }
        .win11-genre-progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg,#60a5fa,#3b82f6,#0a6eff);
            border-radius: 8px; transition: width 0.3s; }
        .win11-genre-percent { font-size: 10px; color: #60a5fa; text-align: right; font-family: monospace; margin-bottom: 8px; }
        
        .win11-status { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 16px; }
        .win11-divider { margin: 12px 0 8px 0; border-top: 1px solid rgba(255,255,255,0.1); }
    `;
    document.head.appendChild(style);
    
    win11Overlay = document.createElement("div");
    win11Overlay.className = "win11-overlay";
    win11Overlay.innerHTML = `
        <div class="win11-loader">
            <div class="win11-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#60a5fa" stroke-width="1.5"/><path d="M2 17L12 22L22 17" stroke="#60a5fa" stroke-width="1.5"/><path d="M2 12L12 17L22 12" stroke="#3b82f6" stroke-width="1.5"/></svg></div>
            <div class="win11-title" id="wintitle">Caricamento strumenti</div>
            <div class="win11-subtitle" id="winsubtitle">Preparazione...</div>
            <div class="win11-bar-container"><div class="win11-progress-bar" id="winbar"></div></div>
            <div class="win11-percent" id="winpercent">0%</div>
            <div class="win11-divider"></div>
            <div class="win11-genre-label" id="wingenrelabel">Caricamento genere...</div>
            <div class="win11-genre-bar-container"><div class="win11-genre-progress-bar" id="wingenrebar"></div></div>
            <div class="win11-genre-percent" id="wingenrepercent">0%</div>
            <div class="win11-status" id="winstatus">Inizializzazione</div>
        </div>
    `;
    
    win11Bar = win11Overlay.querySelector("#winbar");
    win11Percent = win11Overlay.querySelector("#winpercent");
    win11Status = win11Overlay.querySelector("#winstatus");
    win11Title = win11Overlay.querySelector("#wintitle");
    win11Subtitle = win11Overlay.querySelector("#winsubtitle");
    win11GenreBar = win11Overlay.querySelector("#wingenrebar");
    win11GenrePercent = win11Overlay.querySelector("#wingenrepercent");
    win11GenreName = win11Overlay.querySelector("#wingenrelabel");
    
    document.body.appendChild(win11Overlay);
    return win11Overlay;
}

function showLoader(title, subtitle) {
    createLoader();
    if (title) win11Title.textContent = title;
    if (subtitle) win11Subtitle.textContent = subtitle;
    win11Overlay.style.display = "flex";
}

function updateLoader(percent, genrePercent, genreName, genreCurrent, genreTotal, status) {
    // Barra principale
    if (win11Bar) win11Bar.style.width = Math.min(100, Math.max(0, percent)) + "%";
    if (win11Percent) win11Percent.textContent = Math.floor(percent) + "%";
    
    // Barra del genere
    if (win11GenreBar) win11GenreBar.style.width = Math.min(100, Math.max(0, genrePercent)) + "%";
    if (win11GenrePercent) win11GenrePercent.textContent = Math.floor(genrePercent) + "%";
    if (win11GenreName && genreName) win11GenreName.textContent = genreName + ": " + genreCurrent + "/" + genreTotal;
    
    // Status
    if (win11Status && status) win11Status.textContent = status;
}

function hideLoader() {
    if (win11Overlay) win11Overlay.style.display = "none";
}

// ======================================================
// 📦 CARICAMENTO STRUMENTI CON DUE BARRE
// ======================================================

var __loadedCount = 0;
var __startTime = 0;
var __totalInstruments = 0;
var __genreBoundaries = [];

// Calcola i confini di ogni genere
function calculateGenreBoundaries(genres) {
    var boundaries = [];
    var cumulative = 0;
    var genreNames = Object.keys(genres);
    
    for (var i = 0; i < genreNames.length; i++) {
        var name = genreNames[i];
        // Traduci in italiano per visualizzazione
        var displayName = name;
        if (name === "dance") displayName = "Dance";
        if (name === "metal") displayName = "Metal";
        if (name === "orchestra") displayName = "Orchestra";
        if (name === "piano") displayName = "Piano";
        
        boundaries.push({
            name: name,
            displayName: displayName,
            count: genres[name],
            start: cumulative,
            end: cumulative + genres[name]
        });
        cumulative += genres[name];
    }
    
    return boundaries;
}

// Determina quale genere sta caricando in base al contatore
function getCurrentGenre(loadedCount, boundaries) {
    for (var i = 0; i < boundaries.length; i++) {
        var b = boundaries[i];
        if (loadedCount < b.end) {
            return b;
        }
    }
    return boundaries[boundaries.length - 1];
}

export async function waitForInstruments(genres) {
    // Calcola totale e confini
    __totalInstruments = 0;
    for (var g in genres) {
        __totalInstruments += genres[g];
    }
    
    __genreBoundaries = calculateGenreBoundaries(genres);
    __loadedCount = 0;
    __startTime = Date.now();
    
    var genreNames = Object.keys(genres).join(", ");
    console.log("🎵 Caricamento " + __totalInstruments + " strumenti da: " + genreNames);
    
    showLoader("Caricamento strumenti", "Preparazione dei campioni...");
    updateLoader(0, 0, "Inizializzazione", 0, 0, "Avvio...");
    
    // Nascondi vecchio loader
    var oldOverlay = document.getElementById("loadingOverlay");
    if (oldOverlay) oldOverlay.style.display = "none";
    
    // Aspetta che tutti gli strumenti siano caricati
    while (__loadedCount < __totalInstruments) {
        var totalPercent = (__loadedCount / __totalInstruments) * 100;
        
        // Determina il genere corrente
        var currentGenreInfo = getCurrentGenre(__loadedCount, __genreBoundaries);
        var genreLoaded = __loadedCount - currentGenreInfo.start;
        var genrePercent = (genreLoaded / currentGenreInfo.count) * 100;
        
        updateLoader(
            totalPercent, 
            genrePercent, 
            currentGenreInfo.displayName, 
            genreLoaded, 
            currentGenreInfo.count,
            "Caricamento " + currentGenreInfo.displayName + "..."
        );
        
        await new Promise(function(r) { setTimeout(r, 50); });
    }
    
    var elapsed = Date.now() - __startTime;
    var MIN_DISPLAY = 2000;
    
    updateLoader(100, 100, "Completato!", __totalInstruments, __totalInstruments, "Tutti gli strumenti pronti!");
    
    if (elapsed < MIN_DISPLAY) {
        await new Promise(function(r) { setTimeout(r, MIN_DISPLAY - elapsed); });
    } else {
        await new Promise(function(r) { setTimeout(r, 300); });
    }
    
    hideLoader();
    __loadedCount = 0;
}

export function registerInstrumentLoaded() {
    __loadedCount++;
}

// ======================================================
// 🧰 UTILITIES
// ======================================================

export function clampNote(note, minMidi, maxMidi) {
    var midi = Tone.Frequency(note).toMidi();
    return (midi < minMidi || midi > maxMidi) ? null : note;
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
    amount = amount || 0.008;
    return time + (rand() - 0.5) * amount;
}

export function humanizeVelocity(rand, base) {
    base = base || 1;
    return base * (0.85 + rand() * 0.3);
}