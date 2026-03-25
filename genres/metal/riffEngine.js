// riffEngine.js — versione 026
// Dispatcher robusto + normalizzazione pattern + fix cluster open/palm

import * as Tone from "https://esm.sh/tone";

import { nearestNatural } from "../../utils/harmonyUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { chooseRiffPattern } from "./riffPatterns.js";
import { degreeToRoot } from "./metalTheory.js";

console.log("riffEngine.js ver. 027.2 loaded");

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

const patternMeasures = {
    // PALM (tutti 2 misure)
    pm_sparse: 2,
    pm_groove: 2,
    pm_half_time: 2,
    pedal: 2,
    pedal_syncopated: 2,
    syncopated_pm: 2,
    gallop: 2,
    gallop_light: 2,
    pm_support: 2,
    open_sustain_2m: 2,

    // OPEN (tutti 1 misura)
    open_half_time: 1,
    open_epic: 1,
    open_drive: 1,
    open_sustain_1m: 1,
    open_strike_quarter: 1,
    open_strike_eighth: 1,
    intro_stratovarius: 1,


    // MELODIC (1 misura)
    melodic_open: 1,
    melodic_8n: 1,
    melodic_fast: 1,

    // fallback
    default: 1
};

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
    const s = section.startTime + offset;

    // 2 misure, griglia 16n → tanti colpi, ma ogni colpo dura 8n
    const timeline = buildSectionTimeline({ measures: 2 }, "16n", params.bpm);

    timeline.forEach(t => {
        const eventTime = s + t + jitter(rand);
        lastNoteOfSection = rootLetter;
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
        });
    });
}

function scheduleGallop(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const timeline = buildSectionTimeline({ measures: 2 }, "8n", params.bpm);

    timeline.forEach(t => {
        const base = s + t;

        const hits = [
            base,
            base + secondsPerBeat / 8,
            base + secondsPerBeat / 4
        ];

        hits.forEach(h => {
            const eventTime = h + jitter(rand);
            lastNoteOfSection = rootLetter;
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
            });
        });
    });
}

function schedulePedal(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const hits = [];

    // 2 misure → colpi ogni 16n
    const timeline = buildSectionTimeline({ measures: 2 }, "16n", params.bpm);

    timeline.forEach(t => {
        const eventTime = s + t + jitter(rand);
        lastNoteOfSection = rootLetter;
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
        });
    });
}

function schedulePedalSyncopated(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const timeline = buildSectionTimeline({ measures: 2 }, "16n", params.bpm);

    timeline.forEach((t, i) => {
        if (i % 3 !== 1) { // sincopi leggere
            const eventTime = s + t + jitter(rand);
            lastNoteOfSection = rootLetter;
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
            });
        }
    });
}

function scheduleSyncopatedPalmMute(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const timeline = buildSectionTimeline({ measures: 2 }, "16n", params.bpm);

    timeline.forEach((t, i) => {
        if (i % 4 !== 2) {
            const eventTime = s + t + jitter(rand);
            lastNoteOfSection = rootLetter;
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
            });
        }
    });
}

function scheduleOutroGallopLight(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    // 2 misure, griglia 8n → ogni 8n ha 2 colpi (leggero ma pieno)
    const timeline = buildSectionTimeline({ measures: 2 }, "8n", params.bpm);

    timeline.forEach(t => {
        const base = s + t;

        const hits = [
            base,
            base + secondsPerBeat / 8   // leggero anticipo, effetto gallop light
        ];

        hits.forEach(h => {
            const eventTime = h + jitter(rand);
            lastNoteOfSection = rootLetter;
            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
            });
        });
    });
}

function schedulePmSupport(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    // Timeline di 2 misure, griglia 8n
    const timeline = buildSectionTimeline({ measures: 2 }, "8n", params.bpm);

    timeline.forEach((t, i) => {
        if (i % 2 === 0) { // colpi ogni 2 ottavi
            lastNoteOfSection = rootLetter;

            const eventTime = s + t + jitter(rand);

            scheduleIfInSection(section, eventTime, time => {
                guitarPalm.triggerAttackRelease(
                    toSampleKey(rootLetter),
                    "16n",
                    time
                );
            });
        }
    });
}

            // ------------------------------------------------------------
    // PALM PATTERNS LENTI — SAMPLE GIÀ POWER CHORD (suoniamo SOLO la root)
    // ------------------------------------------------------------

    function schedulePmHalfTime(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const hits = [];

    // 2 misure → colpi ogni beat
    for (let m = 0; m < 2; m++) {
        const base = m * measureDuration;
        hits.push(
            base + secondsPerBeat * 0,
            base + secondsPerBeat * 1,
            base + secondsPerBeat * 2,
            base + secondsPerBeat * 3
        );
    }

    hits.forEach(h => {
        const eventTime = s + h + jitter(rand);
        lastNoteOfSection = rootLetter;
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "4n", time);
        });
    });
}


    function schedulePmSparse(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const hits = [];

    // 2 misure → 8 colpi per misura → 16 colpi totali
    for (let m = 0; m < 2; m++) {
        const base = m * measureDuration;
        hits.push(
            base + secondsPerBeat * 0,
            base + secondsPerBeat * 0.5,
            base + secondsPerBeat * 1,
            base + secondsPerBeat * 1.5,
            base + secondsPerBeat * 2,
            base + secondsPerBeat * 2.5,
            base + secondsPerBeat * 3,
            base + secondsPerBeat * 3.5
        );
    }

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

    const hits = [];

    // 2 misure → colpi ogni mezzo beat
    for (let m = 0; m < 2; m++) {
        const base = m * measureDuration;
        hits.push(
            base + secondsPerBeat * 0,
            base + secondsPerBeat * 0.5,
            base + secondsPerBeat * 1,
            base + secondsPerBeat * 1.5,
            base + secondsPerBeat * 2,
            base + secondsPerBeat * 2.5,
            base + secondsPerBeat * 3,
            base + secondsPerBeat * 3.5
        );
    }

    hits.forEach(h => {
        const eventTime = s + h + jitter(rand);
        lastNoteOfSection = rootLetter;
        scheduleIfInSection(section, eventTime, time => {
            guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
        });
    });
}

            // ------------------------------------------------------------
    // OPEN PATTERNS — SAMPLE GIÀ POWER CHORD (suoniamo SOLO la root)
    // ------------------------------------------------------------

function scheduleIntroStratovarius(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    // --- FRASE 1 ---
    // Cp (1/8)
    scheduleIfInSection(section, s, time => {
        guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
    });

    // Cp (1/8)
    scheduleIfInSection(section, s + secondsPerBeat * 0.5, time => {
        guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
    });

    // Cccc (1/2)
    scheduleIfInSection(section, s + secondsPerBeat * 1, time => {
        guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "2n", time);
    });

    // --- FRASE 2 ---
    // Cp (1/8)
    scheduleIfInSection(section, s + secondsPerBeat * 2, time => {
        guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
    });

    // Cp (1/8)
    scheduleIfInSection(section, s + secondsPerBeat * 2.5, time => {
        guitarPalm.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
    });

    // Cccc (1/2)
    scheduleIfInSection(section, s + secondsPerBeat * 3, time => {
        guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "2n", time);
    });

    lastNoteOfSection = rootLetter;
}

    function scheduleOpenSustain1m(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const eventTime = section.startTime + offset;

    lastNoteOfSection = rootLetter;

    scheduleIfInSection(section, eventTime, time => {
        guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "1m", time);
    });
}

function scheduleOpenSustain2m(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const eventTime = section.startTime + offset;

    lastNoteOfSection = rootLetter;

    scheduleIfInSection(section, eventTime, time => {
        guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "2m", time);
    });
}

function scheduleOpenSustain(section, sectionScale, root, offset = 0) {
    if (params.bpm < 140) {
        return scheduleOpenSustain1m(section, sectionScale, root, offset);
    } else {
        return scheduleOpenSustain2m(section, sectionScale, root, offset);
    }
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
    
    function scheduleOpenStrikeQuarter(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    // Colpo 1: inizio misura, durata 3/4
    scheduleIfInSection(section, s, time => {
        guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "2n.", time); 
        // "2n." = dotted half = 3/4 di misura
    });

    // Colpo 2: sul beat 4, durata 1/4
    const secondHit = s + secondsPerBeat * 3;
    scheduleIfInSection(section, secondHit, time => {
        guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "4n", time);
    });

    lastNoteOfSection = rootLetter;
}

function scheduleOpenStrikeEighth(section, sectionScale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    // Colpo 1: inizio misura, durata 7/8
    scheduleIfInSection(section, s, time => {
        guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "1m", time, 0, 0.875);
        // 0.875 = 7/8 della misura
    });

    // Colpo 2: sull’ottavo finale (beat 3.5)
    const secondHit = s + secondsPerBeat * 3.5;
    scheduleIfInSection(section, secondHit, time => {
        guitarOpen.triggerAttackRelease(toSampleKey(rootLetter), "8n", time);
    });

    lastNoteOfSection = rootLetter;
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
            case "open_strike_quarter":
return scheduleOpenStrikeQuarter(section, sectionScale, root, offset);
    case "open_strike_eighth":
return scheduleOpenStrikeEighth(section, sectionScale, root, offset);
    case "intro_stratovarius":
return scheduleIntroStratovarius(section, sectionScale, root, offset);
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

        for (let i = 0; i < measures; ) {

            const degree = progression[i % progression.length];
            const root = degreeToRoot(degree, params.tonalCenter);

            // Pattern scelto
            // scegliamo il pattern UNA VOLTA per tutta la sezione
if (i === 0) {
    var sectionPattern = chooseRiffPattern(section.name, params.imageParams, rand);
}
const pattern = sectionPattern;

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
    normalized === "melodic_open" ||
    normalized === "intro_stratovarius"
)) {

                scheduleOpenPattern(section, sectionScale, root, normalized, offset);
                scheduled = true;
            }

            // Se pattern sconosciuto → fallback sicuro
            if (!scheduled) {
                console.warn("[RIFF] Pattern sconosciuto:", normalized, "→ fallback open_sustain");
                scheduleOpenSustain(section, sectionScale, root, offset);
            }
            
const patternLength = patternMeasures[normalized] ?? patternMeasures.default;
i += patternLength;

            
        }
        const sectionEnd = section.startTime + section.measures * measureDuration;

        Tone.Transport.schedule(time => {
            console.log(
                `%c[RIFF] <<< SECTION END: ${section.name.toUpperCase()} @ ${sectionEnd.toFixed(3)}`,
                "color:#00ffcc; font-weight:bold;"
            );
        }, sectionEnd);

        console.log(
    "%c[RIFF DEBUG] lastNote:", 
    "color:#ffaa00; font-weight:bold;", 
    lastNoteOfSection
);

console.log(
    "%c[RIFF DEBUG] patternMap:", 
    "color:#ffaa00; font-weight:bold;", 
    patternMap
);

return {
    patternMap,
    lastNote: lastNoteOfSection,
    nextFirstNote: firstRootLetter
};

    }

    // ------------------------------------------------------------
    // EXPORT
    // ------------------------------------------------------------

    return { scheduleSection };
}


