//
// scaleUtils.js
// Modulo universale per la gestione delle scale musicali.
// Contiene:
// - pattern delle scale
// - generazione scale da tonalCenter
// - funzioni per ottenere note MIDI da scale
// - funzioni per ottenere gradi, salti, note vicine
//
// Nessuna logica di genere.
// Nessuna dipendenza da strumenti.
//

import { noteToMidi, midiToNote, SCALE_PATTERNS } from "./harmonyUtils.js";

console.log("scaleUtils.js loaded");

// ============================================================
// 🎼 COSTRUZIONE SCALE DA TONAL CENTER
// ============================================================
//
// tonalCenter: "E4", "A3", ecc.
// patternName: "naturalMinor", "harmonicMinor", "major", ecc.
//

export function buildScaleFromTonic(tonalCenter, patternName) {
    const baseMidi = noteToMidi(tonalCenter);
    const pattern = SCALE_PATTERNS[patternName];

    if (!pattern) {
        console.warn("Pattern scala non trovato:", patternName);
        return [];
    }

    return pattern.map(semi => midiToNote(baseMidi + semi));
}


// ============================================================
// 🎵 OTTENERE NOTE MIDI DA UNA SCALA
// ============================================================
//
// scale: array di note ["E4","F#4","G4",...]
// degree: indice (0 = tonica, 1 = secondo grado, ecc.)
// octaveShift: sposta la nota di ottave (+1, -1, ecc.)
//

export function getScaleDegree(scale, degree, octaveShift = 0) {
    if (!scale.length) return null;

    const note = scale[degree % scale.length];
    const midi = noteToMidi(note) + octaveShift * 12;

    return midiToNote(midi);
}


// ============================================================
// 🎶 OTTENERE NOTE VICINE NELLA SCALA
// ============================================================
//
// Utile per lead melodiche, arpeggi, linee di basso.
//

export function getNeighborNote(scale, currentNote, direction = 1) {
    const midi = noteToMidi(currentNote);

    // Trova il grado più vicino
    let bestIndex = 0;
    let bestDist = Infinity;

    for (let i = 0; i < scale.length; i++) {
        const dist = Math.abs(noteToMidi(scale[i]) - midi);
        if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
        }
    }

    // Nota vicina nella direzione scelta
    const nextIndex = (bestIndex + direction + scale.length) % scale.length;
    return scale[nextIndex];
}


// ============================================================
// 🎹 OTTENERE NOTE RANDOM DALLA SCALA
// ============================================================
//
// rand: funzione random deterministica (seeded)
//

export function randomNoteFromScale(scale, rand) {
    if (!scale.length) return null;
    const idx = Math.floor(rand() * scale.length);
    return scale[idx];
}


// ============================================================
// 🎼 OTTENERE NOTE ENTRO UN RANGE MIDI
// ============================================================
//
// Utile per basso, pad, arpeggi, riff.
//

export function scaleWithinRange(scale, minMidi, maxMidi) {
    const result = [];

    for (let note of scale) {
        const midi = noteToMidi(note);

        // Estendi la scala su più ottave
        for (let octaveShift = -3; octaveShift <= 3; octaveShift++) {
            const shifted = midi + octaveShift * 12;
            if (shifted >= minMidi && shifted <= maxMidi) {
                result.push(midiToNote(shifted));
            }
        }
    }

    // Ordina per altezza
    return result.sort((a, b) => noteToMidi(a) - noteToMidi(b));
}


// ============================================================
// 🎵 OTTENERE NOTE PER ARPEGGI
// ============================================================
//
// pattern: array di indici [0,2,4,2] ecc.
// octaveShift: sposta tutto l'arpeggio
//

export function buildArpeggio(scale, pattern, octaveShift = 0) {
    return pattern.map(step => {
        const note = scale[step % scale.length];
        const midi = noteToMidi(note) + octaveShift * 12;
        return midiToNote(midi);
    });
}


// ============================================================
// 🎶 OTTENERE NOTE PER LINEE MELODICHE
// ============================================================
//
// Usa la scala ma permette salti controllati.
//

export function melodicStep(scale, currentNote, step) {
    const midi = noteToMidi(currentNote);

    // Trova il grado più vicino
    let bestIndex = 0;
    let bestDist = Infinity;

    for (let i = 0; i < scale.length; i++) {
        const dist = Math.abs(noteToMidi(scale[i]) - midi);
        if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
        }
    }

    const nextIndex = (bestIndex + step + scale.length) % scale.length;
    return scale[nextIndex];
}
