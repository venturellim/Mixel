// metalBass.js — nuovo engine basso per Tone.js 15
// Range sicuro: C1–C2 (24–36 MIDI)

import { bass } from "./common.js";
import { clampNote, pickFromScale } from "./common.js";

export function createBassEngine(analysis, rand) {

    const scale = analysis.scale;
    const root = analysis.key.root;      // tonica
    const brightness = analysis.brightness; // energia → attività
    const entropy = analysis.entropy;       // varietà melodica

    // Range sicuro
    const octave = 1; // C1–C2
    const MIN = 24;   // C1
    const MAX = 36;   // C2

    // Attività ritmica: immagini più luminose → basso più attivo
    // brightness 0 → suona ogni 4 step
    // brightness 1 → suona ogni step
    const activity = 1 + Math.floor((1 - brightness) * 3); // 1–4

    // Varietà melodica: immagini più complesse → più note diverse
    const variety = 1 + Math.floor(entropy * 3); // 1–4

    return function(time, step) {

        // ritmo: suona solo ogni "activity" step
        if (step % activity !== 0) return;

        // 70%: tonica
        // 30%: nota della scala (più entropy → più varietà)
        let note;
        if (rand() < 0.7) {
            note = root;
        } else {
            note = pickFromScale(scale, step + Math.floor(rand() * variety));
        }

        const fullNote = note + octave;
        const clamped = clampNote(fullNote, MIN, MAX);
        if (!clamped) return;

        bass.triggerAttackRelease(clamped, "4n", time);
    };
}
