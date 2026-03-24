// riffEngine.js — versione 026
// Dispatcher robusto + normalizzazione pattern + fix cluster open/palm

import * as Tone from "https://esm.sh/tone";

import { nearestNatural } from "../../utils/harmonyUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { chooseRiffPattern } from "./riffPatterns.js";
import { degreeToRoot } from "./metalTheory.js";
import { transitionPatterns } from "./transitionPatterns.js";

console.log("riffEngine.js ver. 026.3 loaded");

// ------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------

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

    let lastNoteOfSection = null;

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

    function scheduleIfInSection(section, eventTime, cb) {
        const sectionEnd = section.startTime + section.measures * measureDuration;
        if (eventTime >= sectionEnd) return;
        Tone.Transport.schedule(cb, eventTime);
    }

    // ------------------------------------------------------------
    // PALM PATTERNS VELOCI (timeline OK)
    // ------------------------------------------------------------
function schedulePalmMuteContinuous(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const timeline = buildSectionTimeline(section, "16n", params.bpm);

    timeline.forEach(t => {
        lastNoteOfSection = rootLetter;
        const eventTime = section.startTime + t + offset + jitter(rand);
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "16n", time);
        });
    });
}

function scheduleGallop(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const timeline = buildSectionTimeline(section, "8n", params.bpm);

    timeline.forEach(t => {
        lastNoteOfSection = rootLetter;
        const s = section.startTime;

        let eventTime = s + t + offset + jitter(rand);
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "16n", time);
        });

        eventTime = s + t + secondsPerBeat / 4 + offset;
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "16n", time);
        });

        eventTime = s + t + secondsPerBeat / 2 + offset;
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "16n", time);
        });
    });
}

function schedulePedal(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const timeline = buildSectionTimeline(section, "8n", params.bpm);

    timeline.forEach(t => {
        lastNoteOfSection = rootLetter;
        const eventTime = section.startTime + t + offset + jitter(rand);
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "16n", time);
        });
    });
}

function schedulePedalSyncopated(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const timeline = buildSectionTimeline(section, "8n", params.bpm);

    timeline.forEach(t => {
        lastNoteOfSection = rootLetter;
        const eventTime = section.startTime + t + offset + jitter(rand);
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "16n", time);
        });
    });
}

function scheduleSyncopatedPalmMute(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const timeline = buildSectionTimeline(section, "16n", params.bpm);

    timeline.forEach((t, i) => {
        if (i % 4 !== 2) {
            lastNoteOfSection = rootLetter;
            const eventTime = section.startTime + t + offset + jitter(rand);
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "16n", time);
            });
        }
    });
}

function scheduleOutroGallopLight(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const timeline = buildSectionTimeline(section, "8n", params.bpm);

    timeline.forEach(t => {
        lastNoteOfSection = rootLetter;
        const s = section.startTime;

        let eventTime = s + t + offset + jitter(rand);
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "16n", time);
        });

        eventTime = s + t + secondsPerBeat / 4 + offset;
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "16n", time);
        });
    });
}

            // ------------------------------------------------------------
    // PALM PATTERNS LENTI — SAMPLE GIÀ POWER CHORD (suoniamo SOLO la root)
    // ------------------------------------------------------------

    function schedulePmHalfTime(section, sectionScale, root, offset = 0) {
        const rootLetter = toLetter(root);
        const s = section.startTime + offset;

        const hits = [
            0,                    // battito 1
            secondsPerBeat * 2    // battito 3
        ];

        hits.forEach(h => {
            const eventTime = s + h + jitter(rand);
            lastNoteOfSection = rootLetter;
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
            });
        });
    }

    function schedulePmSparse(section, sectionScale, root, offset = 0) {
        const rootLetter = toLetter(root);
        const s = section.startTime + offset;

        const hits = [
            0,                     // 1
            secondsPerBeat * 1.5,  // "e" di 2
            secondsPerBeat * 3     // 4
        ];

        hits.forEach(h => {
            const eventTime = s + h + jitter(rand);
            lastNoteOfSection = rootLetter;
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
            });
        });
    }

    function schedulePmGroove(section, sectionScale, root, offset = 0) {
        const rootLetter = toLetter(root);
        const s = section.startTime + offset;

        const hits = [
            0,                    // 1
            secondsPerBeat,       // 2
            secondsPerBeat * 2,   // 3
            secondsPerBeat * 3    // 4
        ];

        hits.forEach((h, i) => {
            const note = (i === 0) ? rootLetter : pickNote(sectionScale);
            const eventTime = s + h + jitter(rand);
            lastNoteOfSection = note;
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(note), "8n", time);
            });
        });
    }

            // ------------------------------------------------------------
    // OPEN PATTERNS — SAMPLE GIÀ POWER CHORD (suoniamo SOLO la root)
    // ------------------------------------------------------------

    function scheduleOpenSustain(section, sectionScale, root, offset = 0) {
        const rootLetter = toLetter(root);
        const eventTime = section.startTime + offset;

        lastNoteOfSection = rootLetter;

        scheduleIfInSection(section, eventTime, time => {
            guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "1n", time);
        });
    }

    function scheduleOpenAccent(section, sectionScale, root, offset = 0) {
        const rootLetter = toLetter(root);
        const s = section.startTime + offset;

        const hits = [
            0,                    // battito 1
            secondsPerBeat * 3    // battito 4
        ];

        hits.forEach(h => {
            const eventTime = s + h;
            lastNoteOfSection = rootLetter;
            scheduleIfInSection(section, eventTime, time => {
                guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "1n", time);
            });
        });
    }

    function scheduleOpenSyncopated(section, sectionScale, root, offset = 0) {
        const rootLetter = toLetter(root);
        const s = section.startTime + offset;

        const hits = [
            0,                    // 1
            secondsPerBeat * 3    // 4 (sincope)
        ];

        hits.forEach(h => {
            const eventTime = s + h;
            lastNoteOfSection = rootLetter;
            scheduleIfInSection(section, eventTime, time => {
                guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "1n", time);
            });
        });
    }

    function scheduleOpenHalfTime(section, sectionScale, root, offset = 0) {
        const rootLetter = toLetter(root);
        const s = section.startTime + offset;

        const hits = [
            0,                    // battito 1
            secondsPerBeat * 2    // battito 3
        ];

        hits.forEach(h => {
            const eventTime = s + h;
            lastNoteOfSection = rootLetter;
            scheduleIfInSection(section, eventTime, time => {
                guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "2n", time);
            });
        });
    }

    function scheduleOpenEpic(section, sectionScale, root, offset = 0) {
        const rootLetter = toLetter(root);
        const s = section.startTime + offset;

        const hits = [
            0,                       // 1
            2.5 * secondsPerBeat     // 2.5 (classico power metal)
        ];

        hits.forEach(h => {
            const eventTime = s + h;
            lastNoteOfSection = rootLetter;
            scheduleIfInSection(section, eventTime, time => {
                guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "1n", time);
            });
        });
    }

    function scheduleOpenDrive(section, sectionScale, root, offset = 0) {
        const rootLetter = toLetter(root);
        const s = section.startTime + offset;

        const hits = [
            0,
            secondsPerBeat,
            secondsPerBeat * 2,
            secondsPerBeat * 3
        ];

        hits.forEach(h => {
            const eventTime = s + h;
            lastNoteOfSection = rootLetter;
            scheduleIfInSection(section, eventTime, time => {
                guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
            });
        });
    }

    // ------------------------------------------------------------
    // MELODIC PATTERNS (lead = singola nota, quindi OK)
    // ------------------------------------------------------------

    function scheduleMelodicOpen(section, sectionScale, root, offset = 0) {
        const s = section.startTime + offset;

        const note1 = pickNote(sectionScale);
        const note2 = pickNote(sectionScale);

        lastNoteOfSection = note2;

        const hits = [
            { time: 0, note: note1 },                     // 1
            { time: secondsPerBeat * 2, note: note2 }     // 3
        ];

        hits.forEach(h => {
            const eventTime = s + h.time;
            scheduleIfInSection(section, eventTime, time => {
                guitarOpen.triggerAttackRelease(toSampleKey(h.note), "2n", time);
            });
        });
    }

    function scheduleMelodic8n(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "8n", params.bpm);

        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            lastNoteOfSection = note;
            const eventTime = section.startTime + t + offset;
            scheduleIfInSection(section, eventTime, time => {
                guitarOpen.triggerAttackRelease(toSampleKey(note), "8n", time);
            });
        });
    }

    function scheduleMelodicFast(section, sectionScale, root, offset = 0) {
        const timeline = buildSectionTimeline(section, "16n", params.bpm);

        timeline.forEach(t => {
            const note = pickNote(sectionScale);
            lastNoteOfSection = note;
            const eventTime = section.startTime + t + offset;
            scheduleIfInSection(section, eventTime, time => {
                guitarOpen.triggerAttackRelease(toSampleKey(note), "16n", time);
            });
        });
    }

    
        // ------------------------------------------------------------
    // TRANSIZIONI (costruzione oggetto, NON schedulata)
    // ------------------------------------------------------------

    function chooseTransitionByDistance(fromNote, toNote) {
        const letters = ["C","D","E","F","G","A","B"];

        const i1 = letters.indexOf(fromNote);
        const i2 = letters.indexOf(toNote);

        if (i1 === -1 || i2 === -1) return "syncopated_hits";

        let dist = Math.abs(i1 - i2);
        if (dist > 3) dist = 7 - dist;

        if (dist <= 1) {
            const choices = ["gallop_9", "tremolo_burst", "syncopated_hits", "open_hit"];
            return choices[Math.floor(rand() * choices.length)];
        }

        if (dist === 2 || dist === 3) {
            const choices = ["power_walk", "scale_up", "scale_down"];
            return choices[Math.floor(rand() * choices.length)];
        }

        const choices = ["scale_up", "scale_down", "power_walk", "power_slide"];
        return choices[Math.floor(rand() * choices.length)];
    }


    function buildTransitionObject(sectionScale, fromNote, toNote) {
        const transitionKey = chooseTransitionByDistance(fromNote, toNote);
        const pattern = transitionPatterns[transitionKey];
        if (!pattern) return null;

        // Melodia generata dal pattern
        const melody = pattern.melodicPattern(fromNote, toNote, sectionScale);
        if (!melody || melody.length === 0) return null;

        // Eventi ritmici → oggetti { beatOffset, note }
        const events = pattern.rhythmicPattern.map((beatOffset, i) => ({
            beatOffset,
            note: melody[i % melody.length]
        }));

        if (enableLog) {
            console.log(
                `%c[RIFF] TRANSITION SELECTED: ${pattern.name} | ${fromNote} → ${toNote}`,
                "color:#ffaa00; font-weight:bold;"
            );
        }

        return {
            type: pattern.name,
            durationBeats: pattern.durationBeats,
            events
        };
    }

    
    // ------------------------------------------------------------
    // DISPATCHER ROBUSTO
    // ------------------------------------------------------------

    function schedulePalmMutePattern(section, sectionScale, root, pattern, offset) {
        switch(pattern) {
            case "pm_continuous":   return schedulePalmMuteContinuous(section, sectionScale, root, offset);
            case "gallop":          return scheduleGallop(section, sectionScale, root, offset);
            case "pedal":           return schedulePedal(section, sectionScale, root, offset);
            case "pedal_syncopated":return schedulePedalSyncopated(section, sectionScale, root, offset);
            case "syncopated_pm":   return scheduleSyncopatedPalmMute(section, sectionScale, root, offset);
            case "gallop_light":    return scheduleOutroGallopLight(section, sectionScale, root, offset);
            case "pm_support":      return schedulePmSupport(section, sectionScale, root, offset);
            case "pm_half_time":    return schedulePmHalfTime(section, sectionScale, root, offset);
            case "pm_sparse":       return schedulePmSparse(section, sectionScale, root, offset);
            case "pm_groove":       return schedulePmGroove(section, sectionScale, root, offset);
        }
    }

    function scheduleOpenPattern(section, sectionScale, root, pattern, offset) {
        switch(pattern) {
            case "open_sustain":    return scheduleOpenSustain(section, sectionScale, root, offset);
            case "open_accent":     return scheduleOpenAccent(section, sectionScale, root, offset);
            case "open_syncopated": return scheduleOpenSyncopated(section, sectionScale, root, offset);
            case "melodic_open":    return scheduleMelodicOpen(section, sectionScale, root, offset);
            case "melodic_fast":    return scheduleMelodicFast(section, sectionScale, root, offset);
            case "open_half_time":  return scheduleOpenHalfTime(section, sectionScale, root, offset);
            case "open_epic":       return scheduleOpenEpic(section, sectionScale, root, offset);
            case "open_drive":      return scheduleOpenDrive(section, sectionScale, root, offset);
            case "melodic_8n":      return scheduleMelodic8n(section, sectionScale, root, offset);
        }
    }

    // ------------------------------------------------------------
    // SCHEDULAZIONE SEZIONE
    // ------------------------------------------------------------

    function scheduleSection(section, sectionScale, progression) {

        Tone.Transport.schedule(time => {
            console.log(
                `%c[RIFF] >>> SECTION START: ${section.name.toUpperCase()} @ ${section.startTime.toFixed(3)}`,
                "color:#00ffcc; font-weight:bold;"
            );
        }, section.startTime);

        const measures = section.measures;
        const patternMap = [];
        lastNoteOfSection = null;

        const firstDegree = progression[0 % progression.length];
        const firstRoot = degreeToRoot(firstDegree, params.tonalCenter);
        const firstRootLetter = toLetter(firstRoot);

        for (let i = 0; i < measures; i++) {

            const degree = progression[i % progression.length];
            const root = degreeToRoot(degree, params.tonalCenter);

            // Pattern scelto
            const pattern = chooseRiffPattern(section.name, params.imageParams, rand);

            // Normalizzazione robusta
            const normalized = pattern.trim().toLowerCase();

            patternMap.push(normalized);

            if (enableLog) {
                console.log(
                    `%c[RIFF] measure ${i+1}/${measures} | degree: ${degree} | root: ${root} | pattern: ${normalized}`,
                    "color:#ff00ff; font-weight:bold;"
                );
            }

            const offset = i * measureDuration;

            let scheduled = false;

            // PALM
            if (!scheduled && (
                normalized.startsWith("pm") ||
                normalized === "gallop" ||
                normalized === "pedal" ||
                normalized === "pedal_syncopated" ||
                normalized === "syncopated_pm" ||
                normalized === "gallop_light" ||
                normalized === "pm_support"
            )) {
                schedulePalmMutePattern(section, sectionScale, root, normalized, offset);
                scheduled = true;
            }

            // OPEN
            if (!scheduled && (
                normalized.startsWith("open") ||
                normalized === "melodic_fast" ||
                normalized === "melodic_8n" ||
                normalized === "melodic_open"
            )) {
                scheduleOpenPattern(section, sectionScale, root, normalized, offset);
                scheduled = true;
            }

            // Se pattern sconosciuto → fallback sicuro
            if (!scheduled) {
                console.warn("[RIFF] Pattern sconosciuto:", normalized, "→ fallback open_sustain");
                scheduleOpenSustain(section, sectionScale, root, offset);
            }
        }

        const sectionEnd = section.startTime + section.measures * measureDuration;

        Tone.Transport.schedule(time => {
            console.log(
                `%c[RIFF] <<< SECTION END: ${section.name.toUpperCase()} @ ${sectionEnd.toFixed(3)}`,
                "color:#00ffcc; font-weight:bold;"
            );
        }, sectionEnd);

        // Transizione (non schedulata)
        const transition = lastNoteOfSection
            ? buildTransitionObject(sectionScale, lastNoteOfSection, firstRootLetter)
            : null;

        return {
            patternMap,
            lastNote: lastNoteOfSection,
            nextFirstNote: firstRootLetter,
            transition
        };
    }

    // ------------------------------------------------------------
    // EXPORT
    // ------------------------------------------------------------

    return { scheduleSection };
}


