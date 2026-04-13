// orchestraInstruments.js — ver. 002 (Bus & Mixer Integrated)
import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded } from "../../common.js";

console.log("orchestraInstruments.js ver. 003.1 loaded");

//Repository ufficiale strumenti Tone.js
const BASE_URL = "https://tonejs.github.io/audio/salamander/";
const ALT_URL = "https://gleitz.github.io/midi-js-soundfonts/FatBoy/"; // Backup alternativo

// ============================================================
// 🎚 BUS ORCHESTRALI
// ============================================================
export const violinBus = new Tone.Gain(1);
export const celloBus = new Tone.Gain(1);
export const harpsichordBus = new Tone.Gain(1);
export const timpaniBus = new Tone.Gain(1);

const violinEQ = new Tone.EQ3({ low: -6, mid: 0, high: 2 }).connect(masterEQ);
const celloEQ = new Tone.EQ3({ low: 2, mid: -2, high: -2 }).connect(masterEQ);
const harpsiEQ = new Tone.EQ3({ low: -10, mid: 1, high: 4 }).connect(masterEQ);
const timpaniEQ = new Tone.EQ3({ low: 4, mid: 0, high: -6 }).connect(masterEQ);

violinBus.connect(violinEQ);
celloBus.connect(celloEQ);
harpsichordBus.connect(harpsiEQ);
timpaniBus.connect(timpaniEQ);

const hallReverb = new Tone.Reverb({ decay: 3.5, preDelay: 0.02, wet: 0.4 }).toDestination();

// ============================================================
// 🎻 STRUMENTI (LINK VERIFICATI)
// ============================================================

// Nota: Molti repository "FatBoy" sono stati rimossi. 
// Usiamo i link diretti dalla libreria "FluidR3_GM" che è lo standard globale.
const CDN_URL = "https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/master/FluidR3_GM/";

export const violin = new Tone.Sampler({
    urls: { "A3": "violin-mp3.js", "A4": "violin-mp3.js", "A5": "violin-mp3.js" },
    baseUrl: CDN_URL,
    onload: () => registerInstrumentLoaded()
}).connect(violinBus).connect(hallReverb);

export const cello = new Tone.Sampler({
    urls: { "C2": "cello-mp3.js", "G2": "cello-mp3.js", "C3": "cello-mp3.js" },
    baseUrl: CDN_URL,
    onload: () => registerInstrumentLoaded()
}).connect(celloBus).connect(hallReverb);

export const doubleBass = new Tone.Sampler({
    urls: { "E1": "contrabass-mp3.js", "G1": "contrabass-mp3.js" },
    baseUrl: CDN_URL,
    onload: () => registerInstrumentLoaded()
}).connect(celloBus).connect(hallReverb);

export const harpsichord = new Tone.Sampler({
    urls: { "A2": "harpsichord-mp3.js", "A3": "harpsichord-mp3.js", "A4": "harpsichord-mp3.js" },
    baseUrl: CDN_URL,
    onload: () => registerInstrumentLoaded()
}).connect(harpsichordBus).connect(hallReverb);

export const timpani = new Tone.Sampler({
    urls: { "C2": "timpani-mp3.js", "G2": "timpani-mp3.js" },
    baseUrl: CDN_URL,
    onload: () => registerInstrumentLoaded()
}).connect(timpaniBus).connect(hallReverb);

// ============================================================
// ⚙️ UTILITY & EXPORTS
// ============================================================
export function setVolume(busName, dbValue) {
    const mixer = { violin: violinBus, cello: celloBus, harpsichord: harpsichordBus, timpani: timpaniBus };
    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

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
