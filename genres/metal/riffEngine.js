// riffEngine.js — versione power metal con pattern + Stratovarius chorus

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote, nearestNatural } from "../../utils/harmonyUtils.js";
import { scaleWithinRange } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { chooseRiffPattern } from "./riffPatterns.js";

console.log("riffEngine.js ver. 007 loaded");

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

    // 1) Converti la root reale (es. "F3")
    let rootMidi = noteToMidi(root);

    // 2) Clamp nel range A2–G2
    if (rootMidi < MIN) rootMidi = MIN;
    if (rootMidi > MAX) rootMidi = MAX;

    // 3) Ricava la nota clampata
    const rootNote = midiToNote(rootMidi); // es. "F2"

    // 4) Estrai SOLO la lettera (prima del numero)
    const rootLetter = rootNote[0]; // "F"

    // 5) Quinta naturale
    const naturalFifths = {
        "A": "E",
        "B": null,
        "C": "G",
        "D": "A",
        "E": "B",
        "F": "C",
        "G": "D"
    };

    const fifthLetter = naturalFifths[rootLetter];

    const chord = [rootNote];

    if (fifthLetter) {
        // quinta nella stessa ottava della root clampata
        const octave = rootNote.slice(-1); // "2"
        const fifthMidi = noteToMidi(fifthLetter + octave);

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
    function scheduleSection(section, sectionScale, root) {

    const pattern = chooseRiffPattern(section.name, params.imageParams, rand);

    if (enableLog) {
        console.log(
            `%c[riffEngine] ${section.name} → pattern: ${pattern}, root: ${root}`,
            "color:#ff00ff; font-weight:bold;"
        );
    }

    // Esegui il pattern (senza return)
    switch(pattern) {

        case "pm_continuous":
            schedulePalmMuteContinuous(section, sectionScale, root, pattern);
            break;

        case "gallop":
            scheduleGallop(section, sectionScale, root, pattern);
            break;

        case "pedal":
            schedulePedal(section, sectionScale, root, pattern);
            break;

        case "pedal_syncopated":
            schedulePedalSyncopated(section, sectionScale, root, pattern);
            break;

        case "syncopated_pm":
            scheduleSyncopatedPalmMute(section, sectionScale, root, pattern);
            break;

        case "open_sustain":
            scheduleChorusOpenSustain(section, sectionScale, root, pattern);
            break;

        case "open_accent":
            scheduleChorusOpenAccent(section, sectionScale, root, pattern);
            break;

        case "open_syncopated":
            scheduleChorusOpenSyncopated(section, sectionScale, root, pattern);
            break;

        case "melodic_open":
            scheduleSoloMelodicOpen(section, sectionScale, root, pattern);
            break;

        case "melodic_fast":
            scheduleSoloMelodicFast(section, sectionScale, root, pattern);
            break;

        case "pm_simple":
            scheduleOutroSimple(section, sectionScale, root, pattern);
            break;

        case "gallop_light":
            scheduleOutroGallopLight(section, sectionScale, root, pattern);
            break;

        default:
            scheduleGallop(section, sectionScale, root, pattern);
            break;
    }

    // 🔥 RESTITUISCE IL PATTERN SCELTO
    return pattern;
}
return { scheduleSection };
}
