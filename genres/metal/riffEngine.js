// riffEngine.js — versione power metal con pattern + Stratovarius chorus

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote, nearestNatural } from "../../utils/harmonyUtils.js";
import { scaleWithinRange } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { chooseRiffPattern } from "./riffPatterns.js";

console.log("riffEngine.js ver. 006 loaded");

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

    // --------------------------------------------------------
    // Utility: power chord naturale nel range A2–G2
    // --------------------------------------------------------
    function buildNaturalPowerChord(root) {
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

        return chord;
    }

    // ============================================================
    // PATTERN: PALM-MUTE CONTINUO
    // ============================================================
    function schedulePalmMuteContinuous(section, sectionScale, root, pattern) {
        const timeline = buildSectionTimeline(section, "16n");
        if (!timeline) return;

        if (enableLog) console.log("[riffEngine]", pattern, "timeline:", timeline);

        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t);
        });
    }

    // ============================================================
    // PATTERN: GALLOP
    // ============================================================
    function scheduleGallop(section, sectionScale, root, pattern) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        if (enableLog) console.log("[riffEngine]", pattern, "timeline:", timeline);

        timeline.forEach(t => {
            const note = pickNote(sectionScale);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t + Tone.Time("16n").toSeconds());

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t + Tone.Time("16n").toSeconds() * 2);
        });
    }

    // ============================================================
    // PATTERN: GALLOP LEGGERO (OUTRO)
    // ============================================================
    function scheduleOutroGallopLight(section, sectionScale, root, pattern) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        if (enableLog) console.log("[riffEngine]", pattern, "timeline:", timeline);

        timeline.forEach(t => {
            const note = pickNote(sectionScale);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t + Tone.Time("16n").toSeconds());
        });
    }

    // ============================================================
    // PATTERN: PEDAL TONE
    // ============================================================
    function schedulePedal(section, sectionScale, root, pattern) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        if (enableLog) console.log("[riffEngine]", pattern, "timeline:", timeline);

        const pedal = root.replace("#","").replace("b","") + "2";

        timeline.forEach((t, i) => {
            const note = (i % 2 === 0) ? pedal : pickNote(sectionScale);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "8n", time);
            }, t);
        });
    }

    // ============================================================
    // PATTERN: PEDAL TONE SINCOPATO
    // ============================================================
    function schedulePedalSyncopated(section, sectionScale, root, pattern) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        if (enableLog) console.log("[riffEngine]", pattern, "timeline:", timeline);

        const pedal = root.replace("#","").replace("b","") + "2";

        timeline.forEach((t, i) => {
            const note = (i % 3 === 0) ? pickNote(sectionScale) : pedal;

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "8n", time);
            }, t);
        });
    }

    // ============================================================
    // PATTERN: PALM-MUTE SINCOPATO
    // ============================================================
    function scheduleSyncopatedPalmMute(section, sectionScale, root, pattern) {
        const timeline = buildSectionTimeline(section, "16n");
        if (!timeline) return;

        if (enableLog) console.log("[riffEngine]", pattern, "timeline:", timeline);

        timeline.forEach((t, i) => {
            const note = pickNote(sectionScale);

            if (i % 4 !== 2) {
                Tone.Transport.schedule(time => {
                    guitarPalm.triggerAttackRelease(note, "16n", time);
                }, t);
            }
        });
    }

    // ============================================================
    // PATTERN: PALM-MUTE SEMPLICE (OUTRO)
    // ============================================================
    function scheduleOutroSimple(section, sectionScale, root, pattern) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        if (enableLog) console.log("[riffEngine]", pattern, "timeline:", timeline);

        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "8n", time);
            }, t);
        });
    }

    // ============================================================
    // PATTERN: CHORUS OPEN SUSTAIN (STRATOVARIUS)
    // ============================================================
    function scheduleChorusOpenSustain(section, sectionScale, root, pattern) {
        const timeline = buildSectionTimeline(section, "1n");
        if (!timeline) return;

        if (enableLog) console.log("[riffEngine]", pattern, "timeline:", timeline);

        const chord = buildNaturalPowerChord(root);

        timeline.forEach(t => {
            Tone.Transport.schedule(time => {
                chord.forEach(n => {
                    guitarOpen.triggerAttackRelease(n, "1n", time);
                });
            }, t);
        });
    }

    // ============================================================
    // PATTERN: CHORUS OPEN ACCENT
    // ============================================================
    function scheduleChorusOpenAccent(section, sectionScale, root, pattern) {
        const timeline = buildSectionTimeline(section, "1n");
        if (!timeline) return;

        if (enableLog) console.log("[riffEngine]", pattern, "timeline:", timeline);

        const chord = buildNaturalPowerChord(root);

        timeline.forEach(t => {

            Tone.Transport.schedule(time => {
                chord.forEach(n => {
                    guitarOpen.triggerAttackRelease(n, "1n", time);
                });
            }, t);

            const accentTime = t + Tone.Time("4n").toSeconds() * 0.75;
            Tone.Transport.schedule(time => {
                chord.forEach(n => {
                    guitarOpen.triggerAttackRelease(n, "8n", time);
                });
            }, accentTime);
        });
    }

    // ============================================================
    // PATTERN: CHORUS OPEN SYNCOPATED
    // ============================================================
    function scheduleChorusOpenSyncopated(section, sectionScale, root, pattern) {
        const timeline = buildSectionTimeline(section, "2n");
        if (!timeline) return;

        if (enableLog) console.log("[riffEngine]", pattern, "timeline:", timeline);

        const chord = buildNaturalPowerChord(root);

        timeline.forEach((t, i) => {

            Tone.Transport.schedule(time => {
                chord.forEach(n => {
                    guitarOpen.triggerAttackRelease(n, "2n", time);
                });
            }, t);

            if (i % 2 === 0) {
                Tone.Transport.schedule(time => {
                    chord.forEach(n => {
                        guitarOpen.triggerAttackRelease(n, "8n", time);
                    });
                }, t + Tone.Time("8n").toSeconds() * 3);
            }
        });
    }

    // ============================================================
    // PATTERN: SOLO MELODIC OPEN
    // ============================================================
    function scheduleSoloMelodicOpen(section, sectionScale, root, pattern) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        if (enableLog) console.log("[riffEngine]", pattern, "timeline:", timeline);

        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            Tone.Transport.schedule(time => {
                guitarOpen.triggerAttackRelease(note, "8n", time);
            }, t);
        });
    }

    // ============================================================
    // PATTERN: SOLO MELODIC FAST
    // ============================================================
    function scheduleSoloMelodicFast(section, sectionScale, root, pattern) {
        const timeline = buildSectionTimeline(section, "16n");
        if (!timeline) return;

        if (enableLog) console.log("[riffEngine]", pattern, "timeline:", timeline);

        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            Tone.Transport.schedule(time => {
                guitarOpen.triggerAttackRelease(note, "16n", time);
            }, t);
        });
    }

    // ============================================================
    // DISPATCH UNICO BASATO SU PATTERN
    // ============================================================
    function scheduleSection(section, sectionScale, root, pattern) {

        if (enableLog) {
            console.log(
                `%c[riffEngine] ${section.name} → pattern: ${pattern}, root: ${root}`,
                "color:#ff00ff; font-weight:bold;"
            );
        }

        switch(pattern) {

            case "pm_continuous":
                return schedulePalmMuteContinuous(section, sectionScale, root, pattern);

            case "gallop":
                return scheduleGallop(section, sectionScale, root, pattern);

            case "pedal":
                return schedulePedal(section, sectionScale, root, pattern);

            case "pedal_syncopated":
                return schedulePedalSyncopated(section, sectionScale, root, pattern);

            case "syncopated_pm":
                return scheduleSyncopatedPalmMute(section, sectionScale, root, pattern);

            case "open_sustain":
                return scheduleChorusOpenSustain(section, sectionScale, root, pattern);

            case "open_accent":
                return scheduleChorusOpenAccent(section, sectionScale, root, pattern);

            case "open_syncopated":
                return scheduleChorusOpenSyncopated(section, sectionScale, root, pattern);

            case "melodic_open":
                return scheduleSoloMelodicOpen(section, sectionScale, root, pattern);

            case "melodic_fast":
                return scheduleSoloMelodicFast(section, sectionScale, root, pattern);

            case "pm_simple":
                return scheduleOutroSimple(section, sectionScale, root, pattern);

            case "gallop_light":
                return scheduleOutroGallopLight(section, sectionScale, root, pattern);

            default:
                return scheduleGallop(section, sectionScale, root, pattern);
        }
    }

    return { scheduleSection };
}
