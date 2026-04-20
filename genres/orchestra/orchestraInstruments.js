// orchestraInstruments.js — ver. 002 (Full Baroque Orchestra + Timpani)
import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded, logNote } from "../../common.js";

console.log("orchestraInstruments.js ver. 003.1 loaded");

// --- RIVERBERO ---
const hallReverb = new Tone.Reverb({
    decay: 2.8,
    preDelay: 0.01,
    wet: 0.35
}).toDestination();

export const violinBus = new Tone.Gain(1);
export const violaBus = new Tone.Gain(1);
export const celloBus = new Tone.Gain(1);
export const doubleBassBus = new Tone.Gain(1);
export const harpsichordBus = new Tone.Gain(1);
export const timpaniBus = new Tone.Gain(1);

const violinEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const violaEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const doubleBassEQ   = new Tone.EQ3({ low: 4, mid: -2, high: -4 });
const timpaniEQ   = new Tone.EQ3({ low: 2, mid: 1, high: 3 });
const celloEQ   = new Tone.EQ3({ low: -3, mid: 2, high: 6 });
const harpsichordEQ   = new Tone.EQ3({ low: -3, mid: 2, high: 6 });

// Routing bus → EQ → master
violinBus.connect(violinEQ).connect(hallReverb).connect(masterEQ);
violaBus.connect(violaEQ).connect(hallReverb).connect(masterEQ);
doubleBassBus.connect(doubleBassEQ).connect(hallReverb).connect(masterEQ);
timpaniBus.connect(timpaniEQ).connect(hallReverb).connect(masterEQ);
celloBus.connect(celloEQ).connect(hallReverb).connect(masterEQ);
harpsichordBus.connect(harpsichordEQ).connect(hallReverb).connect(masterEQ);

// --- VIOLIN ---
export const violin = new Tone.Sampler({
    urls: { 
    A2: "Samples/Violin/A2.mp3", 
    A3: "Samples/Violin/A3.mp3",
    B2: "Samples/Violin/B2.mp3", 
    B4: "Samples/Violin/B4.mp3",
    C4: "Samples/Violin/C4.mp3", 
    D3: "Samples/Violin/D3.mp3",
    D5: "Samples/Violin/D5.mp3", 
    E4: "Samples/Violin/E4.mp3",
    "F#3": "Samples/Violin/Fs3.mp3",
    G2: "Samples/Violin/G2.mp3", 
    G4: "Samples/Violin/G4.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded()
}).connect(violinBus);

// --- VIOLA ---
export const viola = new Tone.Sampler({
    urls: {  
    A3: "Samples/Viola/A3.mp3",
    B2: "Samples/Viola/B2.mp3", 
    C2: "Samples/Viola/C2.mp3",
    C4: "Samples/Viola/C4.mp3", 
    D2: "Samples/Viola/D2.mp3",
    D3: "Samples/Viola/D3.mp3",
    D5: "Samples/Viola/D5.mp3",
    E2: "Samples/Viola/E2.mp3",
    E4: "Samples/Viola/E4.mp3",
    G2: "Samples/Viola/G2.mp3", 
    G4: "Samples/Viola/G4.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded()
}).connect(violaBus);

// --- CELLO ---
export const cello = new Tone.Sampler({
    urls: { 
   A2: "Samples/Cello/A2.mp3",
   B1: "Samples/Cello/B1.mp3",
   B3: "Samples/Cello/B3.mp3",
   C1: "Samples/Cello/C1.mp3",
   C3: "Samples/Cello/C3.mp3",
   D2: "Samples/Cello/D2.mp3",
   D4: "Samples/Cello/D4.mp3",
   E1: "Samples/Cello/E1.mp3",
   E3: "Samples/Cello/E3.mp3",
   F2: "Samples/Cello/F2.mp3",
   F4: "Samples/Cello/F4.mp3",
   G1: "Samples/Cello/G1.mp3",
   G3: "Samples/Cello/G3.mp3"
    },
    release: 1.5,
onload: () => registerInstrumentLoaded()
}).connect(celloBus);

// --- DOUBLE BASS ---
export const doubleBass = new Tone.Sampler({
    urls: { 
    "A#0": "Samples/DoubleBass/As0.mp3",
    A1: "Samples/DoubleBass/A1.mp3",
    B2: "Samples/DoubleBass/B2.mp3",
    "C#2": "Samples/DoubleBass/Cs2.mp3",
    C1: "Samples/DoubleBass/C1.mp3",
    D1: "Samples/DoubleBass/D1.mp3",
    E1: "Samples/DoubleBass/E1.mp3",
    E2: "Samples/DoubleBass/E2.mp3",
    "F#0": "Samples/DoubleBass/Fs0.mp3",
    "F#1": "Samples/DoubleBass/Fs1.mp3",
    "G#1": "Samples/DoubleBass/Gs1.mp3",
    "G#2": "Samples/DoubleBass/Gs2.mp3",
    G0: "Samples/DoubleBass/G0.mp3"
    },
    release: 2,
onload: () => registerInstrumentLoaded()
}).connect(doubleBassBus);

// --- HARPSICHORD ---
export const harpsichord = new Tone.Sampler({
    urls: { 
   A2: "Samples/Harpsichord/A2.mp3",
   A4: "Samples/Harpsichord/A4.mp3",
   A6: "Samples/Harpsichord/A6.mp3",
   B1: "Samples/Harpsichord/B1.mp3",
   B3: "Samples/Harpsichord/B3.mp3",
   B5: "Samples/Harpsichord/B5.mp3",
   B6: "Samples/Harpsichord/B6.mp3",
   C3: "Samples/Harpsichord/C3.mp3",
   C5: "Samples/Harpsichord/C5.mp3",
   D2: "Samples/Harpsichord/D2.mp3",
   D4: "Samples/Harpsichord/D4.mp3",
   D6: "Samples/Harpsichord/D6.mp3",
   E1: "Samples/Harpsichord/E1.mp3",
   E3: "Samples/Harpsichord/E3.mp3",
   E5: "Samples/Harpsichord/E5.mp3",
   F2: "Samples/Harpsichord/F2.mp3",
   F4: "Samples/Harpsichord/F4.mp3",
   F6: "Samples/Harpsichord/F6.mp3",
   F7: "Samples/Harpsichord/F7.mp3",
   G1: "Samples/Harpsichord/G1.mp3",
   G3: "Samples/Harpsichord/G3.mp3",
   G5: "Samples/Harpsichord/G5.mp3",
    },
onload: () => registerInstrumentLoaded()
}).connect(harpsichordBus);

// --- TIMPANI (The Thunder) ---
export const timpani = new Tone.Players({
    urls: { 
         timpano1: "Samples/Timpani/Timpani1.mp3", 
         timpano2: "Samples/Timpani/Timpani2.mp3",
         timpano3: "Samples/Timpani/Timpani3.mp3",
         timpano4: "Samples/Timpani/Timpani4.mp3",
         timpano5: "Samples/Timpani/Timpani5.mp3"
    },
    release: 3,
    onload: () => registerInstrumentLoaded()
}).connect(timpaniBus);

export function setVolume(busName, dbValue) {
    const mixer = { violin: violinBus, viola: violaBus, doubleBass: doubleBassBus, timpani: timpaniBus, cello: celloBus, harpsichord: harpsichordBus };
    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

setVolume("violin", +2);
setVolume("viola", +2);
setVolume("cello", -2);
setVolume("doubleBass", +2);
setVolume("harpsichord", -6);
setVolume("timpani", +4);

export const orchestraInstruments = {
    violin,
    viola,
    cello,
    doubleBass,
    harpsichord,
    timpani,
    violinBus,
    violaBus,
    celloBus,
    doubleBassBus,
    harpsichordBus,
    timpaniBus,
    setVolume
};

export const orchestraVolumeMap = {
    violin: "Violino",
    viola: "Viola",
    doubleBass: "Contrabbasso",
    timpani: "Timpani",
    cello: "Violoncello",
    harpsichord: "Clavicembalo"
};

export { hallReverb };
