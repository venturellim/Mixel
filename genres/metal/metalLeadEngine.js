// metalLeadEngine.js — ver. 094 COMPLETO (Metal + Ballad)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";
import { wrapRand } from "../../utils/randomUtils.js";
import {
    leadRhythmLibrary,
    leadMelodicLibrary,
    leadPadRhythmLibrary,    
    leadPadMelodicLibrary 
} from "../../utils/leadLibraries.js";

import {
    applyLeadEnhancer,
    computeLeadVelocity,
    shapeBridgeSolo,
    padMotionEnhancer
} from "../../utils/leadEnhancers.js";

console.log("metalLeadEngine.js ver. 098 loaded");

function getStrictScale(root, isMinor) {
    const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let cleanRoot = root.replace(/[0-9]/g, "").toUpperCase();
    const alt = { DB: "C#", EB: "D#", GB: "F#", AB: "G#", BB: "A#" };
    cleanRoot = alt[cleanRoot] || cleanRoot;
    let idx = allNotes.indexOf(cleanRoot);
    if (idx === -1) idx = 9;
    const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    return intervals.map(i => allNotes[(idx + i) % 12]);
}

// ============================================================
// FUNZIONI DI SUPPORTO
// ============================================================

function clampLeadRange(note, sectionName) {
    const midi = Tone.Frequency(note).toMidi();

    const lowSections = ["verse", "prechorus", "chorus"];
    const midSections = ["chorusEnd"];
    const highSections = ["intro", "solo", "bridge", "outro"];

    let min, max;

    if (lowSections.some(s => sectionName.includes(s))) {
        min = Tone.Frequency("C2").toMidi();
        max = Tone.Frequency("C4").toMidi();
    } else if (midSections.some(s => sectionName.includes(s))) {
        min = Tone.Frequency("C3").toMidi();
        max = Tone.Frequency("D5").toMidi();
    } else if (highSections.some(s => sectionName.includes(s))) {
        min = Tone.Frequency("C4").toMidi();
        max = Tone.Frequency("D6").toMidi();
    } else {
        min = Tone.Frequency("C2").toMidi();
        max = Tone.Frequency("C6").toMidi();
    }

    let finalMidi = midi;
    while (finalMidi < min) finalMidi += 12;
    while (finalMidi > max) finalMidi -= 12;

    return Tone.Frequency(finalMidi, "midi").toNote();
}

function buildThird(root) {
    const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let idx = scale.indexOf(root);
    if (idx === -1) idx = 0;
    return scale[(idx + 3) % 12];
}

function buildFifth(root) {
    const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let idx = scale.indexOf(root);
    if (idx === -1) idx = 0;
    return scale[(idx + 7) % 12];
}

// ============================================================
// FLOYD ROSE
// ============================================================

const LeadFloyd = {
    apply(guitarLead, time, type = "scoop") {
        if (!guitarLead || !guitarLead.playbackRate) return;
        const pr = guitarLead.playbackRate;

        if (type === "scoop") {
            pr.setValueAtTime(0.95, time);
            pr.linearRampToValueAtTime(1.0, time + 0.12);
        } else if (type === "dive") {
            pr.setValueAtTime(1.0, time);
            pr.exponentialRampToValueAtTime(0.7, time + 0.18);
            pr.linearRampToValueAtTime(1.0, time + 0.32);
        } else if (type === "vibrato") {
            for (let i = 0; i < 6; i++) {
                const t = time + i * 0.04;
                const val = i % 2 === 0 ? 0.98 : 1.02;
                pr.setValueAtTime(val, t);
            }
            pr.setValueAtTime(1.0, time + 0.25);
        }
    }
};

// ============================================================
// BALLAD LEAD ENGINE (melodia lenta e presente)
// ============================================================

const balladLeadSettings = {
    vibratoDepth: 0.3,
    vibratoFreq: 5.0,
    stepProb: 0.7,
    leapProb: 0.2,
    rangeLow: 60,
    rangeHigh: 81
};

// ============================================================
// PAD CHORD BUILDER
// ============================================================
function buildPadChord(root, octave, type = "triad") {
    const intervals = {
        triad: [0, 4, 7],
        triad7: [0, 4, 7, 11],
        triad9: [0, 4, 7, 14],
        open9: [0, 7, 14],
        epicSpread: [0, 7, 12, 14, 19],
        cinematic: [0, 5, 12, 17]
    };
    const chosen = intervals[type] || intervals.triad;
    return chosen.map(semi => {
        const midi = Tone.Frequency(root + octave).toMidi() + semi;
        const note = Tone.Frequency(midi, "midi").toNote();
        return normalizeNote(note, "StStringPad");
    });
}

function applyBalladVibrato(leadVibrato) {
    if (!leadVibrato) return;
    leadVibrato.depth.rampTo(balladLeadSettings.vibratoDepth, 0.2);
    leadVibrato.frequency.rampTo(balladLeadSettings.vibratoFreq, 0.2);
}

function generateBalladNote(prevMidi) {
    const { stepProb, leapProb, rangeLow, rangeHigh } = balladLeadSettings;

    if (Math.random() < stepProb) {
        let next = prevMidi + (Math.random() < 0.5 ? -2 : 2);
        if (next < rangeLow) next = rangeLow + 2;
        if (next > rangeHigh) next = rangeHigh - 2;
        return next;
    }

    if (Math.random() < leapProb) {
        let next = prevMidi + (Math.random() < 0.5 ? -5 : 5);
        if (next < rangeLow) next = rangeLow + 5;
        if (next > rangeHigh) next = rangeHigh - 5;
        return next;
    }

    return prevMidi;
}

// ============================================================
// SCHEDULE PAD (ex padEngine.js)
// ============================================================
function schedulePad(section, progression, instruments, params, rand) {
    const pad = instruments.StStringPad;
    if (!pad || !pad.loaded) return;
    const randWrapper = wrapRand(rand);
    const { melodicSpeed = 2, melodicDensity = 1 } = params;
    
    let rhythmLib = null, melodicLib = null, chordType = "triad";
    const name = section.name?.toLowerCase() || "";
    
    if (section.isBallad) {
        melodicLib = leadPadMelodicLibrary.ballad;
        chordType = "open9";
    } else if (name.includes("intro")) {
        melodicLib = leadPadMelodicLibrary.epicIntro;
        chordType = "cinematic";
    } else if (name.includes("verse")) {
        rhythmLib = leadPadRhythmLibrary.static;
        chordType = "triad";
    } else if (name.includes("pre")) {
        rhythmLib = leadPadRhythmLibrary.motion;
        chordType = "triad9";
    } else if (name.includes("chorus")) {
        rhythmLib = leadPadRhythmLibrary.octaveSpread;
        chordType = "epicSpread";
    } else {
        rhythmLib = leadPadRhythmLibrary.static;
        chordType = "triad";
    }
    
    const pattern = melodicLib ? randWrapper.pick(melodicLib) : randWrapper.pick(rhythmLib);
    if (!pattern) return;
    
    const chordSymbol = progression[0] || "C";
    const rootMatch = chordSymbol.match(/[A-G][b#]?/i);
    const root = rootMatch ? rootMatch[0].toUpperCase() : "C";
    const octave = 3;
    const baseChord = buildPadChord(root, octave, chordType);
    
    const measureDur = Tone.Time("1m").toSeconds();
    const stepDur = measureDur / 16;
    
    const randWrap = {
        range: (min, max) => min + rand() * (max - min)
    };
    
    pattern.forEach((value, index) => {
        if (melodicLib && (index % melodicDensity !== 0)) return;
        const step = melodicLib ? index * melodicSpeed : value;
        const time = section.startTime + step * stepDur;
        const vel = padMotionEnhancer(pad, time, params, randWrapper);
        
        let highNote;
        if (melodicLib) {
            const interval = value;
            const highMidi = Tone.Frequency(root + (octave + 2)).toMidi() + interval;
            highNote = normalizeNote(Tone.Frequency(highMidi, "midi").toNote(), "StStringPad");
        } else {
            highNote = normalizeNote(root + (octave + 2), "StStringPad");
        }
        
        const chord = [...baseChord, highNote];
        pad.triggerAttackRelease(chord, stepDur * 1.5, time, vel);
    });
}

function scheduleBalladLead(section, progression, instruments, measureDur, score) {
    const { guitarLead, leadVibrato } = instruments;
    if (!guitarLead) return;

    let prevMidi = 64;
    const stepTime = measureDur / 8;
    const { energy = 0.5 } = window.currentParams?.imageParams || {};

    for (let m = 0; m < section.measures; m++) {
        const measureStart = section.startTime + m * measureDur;

        for (let beat = 0; beat < 4; beat++) {
            const absoluteTime = measureStart + beat * (measureDur / 4);
            applyBalladVibrato(leadVibrato);
            const midi = generateBalladNote(prevMidi);
            prevMidi = midi;
            const note = Tone.Frequency(midi, "midi").toNote();
            const duration = energy > 0.3 ? "2n" : "1n";

            Tone.Transport.schedule(t => {
                guitarLead.triggerAttackRelease(note, duration, t, 0.75);
                if (score) score.addNote("Lead", note, section.name);
            }, absoluteTime);
        }
    }
}

// ============================================================
// SELEZIONE FAMIGLIA MELODICA PER L'ASSOLO
// ============================================================

function getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture) {
    if (!isSoloPt2) {
        if (brightness > 0.5) return { name: "SOLO EPIC 🏰", data: leadMelodicLibrary.epic };
        return { name: "SOLO EMOTIONAL 💧", data: leadMelodicLibrary.emotional };
    } else {
        if (complexity > 0.6 || energy > 0.7) return { name: "SOLO ACTIVE ⚡", data: leadMelodicLibrary.active };
        return { name: "SOLO EVIL 😈", data: leadMelodicLibrary.evil };
    }
}

// ============================================================
// METAL LEAD ENGINE (COMPLETO)
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

        const enhancerContext = { energy, brightness, texture, complexity };

        const isHarmonic = scaleType === "harmonicMinor";

        const getPattern = (type) => {
            const family = leadRhythmLibrary[type] || leadRhythmLibrary.verse;
            const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
            const index = Math.floor(Math.abs(dnaScore)) % family.length;
            return family[index];
        };

        const getMelodyFamily = () => {
            if (isPreChorus) return { name: "PRE-CHORUS 📈", data: leadMelodicLibrary.prechorus };
            if (isChorus) {
                return brightness > 0.5
                    ? { name: "EPIC 🏰", data: leadMelodicLibrary.epic }
                    : { name: "EMOTIONAL 💧", data: leadMelodicLibrary.emotional };
            }
            if (energy > 0.7 && texture > 0.6) return { name: "EVIL 😈", data: leadMelodicLibrary.evil };
            if (complexity > 0.7) return { name: "ACTIVE ⚡", data: leadMelodicLibrary.active };
            if (brightness < 0.4) return { name: "EMOTIONAL 💧", data: leadMelodicLibrary.emotional };
            return { name: "EPIC 🏰", data: leadMelodicLibrary.epic };
        };

        let sectionType =
            isIntro ? "intro" :
            isPreChorus ? "prechorus" :
            isChorus ? "chorus" :
            "verse";
            

        const getStrictScale = (root) => {
            const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            let cleanRoot = root.replace(/[0-9]/g, "").toUpperCase();
            const alt = { DB: "C#", EB: "D#", GB: "F#", AB: "G#", BB: "A#" };
            cleanRoot = alt[cleanRoot] || cleanRoot;
            let idx = allNotes.indexOf(cleanRoot);
            if (idx === -1) idx = 9;
            const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
            return intervals.map(i => allNotes[(idx + i) % 12]);
        };

        for (let m = 0; m < section.measures; m++) {

            const measureStartTime = section.startTime + m * measureDur;

            let currentPattern;
            let currentMelody;
            let moodName;

            if (isSolo) {

                const basePattern = getPattern("chorus");

                currentPattern = applyLeadEnhancer(basePattern, "enhanceRhythmPattern", enhancerContext);
                currentPattern = applyLeadEnhancer(currentPattern, "enhanceRhythmGhostSteps", enhancerContext);
                currentPattern = applyLeadEnhancer(currentPattern, "addAnticipation", enhancerContext);
                currentPattern = applyLeadEnhancer(currentPattern, "addStrategicPause", enhancerContext);
                currentPattern = applyLeadEnhancer(currentPattern, "addPolyrhythmHint", enhancerContext);
                currentPattern = applyLeadEnhancer(currentPattern, "addGentleSwing", enhancerContext);
                currentPattern = applyLeadEnhancer(currentPattern, "addGhostAccent", enhancerContext);

                const soloFamily = getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture);
                const melodyIndex = Math.floor(energy * soloFamily.data.length) % soloFamily.data.length;
                const baseMelody = soloFamily.data[melodyIndex];

                currentMelody = applyLeadEnhancer(baseMelody, "enhanceMelodyLine", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "enhanceMelodyMicroVariation", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "enhanceChromaticPassing", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addTrills", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addBendEffect", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addSlideEffect", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addOctaveDoubling", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addMirrorInversion", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addEchoEffect", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addScaleRunBetweenPeaks", enhancerContext);

                if (name.includes("bridge")) {
                    const shaped = shapeBridgeSolo(currentMelody, currentPattern);
                    currentMelody = shaped.melody;
                    currentPattern = shaped.pattern;
                }

                moodName = soloFamily.name + (isHarmonic ? " (HARMONIC)" : "");

            } else {

                currentPattern = getPattern(sectionType);

                const mood = getMelodyFamily();
                const melodyIndex = Math.floor(energy * mood.data.length) % mood.data.length;
                currentMelody = mood.data[melodyIndex];
                moodName = mood.name;
            }

            const currentScale = getStrictScale(progression[m % progression.length] || "A");
            const isTransition = m === section.measures - 1;

            currentPattern.forEach((s, i) => {

                if (isTransition && s > 13 && energy > 0.6) return;

                const absoluteTime = measureStartTime + s * stepTime;
                const nextStep = currentPattern[i + 1] ?? 16;

                if (!currentMelody || currentMelody.length === 0) return;

                const rawIdx = currentMelody[i % currentMelody.length];
                if (typeof rawIdx !== "number" || !Number.isFinite(rawIdx)) return;

                const noteIdx = rawIdx;
                const scaleNote = currentScale[noteIdx % 7];
                if (!scaleNote || typeof scaleNote !== "string") return;

                const octave = (isChorus || isSolo) ? 5 : 4;

                let rawNote;
                try {
                    rawNote = normalizeNote(scaleNote, "guitarLead") + octave;
                } catch (e) {
                    return;
                }

                let noteName;
                try {
                    noteName = clampLeadRange(rawNote, name);
                } catch (e) {
                    return;
                }

                Tone.Transport.schedule(time => {

                    const duration = (nextStep - s) * stepTime;
                    const velocity = computeLeadVelocity(noteIdx, duration, isSolo, name.includes("bridge"));
                    const microTiming = (Math.random() - 0.5) * 0.004;
                    let finalTime = time + microTiming;

                    if (texture > 0.5) {
                        const midi = Tone.Frequency(noteName).toMidi();
                        if (midi >= 72) finalTime += 0.003;
                        else if (midi <= 60) finalTime -= 0.002;
                    }

                    let dynamicVelocity = velocity * (0.96 + Math.random() * 0.08);

                    if ((name.includes("verse") || name.includes("chorus")) && duration < 0.25) {
                        const isGallop = currentPattern[i - 1] === 2 && currentPattern[i - 2] === 0;
                        if (isGallop) {
                            if (s === 0 || s === currentPattern[0]) dynamicVelocity *= 1.12;
                            if (noteIdx === Math.max(...currentMelody)) dynamicVelocity *= 1.06;
                        }
                    }

                    guitarLead.triggerAttackRelease(noteName, duration, finalTime, dynamicVelocity);

                    if ((isSolo || name.includes("bridge") || name.includes("outro")) && duration > 0.3) {
                        try {
                            leadVibrato.depth.rampTo(0.25, 0.05);
                            leadVibrato.frequency.rampTo(6.5, 0.05);
                        } catch (e) {}
                    }

                    if ((name.includes("bridge") || isSolo) && duration > 0.25 && complexity > 0.5) {
                        try {
                            const pr = guitarLead.playbackRate;
                            const bendAmount = 1 + ((Math.random() * 0.02) - 0.01);
                            const t1 = finalTime + 0.05;
                            const t2 = t1 + 0.08;
                            pr.setValueAtTime(bendAmount, t1);
                            pr.linearRampToValueAtTime(1.0, t2);
                        } catch (e) {}
                    }

                    if (name.includes("chorus") && energy > 0.7 && duration > 0.3 && (m % 2 === 0)) {
                        try {
                            const interval = Math.random() < 0.5 ? 3 : 4;
                            const harmMidi = Tone.Frequency(noteName).toMidi() + interval;
                            const harmNote = Tone.Frequency(harmMidi, "midi").toNote();
                            const harmTime = finalTime + 0.01;
                            guitarLead.triggerAttackRelease(harmNote, duration, harmTime, dynamicVelocity * 0.6);
                            if (score) score.addNote("Lead", harmNote, section.name + " (harm)");
                        } catch (e) {}
                    }

                    if (isSolo && section.isLast && energy > 0.6 && complexity > 0.5) {
                        try {
                            leadVibrato.depth.rampTo(0.3, 0.05);
                            leadVibrato.frequency.rampTo(7.2, 0.05);
                            const pr = guitarLead.playbackRate;
                            const bendUp = 1 + (Math.random() * 0.04);
                            const bendDown = 1 - (Math.random() * 0.03);
                            const t1 = finalTime + 0.04;
                            const t2 = t1 + 0.10;
                            const t3 = t2 + 0.10;
                            pr.setValueAtTime(bendUp, t1);
                            pr.linearRampToValueAtTime(bendDown, t2);
                            pr.linearRampToValueAtTime(1.0, t3);
                            dynamicVelocity *= 1.12;
                            if (duration > 0.3) {
                                guitarLead.triggerAttackRelease(noteName, duration * 1.2, finalTime, dynamicVelocity * 0.95);
                            }
                            if (score) score.addNote("Lead", noteName, section.name + " (heroic)");
                        } catch (e) {}
                    }

                    if (isSolo && energy > 0.75 && complexity > 0.7) {
                        try {
                            leadVibrato.depth.rampTo(0.28, 0.03);
                            leadVibrato.frequency.rampTo(7.5, 0.03);
                            const pr = guitarLead.playbackRate;
                            const shredBend = 1 + ((Math.random() * 0.05) - 0.025);
                            const t1s = finalTime + 0.03;
                            const t2s = t1s + 0.06;
                            pr.setValueAtTime(shredBend, t1s);
                            pr.linearRampToValueAtTime(1.0, t2s);
                            dynamicVelocity *= 1.15;

                            const baseMidi = Tone.Frequency(noteName).toMidi();
                            for (let r = 1; r <= 2; r++) {
                                const runMidi = baseMidi + (r * 2);
                                const runNote = Tone.Frequency(runMidi, "midi").toNote();
                                const runTime = finalTime + (r * 0.035);
                                guitarLead.triggerAttackRelease(runNote, duration * 0.35, runTime, dynamicVelocity * 0.9);
                                if (score) score.addNote("Lead", runNote, section.name + " (shred)");
                            }
                        } catch (e) {}
                    }

                    if (name.includes("solo") && energy > 0.6 && texture < 0.4 && duration < 0.25) {
                        try {
                            const pmDuration = duration * 0.55;
                            const pmVelocity = dynamicVelocity * 1.18;
                            const pmTime = finalTime - 0.005;
                            guitarLead.triggerAttackRelease(noteName, pmDuration, pmTime, pmVelocity);
                            if (score) score.addNote("Lead", noteName, section.name + " (palm)");
                        } catch (e) {}
                    }

                    if (name.includes("chorus") && energy > 0.6 && brightness > 0.5 && duration > 0.25 && (m % 2 === 1)) {
                        try {
                            const interval5 = 7;
                            const harmMidi5 = Tone.Frequency(noteName).toMidi() + interval5;
                            const harmNote5 = Tone.Frequency(harmMidi5, "midi").toNote();
                            const harmTime5 = finalTime + 0.012;
                            guitarLead.triggerAttackRelease(harmNote5, duration, harmTime5, dynamicVelocity * 0.65);
                            if (score) score.addNote("Lead", harmNote5, section.name + " (fifth)");
                        } catch (e) {}
                    }

                    if (isSolo && energy > 0.8 && complexity > 0.7 && duration > 0.25) {
                        try {
                            const baseMidi = Tone.Frequency(noteName).toMidi();
                            const intervals = [0, 4, 7];
                            intervals.forEach((intv, idx) => {
                                const sweepMidi = baseMidi + intv;
                                const sweepNote = Tone.Frequency(sweepMidi, "midi").toNote();
                                const sweepTime = finalTime + (idx * 0.04);
                                guitarLead.triggerAttackRelease(sweepNote, duration * 0.35, sweepTime, dynamicVelocity * 0.85);
                                if (score) score.addNote("Lead", sweepNote, section.name + " (sweep)");
                            });
                        } catch (e) {}
                    }

                    if (isSolo && brightness < 0.4 && texture > 0.6 && duration > 0.25) {
                        try {
                            leadVibrato.depth.rampTo(0.22, 0.05);
                            leadVibrato.frequency.rampTo(5.2, 0.05);
                            const baseMidi = Tone.Frequency(noteName).toMidi();
                            const diminished = [0, 3, 6];
                            diminished.forEach((intv, idx) => {
                                const neoMidi = baseMidi + intv;
                                const neoNote = Tone.Frequency(neoMidi, "midi").toNote();
                                const neoTime = finalTime + (idx * 0.045);
                                guitarLead.triggerAttackRelease(neoNote, duration * 0.35, neoTime, dynamicVelocity * 0.88);
                                if (score) score.addNote("Lead", neoNote, section.name + " (neo)");
                            });
                            const chromMidi = baseMidi - 1;
                            const chromNote = Tone.Frequency(chromMidi, "midi").toNote();
                            const chromTime = finalTime + 0.14;
                            guitarLead.triggerAttackRelease(chromNote, duration * 0.3, chromTime, dynamicVelocity * 0.75);
                            if (score) score.addNote("Lead", chromNote, section.name + " (chrom)");
                        } catch (e) {}
                    }

                    if (isSolo && section.isLast && energy > 0.7 && complexity > 0.6 && duration > 0.25) {
                        try {
                            leadVibrato.depth.rampTo(0.35, 0.05);
                            leadVibrato.frequency.rampTo(5.8, 0.05);
                            const pr = guitarLead.playbackRate;
                            const bendUp = 1 + (Math.random() * 0.06);
                            const bendDown = 1 - (Math.random() * 0.04);
                            const t1 = finalTime + 0.05;
                            const t2 = t1 + 0.12;
                            const t3 = t2 + 0.12;
                            pr.setValueAtTime(bendUp, t1);
                            pr.linearRampToValueAtTime(bendDown, t2);
                            pr.linearRampToValueAtTime(1.0, t3);
                            dynamicVelocity *= 1.18;
                            if (duration > 0.3) {
                                guitarLead.triggerAttackRelease(noteName, duration * 1.35, finalTime, dynamicVelocity * 0.92);
                            }
                            const baseMidi = Tone.Frequency(noteName).toMidi();
                            const intervals = [3, 7];
                            intervals.forEach((intv, idx) => {
                                const harmMidi = baseMidi + intv;
                                const harmNote = Tone.Frequency(harmMidi, "midi").toNote();
                                const harmTime = finalTime + (0.015 + idx * 0.01);
                                guitarLead.triggerAttackRelease(harmNote, duration, harmTime, dynamicVelocity * 0.6);
                                if (score) score.addNote("Lead", harmNote, section.name + " (boss-harm)");
                            });
                            for (let r = 1; r <= 3; r++) {
                                const runMidi = baseMidi + (r * 2);
                                const runNote = Tone.Frequency(runMidi, "midi").toNote();
                                const runTime = finalTime + (r * 0.045);
                                guitarLead.triggerAttackRelease(runNote, duration * 0.3, runTime, dynamicVelocity * 0.85);
                                if (score) score.addNote("Lead", runNote, section.name + " (boss-run)");
                            }
                            const sweep = [0, 4, 7];
                            sweep.forEach((intv, idx) => {
                                const swMidi = baseMidi + intv;
                                const swNote = Tone.Frequency(swMidi, "midi").toNote();
                                const swTime = finalTime + 0.18 + (idx * 0.035);
                                guitarLead.triggerAttackRelease(swNote, duration * 0.25, swTime, dynamicVelocity * 0.8);
                                if (score) score.addNote("Lead", swNote, section.name + " (boss-sweep)");
                            });
                        } catch (e) {}
                    }

                    Tone.Draw.schedule(() => {
                        if (score) score.addNote("Lead", noteName, section.name);
                    }, time);

                }, absoluteTime);
            });
        }
    }
};

// ============================================================
// SCHEDULE SHIMMER (PAD ATMOSFERICO)
// ============================================================
function scheduleShimmer(section, progression, instruments, params, rand, measureDur) {
    const shimmer = instruments.shimmer;
    if (!shimmer) return;
    
    const name = section.name?.toLowerCase() || "";
    const isIntro = name.includes("intro") || name.includes("outro");
    const isChorus = name.includes("chorus");
    const isSolo = name.includes("solo");
    
    // Determina se l'accordo è minore
    const isMinor = (params?.imageParams?.mood < 0.5) || params?.scaleType?.includes("minor");
    
    // Pattern per lo shimmer (accordi lunghi)
    let pattern = [];
    let chordDuration = "1m";  // durata accordo
    
    if (isIntro || name.includes("outro")) {
        // Intro/Outro: accordo lungo, poche note
        pattern = [0];  // solo all'inizio della misura
        chordDuration = "2n";
    } else if (isChorus) {
        // Chorus: movimento più attivo
        pattern = [0, 8];  // inizio e metà misura
        chordDuration = "2n";
    } else if (isSolo) {
        // Solo: segue la rhythm (accordi ogni metà misura)
        pattern = [0, 8];
        chordDuration = "2n";
    } else {
        // Verse: accordo all'inizio
        pattern = [0];
        chordDuration = "1m";
    }
    
    for (let m = 0; m < section.measures; m++) {
        const measureStart = section.startTime + m * measureDur;
        const currentRoot = progression[m % progression.length];
        
        // Normalizza la root per il shimmer
        let rootForFile = currentRoot;
        if (rootForFile === "F#") rootForFile = "Fs";
        if (rootForFile === "G#") rootForFile = "Gs";
        if (rootForFile === "A#") rootForFile = "As";
        if (rootForFile === "C#") rootForFile = "Cs";
        if (rootForFile === "D#") rootForFile = "Ds";
        if (rootForFile === "Eb") rootForFile = "Ds";
        if (rootForFile === "Bb") rootForFile = "As";
        
        const chordName = isMinor ? `${rootForFile}m2` : `${rootForFile}2`;
        const velocity = isIntro ? 0.4 : (isChorus ? 0.7 : 0.55);
        
        pattern.forEach(step => {
            const time = measureStart + step * (measureDur / 16);
            Tone.Transport.schedule(t => {
                shimmer.triggerAttackRelease(chordName, chordDuration, t, velocity);
                if (score) score.addNote("Shimmer", chordName, section.name);
            }, time);
        });
    }
}

// ============================================================
// SCHEDULE LEAD MELODICA (GuitarLead)
// ============================================================
function scheduleLeadMelody(section, progression, instruments, params, rand, measureDur, score, isShimmerActive) {
    const { guitarLead, leadVibrato } = instruments;
    if (!guitarLead) return;
    
    const name = section.name?.toLowerCase() || "";
    const isIntro = name.includes("intro");
    const isChorus = name.includes("chorus");
    const isBridge = name.includes("bridge");
    
    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params?.imageParams || {};
    
    // Pattern melodici diversi in base alla sezione
    let melodyPattern;
    let noteCount = 6;  // default 6 note per misura
    
    if (isIntro) {
        // Intro: poche note, atmosferiche
        melodyPattern = [0, 8];
        noteCount = 4;
    } else if (isChorus) {
        // Chorus: più attivo
        melodyPattern = [0, 4, 8, 12];
        noteCount = 8;
    } else if (isBridge) {
        // Bridge: più tensione
        melodyPattern = [0, 6, 12];
        noteCount = 6;
    } else {
        // Verse: movimento moderato
        melodyPattern = [0, 8];
        noteCount = 6;
    }
    
    const tonalCenter = params?.tonalCenter || "A4";
    const scaleType = params?.scaleType || "naturalMinor";
    const rootNote = tonalCenter.replace(/[0-9]/g, "");
    const isMinor = scaleType.includes("minor");
    
    for (let m = 0; m < section.measures; m++) {
        const measureStart = section.startTime + m * measureDur;
        const currentRoot = progression[m % progression.length];
        const currentScale = getStrictScale(currentRoot, isMinor);
        
        // Genera una melodia semplice basata sulla scala
        const melodyNotes = [];
        for (let i = 0; i < noteCount; i++) {
            // Alterna gradi della scala per creare movimento
            const degree = (i * 2) % 7;  // 0,2,4,6,1,3,5
            melodyNotes.push(degree);
        }
        
        melodyPattern.forEach((step, idx) => {
            const absoluteTime = measureStart + step * stepTime;
            const noteIdx = melodyNotes[idx % melodyNotes.length];
            const noteName = currentScale[noteIdx] + "4";  // ottava 4 per la lead
            
            const velocity = 0.6 + (energy * 0.2);
            const duration = "8n";
            
            Tone.Transport.schedule(t => {
                guitarLead.triggerAttackRelease(noteName, duration, t, velocity);
                if (score) score.addNote("GuitarLead", noteName, section.name);
            }, absoluteTime);
        });
    }
}

// ============================================================
// SCHEDULE ASSOLO CON CHITARRA ACUSTICA
// ============================================================
function scheduleAcousticSolo(section, progression, instruments, params, rand, measureDur, score) {
    const { acousticGuitar } = instruments;
    if (!acousticGuitar) return;
    
    const stepTime = measureDur / 16;
    const { complexity = 0.5, energy = 0.5 } = params?.imageParams || {};
    const isMinor = (params?.imageParams?.mood < 0.5) || params?.scaleType?.includes("minor");
    
    // L'assolo è più intenso se complexity > 0.6
    const isIntense = complexity > 0.6;
    const noteDensity = isIntense ? 12 : 8;
    
    for (let m = 0; m < section.measures; m++) {
        const measureStart = section.startTime + m * measureDur;
        const currentRoot = progression[m % progression.length];
        
        let rootForFile = currentRoot;
        if (rootForFile === "F#") rootForFile = "Fs";
        if (rootForFile === "G#") rootForFile = "Gs";
        if (rootForFile === "A#") rootForFile = "As";
        if (rootForFile === "C#") rootForFile = "Cs";
        if (rootForFile === "D#") rootForFile = "Ds";
        
        // Usa singole note della chitarra acustica (non accordi)
        const noteName = `${rootForFile}3`;
        
        // Pattern di assolo (note singole, non accordi)
        for (let i = 0; i < noteDensity; i++) {
            const step = i * Math.floor(16 / noteDensity);
            const time = measureStart + step * stepTime;
            const velocity = 0.55 + (energy * 0.2);
            
            Tone.Transport.schedule(t => {
                acousticGuitar.triggerAttackRelease(noteName, "8n", t, velocity);
                if (score) score.addNote("AcousticSolo", noteName, section.name);
            }, time);
        }
    }
}

// ============================================================
// API PUBBLICA - NUOVA SCHEDULE LEAD
// ============================================================
export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {
    window.currentParams = params;
    
    const name = section.name?.toLowerCase() || "";
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo");
    const isBalladLead = section?.isBallad === true;
    
    // ============================================================
    // BALLAD MODE (Celestial Dream style)
    // ============================================================
    if (isBalladLead) {
        // Intro/Outro: solo Shimmer
        if (isIntro) {
            scheduleShimmer(section, progression, instruments, params, rand, measureDur);
            return;
        }
        
        // Verse/Chorus: contrappunto Shimmer ↔ GuitarLead
        // Prima metà: Shimmer tiene la nota, GuitarLead si muove
        // Seconda metà: GuitarLead tiene la nota, Shimmer si muove
        
        const halfMeasure = measureDur / 2;
        
        // Shimmer: accordo lungo nella prima metà
        scheduleShimmer(section, progression, instruments, params, rand, measureDur);
        
        // GuitarLead: movimento nella prima metà
        scheduleLeadMelody(section, progression, instruments, params, rand, measureDur, score, true);
        
        // Solo (opzionale) - se c'è sezione solo e complexity > 0.6
        if (isSolo && params?.imageParams?.complexity > 0.6) {
            scheduleAcousticSolo(section, progression, instruments, params, rand, measureDur, score);
        }
        
        return;
    }
    
    // ============================================================
    // METAL MODE NORMALE (legacy)
    // ============================================================
    const tonalCenter = params?.tonalCenter || params?.imageParams?.tonalCenter || "A4";
    const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";
    const rootNote = tonalCenter.replace(/[0-9]/g, "");
    const isMinor = scaleType.includes("minor");
    
    LeadLegacy.schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, scaleType, score);
}