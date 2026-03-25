//
// main.js
// Router centrale dell’app: UI, caricamento immagine, analisi, parametri,
// selezione genere, player, spectrum, FX panel.
// Nessuna logica musicale. Nessuna logica di genere.
// Tutto il resto vive nei moduli dei generi.
//

import * as Tone from "https://esm.sh/tone";

console.log("main.js ver. 002.5 loaded");

// -------------------------------------------------------------
// Import fondamentali
// -------------------------------------------------------------
import { analyzeImage } from "./imageAnalysis.js";
import { photoToMusicParams } from "./photoToMusicParams.js";

// Import dei generi (solo entry point, non logica interna)
import { createMetalEngine, waitMetalInstruments } from "./genres/metal/metalEngine.js";

let currentEngine = null;
let currentGenre = null;

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
    initOrientation();
    initFileLoader();
    initGenrePanel();
});

// -------------------------------------------------------------
// Orientamento
// -------------------------------------------------------------
function initOrientation() {
    const rotateOverlay = document.getElementById("rotateOverlay");

    function checkOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        rotateOverlay.classList.toggle("hidden", !isPortrait);
    }

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
}

// -------------------------------------------------------------
// File Loader + Preview
// -------------------------------------------------------------
function initFileLoader() {
    const fileInput = document.getElementById("fileInput");
    const previewImage = document.getElementById("previewImage");
    const heroLogoContainer = document.getElementById("heroLogoContainer");
    const btnElabora = document.getElementById("btnElabora");

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
            const containerHeight = window.innerHeight;

            if (img.width > img.height) {
                previewImage.style.height = (containerHeight * 0.45) + "px";
                previewImage.style.width = "auto";
            } else {
                previewImage.style.height = (containerHeight * 0.70) + "px";
                previewImage.style.width = "auto";
            }

            previewImage.src = img.src;
            previewImage.classList.remove("hidden");
            heroLogoContainer.style.display = "none";
            btnElabora.classList.remove("hidden");

            resetAppState();
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
        keepScreenAwake();
        closeMixelUI();
        resetAudio();
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

// -------------------------------------------------------------
// Selezione genere
// -------------------------------------------------------------
async function selectGenre(genre) {
    currentGenre = genre;
    const previewImage = document.getElementById("previewImage");

    // 1) Analisi immagine
        const analysis = await analyzeImage(previewImage);

    // 2) Parametri musicali astratti
    const params = photoToMusicParams(analysis);

    // 3) Creazione engine del genere
    if (genre === "metal") {
        currentEngine = await createMetalEngine(params);
await waitMetalInstruments();   // <-- strumenti pronti
    }

    if (!currentEngine) {
        console.error("❌ Engine non creato!");
        return;
    }

    // 4) UI del genere
    initPlayerUI();
    drawSpectrum();
    initFxPanel();

    document.getElementById("genrePanel").classList.remove("show");
}

// -------------------------------------------------------------
// Player UI
// -------------------------------------------------------------
function initPlayerUI() {
    openMixelUI();

    const playBtn = document.getElementById("btnPlay");
    const pauseBtn = document.getElementById("btnPause");
    const stopBtn = document.getElementById("btnStop");
    const seekBar = document.getElementById("seekBar");

    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    playBtn.onclick = async () => {
        const overlay = document.getElementById("loadingOverlay");
        overlay.style.display = "flex";

        await Tone.start();
        await Tone.loaded();

        overlay.style.display = "none";
        
        currentEngine.play();
    };

    pauseBtn.onclick = () => currentEngine?.pause();
    stopBtn.onclick = () => {
    currentEngine?.stop();
};


    const currentTimeEl = document.getElementById("currentTime");
    const totalTimeEl = document.getElementById("totalTime");
    totalTimeEl.textContent = formatTime(currentEngine.totalDuration);

    Tone.Transport.scheduleRepeat(() => {
        const now = Tone.Transport.seconds;
        const duration = currentEngine.totalDuration;
        seekBar.value = (now / duration) * 100;
        currentTimeEl.textContent = formatTime(now);
    }, 0.1);

    seekBar.addEventListener("input", () => {
        const seconds = (seekBar.value / 100) * currentEngine.totalDuration;
        currentEngine.seek(seconds);
    });
}

// -------------------------------------------------------------
// Spectrum Analyzer
// -------------------------------------------------------------
const fft = new Tone.Analyser("fft", 256);
Tone.Destination.connect(fft);

const canvas = document.getElementById("spectrumCanvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
let peaks = new Array(256).fill(0);

function drawSpectrum() {
    requestAnimationFrame(drawSpectrum);
    const values = fft.getValue();
    ctx.clearRect(0, 0, W, H);

    const barWidth = W / values.length;

    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        const magnitude = (v + 140) / 140;
        const barHeight = magnitude * H;

        const startHue = 320;
        const endHue = 220;
        const hue = startHue + (endHue - startHue) * magnitude;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;

        const x = i * barWidth;
        const y = H - barHeight;
        ctx.fillRect(x, y, barWidth - 1, barHeight);

        if (barHeight > peaks[i]) peaks[i] = barHeight;
        else peaks[i] *= 0.98;

        ctx.fillStyle = "#FFFFFF";
        const peakY = H - peaks[i];
        ctx.fillRect(x, peakY, barWidth - 1, 3);
    }
}

// -------------------------------------------------------------
// FX Panel
// -------------------------------------------------------------
function initFxPanel() {
    const fxPanel = document.getElementById("fxPanel");
    const btnFxPanel = document.getElementById("btnFxPanel");
    const closeFxPanel = document.getElementById("closeFxPanel");

    btnFxPanel.onclick = () => fxPanel.classList.add("open");
    closeFxPanel.onclick = () => fxPanel.classList.remove("open");
}

// reset audio

async function resetAudio() {
    const ctx = Tone.getContext();

    // Se il contesto non è mai stato avviato, NON chiudere nulla
    if (ctx.state === "suspended") {
        console.log("AudioContext non avviato: skip reset");
        return;
    }

    try {
        Tone.Transport.stop();
        Tone.Transport.cancel();

        if (ctx.state !== "closed") {
            await ctx.close();
            console.log("AudioContext chiuso correttamente");
        }
    } catch (e) {
        console.warn("Errore durante la chiusura AudioContext:", e);
    }

    // Riattiva per iOS
    await Tone.start();
    console.log("AudioContext riavviato");
}



// -------------------------------------------------------------
// Reset App
// -------------------------------------------------------------
function resetAppState() {
    currentEngine?.stop();
    currentEngine = null;
    closeMixelUI();
    resetAudio();
    releaseScreenAwake();
}

// -------------------------------------------------------------
// UI animazioni generiche (non legate al metal)
// -------------------------------------------------------------
function openMixelUI() {
    const player = document.getElementById("playerPanel");
    const preview = document.getElementById("previewImage");
    const spectrum = document.getElementById("spectrumPanel");

    preview.classList.add("shift-left");
    player.classList.add("open");

    setTimeout(() => {
        spectrum.classList.add("active");
    }, 250);
}

function closeMixelUI() {
    document.getElementById("spectrumPanel").classList.remove("active");
    document.getElementById("previewImage").classList.remove("shift-left");
    document.getElementById("playerPanel").classList.remove("open");
}

// -------------------------------------------------------------
// Wake Lock via video invisibile (funziona su iOS e Android)
// -------------------------------------------------------------
function keepScreenAwake() {
    const v = document.getElementById("wakelock-video");
    console.log("Wake Lock via video invisibile avviato");
    if (!v) return;
    v.play().catch(err => console.warn("WakeLock video play error:", err));
}

function releaseScreenAwake() {
    const v = document.getElementById("wakelock-video");
    if (!v) return;
    v.pause();
}
