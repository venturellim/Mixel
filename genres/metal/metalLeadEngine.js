// metalLeadEngine.js — ver. 085 FINAL (Solo con librerie dedicate, stesso sistema del non-solo)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote, leadBus } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 081.2 loaded");

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
// LEGACY NON-SOLO (IDENTICO ALLA VERSIONE 76.1 CHE FUNZIONA)
// ============================================================

const LeadLegacy = {
    scheduleNonSolo(section, progression, instruments, params, rand, measureDur, score) {
        const { guitarLead } = instruments || {};
        if (!guitarLead) return;

        const name = section?.name?.toLowerCase() || "";
        const isChorus = name.includes("chorus") && !name.includes("pre");
        const isPreChorus = name.includes("pre");
        const isIntro = name.includes("intro") || name.includes("outro");
        const stepTime = measureDur / 16;

        const {
            energy = 0.5,
            brightness = 0.5,
            texture = 0.5,
            complexity = 0.5
        } = params?.imageParams || {};

        // ============================================================
        // LIBRARY (identica alla 76.1 - senza bridge separato)
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
            // LIBRERIE PER L'ASSOLO (stesso sistema!)
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
        // MELODIC LIBRARY (identica alla 76.1)
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
            // LIBRERIE PER L'ASSOLO (stesso sistema!)
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
        // getMelodyFamily PIÙ SEMPLICE (come nella 76.1)
        // ============================================================
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

        const sectionType = isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : "verse"));
        const currentPattern = getPattern(sectionType);
        const mood = getMelodyFamily();
        const currentMelody = mood.data[Math.floor(energy * mood.data.length) % mood.data.length];

        console.log(
            `%c 🎸 LEAD DNA EXECUTION \n` +
            `%c > Section: ${name.toUpperCase()} \n` +
            `%c > Mood: ${mood.name} \n` +
            `%c > Rhythm Mask: [${currentPattern.join(" - ")}] \n` +
            `%c > Melody Steps: [${currentMelody.join(", ")}]`,
            "color: #191970; font-weight: bold; font-size: 12px;",
            "color: #191970;",
            "color: #eee; font-weight: bold;",
            "color: #191970;",
            "color: #191970;"
        );

        const getStrictScale = (root) => {
            const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            let cleanRoot = root.split('/')[0].replace(/[0-9]/g, '').trim();
            let isMinor = root.includes('m') || (cleanRoot === cleanRoot.toLowerCase() && cleanRoot.length === 1);
            cleanRoot = cleanRoot.toUpperCase();
            const altNames = { "DB": "C#", "EB": "D#", "GB": "F#", "AB": "G#", "BB": "A#" };
            cleanRoot = altNames[cleanRoot] || cleanRoot;
            let rootIdx = allNotes.indexOf(cleanRoot);
            if (rootIdx === -1) rootIdx = 9;
            const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
            return intervals.map(interval => allNotes[(rootIdx + interval) % 12]);
        };

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
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

//================================================
// SCHEDULE LEAD — PUNTO DI ENTRATA PRINCIPALE
// ============================================================

export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    // Usa lo stesso identico sistema per TUTTE le sezioni (assolo compreso!)
    LeadLegacy.scheduleNonSolo(section, progression, instruments, params, rand, measureDur, score);
}