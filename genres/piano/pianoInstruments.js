// pianoInstruments.js - VER 014 (Multi-Bus)
import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded } from "../../common.js";

console.log("pianoInstruments.js ver. 014.1 loaded");

// 1. Bus Principale e Effetti
export const pianoBus = new Tone.Gain(1).connect(masterEQ);

// 2. Bus Specifici per le Mani
export const lhBus = new Tone.Gain(1).connect(pianoBus); // Canale Sinistra
export const rhBus = new Tone.Gain(1).connect(pianoBus); // Canale Destra

const pianoReverb = new Tone.Reverb({
    decay: 3.5,
    wet: 0.35
}).connect(pianoBus);

// 3. Campionatore Salamander C5
export function createPiano() {

    const sampler = new Tone.Sampler({
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
        baseUrl: "Samples/Piano/",
        onload: () => registerInstrumentLoaded("Pianoforte")
    }).connect(pianoReverb);

    return sampler;
}

// 4. Interfaccia per il Mixer Dinamico
export async function loadPianoPack() {

    const piano = createPiano();

    return {
        piano,

        // Bus
        pianoBus,
        lhBus,
        rhBus,

        // Mixer
        setVolume: (busName, dbValue) => {
            const gain = Tone.dbToGain(dbValue);
            if (busName === "pianoLH") lhBus.gain.rampTo(gain, 0.1);
            if (busName === "pianoRH") rhBus.gain.rampTo(gain, 0.1);
        }
    };
}

export const pianoVolumeMap = {
    pianoLH: "Piano (Bassi/SX)",
    pianoRH: "Piano (Melodia/DX)"
};
