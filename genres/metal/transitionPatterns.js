// transitionPatterns.js — versione 002
// Transizioni power metal musicali (1 misura), niente mitragliatrice

import { nearestNatural } from "../../utils/harmonyUtils.js";

console.log("transitionPatterns.js ver. 002 loaded");

// ============================================================
// UTILITIES
// ============================================================

function toLetter(note) {
    return nearestNatural(note)[0];
}

function buildDescendingScale(fromNote, toNote, scale) {
    const letters = scale.map(n => toLetter(n));
    const startIndex = letters.indexOf(toLetter(fromNote));
    const endIndex   = letters.indexOf(toLetter(toNote));

    if (startIndex === -1 || endIndex === -1) return [toLetter(fromNote)];

    if (startIndex <= endIndex) {
        return letters.slice(startIndex, endIndex + 1);
    }

    return letters.slice(endIndex, startIndex + 1).reverse();
}

function buildAscendingScale(fromNote, toNote, scale) {
    const letters = scale.map(n => toLetter(n));
    const startIndex = letters.indexOf(toLetter(fromNote));
    const endIndex   = letters.indexOf(toLetter(toNote));

    if (startIndex === -1 || endIndex === -1) return [toLetter(fromNote)];

    if (startIndex >= endIndex) {
        return letters.slice(endIndex, startIndex + 1);
    }

    return letters.slice(startIndex, endIndex + 1);
}

function buildPowerWalk(root, scale) {
    const letters = scale.map(n => toLetter(n));
    const rootIndex = letters.indexOf(toLetter(root));

    if (rootIndex === -1) return [toLetter(root)];

    const third = letters[(rootIndex + 2) % letters.length];
    const fifth = letters[(rootIndex + 4) % letters.length];
    const octave = letters[rootIndex];

    return [toLetter(root), third, fifth, octave];
}

// ============================================================
// TRANSIZIONI
// ============================================================
//
// Regole:
// - Tutte le transizioni melodiche durano 4 beat (1 misura)
// - Ritmi lenti: 4n o 8n
// - Melodiche → guitarOpen
// - Ritmiche → guitarPalm
//

export const transitionPatterns = {

    // ============================================================
    // TRANSIZIONI STATICHE (palm)
    // ============================================================

    // 1) Gallop 9 colpi → ora 1 misura, 3 colpi per beat
    gallop_9: {
        name: "gallop_9",
        durationBeats: 4,
        rhythmicPattern: [
            0.00, 0.33, 0.66,
            1.00, 1.33, 1.66,
            2.00, 2.33, 2.66,
            3.00, 3.33, 3.66
        ],
        melodicPattern: (fromNote) => Array(12).fill(toLetter(fromNote)),
        description: "Gallop continuo per 1 misura"
    },

    // 2) Tremolo burst → 1 misura, 8 colpi totali (8n)
    tremolo_burst: {
        name: "tremolo_burst",
        durationBeats: 4,
        rhythmicPattern: [
            0.0, 0.5,
            1.0, 1.5,
            2.0, 2.5,
            3.0, 3.5
        ],
        melodicPattern: (fromNote) => Array(8).fill(toLetter(fromNote)),
        description: "8 colpi regolari (8n) sulla nota di partenza"
    },

    // 3) Syncopated hits → 1 misura, 4 colpi
    syncopated_hits: {
        name: "syncopated_hits",
        durationBeats: 4,
        rhythmicPattern: [0.0, 1.5, 2.5, 3.0],
        melodicPattern: (fromNote) => [
            toLetter(fromNote),
            toLetter(fromNote),
            toLetter(fromNote),
            toLetter(fromNote)
        ],
        description: "4 colpi sincopati"
    },

    // ============================================================
    // TRANSIZIONI MELODICHE (open)
    // ============================================================

    // 4) Scala discendente → 4 note, 1 per beat (4n)
    scale_down: {
        name: "scale_down",
        durationBeats: 4,
        rhythmicPattern: [0.0, 1.0, 2.0, 3.0],
        melodicPattern: (fromNote, toNote, scale) =>
            buildDescendingScale(fromNote, toNote, scale),
        description: "Scala discendente lenta (4n)"
    },

    // 5) Scala ascendente → 4 note, 1 per beat
    scale_up: {
        name: "scale_up",
        durationBeats: 4,
        rhythmicPattern: [0.0, 1.0, 2.0, 3.0],
        melodicPattern: (fromNote, toNote, scale) =>
            buildAscendingScale(fromNote, toNote, scale),
        description: "Scala ascendente lenta (4n)"
    },

    // 6) Power walk → 4 note, 1 per beat
    power_walk: {
        name: "power_walk",
        durationBeats: 4,
        rhythmicPattern: [0.0, 1.0, 2.0, 3.0],
        melodicPattern: (fromNote, toNote, scale) =>
            buildPowerWalk(fromNote, scale),
        description: "Root → 3rd → 5th → octave (4n)"
    },

    // ============================================================
    // TRANSIZIONI ARMONICHE (open)
    // ============================================================

    // 7) Power chord slide → 1 misura, colpo all'inizio
    power_slide: {
        name: "power_slide",
        durationBeats: 4,
        rhythmicPattern: [0.0],
        melodicPattern: (fromNote, toNote) => [
            toLetter(fromNote),
            toLetter(toNote)
        ],
        description: "Slide lento tra due power chord"
    },

    // 8) Open chord hit → 1 misura, colpo all'inizio
    open_hit: {
        name: "open_hit",
        durationBeats: 4,
        rhythmicPattern: [0.0],
        melodicPattern: (fromNote, toNote) => [toLetter(toNote)],
        description: "Colpo singolo sul power chord di arrivo"
    }
};
