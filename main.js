import * as Tone from "https://esm.sh/tone";

import { createMetalEngineFromImage,
  waitInstrumentsWithProgress
 } from "./metal.js";

// ===============================
// STATO GLOBALE APP
// ===============================
let currentEngine = null;
let currentDNA = null;
let currentGenre = null;

console.log("MAIN MODULE ATTIVO");

console.log("MAIN CARICATO");

// ===============================
// DOM READY
// ===============================
window.addEventListener("DOMContentLoaded", () => {

    initOrientation();
    initFileLoader();
    initGenrePanel();
    // initPlayerUI();
    // initFxPanel();
    
    console.log("DOM READY");

});

// 📱 Orientamento

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

// 🖼 File Loader

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

        const url = URL.createObjectURL(file);

        previewImage.src = url;
        previewImage.classList.remove("hidden");
        heroLogoContainer.style.display = "none";

        btnElabora.classList.remove("hidden");

        resetAppState();
    });
}

// 🎛 Pannello Generi

function initGenrePanel() {

console.log("INIT GENRE PANEL");
    const btnElabora = document.getElementById("btnElabora");
    const genrePanel = document.getElementById("genrePanel");
    const closeGenrePanel = document.getElementById("closeGenrePanel");

    btnElabora.addEventListener("click", function () {
    
    closePlayerPanel();
    
genrePanel.classList.add("show");
        genrePanel.classList.remove("hidden");
    });

    closeGenrePanel.addEventListener("click", function () {
        genrePanel.classList.remove("show");
        setTimeout(() => genrePanel.classList.add("hidden"), 400);
    });

    // 🔥 COLLEGAMENTO BOTTONI GENERE
    const genreButtons = document.querySelectorAll(".genre-btn");

    genreButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const genre = btn.dataset.genre;
            console.log("🎵 Selezionato:", genre);
            selectGenre(genre);
            
        });
    });
}

// 🎶 Selezione Genere


async function selectGenre(genre) {

    currentGenre = genre;
    const previewImage = document.getElementById("previewImage");

    if (genre === "metal") {
        currentEngine = await createMetalEngineFromImage(previewImage);
        if (!currentEngine) {
    console.error("Engine non creato!");
    return;
}
initPlayerUI();
drawSpectrum()
initFxPanel();
    }

    
    document.getElementById("genrePanel").classList.remove("show");
    //document.getElementById("Player").classList.remove("hidden");
}

function openPlayerPanel() {
    const panel = document.getElementById("playerPanel");
    if (!panel) {
        console.error("❌ ERRORE: elemento #mixelPlayer non trovato!");
        return;
    }
    panel.classList.add("open");
}

function closePlayerPanel() {
    const panel = document.getElementById("playerPanel");
    if (!panel) return;
    panel.classList.remove("open");
}

// 🎧 Player UI

function initPlayerUI() {

console.log("MIXEL PLAYER INIZZIALIZZATO");

//const playerPanel = document.getElementById("playerPanel");

    openPlayerPanel();

    //mixelPlayer.classList.remove("hidden");
    
    const playBtn = document.getElementById("btnPlay");
    const pauseBtn = document.getElementById("btnPause");
    const stopBtn = document.getElementById("btnStop");
    const seekBar = document.getElementById("seekBar");
    
    if (!playBtn || !pauseBtn || !stopBtn || !seekBar) {
        console.error("❌ ERRORE: uno dei pulsanti del player non esiste!");
        return;
    }
    
    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
        }

playBtn.onclick = async () => {

    // Mostra overlay di caricamento
    const overlay = document.getElementById("loadingOverlay");
    overlay.style.display = "flex";

    // Sblocco AudioContext
    await Tone.start();

    // Attendo caricamento Tone.js
    await Tone.loaded();

    // Attendo caricamento strumenti
    await waitInstrumentsWithProgress();

    // Nascondo overlay
    overlay.style.display = "none";

    // Avvio brano
    currentEngine.play();
};


    pauseBtn.onclick = () => currentEngine?.pause();
    stopBtn.onclick = () => currentEngine?.stop();
    
    console.log("🔎 currentEngine:", currentEngine);
    console.log("🔎 typeof currentEngine:", typeof currentEngine);
    console.log("🔎 metodi engine:", Object.keys(currentEngine));
    
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");

totalTimeEl.textContent = formatTime(currentEngine.totalDuration);

// aggiorna continuamente la UI
Tone.Transport.scheduleRepeat(() => {

    const now = Tone.Transport.seconds;
    const duration = currentEngine.totalDuration;

    const percent = (now / duration) * 100;
    seekBar.value = percent;

    currentTimeEl.textContent = formatTime(now);

}, 0.1);

seekBar.addEventListener("input", () => {
    if (!currentEngine) return;

    const seconds = (seekBar.value / 100) * currentEngine.totalDuration;
    currentEngine.seek(seconds);
});

}

// Analizzatore FFT
const fft = new Tone.Analyser("fft", 256); // 256 bande = molto dettagliato
Tone.Destination.connect(fft);

const canvas = document.getElementById("spectrumCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// Array per memorizzare i picchi
let peaks = new Array(256).fill(0);

// Analizzatore di spettro

function drawSpectrum() {
    requestAnimationFrame(drawSpectrum);

    const values = fft.getValue(); // valori in dB
    ctx.clearRect(0, 0, W, H);

    const barWidth = W / values.length;

    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        const magnitude = (v + 140) / 140; 
        const barHeight = magnitude * H;

        // --- BARRA PRINCIPALE ---
        /* const hue = Math.floor(120 * magnitude); 
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`; */
        
        const startHue = 320; // blu elettrico
const endHue = 220;   // fucsia

const hue = startHue + (endHue - startHue) * magnitude;
ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;

        const x = i * barWidth;
        const y = H - barHeight;

        ctx.fillRect(x, y, barWidth - 1, barHeight);

        // --- PEAK HOLD ---
        // Aggiorna il picco se la barra è più alta
        if (barHeight > peaks[i]) {
            peaks[i] = barHeight;
        } else {
            // Decadimento lento
            peaks[i] *= 0.98;
        }

        // Disegna il picco (linea oro)
        ctx.fillStyle = "#FFFFFF"; // BIANCO
        const peakY = H - peaks[i];
        ctx.fillRect(x, peakY, barWidth - 1, 3); // tacchetta
    }
}

// 🎚 FX Panel

function initFxPanel() {

    const fxPanel = document.getElementById("fxPanel");
    const btnFxPanel = document.getElementById("btnFxPanel");
    const closeFxPanel = document.getElementById("closeFxPanel");

    btnFxPanel.onclick = () => fxPanel.classList.add("open");
    closeFxPanel.onclick = () => fxPanel.classList.remove("open");
}

// 🔄 Reset App

function resetAppState() {

    currentEngine?.stop();
    currentEngine = null;
    currentDNA = null;
closePlayerPanel();

    document.getElementById("Player")?.classList.add("hidden");
}