// pianoInstruments.js — ver. 002 (solo routing e volumi)
import * as Tone from "https://esm.sh/tone";
import { masterEQ } from "../../common.js";
import { piano, normalizeNote } from "../../utils/mixelInstruments.js";

console.log("pianoInstruments.js ver. 002 loaded");

// ============================================================
// BUS PIANO
// ============================================================
export const pianoBus = new Tone.Gain(1).connect(masterEQ);
export const lhBus = new Tone.Gain(1).connect(pianoBus);
export const rhBus = new Tone.Gain(1).connect(pianoBus);

const pianoReverb = new Tone.Reverb({
    decay: 3.5, wet: 0.35
}).connect(pianoBus);

// ============================================================
// RICONNETTI PIANO AL BUS
// ============================================================
piano.disconnect().connect(pianoReverb);

// ============================================================
// SET VOLUME
// ============================================================
export const pianoInstruments = {
    piano,
    pianoBus, lhBus, rhBus,
    setVolume: (busName, dbValue) => {
        const gain = Tone.dbToGain(dbValue);
        if (busName === "pianoLH") lhBus.gain.rampTo(gain, 0.1);
        if (busName === "pianoRH") rhBus.gain.rampTo(gain, 0.1);
    }
};

export const pianoVolumeMap = {
    pianoLH: "Piano (Bassi/SX)",
    pianoRH: "Piano (Melodia/DX)"
};

export { normalizeNote };