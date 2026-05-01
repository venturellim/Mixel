import * as Tone from "https://esm.sh/tone";
import { masterEQ } from "./common.js";
import { analyzeImage } from "./imageAnalysis.js";
import { photoToMusicParams } from "./photoToMusicParams.js";
import { createPianoEngine, waitPianoInstruments } from "./genres/piano/pianoEngine.js";
import { createMetalEngine, waitMetalInstruments } from "./genres/metal/metalEngine.js";
import { createOrchestraEngine, waitOrchestraInstruments } from "./genres/orchestra/orchestraEngine.js";
import { createDanceEngine, waitDanceInstruments } from "./genres/dance/danceEngine.js";
import { scoreVisualizer } from "./scoreUI.js";

let currentEngine = null;
let currentGenre = null;
let firstStart = 1;
let scoreUI = null;
const miniVideo = document.querySelector('.video-mini-wrapper video');

window.addEventListener("DOMContentLoaded", () => {
    initOrientation();
    initFileLoader();
    initGenrePanel();
    if (!scoreUI) scoreUI = new scoreVisualizer();
});

// GESTIONE ORIENTAMENTO DINAMICA
function initOrientation() {
    function checkOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isPortrait) {
            document.body.classList.add("portrait-mode");
            document.body.classList.remove("landscape-mode");
        } else {
            document.body.classList.add("landscape-mode");
            document.body.classList.remove("portrait-mode");
        }
    }
    window.addEventListener("resize", checkOrientation);
    checkOrientation();
}

function initFileLoader() {
    const fileInput = document.getElementById("fileInput");
    const previewImage = document.getElementById("previewImage");
    const heroLogoContainer = document.getElementById("heroLogoContainer");
    const btnElabora = document.getElementById("btnElabora");

    fileInput.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            previewImage.src = img.src;
            previewImage.classList.remove("hidden");
            heroLogoContainer.style.display = "none";
            btnElabora.classList.remove("hidden");
            miniVideo?.pause();
            resetAppState();
        };
    });
}

function initGenrePanel() {
    const btnElabora = document.getElementById("btnElabora");
    const genrePanel = document.getElementById("genrePanel");
    const closeGenrePanel = document.getElementById("closeGenrePanel");

    btnElabora.addEventListener("click", () => {
        closeMixelUI();
        miniVideo?.play();
        genrePanel.classList.add("show");
        genrePanel.classList.remove("hidden");
    });

    closeGenrePanel.addEventListener("click", () => {
        genrePanel.classList.remove("show");
    });

    document.querySelectorAll(".genre-btn").forEach(btn => {
        btn.addEventListener("click", () => selectGenre(btn.dataset.genre));
    });
}

async function selectGenre(genre) {
    currentGenre = genre;
    if (scoreUI) scoreUI.setTheme(genre);
    
    const analysis = await analyzeImage(document.getElementById("previewImage"));
    const params = photoToMusicParams(analysis);

    // Caricamento strumenti (Semplificato)
    if (genre === "dance") { if(firstStart) await waitDanceInstruments(); currentEngine = await createDanceEngine(params, scoreUI); }
    if (genre === "metal") { if(firstStart) await waitMetalInstruments(); currentEngine = await createMetalEngine(params, scoreUI); }
    if (genre === "orchestra") { if(firstStart) await waitOrchestraInstruments(); currentEngine = await createOrchestraEngine(params, scoreUI); }
    if (genre === "piano") { if(firstStart) await waitPianoInstruments(); currentEngine = await createPianoEngine(params, scoreUI); }

    initPlayerUI();
    drawSpectrum();
    initFxPanel(currentEngine.mixerData);
    document.getElementById("genrePanel").classList.remove("show");
}

function initPlayerUI() {
    openMixelUI();
    const playBtn = document.getElementById("btnPlay");
    const btnSpartito = document.getElementById("btnSpartito");

    playBtn.onclick = async () => {
        await Tone.start();
        currentEngine.play();
        btnSpartito.classList.remove("hidden");
    };

    document.getElementById("btnStop").onclick = () => {
        currentEngine?.stop();
        scoreUI?.hide();
        btnSpartito.classList.add("hidden");
    };

    btnSpartito.onclick = () => scoreUI?.show();
}

// ANIMAZIONI UI ADATTIVE
function openMixelUI() {
    const player = document.getElementById("playerPanel");
    const spectrum = document.getElementById("spectrumPanel");
    player.classList.add("open");
    setTimeout(() => spectrum.classList.add("active"), 250);
}

function closeMixelUI() {
    document.getElementById("playerPanel").classList.remove("open");
    document.getElementById("spectrumPanel").classList.remove("active");
}

// DRAW SPECTRUM (Preservato il tuo codice originale)
const fft = new Tone.Analyser("fft", 256);
Tone.Destination.connect(fft);
function drawSpectrum() {
    requestAnimationFrame(drawSpectrum);
    const canvas = document.getElementById("spectrumCanvas");
    const ctx = canvas.getContext("2d");
    if (canvas.width !== canvas.clientWidth) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    const values = fft.getValue();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width / values.length;
    for (let i = 0; i < values.length; i++) {
        const magnitude = (values[i] + 120) / 120;
        ctx.fillStyle = `hsl(${200 + magnitude * 100}, 100%, 50%)`;
        ctx.fillRect(i * barWidth, canvas.height, barWidth - 1, -magnitude * canvas.height);
    }
}

// FX PANEL
function initFxPanel(mixerData) {
    const fxPanel = document.getElementById("fxPanel");
    document.getElementById("btnFxPanel").onclick = () => fxPanel.classList.add("open");
    document.getElementById("closeFxPanel").onclick = () => fxPanel.classList.remove("open");
    // (Qui andrebbe la logica dei volumi dinamici come nel tuo main originale)
}

function resetAppState() {
    currentEngine?.stop();
    closeMixelUI();
}
