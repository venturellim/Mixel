// metal.js — versione moderna, modulare, compatibile con Tone.js 15

import * as Tone from "https://esm.sh/tone";

import {
    guitarPalm,
    guitarOpen,
    guitarLead,
    bass,
    drums,
    masterEQ,
    createSeededRandom
} from "./common.js";

import { analyzeImage } from "./imageAnalysis.js";
import { generateMetalRiff } from "./metalRiff.js";
import { createBassEngine } from "./metalBass.js";
import { createLeadEngine } from "./metalLead.js";
import { createDrumEngine } from "./metalDrums.js";
import { detectMetalStyle } from "./metalTheory.js";

// ======================================================
// 1) ENTRY POINT USATO DA main.js
// ======================================================

export async function createMetalEngineFromImage(previewImage) {

    // Analisi immagine completa
    const analysis = await analyzeImage(previewImage);
    console.log("ANALYSIS:", analysis);

    const style = detectMetalStyle(analysis.brightness, analysis.entropy);
analysis.style = style;


    // Seed deterministico
    const dna = Math.floor(analysis.brightness * 1000000);
    const rand = createSeededRandom(dna);

    // Crea engine completo
    const engine = await createMetalSongFromAnalysis(analysis, rand);

    return engine;
}

// ======================================================
// 2) LOADER STRUMENTI
// ======================================================

export async function waitInstrumentsWithProgress() {

    const overlay = document.getElementById("loadingOverlay");
    const bar = document.getElementById("loadingBar");
    const text = document.getElementById("loadingText");

    overlay.style.display = "flex";

    const total = 4; // palm, open, lead, bass

    while (window.__samplerLoadedCount < total) {
        const percent = Math.floor((window.__samplerLoadedCount / total) * 100);
        bar.style.width = percent + "%";
        text.innerText = "Caricamento strumenti… " + percent + "%";

        await new Promise(res => setTimeout(res, 100));
    }

    overlay.style.display = "none";
}



// ======================================================
// 3) ENGINE COMPLETO
// ======================================================

export async function createMetalSongFromAnalysis(analysis, rand) {

    await Tone.loaded();

    // BPM dalla luminosità + edges
    const bpm = 90 + analysis.brightness * 40 + analysis.edges * 30;
    Tone.Transport.bpm.value = bpm;

    // Durata fissa (per ora)
    const totalDuration = 120; // 2 minuti

    // Crea engine modulari
    const riffEngine = generateMetalRiff(analysis, rand);
    const bassEngine = createBassEngine(analysis, rand);
    const leadEngine = createLeadEngine(analysis, rand);
    const drumEngine = createDrumEngine(analysis, rand);

    // Schedula loop
    let riffStep = 0;
let bassStep = 0;
let leadStep = 0;
let drumStep = 0;

const riffLoop = new Tone.Loop((time) => {
    riffEngine(time, riffStep++);
}, "8n");

const bassLoop = new Tone.Loop((time) => {
    bassEngine(time, bassStep++);
}, "8n");

const leadLoop = new Tone.Loop((time) => {
    leadEngine(time, leadStep++);
}, "8n");

const drumLoop = new Tone.Loop((time) => {
    drumEngine(time, drumStep++);
}, "16n");




    function play() {
        riffLoop.start(0);
        bassLoop.start(0);
        leadLoop.start(0);
        drumLoop.start(0);

        if (Tone.Transport.state !== "started") {
            Tone.Transport.start();
        }
    }

    function pause() {
        if (Tone.Transport.state === "started") {
            Tone.Transport.pause();
        }
    }

    function stop() {
    riffLoop.stop();
bassLoop.stop();
leadLoop.stop();
drumLoop.stop();

        Tone.Transport.stop();
        
        Tone.Transport.position = 0;
    }

    function seek(seconds) {
        Tone.Transport.seconds = seconds;
    }

    return {
        play,
        pause,
        stop,
        seek,
        totalDuration
    };
}
