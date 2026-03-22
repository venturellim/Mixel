// riffEngine.js — versione 010
// Progressioni a 4 misure ripetute per tutta la sezione
// Offset corretto, dispatcher palm/open, power chord naturali

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote, nearestNatural } from "../../utils/harmonyUtils.js";
import { scaleWithinRange } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { chooseRiffPattern } from "./riffPatterns.js";
import { degreeToRoot } from "./metalTheory.js";

console.log("riffEngine.js ver. 011 loaded");

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
    // POWER CHORD NATURALE (solo note naturali C2–B2)
    // ============================================================
    function buildNaturalPowerChord(root) {

        const MIN = noteToMidi("C2");
        const MAX = noteToMidi("B2");

        let rootMidi = noteToMidi(root);
        if (rootMidi < MIN) rootMidi = MIN;
        if (rootMidi > MAX) rootMidi = MAX;

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
        const chord = [rootNote];

        if (fifthLetter) {
            const octave = rootNote.slice(-1);
            let fifthMidi = noteToMidi(fifthLetter + octave);

            if (fifthMidi < MIN) fifthMidi += 12;
            if (fifthMidi > MAX) fifthMidi -= 12;

            chord.push(midiToNote(fifthMidi));
        }

        return chord;
    }

    // ============================================================
    // PATTERN PALM-MUTE (con offset)
    // ============================================================
    function schedulePalmMuteContinuous(section, sectionScale, root, pattern, offset = 0) {
        const timeline = buildSectionTimeline(section, "16n");
        if (!timeline) return;

        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t + offset);
        });
    }

    function scheduleGallop(section, sectionScale, root, pattern, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        timeline.forEach(t => {
            const note = pickNote(sectionScale);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t + offset);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t + Tone.Time("16n").toSeconds() + offset);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t + Tone.Time("16n").toSeconds() * 2 + offset);
        });
    }

    function schedulePedal(section, sectionScale, root, pattern, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        const pedal = root[0] + "2";

        timeline.forEach((t, i) => {
            const note = (i % 2 === 0) ? pedal : pickNote(sectionScale);
            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "8n", time);
            }, t + offset);
        });
    }

    function schedulePedalSyncopated(section, sectionScale, root, pattern, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        const pedal = root[0] + "2";

        timeline.forEach((t, i) => {
            const note = (i % 3 === 0) ? pickNote(sectionScale) : pedal;
            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "8n", time);
            }, t + offset);
        });
    }

    function scheduleSyncopatedPalmMute(section, sectionScale, root, pattern, offset = 0) {
        const timeline = buildSectionTimeline(section, "16n");
        if (!timeline) return;

        timeline.forEach((t, i) => {
            if (i % 4 !== 2) {
                const note = pickNote(sectionScale);
                Tone.Transport.schedule(time => {
                    guitarPalm.triggerAttackRelease(note, "16n", time);
                }, t + offset);
            }
        });
    }

    function scheduleOutroGallopLight(section, sectionScale, root, pattern, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t + offset);

            Tone.Transport.schedule(time => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t + Tone.Time("16n").toSeconds() + offset);
        });
    }

    // ============================================================
    // PATTERN OPEN (solo power chord)
    // ============================================================
    function scheduleChorusOpenSustain(section, sectionScale, root, pattern, offset = 0) {
        const timeline = buildSectionTimeline(section, "1n");
        if (!timeline) return;

        const chord = buildNaturalPowerChord(root);

        timeline.forEach(t => {
            Tone.Transport.schedule(time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(n, "1n", time));
            }, t + offset);
        });
    }

    function scheduleChorusOpenAccent(section, sectionScale, root, pattern, offset = 0) {
        const timeline = buildSectionTimeline(section, "1n");
        if (!timeline) return;

        const chord = buildNaturalPowerChord(root);

        timeline.forEach(t => {

            Tone.Transport.schedule(time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(n, "1n", time));
            }, t + offset);

            const accentTime = t + Tone.Time("4n").toSeconds() * 0.75 + offset;

            Tone.Transport.schedule(time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(n, "8n", time));
            }, accentTime);
        });
    }

    function scheduleChorusOpenSyncopated(section, sectionScale, root, pattern, offset = 0) {
        const timeline = buildSectionTimeline(section, "2n");
        if (!timeline) return;

        const chord = buildNaturalPowerChord(root);

        timeline.forEach((t, i) => {

            Tone.Transport.schedule(time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(n, "2n", time));
            }, t + offset);

            if (i % 2 === 0) {
                Tone.Transport.schedule(time => {
                    chord.forEach(n => guitarOpen.triggerAttackRelease(n, "8n", time));
                }, t + Tone.Time("8n").toSeconds() * 3 + offset);
            }
        });
    }

    // ============================================================
    // DISPATCHER PALM
    // ============================================================
    function schedulePalmMutePattern(section, sectionScale, root, pattern, offset) {
        switch(pattern) {
            case "pm_continuous": return schedulePalmMuteContinuous(section, sectionScale, root, pattern, offset);
            case "gallop": return scheduleGallop(section, sectionScale, root, pattern, offset);
            case "pedal": return schedulePedal(section, sectionScale, root, pattern, offset);
            case "pedal_syncopated": return schedulePedalSyncopated(section, sectionScale, root, pattern, offset);
            case "syncopated_pm": return scheduleSyncopatedPalmMute(section, sectionScale, root, pattern, offset);
            case "gallop_light": return scheduleOutroGallopLight(section, sectionScale, root, pattern, offset);
        }
    }

    // ============================================================
    // DISPATCHER OPEN
    // ============================================================
    function scheduleOpenPattern(section, sectionScale, root, pattern, offset) {
        switch(pattern) {
            case "open_sustain": return scheduleChorusOpenSustain(section, sectionScale, root, pattern, offset);
            case "open_accent": return scheduleChorusOpenAccent(section, sectionScale, root, pattern, offset);
            case "open_syncopated": return scheduleChorusOpenSyncopated(section, sectionScale, root, pattern, offset);
        }
    }

    // ============================================================
    // SCHEDULAZIONE SEZIONE (progressione ripetuta per tutta la sezione)
    // ============================================================
    function scheduleSection(section, sectionScale, progression) {

    const measures = section.measures;
    const measureDuration = Tone.Time("1m").toSeconds();

    // Array dei pattern per misura
    const patternMap = [];

    for (let i = 0; i < measures; i++) {

        const degree = progression[i % progression.length];
        const root = degreeToRoot(degree, params.tonalCenter);

        const pattern = chooseRiffPattern(section.name, params.imageParams, rand);

        // Salva il pattern per questa misura
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
            pattern === "gallop_light") {

            schedulePalmMutePattern(section, sectionScale, root, pattern, offset);
            continue;
        }

        if (pattern.startsWith("open")) {
            scheduleOpenPattern(section, sectionScale, root, pattern, offset);
            continue;
        }
    }

    // Restituisce l’array dei pattern per misura
    return patternMap;
}

    return { scheduleSection };
}
