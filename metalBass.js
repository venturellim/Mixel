// metalBass.js — basso coerente con riffData, denso e musicale

import { bass } from "./common.js";
import * as Tone from "https://esm.sh/tone";

export function createBassEngine(analysis, params, riffData, rand) {

    const beatsPerMeasure = riffData.beatsPerMeasure;
    const totalSteps = riffData.totalSteps;

    const rhythm = params.rhythm;

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
        if (section === "intro")  return 0.6;
        if (section === "verse")  return 0.75;
        if (section === "chorus") return 0.9;
        if (section === "solo")   return 0.7;
        if (section === "outro")  return 0.5;
        return 0.7;
    }

    // ------------------------------------------------------------
    // Pattern per sezione (molto più presenti)
    // ------------------------------------------------------------
    function shouldPlay(section, stepInMeasure) {

        // Sempre su 1
        if (stepInMeasure === 0) return true;

        // Chorus → suona quasi sempre
        if (section === "chorus") return stepInMeasure % 1 === 0;

        // Verse → suona ogni 8n
        if (section === "verse") return stepInMeasure % 2 === 0;

        // Solo → groove libero
        if (section === "solo") return stepInMeasure % 2 === 0 || rand() < 0.3;

        // Intro/outro → più semplice
        if (section === "intro" || section === "outro") return stepInMeasure % 2 === 0;

        return false;
    }

    // ------------------------------------------------------------
    // ENGINE ritornato a metal.js
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

        // Non suonare troppo poco
        if (rand() > density) return;

        // Pattern ritmico
        if (!shouldPlay(section, stepInMeasure)) return;

        // Suona
        bass.triggerAttackRelease(clamped, "8n", time);
    };
}
