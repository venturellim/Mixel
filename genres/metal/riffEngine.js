// riffEngine.js — versione power metal completa e compatibile con A2–G2 naturali

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote, nearestNatural } from "../../utils/harmonyUtils.js";
import { scaleWithinRange } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";

console.log("riffEngine.js ver. 003 loaded");

// ============================================================
// 🎸 INIZIALIZZAZIONE
// ============================================================

export function initRiffEngine(instruments, params, rand, options = {}) {

    const { guitarPalm, guitarOpen } = instruments;
    const { enableLog = false } = options;

    const MIN = noteToMidi("A2");
    const MAX = noteToMidi("G2");

    // --------------------------------------------------------
    // Utility: nota dalla scala della sezione (range C2–C3)
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

    // ============================================================
    // PATTERN 1 — VERSE: PALM-MUTE GALLOP
    // ============================================================
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

    // ============================================================
    // PATTERN 2 — PRE-CHORUS: PEDAL TONE + MOVIMENTO
    // ============================================================
    function schedulePreChorusRiff(section, sectionScale, root) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        const pedal = root.replace("#","").replace("b","") + "2";

        timeline.forEach((t, i) => {
            const isPedal = i % 2 === 0;
            const note = isPedal ? pedal : pickNote(sectionScale);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "8n", time);
            }, t);
        });
    }

    // ============================================================
    // PATTERN 3 — CHORUS: OPEN CHORDS SUSTAIN (STRATOVARIUS)
    // Compatibile con A2–G2 naturali
    // ============================================================
    function scheduleChorusRiff(section, sectionScale, root) {
        const timeline = buildSectionTimeline(section, "2n");
        if (!timeline) return;

        // Root naturale nel range A2–G2
        let rootLetter = root.replace("#","").replace("b","");
        let rootMidi = noteToMidi(rootLetter + "2");

        if (rootMidi < MIN) rootMidi = MIN;
        if (rootMidi > MAX) rootMidi = MAX;

        // Quinta naturale (solo se non crea #)
        const naturalFifths = {
            "A": "E",
            "B": null,   // F# → non naturale → scartata
            "C": "G",
            "D": "A",
            "E": "B",
            "F": "C",
            "G": "D"
        };

        const fifthLetter = naturalFifths[rootLetter] || null;

        const chord = [midiToNote(rootMidi)];

        if (fifthLetter) {
            const fifthMidi = noteToMidi(fifthLetter + "2");
            if (fifthMidi >= MIN && fifthMidi <= MAX) {
                chord.push(midiToNote(fifthMidi));
            }
        }

        timeline.forEach(t => {
            Tone.Transport.schedule(time => {
                chord.forEach(n => {
                    guitarOpen.triggerAttackRelease(n, "2n", time);
                });
            }, t);
        });
    }

    // ============================================================
    // PATTERN 4 — SOLO: RIFF APERTO E MELODICO
    // ============================================================
    function scheduleSoloRiff(section, sectionScale, root) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        timeline.forEach((t, i) => {
            const note = pickNote(sectionScale);

            Tone.Transport.schedule(time => {
                guitarOpen.triggerAttackRelease(note, "8n", time);
            }, t);

            if (rand() < 0.2) {
                Tone.Transport.schedule(time => {
                    guitarPalm.triggerAttackRelease(note, "16n", time);
                }, t + Tone.Time("16n").toSeconds());
            }
        });
    }

    // ============================================================
    // PATTERN 5 — OUTRO: SEMPLICE E DIRETTO
    // ============================================================
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

    // ============================================================
    // SCHEDULING SEZIONE
    // ============================================================
    function scheduleSection(section, sectionScale, root) {

        if (section.name === "intro")     return scheduleVerseRiff(section, sectionScale, root);
        if (section.name === "verse")     return scheduleVerseRiff(section, sectionScale, root);
        if (section.name === "prechorus") return schedulePreChorusRiff(section, sectionScale, root);
        if (section.name === "chorus")    return scheduleChorusRiff(section, sectionScale, root);
        if (section.name === "solo")      return scheduleSoloRiff(section, sectionScale, root);
        if (section.name === "outro")     return scheduleOutroRiff(section, sectionScale, root);

        return scheduleVerseRiff(section, sectionScale, root);
    }

    return { scheduleSection };
}
