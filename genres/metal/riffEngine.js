// riffEngine.js — versione 021
// Come la 020, ma con clamp su sectionEnd per evitare sovrapposizioni.

import * as Tone from "https://esm.sh/tone";

import { nearestNatural } from "../../utils/harmonyUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { chooseRiffPattern } from "./riffPatterns.js";
import { degreeToRoot } from "./metalTheory.js";

console.log("riffEngine.js ver. 021 loaded");

function toSampleKey(letter) {
    return letter + "2";
}

function jitter(rand) {
    return (rand() * 0.0003);
}

export function initRiffEngine(instruments, params, rand, options = {}) {

    const { guitarPalm, guitarOpen } = instruments;
    const { enableLog = true } = options;

    const secondsPerBeat = 60 / params.bpm;
    const measureDuration = secondsPerBeat * 4;

    function toLetter(note) {
        return note[0];
    }

    function pickNote(sectionScale) {
        if (!sectionScale || sectionScale.length === 0) return "C";

        const nat = sectionScale
            .map(n => nearestNatural(n))
            .filter(n => n !== undefined)
            .map(n => toLetter(n));

        if (nat.length === 0) return "C";

        return nat[Math.floor(rand() * nat.length)];
    }

    function buildNaturalPowerChord(rootNote) {
        const rootLetter = toLetter(rootNote);

        const naturalFifths = {
            "C": "G",
            "D": "A",
            "E": "B",
            "F": "C",
            "G": "D",
            "A": "E",
            "B": "F"
        };

        return [rootLetter, naturalFifths[rootLetter]];
    }

    // Helper: schedula solo se dentro la sezione
    function scheduleIfInSection(section, eventTime, cb) {
        const sectionEnd = section.startTime + section.measures * measureDuration;
        if (eventTime >= sectionEnd) return;
        Tone.Transport.schedule(cb, eventTime);
    }

    // ============================================================
    // PALM PATTERNS (con jitter)
    // ============================================================
    function schedulePalmMuteContinuous(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "16n", params.bpm);
        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            const eventTime = section.startTime + t + offset + jitter(rand);
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(note), "16n", time);
            });
        });
    }

    function scheduleGallop(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n", params.bpm);
        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            const s = section.startTime;

            let eventTime = s + t + offset + jitter(rand);
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(note), "16n", time);
            });

            eventTime = s + t + secondsPerBeat / 4 + offset;
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(note), "16n", time);
            });

            eventTime = s + t + secondsPerBeat / 2 + offset;
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(note), "16n", time);
            });
        });
    }

    function schedulePedal(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n", params.bpm);
        const pedal = toLetter(root);

        timeline.forEach((t, i) => {
            const note = (i % 2 === 0) ? pedal : pickNote(sectionScale);
            const eventTime = section.startTime + t + offset + jitter(rand);
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(note), "16n", time);
            });
        });
    }

    function schedulePedalSyncopated(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n", params.bpm);
        const pedal = toLetter(root);

        timeline.forEach((t, i) => {
            const note = (i % 3 === 0) ? pickNote(sectionScale) : pedal;
            const eventTime = section.startTime + t + offset + jitter(rand);
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(note), "16n", time);
            });
        });
    }

    function scheduleSyncopatedPalmMute(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "16n", params.bpm);
        timeline.forEach((t, i) => {
            if (i % 4 !== 2) {
                const note = pickNote(sectionScale);
                const eventTime = section.startTime + t + offset + jitter(rand);
                scheduleIfInSection(section, eventTime, time => {
                    guitarPalm.triggerAttackRelease(toSampleKey(note), "16n", time);
                });
            }
        });
    }

    function scheduleOutroGallopLight(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n", params.bpm);
        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            const s = section.startTime;

            let eventTime = s + t + offset + jitter(rand);
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(note), "16n", time);
            });

            eventTime = s + t + secondsPerBeat / 4 + offset;
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(note), "16n", time);
            });
        });
    }

    function schedulePmSupport(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n", params.bpm);
        timeline.forEach((t, i) => {
            if (i % 2 === 0) {
                const note = pickNote(sectionScale);
                const eventTime = section.startTime + t + offset + jitter(rand);
                scheduleIfInSection(section, eventTime, time => {
                    guitarPalm.triggerAttackRelease(toSampleKey(note), "16n", time);
                });
            }
        });
    }

    // ============================================================
    // OPEN PATTERNS (senza jitter, con clamp)
    // ============================================================
    function scheduleOpenSustain(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "1n", params.bpm);
        const chord = buildNaturalPowerChord(root);

        timeline.forEach(t => {
            const eventTime = section.startTime + t + offset;
            scheduleIfInSection(section, eventTime, time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(toSampleKey(n), "1n", time));
            });
        });
    }

    function scheduleOpenAccent(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "1n", params.bpm);
        const chord = buildNaturalPowerChord(root);

        timeline.forEach(t => {
            const s = section.startTime;

            let eventTime = s + t + offset;
            scheduleIfInSection(section, eventTime, time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(toSampleKey(n), "1n", time));
            });

            eventTime = s + t + secondsPerBeat * 3 + offset;
            scheduleIfInSection(section, eventTime, time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(toSampleKey(n), "1n", time));
            });
        });
    }

    function scheduleOpenSyncopated(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "2n", params.bpm);
        const chord = buildNaturalPowerChord(root);

        timeline.forEach((t, i) => {
            const s = section.startTime;

            let eventTime = s + t + offset;
            scheduleIfInSection(section, eventTime, time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(toSampleKey(n), "2n", time));
            });

            if (i % 2 === 0) {
                eventTime = s + t + secondsPerBeat * 3 + offset;
                scheduleIfInSection(section, eventTime, time => {
                    chord.forEach(n => guitarOpen.triggerAttackRelease(toSampleKey(n), "1n", time));
                });
            }
        });
    }

    function scheduleMelodicFast(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "16n", params.bpm);
        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            const eventTime = section.startTime + t + offset;
            scheduleIfInSection(section, eventTime, time => {
                guitarOpen.triggerAttackRelease(toSampleKey(note), "16n", time);
            });
        });
    }

    // ============================================================
    // DISPATCHER + SCHEDULAZIONE SEZIONE
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

    function scheduleOpenPattern(section, sectionScale, root, pattern, offset) {
        switch(pattern) {
            case "open_sustain":    return scheduleOpenSustain(section, sectionScale, root, offset);
            case "open_accent":     return scheduleOpenAccent(section, sectionScale, root, offset);
            case "open_syncopated": return scheduleOpenSyncopated(section, sectionScale, root, offset);
            case "melodic_fast":    return scheduleMelodicFast(section, sectionScale, root, offset);
        }
    }

    function scheduleSection(section, sectionScale, progression) {

        const measures = section.measures;
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
