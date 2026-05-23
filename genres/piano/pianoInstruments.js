// pianoInstruments.js — PIANO ENGINE (nuova architettura B2)
import * as Tone from "https://esm.sh/tone";
import { masterEQ } from "../../common.js";

// Import strumenti unificati
import {
    grandPiano,
    normalizeNote
} from "../../utils/mixelInstruments.js";

console.log("pianoInstruments.js — unified version loaded");

// ============================================================================
// 🎚 BUS PIANO
// ============================================================================

// Bus principale → Master
export const pianoBus = new Tone.Gain(1).connect(masterEQ);

// Bus separati per mano sinistra e destra
export const lhBus = new Tone.Gain(1).connect(pianoBus);
export const rhBus = new Tone.Gain(1).connect(pianoBus);

// ============================================================================
// 🎧 RIVERBERO PIANO
// ============================================================================
const pianoReverb = new Tone.Reverb({
    decay: 3.5,
    wet: 0.35
}).connect(pianoBus);

// ============================================================================
// 🔌 ROUTING STRUMENTO → BUS
// ============================================================================
grandPiano.disconnect().connect(pianoReverb);

// ============================================================================
// 🎚 SET VOLUME (per UI)
// ============================================================================
export function setVolume(busName, dbValue) {
    const gain = Tone.dbToGain(dbValue);

    if (busName === "pianoLH") lhBus.gain.rampTo(gain, 0.1);
    if (busName === "pianoRH") rhBus.gain.rampTo(gain, 0.1);
}

// ============================================================================
// 📦 EXPORT
// ============================================================================
export const pianoInstruments = {
    grandPiano,
    pianoBus, lhBus, rhBus,
    setVolume
};

export const pianoVolumeMap = {
    pianoLH: "Piano (Bassi/SX)",
    pianoRH: "Piano (Melodia/DX)"
};

export { grandPiano, normalizeNote };
