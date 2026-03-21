// riffEngine.js — versione power metal completa (Stratovarius Chorus)

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote, nearestNatural } from "../../utils/harmonyUtils.js";
import { scaleWithinRange } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";

console.log("riffEngine.js ver. 004 loaded");

export function initRiffEngine(instruments, params, rand, options = {}) {

    const { guitarPalm, guitarOpen } = instruments;
    const { enableLog = false } = options;

    const MIN = noteToMidi("A2");
    const MAX = noteToMidi("G2");

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

    // ============================================================
    // VERSE — PALM-MUTE GALLOP
    // ============================================================
    function scheduleVerseRiff(section, sectionScale, root) {
        const timeline = buildSectionTimeline(section, "16n");
        if (!timeline) return;

        timeline.forEach((t, i) => {
            const note = pickNote(sectionScale);

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
    // PRE-CHORUS — PEDAL TONE + MOVIMENTO
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
    // CHORUS — STRATOVARIUS COMPLETE
    // ============================================================
    function scheduleChorusRiff(section, sectionScale, root) {
        const timeline = buildSectionTimeline(section, "1n");
        if (!timeline) return;

        let rootLetter = root.replace("#","").replace("b","");
        let rootMidi = noteToMidi(rootLetter + "2");

        if (rootMidi < MIN) rootMidi = MIN;
        if (rootMidi > MAX) rootMidi = MAX;

        const naturalFifths = {
            "A": "E",
            "B": null,
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

            // 1) ACCORDO LUNGO
            Tone.Transport.schedule(time => {
                chord.forEach(n => {
                    guitarOpen.triggerAttackRelease(n, "1n", time);
                });
            }, t);

            // 2) ACCENTO SINCOPATO
            const accentTime = t + Tone.Time("4n").toSeconds() * 0.75;
            Tone.Transport.schedule(time => {
                chord.forEach(n => {
                    guitarOpen.triggerAttackRelease(n, "8n", time);
                });
            }, accentTime);

            // 3) PALM MUTE LEGGERO
            const pmTimeline = [
                t + Tone.Time("8n").toSeconds(),
                t + Tone.Time("8n").toSeconds() * 2.5,
                t + Tone.Time("8n").toSeconds() * 3.5
            ];

            pmTimeline.forEach(pmT => {
                Tone.Transport.schedule(time => {
                    guitarPalm.triggerAttackRelease(midiToNote(rootMidi), "16n", time);
                }, pmT);
            });
        });
    }

    // ============================================================
    // SOLO — APERTO E MELODICO
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
    // OUTRO — SEMPLICE
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
    // DISPATCH
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
