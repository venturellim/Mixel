// metalRiff.js — nuova versione compatibile con Tone.js 15
// Riff engine basato su imageAnalysis + range sicuro C2–C3

import { clampNote, pickFromScale, guitarPalm, guitarOpen } from "./common.js";

export function generateMetalRiff(analysis, rand) {

    const scale = analysis.scale;
    const texture = analysis.texture;       // complessità ritmica
    const contrast = analysis.contrast;     // palm vs open
    const entropy = analysis.entropy;       // varietà melodica
    const symmetry = analysis.symmetry;     // pattern ripetuti
    const brightness = analysis.brightness; // energia
    const edges = analysis.edges;           // aggressività

    const length = 16; // 1 misura in 16th
    const riff = [];

    // Range sicuro: C2–C3
    const octave = 2;
    const MIN = 36; // C2
    const MAX = 48; // C3

    // Densità ritmica: più texture → più note
    const density = 1 + Math.floor(texture * 3); // 1–4

    // Palm ratio: più contrasto → più palm mute
    const palmRatio = contrast;

    // Varietà melodica: più entropy → più note diverse
    const melodicVariety = 1 + Math.floor(entropy * 3);

    // Pattern base deterministico
    const patternType = Math.floor(symmetry * 3); // 0,1,2

    function chooseNote(step) {
        // 70%: nota della scala
        if (rand() < 0.7) {
            return pickFromScale(scale, step + Math.floor(rand() * melodicVariety));
        }

        // 30%: nota casuale della scala
        return scale[Math.floor(rand() * scale.length)];
    }

    function applyPattern(step, note) {
        if (patternType === 0) {
            // pedal pattern
            return scale[0];
        }
        if (patternType === 1) {
            // alternanza
            return (step % 2 === 0) ? scale[0] : note;
        }
        if (patternType === 2) {
            // gallop
            if (step % 4 === 0) return scale[0];
            if (step % 4 === 1) return scale[0];
            if (step % 4 === 2) return note;
            return scale[0];
        }
        return note;
    }

    for (let i = 0; i < length; i++) {

        // densità: se texture è bassa, alcuni step sono silenziosi
        if (i % (4 - density) !== 0) {
            riff.push(null);
            continue;
        }

        let note = chooseNote(i);
        note = applyPattern(i, note);

        const fullNote = note + octave;
        const clamped = clampNote(fullNote, MIN, MAX);

        riff.push(clamped);
    }

    return riff;
}
