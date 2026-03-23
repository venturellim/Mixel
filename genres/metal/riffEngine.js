// riffEngine.js — versione 023
// 022.2 + transizioni come oggetti (non schedulate) + scelta musicale per distanza

import * as Tone from "https://esm.sh/tone";

import { nearestNatural } from "../../utils/harmonyUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { chooseRiffPattern } from "./riffPatterns.js";
import { degreeToRoot } from "./metalTheory.js";
import { transitionPatterns } from "./transitionPatterns.js";

console.log("riffEngine.js ver. 024.1 loaded");

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
            lastNoteOfSection = note;
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
            lastNoteOfSection = note;
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
            lastNoteOfSection = note;
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
            lastNoteOfSection = note;
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
                lastNoteOfSection = note;
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
            lastNoteOfSection = note;
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
                lastNoteOfSection = note;
                const eventTime = section.startTime + t + offset + jitter(rand);
                scheduleIfInSection(section, eventTime, time => {
                    guitarPalm.triggerAttackRelease(toSampleKey(note), "16n", time);
                });
            }
        });
    }
    
    // ============================================================
// PALM PATTERNS LENTI / GROOVE
// ============================================================

// 1) PM HALF-TIME — colpi su 1 e 3
function schedulePmHalfTime(section, sectionScale, root, offset = 0) {
    const timeline = buildSectionTimeline(section, "2n", params.bpm); // 1 colpo ogni mezzo
    const pedal = toLetter(root);

    timeline.forEach(t => {
        const note = pedal;
        lastNoteOfSection = note;
        const eventTime = section.startTime + t + offset + jitter(rand);
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(note), "8n", time);
        });
    });
}

// 2) PM SPARSE — colpi su 1, “e” di 2, 4
function schedulePmSparse(section, sectionScale, root, offset = 0) {
    const s = section.startTime;
    const beat = secondsPerBeat;
    const pedal = toLetter(root);

    const hits = [
        0 * beat,      // 1
        1.5 * beat,    // "e" di 2
        3 * beat       // 4
    ];

    hits.forEach(h => {
        const eventTime = s + offset + h + jitter(rand);
        lastNoteOfSection = pedal;
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(pedal), "8n", time);
        });
    });
}

// 3) PM GROOVE — ottavi regolari con accenti
function schedulePmGroove(section, sectionScale, root, offset = 0) {
    const timeline = buildSectionTimeline(section, "8n", params.bpm);
    const pedal = toLetter(root);

    timeline.forEach((t, i) => {
        const note = (i % 4 === 0) ? pedal : pickNote(sectionScale);
        lastNoteOfSection = note;
        const eventTime = section.startTime + t + offset + jitter(rand);
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(note), "8n", time);
        });
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
            lastNoteOfSection = chord[0];
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
            lastNoteOfSection = chord[0];
            scheduleIfInSection(section, eventTime, time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(toSampleKey(n), "1n", time));
            });

            eventTime = s + t + secondsPerBeat * 3 + offset;
            lastNoteOfSection = chord[0];
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
            lastNoteOfSection = chord[0];
            scheduleIfInSection(section, eventTime, time => {
                chord.forEach(n => guitarOpen.triggerAttackRelease(toSampleKey(n), "2n", time));
            });

            if (i % 2 === 0) {
                eventTime = s + t + secondsPerBeat * 3 + offset;
                lastNoteOfSection = chord[0];
                scheduleIfInSection(section, eventTime, time => {
                    chord.forEach(n => guitarOpen.triggerAttackRelease(toSampleKey(n), "1n", time));
                });
            }
        });
    }

function scheduleMelodicOpen(section, sectionScale, root, offset = 0) {
    const timeline = buildSectionTimeline(section, "4n", params.bpm);
    timeline.forEach(t => {
        const note = pickNote(sectionScale);
        lastNoteOfSection = note;
        const eventTime = section.startTime + t + offset;
        scheduleIfInSection(section, eventTime, time => {
            guitarOpen.triggerAttackRelease(toSampleKey(note), "4n", time);
        });
    });
}


// ============================================================
// OPEN PATTERNS LENTI / EPICI
// ============================================================

// 1) OPEN HALF-TIME — power chord su 1 e 3
function scheduleOpenHalfTime(section, sectionScale, root, offset = 0) {
    const timeline = buildSectionTimeline(section, "2n", params.bpm);
    const chord = buildNaturalPowerChord(root);

    timeline.forEach(t => {
        const eventTime = section.startTime + t + offset;
        lastNoteOfSection = chord[0];
        scheduleIfInSection(section, eventTime, time => {
            chord.forEach(n => guitarOpen.triggerAttackRelease(toSampleKey(n), "2n", time));
        });
    });
}

// 2) OPEN EPIC — colpi su 1 e 2.5 (classico power metal)
function scheduleOpenEpic(section, sectionScale, root, offset = 0) {
    const s = section.startTime;
    const beat = secondsPerBeat;
    const chord = buildNaturalPowerChord(root);

    const hits = [
        0 * beat,      // 1
        2.5 * beat     // 2.5
    ];

    hits.forEach(h => {
        const eventTime = s + offset + h;
        lastNoteOfSection = chord[0];
        scheduleIfInSection(section, eventTime, time => {
            chord.forEach(n => guitarOpen.triggerAttackRelease(toSampleKey(n), "1n", time));
        });
    });
}

// 3) OPEN DRIVE — ottavi aperti
function scheduleOpenDrive(section, sectionScale, root, offset = 0) {
    const timeline = buildSectionTimeline(section, "8n", params.bpm);
    const chord = buildNaturalPowerChord(root);

    timeline.forEach(t => {
        const eventTime = section.startTime + t + offset;
        lastNoteOfSection = chord[0];
        scheduleIfInSection(section, eventTime, time => {
            chord.forEach(n => guitarOpen.triggerAttackRelease(toSampleKey(n), "8n", time));
        });
    });
}

// ============================================================
// MELODIC PATTERNS LENTI
// ============================================================

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

    // ============================================================
    // SCELTA TRANSIZIONE BASATA SU DISTANZA
    // ============================================================
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

    // ============================================================
    // COSTRUZIONE OGGETTO TRANSIZIONE (NON SCHEDULATA)
    // ============================================================
    function buildTransitionObject(sectionScale, fromNote, toNote) {
        const transitionKey = chooseTransitionByDistance(fromNote, toNote);
        const pattern = transitionPatterns[transitionKey];
        if (!pattern) return null;

        const melody = pattern.melodicPattern(fromNote, toNote, sectionScale);
        if (!melody || melody.length === 0) return null;

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
            case "melodic_open": return scheduleMelodicOpen(section, sectionScale, root, offset);

            case "melodic_fast":    return scheduleMelodicFast(section, sectionScale, root, offset);
            case "open_half_time":  return scheduleOpenHalfTime(section, sectionScale, root, offset);
case "open_epic":       return scheduleOpenEpic(section, sectionScale, root, offset);
case "open_drive":      return scheduleOpenDrive(section, sectionScale, root, offset);
case "melodic_8n":      return scheduleMelodic8n(section, sectionScale, root, offset);

        }
    }

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
    pattern === "melodic_fast" ||
    pattern === "melodic_8n" ||
    pattern === "melodic_open") {

 

                scheduleOpenPattern(section, sectionScale, root, pattern, offset);
                continue;
            }
        }

        const sectionEnd = section.startTime + section.measures * measureDuration;

        Tone.Transport.schedule(time => {
            console.log(
                `%c[RIFF] <<< SECTION END: ${section.name.toUpperCase()} @ ${sectionEnd.toFixed(3)}`,
                "color:#00ffcc; font-weight:bold;"
            );
        }, sectionEnd);

        // Costruzione oggetto transizione (NON schedulata)
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

    return { scheduleSection };
}
