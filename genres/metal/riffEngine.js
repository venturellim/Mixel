//
// riffEngine.js — versione corretta
// Riff power metal con motivi, accenti e direzione armonica.
//

import * as Tone from "https://esm.sh/tone";

import { noteToMidi } from "../../utils/harmonyUtils.js";
import { scaleWithinRange } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("riffEngine.js loaded");

export function initRiffEngine(instruments, params, scale, rand, structure) {

    const { guitarPalm, guitarOpen } = instruments;

    // Scala adattata ai campioni (C2–C3)
    const riffScaleRaw = scaleWithinRange(scale, noteToMidi("C2"), noteToMidi("C3"));
    const riffScale = (riffScaleRaw && riffScaleRaw.length > 0)
        ? riffScaleRaw
        : [noteToMidi("C2"), noteToMidi("D2"), noteToMidi("E2"), noteToMidi("G2"), noteToMidi("A2")];

    function pickMidi() {
        const idx = Math.floor(rand() * riffScale.length);
        return riffScale[idx] ?? riffScale[0];
    }

    function midiToNoteName(midi) {
        return Tone.Frequency(midi, "midi").toNote("flat");
    }

    // Motivo base in MIDI (NON convertiamo subito in note!)
    function buildMotif() {
        const root = pickMidi();
        const up = root + 2;
        const fifth = root + 7;

        // Manteniamo il motivo in MIDI
        return [root, up, root, fifth];
    }

    const baseMotif = buildMotif();

    const patterns = {
        intro:  [1,0,1,0, 1,0,1,0],
        verse:  [1,1,1,1, 1,0,1,0],
        chorus: [1,0,1,1, 1,0,1,1],
        solo:   [1,0,1,0, 0,0,1,0],
        outro:  [1,0,1,0, 1,0,0,0]
    };

    function scheduleSection(section, pattern) {
        const timeline = buildSectionTimeline(section, "16n");

        timeline.forEach((t, i) => {
            if (pattern[i % pattern.length] !== 1) return;

            // MIDI dal motivo
            const midi = baseMotif[i % baseMotif.length];

            // Se il motivo genera una nota fuori range, la rimpiazziamo con la scala adattata
            const safeMidi = riffScale.includes(midi) ? midi : riffScale[0];

            // Convertiamo in nota SOLO ora
            const note = midiToNoteName(safeMidi);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t);

            if (rand() < params.riffDensity * 0.6) {
                Tone.Transport.schedule(time => {
                    guitarOpen.triggerAttackRelease(note, "8n", time);
                }, t);
            }
        });
    }

    function schedule() {
        structure.sections.forEach(section => {
            let pattern = patterns.verse;
            if (section.name === "intro")  pattern = patterns.intro;
            if (section.name === "chorus") pattern = patterns.chorus;
            if (section.name === "solo")   pattern = patterns.solo;
            if (section.name === "outro")  pattern = patterns.outro;
            scheduleSection(section, pattern);
        });
    }

    return { schedule };
}
