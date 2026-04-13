// orchestraInstruments.js — ver. 002 (Bus & Mixer Integrated)
import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded } from "../../common.js";

console.log("orchestraInstruments.js ver. 002 loaded");

const GITHUB_VSCO = "https://raw.githubusercontent.com/sguzman/vsco2-samples-mp3/master/";

// ============================================================
// 🎚 BUS ORCHESTRALI (Per il Mixer)
// ============================================================
export const violinBus = new Tone.Gain(1);
export const celloBus = new Tone.Gain(1);
export const harpsichordBus = new Tone.Gain(1);
export const timpaniBus = new Tone.Gain(1);

// EQ dedicata per ammorbidire gli archi e dare aria al cembalo
const violinEQ = new Tone.EQ3({ low: -6, mid: 0, high: 2 }).connect(masterEQ);
const celloEQ = new Tone.EQ3({ low: 2, mid: -2, high: -2 }).connect(masterEQ);
const harpsiEQ = new Tone.EQ3({ low: -10, mid: 1, high: 4 }).connect(masterEQ);
const timpaniEQ = new Tone.EQ3({ low: 4, mid: 0, high: -6 }).connect(masterEQ);

// Routing: Bus -> EQ -> Master
violinBus.connect(violinEQ);
celloBus.connect(celloEQ);
harpsichordBus.connect(harpsiEQ);
timpaniBus.connect(timpaniEQ);

// --- RIVERBERO HALL (Condiviso) ---
const hallReverb = new Tone.Reverb({
    decay: 3.5,
    preDelay: 0.02,
    wet: 0.4
}).toDestination();

// ============================================================
// 🎻 STRUMENTI
// ============================================================

export const violin = new Tone.Sampler({
    urls: { "G3": "Violin/sus_G3.mp3", "A4": "Violin/sus_A4.mp3", "C6": "Violin/sus_C6.mp3" },
    baseUrl: GITHUB_VSCO,
    release: 1.2,
    onload: () => registerInstrumentLoaded()
}).connect(violinBus).connect(hallReverb);

export const cello = new Tone.Sampler({
    urls: { "C2": "Cello/sus_C2.mp3", "G2": "Cello/sus_G2.mp3", "D3": "Cello/sus_D3.mp3" },
    baseUrl: GITHUB_VSCO,
    release: 1.5,
    onload: () => registerInstrumentLoaded()
}).connect(celloBus).connect(hallReverb);

export const doubleBass = new Tone.Sampler({
    urls: { "C1": "Double%20Bass/sus_C1.mp3", "G1": "Double%20Bass/sus_G1.mp3", "D2": "Double%20Bass/sus_D2.mp3" },
    baseUrl: GITHUB_VSCO,
    release: 2,
    onload: () => registerInstrumentLoaded()
}).connect(celloBus).connect(hallReverb); // Condivide il bus del Cello per praticità

export const harpsichord = new Tone.Sampler({
    urls: { "F2": "Harpsichord/f2.mp3", "A3": "Harpsichord/a3.mp3", "D5": "Harpsichord/d5.mp3" },
    baseUrl: GITHUB_VSCO,
    onload: () => registerInstrumentLoaded()
}).connect(harpsichordBus).connect(hallReverb);

export const timpani = new Tone.Sampler({
    urls: { "C2": "Timpani/f_C2.mp3", "G2": "Timpani/f_G2.mp3", "C3": "Timpani/f_C3.mp3" },
    baseUrl: GITHUB_VSCO,
    release: 3,
    onload: () => registerInstrumentLoaded()
}).connect(timpaniBus).connect(hallReverb);

// ============================================================
// ⚙️ UTILITY & EXPORTS (Stesso schema del Metal)
// ============================================================

export function setVolume(busName, dbValue) {
    const mixer = { 
        violin: violinBus, 
        cello: celloBus, 
        harpsichord: harpsichordBus, 
        timpani: timpaniBus 
    };
    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

// Volumi di default bilanciati
setVolume("violin", 0);
setVolume("cello", +2);
setVolume("harpsichord", -4);
setVolume("timpani", +4);

export const orchestraInstruments = {
    violin, cello, doubleBass, harpsichord, timpani,
    violinBus, celloBus, harpsichordBus, timpaniBus, setVolume
};

export const orchestraVolumeMap = {
    violin: "Violino Solo",
    cello: "Cello & Bassi",
    harpsichord: "Cembalo",
    timpani: "Timpani"
};
