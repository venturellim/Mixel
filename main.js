import * as Tone from "https://esm.sh/tone";

console.log("MAIN.js PARTITO");

import { waitDownloadInstrumentsWithProgress } from "./common.js";

window.addEventListener("load", async () => {
    await waitDownloadInstrumentsWithProgress();
    console.log("🎸 Tutti gli strumenti sono pronti!");
});


import { createMetalEngineFromImage, waitInstrumentsWithProgress } from "./metal.js";

let currentEngine = null;
let currentGenre = null;
let isPlayerOpen = false; // Nuovo: stato del player

window.onerror = function (msg, url, line, col, error) {
    console.log("🔥 ERRORE:", msg, " @", url, ":", line, ":", col);
    console.log("STACK:", error?.stack);
};


window.addEventListener("DOMContentLoaded", () => {
    initOrientation();
    initFileLoader();
    initGenrePanel();
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
    const btnConsigliato = document.getElementById("btnConsigliato");

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
        btnConsigliato.classList.remove("hidden");

        resetAppState();
    });
}

// 🎛 Pannello Generi
function initGenrePanel() {
    const btnElabora = document.getElementById("btnElabora");
    const genrePanel = document.getElementById("genrePanel");
    const closeGenrePanel = document.getElementById("closeGenrePanel");
    const btnConsigliato = document.getElementById("btnConsigliato");

    btnElabora.addEventListener("click", () => {
        closePlayerWithAnimation(); // Chiudi tutto prima di aprire il pannello
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

    // NUOVO: Gestione click sul bottone Metal-like
    btnConsigliato.addEventListener("click", () => {
        if (isPlayerOpen) {
            closePlayerWithAnimation();
        } else {
            openPlayerWithAnimation();
            if (currentGenre === "metal" && currentEngine) {
                currentEngine.play();
            }
        }
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
        drawSpectrum();
        initFxPanel();
        
        // Apri automaticamente con animazione
        openPlayerWithAnimation();
    }

    document.getElementById("genrePanel").classList.remove("show");
}

// 🎧 Player UI
function initPlayerUI() {
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
        await waitInstrumentsWithProgress();

        overlay.style.display = "none";
        currentEngine.play();
    };

    pauseBtn.onclick = () => currentEngine?.pause();
    stopBtn.onclick = () => currentEngine?.stop();

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

// 🔊 Spectrum Analyzer
const fft = new Tone.Analyser("fft", 256);
Tone.Destination.connect(fft);

// Canvas per lo spettro NEL PLAYER (quello che si nasconde)
const playerCanvas = document.getElementById("playerSpectrumCanvas");
const playerCtx = playerCanvas?.getContext("2d");

// Canvas per lo spettro NEL CONTAINER SEPARATO
const spectrumCanvas = document.getElementById("spectrumCanvas");
const spectrumCtx = spectrumCanvas?.getContext("2d");

const W = 600;
const H = 120;
let peaks = new Array(256).fill(0);

function drawSpectrum() {
    requestAnimationFrame(drawSpectrum);
    const values = fft.getValue();
    
    // Disegna su ENTRAMBI i canvas se esistono
    if (playerCtx && playerCanvas) {
        drawOnCanvas(playerCtx, playerCanvas.width, playerCanvas.height, values);
    }
    
    if (spectrumCtx && spectrumCanvas) {
        drawOnCanvas(spectrumCtx, spectrumCanvas.width, spectrumCanvas.height, values);
    }
}

function drawOnCanvas(ctx, width, height, values) {
    ctx.clearRect(0, 0, width, height);
    const barWidth = width / values.length;

    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        const magnitude = (v + 140) / 140;
        const barHeight = magnitude * height;

        const startHue = 320;
        const endHue = 220;
        const hue = startHue + (endHue - startHue) * magnitude;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;

        const x = i * barWidth;
        const y = height - barHeight;
        ctx.fillRect(x, y, barWidth - 1, barHeight);

        if (barHeight > peaks[i]) peaks[i] = barHeight;
        else peaks[i] *= 0.98;

        ctx.fillStyle = "#FFFFFF";
        const peakY = height - peaks[i];
        ctx.fillRect(x, peakY, barWidth - 1, 3);
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
    closePlayerWithAnimation();
}

// ======================================================
// 🆕 NUOVE FUNZIONI DI ANIMAZIONE
// ======================================================

function openPlayerWithAnimation() {
    const content = document.querySelector('.content');
    const playerSlideup = document.getElementById('playerPanel');
    const heroLogo = document.getElementById('heroLogoContainer');
    const spectrumContainer = document.getElementById('spectrumContainer');
    const playerUI = document.querySelector('.player-ui');
    
    if (!content || !playerSlideup) return;
    
    // Cambia layout a griglia
    content.classList.add('grid-layout');
    
    // Rimpicciolisci logo
    heroLogo?.classList.add('shrink');
    
    // Mostra e resetta animazione spettro
    if (spectrumContainer) {
        spectrumContainer.classList.remove('hidden', 'closing');
    }
    
    // Rimuovi spettro dal player
    playerUI?.classList.add('no-spectrum');
    
    // Apri player
    setTimeout(() => {
        playerSlideup.classList.add('open');
    }, 100);
    
    isPlayerOpen = true;
}

function closePlayerWithAnimation() {
    const content = document.querySelector('.content');
    const playerSlideup = document.getElementById('playerPanel');
    const heroLogo = document.getElementById('heroLogoContainer');
    const spectrumContainer = document.getElementById('spectrumContainer');
    const playerUI = document.querySelector('.player-ui');
    
    if (!content || !playerSlideup) return;
    
    // Ferma la riproduzione
    currentEngine?.stop();
    
    // Anima uscita spettro
    if (spectrumContainer) {
        spectrumContainer.classList.add('closing');
    }
    
    // Dopo l'animazione, rimuovi layout grid
    setTimeout(() => {
        content.classList.remove('grid-layout');
        heroLogo?.classList.remove('shrink');
        
        // Nascondi spettro
        if (spectrumContainer) {
            spectrumContainer.classList.add('hidden');
            spectrumContainer.classList.remove('closing');
        }
        
        // Ripristina spettro nel player
        playerUI?.classList.remove('no-spectrum');
        
        // Chiudi player
        playerSlideup.classList.remove('open');
    }, 350); // Poco meno della durata dell'animazione (400ms)
    
    isPlayerOpen = false;
}

// Funzioni vecchie mantenute per compatibilità ma aggiornate
function openPlayerPanel() {
    openPlayerWithAnimation();
}

function closePlayerPanel() {
    closePlayerWithAnimation();
}