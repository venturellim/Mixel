//
// common.js — versione universale per tutti i generi
// Contiene SOLO:
// - master bus
// - EQ/mastering
// - utilities generiche
// - sistema di caricamento strumenti (generico)
// - logging note
//
// Nessun sampler, nessun effetto, nessuna logica metal.
// Tutto ciò che è strumento → va nella cartella del genere.
//

import * as Tone from "https://esm.sh/tone";

console.log("common.js ver. 004 loaded");

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
// 📦 SISTEMA DI CARICAMENTO STRUMENTI (STILE WIN11)
// ======================================================

let __loadedCount = 0;
let __currentTotal = 0;
let __resolveWait = null;
let __waitPromise = null;
let __isLoading = false;

// Inietta lo stile CSS una sola volta
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
            display: flex;
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
        
        .win11-icon {
            margin-bottom: 20px;
        }
        
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
            letter-spacing: -0.2px;
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
            letter-spacing: 0.3px;
        }
    `;
    document.head.appendChild(style);
}

// Crea la struttura HTML del loader (una sola istanza)
let win11Overlay = null;

function getOrCreateLoader() {
    injectWin11LoaderStyle();
    
    if (win11Overlay && win11Overlay.parentNode) {
        return win11Overlay;
    }
    
    // Rimuovi vecchio loader se esiste
    const existingLoader = document.getElementById("win11-loader-overlay");
    if (existingLoader) existingLoader.remove();
    
    win11Overlay = document.createElement("div");
    win11Overlay.id = "win11-loader-overlay";
    win11Overlay.className = "win11-overlay";
    win11Overlay.style.display = "none";
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

function showWin11Loader() {
    const overlay = getOrCreateLoader();
    overlay.style.display = "flex";
}

function hideWin11Loader() {
    if (win11Overlay) {
        win11Overlay.style.display = "none";
    }
}

function updateWin11Loader(percent, title, subtitle, status) {
    const overlay = getOrCreateLoader();
    const progressBar = document.getElementById("win11-progress-bar");
    const percentText = document.getElementById("win11-percent");
    const titleEl = document.getElementById("win11-title");
    const subtitleEl = document.getElementById("win11-subtitle");
    const statusEl = document.getElementById("win11-status");
    
    if (progressBar && percent !== undefined && percent !== null) {
        progressBar.style.width = Math.min(100, Math.max(0, percent)) + "%";
    }
    if (percentText && percent !== undefined && percent !== null) {
        percentText.textContent = Math.floor(percent) + "%";
    }
    if (titleEl && title) titleEl.textContent = title;
    if (subtitleEl && subtitle) subtitleEl.textContent = subtitle;
    if (statusEl && status) statusEl.textContent = status;
}

export function registerInstrumentLoaded() {
    __loadedCount++;
    console.log(`📦 Strumento caricato: ${__loadedCount}/${__currentTotal}`);
    
    if (__currentTotal > 0) {
        const percent = (__loadedCount / __currentTotal) * 100;
        updateWin11Loader(percent, null, null, `Caricamento ${__loadedCount}/${__currentTotal}`);
    }
    
    if (__resolveWait && __loadedCount >= __currentTotal) {
        updateWin11Loader(100, "Completato!", "Tutto pronto", "Caricamento completato");
        setTimeout(() => {
            if (__resolveWait) {
                __resolveWait();
                __resolveWait = null;
            }
        }, 200);
    }
}

export async function waitForInstruments(total, genreName = "strumenti") {
    console.log(`⏳ waitForInstruments chiamato con total=${total}, loadedCount=${__loadedCount}`);
    
    // Evita caricamenti multipli simultanei
    if (__isLoading) {
        console.log("Caricamento già in corso, attendo...");
        // Se c'è già una promise in corso, attendila
        if (__waitPromise) {
            await __waitPromise;
        }
        return;
    }
    
    __isLoading = true;
    
    // Mostra loader
    showWin11Loader();
    updateWin11Loader(0, `Caricamento ${genreName}`, "Preparazione dei campioni...", "Inizializzazione");
    
    // Reset contatore se necessario
    if (__loadedCount > 0 && __loadedCount < total) {
        console.log(`⚠️ Reset contatore da ${__loadedCount} a 0`);
        __loadedCount = 0;
    }
    
    __currentTotal = total;
    
    // Se siamo già a quota, esci subito
    if (__loadedCount >= total) {
        console.log(`✅ Strumenti già tutti caricati (${__loadedCount}/${total})`);
        updateWin11Loader(100, "Completato!", "Tutto pronto", "Strumenti già disponibili");
        setTimeout(() => {
            hideWin11Loader();
            __isLoading = false;
        }, 500);
        __loadedCount = 0;
        __currentTotal = 0;
        return;
    }
    
    // Aggiorna UI iniziale
    const initialPercent = (__loadedCount / total) * 100;
    updateWin11Loader(initialPercent, `Caricamento ${genreName}`, "Caricamento dei campioni...", `Avvio caricamento (0/${total})`);
    
    // Crea una nuova promise
    __waitPromise = new Promise((resolve) => {
        __resolveWait = resolve;
    });
    
    // Attendi il completamento
    await __waitPromise;
    
    console.log(`✅ Caricamento completato (${__loadedCount}/${total})`);
    
    // Nascondi loader e resetta
    setTimeout(() => {
        hideWin11Loader();
        __loadedCount = 0;
        __currentTotal = 0;
        __resolveWait = null;
        __waitPromise = null;
        __isLoading = false;
    }, 300);
}

export function resetInstrumentLoader() {
    console.log(`🔄 Reset forzato loader: ${__loadedCount} → 0`);
    __loadedCount = 0;
    __currentTotal = 0;
    if (__resolveWait) {
        __resolveWait();
        __resolveWait = null;
    }
    __waitPromise = null;
    __isLoading = false;
    hideWin11Loader();
}

export function updateLoaderStatus(status, subtitle) {
    updateWin11Loader(null, null, subtitle, status);
}


// ======================================================
// 🧰 UTILITIES GENERICHE
// ======================================================

export function clampNote(note, minMidi, maxMidi) {
    const midi = Tone.Frequency(note).toMidi();
    if (midi < minMidi || midi > maxMidi) return null;
    return note;
}

export function pickFromScale(scale, step) {
    return scale[step % scale.length];
}

export function createSeededRandom(seed) {
    return function () {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

export function humanizeTime(time, rand, amount = 0.008) {
    const offset = (rand() - 0.5) * amount;
    return time + offset;
}

export function humanizeVelocity(rand, base = 1) {
    const variation = 0.85 + rand() * 0.3;
    return base * variation;
}