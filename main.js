//
// main.js - Versione UNIFICATA (Adaptive)
// Router centrale dell’app: Gestisce Portrait e Landscape senza ricaricare il DOM.
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

console.log("main.js ver. 007.0 (Unified) loaded");

let currentEngine = null;
let currentGenre = null;
let firstStart = 1;
let scoreUI = null;
const miniVideo = document.querySelector('.video-mini-wrapper video'); 

// -------------------------------------------------------------
// Gestione Orientamento (Nuova Logica)
// -------------------------------------------------------------
function handleOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    // Applichiamo la classe al body per far reagire il CSS[span_1](start_span)[span_1](end_span)
    document.body.className = isPortrait ? "portrait" : "landscape";
    
    // Aggiorniamo il canvas se attivo per evitare distorsioni[span_2](start_span)[span_2](end_span)
    const canvas = document.getElementById("spectrumCanvas");
    if (canvas && !canvas.classList.contains("hidden")) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
}

// -------------------------------------------------------------
// Inizializzazione UI
// -------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
    handleOrientation();
    window.addEventListener("resize", handleOrientation);
    
    initFileLoader();
    initGenrePanel();
    
    if (!scoreUI) {
        scoreUI = new scoreVisualizer();
    }
});

// -------------------------------------------------------------
// File Loader + Preview (Supporta entrambi gli input)
// -------------------------------------------------------------
function initFileLoader() {
    // Selezioniamo entrambi gli input (quello nell'header e quello nella sidebar)
    const inputs = [document.getElementById("fileInputPortrait"), document.getElementById("fileInputLandscape")];
    const previewImage = document.getElementById("previewImage");
    const heroLogoContainer = document.getElementById("heroLogoContainer");
    
    // Tasti elabora duplicati per i due layout
    const btnsElabora = [document.getElementById("btnElaboraPortrait"), document.getElementById("btnElaboraLandscape")];

    inputs.forEach(input => {
        if (!input) return;
        input.addEventListener("change", function () {
            const file = this.files[0];
            if (!file || !file.type.startsWith("image/")) return;

            const url = URL.createObjectURL(file);
            previewImage.src = url;
            
            previewImage.onload = () => {
                previewImage.classList.remove("hidden");
                heroLogoContainer.style.display = "none";
                
                // Attiviamo entrambi i bottoni
                btnsElabora.forEach(btn => btn?.classList.remove("hidden"));
                
                if (miniVideo) {
                    miniVideo.pause();
                    miniVideo.currentTime = 0; 
                }
                resetAppState();
            };
        });
    });
}

// -------------------------------------------------------------
// Pannello generi (Trigger da entrambi i layout)
// -------------------------------------------------------------
function initGenrePanel() {
    const btnsElabora = [document.getElementById("btnElaboraPortrait"), document.getElementById("btnElaboraLandscape")];
    const genrePanel = document.getElementById("genrePanel");
    const closeGenrePanel = document.getElementById("closeGenrePanel");

    btnsElabora.forEach(btn => {
        btn?.addEventListener("click", () => {
            closeMixelUI();
            miniVideo?.play().catch(e => console.log("Autoplay video bloccato:", e));
            requestWakeLock();
            if (firstStart !== 1) {
                resetAudio();
            }
            genrePanel.classList.add("show");
            genrePanel.classList.remove("hidden");
        });
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
// Selezione genere & Audio Logic
// -------------------------------------------------------------
async function selectGenre(genre) {
    currentGenre = genre;
    if (scoreUI) scoreUI.setTheme(genre);

    const previewImage = document.getElementById("previewImage");
    const analysis = await analyzeImage(previewImage);
    const params = photoToMusicParams(analysis);

    // Gestione strumenti e caricamento engine[span_3](start_span)[span_3](end_span)[span_4](start_span)[span_4](end_span)
    if (genre === "dance") {
        if (firstStart === 1) {
            await waitDanceInstruments();
        }
        currentEngine = await createDanceEngine(params, scoreUI);
    } else if (genre === "metal") {
        if (firstStart === 1) await waitMetalInstruments();
        currentEngine = await createMetalEngine(params, scoreUI);
    } else if (genre === "orchestra") {
        if (firstStart === 1) await waitOrchestraInstruments();
        currentEngine = await createOrchestraEngine(params, scoreUI);
    } else if (genre === "piano") {
        if (firstStart === 1) await waitPianoInstruments();
        currentEngine = await createPianoEngine(params, scoreUI);
    }

    if (!currentEngine) return;

    firstStart = 0; // Segnamo che il primo avvio (caricamento campioni) è fatto
    initPlayerUI();
    drawSpectrum();
    initFxPanel(currentEngine.mixerData);

    document.getElementById("genrePanel").classList.remove("show");
}

// -------------------------------------------------------------
// Player UI & Spartito
// -------------------------------------------------------------
function initPlayerUI() {
    openMixelUI();

    const playBtn = document.getElementById("btnPlay");
    const pauseBtn = document.getElementById("btnPause");
    const stopBtn = document.getElementById("btnStop");
    const seekBar = document.getElementById("seekBar");
    
    // Gestiamo i tasti spartito che potrebbero essere diversi nei layout
    const btnsSpartito = [document.getElementById("btnSpartitoPortrait"), document.getElementById("btnSpartitoLandscape")];

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
        btnsSpartito.forEach(btn => btn?.classList.remove("hidden"));
    };

    stopBtn.onclick = () => {
        currentEngine?.stop();
        if (scoreUI) scoreUI.hide();
        btnsSpartito.forEach(btn => btn?.classList.add("hidden"));
    };

    btnsSpartito.forEach(btn => {
        if (btn) btn.onclick = () => scoreUI?.show();
    });

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
// Spectrum Analyzer (Adaptive)
// -------------------------------------------------------------
const fft = new Tone.Analyser("fft", 256);
Tone.Destination.connect(fft);
const canvas = document.getElementById("spectrumCanvas");
const ctx = canvas.getContext("2d");
let peaks = new Array(256).fill(0);

function drawSpectrum() {
    requestAnimationFrame(drawSpectrum);
    
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    const W = canvas.width;
    const H = canvas.height;
    if (W === 0) return;

    const values = fft.getValue();
    ctx.clearRect(0, 0, W, H);

    const barWidth = W / values.length;
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        const magnitude = (v + 120) / 120; 
        const barHeight = Math.max(0, magnitude * H);
        
        const hue = 320 + (220 - 320) * magnitude;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        const x = i * barWidth;
        ctx.fillRect(x, H - barHeight, Math.max(1, barWidth - 1), barHeight);

        if (barHeight > peaks[i]) peaks[i] = barHeight;
        else peaks[i] *= 0.97; 

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x, H - peaks[i] - 2, Math.max(1, barWidth - 1), 2);
    }
}

// -------------------------------------------------------------
// FX, Reset e Utility
// -------------------------------------------------------------
function openMixelUI() {
    const player = document.getElementById("playerPanel");
    const preview = document.getElementById("previewImage");
    const spectrum = document.getElementById("spectrumPanel");

    // Classi CSS che gestiscono lo spostamento in base al layout attivo[span_5](start_span)[span_5](end_span)
    preview.classList.add("shift-ui"); 
    player.classList.add("open");
    setTimeout(() => spectrum.classList.add("active"), 250);
}

function closeMixelUI() {
    document.getElementById("spectrumPanel").classList.remove("active");
    document.getElementById("previewImage").classList.remove("shift-ui");
    document.getElementById("playerPanel").classList.remove("open");
}

async function resetAudio() {
    const ctx = Tone.getContext();
    if (ctx.state === "suspended") return;
    try {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        if (ctx.state !== "closed") await ctx.close();
    } catch (e) { console.warn(e); }
    await Tone.start();
}

function resetAppState() {
    currentEngine?.stop();
    if (scoreUI) scoreUI.hide();
    currentEngine = null;
    closeMixelUI();
    releaseWakeLock();
}

// -------------------------------------------------------------
// Wake Lock per schermo sempre acceso
// -------------------------------------------------------------
let wakeLock = null;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log("✅ Schermo bloccato: non si spegnerà.");
            
            wakeLock.addEventListener('release', () => {
                console.log("Wake Lock rilasciato.");
            });
        }
    } catch (err) {
        console.error(`❌ Errore Wake Lock: ${err.name}, ${err.message}`);
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
        console.log("💤 Schermo libero: ora può spegnersi.");
    }
}

// -------------------------------------------------------------
// Event listener per resize (canvas responsive)
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

// Observer per ridimensionare canvas quando diventa visibile
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

// -------------------------------------------------------------
// Pulisci animation frame alla chiusura
// -------------------------------------------------------------
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    releaseWakeLock();
});