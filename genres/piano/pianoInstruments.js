// pianoInstruments.js - FIX VER 001.2
import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded } from "../../common.js";

console.log("pianoInstruments.js ver. 001.2 loaded");

// 1. Creiamo prima il Bus e gli Effetti
export const pianoBus = new Tone.Gain(1).connect(masterEQ);

const pianoReverb = new Tone.Reverb({
    decay: 3.5,
    wet: 0.35
}).connect(pianoBus);

// 2. Creiamo il campionatore (Senza chiamare .connect(pianoBus) subito fuori)
export const piano = new Tone.Sampler({
    urls: {
        "A0": "A0.mp3", "C1": "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
        "A1": "A1.mp3", "C2": "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
        "A2": "A2.mp3", "C3": "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
        "A3": "A3.mp3", "C4": "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
        "A4": "A4.mp3", "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
        "A5": "A5.mp3", "C6": "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
        "A7": "A7.mp3", "C8": "C8.mp3"
    },
    release: 1.2,
    baseUrl: "https://tonejs.github.io/audio/salamander/",
    onload: () => {
        registerInstrumentLoaded();
        console.log("🎹 Salamander C5 caricato correttamente");
    }
}).connect(pianoReverb); // Connettiamo al riverbero che va al bus

// 3. Esportiamo gli oggetti per il Mixer (DOPO che tutto è stato dichiarato)
export const pianoInstruments = {
    setVolume: (busName, dbValue) => {
        if (busName === "piano") {
            // Usiamo Tone.dbToGain per convertire i dB dello slider in guadagno reale
            pianoBus.gain.rampTo(Tone.dbToGain(dbValue), 0.1);
        }
    }
};

export const pianoVolumeMap = {
    piano: "Pianoforte"
};
