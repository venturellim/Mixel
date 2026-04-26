// metalLeadEngine.js — ver. 085 FINAL (Solo con librerie dedicate, stesso sistema del non-solo)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote, leadBus } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 082.4 loaded");

// ============================================================
// UTILITY
// ============================================================

const LeadUtils = {
    rand() { return Math.random(); },
    randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
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
// LEGACY SOLO/NON-SOLO
// ============================================================

const LeadLegacy = {
    schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, score) {
        const { guitarLead } = instruments || {};
        if (!guitarLead) return;

        const name = section?.name?.toLowerCase() || "";
        const isChorus = name.includes("chorus") && !name.includes("pre");
        const isPreChorus = name.includes("pre");
        const isIntro = name.includes("intro") || name.includes("outro");
        const isSolo = name.includes("solo"); 
        const isBridge = name.includes("bridge");
        const stepTime = measureDur / 16;

        const {
            energy = 0.5,
            brightness = 0.5,
            texture = 0.5,
            complexity = 0.5
        } = params?.imageParams || {};

        // ============================================================
        // LIBRARY (identica alla 76.1 - con librerie solo)
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
            ],
            // SOLO
            solo: [
                [0, 4, 8, 12, 16, 12, 8, 4],
                [0, 3, 6, 9, 12, 15, 12, 9, 6, 3],
                [0, 2, 4, 6, 8, 10, 12, 14, 16, 14, 12, 10, 8, 6, 4, 2],
                [0, 5, 10, 15, 10, 5],
                [0, 4, 8, 12, 16, 20, 16, 12, 8, 4],
                [0, 6, 12, 18, 12, 6],
                [0, 3, 7, 10, 14, 17, 14, 10, 7, 3],
                [0, 4, 7, 11, 14, 17, 14, 11, 7, 4],
                [0, 5, 8, 12, 16, 19, 16, 12, 8, 5]
            ],
            solo_fast: [
                [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2],
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
                [0, 3, 5, 7, 8, 10, 12, 14, 15, 17, 15, 14, 12, 10, 8, 7, 5, 3],
                [0, 2, 5, 7, 9, 12, 14, 16, 18, 16, 14, 12, 9, 7, 5, 2]
            ],
            solo_slow: [
                [0, 8, 12, 8, 0],
                [0, 5, 10, 15, 10, 5],
                [0, 4, 8, 12, 8, 4, 0],
                [0, 7, 12, 17, 12, 7],
                [0, 12, 19, 12],
                [0, 8, 15, 22, 15, 8]
            ]
        };

        // ============================================================
        // MELODIC LIBRARY (identica alla 76.1 + solo)
// ============================================================
        const melodicLibrary = {
            epic: [
                [0, 4, 7, 4, 5, 4, 2, 0], [0, 0, 4, 4, 7, 7, 4, 4],
                [0, 4, 5, 7, 0, 4, 5, 7], [7, 4, 0, 4, 7, 4, 0, 0],
                [0, 2, 4, 7, 5, 4, 2, 0], [0, 7, 4, 2, 0, 4, 2, 0],
                [4, 0, 4, 5, 7, 5, 4, 0], [0, 3, 5, 0, 3, 5, 7, 0]
            ],
            evil: [
                [0, 1, 0, 1, 4, 3, 1, 0], [0, 6, 5, 0, 6, 5, 1, 0],
                [0, 1, 4, 1, 0, 1, 4, 1], [0, 3, 4, 0, 3, 4, 6, 0],
                [1, 0, 1, 0, 3, 1, 0, 0], [0, 1, 3, 4, 6, 4, 3, 1],
                [0, 4, 3, 1, 0, 1, 3, 4], [6, 5, 4, 3, 2, 1, 0, 0]
            ],
            active: [
                [0, 1, 2, 3, 4, 5, 6, 7], [0, 2, 4, 2, 3, 5, 7, 5],
                [0, 2, 0, 4, 0, 5, 0, 7], [4, 0, 5, 0, 7, 0, 5, 0],
                [0, 2, 4, 5, 7, 5, 4, 2], [0, 3, 2, 5, 4, 7, 6, 0],
                [7, 5, 4, 2, 7, 5, 4, 2], [0, 7, 6, 7, 0, 5, 4, 5]
            ],
            emotional: [
                [0, 6, 5, 4, 2, 3, 2, 0], [2, 3, 2, 0, 4, 5, 4, 2],
                [4, 2, 0, 6, 5, 4, 2, 2], [0, 4, 6, 7, 6, 4, 2, 0],
                [5, 4, 2, 0, 5, 4, 2, 0], [0, 2, 4, 6, 0, 2, 4, 6],
                [4, 5, 7, 4, 2, 3, 2, 0], [0, 0, 6, 6, 5, 5, 4, 4]
            ],
            prechorus: [
                [0, 2, 3, 4, 5, 6, 7, 7], [0, 0, 2, 2, 4, 4, 6, 6],
                [0, 4, 0, 5, 0, 6, 0, 7], [4, 5, 4, 5, 6, 7, 7, 7]
            ],
            // SOLO MELODIC LIBS
            solo_epic: [
                [0, 4, 7, 12, 14, 12, 7, 4, 0],
                [0, 5, 7, 12, 15, 12, 7, 5],
                [0, 7, 12, 14, 16, 14, 12, 7, 0],
                [0, 4, 8, 12, 16, 12, 8, 4],
                [0, 5, 8, 12, 17, 12, 8, 5],
                [0, 7, 12, 19, 12, 7],
                [0, 4, 7, 12, 19, 12, 7, 4],
                [0, 5, 9, 12, 16, 12, 9, 5]
            ],
            solo_shred: [
                [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0],
                [0, 2, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 2],
                [0, 1, 3, 5, 7, 8, 10, 12, 14, 12, 10, 8, 7, 5, 3, 1],
                [0, 2, 4, 6, 8, 10, 12, 14, 16, 14, 12, 10, 8, 6, 4, 2],
                [0, 3, 5, 7, 9, 10, 12, 14, 15, 14, 12, 10, 9, 7, 5, 3],
                [0, 2, 5, 7, 9, 12, 14, 16, 14, 12, 9, 7, 5, 2]
            ],
            solo_romantic: [
                [0, 5, 3, 2, 3, 5, 7, 5, 3, 2, 0],
                [0, 3, 5, 7, 9, 7, 5, 3, 2, 0],
                [0, 4, 7, 5, 4, 2, 4, 5, 7, 9, 7, 5],
                [0, 5, 7, 10, 12, 10, 7, 5],
                [0, 3, 7, 10, 12, 10, 7, 3],
                [0, 4, 7, 12, 14, 12, 7, 5, 4, 2]
            ],
            solo_evil: [
                [0, 1, 3, 4, 6, 7, 8, 10, 12, 10, 8, 7, 6, 4, 3, 1],
                [0, 1, 4, 3, 1, 0, 1, 3, 4, 6, 4, 3, 1],
                [0, 3, 6, 8, 10, 12, 10, 8, 6, 3],
                [0, 1, 4, 6, 8, 10, 12, 10, 8, 6, 4, 1],
                [0, 7, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 7]
            ],
            solo_tapping: [
                [0, 12, 0, 12, 7, 12, 7, 12],
                [0, 12, 5, 12, 5, 12, 0, 12],
                [0, 12, 8, 12, 8, 12, 5, 12, 5, 12],
                [0, 12, 7, 14, 7, 12, 0],
                [0, 12, 9, 14, 9, 12, 0],
                [0, 12, 10, 15, 10, 12, 7, 12]
            ],
            solo_sweep: [
                [0, 4, 7, 12, 7, 4, 0],
                [0, 3, 7, 12, 7, 3, 0],
                [0, 4, 8, 12, 8, 4, 0],
                [0, 5, 8, 12, 8, 5, 0],
                [0, 4, 7, 12, 16, 12, 7, 4],
                [0, 3, 7, 12, 16, 12, 7, 3]
            ],
            solo_fast: [
                [0, 2, 4, 5, 7, 9, 10, 12, 10, 9, 7, 5, 4, 2, 0],
                [0, 1, 3, 4, 5, 7, 8, 10, 12, 10, 8, 7, 5, 4, 3, 1],
                [0, 2, 3, 5, 7, 8, 10, 12, 14, 12, 10, 8, 7, 5, 3, 2],
                [0, 2, 4, 5, 7, 8, 10, 12, 13, 15, 13, 12, 10, 8, 7, 5, 4, 2]
            ]
        };

        const getPattern = (type) => {
            const family = library[type] || library.verse;
            const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
            const index = Math.floor(Math.abs(dnaScore)) % family.length;
            return family[index];
        };

        // ============================================================
        // getMelodyFamily (solo/bridge usano librerie solo)
// ============================================================
        const getMelodyFamily = () => {
            if (isSolo || isBridge) {
                if (energy > 0.8 && complexity > 0.7) return { name: "SOLO SHRED ⚡", data: melodicLibrary.solo_shred };
                if (energy > 0.7 && brightness > 0.6) return { name: "SOLO EPIC 🏰", data: melodicLibrary.solo_epic };
                if (complexity > 0.7) return { name: "SOLO TAPPING 🎸", data: melodicLibrary.solo_tapping };
                if (brightness < 0.4) return { name: "SOLO EVIL 😈", data: melodicLibrary.solo_evil };
                if (energy < 0.5) return { name: "SOLO ROMANTIC 💕", data: melodicLibrary.solo_romantic };
                if (complexity > 0.5 && energy > 0.5) return { name: "SOLO FAST 🚀", data: melodicLibrary.solo_fast };
                return { name: "SOLO EPIC 🏰", data: melodicLibrary.solo_epic };
            }
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

        // Seleziona il tipo di sezione per library
        let sectionType;
        if (isSolo) {
            if (energy > 0.7) sectionType = "solo_fast";
            else if (energy < 0.4) sectionType = "solo_slow";
            else sectionType = "solo";
        } else if (isIntro) {
            sectionType = "intro";
        } else if (isPreChorus || isBridge) {
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

        // ============================================================
        // STEP2: ORNAMENTI
        // ============================================================
        function applyOrnaments(noteName, idx, currentScale) {
            let finalNote = noteName;
            let bend = false;
            let repeat = false;

            // 1) Passing tone cromatico (10%)
            if (Math.random() < 0.10) {
                const up = Math.random() < 0.5;
                const newIdx = idx + (up ? 1 : -1);
                if (newIdx >= 0 && newIdx < currentScale.length) {
                    finalNote = normalizeNote(currentScale[newIdx], "guitarLead") + noteName.slice(-1);
                }
            }

            // 2) Slide (8%)
            if (Math.random() < 0.08) {
                const up = Math.random() < 0.5;
                const newIdx = idx + (up ? 1 : -1);
                if (newIdx >= 0 && newIdx < currentScale.length) {
                    finalNote = normalizeNote(currentScale[newIdx], "guitarLead") + noteName.slice(-1);
                }
            }

            // 3) Mini-bend (6%)
            if (Math.random() < 0.06) {
                bend = true;
            }

            // 4) Ripetizione veloce (5%)
            if (Math.random() < 0.05) {
                repeat = true;
            }

            return { note: finalNote, bend, repeat };
        }

        // ============================================================
        // LOOP PRINCIPALE SEZIONE
        // ============================================================
        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);

            // metà sezione
            const half = Math.floor(section.measures / 2);

            let currentPattern;
            let currentMelody;
            let moodName;

            if (isSolo) {
                if (m < half) {
                    // PRIMA METÀ — più melodica
                    currentPattern = getPattern("solo_slow");
                    const moodA = melodicLibrary.solo_romantic;
                    currentMelody = moodA[Math.floor(energy * moodA.length) % moodA.length];
                    moodName = "SOLO PART A — Romantic 💕";
                } else {
                    // SECONDA METÀ — più tecnica
                    currentPattern = getPattern("solo_fast");
                    const moodB = melodicLibrary.solo_shred;
                    currentMelody = moodB[Math.floor(energy * moodB.length) % moodB.length];
                    moodName = "SOLO PART B — Shred ⚡";
                }
            } else {
                // comportamento normale
                currentPattern = getPattern(sectionType);
                const mood = getMelodyFamily();
                currentMelody = mood.data[Math.floor(energy * mood.data.length) % mood.data.length];
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

            let currentScale;
            if (isSolo || isBridge) {
                // Scala fissa basata su tonalCenter e scaleType
                const fixedScaleRoot = rootNote + (isMinor ? "m" : "");
                currentScale = getStrictScale(fixedScaleRoot);
                console.log(`🎸 ASSOLO scala fissa: ${fixedScaleRoot} → [${currentScale.join(", ")}]`);
            } else {
                currentScale = getStrictScale(progression[m % progression.length] || "A");
            }

            const isTransitionMeasure = (m === section.measures - 1);

            currentPattern.forEach((s, i) => {
                if (isTransitionMeasure && s > 13 && energy > 0.6) return;

                const absoluteTime = measureStartTime + (s * stepTime);
                const nextStep = (i < currentPattern.length - 1) ? currentPattern[i + 1] : 16;

                const noteIdx = currentMelody[i % currentMelody.length];
                const octave = isChorus ? 5 : 4;

                // indice nella scala (mod lunghezza scala)
                const scaleIndex = ((noteIdx % currentScale.length) + currentScale.length) % currentScale.length;
                let baseNote = normalizeNote(currentScale[scaleIndex], "guitarLead") + octave;

                // applica ornamenti (step2)
                const ornament = applyOrnaments(baseNote, scaleIndex, currentScale);
                const finalNote = ornament.note;

                Tone.Transport.schedule(time => {
                    // mini-bend
                    if (ornament.bend && guitarLead.playbackRate) {
                        guitarLead.playbackRate.setValueAtTime(1.02, time);
                        guitarLead.playbackRate.linearRampToValueAtTime(1.0, time + 0.12);
                    }

                    // nota principale
                    guitarLead.triggerAttackRelease(
                        finalNote,
                        (nextStep - s) * stepTime,
                        time
                    );

                    // ripetizione veloce
                    if (ornament.repeat) {
                        Tone.Transport.schedule(t2 => {
                            guitarLead.triggerAttackRelease(
                                finalNote,
                                (nextStep - s) * stepTime * 0.5,
                                t2
                            );
                        }, time + 0.06);
                    }

                    Tone.Draw.schedule(() => {
                        if (score) score.addNote("Lead", finalNote, section.name);
                    }, time);
                }, absoluteTime);
            });
        }
    }
};

//================================================
// SCHEDULE LEAD — PUNTO DI ENTRATA PRINCIPALE
// ============================================================

export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    // Estrai tonalCenter e scaleType
    const tonalCenter = params?.tonalCenter || params?.imageParams?.tonalCenter || "A4";
    const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";
    const rootNote = tonalCenter.replace(/[0-9]/g, "");  // "A4" → "A"
    
    // Determina se è minore (naturalMinor o harmonicMinor)
    const isMinor = scaleType.includes("minor");
    
    console.log("🎸 tonalCenter:", tonalCenter, "→ root:", rootNote);
    console.log("🎸 scaleType:", scaleType, "→ isMinor:", isMinor);
      
    LeadLegacy.schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, score);
}
