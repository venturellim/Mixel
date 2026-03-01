import { generateMetal } from "./metal.js";

let currentDNA = null;
let currentEngine = null;
// 👇 variabili globali
let imageLoader;
let genreButton;
let player;
let playBtn;

window.addEventListener("DOMContentLoaded", () => {

    const imageLoader = document.getElementById("fileInput");
    const genreButton = document.getElementById("btnElabora");
    const player = document.getElementById("Player");
    const playBtn = document.getElementById("btnPlay");

    const genreButtons = document.querySelectorAll(".genre-btn");

    // ===== Controlli sicurezza =====
    if (!imageLoader) {
        console.error("fileInput non trovato");
        return;
    }

    if (!playBtn) {
        console.error("btnPlay non trovato");
        return;
    }

    // ===== Eventi =====
    imageLoader.addEventListener("change", handleImage);

    genreButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const genre = btn.dataset.genre;

            if (genre === "metal") {
                selectMetal();
            }
        });
    });

    playBtn.addEventListener("click", startPlayback);

});

function resetApp() {
    player.classList.add("hidden");
    genreButton.classList.add("hidden");
    currentDNA = null;
    currentEngine = null;
}

function handleImage(e) {
    resetApp();

    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
        currentDNA = analyzeImage(img);
        genreButton.classList.remove("hidden");
    };

    img.src = URL.createObjectURL(file);
}

function analyzeImage(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let brightness = 0;

    for (let i = 0; i < data.length; i += 4) {
        brightness += (data[i] + data[i+1] + data[i+2]) / 3;
    }

    brightness /= (data.length / 4);

    return {
        brightness
    };
}

function selectMetal() {
    currentEngine = generateMetal(currentDNA);
    player.classList.remove("hidden");
}

async function startPlayback() {
    await Tone.start();
    await Tone.loaded();

    if (!currentEngine) return;

    currentEngine.start();
}