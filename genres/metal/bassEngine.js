// bassEngine.js — versione compatibile con la nuova architettura
// Linee di basso power metal: gallop, straight, tonic-driven.

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote } from "../../utils/harmonyUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("bassEngine.js loaded");

function toFlat(note) {
    return Tone.Frequency(note).toNote("flat");
}

export function initBassEngine(instruments, params, rand) {

    const { bass } = instruments;

    const MIN_MIDI = noteToMidi("C1");
    const MAX_MIDI = noteToMidi("C2");

    // ------------------------------------------------------------
    // Conversione sicura MIDI → nota
    // ------------------------------------------------------------
    function safeMidiToNote(midi) {
        if (isNaN(midi)) return "C1";
        if (midi < MIN_MIDI) midi = MIN_MIDI;
        if (midi > MAX_MIDI) midi = MAX_MIDI;
        return toFlat(midiToNote(midi));
    }

    // ------------------------------------------------------------
    // Clamping sicuro per note in formato stringa
    // ------------------------------------------------------------
    function clampBass(note) {
        if (!note) return "C1";
        const midi = noteToMidi(note);
        return safeMidiToNote(midi);
    }

    // ------------------------------------------------------------
    // Scelta sicura di note dalla scala della sezione
    // ------------------------------------------------------------
    function pickScaleNote(sectionScale) {
        if (!sectionScale || sectionScale.length === 0) return "C1";
        const idx = Math.floor(rand() * sectionScale.length);
        const note = sectionScale[idx];
        return clampBass(note);
    }

    // ------------------------------------------------------------
    // Pattern di basso
    // ------------------------------------------------------------
    function scheduleGallop(note, t) {
        Tone.Transport.schedule(time => bass.triggerAttackRelease(note, "16n", time), t);
        Tone.Transport.schedule(time => bass.triggerAttackRelease(note, "16n", time), t + duration("16n"));
        Tone.Transport.schedule(time => bass.triggerAttackRelease(note, "8n",  time), t + duration("8n"));
    }

    function scheduleStraight(note, t) {
        Tone.Transport.schedule(time => bass.triggerAttackRelease(note, "8n", time), t);
    }

    // ------------------------------------------------------------
    // Scheduling di una singola sezione
    // ------------------------------------------------------------
    function scheduleSection(section, sectionScale, root) {

        const timeline = buildSectionTimeline(section, "8n");

        // TONICA DELLA SEZIONE (root armonico)
        const tonic = clampBass(root + "1");

        // Stile della sezione
        let style = params.bassStyle; // "gallop" o "straight"
        if (section.name === "chorus") style = "gallop";
        if (section.name === "solo")   style = "straight";

        timeline.forEach(t => {

            // Nota principale: TONICA
            let note = tonic;

            // Piccole variazioni melodiche
            if (rand() < params.bassIntensity * 0.2) {
                note = pickScaleNote(sectionScale);
            }

            if (style === "gallop") scheduleGallop(note, t);
            else scheduleStraight(note, t);
        });
    }

    // ------------------------------------------------------------
    // EXPORT
    // ------------------------------------------------------------
    return {
        scheduleSection
    };
}
