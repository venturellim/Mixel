// metal.js

console.log("METAL ENGINE LOADED");

import * as Tone from "https://esm.sh/tone";

import {
    guitarPalm,
    guitarOpen,
    bass,
    drums,
    createSeededRandom,
    analyzeImageBrightness
} from "./common.js";
import { extractPhotoDNA } from "./imageAnalysis.js";
import { chooseKey, chooseScale, powerChord } from "./musicTheory.js";
import { detectMetalStyle, computeBPM, generateRiffFromDNA } from "./metalTheory.js";
import { createMetalDrumEngine } from "./metalDrums.js";

console.log("IMPORT OK");

export async function createMetalEngineFromImage(imgElement) {

console.log("ENGINE START");

    // reset transport
    Tone.Transport.cancel();
    Tone.Transport.stop();

    // =========================
    // ANALISI IMMAGINE
    // =========================

    const brightness = analyzeImageBrightness(imgElement);
    const dna = extractPhotoDNA(imgElement);

    const rand = createSeededRandom(dna);

    console.log("Luminosità:", brightness);
    console.log("DNA:", dna);

    // =========================
    // TEORIA MUSICALE
    // =========================

    const style = detectMetalStyle(brightness, dna);
    const bpm = computeBPM(brightness, dna);

    Tone.Transport.bpm.value = bpm;

    const key = chooseKey(dna);
    const scale = chooseScale(dna, key);

    console.log("Metal style:", style);
    console.log("BPM:", bpm);
    console.log("Key:", key);
    console.log("Scale:", scale);
    
    const drumEngine = createMetalDrumEngine({
    drums,
    style,
    brightness,
    dna,
    rand
});

    // =========================
    // GENERAZIONE RIFF
    // =========================

    const riff = generateRiffFromDNA(dna, scale, 16, rand);

    console.log("Riff:", riff);

    let step = 0;

    const loop = new Tone.Loop((time) => {

    const note = riff[step];
    const chord = powerChord(note);

    guitarPalm.triggerAttackRelease(
        chord,
        "8n",
        time
    );

    bass.triggerAttackRelease(
        note,
        "8n",
        time
    );

    drumEngine.play(time);

    step++;

    if (step >= riff.length)
        step = 0;

}, "8n");

    loop.start(0);

    // =========================
    // PLAYER CONTROL
    // =========================

    function play() {
        Tone.Transport.start();
    }

    function pause() {
        Tone.Transport.pause();
    }

    function stop() {
        Tone.Transport.stop();
        Tone.Transport.seconds = 0;
    }

    function seek(sec) {
        Tone.Transport.seconds = sec;
    }

    return {

        play,
        pause,
        stop,
        seek,
        totalDuration: 240 // ~4 minuti

    };

}