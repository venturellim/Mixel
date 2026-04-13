// orchestraInstruments.js — ver. 002 (Bus & Mixer Integrated)
import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded } from "../../common.js";

console.log("orchestraInstruments.js ver. 003 loaded");

// Usiamo un repository stabile (Tonejs/mtg-instruments)
const BASE_URL = "https://tonejs.github.io/audio/casio/";

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
// 🎻 STRUMENTI (SAMPLE FUNZIONANTI)
// ============================================================

// Nota: siccome i sample orchestrali puri sono rari su CDN veloci, 
// usiamo i GeneralUser GS mappati correttamente per testare la logica subito.
const INSTR_URL = "https://gleitz.github.io/midi-js-soundfonts/FatBoy/";

export const violin = new Tone.Sampler({
    urls: { "A3": "violin-mp3/A3.mp3", "A4": "violin-mp3/A4.mp3", "A5": "violin-mp3/A5.mp3" },
    baseUrl: INSTR_URL,
    onload: () => registerInstrumentLoaded()
}).connect(violinBus).connect(hallReverb);

export const cello = new Tone.Sampler({
    urls: { "C2": "cello-mp3/C2.mp3", "G2": "cello-mp3/G2.mp3", "C3": "cello-mp3/C3.mp3" },
    baseUrl: INSTR_URL,
    onload: () => registerInstrumentLoaded()
}).connect(celloBus).connect(hallReverb);

export const doubleBass = new Tone.Sampler({
    urls: { "E1": "contrabass-mp3/E1.mp3", "G1": "contrabass-mp3/G1.mp3" },
    baseUrl: INSTR_URL,
    onload: () => registerInstrumentLoaded()
}).connect(celloBus).connect(hallReverb);

export const harpsichord = new Tone.Sampler({
    urls: { "A2": "harpsichord-mp3/A2.mp3", "A3": "harpsichord-mp3/A3.mp3", "A4": "harpsichord-mp3/A4.mp3" },
    baseUrl: INSTR_URL,
    onload: () => registerInstrumentLoaded()
}).connect(harpsichordBus).connect(hallReverb);

export const timpani = new Tone.Sampler({
    urls: { "C2": "timpani-mp3/C2.mp3", "G2": "timpani-mp3/G2.mp3" },
    baseUrl: INSTR_URL,
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
