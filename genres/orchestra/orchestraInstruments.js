// orchestraInstruments.js — ver. 001 (Full Baroque Orchestra + Timpani)
import * as Tone from "https://esm.sh/tone";

console.log("orchestraInstruments.js ver. 001 loaded");

const GITHUB_VSCO = "https://raw.githubusercontent.com/sguzman/vsco2-samples-mp3/master/";

// --- RIVERBERO ---
const hallReverb = new Tone.Reverb({
    decay: 2.8,
    preDelay: 0.01,
    wet: 0.35
}).toDestination();

// --- VIOLIN ---
export const violin = new Tone.Sampler({
    urls: { "G3": "Violin/sus_G3.mp3", "A4": "Violin/sus_A4.mp3", "C6": "Violin/sus_C6.mp3" },
    baseUrl: GITHUB_VSCO,
    release: 1.2
}).connect(hallReverb);

// --- CELLO ---
export const cello = new Tone.Sampler({
    urls: { "C2": "Cello/sus_C2.mp3", "G2": "Cello/sus_G2.mp3", "D3": "Cello/sus_D3.mp3" },
    baseUrl: GITHUB_VSCO,
    release: 1.5
}).connect(hallReverb);

// --- DOUBLE BASS ---
export const doubleBass = new Tone.Sampler({
    urls: { "C1": "Double%20Bass/sus_C1.mp3", "G1": "Double%20Bass/sus_G1.mp3", "D2": "Double%20Bass/sus_D2.mp3" },
    baseUrl: GITHUB_VSCO,
    volume: +2,
    release: 2
}).connect(hallReverb);

// --- HARPSICHORD ---
export const harpsichord = new Tone.Sampler({
    urls: { "F2": "Harpsichord/f2.mp3", "A3": "Harpsichord/a3.mp3", "D5": "Harpsichord/d5.mp3" },
    baseUrl: GITHUB_VSCO,
    volume: -6
}).connect(hallReverb);

// --- TIMPANI (The Thunder) ---
export const timpani = new Tone.Sampler({
    urls: { 
        "C2": "Timpani/f_C2.mp3", 
        "G2": "Timpani/f_G2.mp3",
        "C3": "Timpani/f_C3.mp3" 
    },
    baseUrl: GITHUB_VSCO,
    volume: +4, // Bello ignorante per i cambi sezione
    release: 3 // Lasciamo che la coda del colpo risuoni
}).connect(hallReverb);

export const orchestraInstruments = {
    violin,
    cello,
    doubleBass,
    harpsichord,
    timpani
};

export { hallReverb };
