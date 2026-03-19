//
// harmonyUtils.js
// Modulo armonico universale per tutti i generi.
// Contiene:
// - conversioni nota ↔ midi
// - intervalli
// - trasposizioni
// - costruzione accordi
// - tonalità
//
// Nessuna logica di genere.
// Nessuna dipendenza da strumenti o sampler.
//

import * as Tone from "https://esm.sh/tone";

console.log("harmonyUtils.js loaded");

// ============================================================
// 🎵 MAPPATURE NOTE ↔ SEMITONI
// ============================================================

// Nota → semitono (classe di pitch)
export const NOTE_TO_SEMITONE = {
    "C": 0,  "C#": 1, "Db": 1,
    "D": 2,  "D#": 3, "Eb": 3,
    "E": 4,
    "F": 5,  "F#": 6, "Gb": 6,
    "G": 7,  "G#": 8, "Ab": 8,
    "A": 9,  "A#": 10, "Bb": 10,
    "B": 11
};

// Semitono → nota (preferenza diesis)
export const SEMITONE_TO_NOTE = [
    "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B"
];


// ============================================================
// 🎼 CONVERSIONI NOTA ↔ MIDI
// ============================================================

// Converte "C4" → 60
export function noteToMidi(note) {
    return Tone.Frequency(note).toMidi();
}

// Converte 60 → "C4"
export function midiToNote(midi) {
    return Tone.Frequency(midi, "midi").toNote();
}


// ============================================================
// 🎯 INTERVALLI & TRASPOSIZIONI
// ============================================================

// Trasposizione di una nota di N semitoni
export function transpose(note, semitones) {
    const midi = noteToMidi(note);
    return midiToNote(midi + semitones);
}

// Calcola intervallo in semitoni tra due note
export function interval(note1, note2) {
    return noteToMidi(note2) - noteToMidi(note1);
}

// Aggiunge un intervallo a una nota
export function addInterval(note, semitones) {
    return transpose(note, semitones);
}


// ============================================================
// 🎹 COSTRUZIONE SCALE
// ============================================================

// Pattern scale (in semitoni)
export const SCALE_PATTERNS = {
    naturalMinor:  [0, 2, 3, 5, 7, 8, 10],
    harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
    major:         [0, 2, 4, 5, 7, 9, 11],
    dorian:        [0, 2, 3, 5, 7, 9, 10],
    phrygian:      [0, 1, 3, 5, 7, 8, 10],
    lydian:        [0, 2, 4, 6, 7, 9, 11],
    mixolydian:    [0, 2, 4, 5, 7, 9, 10],
    locrian:       [0, 1, 3, 5, 6, 8, 10]
};

// Costruisce una scala a partire da una tonica e un pattern
export function buildScale(tonic, patternName) {
    const baseMidi = noteToMidi(tonic);
    const pattern = SCALE_PATTERNS[patternName];

    if (!pattern) {
        console.warn("Pattern scala non trovato:", patternName);
        return [];
    }

    return pattern.map(semi => midiToNote(baseMidi + semi));
}


// ============================================================
// 🎶 COSTRUZIONE ACCORDI
// ============================================================

// Pattern accordi (in semitoni)
export const CHORD_PATTERNS = {
    minor:      [0, 3, 7],
    major:      [0, 4, 7],
    diminished: [0, 3, 6],
    augmented:  [0, 4, 8],
    sus2:       [0, 2, 7],
    sus4:       [0, 5, 7],
    minor7:     [0, 3, 7, 10],
    major7:     [0, 4, 7, 11],
    dominant7:  [0, 4, 7, 10]
};

// Costruisce un accordo
export function buildChord(root, chordType) {
    const baseMidi = noteToMidi(root);
    const pattern = CHORD_PATTERNS[chordType];

    if (!pattern) {
        console.warn("Tipo di accordo non trovato:", chordType);
        return [];
    }

    return pattern.map(semi => midiToNote(baseMidi + semi));
}


// ============================================================
// 🎼 TONALITÀ & FUNZIONI ARMONICHE
// ============================================================

// Restituisce la tonica naturale più vicina a una nota
export function nearestNatural(note) {
    const midi = noteToMidi(note);
    const semitone = midi % 12;

    // Nota naturale più vicina
    const naturals = ["C", "D", "E", "F", "G", "A"];
    let best = "C";
    let bestDist = Infinity;

    for (const n of naturals) {
        const dist = Math.abs(NOTE_TO_SEMITONE[n] - semitone);
        if (dist < bestDist) {
            bestDist = dist;
            best = n;
        }
    }

    // Manteniamo l'ottava originale
    const octave = Math.floor(midi / 12) - 1;
    return best + octave;
}

// Determina se una nota appartiene a una scala
export function isNoteInScale(note, scale) {
    const midi = noteToMidi(note);
    return scale.some(s => noteToMidi(s) === midi);
}

// Trova la nota della scala più vicina
export function nearestNoteInScale(note, scale) {
    const midi = noteToMidi(note);

    let best = scale[0];
    let bestDist = Infinity;

    for (const s of scale) {
        const dist = Math.abs(noteToMidi(s) - midi);
        if (dist < bestDist) {
            bestDist = dist;
            best = s;
        }
    }

    return best;
}
