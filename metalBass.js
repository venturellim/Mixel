// metalBass.js — nuovo engine basso per Tone.js 15
// Range sicuro: C1–C2 (24–36 MIDI)

import { bass } from "./common.js";
import { clampNote, pickFromScale } from "./common.js";

console.log("BASS STEP", step);

export function createBassEngine(analysis, rand) {

    const scale = analysis.scale;
    const root = analysis.key; // <-- FIX QUI
    const brightness = analysis.brightness;
    const entropy = analysis.entropy;

    const octave = 1;
    const MIN = 24;
    const MAX = 36;

    const activity = 1 + Math.floor((1 - brightness) * 3);
    const variety = 1 + Math.floor(entropy * 3);

    return function(time, step) {

        if (step % activity !== 0) return;

        let note;
        if (rand() < 0.7) {
            note = root; // "G"
        } else {
            note = pickFromScale(scale, step + Math.floor(rand() * variety));
        }

        if (!note) return;

        const fullNote = note + octave; // "G1"
        const clamped = clampNote(fullNote, MIN, MAX);
        if (!clamped) return;

        bass.triggerAttackRelease(clamped, "4n", time);
    };
}
