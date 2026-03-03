import { createMetalEngineFromImage } from "./metal.js";

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
initPlayerUI();
initFxPanel();
    }

    
    document.getElementById("genrePanel").classList.remove("show");
    document.getElementById("Player").classList.remove("hidden");
}

// 🎧 Player UI

function initPlayerUI() {

console.log("MIXEL PLAYER INIZZIALIZZATO");

const mixelPlayer = document.getElementById("Player");
if (!mixelPlayer) {
        console.error("❌ ERRORE: elemento #mixelPlayer non trovato!");
        return;
    }
    
    mixelPlayer.classList.remove("hidden");
    
    const playBtn = document.getElementById("btnPlay");
    const pauseBtn = document.getElementById("btnPause");
    const stopBtn = document.getElementById("btnStop");
    const seekBar = document.getElementById("seekBar");
    
    if (!playBtn || !pauseBtn || !stopBtn || !seekBar) {
        console.error("❌ ERRORE: uno dei pulsanti del player non esiste!");
        return;
    }

    playBtn.onclick = () => currentEngine?.play();
    pauseBtn.onclick = () => currentEngine?.pause();
    stopBtn.onclick = () => currentEngine?.stop();
    
    console.log("🔎 currentEngine:", currentEngine);
    console.log("🔎 typeof currentEngine:", typeof currentEngine);
    console.log("🔎 metodi engine:", Object.keys(currentEngine));

    seekBar.oninput = () => {
        if (!currentEngine) return;
        const sec = (seekBar.value / 100) * currentEngine.totalDuration;
        currentEngine.seek(sec);
    };
    

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

    document.getElementById("Player")?.classList.add("hidden");
}