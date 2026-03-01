import { generateMetal } from "./metal.js";

let currentDNA = null;
let currentEngine = null;

const fileInput = document.getElementById("fileInput");
const genreButton = document.getElementById("genreButton");
const metalBtn = document.getElementById("metalBtn");
const player = document.getElementById("player");
const playBtn = document.getElementById("playBtn");

fileInput.addEventListener("change", handleImage);
metalBtn.addEventListener("click", selectMetal);
playBtn.addEventListener("click", startPlayback);

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