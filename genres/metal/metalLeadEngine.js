// metalLeadEngine.js — ver. 080 (Solo Boosted Final)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote, leadBus } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 080 FINAL loaded");

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
// SCALE
// ============================================================

const LeadScales = {
    major(root) { return [0,2,4,5,7,9,11].map(i => root+i); },
    minor(root) { return [0,2,3,5,7,8,10].map(i => root+i); },
    harmonicMinor(root) { return [0,2,3,5,7,8,11].map(i => root+i); },
    dorian(root) { return [0,2,3,5,7,9,10].map(i => root+i); },
    pentatonicMinor(root) { return [0,3,5,7,10].map(i => root+i); },
    phrygian(root) { return [0,1,3,5,7,8,10].map(i => root+i); }
};

// ============================================================
// PATTERN (per il Legacy)
// ============================================================

const LeadPatterns = {
    melodicTheme: [[0,2,4,5,4,2,0], [0,2,5,4,2,0], [0,4,5,7,5,4,2]],
    lyricalBreak: [[0,2,3,2,0], [0,3,5,3,0], [0,2,0,-2,0]],
    terzine: [[0,2,4], [2,4,5], [4,5,7]],
    shredRun: [[0,2,3,5,7,8,11], [0,2,3,5,7,9,11], [0,1,3,5,7,8,10]],
    sweep: [[0,4,7,12], [0,3,7,12], [0,4,8,12]],
    tapping: [[0,7,12,7], [0,5,12,5], [0,8,12,8]],
    finalBurst: [[0,2,4,5,7,9,11,12], [0,3,5,7,10,12], [0,2,5,7,9,12]]
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
// LEGACY (per verse, chorus, prechorus, intro, outro)
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

        const { energy = 0.5, brightness = 0.5, texture = 0.5, complexity = 0.5 } = params?.imageParams || {};

        const library = {
            intro: [[0,1,2,3,4,8,12], [0,4,8,10,11,12,13,14], [0,2,3,4,8,10,11,12], [0,3,4,7,8,11,12,15], [0,1,2,3,4,5,6,7,8]],
            verse: [[0,8], [0,4,8,12], [0,6,8,14], [0,4,10], [2,6,10,14], [0,2,4,8,10,12]],
            prechorus: [[0,4,8,12], [0,2,4,6,8,10,12,14], [0,4,7,11,12], [0,8,12,14], [0,2,4,8,10,12]],
            chorus: [[0,2,4,6,8,10,12,14], [0,8,12], [0,4,8,12], [0,3,8,11], [0,6,7,8,14]]
        };

        const melodicLibrary = {
            epic: [[0,4,7,4,5,4,2,0], [0,0,4,4,7,7,4,4], [0,4,5,7,0,4,5,7], [7,4,0,4,7,4,0,0]],
            evil: [[0,1,0,1,4,3,1,0], [0,6,5,0,6,5,1,0], [0,1,4,1,0,1,4,1], [0,3,4,0,3,4,6,0]],
            active: [[0,1,2,3,4,5,6,7], [0,2,4,2,3,5,7,5], [0,2,0,4,0,5,0,7], [4,0,5,0,7,0,5,0]],
            emotional: [[0,6,5,4,2,3,2,0], [2,3,2,0,4,5,4,2], [4,2,0,6,5,4,2,2], [0,4,6,7,6,4,2,0]],
            prechorus: [[0,2,3,4,5,6,7,7], [0,0,2,2,4,4,6,6], [0,4,0,5,0,6,0,7], [4,5,4,5,6,7,7,7]]
        };

        const getPattern = (type) => {
            const family = library[type] || library.verse;
            const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
            const index = Math.floor(Math.abs(dnaScore)) % family.length;
            return family[index];
        };

        const getMelodyFamily = () => {
            if (isPreChorus) return { name: "PRE-CHORUS 📈", data: melodicLibrary.prechorus };
            if (isChorus) return brightness > 0.5 ? { name: "EPIC 🏰", data: melodicLibrary.epic } : { name: "EMOTIONAL 💧", data: melodicLibrary.emotional };
            if (energy > 0.7 && texture > 0.6) return { name: "EVIL 😈", data: melodicLibrary.evil };
            if (complexity > 0.7) return { name: "ACTIVE ⚡", data: melodicLibrary.active };
            if (brightness < 0.4) return { name: "EMOTIONAL 💧", data: melodicLibrary.emotional };
            return { name: "EPIC 🏰", data: melodicLibrary.epic };
        };

        const sectionType = isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : "verse"));
        const currentPattern = getPattern(sectionType);
        const mood = getMelodyFamily();
        const currentMelody = mood.data[Math.floor(energy * mood.data.length) % mood.data.length];

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
                    Tone.Draw.schedule(() => { if (score) score.addNote("Lead", noteName, section.name); }, time);
                }, absoluteTime);
            });
        }
    }
};

// ============================================================
// SOLO BOOSTED — VERSIONE DEFINITIVA
// ============================================================

const LeadSoloBoosted = {
    schedule(section, progression, instruments, params, rand, measureDur, score) {
        const { guitarLead } = instruments;
        if (!guitarLead) return;
        
        // 1. TONALITÀ E SCALA
        let tonalCenter = params.tonalCenter || params.imageParams?.tonalCenter || "A4";
        let scaleType = params.scaleType || params.imageParams?.scaleType || "naturalMinor";
        if (params.imageParams?.tonalCenter) tonalCenter = params.imageParams.tonalCenter;
        if (params.imageParams?.scaleType) scaleType = params.imageParams.scaleType;
        
        const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        let rootNote = tonalCenter.replace(/[0-9]/g, "");
        let rootIndex = allNotes.indexOf(rootNote);
        if (rootIndex === -1) rootIndex = 9;
        
        const scaleIntervals = {
            major: [0, 2, 4, 5, 7, 9, 11],
            naturalMinor: [0, 2, 3, 5, 7, 8, 10],
            harmonicMinor: [0, 2, 3, 5, 7, 8, 11]
        };
        const intervals = scaleIntervals[scaleType] || scaleIntervals.naturalMinor;
        const scaleNotes = intervals.map(interval => allNotes[(rootIndex + interval) % 12]);
        
        console.log(`🎸 ASSOLO in ${tonalCenter} (${scaleType}): [${scaleNotes.join(" → ")}]`);
        
        // 2. PARAMETRI
        const totalTime = section.measures * measureDur;
        const energy = params.imageParams?.energy || 0.5;
        const complexity = params.imageParams?.complexity || 0.5;
        const brightness = params.imageParams?.brightness || 0.5;
        const bpm = params.imageParams?.bpm || params.bpm || 140;
        const isFastBPM = bpm > 140;
        
        let totalNotes = Math.floor(35 + (energy * 40) + (complexity * 25));
        const octave = brightness > 0.6 ? 5 : 4;
        
        // 3. ANALIZZA LA BASE VERA
        const chordRoots = progression.map(root => root.replace(/[0-9]/g, ""));
        console.log(`🎸 Base vera: ${chordRoots.slice(0, 8).join(" → ")}`);
        
        // 4. GENERA LE NOTE
        const notes = [];
        let timePos = 0;
        let currentNoteIdx = Math.floor(scaleNotes.length / 2);
        let notesPerChange = Math.floor(totalNotes / chordRoots.length);
        if (notesPerChange < 3) notesPerChange = 3;
        
        for (let changeIdx = 0; changeIdx < chordRoots.length && notes.length < totalNotes; changeIdx++) {
            const currentRoot = chordRoots[changeIdx];
            const nextRoot = chordRoots[(changeIdx + 1) % chordRoots.length];
            
            const currentRootIdx = scaleNotes.indexOf(currentRoot);
            const nextRootIdx = scaleNotes.indexOf(nextRoot);
            
            let direction, targetIdx;
            if (nextRootIdx > currentRootIdx) {
                direction = "up";
                targetIdx = nextRootIdx;
            } else if (nextRootIdx < currentRootIdx) {
                direction = "down";
                targetIdx = nextRootIdx;
            } else {
                direction = "flat";
                targetIdx = currentRootIdx;
            }
            
            const stepsNeeded = Math.abs(targetIdx - currentNoteIdx);
            const actualNotes = Math.min(notesPerChange, Math.max(3, stepsNeeded + 3));
            
            for (let i = 0; i < actualNotes && notes.length < totalNotes; i++) {
                const progress = i / actualNotes;
                
                // TIMING (accelerando/ritardando)
                let step;
                if (energy > 0.6) {
                    const centerDist = Math.abs(progress - 0.5);
                    step = 0.07 + (centerDist * 0.12);
                } else {
                    step = 0.10;
                }
                step *= (0.85 + rand() * 0.3);
                if (isFastBPM) step *= 0.85;
                
                // MOVIMENTO DELLA NOTA
                let noteIdx;
                if (direction === "up") {
                    noteIdx = currentNoteIdx + Math.floor(progress * (targetIdx - currentNoteIdx));
                } else if (direction === "down") {
                    noteIdx = currentNoteIdx - Math.floor(progress * (currentNoteIdx - targetIdx));
                } else {
                    noteIdx = currentNoteIdx;
                }
                noteIdx = Math.max(0, Math.min(scaleNotes.length - 1, noteIdx));
                
                let noteName = scaleNotes[noteIdx] + octave;
                if (brightness > 0.6 && rand() < 0.1) {
                    noteName = scaleNotes[noteIdx] + (octave + 1);
                }
                
                // PAUSA
                if (rand() < 0.07 && i > 1 && i < actualNotes - 2) {
                    timePos += step * 0.6;
                    continue;
                }
                
                // DURATA (ritardando/accelerando)
                let duration = step * 0.6;
                if (progress > 0.85) duration *= 1.4;
                if (Math.abs(progress - 0.5) < 0.15 && energy > 0.6) duration *= 0.6;
                
                let velocity = 0.45 + progress * 0.35;
                if (i === 0) velocity = 0.3;
                
                notes.push({
                    noteName: noteName,
                    relTime: timePos,
                    duration: Math.max(0.08, Math.min(duration, 0.7)),
                    velocity: Math.min(0.85, velocity)
                });
                
                timePos += step;
                currentNoteIdx = noteIdx;
            }
        }
        
        // NORMALIZZA
        if (timePos > 0) {
            const timeScale = totalTime / timePos;
            for (let note of notes) note.relTime *= timeScale;
        }
        
        // 5. SCHEDULAZIONE
        console.log(`🎸 ASSOLO: ${notes.length} note, durata ${totalTime.toFixed(1)}s`);
        
        for (let note of notes) {
            const absTime = section.startTime + note.relTime;
            Tone.Transport.schedule(time => {
                guitarLead.triggerAttackRelease(note.noteName, note.duration, time, note.velocity);
                if (rand() < 0.1 && isFastBPM) LeadFloyd.apply(guitarLead, time, "vibrato");
                Tone.Draw.schedule(() => { if (score) score.addNote("Lead", note.noteName, section.name); }, time);
            }, absTime);
        }
        
        // 6. SCALA FINALE EPICA
        if (energy > 0.5) {
            const finalStart = section.startTime + totalTime - 1.3;
            const stepTimeRun = 0.065;
            
            for (let i = 0; i < scaleNotes.length; i++) {
                const noteName = scaleNotes[i] + octave;
                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, 0.08, time, 0.8);
                    if (score) score.addNote("Lead", noteName, section.name + "_FINAL");
                }, finalStart + (i * stepTimeRun));
            }
            
            if (energy > 0.7) {
                for (let i = 0; i < scaleNotes.length; i++) {
                    const noteName = scaleNotes[scaleNotes.length - 1 - i] + octave;
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(noteName, 0.08, time, 0.75);
                        if (score) score.addNote("Lead", noteName, section.name + "_FINAL");
                    }, finalStart + ((scaleNotes.length + i) * stepTimeRun));
                }
            }
        }
        
        console.log(`✅ ASSOLO completato!`);
    }
};

// ============================================================
// SCHEDULE LEAD — PUNTO DI ENTRATA PRINCIPALE
// ============================================================

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

    if (!isSolo) {
        // Sezioni normali (verse, chorus, intro, outro, prechorus)
        if (leadBus._soloBoostApplied) {
            leadBus.gain.cancelScheduledValues(Tone.now());
            leadBus.gain.rampTo(leadBus._originalGain, 0.25);
            leadBus._soloBoostApplied = false;
        }
        LeadLegacy.scheduleNonSolo(section, progression, instruments, params, rand, measureDur, score);
    } else {
        // ASSOLO: boost del volume e uso del sistema potenziato
        if (!leadBus._soloBoostApplied) {
            leadBus._originalGain = leadBus.gain.value;
            leadBus.gain.rampTo(leadBus._originalGain * 2.0, 0.20);
            leadBus._soloBoostApplied = true;
        }
        LeadSoloBoosted.schedule(section, progression, instruments, params, rand, measureDur, score);
    }
}