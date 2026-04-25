// metalLeadEngine.js — ver. 075 (Solo Boosted Legacy)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote, leadBus } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 075 loaded");

// Utility

const LeadUtils = {
    rand() { return Math.random(); },
    randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },

    distributeTimes(start, end, count) {
        const step = (end - start) / count;
        return Array.from({ length: count }, (_, i) => start + i * step);
    },

    nearestNote(targetMidi, scale) {
        let best = scale[0];
        let bestDist = Math.abs(targetMidi - best);
        for (let n of scale) {
            const d = Math.abs(targetMidi - n);
            if (d < bestDist) { best = n; bestDist = d; }
        }
        return best;
    }
};

// Scale

const LeadScales = {
    major(root) { return [0,2,4,5,7,9,11].map(i => root+i); },
    minor(root) { return [0,2,3,5,7,8,10].map(i => root+i); },
    harmonicMinor(root) { return [0,2,3,5,7,8,11].map(i => root+i); },
    dorian(root) { return [0,2,3,5,7,9,10].map(i => root+i); },
    pentatonicMinor(root) { return [0,3,5,7,10].map(i => root+i); },
    phrygian(root) { return [0,1,3,5,7,8,10].map(i => root+i); },
    diminished(root) { return [0,2,3,5,6,8,9,11].map(i => root+i); },
    wholeTone(root) { return [0,2,4,6,8,10].map(i => root+i); }
};

// Pattern

const LeadPatterns = {
    melodicTheme: [
        [0,2,4,5,4,2,0],
        [0,2,5,4,2,0],
        [0,4,5,7,5,4,2]
    ],
    lyricalBreak: [
        [0,2,3,2,0],
        [0,3,5,3,0],
        [0,2,0,-2,0]
    ],
    terzine: [
        [0,2,4],
        [2,4,5],
        [4,5,7]
    ],
    shredRun: [
        [0,2,3,5,7,8,11],
        [0,2,3,5,7,9,11],
        [0,1,3,5,7,8,10]
    ],
    sweep: [
        [0,4,7,12],
        [0,3,7,12],
        [0,4,8,12]
    ],
    tapping: [
        [0,7,12,7],
        [0,5,12,5],
        [0,8,12,8]
    ],
    diminished: [
        [0,2,3,5,6,8,9,11],
        [0,3,6,9],
        [0,2,5,8]
    ],
    finalBurst: [
        [0,2,4,5,7,9,11,12],
        [0,3,5,7,10,12],
        [0,2,5,7,9,12]
    ]
};

// Floyd Rose

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
        } else if (type==="rise") {
            pr.setValueAtTime(0.9, time);
            pr.linearRampToValueAtTime(1.05, time+0.25);
            pr.linearRampToValueAtTime(1.0, time+0.35);
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

// Legacy (non-solo) — originale

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
            ]
        };

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

// ============================================================
// LeadSoloBoosted — versione potenziata di Legacy per l'assolo
// ============================================================

const LeadSoloBoosted = {
    schedule(section, progression, instruments, params, rand, measureDur, score) {
        // Potenzia i parametri per l'assolo
        const boostedParams = {
            ...params,
            imageParams: {
                ...params.imageParams,
                energy: Math.min(1, (params.imageParams?.energy || 0.5) * 1.5),
                complexity: Math.min(1, (params.imageParams?.complexity || 0.5) * 1.4),
                brightness: Math.min(1, (params.imageParams?.brightness || 0.5) * 1.2),
                texture: Math.min(1, (params.imageParams?.texture || 0.5) * 1.2)
            }
        };
        
        console.log(`🎸 SOLO BOOSTED: energy ${(params.imageParams?.energy || 0.5).toFixed(2)} → ${boostedParams.imageParams.energy.toFixed(2)}`);
        
        // Usa il sistema legacy con parametri potenziati
        LeadLegacy.scheduleNonSolo(section, progression, instruments, boostedParams, rand, measureDur, score);
        
        // Aggiungi una scala finale veloce per energia alta
        if (boostedParams.imageParams.energy > 0.7) {
            this.addFinalRun(section, instruments, boostedParams, measureDur, score);
        }
        
        // Aggiungi note di passaggio extra per complessità alta
        if (boostedParams.imageParams.complexity > 0.7) {
            this.addPassingNotes(section, progression, instruments, boostedParams, rand, measureDur, score);
        }
    },
    
    addFinalRun(section, instruments, params, measureDur, score) {
        const { guitarLead } = instruments;
        if (!guitarLead) return;
        
        const tonalCenter = params.tonalCenter || "A4";
        let rootMidi;
        try { rootMidi = Tone.Frequency(tonalCenter).toMidi(); }
        catch { return; }
        
        // Costruisci una scala rapida (7-12 note)
        const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        let rootName = tonalCenter.replace(/[0-9]/g, "");
        let rootIdx = allNotes.indexOf(rootName);
        if (rootIdx === -1) rootIdx = 9;
        
        // Scala di LA minore (o della tonalità corrente)
        const scale = [0, 2, 3, 5, 7, 8, 10].map(interval => {
            const idx = (rootIdx + interval) % 12;
            return allNotes[idx];
        });
        
        const startTime = section.startTime + (section.measures * measureDur) - 1.2;
        const stepTime = 0.07;
        const octave = 5;
        
        console.log(`🎸 SOLO FINAL RUN: ${scale.length} note`);
        
        for (let i = 0; i < scale.length; i++) {
            const noteName = scale[i] + octave;
            Tone.Transport.schedule(time => {
                guitarLead.triggerAttackRelease(noteName, 0.1, time, 0.75);
                if (score) score.addNote("Lead", noteName, section.name + "_RUN");
            }, startTime + (i * stepTime));
        }
        
        // Aggiungi un'ultima nota tenuta
        const lastNote = scale[0] + (octave + 1);
        Tone.Transport.schedule(time => {
            guitarLead.triggerAttackRelease(lastNote, 0.8, time, 0.7);
            if (score) score.addNote("Lead", lastNote, section.name + "_FINALE");
        }, startTime + (scale.length * stepTime) + 0.1);
    },
    
    addPassingNotes(section, progression, instruments, params, rand, measureDur, score) {
        const { guitarLead } = instruments;
        if (!guitarLead) return;
        
        const tonalCenter = params.tonalCenter || "A4";
        let rootMidi;
        try { rootMidi = Tone.Frequency(tonalCenter).toMidi(); }
        catch { return; }
        
        // Note di passaggio aggiuntive (trilli o abbellimenti)
        const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        let rootName = tonalCenter.replace(/[0-9]/g, "");
        let rootIdx = allNotes.indexOf(rootName);
        if (rootIdx === -1) rootIdx = 9;
        
        // Aggiungi alcune note veloci sparse nell'assolo
        const numPassing = Math.floor(5 + rand() * 8);
        
        for (let i = 0; i < numPassing; i++) {
            const timeOffset = 0.5 + rand() * (section.measures * measureDur - 1.5);
            const absTime = section.startTime + timeOffset;
            const noteIdx = (rootIdx + 5 + Math.floor(rand() * 5)) % 12;
            const noteName = allNotes[noteIdx] + (rand() < 0.5 ? 5 : 4);
            
            Tone.Transport.schedule(time => {
                guitarLead.triggerAttackRelease(noteName, 0.08, time, 0.5);
                if (score) score.addNote("Lead", noteName, section.name + "_PASS");
            }, absTime);
        }
    }
};

// scheduleLead

export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    const rawName = section?.name;
    const clean = String(rawName)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z]/g, "")
        .toLowerCase();

    const isSolo = /(solo|lead|assolo|guitar|bridge)/i.test(clean);

    const {
        energy = 0.5,
        brightness = 0.5,
        texture = 0.5,
        complexity = 0.5
    } = params?.imageParams || {};

    const bpm = params?.imageParams?.bpm || params?.bpm || (60 / (measureDur / 4));

    if (!isSolo) {
        // Sezioni normali
        if (leadBus._soloBoostApplied) {
            leadBus.gain.cancelScheduledValues(Tone.now());
            leadBus.gain.rampTo(leadBus._originalGain, 0.25);
            leadBus._soloBoostApplied = false;
        }
        LeadLegacy.scheduleNonSolo(section, progression, instruments, params, rand, measureDur, score);
        
    } else {
        // ============================================================
        // ASSOLO: usa la versione potenziata
        // ============================================================
        
        if (!leadBus._soloBoostApplied) {
            leadBus._originalGain = leadBus.gain.value;
            leadBus.gain.rampTo(leadBus._originalGain * 2.0, 0.20);
            leadBus._soloBoostApplied = true;
        }
        
        LeadSoloBoosted.schedule(section, progression, instruments, params, rand, measureDur, score);
    }
}