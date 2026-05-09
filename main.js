//
// main.js - Versione VERTICALE/ORIZZONTALE
// Router centrale dell'app: UI, caricamento immagine, analisi, parametri,
// selezione genere, player, spectrum, FX panel.
// Tutto il resto vive nei moduli dei generi.
//

import * as Tone from "https://esm.sh/tone";

import { masterEQ } from "./common.js";
import { analyzeImage } from "./imageAnalysis.js";
import { photoToMusicParams } from "./photoToMusicParams.js";
import { createPianoEngine, waitPianoInstruments } from "./genres/piano/pianoEngine.js";
import { createMetalEngine, waitMetalInstruments } from "./genres/metal/metalEngine.js";
import { createOrchestraEngine, waitOrchestraInstruments } from "./genres/orchestra/orchestraEngine.js";
import { createDanceEngine, waitDanceInstruments } from "./genres/dance/danceEngine.js";
import { scoreVisualizer } from "./scoreUI.js";

console.log("main.js ver. 014.1 loaded");


let currentEngine = null;
let currentGenre = null;
let scoreUI = null;
let isChangingGenre = false;
const miniVideo = document.querySelector('.video-mini-wrapper video'); 

// Flag per tenere traccia degli strumenti già caricati per ogni genere
const instrumentsLoaded = {
    dance: false,
    metal: false,
    orchestra: false,
    piano: false
};

// Promise di caricamento in corso per evitare caricamenti multipli
const loadingPromises = {};

// -------------------------------------------------------------
// Error handler globale
// -------------------------------------------------------------
window.onerror = function (msg, url, line, col, error) {
    console.log("🔥 ERRORE:", msg, " @", url, ":", line, ":", col);
    console.log("STACK:", error?.stack);
};

// -------------------------------------------------------------
// Inizializzazione UI
// -------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
    initFileLoader();
    initGenrePanel();
    if (!scoreUI) {
        scoreUI = new scoreVisualizer();
    }
    resizeCanvas();
});

// -------------------------------------------------------------
// File Loader + Preview
// -------------------------------------------------------------
function initFileLoader() {
    const fileInput = document.getElementById("fileInput");
    const previewImage = document.getElementById("previewImage");
    const heroLogoContainer = document.getElementById("heroLogoContainer");
    const btnElabora = document.getElementById("btnElabora");
    const spectrumPanel = document.getElementById("spectrumPanel");
    const playerPanel = document.getElementById("playerPanel");

    fileInput.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Carica solo immagini.");
            return;
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            previewImage.src = img.src;
            previewImage.classList.remove("hidden");
            
            const isLandscape = img.width > img.height;
            if (isLandscape) {
                previewImage.classList.add("landscape-img");
                previewImage.classList.remove("portrait-img");
                console.log("📷 Immagine orizzontale rilevata");
            } else {
                previewImage.classList.add("portrait-img");
                previewImage.classList.remove("landscape-img");
                console.log("📷 Immagine verticale rilevata");
            }
            
            heroLogoContainer.style.display = "none";
            btnElabora.classList.remove("hidden");
            
            spectrumPanel.classList.add("hidden");
            playerPanel.classList.add("hidden");
            
            previewImage.classList.remove("zoomed-out");
            previewImage.classList.remove("moved-up");
            
            if (miniVideo) {
                miniVideo.pause();
                miniVideo.currentTime = 0; 
            }

            resetAppState(false);
        };
    });
}

// -------------------------------------------------------------
// Pannello generi
// -------------------------------------------------------------
function initGenrePanel() {
    const btnElabora = document.getElementById("btnElabora");
    const genrePanel = document.getElementById("genrePanel");
    const closeGenrePanel = document.getElementById("closeGenrePanel");

    btnElabora.addEventListener("click", () => {
        closeMixelUI();
        miniVideo?.play().catch(e => console.log("Autoplay video bloccato:", e));
        requestWakeLock();
        
        genrePanel.classList.add("show");
        genrePanel.classList.remove("hidden");
    });

    closeGenrePanel.addEventListener("click", () => {
        genrePanel.classList.remove("show");
        setTimeout(() => genrePanel.classList.add("hidden"), 400);
    });

    document.querySelectorAll(".genre-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!isChangingGenre) {
                selectGenre(btn.dataset.genre);
            } else {
                console.log("Genere già in cambio, attendere...");
            }
        });
    });
}

// -------------------------------------------------------------
// Reset audio sicuro
// -------------------------------------------------------------
async function safeResetAudio() {
    console.log("🔄 Reset audio in corso...");
    
    try {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        
        if (currentEngine) {
            if (currentEngine.stop) currentEngine.stop();
            if (currentEngine.dispose) {
                await currentEngine.dispose();
            }
            currentEngine = null;
        }
        
        // Non chiudere il contesto, basta riavviare
        await Tone.start();
        await new Promise(r => setTimeout(r, 50));
        
        console.log("✅ Reset audio completato");
        return true;
    } catch (e) {
        console.warn("⚠️ Errore durante reset audio:", e);
        return false;
    }
}

// -------------------------------------------------------------
// Caricamento strumenti per genere (con debug dettagliato)
// -------------------------------------------------------------
// Nella funzione loadInstrumentsForGenre, rimuovi il sistema complesso:

async function loadInstrumentsForGenre(genre) {
    // Se già caricati, salta
    if (instrumentsLoaded[genre]) {
        console.log(`✅ Strumenti ${genre} già caricati, skip`);
        return true;
    }
    
    console.log(`🎵 Caricamento strumenti per ${genre}...`);
    
    // Mostra loader
    showLoader(`Caricamento ${genre}`, "Preparazione dei campioni...");
    updateLoaderProgress(0, "Avvio caricamento...");
    
    try {
        let loadPromise;
        switch(genre) {
            case "dance":
                loadPromise = waitDanceInstruments();
                break;
            case "metal":
                loadPromise = waitMetalInstruments();
                break;
            case "orchestra":
                loadPromise = waitOrchestraInstruments();
                break;
            case "piano":
                loadPromise = waitPianoInstruments();
                break;
            default:
                throw new Error(`Genere sconosciuto: ${genre}`);
        }
        
        await loadPromise;
        instrumentsLoaded[genre] = true;
        console.log(`✅ Strumenti ${genre} caricati con successo`);
        
        updateLoaderProgress(100, "Completato!");
        await new Promise(r => setTimeout(r, 300));
        
        return true;
    } catch (error) {
        console.error(`❌ Errore caricamento strumenti ${genre}:`, error);
        updateLoaderProgress(0, `Errore: ${error.message}`);
        throw error;
    } finally {
        hideLoader();
    }
}

// ------------------------------
// Selezione genere
// -------------------------------------------------------------
async function selectGenre(genre) {
    if (isChangingGenre) {
        console.log("⏳ Attendi, cambio genere già in corso...");
        return;
    }
    
    if (currentGenre === genre && currentEngine) {
        console.log(`Genere ${genre} già attivo`);
        const genrePanel = document.getElementById("genrePanel");
        genrePanel.classList.remove("show");
        setTimeout(() => genrePanel.classList.add("hidden"), 400);
        return;
    }
    
    isChangingGenre = true;
    currentGenre = genre;
    if (scoreUI) scoreUI.setTheme(genre);

    const previewImage = document.getElementById("previewImage");
    const genrePanel = document.getElementById("genrePanel");
    const overlay = document.getElementById("loadingOverlay");
    const loadingText = document.getElementById("loadingText");
    
    if (loadingText) loadingText.textContent = `Preparazione ${genre}...`;
    if (overlay) overlay.style.display = "flex";

    try {
        // Reset audio solo se c'è un engine attivo
        if (currentEngine) {
            console.log("Cambio genere, reset audio...");
            await safeResetAudio();
        }
        // Analisi immagine
        console.log("📷 Analisi immagine...");
        const analysis = await analyzeImage(previewImage);
        const params = photoToMusicParams(analysis);
        console.log("📊 Parametri musicali calcolati");

        // Carica strumenti
        await loadInstrumentsForGenre(genre);

        // Crea l'engine
        console.log(`🔧 Creazione engine ${genre}...`);
        switch(genre) {
            case "dance":
                currentEngine = await createDanceEngine(params, scoreUI);
                break;
            case "metal":
                currentEngine = await createMetalEngine(params, scoreUI);
                break;
            case "orchestra":
                console.log("🎻 Invocazione createOrchestraEngine...");
                currentEngine = await createOrchestraEngine(params, scoreUI);
                break;
            case "piano":
                currentEngine = await createPianoEngine(params, scoreUI);
                break;
            default:
                throw new Error(`Genere non supportato: ${genre}`);
        }

        if (!currentEngine) {
            throw new Error("Engine non creato!");
        }

        console.log(`✅ Engine ${genre} creato con successo`);

        // Zoom-out dell'immagine
        previewImage.classList.add("zoomed-out");

        initPlayerUI();
        drawSpectrum();
        initFxPanel(currentEngine.mixerData);

        genrePanel.classList.remove("show");
        setTimeout(() => genrePanel.classList.add("hidden"), 400);

    } catch (error) {
        console.error("❌ Errore nella selezione del genere:", error);
        if (loadingText) loadingText.textContent = `Errore: ${error.message || "Riprova"}`;
        await new Promise(r => setTimeout(r, 2000));
    } finally {
        if (overlay) overlay.style.display = "none";
        isChangingGenre = false;
    }
}

// -------------------------------------------------------------
// Player UI
// -------------------------------------------------------------
function initPlayerUI() {
    const spectrumPanel = document.getElementById("spectrumPanel");
    const playerPanel = document.getElementById("playerPanel");
    const btnSpartito = document.getElementById("btnSpartito");
    const previewImage = document.getElementById("previewImage");
    const closeScoreBtn = document.getElementById("closeScoreBtn");
    const rightPanel = document.querySelector(".right-panel");
    
    if (rightPanel) rightPanel.classList.add("visible");
    
    spectrumPanel.classList.remove("hidden");
    playerPanel.classList.remove("hidden");
    btnSpartito.classList.remove("hidden");
    
    setTimeout(() => {
        previewImage.classList.add("moved-up");
        resizeCanvas();
    }, 100);

    const playBtn = document.getElementById("btnPlay");
    const pauseBtn = document.getElementById("btnPause");
    const stopBtn = document.getElementById("btnStop");
    let seekBar = document.getElementById("seekBar");

    function formatTime(sec) {
        if (isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    playBtn.onclick = async () => {
        const overlay = document.getElementById("loadingOverlay");
        if (overlay) overlay.style.display = "flex";

        try {
            await Tone.start();
            await Tone.loaded();
            currentEngine.play();
        } catch (error) {
            console.error("Errore avvio audio:", error);
        } finally {
            if (overlay) overlay.style.display = "none";
        }
    };

    pauseBtn.onclick = () => currentEngine?.pause();
    
    stopBtn.onclick = () => {
        currentEngine?.stop();
        if (scoreUI) scoreUI.hide();
        btnSpartito.classList.add("hidden");
        const closeScoreBtnLocal = document.getElementById("closeScoreBtn");
        if (closeScoreBtnLocal) closeScoreBtnLocal.style.display = "none";
    };
    
    btnSpartito.onclick = () => {
        if (scoreUI) {
            scoreUI.show();
            if (closeScoreBtn) closeScoreBtn.style.display = "flex";
        } else {
            console.error("scoreUI non inizializzato!");
        }
    };

    const currentTimeEl = document.getElementById("currentTime");
    const totalTimeEl = document.getElementById("totalTime");
    
    if (currentEngine && currentEngine.totalDuration) {
        totalTimeEl.textContent = formatTime(currentEngine.totalDuration);
    }

    if (window._transportHandler) {
        Tone.Transport.clear(window._transportHandler);
    }
    
    window._transportHandler = Tone.Transport.scheduleRepeat(() => {
        const now = Tone.Transport.seconds;
        const duration = currentEngine?.totalDuration || 1;
        if (seekBar) seekBar.value = (now / duration) * 100;
        if (currentTimeEl) currentTimeEl.textContent = formatTime(now);
    }, 0.1);

    if (seekBar) {
        const newSeekBar = seekBar.cloneNode(true);
        if (seekBar.parentNode) {
            seekBar.parentNode.replaceChild(newSeekBar, seekBar);
        }
        seekBar = newSeekBar;
        window.seekBar = seekBar;
        
        seekBar.addEventListener("input", () => {
            const seconds = (seekBar.value / 100) * currentEngine.totalDuration;
            currentEngine.seek(seconds);
        });
    }
}

// -------------------------------------------------------------
// Spectrum Analyzer
// -------------------------------------------------------------
const fft = new Tone.Analyser("fft", 256);
Tone.Destination.connect(fft);

const canvas = document.getElementById("spectrumCanvas");
let ctx = null;
let peaks = new Array(256).fill(0);
let animationId = null;

function resizeCanvas() {
    if (!canvas) return;
    const container = canvas.parentElement;
    if (container && container.clientWidth > 0 && container.clientHeight > 0) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        ctx = canvas.getContext("2d");
    }
}

function drawSpectrum() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    function draw() {
        animationId = requestAnimationFrame(draw);
        
        if (!canvas || !ctx) {
            if (canvas) ctx = canvas.getContext("2d");
            if (!ctx) return;
        }
        
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
            ctx = canvas.getContext("2d");
        }
        
        const W = canvas.width;
        const H = canvas.height;
        
        if (W === 0 || H === 0) return;
        
        const values = fft.getValue();
        ctx.clearRect(0, 0, W, H);
        
        const barWidth = W / values.length;
        
        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            const magnitude = Math.max(0, Math.min(1, (v + 120) / 120));
            const barHeight = magnitude * H;
            
            const startHue = 320;
            const endHue = 220;
            const hue = startHue + (endHue - startHue) * magnitude;
            ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
            
            const x = i * barWidth;
            const y = H - barHeight;
            ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
            
            if (barHeight > peaks[i]) {
                peaks[i] = barHeight;
            } else {
                peaks[i] *= 0.97;
            }
            
            ctx.fillStyle = "#FFFFFF";
            const peakY = H - peaks[i];
            ctx.fillRect(x, peakY - 2, Math.max(1, barWidth - 1), 2);
        }
    }
    
    draw();
}

// -------------------------------------------------------------
// FX Panel
// -------------------------------------------------------------
function initFxPanel(mixerData) {
    const fxPanel = document.getElementById("fxPanel");
    const btnFxPanel = document.getElementById("btnFxPanel");
    const closeFxPanel = document.getElementById("closeFxPanel");

    if (btnFxPanel) {
        btnFxPanel.onclick = () => fxPanel.classList.add("show");
    }
    if (closeFxPanel) {
        closeFxPanel.onclick = () => fxPanel.classList.remove("show");
    }

    const eqLow = document.getElementById("eqLow");
    const eqMid = document.getElementById("eqMid");
    const eqHigh = document.getElementById("eqHigh");

    if (eqLow) {
        eqLow.addEventListener("input", e => {
            masterEQ.low.value = Tone.dbToGain(Number(e.target.value));
        });
    }
    if (eqMid) {
        eqMid.addEventListener("input", e => {
            masterEQ.mid.value = Tone.dbToGain(Number(e.target.value));
        });
    }
    if (eqHigh) {
        eqHigh.addEventListener("input", e => {
            masterEQ.high.value = Tone.dbToGain(Number(e.target.value));
        });
    }

    const volumeContainer = document.getElementById("volumeControls");
    if (!volumeContainer || !mixerData || !mixerData.volumeMap) return;
    
    volumeContainer.innerHTML = "";

    Object.entries(mixerData.volumeMap).forEach(([busName, label]) => {
        const row = document.createElement("div");
        row.classList.add("volume-row");

        const lbl = document.createElement("label");
        lbl.textContent = label;

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = -24;
        slider.max = 6;
        slider.value = 0;
        slider.dataset.bus = busName;

        slider.addEventListener("input", e => {
            mixerData.instruments.setVolume(busName, Number(e.target.value));
        });

        const btnSolo = document.createElement("button");
        btnSolo.textContent = "Solo";
        btnSolo.addEventListener("click", () => {
            Object.keys(mixerData.volumeMap).forEach(otherBus => {
                const otherSlider = volumeContainer.querySelector(`input[data-bus="${otherBus}"]`);
                if (otherBus === busName) {
                    mixerData.instruments.setVolume(otherBus, 0);
                    if (otherSlider) otherSlider.value = 0;
                } else {
                    mixerData.instruments.setVolume(otherBus, -99);
                    if (otherSlider) otherSlider.value = -24;
                }
            });
        });

        const btnMute = document.createElement("button");
        btnMute.textContent = "Mute";
        btnMute.addEventListener("click", () => {
            mixerData.instruments.setVolume(busName, -99);
            slider.value = -24;
        });

        row.appendChild(lbl);
        row.appendChild(slider);
        row.appendChild(btnSolo);
        row.appendChild(btnMute);
        volumeContainer.appendChild(row);
    });
}

// -------------------------------------------------------------
// Reset App
// -------------------------------------------------------------
function resetAppState(resetAudio = false) {
    if (currentEngine) {
        try {
            currentEngine.stop();
            if (currentEngine.score) currentEngine.score.hide();
        } catch(e) {
            console.warn("Errore nello stop engine:", e);
        }
        currentEngine = null;
    }
    
    currentGenre = null;
    closeMixelUI();
    
    if (miniVideo) {
        miniVideo.pause();
        miniVideo.currentTime = 0; 
    }
    
    releaseWakeLock();
    
    if (resetAudio) {
        safeResetAudio().catch(console.warn);
    }
    
    const previewImage = document.getElementById("previewImage");
    if (previewImage) {
        previewImage.classList.remove("zoomed-out");
        previewImage.classList.remove("moved-up");
    }
    
    const closeScoreBtn = document.getElementById("closeScoreBtn");
    if (closeScoreBtn) closeScoreBtn.style.display = "none";
}

// -------------------------------------------------------------
// UI animazioni
// -------------------------------------------------------------
function closeMixelUI() {
    const spectrumPanel = document.getElementById("spectrumPanel");
    const playerPanel = document.getElementById("playerPanel");
    const previewImage = document.getElementById("previewImage");
    const btnSpartito = document.getElementById("btnSpartito");
    const closeScoreBtn = document.getElementById("closeScoreBtn");
    const rightPanel = document.querySelector(".right-panel");
    
    if (rightPanel) rightPanel.classList.remove("visible");
    
    if (spectrumPanel) spectrumPanel.classList.add("hidden");
    if (playerPanel) playerPanel.classList.add("hidden");
    if (btnSpartito) btnSpartito.classList.add("hidden");
    if (previewImage) previewImage.classList.remove("moved-up");
    if (closeScoreBtn) closeScoreBtn.style.display = "none";
}

// -------------------------------------------------------------
// Wake Lock
// -------------------------------------------------------------
let wakeLock = null;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log("✅ Schermo bloccato");
            wakeLock.addEventListener('release', () => {
                console.log("Wake Lock rilasciato");
            });
        }
    } catch (err) {
        console.error(`❌ Wake Lock error:`, err);
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }
}

// -------------------------------------------------------------
// Event listener
// -------------------------------------------------------------
window.addEventListener('resize', () => {
    resizeCanvas();
    if (currentEngine) {
        const previewImage = document.getElementById("previewImage");
        if (previewImage && !previewImage.classList.contains('hidden')) {
            previewImage.classList.add("moved-up");
        }
    }
});

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.id === 'spectrumPanel' && 
            mutation.type === 'attributes' && 
            mutation.attributeName === 'class') {
            if (!mutation.target.classList.contains('hidden')) {
                setTimeout(resizeCanvas, 100);
            }
        }
    });
});

const spectrumPanelElement = document.getElementById("spectrumPanel");
if (spectrumPanelElement) {
    observer.observe(spectrumPanelElement, { attributes: true });
}

window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    releaseWakeLock();
});