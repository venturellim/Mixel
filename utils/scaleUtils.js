//
// scaleUtils.js
// Modulo universale per la gestione delle scale musicali.
// Contiene:
// - pattern delle scale
// - generazione scale da tonalCenter
// - funzioni per ottenere note MIDI da scale
// - funzioni per ottenere gradi, salti, note vicine


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

    // Genera la scala nell’ottava del tonal center
    const scale = pattern.map(semi => midiToNote(baseMidi + semi));

    // Rimuove eventuali duplicati (es. enharmonici)
    return [...new Set(scale)];
}

// ============================================================
// 🎵 OTTENERE NOTE MIDI DA UNA SCALA
// ============================================================

export function getScaleDegree(scale, degree, octaveShift = 0) {
    if (!scale.length) return null;

    const note = scale[degree % scale.length];
    const midi = noteToMidi(note) + octaveShift * 12;

    return midiToNote(midi);
}

// ============================================================
// 🎶 OTTENERE NOTE VICINE NELLA SCALA
// ============================================================

export function getNeighborNote(scale, currentNote, direction = 1) {
    if (!scale.length) return currentNote;

    const midi = noteToMidi(currentNote);

    let bestIndex = 0;
    let bestDist = Infinity;

    for (let i = 0; i < scale.length; i++) {
        const dist = Math.abs(noteToMidi(scale[i]) - midi);
        if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
        }
    }

    const nextIndex = (bestIndex + direction + scale.length) % scale.length;
    return scale[nextIndex];
}

// ============================================================
// 🎹 OTTENERE NOTE RANDOM DALLA SCALA
// ============================================================

export function randomNoteFromScale(scale, rand) {
    if (!scale.length) return null;
    const idx = Math.floor(rand() * scale.length);
    return scale[idx];
}

// ============================================================
// 🎼 OTTENERE NOTE ENTRO UN RANGE MIDI (VERSIONE MIGLIORATA)
// ============================================================
//
// La versione originale generava 7 ottave per ogni nota e collassava la scala.
// Questa versione:
// - mantiene la forma della scala
// - estende solo ±2 ottave
// - evita duplicati
// - evita note fuori range
//

export function scaleWithinRange(scale, minMidi, maxMidi) {
    if (!scale.length) return [];

    const result = [];

    for (let note of scale) {
        const baseMidi = noteToMidi(note);

        // Estensione controllata: solo ±2 ottave
        for (let shift = -24; shift <= 24; shift += 12) {
            const midi = baseMidi + shift;
            if (midi >= minMidi && midi <= maxMidi) {
                result.push(midiToNote(midi));
            }
        }
    }

    // Rimuove duplicati
    const unique = [...new Set(result)];

    // Ordina per altezza
    return unique.sort((a, b) => noteToMidi(a) - noteToMidi(b));
}

// ============================================================
// 🎵 OTTENERE NOTE PER ARPEGGI
// ============================================================

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

export function melodicStep(scale, currentNote, step) {
    if (!scale.length) return currentNote;

    const midi = noteToMidi(currentNote);

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
