// metalRiff.js — versione sicura compatibile con Tone.js 15
// Riff engine basato su imageAnalysis + range sicuro C2–C3

import { clampNote, pickFromScale, guitarPalm, guitarOpen } from "./common.js";

export function generateMetalRiff(analysis, rand) {

    // ============================
    // 1) SCALE FALLBACK SICURO
    // ============================
    let scale = analysis.scale;

    if (!scale || !Array.isArray(scale) || scale.length === 0) {
        console.warn("⚠️ SCALA VUOTA — uso fallback C minor");
        scale = ["C", "D", "Eb", "F", "G", "Ab", "Bb"];
    }

    // ============================
    // 2) PARAMETRI ANALISI
    // ============================
    const texture = analysis.texture;
    const contrast = analysis.contrast;
    const entropy = analysis.entropy;
    const symmetry = analysis.symmetry;

    // ============================
    // 3) PARAMETRI MUSICALI
    // ============================
    const length = 16; // 1 misura in 16th
    const riff = [];

    const octave = 2;
    const MIN = 36; // C2
    const MAX = 48; // C3

    const density = 1 + Math.floor(texture * 3); // 1–4
    const palmRatio = contrast;
    const melodicVariety = 1 + Math.floor(entropy * 3);
    const patternType = Math.floor(symmetry * 3); // 0,1,2

    // ============================
    // 4) FUNZIONI DI SUPPORTO
    // ============================

    function chooseNote(step) {
        // 70%: nota della scala
        if (rand() < 0.7) {
            const idx = step + Math.floor(rand() * melodicVariety);
            const n = pickFromScale(scale, idx);

            if (!n) return null;
            return n;
        }

        // 30%: nota casuale della scala
        const n = scale[Math.floor(rand() * scale.length)];
        return n || null;
    }

    function applyPattern(step, note) {
        if (!note) return null;

        if (patternType === 0) {
            return scale[0] || note;
        }
        if (patternType === 1) {
            return (step % 2 === 0) ? (scale[0] || note) : note;
        }
        if (patternType === 2) {
            if (step % 4 === 0) return scale[0] || note;
            if (step % 4 === 1) return scale[0] || note;
            if (step % 4 === 2) return note;
            return scale[0] || note;
        }

        return note;
    }

    // ============================
    // 5) GENERAZIONE RIFF
    // ============================

    for (let i = 0; i < length; i++) {

        // densità: se texture è bassa, alcuni step sono silenziosi
        if (i % (4 - density) !== 0) {
            riff.push(null);
            continue;
        }

        let note = chooseNote(i);
        if (!note) {
            riff.push(null);
            continue;
        }

        note = applyPattern(i, note);
        if (!note) {
            riff.push(null);
            continue;
        }

        const fullNote = note + octave;

        // sicurezza: fullNote deve essere stringa valida
        if (typeof fullNote !== "string") {
            riff.push(null);
            continue;
        }

        const clamped = clampNote(fullNote, MIN, MAX);

        // clampNote può restituire null → silenzio
        riff.push(clamped);
    }

    return riff;
}
