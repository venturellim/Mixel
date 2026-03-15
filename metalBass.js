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
    
    const chordTimeline = riffData.chordTimeline;
const fullRiff = riffData.fullRiff;

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

        const idx = step % chordTimeline.length;

const chord = chordTimeline[idx];

const riffNote = fullRiff[idx];

const { section, stepInMeasure } =
    timeline.getStepData(step);

        if (!chord) return;

        const root = chord[0];
        if (!root) return;
        const riffNote = riffData.fullRiff[idx];

        let bassSource = root;

// PEDAL TONE nelle parti epiche
if (section === "chorus" || section === "intro") {

    if (rand() < 0.6 && riffData.chordTimeline[0]) {

        let bassSource = root;

// PEDAL TONE
if (section === "chorus" || section === "intro") {

    if (rand() < 0.6) {

        const firstChord = riffData.chordTimeline[0];

        if (firstChord && firstChord[0]) {

            bassSource = firstChord[0];

        }

    }

}

// segue il riff
else if (riffNote && rand() < 0.7) {

    bassSource = riffNote;

}

if (!bassSource) return;

    }

}

// altrimenti segue il riff
else if (riffNote && rand() < 0.7) {

    bassSource = riffNote;

}

// sicurezza finale
if (!bassSource) return;

if (!bassSource) return;

let sourceMidi;

try {

    sourceMidi = Tone.Frequency(bassSource).toMidi();

} catch {

    return;

}

const bassMidi =
    rand() < 0.25
        ? sourceMidi - 24
        : sourceMidi - 12;

let note = null;

// ------------------------------------------------
// CHORUS → segue accordi
// ------------------------------------------------

if(section === "chorus"){

    note = chord[0];

}

// ------------------------------------------------
// SOLO → raddoppia chitarra
// ------------------------------------------------

else if(section === "solo" && riffNote){

    note = riffNote;

}

// ------------------------------------------------
// VERSE → pedal tone
// ------------------------------------------------

else if(section === "verse"){

    note = chord[0];

}

// ------------------------------------------------
// INTRO / OUTRO → note lunghe
// ------------------------------------------------

else{

    if(stepInMeasure === 0)
        note = chord[0];

}

if(!note) return;

const bassNote =
    Tone.Frequency(note)
        .transpose(-12)
        .toNote();

        const pattern = getBassPattern(section);

        // --------------------------------------------------------
        // Trigger basso
        // --------------------------------------------------------

        if (pattern.includes(stepInMeasure)) {

            bass.triggerAttackRelease(

    bassNote,
    section === "intro" ? "2n" : "8n",
    humanizeTime(time, rand)

);

        }

    };

}