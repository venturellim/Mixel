// transitionPatterns.js — versione 001
// Pattern di transizione per riffEngine, bassEngine e drumEngine

import { nearestNatural } from "../../utils/harmonyUtils.js";

console.log("transitionPatterns.js ver. 001 loaded");

// ============================================================
// UTILITIES
// ============================================================

// Converte una nota (es. "C3") in lettera naturale ("C")
function toLetter(note) {
    return nearestNatural(note)[0];
}

// Genera una scala discendente tra due note naturali
function buildDescendingScale(fromNote, toNote, scale) {
    const letters = scale.map(n => toLetter(n));
    const startIndex = letters.indexOf(toLetter(fromNote));
    const endIndex   = letters.indexOf(toLetter(toNote));

    if (startIndex === -1 || endIndex === -1) return [toLetter(fromNote)];

    if (startIndex <= endIndex) {
        // già discendente o uguale
        return letters.slice(startIndex, endIndex + 1);
    }

    return letters.slice(endIndex, startIndex + 1).reverse();
}

// Genera una scala ascendente
function buildAscendingScale(fromNote, toNote, scale) {
    const letters = scale.map(n => toLetter(n));
    const startIndex = letters.indexOf(toLetter(fromNote));
    const endIndex   = letters.indexOf(toLetter(toNote));

    if (startIndex === -1 || endIndex === -1) return [toLetter(fromNote)];

    if (startIndex >= endIndex) {
        // già ascendente o uguale
        return letters.slice(endIndex, startIndex + 1);
    }

    return letters.slice(startIndex, endIndex + 1);
}

// Power walk: root → 3rd → 5th → octave
function buildPowerWalk(root, scale) {
    const letters = scale.map(n => toLetter(n));
    const rootIndex = letters.indexOf(toLetter(root));

    if (rootIndex === -1) return [toLetter(root)];

    const third = letters[(rootIndex + 2) % letters.length];
    const fifth = letters[(rootIndex + 4) % letters.length];
    const octave = letters[rootIndex]; // stessa lettera, ottava superiore gestita dal sampler

    return [toLetter(root), third, fifth, octave];
}

// ============================================================
// STRUTTURA DATI TRANSIZIONE
// ============================================================
//
// Ogni transizione ha:
// - name
// - durationBeats
// - rhythmicPattern (offset in beat)
// - melodicPattern (funzione)
// - description (per debug)
//

// ============================================================
// TRANSIZIONI RITMICHE (palm-style)
// ============================================================

export const transitionPatterns = {

    // 1) Gallop 9 colpi (Hunting High and Low)
    gallop_9: {
        name: "gallop_9",
        durationBeats: 1,
        rhythmicPattern: [
            0.00, 0.125, 0.25,
            0.375, 0.50, 0.625,
            0.75, 0.875, 1.00
        ],
        melodicPattern: (fromNote, toNote, scale) => {
            return Array(9).fill(toLetter(fromNote));
        },
        description: "9 colpi equidistanti sulla nota di partenza"
    },

    // 2) Tremolo burst
    tremolo_burst: {
        name: "tremolo_burst",
        durationBeats: 1,
        rhythmicPattern: [
            0.00, 0.0625, 0.125, 0.1875,
            0.25, 0.3125, 0.375, 0.4375
        ],
        melodicPattern: (fromNote) => Array(8).fill(toLetter(fromNote)),
        description: "8 colpi rapidissimi sulla nota di partenza"
    },

    // 3) Syncopated hits
    syncopated_hits: {
        name: "syncopated_hits",
        durationBeats: 1,
        rhythmicPattern: [0.0, 0.5, 0.75],
        melodicPattern: (fromNote) => [
            toLetter(fromNote),
            toLetter(fromNote),
            toLetter(fromNote)
        ],
        description: "3 colpi sincopati"
    },

    // ============================================================
    // TRANSIZIONI MELODICHE (open-style)
    // ============================================================

    // 4) Scala discendente (It’s a Mystery)
    scale_down: {
        name: "scale_down",
        durationBeats: 1,
        rhythmicPattern: [0.0, 0.25, 0.5, 0.75],
        melodicPattern: (fromNote, toNote, scale) =>
            buildDescendingScale(fromNote, toNote, scale),
        description: "Scala discendente dalla nota di partenza a quella di arrivo"
    },

    // 5) Scala ascendente
    scale_up: {
        name: "scale_up",
        durationBeats: 1,
        rhythmicPattern: [0.0, 0.25, 0.5, 0.75],
        melodicPattern: (fromNote, toNote, scale) =>
            buildAscendingScale(fromNote, toNote, scale),
        description: "Scala ascendente dalla nota di partenza a quella di arrivo"
    },

    // 6) Power walk
    power_walk: {
        name: "power_walk",
        durationBeats: 1,
        rhythmicPattern: [0.0, 0.25, 0.5, 0.75],
        melodicPattern: (fromNote, toNote, scale) =>
            buildPowerWalk(fromNote, scale),
        description: "Root → 3rd → 5th → octave"
    },

    // ============================================================
    // TRANSIZIONI ARMONICHE
    // ============================================================

    // 7) Power chord slide
    power_slide: {
        name: "power_slide",
        durationBeats: 1,
        rhythmicPattern: [0.0],
        melodicPattern: (fromNote, toNote) => [toLetter(fromNote), toLetter(toNote)],
        description: "Slide dal power chord di partenza a quello di arrivo"
    },

    // 8) Open chord hit
    open_hit: {
        name: "open_hit",
        durationBeats: 1,
        rhythmicPattern: [0.0],
        melodicPattern: (fromNote, toNote) => [toLetter(toNote)],
        description: "Colpo singolo sul power chord della nota di arrivo"
    }
};
