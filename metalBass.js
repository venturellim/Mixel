// metalBass.js — basso sincronizzato con metalTimeline

import { bass, humanizeTime } from "./common.js";
import * as Tone from "https://esm.sh/tone";

export function createBassEngine(analysis, params, timeline, riffData, rand) {

    const {
        stepsPerMeasure,
        totalSteps
    } = timeline;

    const MIN = 24; // C1
    const MAX = 36; // C2

    // ------------------------------------------------------------
    // Clamp nota nel range basso
    // ------------------------------------------------------------

    function clamp(note) {

        const midi = Tone.Frequency(note).toMidi();
        const clamped = Math.max(MIN, Math.min(MAX, midi));

        return Tone.Frequency(clamped, "midi").toNote();

    }

    // ------------------------------------------------------------
    // Pattern basso (simili al kick)
    // ------------------------------------------------------------

    function getBassPattern(section) {

        if (section === "intro")
            return [0];

        if (section === "verse")
            return [0, 4, 8, 12];

        if (section === "chorus")
            return [0, 3, 6, 8, 11, 14];

        if (section === "solo")
            return [0, 4, 8, 12];

        if (section === "outro")
            return [0, 8];

        return [0, 4, 8, 12];

    }

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------

    return function bassEngine(time, step) {

        const idx = step % totalSteps;

        const { stepInMeasure, section } =
            timeline.getStepData(step);

        const chord = riffData.chordTimeline[idx];

        if (!chord) return;

        const root = chord[0];
        if (!root) return;
        const riffNote = riffData.fullRiff[idx];

        let bassSource = root;

// PEDAL TONE nelle parti epiche
if (section === "chorus" || section === "intro") {

    if (rand() < 0.6 && riffData.chordTimeline[0]) {

        bassSource = riffData.chordTimeline[0][0] || root;

    }

}

// altrimenti segue il riff
else if (riffNote && rand() < 0.7) {

    bassSource = riffNote;

}

// sicurezza finale
if (!bassSource) return;

const sourceMidi =
    Tone.Frequency(bassSource).toMidi();

const bassMidi =
    rand() < 0.25
        ? sourceMidi - 24
        : sourceMidi - 12;

const note = clamp(
    Tone.Frequency(bassMidi, "midi").toNote()
);

if (!note) return;

        const pattern = getBassPattern(section);

        // --------------------------------------------------------
        // Trigger basso
        // --------------------------------------------------------

        if (pattern.includes(stepInMeasure)) {

            bass.triggerAttackRelease(
    note,
    "8n",
    humanizeTime(time, rand)
);

        }

    };

}