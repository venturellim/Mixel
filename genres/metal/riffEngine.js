// riffEngine.js
// Generatore di riff power metal.
// Nessuna logica di routing. Nessuna logica di strumenti.
// Solo generazione di note + scheduling.

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote, nearestNatural } from "../../utils/harmonyUtils.js";
import { scaleWithinRange } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("riffEngine.js loaded");

// ============================================================
// 🎸 INIZIALIZZAZIONE
// ============================================================

export function initRiffEngine(instruments, params, scale, rand, structure, options = {}) {

    const { guitarPalm, guitarOpen } = instruments;
    const { enableLog = false } = options;

    // --------------------------------------------------------
    // 1) Costruzione scala adattata ai campioni (C2–C3)
    // --------------------------------------------------------
    // Se nearestNatural restituisce MIDI, lo convertiamo in nota.
    // Se restituisce già una nota, midiToNote è idempotente (o lo togliamo).
    const riffScale = scaleWithinRange(scale, noteToMidi("C2"), noteToMidi("C3"))
        .map(n => nearestNatural(n))
        .filter(n => n !== undefined)
        .map(n => typeof n === "number" ? midiToNote(n) : n);

    if (enableLog) {
        console.log("[riffEngine] riffScale:", riffScale);
    }

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
        if (riffScale.length === 0) return "C2"; // fallback sicuro
        const idx = Math.floor(rand() * riffScale.length);
        return riffScale[idx] || "C2";
    }

    // --------------------------------------------------------
    // 4) Scheduling di una sezione
    // --------------------------------------------------------
    function scheduleSection(section, pattern) {
        const timeline = buildSectionTimeline(section, "16n");

        if (enableLog) {
            console.log("[riffEngine] section:", section.name, "timeline:", timeline);
        }

        timeline.forEach((t, i) => {
            if (pattern[i % pattern.length] === 1) {

                const note = pickNote();

                if (enableLog) {
                    console.log("[riffEngine] schedule palm", section.name, "t:", t, "note:", note);
                }

                // Palm mute programmato sulla timeline
                Tone.Transport.schedule((time) => {
                    guitarPalm.triggerAttackRelease(note, "16n", time);
                }, t);

                // Accenti occasionali con open chord
                if (rand() < params.riffDensity * 0.2) {

                    if (enableLog) {
                        console.log("[riffEngine] schedule open", section.name, "t:", t, "note:", note);
                    }

                    Tone.Transport.schedule((time) => {
                        guitarOpen.triggerAttackRelease(note, "8n", time);
                    }, t);
                }
            }
        });
    }

    // ============================================================
    // 🎵 SCHEDULING COMPLETO
    // ============================================================

    function schedule() {

        if (!structure || !Array.isArray(structure.sections)) {
            console.warn("[riffEngine] struttura non valida:", structure);
            return;
        }

        structure.sections.forEach(section => {

            let pattern = patterns.verse;

            if (section.name === "intro")  pattern = patterns.intro;
            if (section.name === "chorus") pattern = patterns.chorus;
            if (section.name === "solo")   pattern = patterns.solo;
            if (section.name === "outro")  pattern = patterns.outro;

            if (enableLog) {
                console.log("[riffEngine] scheduling section:", section.name, "pattern:", pattern);
            }

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
