//
// riffEngine.js
// Generatore di riff power metal.
// Nessuna logica di routing. Nessuna logica di strumenti.
// Solo generazione di note + scheduling.
//

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote, nearestNatural } from "../../utils/harmonyUtils.js";
import { scaleWithinRange } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("riffEngine.js loaded");

// ============================================================
// 🎸 INIZIALIZZAZIONE
// ============================================================

export function initRiffEngine(instruments, params, scale, rand, structure) {

    const { guitarPalm, guitarOpen } = instruments;

    // --------------------------------------------------------
    // 1) Costruzione scala adattata ai campioni (C2–C3)
    // --------------------------------------------------------
    const riffScale = scaleWithinRange(scale, noteToMidi("C2"), noteToMidi("C3"))
        .map(n => nearestNatural(n)); // niente diesis/bemolle

    // --------------------------------------------------------
    // 2) Pattern ritmici base
    // --------------------------------------------------------
    const patterns = {
        intro:  [1,0,1,0, 1,0,1,0],
        verse:  [1,1,1,1, 1,0,1,0],
        chorus: [1,0,1,1, 1,0,1,1],
        solo:   [1,0,1,0, 0,0,1,0],
        outro:  [1,0,1,0, 1,0,0,0]
    };

    // --------------------------------------------------------
    // 3) Funzione per scegliere una nota della scala
    // --------------------------------------------------------
    function pickNote() {
        const idx = Math.floor(rand() * riffScale.length);
        return riffScale[idx];
    }

    // --------------------------------------------------------
    // 4) Scheduling di una sezione
    // --------------------------------------------------------
    function scheduleSection(section, pattern) {
        const timeline = buildSectionTimeline(section, "16n");

        timeline.forEach((t, i) => {
            if (pattern[i % pattern.length] === 1) {

                const note = pickNote();

                // Palm mute di default
                guitarPalm.triggerAttackRelease(note, "16n", t);

                // Accenti occasionali con open chord
                if (rand() < params.riffDensity * 0.2) {
                    guitarOpen.triggerAttackRelease(note, "8n", t);
                }
            }
        });
    }

    // ============================================================
    // 🎵 SCHEDULING COMPLETO
    // ============================================================

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

    // ============================================================
    // EXPORT ENGINE
    // ============================================================

    return {
        schedule
    };
}
