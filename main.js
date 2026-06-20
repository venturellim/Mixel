//
// main.js - Versione VERTICALE/ORIZZONTALE
// Router centrale dell'app: UI, caricamento immagine, analisi, parametri...
//

import * as Tone from "https://esm.sh/tone";

import { masterEQ, waitDNA, waitInstruments, setLoaderAnalysisData } from "./common.js";
import { analyzeImage } from "./imageAnalysis.js"; // Rimane l'import classico originale!
import { photoToMusicParams } from "./photoToMusicParams.js";
import { createPianoEngine } from "./genres/piano/pianoEngine.js";
import { createMetalEngine } from "./genres/metal/metalEngine.js";
import { createOrchestraEngine } from "./genres/orchestra/orchestraEngine.js";
import { createDanceEngine } from "./genres/dance/danceEngine.js";
import { createFunkyEngine } from "./genres/funky/funkyEngine.js";
import { scoreVisualizer } from "./scoreUI.js";
// =========================
// PACKS
// =========================
import { loadDancePack } from "./genres/dance/danceInstruments.js";
import { loadMetalPack } from "./genres/metal/metalInstruments.js";
import { loadOrchestraPack } from "./genres/orchestra/orchestraInstruments.js";
import { loadPianoPack } from "./genres/piano/pianoInstruments.js";
import { loadFunkyPack } from "./genres/funky/funkyInstruments.js";

console.log("main.js Ver. 023 loaded");

let currentEngine = null;
let currentGenre = null;
let currentPack = null;
let firstStart = 1;
let newImageLoaded = 0;
let scoreUI = null;
let globalPhotoParams = null; // Memorizza i parametri strutturati per i generi

const genreInstruments = {
    dance: ["Bells Pad", "Fantasy Fx", "Glass Pad",  "Hard for the Core Fx", "Heaven Fx", "Jump Fx", "Synth Bass", "Lead Synth", "Noise Fx", "Organo", "Percussions", "Saw", "Shaku Pad", "So True Strig Pad", "Sweet Fx", "Synth Brass 1", "Synth Brass 2","Warm Pad", "Wave Pad"],
    funky: ["Clavinet", "Funky Drum", "Guitar Clean", "Guitar Mute", "Noisy", "Sax Alto", "Slap Bass", "Trombone", "Trumpet"], 
    metal: ["Acoustic Guitar Lead", "Acoustic Guitar Rhythm", "Bass", "Drums", "Lead Guitar", "Rhythm Guitar Open", "Rhythm Guitar Palm", "So True String Pad"],
    orchestra: ["Basses", "Cellos", "Violas", "Violins", "Timpani"],
    piano: ["Grand Piano"]
};

const miniVideo = document.querySelector('.video-mini-wrapper video'); 

window.onerror = function (msg, url, line, col, error) {
    console.log("🔥 ERRORE:", msg, " @", url, ":", line, ":", col);
};

window.addEventListener("DOMContentLoaded", () => {
    initFileLoader();
    initGenrePanel();
    if (!scoreUI) {
        scoreUI = new scoreVisualizer();
    }
    resizeCanvas();
});

export function unloadPack(pack) {
    if (!pack || typeof pack !== "object") return;

    for (const key in pack) {
        const item = pack[key];

        // 1. IGNORA BUS, EQ, REVERB, ENVELOPE, ecc.
        if (
            key.endsWith("Bus") ||
            key === "duckGain" ||
            key === "duckEnv" ||
            key === "setVolume" ||
            key === "hallReverb"
        ) {
            continue;
        }

        // 2. SE È UN SAMPLER / SYNTH / PLAYER → dispose()
        if (item && typeof item.dispose === "function") {
            try {
                item.dispose();
                // console.log(`Disposed: ${key}`);
            } catch (e) {
                console.warn(`Errore dispose su ${key}:`, e);
            }
        }

        // 3. RIMUOVI FLAG INTERNE (es. sidechain)
        if (item && typeof item === "object") {
            if (item._duckConnected) delete item._duckConnected;
        }
    }
}

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
            
            if (img.width > img.height) {
                previewImage.classList.add("landscape-img");
                previewImage.classList.remove("portrait-img");
            } else {
                previewImage.classList.add("portrait-img");
                previewImage.classList.remove("landscape-img");
            }
            
            heroLogoContainer.style.display = "none";
            btnElabora.classList.remove("hidden");
            btnElabora.textContent = "✨ Elabora foto";
            spectrumPanel.classList.add("hidden");
            playerPanel.classList.add("hidden");
            previewImage.classList.remove("zoomed-out", "moved-up");
            
            newImageLoaded = 1;
            
            if (miniVideo) {
                miniVideo.pause();
                miniVideo.currentTime = 0; 
            }

            resetAppState();
        };
    });
}

function initGenrePanel() {
    const btnElabora = document.getElementById("btnElabora");
    const genrePanel = document.getElementById("genrePanel");
    const closeGenrePanel = document.getElementById("closeGenrePanel");
    const previewImage = document.getElementById("previewImage");

    btnElabora.addEventListener("click", async () => {
        closeMixelUI();
        miniVideo?.play().catch(e => console.log("Video bloccato:", e));
        requestWakeLock();
                    
        if (firstStart !== 1) {
            resetAudio();
            firstStart = 0;
        } 
        
        if (newImageLoaded === 1){ 
            const analysis = analyzeImage(previewImage);
setLoaderAnalysisData(analysis);
            globalPhotoParams = photoToMusicParams(analysis);
            await waitDNA(analysis);
           btnElabora.textContent = "🎵 Scegli genere";
            newImageLoaded = 0;
            firstStart = 0;
        }
        
        genrePanel.classList.add("show");
        genrePanel.classList.remove("hidden");
    });

    closeGenrePanel.addEventListener("click", () => {
        genrePanel.classList.remove("show");
        setTimeout(() => genrePanel.classList.add("hidden"), 400);
    });

    document.querySelectorAll(".genre-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            selectGenre(btn.dataset.genre);
        });
    });
}

async function selectGenre(genre) {
    currentGenre = genre;
    if (scoreUI) scoreUI.setTheme(genre);

    const previewImage = document.getElementById("previewImage");

    // Fallback di sicurezza
    if (!globalPhotoParams) {
        const analysis = analyzeImage(previewImage);
        globalPhotoParams = photoToMusicParams(analysis);
    }

    let instruments = null;
    if (currentPack !== null) {
    unloadPack(currentPack);
    }

const genreInstList = { [genre]: genreInstruments[genre] };
const animationPromise = waitInstruments(genreInstList, genre);

    // ============================================================
    // 1) CARICAMENTO PACK STRUMENTI
    // 2) CREAZIONE ENGINE DEL GENERE
    // ============================================================
    if (genre === "dance") {
        instruments = await loadDancePack();
        await animationPromise;
        currentEngine = await createDanceEngine(globalPhotoParams, scoreUI, instruments);
        }

    if (genre === "funky") {
        instruments = await loadFunkyPack();
        await animationPromise;
        currentEngine = await createFunkyEngine(globalPhotoParams, scoreUI, instruments);
        }

    if (genre === "metal") {
        instruments = await loadMetalPack();
        await animationPromise;
        currentEngine = await createMetalEngine(globalPhotoParams, scoreUI, instruments);
        }

    if (genre === "orchestra") {
        instruments = await loadOrchestraPack();
        await animationPromise;
        currentEngine = await createOrchestraEngine(globalPhotoParams, scoreUI, instruments);
        }

    if (genre === "piano") {
        instruments = await loadPianoPack();
        await animationPromise;
        currentEngine = await createPianoEngine(globalPhotoParams, scoreUI, instruments);
        }
        
        currentPack = instruments;

    // ============================================================
    // 3) SICUREZZA
    // ============================================================
    if (!currentEngine) {
        console.error("❌ Engine non creato!");
        return;
    }

    // ============================================================
    // 4) UI
    // ============================================================
    previewImage.classList.add("zoomed-out");
    initPlayerUI();
    drawSpectrum();
    initFxPanel(currentEngine.mixerData);

    document.getElementById("genrePanel").classList.remove("show");
    setTimeout(() => document.getElementById("genrePanel").classList.add("hidden"), 400);
}

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
    const seekBar = document.getElementById("seekBar");

    function formatTime(sec) {
        if (isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    playBtn.onclick = async () => {
        const overlay = document.getElementById("loadingOverlay");
        if (overlay) overlay.style.display = "flex";
        await Tone.start();
        await Tone.loaded();
        if (overlay) overlay.style.display = "none";
        
        currentEngine.play();
        btnSpartito.classList.remove("hidden");
        btnSpartito.classList.add("show-flex");
    };

    pauseBtn.onclick = () => currentEngine?.pause();
    stopBtn.onclick = () => {
        if (currentEngine) currentEngine.stop();
        if (scoreUI) scoreUI.hide();
        btnSpartito.classList.add("hidden");
        btnSpartito.classList.remove("show-flex");
    };
    
    btnSpartito.onclick = () => {
        if (scoreUI) {
            scoreUI.show();
            if (closeScoreBtn) closeScoreBtn.style.display = "flex";
        }
    };

    const currentTimeEl = document.getElementById("currentTime");
    const totalTimeEl = document.getElementById("totalTime");
    
    if (currentEngine && currentEngine.totalDuration) {
        totalTimeEl.textContent = formatTime(currentEngine.totalDuration);
    }

    Tone.Transport.scheduleRepeat(() => {
        const now = Tone.Transport.seconds;
        const duration = currentEngine?.totalDuration || 1;
        seekBar.value = (now / duration) * 100;
        if (currentTimeEl) currentTimeEl.textContent = formatTime(now);
    }, 0.1);

    seekBar.addEventListener("input", () => {
        const seconds = (seekBar.value / 100) * currentEngine.totalDuration;
        currentEngine.seek(seconds);
    });
}

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
    if (animationId) cancelAnimationFrame(animationId);
    
    function draw() {
        animationId = requestAnimationFrame(draw);
        if (!canvas || !ctx) {
            if (canvas) ctx = canvas.getContext("2d");
            return;
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
            const hue = 320 + (220 - 320) * magnitude;
            ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
            
            const x = i * barWidth;
            const y = H - barHeight;
            ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
            
            if (barHeight > peaks[i]) peaks[i] = barHeight;
            else peaks[i] *= 0.97;
            
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(x, H - peaks[i] - 2, Math.max(1, barWidth - 1), 2);
        }
    }
    draw();
}

function initFxPanel(mixerData) {
    const fxPanel = document.getElementById("fxPanel");
    const btnFxPanel = document.getElementById("btnFxPanel");
    const closeFxPanel = document.getElementById("closeFxPanel");

    if (btnFxPanel) btnFxPanel.onclick = () => fxPanel.classList.add("show");
    if (closeFxPanel) closeFxPanel.onclick = () => fxPanel.classList.remove("show");

    const eqLow = document.getElementById("eqLow");
    const eqMid = document.getElementById("eqMid");
    const eqHigh = document.getElementById("eqHigh");

    if (eqLow) eqLow.addEventListener("input", e => { masterEQ.low.value = Tone.dbToGain(Number(e.target.value)); });
    if (eqMid) eqMid.addEventListener("input", e => { masterEQ.mid.value = Tone.dbToGain(Number(e.target.value)); });
    if (eqHigh) eqHigh.addEventListener("input", e => { masterEQ.high.value = Tone.dbToGain(Number(e.target.value)); });

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

        slider.addEventListener("input", e => { mixerData.instruments.setVolume(busName, Number(e.target.value)); });

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

async function resetAudio() {
    try {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        Tone.Transport.seconds = 0;
        if (Tone.context.state !== "running") await Tone.start();
    } catch (e) {
        console.warn("⚠️ Errore durante reset audio:", e);
    }
}

function resetAppState() {
    currentEngine?.stop();
    if (currentEngine?.score) currentEngine.score.hide(); 
    currentEngine = null;
    globalPhotoParams = null;
    closeMixelUI();
    if (miniVideo) {
        miniVideo.pause();
        miniVideo.currentTime = 0; 
    }
    releaseWakeLock();
    if (firstStart !== 1) {
        resetAudio();
        firstStart = 0;
    }
    const previewImage = document.getElementById("previewImage");
    if (previewImage) previewImage.classList.remove("zoomed-out", "moved-up");
    const closeScoreBtn = document.getElementById("closeScoreBtn");
    if (closeScoreBtn) closeScoreBtn.style.display = "none";
}

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

let wakeLock = null;
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.error(`❌ Errore Wake Lock: ${err.message}`);
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }
}

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
        if (mutation.target.id === 'spectrumPanel' && mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (!mutation.target.classList.contains('hidden')) setTimeout(resizeCanvas, 100);
        }
    });
});

const spectrumPanelElement = document.getElementById("spectrumPanel");
if (spectrumPanelElement) observer.observe(spectrumPanelElement, { attributes: true });

window.addEventListener('beforeunload', () => {
    if (animationId) cancelAnimationFrame(animationId);
    releaseWakeLock();
});