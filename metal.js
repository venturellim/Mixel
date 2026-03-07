// metal.js

console.log("METAL ENGINE LOADED");

import * as Tone from "https://esm.sh/tone";

import {
    guitarPalm,
    guitarOpen,
    guitarLead,
    bass,
    drums,
    createSeededRandom,
    analyzeImageBrightness
} from "./common.js";

import { extractPhotoDNA } from "./imageAnalysis.js";
import { chooseKey, chooseScale, powerChord } from "./musicTheory.js";
import { detectMetalStyle, computeBPM } from "./metalTheory.js";
import { createMetalDrumEngine } from "./metalDrums.js";
import { generateMetalRiff } from "./metalRiff.js";
import { createLeadEngine } from "./leadEngine.js";
import { generateMetalLead } from "./metalLead.js";


// =========================
// SCELTA OTTAVA IN BASE ALLO STILE
// =========================

function chooseOctaveForStyle(style, rand) {
    switch(style){
        case "doom":
        case "sludge":
            return 2;

        case "heavy":
        case "groove":
            return 3;

        case "thrash":
            return rand() > 0.5 ? 3 : 4;

        case "black":
        case "speed":
            return rand() > 0.5 ? 4 : 5;

        case "power":
        case "melodic":
            return 5;

        default:
            return 3;
    }
}


// =========================
// NORMALIZZAZIONE NOTE
// =========================

const NOTE_ORDER = ["c","db","d","eb","e","f","gb","g","ab","a","bb","b"];

function clampToSampleRange(note, octave) {
    const n = note.toLowerCase();

    // Se siamo in ottava 6, non superare E6
    if (octave === 6) {
        const idx = NOTE_ORDER.indexOf(n);
        const maxIdx = NOTE_ORDER.indexOf("e");
        if (idx > maxIdx) return "e6";
    }

    return n + octave;
}


// =========================
// ENGINE PRINCIPALE
// =========================

export async function createMetalEngineFromImage(imgElement){

    console.log("ENGINE START");

    Tone.Transport.cancel();
    Tone.Transport.stop();

    // =========================
    // ANALISI IMMAGINE
    // =========================

    const brightness = analyzeImageBrightness(imgElement);
    const dna = extractPhotoDNA(imgElement);
    const rand = createSeededRandom(dna);

    // =========================
    // TEORIA METAL
    // =========================

    const style = detectMetalStyle(brightness, dna);
    const bpm = computeBPM(brightness, dna);

    Tone.Transport.bpm.value = bpm;

    const key = chooseKey(dna);
    const scale = chooseScale(dna, key);

    // =========================
    // DRUM ENGINE
    // =========================

    const drumEngine = createMetalDrumEngine({
        drums,
        style,
        brightness,
        dna,
        rand
    });

const lead = generateMetalLead(dna, scale, style, rand);

const leadEngine = createLeadEngine({
    sampler: guitarLead,
    lead,
    style,
    dna,
    rand,
    master: masterEQ
    });

    // =========================
    // GENERAZIONE RIFF
    // =========================

    const riff = generateMetalRiff(dna, scale, style, rand);


    console.log("Riff:", riff);

    // =========================
    // LOOP PRINCIPALE
    // =========================

    let step = 0;
    const octave = chooseOctaveForStyle(style, rand);

    const loop = new Tone.Loop((time) => {

        const raw = riff[step];                 // es. "db"
        const note = clampToSampleRange(raw, octave);
        const chord = powerChord(note);

        guitarPalm.triggerAttackRelease(chord, "8n", time);
        bass.triggerAttackRelease(note, "8n", time);

        drumEngine.play(time);

        step++;
        if(step >= riff.length) step = 0;

    }, "8n");

    loop.start(0);

    // =========================
    // PLAYER API
    // =========================

    function play(){
        Tone.Transport.start();
    }

    function pause(){
        Tone.Transport.pause();
    }

    function stop(){
        Tone.Transport.stop();
        Tone.Transport.seconds = 0;
        step = 0; // reset del riff
    }

    function seek(sec){
        Tone.Transport.seconds = sec;
    }

    // Durata stimata del loop
    const totalDuration = riff.length * (60 / bpm) * 0.5;

    return {
        play,
        pause,
        stop,
        seek,
        totalDuration
    };
}
