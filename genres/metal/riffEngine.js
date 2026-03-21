// riffEngine.js — versione power metal completa
// Generatore di riff power metal con pattern per verse, pre-chorus, chorus, solo, outro.

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote, nearestNatural } from "../../utils/harmonyUtils.js";
import { scaleWithinRange } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";

console.log("riffEngine.js ver. 002 loaded");

// ============================================================
// 🎸 INIZIALIZZAZIONE
// ============================================================

export function initRiffEngine(instruments, params, rand, options = {}) {

    const { guitarPalm, guitarOpen } = instruments;
    const { enableLog = false } = options;

    // --------------------------------------------------------
    // Utility: nota dalla scala della sezione
    // --------------------------------------------------------
    function pickNote(sectionScale) {
        if (!sectionScale || sectionScale.length === 0) return "C2";

        const riffScale = scaleWithinRange(
            sectionScale,
            noteToMidi("C2"),
            noteToMidi("C3")
        )
        .map(n => nearestNatural(n))
        .filter(n => n !== undefined)
        .map(n => typeof n === "number" ? midiToNote(n) : n);

        if (riffScale.length === 0) return "C2";

        return riffScale[Math.floor(rand() * riffScale.length)];
    }

    // --------------------------------------------------------
    // PATTERN 1 — VERSE: PALM-MUTE GALLOP
    // --------------------------------------------------------
    function scheduleVerseRiff(section, sectionScale, root) {
        const timeline = buildSectionTimeline(section, "16n");
        if (!timeline) return;

        timeline.forEach((t, i) => {
            const note = pickNote(sectionScale);

            // Gallop: ♪ ♪ ♩
            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t);

            if (i % 3 === 1) {
                Tone.Transport.schedule(time => {
                    guitarPalm.triggerAttackRelease(note, "16n", time);
                }, t + Tone.Time("16n").toSeconds());
            }
        });
    }

    // --------------------------------------------------------
    // PATTERN 2 — PRE-CHORUS: PEDAL TONE + MOVIMENTO
    // --------------------------------------------------------
    function schedulePreChorusRiff(section, sectionScale, root) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        const pedal = root + "2";

        timeline.forEach((t, i) => {
            const isPedal = i % 2 === 0;
            const note = isPedal ? pedal : pickNote(sectionScale);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "8n", time);
            }, t);
        });
    }

    // --------------------------------------------------------
    // PATTERN 3 — CHORUS: OPEN CHORDS SUSTAIN (STRATOVARIUS)
    // --------------------------------------------------------
    function scheduleChorusRiff(section, sectionScale, root) {
        const timeline = buildSectionTimeline(section, "2n"); // mezzo tempo
        if (!timeline) return;

        const rootMidi = noteToMidi(root + "3");
        const fifthMidi = rootMidi + 7;
        const octaveMidi = rootMidi + 12;

        const chord = [
            midiToNote(rootMidi),
            midiToNote(fifthMidi),
            midiToNote(octaveMidi)
        ];

        timeline.forEach(t => {
            Tone.Transport.schedule(time => {
                chord.forEach(n => {
                    guitarOpen.triggerAttackRelease(n, "2n", time);
                });
            }, t);
        });
    }

    // --------------------------------------------------------
    // PATTERN 4 — SOLO: RIFF APERTO E MELODICO
    // --------------------------------------------------------
    function scheduleSoloRiff(section, sectionScale, root) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        timeline.forEach((t, i) => {
            const note = pickNote(sectionScale);

            Tone.Transport.schedule(time => {
                guitarOpen.triggerAttackRelease(note, "8n", time);
            }, t);

            // occasionali palm mute per groove
            if (rand() < 0.2) {
                Tone.Transport.schedule(time => {
                    guitarPalm.triggerAttackRelease(note, "16n", time);
                }, t + Tone.Time("16n").toSeconds());
            }
        });
    }

    // --------------------------------------------------------
    // PATTERN 5 — OUTRO: SEMPLICE E DIRETTO
    // --------------------------------------------------------
    function scheduleOutroRiff(section, sectionScale, root) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        timeline.forEach(t => {
            const note = pickNote(sectionScale);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "8n", time);
            }, t);
        });
    }

    // --------------------------------------------------------
    // SCHEDULING SEZIONE
    // --------------------------------------------------------
    function scheduleSection(section, sectionScale, root) {

        if (section.name === "intro")  return scheduleVerseRiff(section, sectionScale, root);
        if (section.name === "verse")  return scheduleVerseRiff(section, sectionScale, root);
        if (section.name === "prechorus") return schedulePreChorusRiff(section, sectionScale, root);
        if (section.name === "chorus") return scheduleChorusRiff(section, sectionScale, root);
        if (section.name === "solo")   return scheduleSoloRiff(section, sectionScale, root);
        if (section.name === "outro")  return scheduleOutroRiff(section, sectionScale, root);

        // fallback
        return scheduleVerseRiff(section, sectionScale, root);
    }

    // ============================================================
    // EXPORT ENGINE
    // ============================================================
    return {
        scheduleSection
    };
}
