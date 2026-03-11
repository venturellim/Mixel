// metalBass.js — basso coerente con riffData, sezioni e accordi

import { bass } from "./common.js";
import * as Tone from "https://esm.sh/tone";

export function createBassEngine(analysis, params, riffData, rand) {

    const beatsPerMeasure = riffData.beatsPerMeasure;
    const totalSteps = riffData.totalSteps;

    const rhythm = params.rhythm;
    const scale = params.scale;

    const MIN = 24; // C1
    const MAX = 36; // C2
    const octave = 1;

    // ------------------------------------------------------------
    // Utility: clamp nota
    // ------------------------------------------------------------
    function clamp(note) {
        const midi = Tone.Frequency(note).toMidi();
        const clamped = Math.max(MIN, Math.min(MAX, midi));
        return Tone.Frequency(clamped, "midi").toNote();
    }

    // ------------------------------------------------------------
    // Pattern per sezione
    // ------------------------------------------------------------
    function getBassDensity(section) {
        if (section === "intro")  return 0.3 * rhythm.attack;
        if (section === "verse")  return 0.5 * rhythm.attack;
        if (section === "chorus") return 0.8 * rhythm.attack;
        if (section === "solo")   return 0.4 * rhythm.attack;
        if (section === "outro")  return 0.2 * rhythm.attack;
        return 0.5;
    }

    function getBassPattern(section, stepInMeasure) {
        if (section === "chorus") {
            return stepInMeasure % 1 === 0; // ogni battito
        }
        if (section === "verse") {
            return stepInMeasure % 2 === 0; // metà densità
        }
        if (section === "intro" || section === "outro") {
            return stepInMeasure === 0; // solo accento forte
        }
        if (section === "solo") {
            return stepInMeasure % 3 === 0; // groove più libero
        }
        return false;
    }

    // ------------------------------------------------------------
    // ENGINE ritornato a metal.js
    // ------------------------------------------------------------
    return function bassEngine(time, step) {

        const idx = step % totalSteps;

        const chord = riffData.chordTimeline[idx];
        const section = riffData.sectionTimeline[idx];

        if (!chord) return;

        const root = chord[0]; // fondamentale dell’accordo
        const rootMidi = Tone.Frequency(root).toMidi();
        const bassNote = Tone.Frequency(rootMidi - 12, "midi").toNote(); // un'ottava sotto

        const clamped = clamp(bassNote);

        const stepInMeasure = idx % beatsPerMeasure;

        const density = getBassDensity(section);
        if (rand() > density) return;

        if (!getBassPattern(section, stepInMeasure)) return;

        bass.triggerAttackRelease(clamped, "4n", time);
    };
}
