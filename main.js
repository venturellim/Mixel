//
// main.js - Versione VERTICALE/ORIZZONTALE
// Router centrale dell'app: UI, caricamento immagine, analisi, parametri,
// selezione genere, player, spectrum, FX panel.
// Tutto il resto vive nei moduli dei generi.
//

import * as Tone from "https://esm.sh/tone";

import { masterEQ, } from "./common.js";
import { analyzeImage } from "./imageAnalysis.js";
import { photoToMusicParams } from "./photoToMusicParams.js";
import { createPianoEngine, waitPianoInstruments } from "./genres/piano/pianoEngine.js";
import { createMetalEngine, waitMetalInstruments } from "./genres/metal/metalEngine.js";
import { createOrchestraEngine, waitOrchestraInstruments } from "./genres/orchestra/orchestraEngine.js";
import { createDanceEngine, waitDanceInstruments } from "./genres/dance/danceEngine.js";
import { scoreVisualizer } from "./scoreUI.js";

console.log("main.js ver. 013 loaded");


let currentEngine = null;
let currentGenre = null;
let scoreUI = null;
const miniVideo = document.querySelector('.video-mini-wrapper video'); 

// Flag per tenere traccia degli strumenti già caricati per ogni genere
const instrumentsLoaded = {
    dance: false,
    metal: false,
    orchestra: false,
    piano: false
};

// Flag per evitare reset multipli
let isResetting = false;

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
            
            // RILEVA ASPECT RATIO DELL'IMMAGINE
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
            
            // Rimuovi zoom se presente
            previewImage.classList.remove("zoomed-out");
            previewImage.classList.remove("moved-up");
            
            if (miniVideo) {
                miniVideo.pause();
                miniVideo.currentTime = 0; 
            }

            resetAppState(false); // false = non resettare l'audio
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
            selectGenre(btn.dataset.genre);
        });
    });
}

// -------------------------------------------------------------
// Reset audio sicuro (solo quando necessario)
// -------------------------------------------------------------
async function safeResetAudio() {
    if (isResetting) {
        console.log("Reset audio già in corso, skip");
        return;
    }
    
    isResetting = true;
    const ctx = Tone.getContext();
    
    try {
        // Ferma tutto il transporte
        Tone.Transport.stop();
        Tone.Transport.cancel();
        
        // Scollega eventuali nodi dall'engine corrente
        if (currentEngine && currentEngine.dispose) {
            await currentEngine.dispose();
        }
        
        // Chiudi il contesto solo se è attivo e non è già in chiusura
        if (ctx.state !== "closed" && ctx.state !== "suspended") {
            await ctx.close();
            console.log("AudioContext chiuso correttamente");
            // Crea un nuovo contesto
            await Tone.start();
            console.log("Nuovo AudioContext creato");
        } else if (ctx.state === "suspended") {
            // Se è sospeso, basta riattivarlo
            await Tone.start();
            console.log("AudioContext riattivato");
        }
    } catch (e) {
        console.warn("Errore durante reset audio:", e);
        // Tentativo di recupero
        try {
            await Tone.start();
        } catch (e2) {
            console.error("Impossibile riavviare AudioContext:", e2);
        }
    } finally {
        isResetting = false;
    }
}

// -------------------------------------------------------------
// Caricamento strumenti per genere (con caching)
// -------------------------------------------------------------
async function loadInstrumentsForGenre(genre) {
    // Se gli strumenti sono già stati caricati, salta
    if (instrumentsLoaded[genre]) {
        console.log(`✅ Strumenti ${genre} già caricati, skip`);
        return true;
    }
    
    console.log(`🎵 Caricamento strumenti per ${genre}...`);
    
    // Mostra loading overlay
    const overlay = document.getElementById("loadingOverlay");
    const loadingText = document.getElementById("loadingText");
    const loadingBar = document.getElementById("loadingBar");
    
    if (overlay) overlay.style.display = "flex";
    if (loadingText) loadingText.textContent = `Caricamento strumenti ${genre}...`;
    
    try {
        switch(genre) {
            case "dance":
                await waitDanceInstruments();
                break;
            case "metal":
                await waitMetalInstruments();
                break;
            case "orchestra":
                await waitOrchestraInstruments();
                break;
            case "piano":
                await waitPianoInstruments();
                break;
            default:
                console.warn(`Genere sconosciuto: ${genre}`);
                return false;
        }
        instrumentsLoaded[genre] = true;
        console.log(`✅ Strumenti ${genre} caricati con successo`);
        return true;
    } catch (error) {
        console.error(`❌ Errore caricamento strumenti ${genre}:`, error);
        return false;
    } finally {
        if (overlay) overlay.style.display = "none";
    }
}

// -------------------------------------------------------------
// Selezione genere
// -------------------------------------------------------------
async function selectGenre(genre) {
    // Se è lo stesso genere, non fare nulla
    if (currentGenre === genre && currentEngine) {
        console.log(`Genere ${genre} già attivo, nessuna azione`);
        document.getElementById("genrePanel").classList.remove("show");
        setTimeout(() => document.getElementById("genrePanel").classList.add("hidden"), 400);
        return;
    }
    
    currentGenre = genre;
    if (scoreUI) scoreUI.setTheme(genre);

    const previewImage = document.getElementById("previewImage");
    
    // Mostra loading
    const overlay = document.getElementById("loadingOverlay");
    const loadingText = document.getElementById("loadingText");
    if (loadingText) loadingText.textContent = `Preparazione ${genre}...`;
    if (overlay) overlay.style.display = "flex";

    try {
        // RESET AUDIO SOLO SE CAMBIA GENERE (non per nuova foto)
        if (currentEngine) {
            console.log("Cambio genere, reset audio in corso...");
            await safeResetAudio();
        }
        
        // Analisi immagine
        const analysis = await analyzeImage(previewImage);
        const params = photoToMusicParams(analysis);

        // Carica strumenti solo se necessario
        const loaded = await loadInstrumentsForGenre(genre);
        if (!loaded) {
            throw new Error(`Impossibile caricare gli strumenti per ${genre}`);
        }

        // Crea l'engine
        switch(genre) {
            case "dance":
                currentEngine = await createDanceEngine(params, scoreUI);
                break;
            case "metal":
                currentEngine = await createMetalEngine(params, scoreUI);
                break;
            case "orchestra":
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

        // Zoom-out dell'immagine dopo la selezione del genere
        previewImage.classList.add("zoomed-out");

        initPlayerUI();
        drawSpectrum();
        initFxPanel(currentEngine.mixerData);

    } catch (error) {
        console.error("❌ Errore nella selezione del genere:", error);
        if (loadingText) loadingText.textContent = `Errore: ${error.message}`;
        setTimeout(() => {
            if (overlay) overlay.style.display = "none";
        }, 2000);
        return;
    } finally {
        if (overlay && loadingText && !loadingText.textContent.includes("Errore")) {
            overlay.style.display = "none";
        }
    }

    document.getElementById("genrePanel").classList.remove("show");
    setTimeout(() => document.getElementById("genrePanel").classList.add("hidden"), 400);
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
    
    // Rendi visibile il pannello destro in orizzontale
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
        const loadingText = document.getElementById("loadingText");
        if (loadingText) loadingText.textContent = "Avvio audio...";
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
        btnSpartito.classList.remove("show-flex");
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

    // Cleanup vecchi listener prima di aggiungerne di nuovi
    if (window._transportHandler) {
        Tone.Transport.clear(window._transportHandler);
    }
    
    window._transportHandler = Tone.Transport.scheduleRepeat(() => {
        const now = Tone.Transport.seconds;
        const duration = currentEngine?.totalDuration || 1;
        if (seekBar) seekBar.value = (now / duration) * 100;
        if (currentTimeEl) currentTimeEl.textContent = formatTime(now);
    }, 0.1);

    // Rimuovi vecchio listener e aggiungi nuovo
    const newSeekBar = seekBar.cloneNode(true);
    seekBar.parentNode.replaceChild(newSeekBar, seekBar);
    newSeekBar.addEventListener("input", () => {
        const seconds = (newSeekBar.value / 100) * currentEngine.totalDuration;
        currentEngine.seek(seconds);
    });
    window.seekBar = newSeekBar;
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
    // Ferma l'engine corrente
    if (currentEngine) {
        currentEngine.stop();
        if (currentEngine.score) currentEngine.score.hide();
        // Non distruggere l'engine, lascia che venga sovrascritto
        currentEngine = null;
    }
    
    currentGenre = null;
    closeMixelUI();
    
    if (miniVideo) {
        miniVideo.pause();
        miniVideo.currentTime = 0; 
    }
    
    releaseWakeLock();
    
    // Reset audio solo se richiesto esplicitamente
    if (resetAudio) {
        safeResetAudio().catch(console.warn);
    }
    
    // Rimuovi zoom dall'immagine
    const previewImage = document.getElementById("previewImage");
    if (previewImage) {
        previewImage.classList.remove("zoomed-out");
        previewImage.classList.remove("moved-up");
    }
    
    // Nascondi pulsante chiusura spartito
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
    
    // Rimuovi la visibilità del pannello destro
    if (rightPanel) rightPanel.classList.remove("visible");
    
    if (spectrumPanel) spectrumPanel.classList.add("hidden");
    if (playerPanel) playerPanel.classList.add("hidden");
    if (btnSpartito) btnSpartito.classList.add("hidden");
    if (previewImage) previewImage.classList.remove("moved-up");
    if (closeScoreBtn) closeScoreBtn.style.display = "none";
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