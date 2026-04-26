// metalLeadEngine.js — ver. 085 FINAL (Solo con librerie dedicate, stesso sistema del non-solo)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote, leadBus } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 082.3 loaded");

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
        const isBridge =
name.includes("bridge");
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
    ],
    solo_power: [
    [0, 3, 7, 10, 14, 17, 14, 10, 7, 3],
    [0, 4, 8, 12, 16, 20, 16, 12, 8, 4],
    [0, 2, 5, 7, 9, 12, 14, 16, 14, 12, 9, 7, 5, 2],
    [0, 6, 12, 18, 12, 6]
],

solo_neoclassical: [
    [0, 4, 7, 11, 14, 18, 14, 11, 7, 4],
    [0, 3, 7, 10, 14, 17, 21, 17, 14, 10, 7, 3],
    [0, 2, 5, 9, 12, 16, 19, 16, 12, 9, 5, 2]
],

solo_modern: [
    [0, 5, 9, 12, 16, 19, 23, 19, 16, 12, 9, 5],
    [0, 7, 14, 19, 14, 7],
    [0, 3, 8, 10, 15, 17, 20, 17, 15, 10, 8, 3]
],

solo_bluesy: [
    [0, 3, 5, 6, 7, 10, 12, 10, 7, 6, 5, 3],
    [0, 4, 5, 7, 10, 12, 10, 7, 5, 4],
    [0, 3, 5, 6, 7, 6, 5, 3]
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
    ],
    // LIBRERIE per MAGGIORE e NATURALE MINORE
solo_epic: [
    [0, 3, 7, 10, 7, 3, 0],
    [0, 2, 5, 7, 10, 7, 5, 2, 0],
    [0, 3, 5, 7, 8, 10, 7, 5, 3, 0],
    [0, 5, 7, 10, 12, 10, 7, 5, 0]
],
solo_shred: [
    [0, 2, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 2, 0],
    [0, 2, 3, 5, 7, 9, 10, 12, 10, 9, 7, 5, 3, 2, 0],
    [0, 1, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 1, 0]
],
solo_power: [
    [0, 3, 7, 12, 7, 3, 0],
    [0, 5, 7, 12, 14, 12, 7, 5, 0],
    [0, 7, 12, 14, 12, 7, 0]
],
solo_neoclassical: [
    [0, 3, 7, 10, 14, 10, 7, 3, 0],
    [0, 2, 5, 9, 12, 9, 5, 2, 0],
    [0, 3, 5, 8, 10, 12, 10, 8, 5, 3, 0]
],
solo_modern: [
    [0, 5, 9, 12, 9, 5, 0],
    [0, 7, 10, 12, 10, 7, 0],
    [0, 4, 8, 12, 15, 12, 8, 4, 0]
],
solo_bluesy: [
    [0, 3, 5, 6, 7, 10, 12, 10, 7, 6, 5, 3, 0],
    [0, 3, 5, 7, 10, 12, 10, 7, 5, 3, 0],
    [0, 4, 5, 7, 10, 12, 10, 7, 5, 4, 0]
],
// LIBRERIE per ARMONICA MINORE (con G#!)
solo_epic_harmonic: [
    [0, 3, 7, 11, 7, 3, 0],           // G# invece di G
    [0, 2, 5, 7, 11, 7, 5, 2, 0],     // G# invece di G
    [0, 3, 5, 7, 11, 7, 5, 3, 0],     // G# invece di G
    [0, 5, 7, 11, 14, 11, 7, 5, 0]    // G# invece di G
],
solo_shred_harmonic: [
    [0, 2, 3, 5, 7, 8, 11, 12, 11, 8, 7, 5, 3, 2, 0],
    [0, 2, 3, 5, 7, 11, 12, 11, 7, 5, 3, 2, 0],
    [0, 1, 3, 5, 7, 8, 11, 12, 11, 8, 7, 5, 3, 1, 0]
],
solo_power_harmonic: [
    [0, 3, 7, 11, 7, 3, 0],
    [0, 5, 7, 11, 14, 11, 7, 5, 0],
    [0, 7, 11, 14, 11, 7, 0]
],
solo_neoclassical_harmonic: [
    [0, 3, 7, 11, 14, 11, 7, 3, 0],
    [0, 2, 5, 9, 12, 9, 5, 2, 0],
    [0, 3, 5, 8, 11, 12, 11, 8, 5, 3, 0]
],
solo_tapping_harmonic: [
    [0, 11, 0, 11, 7, 11, 7, 11],
    [0, 11, 5, 11, 5, 11, 0, 11],
    [0, 11, 8, 11, 8, 11, 5, 11]
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
        // PER L'ASSOLO E BRIDGE
            if (isSolo || isBridge) {
            
        // Controlla se è scala armonica minore
        const isHarmonicMinor = scaleType === "harmonicMinor";
        
        if (isHarmonicMinor) {
            // Usa librerie armoniche
            if (energy > 0.8 && complexity > 0.7) return { name: "SOLO SHRED HARMONIC 🎸", data: melodicLibrary.solo_shred_harmonic };
            if (energy > 0.7 && brightness > 0.6) return { name: "SOLO EPIC HARMONIC 🏰", data: melodicLibrary.solo_epic_harmonic };
            if (complexity > 0.7) return { name: "SOLO TAPPING HARMONIC 🎸", data: melodicLibrary.solo_tapping_harmonic };
            if (brightness > 0.7 && energy > 0.6) return { name: "SOLO POWER HARMONIC⚔️", data: melodicLibrary.solo_power_harmonic };
            if (complexity > 0.8) return { name: "SOLO NEOCLASSICAL HARMONIC🎻", data: melodicLibrary.solo_neoclassical_harmonic };
            // ... ecc.
        } else {
                if (energy > 0.8 && complexity > 0.7) return { name: "SOLO SHRED ⚡", data: melodicLibrary.solo_shred };
                if (energy > 0.7 && brightness > 0.6) return { name: "SOLO EPIC 🏰", data: melodicLibrary.solo_epic };
                if (complexity > 0.7) return { name: "SOLO TAPPING 🎸", data: melodicLibrary.solo_tapping };
                if (brightness < 0.4) return { name: "SOLO EVIL 😈", data: melodicLibrary.solo_evil };
                if (energy < 0.5) return { name: "SOLO ROMANTIC 💕", data: melodicLibrary.solo_romantic };
                if (complexity > 0.5 && energy > 0.5) return { name: "SOLO FAST 🚀", data: melodicLibrary.solo_fast };
                return { name: "SOLO EPIC 🏰", data: melodicLibrary.solo_epic };
    if (brightness > 0.7 && energy > 0.6) return { name: "SOLO POWER ⚔️", data: melodicLibrary.solo_power };
    if (complexity > 0.8) return { name: "SOLO NEOCLASSICAL 🎻", data: melodicLibrary.solo_neoclassical };
    if (texture > 0.6) return { name: "SOLO MODERN 🔥", data: melodicLibrary.solo_modern };
    if (brightness < 0.3) return { name: "SOLO BLUESY 🎷", data: melodicLibrary.solo_bluesy };
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
        if (isSolo || isBridge) {
            if (energy > 0.7) sectionType = "solo_fast";
            else if (energy < 0.4) sectionType = "solo_slow";
            else sectionType = "solo";
    if (brightness > 0.7 && energy > 0.6) sectionType = "solo_power";
    else if (complexity > 0.8) sectionType = "solo_neoclassical";
    else if (texture > 0.6) sectionType = "solo_modern";
    else if (brightness < 0.3) sectionType = "solo_bluesy";
        } else if (isIntro) {
            sectionType = "intro";
        } else if (isPreChorus) {
            sectionType = "prechorus";
        } else if (isChorus) {
            sectionType = "chorus";
        } else {
            sectionType = "verse";
        }
        
        //const currentPattern = getPattern(sectionType);
        //const mood = getMelodyFamily();
        //const currentMelody = mood.data[Math.floor(energy * mood.data.length) % mood.data.length];
        
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