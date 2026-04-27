// metalLeadEngine.js — ver. 087 FINAL (Assolo con stessa logica delle sezioni normali)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote, leadBus } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 086.2 loaded");

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
// LIBRARY (sezioni normali + assolo)
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
    // LIBRARY PER L'ASSOLO (potenziate dalle sezioni normali)
    solo: [
        [0, 4, 8, 12, 8, 4, 0],
        [0, 2, 4, 6, 8, 10, 12, 10, 8, 6, 4, 2, 0],
        [0, 2, 4, 5, 7, 8, 10, 12, 10, 8, 7, 5, 4, 2, 0],
        [0, 3, 6, 9, 12, 9, 6, 3, 0],
        [0, 4, 7, 10, 12, 10, 7, 4, 0]
    ]
};

// ============================================================
// MELODIC LIBRARY (sezioni normali + assolo)
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
    ],
    // MELODIC LIBRARY PER L'ASSOLO (orecchiabili, come le sezioni normali)
    solo: [
        // Derivata da epic
        [0, 2, 4, 5, 7, 5, 4, 2, 0],
        [0, 2, 4, 5, 7, 9, 7, 5, 4, 2, 0],
        [0, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 0],
        [0, 4, 5, 7, 8, 10, 12, 10, 8, 7, 5, 4, 0],
        
        // Collegamenti fluidi
        [0, 4, 5, 6, 5, 4, 0],
        [0, 7, 5, 4, 2, 0],
        [0, 4, 7, 8, 7, 4, 0],
        [0, 3, 5, 7, 5, 3, 0],
        
        // Derivata da active
        [0, 2, 4, 5, 7, 9, 10, 12, 10, 9, 7, 5, 4, 2, 0],
        [0, 1, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 1, 0],
        
        // Derivata da emotional
        [0, 6, 5, 4, 2, 3, 4, 5, 0],
        [0, 5, 4, 2, 0, 2, 4, 5, 0],
        
        // Pattern fluidi generali
        [0, 2, 3, 5, 7, 5, 3, 2, 0],
        [0, 2, 4, 6, 7, 6, 4, 2, 0],
        [0, 2, 5, 7, 9, 12, 9, 7, 5, 2, 0],
        [0, 3, 7, 8, 12, 8, 7, 3, 0]
    ],
    solo_harmonic: [
        [0, 2, 3, 5, 7, 8, 11, 12, 11, 8, 7, 5, 3, 2, 0],
        [0, 3, 5, 7, 8, 11, 12, 14, 12, 11, 8, 7, 5, 3, 0],
        [0, 2, 4, 5, 7, 8, 11, 12, 14, 15, 14, 12, 11, 8, 7, 5, 4, 2, 0],
        [0, 4, 7, 8, 11, 12, 14, 16, 14, 12, 11, 8, 7, 4, 0],
        [0, 7, 8, 11, 12, 11, 8, 7, 0],
        [0, 4, 7, 8, 11, 12, 11, 8, 7, 4, 0]
    ]
};

// ============================================================
// LEGACY (sezioni normali + assolo)
// ============================================================

const LeadLegacy = {
    schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, scaleType, score) {
        const { guitarLead } = instruments || {};
        if (!guitarLead) return;

        const name = section?.name?.toLowerCase() || "";
        const isChorus = name.includes("chorus") && !name.includes("pre");
        const isPreChorus = name.includes("pre");
        const isIntro = name.includes("intro") || name.includes("outro");
        const isSolo = name.includes("solo") || name.includes("solopt1") || name.includes("solopt2");
        const stepTime = measureDur / 16;

        const {
            energy = 0.5,
            brightness = 0.5,
            texture = 0.5,
            complexity = 0.5
        } = params?.imageParams || {};

        const isHarmonic = scaleType === "harmonicMinor";

        // getPattern ORIGINALE (identico)
        const getPattern = (type) => {
            const family = library[type] || library.verse;
            const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
            const index = Math.floor(Math.abs(dnaScore)) % family.length;
            return family[index];
        };

        // getMelodyFamily ORIGINALE (identico)
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

        // Seleziona il tipo di sezione
        let sectionType;
        if (isSolo) {
            sectionType = "solo";
        } else if (isIntro) {
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
                // ASSOLO: usa la STESSA logica delle sezioni normali!
                // ============================================================
                currentPattern = getPattern("solo");
                const soloMelody = isHarmonic ? melodicLibrary.solo_harmonic : melodicLibrary.solo;
                // STESSA formula delle sezioni normali: basata su energy!
                const melodyIndex = Math.floor(energy * soloMelody.length) % soloMelody.length;
                currentMelody = soloMelody[melodyIndex];
                moodName = `SOLO ${isHarmonic ? "HARMONIC" : ""} 🎸`;
            } else {
                // SEZIONI NORMALI (identiche)
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
            
            // Scala: usa la progressione REALE per tutte le sezioni
            const currentScale = getStrictScale(progression[m % progression.length] || "A");
            
            const isTransitionMeasure = (m === section.measures - 1);

            currentPattern.forEach((s, i) => {
                if (isTransitionMeasure && s > 13 && energy > 0.6) return;

                const absoluteTime = measureStartTime + (s * stepTime);
                const nextStep = (i < currentPattern.length - 1) ? currentPattern[i + 1] : 16;
                const noteIdx = currentMelody[i % currentMelody.length];
                const octave = isChorus ? 5 : 4;
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