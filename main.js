import * as Tone from "https://esm.sh/tone";
import { masterEQ } from "./common.js";
import { analyzeImage } from "./imageAnalysis.js";
import { photoToMusicParams } from "./photoToMusicParams.js";
import { createPianoEngine, waitPianoInstruments } from "./genres/piano/pianoEngine.js";
import { createMetalEngine, waitMetalInstruments } from "./genres/metal/metalEngine.js";
import { createOrchestraEngine, waitOrchestraInstruments } from "./genres/orchestra/orchestraEngine.js";
import { createDanceEngine, waitDanceInstruments } from "./genres/dance/danceEngine.js";
import { scoreVisualizer } from "./scoreUI.js";

console.log("main.js ver. 007.0 (Router + Full Logic) loaded");

// -------------------------------------------------------------
// STATO GLOBALE (Dal tuo main_2.js)
// -------------------------------------------------------------
let currentEngine = null;
let currentGenre = null;
let firstStart = 1;
let scoreUI = null;
let wakeLock = null;
const fft = new Tone.Analyser("fft", 256);
Tone.Destination.connect(fft);
let peaks = new Array(256).fill(0);

// -------------------------------------------------------------
// TEMPLATES HTML PER IL ROUTER
// -------------------------------------------------------------
const portraitHTML = `
<div class="portrait-container">
    <div class="img-section">
        <div class="video-mini-wrapper"><video autoplay muted loop playsinline><source src="onair.mp4" type="video/mp4"></video></div>
        <div id="heroLogoContainer"><img src="Mixel.jpg" class="hero-logo-box"></div>
        <img id="previewImage" class="hidden">
    </div>
    <div id="spectrumPanel"><canvas id="spectrumCanvas"></canvas></div>
    <div class="upload-zone">
        <input type="file" id="fileInput" hidden>
        <button onclick="document.getElementById('fileInput').click()" class="side-btn">📁 Carica Foto</button>
        <button id="btnElabora" class="side-btn hidden">✨ Elabora Mixel</button>
    </div>
    <div id="playerPanel">
        <div class="player-controls">
            <button id="btnPlay">▶️</button><button id="btnPause">⏸️</button>
            <button id="btnStop">⏹️</button><button id="btnFxPanel">🎛️</button>
            <button id="btnSpartito" class="hidden">🎼</button>
        </div>
        <input type="range" id="seekBar" value="0" style="width:100%">
        <div style="text-align:center; font-size:12px; margin-top:5px">
            <span id="currentTime">0:00</span> / <span id="totalTime">0:00</span>
        </div>
    </div>
</div>
<div id="genrePanel" class="side-panel hidden">
    <div style="display:flex; justify-content:space-between"><h2>Scegli Stile</h2><button id="closeGenrePanel" style="background:none; color:white; border:none; font-size:24px">✖</button></div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:20px">
        <button class="genre-btn side-btn" data-genre="dance">Dance</button>
        <button class="genre-btn side-btn" data-genre="metal">Metal</button>
        <button class="genre-btn side-btn" data-genre="orchestra">Orchestra</button>
        <button class="genre-btn side-btn" data-genre="piano">Piano</button>
    </div>
</div>
<div id="fxPanel" class="side-panel hidden">
    <div style="display:flex; justify-content:space-between"><h2>Audio FX</h2><button id="closeFxPanel" style="background:none; color:white; border:none; font-size:24px">✖</button></div>
    <div id="fxContent" style="margin-top:20px">
        <label>Bassi</label><input type="range" id="eqLow" min="-12" max="12" value="0" style="width:100%; margin-bottom:15px">
        <label>Medi</label><input type="range" id="eqMid" min="-12" max="12" value="0" style="width:100%; margin-bottom:15px">
        <label>Alti</label><input type="range" id="eqHigh" min="-12" max="12" value="0" style="width:100%; margin-bottom:15px">
        <div id="volumeControlsContainer"></div>
    </div>
</div>
<div id="loadingOverlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; flex-direction:column; justify-content:center; align-items:center">
    <div id="loadingText" style="color:#0f0; font-family:monospace">Preparazione strumenti...</div>
</div>`;

const landscapeHTML = `
<div class="app-container">
    <aside class="sidebar">
        <div id="sidebarLogo"><img src="Mixel.jpg" style="width:100%"></div>
        <input type="file" id="fileInput">
        <button id="btnElabora" class="side-btn hidden">✨ Elabora Mixel</button>
        <button id="btnSpartito" class="side-btn hidden">🎼 Spartito</button>
    </aside>
    <main class="content">
        <div class="video-mini-wrapper"><video autoplay muted loop playsinline><source src="onair.mp4" type="video/mp4"></video></div>
        <div id="heroLogoContainer"><img src="Mixel.jpg" class="hero-logo-box"></div>
        <img id="previewImage" class="hidden">
        <div id="spectrumPanel"><canvas id="spectrumCanvas"></canvas></div>
        <div id="playerPanel">
            <div class="player-controls">
                <button id="btnPlay">▶️</button><button id="btnPause">⏸️</button><button id="btnStop">⏹️</button><button id="btnFxPanel">🎛️</button>
            </div>
            <input type="range" id="seekBar" value="0" style="width:100%">
            <div style="text-align:center"><span id="currentTime">0:00</span> / <span id="totalTime">0:00</span></div>
        </div>
    </main>
</div>
<div id="genrePanel" class="side-panel hidden"> <!-- Stesso contenuto di portrait --> </div>
<div id="fxPanel" class="side-panel hidden"> <!-- Stesso contenuto di portrait --> </div>`;

// -------------------------------------------------------------
// ERROR HANDLER GLOBALE (Dal tuo main_2.js)[span_2](start_span)[span_2](end_span)
// -------------------------------------------------------------
window.onerror = function (msg, url, line, col, error) {
    console.log("🔥 ERRORE:", msg, " @", url, ":", line, ":", col);[span_3](start_span)[span_3](end_span)
    console.log("STACK:", error?.stack);[span_4](start_span)[span_4](end_span)
};

// -------------------------------------------------------------
// INIZIALIZZAZIONE ROUTER
// -------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById('app-root');
    const theme = document.getElementById('theme-link');
    const isPortrait = window.innerHeight > window.innerWidth;[span_5](start_span)[span_5](end_span)

    if (isPortrait) {
        root.innerHTML = portraitHTML;
        theme.href = "style-portrait.css";
    } else {
        root.innerHTML = landscapeHTML;
        theme.href = "style.css";
    }

    initFileLoader();
    initGenrePanel();
    if (!scoreUI) scoreUI = new scoreVisualizer();[span_6](start_span)[span_6](end_span)
});

// -------------------------------------------------------------
// LOGICA FILE LOADER (Dal tuo main_2.js con calcoli dimensioni)[span_7](start_span)[span_7](end_span)
// -------------------------------------------------------------
function initFileLoader() {
    const fileInput = document.getElementById("fileInput");
    const previewImage = document.getElementById("previewImage");
    const heroLogoContainer = document.getElementById("heroLogoContainer");
    const btnElabora = document.getElementById("btnElabora");
    const miniVideo = document.querySelector('.video-mini-wrapper video');[span_8](start_span)[span_8](end_span)

    fileInput.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;[span_9](start_span)[span_9](end_span)
        if (!file.type.startsWith("image/")) {[span_10](start_span)[span_10](end_span)
            alert("Carica solo immagini.");
            return;
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const containerHeight = window.innerHeight;[span_11](start_span)[span_11](end_span)

            // Calcolo proporzioni originale dal tuo main_2.js
            if (img.width > img.height) {[span_12](start_span)[span_12](end_span)
                previewImage.style.height = (containerHeight * 0.45) + "px";
                previewImage.style.width = "auto";
            } else {
                previewImage.style.height = (containerHeight * 0.70) + "px";
                previewImage.style.width = "auto";
            }

            previewImage.src = img.src;
            previewImage.classList.remove("hidden");
            heroLogoContainer.style.display = "none";
            btnElabora.classList.remove("hidden");[span_13](start_span)[span_13](end_span)
            
            if (miniVideo) {[span_14](start_span)[span_14](end_span)
                miniVideo.pause();
                miniVideo.currentTime = 0; 
            }
            resetAppState();[span_15](start_span)[span_15](end_span)
        };
    });
}

// -------------------------------------------------------------
// PANNELLO GENERI E WAKE LOCK (Dal tuo main_2.js)[span_16](start_span)[span_16](end_span)
// -------------------------------------------------------------
function initGenrePanel() {
    const btnElabora = document.getElementById("btnElabora");
    const genrePanel = document.getElementById("genrePanel");
    const closeGenrePanel = document.getElementById("closeGenrePanel");
    const miniVideo = document.querySelector('.video-mini-wrapper video');[span_17](start_span)[span_17](end_span)

    btnElabora.addEventListener("click", () => {
        closeMixelUI();[span_18](start_span)[span_18](end_span)
        miniVideo?.play().catch(e => console.log("Autoplay video bloccato:", e));[span_19](start_span)[span_19](end_span)
        requestWakeLock();[span_20](start_span)[span_20](end_span)
        
        if (firstStart !== 1) {[span_21](start_span)[span_21](end_span)
            resetAudio();
        }
        genrePanel.classList.add("show");[span_22](start_span)[span_22](end_span)
        genrePanel.classList.remove("hidden");
    });

    closeGenrePanel.addEventListener("click", () => {
        genrePanel.classList.remove("show");
        setTimeout(() => genrePanel.classList.add("hidden"), 400);[span_23](start_span)[span_23](end_span)
    });

    document.querySelectorAll(".genre-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            selectGenre(btn.dataset.genre);[span_24](start_span)[span_24](end_span)
        });
    });
}

// -------------------------------------------------------------
// SELEZIONE GENERE E ENGINE (Dal tuo main_2.js)[span_25](start_span)[span_25](end_span)
// -------------------------------------------------------------
async function selectGenre(genre) {
    currentGenre = genre;
    if (scoreUI) scoreUI.setTheme(genre);[span_26](start_span)[span_26](end_span)

    const previewImage = document.getElementById("previewImage");
    const analysis = await analyzeImage(previewImage);[span_27](start_span)[span_27](end_span)
    const params = photoToMusicParams(analysis);[span_28](start_span)[span_28](end_span)

    const overlay = document.getElementById("loadingOverlay");
    overlay.style.display = "flex";[span_29](start_span)[span_29](end_span)

    // Logica di caricamento strumenti e creazione engine
    try {
        if (genre === "metal") {
            if (firstStart === 1) await waitMetalInstruments();[span_30](start_span)[span_30](end_span)
            currentEngine = await createMetalEngine(params, scoreUI);[span_31](start_span)[span_31](end_span)
        } else if (genre === "orchestra") {
            if (firstStart === 1) await waitOrchestraInstruments();[span_32](start_span)[span_32](end_span)
            currentEngine = await createOrchestraEngine(params, scoreUI);[span_33](start_span)[span_33](end_span)
        } else if (genre === "piano") {
            if (firstStart === 1) await waitPianoInstruments();[span_34](start_span)[span_34](end_span)
            currentEngine = await createPianoEngine(params, scoreUI);[span_35](start_span)[span_35](end_span)
        } else if (genre === "dance") {
            if (firstStart === 1) await waitDanceInstruments();
            currentEngine = await createDanceEngine(params, scoreUI);
        }

        if (!currentEngine) throw new Error("Engine non creato");[span_36](start_span)[span_36](end_span)

        firstStart = 0; // Segniamo che il primo caricamento è avvenuto[span_37](start_span)[span_37](end_span)
        overlay.style.display = "none";
        
        initPlayerUI();[span_38](start_span)[span_38](end_span)
        drawSpectrum();[span_39](start_span)[span_39](end_span)
        initFxPanel(currentEngine.mixerData);[span_40](start_span)[span_40](end_span)
        document.getElementById("genrePanel").classList.remove("show");[span_41](start_span)[span_41](end_span)
    } catch (e) {
        console.error("ERRORE CARICAMENTO:", e);
        overlay.style.display = "none";
    }
}

// -------------------------------------------------------------
// PLAYER UI E LOGICA TEMPO (Dal tuo main_2.js)[span_42](start_span)[span_42](end_span)
// -------------------------------------------------------------
function initPlayerUI() {
    openMixelUI();[span_43](start_span)[span_43](end_span)

    const playBtn = document.getElementById("btnPlay");
    const pauseBtn = document.getElementById("btnPause");
    const stopBtn = document.getElementById("btnStop");
    const seekBar = document.getElementById("seekBar");
    const btnSpartito = document.getElementById("btnSpartito");
    const currentTimeEl = document.getElementById("currentTime");
    const totalTimeEl = document.getElementById("totalTime");

    function formatTime(sec) {[span_44](start_span)[span_44](end_span)
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    totalTimeEl.textContent = formatTime(currentEngine.totalDuration);[span_45](start_span)[span_45](end_span)

    playBtn.onclick = async () => {
        await Tone.start();[span_46](start_span)[span_46](end_span)
        await Tone.loaded();[span_47](start_span)[span_47](end_span)
        currentEngine.play();[span_48](start_span)[span_48](end_span)
        btnSpartito.classList.remove("hidden");
        btnSpartito.classList.add("show-flex");[span_49](start_span)[span_49](end_span)
    };

    pauseBtn.onclick = () => currentEngine?.pause();[span_50](start_span)[span_50](end_span)

    stopBtn.onclick = () => {
        currentEngine?.stop();[span_51](start_span)[span_51](end_span)
        if (scoreUI) scoreUI.hide();[span_52](start_span)[span_52](end_span)
        btnSpartito.classList.add("hidden");
        btnSpartito.classList.remove("show-flex");
    };

    btnSpartito.onclick = () => {[span_53](start_span)[span_53](end_span)
        if (scoreUI) scoreUI.show();
    };

    Tone.Transport.scheduleRepeat(() => {
        const now = Tone.Transport.seconds;[span_54](start_span)[span_54](end_span)
        const duration = currentEngine.totalDuration;
        seekBar.value = (now / duration) * 100;[span_55](start_span)[span_55](end_span)
        currentTimeEl.textContent = formatTime(now);[span_56](start_span)[span_56](end_span)
    }, 0.1);

    seekBar.addEventListener("input", () => {
        const seconds = (seekBar.value / 100) * currentEngine.totalDuration;[span_57](start_span)[span_57](end_span)
        currentEngine.seek(seconds);[span_58](start_span)[span_58](end_span)
    });
}

// -------------------------------------------------------------
// SPECTRUM ANALYZER (Dal tuo main_2.js)[span_59](start_span)[span_59](end_span)
// -------------------------------------------------------------
function drawSpectrum() {
    const canvas = document.getElementById("spectrumCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    requestAnimationFrame(drawSpectrum);[span_60](start_span)[span_60](end_span)
    
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {[span_61](start_span)[span_61](end_span)
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    const W = canvas.width;
    const H = canvas.height;
    const values = fft.getValue();[span_62](start_span)[span_62](end_span)
    ctx.clearRect(0, 0, W, H);[span_63](start_span)[span_63](end_span)

    if (W === 0) return;[span_64](start_span)[span_64](end_span)
    const barWidth = W / values.length;

    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        const magnitude = (v + 120) / 120;[span_65](start_span)[span_65](end_span)
        const barHeight = Math.max(0, magnitude * H);[span_66](start_span)[span_66](end_span)

        const hue = 320 + (220 - 320) * magnitude;[span_67](start_span)[span_67](end_span)
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.fillRect(i * barWidth, H - barHeight, Math.max(1, barWidth - 1), barHeight);[span_68](start_span)[span_68](end_span)

        if (barHeight > peaks[i]) {[span_69](start_span)[span_69](end_span)
            peaks[i] = barHeight;
        } else {
            peaks[i] *= 0.97; 
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(i * barWidth, H - peaks[i] - 2, Math.max(1, barWidth - 1), 2);[span_70](start_span)[span_70](end_span)
    }
}

// -------------------------------------------------------------
// FX PANEL E VOLUMI DINAMICI (Dal tuo main_2.js)[span_71](start_span)[span_71](end_span)
// -------------------------------------------------------------
function initFxPanel(mixerData) {
    const fxPanel = document.getElementById("fxPanel");
    const btnFxPanel = document.getElementById("btnFxPanel");
    const closeFxPanel = document.getElementById("closeFxPanel");
    const volumeContainer = document.getElementById("volumeControlsContainer");[span_72](start_span)[span_72](end_span)

    btnFxPanel.onclick = () => fxPanel.classList.add("open", "show");[span_73](start_span)[span_73](end_span)
    closeFxPanel.onclick = () => fxPanel.classList.remove("open", "show");

    // Master EQ (Bassi, Medi, Alti)
    document.getElementById("eqLow").oninput = e => {
        masterEQ.low.value = Tone.dbToGain(Number(e.target.value));[span_74](start_span)[span_74](end_span)
    };
    document.getElementById("eqMid").oninput = e => {
        masterEQ.mid.value = Tone.dbToGain(Number(e.target.value));[span_75](start_span)[span_75](end_span)
    };
    document.getElementById("eqHigh").oninput = e => {
        masterEQ.high.value = Tone.dbToGain(Number(e.target.value));[span_76](start_span)[span_76](end_span)
    };

    // Creazione dinamica controlli volume dal tuo mixerData[span_77](start_span)[span_77](end_span)
    volumeContainer.innerHTML = "<h3>Volumi Strumenti</h3>";
    Object.entries(mixerData.volumeMap).forEach(([busName, label]) => {[span_78](start_span)[span_78](end_span)
        const row = document.createElement("div");
        row.className = "fx-row";
        row.style.margin = "10px 0";

        const lbl = document.createElement("label");
        lbl.textContent = label;[span_79](start_span)[span_79](end_span)

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = -24;[span_80](start_span)[span_80](end_span)
        slider.max = 6;
        slider.value = 0;
        slider.style.width = "100%";

        slider.addEventListener("input", e => {
            mixerData.instruments.setVolume(busName, Number(e.target.value));[span_81](start_span)[span_81](end_span)
        });

        row.appendChild(lbl);
        row.appendChild(slider);
        volumeContainer.appendChild(row);
    });
}

// -------------------------------------------------------------
// RESET AUDIO E APP (Dal tuo main_2.js)[span_82](start_span)[span_82](end_span)
// -------------------------------------------------------------
async function resetAudio() {
    const ctx = Tone.getContext();[span_83](start_span)[span_83](end_span)
    if (ctx.state === "suspended") return;[span_84](start_span)[span_84](end_span)

    try {
        Tone.Transport.stop();[span_85](start_span)[span_85](end_span)
        Tone.Transport.cancel();[span_86](start_span)[span_86](end_span)
        if (ctx.state !== "closed") await ctx.close();[span_87](start_span)[span_87](end_span)
    } catch (e) { console.warn(e); }

    await Tone.start();[span_88](start_span)[span_88](end_span)
}

function resetAppState() {
    currentEngine?.stop();[span_89](start_span)[span_89](end_span)
    if (scoreUI) scoreUI.hide();[span_90](start_span)[span_90](end_span)
    currentEngine = null;
    closeMixelUI();[span_91](start_span)[span_91](end_span)
    releaseWakeLock();[span_92](start_span)[span_92](end_span)
}

// -------------------------------------------------------------
// UTILS UI E WAKE LOCK (Dal tuo main_2.js)[span_93](start_span)[span_93](end_span)
// -------------------------------------------------------------
function openMixelUI() {
    document.getElementById("playerPanel").classList.add("open");[span_94](start_span)[span_94](end_span)
    document.getElementById("previewImage").classList.add("shift-left");[span_95](start_span)[span_95](end_span)
    setTimeout(() => {
        document.getElementById("spectrumPanel").classList.add("active");[span_96](start_span)[span_96](end_span)
    }, 250);
}

function closeMixelUI() {
    document.getElementById("spectrumPanel")?.classList.remove("active");[span_97](start_span)[span_97](end_span)
    document.getElementById("previewImage")?.classList.remove("shift-left");[span_98](start_span)[span_98](end_span)
    document.getElementById("playerPanel")?.classList.remove("open");[span_99](start_span)[span_99](end_span)
}

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {[span_100](start_span)[span_100](end_span)
            wakeLock = await navigator.wakeLock.request('screen');[span_101](start_span)[span_101](end_span)
        }
    } catch (err) {}
}

function releaseWakeLock() {
    if (wakeLock) {[span_102](start_span)[span_102](end_span)
        wakeLock.release();
        wakeLock = null;
    }
}
