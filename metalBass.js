// metalBass.js — basso coerente con riffData, molto più presente

import { bass } from "./common.js";
import * as Tone from "https://esm.sh/tone";

export function createBassEngine(analysis, params, riffData, rand) {

    const beatsPerMeasure = riffData.beatsPerMeasure;
    const totalSteps = riffData.totalSteps;

    const MIN = 24; // C1
    const MAX = 36; // C2

    // ------------------------------------------------------------
    // Utility: clamp nota
    // ------------------------------------------------------------
    function clamp(note) {
        const midi = Tone.Frequency(note).toMidi();
        const clamped = Math.max(MIN, Math.min(MAX, midi));
        return Tone.Frequency(clamped, "midi").toNote();
    }

    // ------------------------------------------------------------
    // Densità per sezione (molto più alta)
    // ------------------------------------------------------------
    function getBassDensity(section) {
        if (section === "intro")  return 0.7;
        if (section === "verse")  return 0.85;
        if (section === "chorus") return 0.95;
        if (section === "solo")   return 0.8;
        if (section === "outro")  return 0.6;
        return 0.8;
    }

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------
    return function bassEngine(time, step) {

        const idx = step % totalSteps;

        const chord = riffData.chordTimeline[idx];
        const section = riffData.sectionTimeline[idx];

        const stepInMeasure = idx % beatsPerMeasure;

        if (!chord) return;

        // Fondamentale dell’accordo, un’ottava sotto
        const root = chord[0];
        const rootMidi = Tone.Frequency(root).toMidi();
        const bassNote = Tone.Frequency(rootMidi - 12, "midi").toNote();
        const clamped = clamp(bassNote);

        // Densità per sezione
        const density = getBassDensity(section);

        // Suona SEMPRE su ogni 8n (stepInMeasure % 1 === 0)
        if (stepInMeasure % 1 === 0) {
            bass.triggerAttackRelease(clamped, "8n", time);
        }

        // Ghost notes su 16n (solo se la sezione è energica)
        if (rand() < density * 0.3) {
            const ghostTime = time + Tone.Time("16n").toSeconds() * 0.5;
            bass.triggerAttackRelease(clamped, "16n", ghostTime);
        }
    };
}
