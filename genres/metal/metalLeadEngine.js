// metalLeadEngine.js — ver. 088.1 FINAL (Con tutti gli enhancer)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote, leadBus } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 088.1 loaded");

// ============================================================
// UTILITY
// ============================================================

const LeadUtils = {
    rand() { return Math.random(); },
    randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
};

// ============================================================
// FLOYD ROSE (effetti chitarra)
// ============================================================

const LeadFloyd = {
    apply(guitarLead, time, type="scoop") {
        if (!guitarLead || !guitarLead.playbackRate) return;
        const pr = guitarLead.playbackRate;
        if (type==="scoop") {
            pr.setValueAtTime(0.95, time);
            pr.linearRampToValueAtTime(1.0, time+0.12);
        } else if (type==="dive") {
            pr.setValueAtTime(1.0, time);
            pr.exponentialRampToValueAtTime(0.7, time+0.18);
            pr.linearRampToValueAtTime(1.0, time+0.32);
        } else if (type==="vibrato") {
            for (let i=0;i<6;i++){
                const t = time + i*0.04;
                const val = i%2===0 ? 0.98 : 1.02;
                pr.setValueAtTime(val, t);
            }
            pr.setValueAtTime(1.0, time+0.25);
        }
    }
};

// ============================================================
// LIBRARY (sezioni normali — INVARIATE)
// ============================================================

const library = {
    intro: [
        [0, 1, 2, 3, 4, 8, 12],
        [0, 4, 8, 10, 11, 12, 13, 14],
        [0, 2, 3, 4, 8, 10, 11, 12],
        [0, 3, 4, 7, 8, 11, 12, 15],
        [0, 1, 2, 3, 4, 5, 6, 7, 8]
    ],
    verse: [
        [0, 8],
        [0, 4, 8, 12],
        [0, 6, 8, 14],
        [0, 4, 10],
        [2, 6, 10, 14],
        [0, 2, 4, 8, 10, 12]
    ],
    prechorus: [
        [0, 4, 8, 12],
        [0, 2, 4, 6, 8, 10, 12, 14],
        [0, 4, 7, 11, 12],
        [0, 8, 12, 14],
        [0, 2, 4, 8, 10, 12]
    ],
    chorus: [
        [0, 2, 4, 6, 8, 10, 12, 14],
        [0, 8, 12],
        [0, 4, 8, 12],
        [0, 3, 8, 11],
        [0, 6, 7, 8, 14]
    ]
};

// ============================================================
// MELODIC LIBRARY (sezioni normali — INVARIATE)
// ============================================================

const melodicLibrary = {
    epic: [
        [0, 4, 7, 4, 5, 4, 2, 0],
        [0, 0, 4, 4, 7, 7, 4, 4],
        [0, 4, 5, 7, 0, 4, 5, 7],
        [7, 4, 0, 4, 7, 4, 0, 0],
        [0, 2, 4, 7, 5, 4, 2, 0],
        [0, 7, 4, 2, 0, 4, 2, 0],
        [4, 0, 4, 5, 7, 5, 4, 0],
        [0, 3, 5, 0, 3, 5, 7, 0]
    ],
    evil: [
        [0, 1, 0, 1, 4, 3, 1, 0],
        [0, 6, 5, 0, 6, 5, 1, 0],
        [0, 1, 4, 1, 0, 1, 4, 1],
        [0, 3, 4, 0, 3, 4, 6, 0],
        [1, 0, 1, 0, 3, 1, 0, 0],
        [0, 1, 3, 4, 6, 4, 3, 1],
        [0, 4, 3, 1, 0, 1, 3, 4],
        [6, 5, 4, 3, 2, 1, 0, 0]
    ],
    active: [
        [0, 1, 2, 3, 4, 5, 6, 7],
        [0, 2, 4, 2, 3, 5, 7, 5],
        [0, 2, 0, 4, 0, 5, 0, 7],
        [4, 0, 5, 0, 7, 0, 5, 0],
        [0, 2, 4, 5, 7, 5, 4, 2],
        [0, 3, 2, 5, 4, 7, 6, 0],
        [7, 5, 4, 2, 7, 5, 4, 2],
        [0, 7, 6, 7, 0, 5, 4, 5]
    ],
    emotional: [
        [0, 6, 5, 4, 2, 3, 2, 0],
        [2, 3, 2, 0, 4, 5, 4, 2],
        [4, 2, 0, 6, 5, 4, 2, 2],
        [0, 4, 6, 7, 6, 4, 2, 0],
        [5, 4, 2, 0, 5, 4, 2, 0],
        [0, 2, 4, 6, 0, 2, 4, 6],
        [4, 5, 7, 4, 2, 3, 2, 0],
        [0, 0, 6, 6, 5, 5, 4, 4]
    ],
    prechorus: [
        [0, 2, 3, 4, 5, 6, 7, 7],
        [0, 0, 2, 2, 4, 4, 6, 6],
        [0, 4, 0, 5, 0, 6, 0, 7],
        [4, 5, 4, 5, 6, 7, 7, 7]
    ]
};

// ============================================================
// ENHANCER PER RITMICA
// ============================================================

function enhanceRhythmPattern(basePattern) {
    if (!Array.isArray(basePattern) || basePattern.length === 0) return basePattern;
    const result = [...basePattern];

    for (let i = 0; i < basePattern.length - 1; i++) {
        const a = basePattern[i];
        const b = basePattern[i + 1];
        const gap = b - a;
        if (gap >= 4 && LeadUtils.rand() < 0.5) {
            const mid = a + Math.floor(gap / 2);
            if (!result.includes(mid) && mid >= 0 && mid <= 15) {
                result.push(mid);
            }
        }
    }

    const unique = Array.from(new Set(result)).sort((x, y) => x - y);
    return unique;
}

function enhanceRhythmGhostSteps(pattern) {
    if (!Array.isArray(pattern) || pattern.length < 2) return pattern;
    const out = [...pattern];

    if (Math.random() < 0.20) {
        const i = Math.floor(Math.random() * out.length);
        const ghost = out[i] - 1;
        if (ghost >= 0 && !out.includes(ghost)) out.push(ghost);
    }

    if (Math.random() < 0.20) {
        const i = Math.floor(Math.random() * out.length);
        const ghost = out[i] + 1;
        if (ghost <= 15 && !out.includes(ghost)) out.push(ghost);
    }

    return Array.from(new Set(out)).sort((a, b) => a - b);
}

function addAnticipation(rhythmPattern, energy) {
    if (!Array.isArray(rhythmPattern) || rhythmPattern.length < 2) return rhythmPattern;
    if (energy < 0.5) return rhythmPattern;
    
    const out = [...rhythmPattern];
    if (Math.random() < 0.25 && out.length > 1) {
        const last = out[out.length - 1];
        const secondLast = out[out.length - 2];
        const anticipation = Math.floor((last + secondLast) / 2);
        if (!out.includes(anticipation) && anticipation >= 0 && anticipation <= 15) {
            out.push(anticipation);
            out.sort((a, b) => a - b);
        }
    }
    return out;
}

function addStrategicPause(rhythmPattern, energy) {
    if (!Array.isArray(rhythmPattern) || rhythmPattern.length < 3) return rhythmPattern;
    if (energy > 0.7) return rhythmPattern;
    
    const out = [...rhythmPattern];
    if (Math.random() < 0.20 && out.length > 3) {
        const removeIdx = Math.floor(out.length / 2);
        out.splice(removeIdx, 1);
    }
    return out;
}

// NUOVI ENHANCER PER RITMICA
function addPolyrhythmHint(pattern, complexity) {
    if (!Array.isArray(pattern) || pattern.length < 4) return pattern;
    if (complexity < 0.7) return pattern;
    
    const out = [...pattern];
    if (!out.includes(2) && Math.random() < 0.3) out.push(2);
    if (!out.includes(6) && Math.random() < 0.3) out.push(6);
    if (!out.includes(10) && Math.random() < 0.3) out.push(10);
    return out.sort((a, b) => a - b);
}

function addGentleSwing(pattern, texture) {
    if (!Array.isArray(pattern) || pattern.length < 2) return pattern;
    if (texture < 0.5) return pattern;
    
    const out = [];
    for (let step of pattern) {
        if (step % 2 === 0 && Math.random() < 0.4) {
            out.push(step - 0.5);
        } else {
            out.push(step);
        }
    }
    return out.sort((a, b) => a - b);
}

function addGhostAccent(pattern, energy) {
    if (!Array.isArray(pattern) || pattern.length < 3) return pattern;
    if (energy < 0.6) return pattern;
    
    const out = [...pattern];
    const ghostSteps = [1, 3, 5, 7, 9, 11, 13];
    for (let g of ghostSteps) {
        if (Math.random() < 0.15 && !out.includes(g)) {
            out.push(g);
        }
    }
    return out.sort((a, b) => a - b);
}

// ============================================================
// ENHANCER PER MELODIA
// ============================================================

function enhanceMelodyLine(baseMelody) {
    if (!Array.isArray(baseMelody) || baseMelody.length === 0) return baseMelody;
    const result = [];

    for (let i = 0; i < baseMelody.length; i++) {
        const curr = baseMelody[i];
        const next = baseMelody[i + 1];
        result.push(curr);
        if (LeadUtils.rand() < 0.25) result.push(curr);
        if (next !== undefined) {
            const diff = next - curr;
            if (Math.abs(diff) === 2 && LeadUtils.rand() < 0.5) {
                const passing = curr + (diff > 0 ? 1 : -1);
                result.push(passing);
            }
        }
    }
    return result;
}

function enhanceMelodyMicroVariation(melody) {
    if (!Array.isArray(melody) || melody.length < 3) return melody;
    const out = [...melody];

    if (Math.random() < 0.20) {
        const i = Math.floor(Math.random() * (out.length - 1));
        const tmp = out[i];
        out[i] = out[i + 1];
        out[i + 1] = tmp;
    }

    if (Math.random() < 0.15) {
        const i = Math.floor(Math.random() * out.length);
        const dir = Math.random() < 0.5 ? -1 : 1;
        const shifted = out[i] + dir;
        if (shifted >= 0 && shifted <= 7) out[i] = shifted;
    }

    return out;
}

function enhanceChromaticPassing(melody, energy) {
    if (!Array.isArray(melody) || melody.length < 2) return melody;
    if (energy < 0.6) return melody;
    
    const out = [];
    for (let i = 0; i < melody.length; i++) {
        out.push(melody[i]);
        const next = melody[i + 1];
        if (next !== undefined && Math.abs(next - melody[i]) === 2 && Math.random() < 0.3) {
            const chromatic = melody[i] + (next > melody[i] ? 1 : -1);
            out.push(chromatic);
        }
    }
    return out;
}

function addTrills(melody, complexity) {
    if (!Array.isArray(melody) || melody.length < 2) return melody;
    if (complexity < 0.6) return melody;
    
    const out = [];
    for (let i = 0; i < melody.length; i++) {
        out.push(melody[i]);
        if (Math.random() < 0.15 && i < melody.length - 1) {
            const next = melody[i + 1];
            if (Math.abs(next - melody[i]) <= 2) {
                out.push(next);
                out.push(melody[i]);
                out.push(next);
            }
        }
    }
    return out;
}

function addBendEffect(melody, brightness) {
    if (!Array.isArray(melody) || melody.length < 2) return melody;
    if (brightness < 0.5) return melody;
    
    const out = [];
    for (let i = 0; i < melody.length; i++) {
        out.push(melody[i]);
        if (Math.random() < 0.10 && melody[i] < 7) {
            out.push(melody[i] + 1);
            out.push(melody[i]);
        }
    }
    return out;
}

function addSlideEffect(melody, texture) {
    if (!Array.isArray(melody) || melody.length < 2) return melody;
    if (texture < 0.5) return melody;
    
    const out = [];
    for (let i = 0; i < melody.length; i++) {
        out.push(melody[i]);
        const next = melody[i + 1];
        if (next !== undefined && Math.abs(next - melody[i]) >= 3 && Math.random() < 0.2) {
            const step = next > melody[i] ? 1 : -1;
            for (let n = melody[i] + step; n !== next; n += step) {
                out.push(n);
            }
        }
    }
    return out;
}

function addOctaveDoubling(melody, brightness) {
    if (!Array.isArray(melody) || melody.length < 2) return melody;
    if (brightness < 0.6) return melody;
    
    const out = [];
    for (let i = 0; i < melody.length; i++) {
        out.push(melody[i]);
        if (Math.random() < 0.15 && melody[i] + 7 <= 12) {
            out.push(melody[i] + 7);
        }
    }
    return out;
}

// NUOVI ENHANCER PER MELODIA
function addMirrorInversion(melody, complexity) {
    if (!Array.isArray(melody) || melody.length < 3) return melody;
    if (complexity < 0.8) return melody;
    
    const maxNote = Math.max(...melody);
    const minNote = Math.min(...melody);
    const range = maxNote - minNote;
    if (range === 0) return melody;
    
    const out = [];
    for (let i = 0; i < melody.length; i++) {
        const mirrored = minNote + (maxNote - melody[i]);
        out.push(mirrored);
    }
    return out;
}

function addEchoEffect(melody, texture) {
    if (!Array.isArray(melody) || melody.length < 2) return melody;
    if (texture < 0.6) return melody;
    
    const out = [...melody];
    const echoLength = Math.min(3, Math.floor(melody.length / 3));
    for (let i = 0; i < echoLength; i++) {
        out.push(melody[i]);
    }
    return out;
}

function addScaleRunBetweenPeaks(melody, energy) {
    if (!Array.isArray(melody) || melody.length < 4) return melody;
    if (energy < 0.7) return melody;
    
    const out = [];
    for (let i = 0; i < melody.length - 1; i++) {
        out.push(melody[i]);
        const curr = melody[i];
        const next = melody[i + 1];
        const diff = next - curr;
        if (Math.abs(diff) > 2 && Math.random() < 0.3) {
            const step = diff > 0 ? 1 : -1;
            for (let n = curr + step; n !== next; n += step) {
                out.push(n);
            }
        }
    }
    out.push(melody[melody.length - 1]);
    return out;
}

// ============================================================
// SELEZIONE FAMIGLIA MELODICA PER L'ASSOLO
// ============================================================

function getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture) {
    if (!isSoloPt2) {
        if (brightness > 0.5) return { name: "SOLO EPIC 🏰", data: melodicLibrary.epic };
        return { name: "SOLO EMOTIONAL 💧", data: melodicLibrary.emotional };
    } else {
        if (complexity > 0.6 || energy > 0.7) return { name: "SOLO ACTIVE ⚡", data: melodicLibrary.active };
        return { name: "SOLO EVIL 😈", data: melodicLibrary.evil };
    }
}

// ============================================================
// LEGACY (sezioni normali + assolo potenziato)
// ============================================================

const LeadLegacy = {
    schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, scaleType, score) {
        const { guitarLead } = instruments || {};
        if (!guitarLead) return;

        const name = section?.name?.toLowerCase() || "";
        const isChorus = name.includes("chorus") && !name.includes("pre");
        const isPreChorus = name.includes("pre");
        const isIntro = name.includes("intro") || name.includes("outro");
        const isSolo = name.includes("solo") || name.includes("bridge");
        const isSoloPt2 = name.includes("solopt2");
        const stepTime = measureDur / 16;

        const {
            energy = 0.5,
            brightness = 0.5,
            texture = 0.5,
            complexity = 0.5
        } = params?.imageParams || {};

        const isHarmonic = scaleType === "harmonicMinor";

        const getPattern = (type) => {
            const family = library[type] || library.verse;
            const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
            const index = Math.floor(Math.abs(dnaScore)) % family.length;
            return family[index];
        };

        const getMelodyFamily = () => {
            if (isPreChorus) return { name: "PRE-CHORUS 📈", data: melodicLibrary.prechorus };
            if (isChorus) {
                return brightness > 0.5
                    ? { name: "EPIC 🏰", data: melodicLibrary.epic }
                    : { name: "EMOTIONAL 💧", data: melodicLibrary.emotional };
            }
            if (energy > 0.7 && texture > 0.6) return { name: "EVIL 😈", data: melodicLibrary.evil };
            if (complexity > 0.7) return { name: "ACTIVE ⚡", data: melodicLibrary.active };
            if (brightness < 0.4) return { name: "EMOTIONAL 💧", data: melodicLibrary.emotional };
            return { name: "EPIC 🏰", data: melodicLibrary.epic };
        };

        let sectionType;
        if (isIntro) {
            sectionType = "intro";
        } else if (isPreChorus) {
            sectionType = "prechorus";
        } else if (isChorus) {
            sectionType = "chorus";
        } else {
            sectionType = "verse";
        }

        const getStrictScale = (root) => {
            const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            let cleanRoot = root.split('/')[0].replace(/[0-9]/g, '').trim();
            let isMinorLocal = root.includes('m') || (cleanRoot === cleanRoot.toLowerCase() && cleanRoot.length === 1);
            cleanRoot = cleanRoot.toUpperCase();
            const altNames = { "DB": "C#", "EB": "D#", "GB": "F#", "AB": "G#", "BB": "A#" };
            cleanRoot = altNames[cleanRoot] || cleanRoot;
            let rootIdx = allNotes.indexOf(cleanRoot);
            if (rootIdx === -1) rootIdx = 9;
            const intervals = isMinorLocal ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
            return intervals.map(interval => allNotes[(rootIdx + interval) % 12]);
        };

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);

            let currentPattern;
            let currentMelody;
            let moodName;

            if (isSolo) {
                // ============================================================
                // ASSOLO: applica TUTTI gli enhancer in base ai parametri
                // ============================================================
                const basePattern = getPattern("chorus");
                currentPattern = enhanceRhythmPattern(basePattern);
                currentPattern = enhanceRhythmGhostSteps(currentPattern);
                currentPattern = addAnticipation(currentPattern, energy);
                currentPattern = addStrategicPause(currentPattern, energy);
                currentPattern = addPolyrhythmHint(currentPattern, complexity);
                currentPattern = addGentleSwing(currentPattern, texture);
                currentPattern = addGhostAccent(currentPattern, energy);

                const soloFamily = getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture);
                const melodyIndex = Math.floor(energy * soloFamily.data.length) % soloFamily.data.length;
                const baseMelody = soloFamily.data[melodyIndex];
                
                currentMelody = enhanceMelodyLine(baseMelody);
                currentMelody = enhanceMelodyMicroVariation(currentMelody);
                currentMelody = enhanceChromaticPassing(currentMelody, energy);
                currentMelody = addTrills(currentMelody, complexity);
                currentMelody = addBendEffect(currentMelody, brightness);
                currentMelody = addSlideEffect(currentMelody, texture);
                currentMelody = addOctaveDoubling(currentMelody, brightness);
                currentMelody = addMirrorInversion(currentMelody, complexity);
                currentMelody = addEchoEffect(currentMelody, texture);
                currentMelody = addScaleRunBetweenPeaks(currentMelody, energy);

                moodName = soloFamily.name + (isHarmonic ? " (HARMONIC)" : "");
            } else {
                currentPattern = getPattern(sectionType);
                const mood = getMelodyFamily();
                const melodyIndex = Math.floor(energy * mood.data.length) % mood.data.length;
                currentMelody = mood.data[melodyIndex];
                moodName = mood.name;
            }

            console.log(
                `%c 🎸 LEAD DNA EXECUTION (measure ${m})\n` +
                `%c > Mood: ${moodName}\n` +
                `%c > Rhythm Mask: [${currentPattern.join(" - ")}]\n` +
                `%c > Melody Steps: [${currentMelody.join(", ")}]`,
                "color:#191970;font-weight:bold;font-size:12px;",
                "color:#191970;",
                "color:#191970;",
                "color:#191970;"
            );
            
            const currentScale = getStrictScale(progression[m % progression.length] || "A");
            const isTransitionMeasure = (m === section.measures - 1);

            currentPattern.forEach((s, i) => {
                if (isTransitionMeasure && s > 13 && energy > 0.6) return;

                const absoluteTime = measureStartTime + (s * stepTime);
                const nextStep = (i < currentPattern.length - 1) ? currentPattern[i + 1] : 16;
                const noteIdx = currentMelody[i % currentMelody.length];
                const octave = isChorus || isSolo ? 5 : 4;
                const noteName = normalizeNote(currentScale[noteIdx % 7], "guitarLead") + octave;

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, (nextStep - s) * stepTime, time);
                    Tone.Draw.schedule(() => {
                        if (score) score.addNote("Lead", noteName, section.name);
                    }, time);
                }, absoluteTime);
            });
        }
    }
};

// ============================================================
// SCHEDULE LEAD
// ============================================================

export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    const tonalCenter = params?.tonalCenter || params?.imageParams?.tonalCenter || "A4";
    const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";
    const rootNote = tonalCenter.replace(/[0-9]/g, "");
    const isMinor = scaleType.includes("minor");
    
    console.log("🎸 tonalCenter:", tonalCenter, "→ root:", rootNote);
    console.log("🎸 scaleType:", scaleType, "→ isMinor:", isMinor);
      
    LeadLegacy.schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, scaleType, score);
}