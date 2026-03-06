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

const style = detectMetalStyle(brightness,dna);
const bpm = computeBPM(brightness,dna);

Tone.Transport.bpm.value = bpm;

const key = chooseKey(dna);
const scale = chooseScale(dna,key);


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


// =========================
// GENERAZIONE RIFF
// =========================

const riff = generateRiffFromDNA(dna,scale,16,rand);

console.log("Riff:",riff);

// =========================
// LOOP PRINCIPALE
// =========================

let step = 0;

const loop = new Tone.Loop((time) => {

    const note = riff[step] + "2";

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

console.log("DRUM HIT");

    drumEngine.play(time);

    step++;

    if(step >= riff.length)
        step = 0;

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
}

function seek(sec){
    Tone.Transport.seconds = sec;
}

return{

    play,
    pause,
    stop,
    seek,
    totalDuration:240

};

}