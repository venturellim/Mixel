// riffEngine.js — versione 013
// Timeline relativa, power chord corretti, supporto melodic_fast e pm_support

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote, nearestNatural } from "../../utils/harmonyUtils.js";
import { scaleWithinRange } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { chooseRiffPattern } from "./riffPatterns.js";
import { degreeToRoot } from "./metalTheory.js";

console.log("riffEngine.js ver. 013 loaded");

export function initRiffEngine(instruments, params, rand, options = {}) {

    const { guitarPalm, guitarOpen } = instruments;
    const { enableLog = true } = options;

    // ============================================================
    // UTILITY: pickNote (solo per pattern palm)
    // ============================================================
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
    // POWER CHORD NATURALE (root + quinta nell’ottava corretta)
    // ============================================================
    function buildNaturalPowerChord(root) {

        let rootMidi = noteToMidi(root);

        while (rootMidi < noteToMidi("C2")) rootMidi += 12;
        while (rootMidi > noteToMidi("B2")) rootMidi -= 12;

        const rootNote = midiToNote(rootMidi);
        const rootLetter = rootNote[0];

        const naturalFifths = {
            "C": "G",
            "D": "A",
            "E": "B",
            "F": "C",
            "G": "D",
            "A": "E",
            "B": "F"
        };

        const fifthLetter = naturalFifths[rootLetter];
        const octave = rootNote.slice(-1);

        let fifthMidi = noteToMidi(fifthLetter + octave);

        while (fifthMidi < noteToMidi("C2")) fifthMidi += 12;
        while (fifthMidi > noteToMidi("B2")) fifthMidi -= 12;

        return [rootNote, midiToNote(fifthMidi)];
    }

    // ============================================================
    // PATTERN PALM-MUTE (timeline relativa)
    // ============================================================
    function schedulePalmMuteContinuous(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "16n");
        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, section.startTime + t + offset);
        });
    }

    function scheduleGallop(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n");
        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            const s = section.startTime;

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, s + t + offset);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, s + t + Tone.Time("16n").toSeconds() + offset);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, s + t + Tone.Time("16n").toSeconds() * 2 + offset);
        });
    }

    function schedulePedal(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n");
        const pedal = root[0] + "2";

        timeline.forEach((t, i) => {
            const note = (i % 2 === 0) ? pedal : pickNote(sectionScale);
            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "8n", time);
            }, section.startTime + t + offset);
        });
    }

    function schedulePedalSyncopated(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n");
        const pedal = root[0] + "2";

        timeline.forEach((t, i) => {
            const note = (i % 3 === 0) ? pickNote(sectionScale) : pedal;
            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "8n", time);
            }, section.startTime + t + offset);
        });
    }

    function scheduleSyncopatedPalmMute(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "16n");
        timeline.forEach((t, i) => {
            if (i % 4 !== 2) {
                const note = pickNote(sectionScale);
                Tone.Transport.schedule(time => {
                    guitarPalm.triggerAttackRelease(note, "16n", time);
                }, section.startTime + t + offset);
            }
        });
    }

    function scheduleOutroGallopLight(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n");
        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            const s = section.startTime;

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, s + t + offset);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, s + t + Tone.Time("16n").toSeconds() + offset);
        });
    }

    // pm_support: palm-mute di supporto, meno denso del continuous
    function schedulePmSupport(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n");
        timeline.forEach((t, i) => {
            if (i % 2 === 0) {
                const note = pickNote(sectionScale);
                Tone.Transport.schedule(time => {
                    guitarPalm.triggerAttackRelease(note, "8n", time);
                }, section.startTime + t + offset);
            }
        });
    }

    // ============================================================
    // PATTERN OPEN (timeline relativa)
    // ============================================================
    function scheduleOpenSustain(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "1n");
        const chord = buildNaturalPowerChord(root);

        timeline.forEach(t => {
            Tone.Transport.schedule(time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(n, "1n", time));
            }, section.startTime + t + offset);
        });
    }

    function scheduleOpenAccent(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "1n");
        const chord = buildNaturalPowerChord(root);

        timeline.forEach(t => {
            const s = section.startTime;

            Tone.Transport.schedule(time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(n, "1n", time));
            }, s + t + offset);

            Tone.Transport.schedule(time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(n, "8n", time));
            }, s + t + Tone.Time("4n").toSeconds() * 0.75 + offset);
        });
    }

    function scheduleOpenSyncopated(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "2n");
        const chord = buildNaturalPowerChord(root);

        timeline.forEach((t, i) => {
            const s = section.startTime;

            Tone.Transport.schedule(time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(n, "2n", time));
            }, s + t + offset);

            if (i % 2 === 0) {
                Tone.Transport.schedule(time => {
                    chord.forEach(n => guitarOpen.triggerAttackRelease(n, "8n", time));
                }, s + t + Tone.Time("8n").toSeconds() * 3 + offset);
            }
        });
    }

    // ============================================================
    // PATTERN MELODICO (SOLO)
    // ============================================================
    function scheduleMelodicFast(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "16n");
        timeline.forEach((t, i) => {
            const note = pickNote(sectionScale);
            Tone.Transport.schedule(time => {
                guitarOpen.triggerAttackRelease(note, "16n", time);
            }, section.startTime + t + offset);
        });
    }

    // ============================================================
    // DISPATCHER PALM
    // ============================================================
    function schedulePalmMutePattern(section, sectionScale, root, pattern, offset) {
        switch(pattern) {
            case "pm_continuous":   return schedulePalmMuteContinuous(section, sectionScale, root, offset);
            case "gallop":          return scheduleGallop(section, sectionScale, root, offset);
            case "pedal":           return schedulePedal(section, sectionScale, root, offset);
            case "pedal_syncopated":return schedulePedalSyncopated(section, sectionScale, root, offset);
            case "syncopated_pm":   return scheduleSyncopatedPalmMute(section, sectionScale, root, offset);
            case "gallop_light":    return scheduleOutroGallopLight(section, sectionScale, root, offset);
            case "pm_support":      return schedulePmSupport(section, sectionScale, root, offset);
        }
    }

    // ============================================================
    // DISPATCHER OPEN
    // ============================================================
    function scheduleOpenPattern(section, sectionScale, root, pattern, offset) {
        switch(pattern) {
            case "open_sustain":    return scheduleOpenSustain(section, sectionScale, root, offset);
            case "open_accent":     return scheduleOpenAccent(section, sectionScale, root, offset);
            case "open_syncopated": return scheduleOpenSyncopated(section, sectionScale, root, offset);
            case "melodic_fast":    return scheduleMelodicFast(section, sectionScale, root, offset);
        }
    }

    // ============================================================
    // SCHEDULAZIONE SEZIONE
    // ============================================================
    function scheduleSection(section, sectionScale, progression) {

        const measures = section.measures;
        const measureDuration = Tone.Time("1m").toSeconds();

        const patternMap = [];

        for (let i = 0; i < measures; i++) {

            const degree = progression[i % progression.length];
            const root = degreeToRoot(degree, params.tonalCenter);

            const pattern = chooseRiffPattern(section.name, params.imageParams, rand);
            patternMap.push(pattern);

            if (enableLog) {
                console.log(
                    `%c[RIFF] measure ${i+1}/${measures} | degree: ${degree} | root: ${root} | pattern: ${pattern}`,
                    "color:#ff00ff; font-weight:bold;"
                );
            }

            const offset = i * measureDuration;

            if (pattern.startsWith("pm") ||
                pattern === "gallop" ||
                pattern === "pedal" ||
                pattern === "pedal_syncopated" ||
                pattern === "syncopated_pm" ||
                pattern === "gallop_light" ||
                pattern === "pm_support") {

                schedulePalmMutePattern(section, sectionScale, root, pattern, offset);
                continue;
            }

            if (pattern.startsWith("open") ||
                pattern === "melodic_fast") {

                scheduleOpenPattern(section, sectionScale, root, pattern, offset);
                continue;
            }
        }

        return patternMap;
    }

    return { scheduleSection };
}
