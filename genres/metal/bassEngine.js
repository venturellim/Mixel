//
// bassEngine.js
// Linee di basso power metal.
// Nessuna logica di routing. Nessuna logica di strumenti.
// Solo generazione di note + scheduling.
//


import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote } from "../../utils/harmonyUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("bassEngine.js loaded");

function toFlat(note) {
    return Tone.Frequency(note).toNote("flat");
}

export function initBassEngine(instruments, params, scale, rand, structure) {

    const { bass } = instruments;

    const MIN_MIDI = noteToMidi("C1");
    const MAX_MIDI = noteToMidi("C2");

    function clampBass(note) {
        if (!note) return "C1";
        const midi = noteToMidi(note);
        if (isNaN(midi)) return "C1";
        if (midi < MIN_MIDI) return toFlat(midiToNote(MIN_MIDI));
        if (midi > MAX_MIDI) return toFlat(midiToNote(MAX_MIDI));
        return toFlat(note);
    }

    const tonic = scale.length > 0 ? clampBass(scale[0]) : "C1";

    function pickScaleNote() {
        if (scale.length === 0) return tonic;
        const idx = Math.floor(rand() * scale.length);
        return clampBass(scale[idx] || tonic);
    }

    function scheduleGallop(note, t) {
        Tone.Transport.schedule(time => bass.triggerAttackRelease(note, "16n", time), t);
        Tone.Transport.schedule(time => bass.triggerAttackRelease(note, "16n", time), t + duration("16n"));
        Tone.Transport.schedule(time => bass.triggerAttackRelease(note, "8n", time),  t + duration("8n"));
    }

    function scheduleStraight(note, t) {
        Tone.Transport.schedule(time => bass.triggerAttackRelease(note, "8n", time), t);
    }

    function scheduleSection(section, style) {
        const timeline = buildSectionTimeline(section, "8n");

        timeline.forEach(t => {
            let note = tonic;

            if (rand() < params.bassIntensity * 0.2) {
                note = pickScaleNote();
            }

            if (style === "gallop") scheduleGallop(note, t);
            else scheduleStraight(note, t);
        });
    }

    function schedule() {
        structure.sections.forEach(section => {
            let style = params.bassStyle; // "gallop" o "straight"
            if (section.name === "chorus") style = "gallop";
            if (section.name === "solo")   style = "straight";
            scheduleSection(section, style);
        });
    }

    return { schedule };
}
