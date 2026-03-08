// metalLead.js — nuovo engine lead per Tone.js 15
// Range sicuro: C2–E6 (36–88 MIDI)

import { guitarLead } from "./common.js";
import { clampNote, pickFromScale } from "./common.js";

export function createLeadEngine(analysis, rand) {

    const scale = analysis.scale;
    const entropy = analysis.entropy;       // complessità melodica
    const edges = analysis.edges;           // aggressività → velocità
    const texture = analysis.texture;       // varietà
    const brightness = analysis.brightness; // energia → note alte
    const symmetry = analysis.symmetry;     // pattern ripetuti

    // Range sicuro
    const MIN = 36; // C2
    const MAX = 88; // E6

    // Altezza media: immagini più complesse → lead più alto
    const baseOctave = 3 + Math.floor(entropy * 2); // C3–C5

    // Velocità: più edges → lead più veloce
    const speed = 1 + Math.floor(edges * 3); // 1–4

    // Varietà melodica: più texture → più note diverse
    const variety = 1 + Math.floor(texture * 3); // 1–4

    // Pattern deterministico basato su symmetry
    const patternType = Math.floor(symmetry * 3); // 0,1,2

    function applyPattern(step, note) {
        if (patternType === 0) {
            // pattern ripetuto
            return pickFromScale(scale, step % scale.length);
        }
        if (patternType === 1) {
            // alternanza
            return (step % 2 === 0) ? note : pickFromScale(scale, step + 1);
        }
        if (patternType === 2) {
            // salita/discesa
            const idx = (step + Math.floor(rand() * variety)) % scale.length;
            return scale[idx];
        }
        return note;
    }

    return function(time, step) {

        // ritmo: suona solo ogni "speed" step
        if (step % speed !== 0) return;

        // probabilità di suonare: più entropy → più note
        if (rand() > entropy) return;

        // nota base dalla scala
        let note = pickFromScale(scale, step + Math.floor(rand() * variety));

        // altezza: immagini più luminose → lead più alto
        let octave = baseOctave + (rand() < brightness * 0.5 ? 1 : 0);

        // applica pattern
        note = applyPattern(step, note);

        const fullNote = note + octave;
        const clamped = clampNote(fullNote, MIN, MAX);
        if (!clamped) return;

        guitarLead.triggerAttackRelease(clamped, "8n", time);
    };
}

