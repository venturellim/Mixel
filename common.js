//
// common.js — versione universale per tutti i generi (CONFIGURABILE)
//

import * as Tone from "https://esm.sh/tone";

console.log("common.js ver. 027.1 loaded");

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
// 🎨 LOADER WIN11 FLUIDO SENZA INTERRUZIONI (VERDE BRILLANTE/BLU)
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
let win11InstrumentName = null;
let win11Divider = null;
let win11InstrumentLabel = null;
let currentLottieAnimation = null;

// Contenitore per i parametri reali passati dal main
let activeAnalysisData = null;

/**
 * Passa i parametri estratti dal main per mostrarli nella barra verde
 */
export function setLoaderAnalysisData(analysis) {
    activeAnalysisData = analysis;
}

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
            "padding: 28px 32px; min-width: 380px; text-align: center;" +
            "box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);" +
        "}" +
        ".win11-icon { margin-bottom: 20px; min-height: 64px; display: flex; justify-content: center; align-items: center; }" +
        ".win11-title { font-size: 16px; font-weight: 500; color: #fff; margin-bottom: 8px; }" +
        ".win11-subtitle { font-size: 13px; color: rgba(255, 255, 255, 0.6); margin-bottom: 20px; }" +
        ".win11-bar-container { background: rgba(255, 255, 255, 0.1); border-radius: 10px; height: 6px; overflow: hidden; margin-bottom: 8px; }" +
        
        // Barra Blu Originale (Fase Strumenti)
        ".win11-progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, #0a6eff, #3b82f6, #60a5fa); border-radius: 10px; transition: width 0.1s; position: relative; overflow: hidden; }" +
        // 🟢 NUOVO GRADIENTE VERDE IPER-BRILLANTE (Fase DNA)
        ".win11-progress-bar.dna-mode { background: linear-gradient(90deg, #00c853, #00f5d4, #66ffa6) !important; }" +
        
        ".win11-progress-bar::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent); animation: win11-shimmer 1.5s infinite; transform: translateX(-100%); }" +
        "@keyframes win11-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }" +
        ".win11-percent { font-size: 12px; font-weight: 500; color: #60a5fa; text-align: right; font-family: monospace; margin-bottom: 16px; }" +
        // 🟢 Testo percentuale verde neon coordinato
        ".win11-percent.dna-mode { color: #00f5d4 !important; text-shadow: 0 0 10px rgba(0, 245, 212, 0.3); }" +
        
        ".win11-genre-label { font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px; text-align: left; }" +
        ".win11-genre-bar-container { background: rgba(255, 255, 255, 0.08); border-radius: 8px; height: 4px; overflow: hidden; margin-bottom: 4px; }" +
        ".win11-genre-progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, #60a5fa, #3b82f6, #0a6eff); border-radius: 8px; transition: width 0.1s; }" +
        ".win11-genre-percent { font-size: 10px; color: #60a5fa; text-align: right; font-family: monospace; margin-bottom: 4px; }" +
        ".win11-instrument-label { font-size: 10px; color: rgba(255, 255, 255, 0.35); margin-top: 8px; text-align: left; }" +
        ".win11-instrument-name { font-size: 11px; color: #60a5fa; font-weight: 500; margin-top: 2px; text-align: left; min-height: 16px; }" +
        // 🟢 Testo etichette parametri verde neon coordinato
        ".win11-instrument-name.dna-mode { color: #00f5d4 !important; }" +
        
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
        '<div class="win11-loader">' +
            '<div class="win11-icon" id="lottie-container"></div>' +
            '<div class="win11-title" id="win11-title">Inizializzazione</div>' +
            '<div class="win11-subtitle" id="win11-subtitle">Preparazione...</div>' +
            '<div class="win11-bar-container">' +
                '<div class="win11-progress-bar" id="win11-progress-bar"></div>' +
            '</div>' +
            '<div class="win11-percent" id="win11-percent">0%</div>' +
            '<div class="win11-divider" id="win11-divider"></div>' +
            '<div class="win11-genre-label" id="win11-genre-label">Caricamento...</div>' +
            '<div class="win11-genre-bar-container" id="win11-genre-bar-container">' +
                '<div class="win11-genre-progress-bar" id="win11-genre-progress-bar"></div>' +
            '</div>' +
            '<div class="win11-genre-percent" id="win11-genre-percent">0%</div>' +
            '<div class="win11-instrument-label" id="win11-instrument-label">Strumento corrente: </div>' +
            '<div class="win11-instrument-name" id="win11-instrument-name">-</div>' +
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
    win11InstrumentName = win11Overlay.querySelector("#win11-instrument-name");
    win11Divider = win11Overlay.querySelector("#win11-divider");
    win11InstrumentLabel = win11Overlay.querySelector("#win11-instrument-label");
    
    document.body.appendChild(win11Overlay);
}

function loadLottieAnimation(path) {
    var lottieContainer = document.getElementById("lottie-container");
    if (!lottieContainer) return;

    if (currentLottieAnimation) {
        currentLottieAnimation.destroy();
    }
    lottieContainer.innerHTML = "";

    if (typeof lottie !== 'undefined') {
        currentLottieAnimation = lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: path
        });
        
        currentLottieAnimation.addEventListener('DOMLoaded', function() {
            var svg = lottieContainer.querySelector('svg');
            if (svg) {
                svg.setAttribute('width', '64');
                svg.setAttribute('height', '64');
            }
        });
    } else {
        lottieContainer.innerHTML = path.includes("DNA") ? '<div style="font-size: 48px;">🧬</div>' : '<div style="font-size: 48px;">🎵</div>';
    }
}

function updateWin11UI(totalPercent, genrePercent, genreName, genreCurrent, genreTotal, status, title, subtitle, currentInstrument, isDnaPhase = false) {
    if (win11ProgressBar) {
        win11ProgressBar.style.width = Math.min(100, Math.max(0, totalPercent)) + "%";
        if (isDnaPhase) win11ProgressBar.classList.add("dna-mode");
        else win11ProgressBar.classList.remove("dna-mode");
    }
    if (win11Percent) {
        win11Percent.textContent = Math.floor(totalPercent) + "%";
        if (isDnaPhase) win11Percent.classList.add("dna-mode");
        else win11Percent.classList.remove("dna-mode");
    }
    
    if (isDnaPhase) {
        if (win11Divider) win11Divider.style.display = "none";
        if (win11GenreName) win11GenreName.style.display = "none";
        if (win11GenrePercent) win11GenrePercent.style.display = "none";
        if (document.getElementById("win11-genre-bar-container")) document.getElementById("win11-genre-bar-container").style.display = "none";
        
        if (win11InstrumentLabel) win11InstrumentLabel.textContent = "Parametro analizzato: ";
        if (win11InstrumentName) win11InstrumentName.classList.add("dna-mode");
    } else {
        if (win11Divider) win11Divider.style.display = "block";
        if (win11GenreName) win11GenreName.style.display = "block";
        if (win11GenrePercent) win11GenrePercent.style.display = "block";
        if (document.getElementById("win11-genre-bar-container")) document.getElementById("win11-genre-bar-container").style.display = "block";
        
        if (win11GenreName && genreName) win11GenreName.textContent = genreName + ": " + genreCurrent + "/" + genreTotal;
        if (win11GenreBar) win11GenreBar.style.width = Math.min(100, Math.max(0, genrePercent)) + "%";
        if (win11GenrePercent) win11GenrePercent.textContent = Math.floor(genrePercent) + "%";
        
        if (win11InstrumentLabel) win11InstrumentLabel.textContent = "Strumento corrente: ";
        if (win11InstrumentName) win11InstrumentName.classList.remove("dna-mode");
    }
    
    if (win11InstrumentName && currentInstrument) win11InstrumentName.textContent = currentInstrument;
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
// 📦 FASE 1: ANALISI DNA IMMAGINE (SOLO GRAFICA)
// ======================================================
export async function waitDNA(analysisData) {
    initWin11Loader();
    showWin11UI();
    
    loadLottieAnimation('DNAloader.json');
    
    const dnaDuration = 5000;
    const dnaStartTime = Date.now();
    
    const fallbackDnaSteps = [
        { label: "Matrice Pixel RGB...", status: "Mappatura canali colore..." },
        { label: "Luminance Contrast", status: "Calcolo dei livelli di soglia globale..." },
        { label: "Color Temperature", status: "Analisi bilanciamento caldo/freddo..." },
        { label: "Energy (StdDev)", status: "Misurazione del contrasto dell'immagine..." },
        { label: "Texture & Roughness", status: "Rilevamento densità superficiale..." },
        { label: "Complexity Vector", status: "Analisi dell'entropia spaziale..." },
        { label: "Edge Density (Sobel)", status: "Estrazione bordi d'onda visivi..." },
        { label: "Key Dominante", status: "Calcolo della tonalità musicale associata..." },
        { label: "Generazione Photo DNA Hash", status: "Hashing deterministico completato!" }
    ];

    return new Promise((resolve) => {
        var dnaInterval = setInterval(function() {
            var elapsed = Date.now() - dnaStartTime;
            var percent = Math.min(100, (elapsed / dnaDuration) * 100);
            
            var stepIndex = Math.floor((percent / 100) * fallbackDnaSteps.length);
            stepIndex = Math.min(stepIndex, fallbackDnaSteps.length - 1);
            var currentStep = fallbackDnaSteps[stepIndex];
            
            var currentLabel = currentStep.label;
            
            if (analysisData) {
                if (percent > 12 && percent <= 24) currentLabel = `Brightness: ${Number(analysisData.brightness).toFixed(3)}`;
                else if (percent > 24 && percent <= 36) currentLabel = `Color Temp: ${Number(analysisData.colorTemperature).toFixed(3)}`;
                else if (percent > 36 && percent <= 48) currentLabel = `Energy/Contrast: ${Number(analysisData.energy).toFixed(3)}`;
                else if (percent > 48 && percent <= 60) currentLabel = `Texture/Roughness: ${Number(analysisData.texture).toFixed(3)}`;
                else if (percent > 60 && percent <= 72) currentLabel = `Complexity Vector: ${Number(analysisData.complexity).toFixed(3)}`;
                else if (percent > 72 && percent <= 84) currentLabel = `Entropy Spatial: ${Number(analysisData.entropy).toFixed(3)}`;
                else if (percent > 84 && percent <= 93) currentLabel = `Edge Density: ${Number(analysisData.edges).toFixed(3)}`;
                else if (percent > 93) currentLabel = `Key: ${analysisData.key} | DNA: ${analysisData.dna}`;
            }

            updateWin11UI(
                percent, 
                0, 
                null, 0, 0, 
                currentStep.status, 
                "Estrazione DNA Immagine", 
                "Analisi dei descrittori visivi in corso...", 
                currentLabel, 
                true
            );
            
            if (percent >= 100) {
                clearInterval(dnaInterval);
              setTimeout(() => {
                hideWin11UI();
                resolve();
                }, 500);
            }
        }, 50);
    });
}

// ======================================================
// 📦 FASE 2: CARICAMENTO STRUMENTI (ATTESA REALE)
// ======================================================
// ======================================================
// 📦 FASE 2: CARICAMENTO STRUMENTI (ATTESA MINIMA 7s + BLOCCO AL 90%)
// ======================================================
export async function waitInstruments(genreInstruments, selectedGenre = null) {
    initWin11Loader();
    showWin11UI();
    
    const firstStart = 1;
    var loadingQueue = [];
    
    if (firstStart === 1) {
        loadLottieAnimation('loader.json');

        var displayNames = {
            dance: "Dance",
            metal: "Metal",
            orchestra: "Orchestra",
            piano: "Piano"
        };
        
        for (var genreKey in genreInstruments) {
            var instruments = genreInstruments[genreKey];
            var displayName = displayNames[genreKey] || genreKey.charAt(0).toUpperCase() + genreKey.slice(1);
            
            for (var i = 0; i < instruments.length; i++) {
                loadingQueue.push({
                    genre: genreKey,
                    genreDisplay: displayName,
                    instrumentName: instruments[i],
                    instrumentIndex: i + 1,
                    instrumentTotal: instruments.length
                });
            }
        }
        
        var totalInstruments = loadingQueue.length;
        
        updateWin11UI(0, 0, "Inizializzazione", 0, 0, "Avvio...", "Caricamento strumenti", "Preparazione dei campioni...", "-", false);
        
        var startTime = Date.now();
        var TOTAL_DURATION_MS = 7000;
        var isToneLoaded = false;
        var currentPercent = 0;

        // Monitoriamo in background quando Tone.js ha davvero finito
        Tone.loaded().then(() => {
            isToneLoaded = true;
        });
        
        var animationInterval = setInterval(function() {
            var elapsed = Date.now() - startTime;
            
            // Calcoliamo la percentuale teorica basata sul tempo (arriva a 90 in 7 secondi)
            var timePercent = (elapsed / TOTAL_DURATION_MS) * 90;
            
            if (timePercent < 90) {
                // FASE 1: Siamo dentro i 7 secondi, la barra avanza linearmente fino al 90%
                currentPercent = timePercent;
            } else if (!isToneLoaded) {
                // FASE 2: Sono passati i 7 secondi MA i file audio non sono pronti. Ci inchiodiamo al 90%
                currentPercent = 90;
            } else {
                // FASE 3: I 7 secondi sono passati E i file audio sono pronti. Scatto fluido verso il 100%
                currentPercent += 2.5; 
                if (currentPercent >= 100) {
                    currentPercent = 100;
                    clearInterval(animationInterval);
                }
            }
            
            // Mappiamo l'indice degli strumenti in base alla percentuale attuale riscalata su base 100
            var virtualPercent = (currentPercent / 90) * 100;
            var targetInstrumentIndex = Math.floor((virtualPercent / 100) * totalInstruments);
            targetInstrumentIndex = Math.min(targetInstrumentIndex, totalInstruments - 1);
            
            if (targetInstrumentIndex >= 0 && loadingQueue[targetInstrumentIndex]) {
                var current = loadingQueue[targetInstrumentIndex];
                var sameGenreLoaded = loadingQueue.slice(0, targetInstrumentIndex + 1).filter(item => item.genre === current.genre).length;
                var sameGenreTotal = loadingQueue.filter(item => item.genre === current.genre).length;
                
                // Gestione fluida della barra del singolo genere
                var genrePercent = (sameGenreLoaded / sameGenreTotal) * 100;
                if (currentPercent === 90 && !isToneLoaded) {
                    genrePercent = 95; // La blocchiamo quasi alla fine se siamo in attesa della rete
                }
                
                var instrumentDisplay = `${current.instrumentName} (${current.instrumentIndex}/${current.instrumentTotal})`;
                
                // Cambiamo il testo di stato in base alla situazione reale
                var statusText = `Caricamento ${current.genreDisplay}: ${instrumentDisplay}...`;
                if (currentPercent === 90 && !isToneLoaded) {
                    statusText = "Download dei campioni audio aggiuntivi in corso...";
                } else if (currentPercent > 90) {
                    statusText = "Finalizzazione del mix in corso...";
                }

                updateWin11UI(
                    currentPercent,
                    genrePercent,
                    current.genreDisplay,
                    sameGenreLoaded,
                    sameGenreTotal,
                    statusText,
                    "Caricamento strumenti",
                    currentPercent === 90 && !isToneLoaded ? "Ottimizzazione della connessione..." : "Preparazione del tuo mix...",
                    instrumentDisplay,
                    false
                );
            }
        }, 50);
        
        // Aspetta che Tone.js dichiari il caricamento completato
        await Tone.loaded();
        
        // Aspetta che anche l'animazione grafica abbia raggiunto fisicamente il 100% (lo scatto finale)
        await new Promise(function(resolve) {
            var checkEndInterval = setInterval(() => {
                if (currentPercent >= 100) {
                    clearInterval(checkEndInterval);
                    resolve();
                }
            }, 50);
        });
        
        updateWin11UI(100, 100, "Completato!", totalInstruments, totalInstruments, "Tutti gli strumenti pronti!", "Caricamento completato", "Pronto per suonare!", "✅ Completato!", false);
    }
    
    // Un piccolo delay finale al 100% per far vedere il check verde prima di chiudere
    await new Promise(function(r) { setTimeout(r, 600); });
    
    hideWin11UI();
    return loadingQueue;
}

// Funzioni utility e legacy invariate
let count = 0;
export function registerInstrumentLoaded(instrument) {
    count++;
    console.log(`${count}. 📦 instrument: ${instrument} loaded`);
}

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
    return time + (rand() - 0.5) * amount;
}

export function humanizeVelocity(rand, base = 1) {
    return base * (0.85 + rand() * 0.3);
}