// metalLeadEngine.js — ver. 089 CLEAN

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

// Importiamo librerie e enhancer dal tuo utils
import {
    leadRhythmLibrary,
    leadMelodicLibrary
} from "../../utils/leadLibraries.js";

import {
    applyLeadEnhancer,
    computeLeadVelocity,
    shapeBridgeSolo
} from "../../utils/leadEnhancers.js";

console.log("metalLeadEngine.js ver. 089.1 loaded");

function clampLeadRange(note, sectionName) {

    const midi = Tone.Frequency(note).toMidi();

    // RANGE DINAMICO IN BASE ALLA SEZIONE
    const lowSections  = ["verse", "prechorus", "chorus"];
    const highSections = ["intro", "solo", "bridge", "outro"];

    let min, max;

    if (lowSections.some(s => sectionName.includes(s))) {
        // RANGE GRAVE
        min = Tone.Frequency("C2").toMidi();
        max = Tone.Frequency("C4").toMidi();
    } else if (highSections.some(s => sectionName.includes(s))) {
        // RANGE ACUTO
        min = Tone.Frequency("C4").toMidi();
        max = Tone.Frequency("D6").toMidi();
    } else {
        // fallback sicuro
        min = Tone.Frequency("C2").toMidi();
        max = Tone.Frequency("C6").toMidi();
    }

    let finalMidi = midi;

    // WRAPPING MUSICALE
    while (finalMidi < min) finalMidi += 12;
    while (finalMidi > max) finalMidi -= 12;

    return Tone.Frequency(finalMidi, "midi").toNote();
}

// ============================================================
// FLOYD ROSE (rimane locale al metal)
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
// SELEZIONE FAMIGLIA MELODICA PER L'ASSOLO
// (rimane identica, ma usa leadMelodicLibrary importata)
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
// LEAD ENGINE (ripulito dagli enhancer locali)
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

                const noteIdx = currentMelody[i % currentMelody.length];
                const octave = isChorus || isSolo ? 5 : 4;
                //const noteName = normalizeNote(currentScale[noteIdx % 7], "guitarLead") + octave;
                const rawNote =
    normalizeNote(currentScale[noteIdx % 7], "guitarLead") + octave;

const noteName = clampLeadRange(rawNote, name);
                Tone.Transport.schedule(time => {

                    const duration = (nextStep - s) * stepTime;
                    const velocity = computeLeadVelocity(noteIdx, duration, isSolo, name.includes("bridge"));
                    const  microTiming = (Math.random() - 0.5) * 0.004;
const finalTime = time + microTiming;

// 🧠 MICRO-TIMING UMANO AVANZATO — basato sull'altezza della nota
if (texture > 0.5) {
    const midi = Tone.Frequency(noteName).toMidi();

    if (midi >= 72) {
        // note alte → leggero ritardo
        finalTime += 0.003; // +3ms
    } else if (midi <= 60) {
        // note basse → leggero anticipo
        finalTime -= 0.002; // -2ms
    }
}

let dynamicVelocity =
    velocity * (0.96 + Math.random() * 0.08);

// 🥁 ACCENTI RITMICI NEI GALLOP (0-2-3)
if ((name.includes("verse") || name.includes("chorus")) && duration < 0.25) {
    const isGallop = currentPattern[i - 1] === 2 && currentPattern[i - 2] === 0;

    if (isGallop) {
        // Primo colpo del gallop → accento forte
        if (s === 0 || s === currentPattern[0]) {
            dynamicVelocity *= 1.12; // +12%
        }

        // Nota più alta del pattern → accento leggero
        if (noteIdx === Math.max(...currentMelody)) {
            dynamicVelocity *= 1.06; // +6%
        }
    }
}

                    //guitarLead.triggerAttackRelease(noteName, duration, time, velocity);
guitarLead.triggerAttackRelease(
    noteName,
    duration,
    finalTime,
    dynamicVelocity
);

// 🎸 VIBRATO EPICO — solo per SOLO / BRIDGE / OUTRO
if ((isSolo || name.includes("bridge") || name.includes("outro")) && duration > 0.3) {
    try {
        leadVibrato.depth.rampTo(0.25, 0.05);      // più profondo
        leadVibrato.frequency.rampTo(6.5, 0.05);   // più veloce
    } catch (e) {}
}

// 🎸 MICRO-BENDING — solo per BRIDGE (e SOLO opzionale)
if ((name.includes("bridge") || isSolo) && duration > 0.25 && complexity > 0.5) {
    try {
        const pr = guitarLead.playbackRate;
        const bendAmount = 1 + ((Math.random() * 0.02) - 0.01); // ±1%
        const t1 = finalTime + 0.05;
        const t2 = t1 + 0.08;

        // Piccolo bend iniziale
        pr.setValueAtTime(bendAmount, t1);

        // Ritorno morbido
        pr.linearRampToValueAtTime(1.0, t2);
    } catch (e) {}
}

// 🎶 ARMONIZZAZIONE POWER METAL — solo nei climax del CHORUS
if (name.includes("chorus") && energy > 0.7 && duration > 0.3 && (m % 2 === 0)) {
    try {
        // intervallo: terza maggiore o minore
        const interval = Math.random() < 0.5 ? 3 : 4;

        // calcolo nota armonizzata
        const harmMidi = Tone.Frequency(noteName).toMidi() + interval;
        const harmNote = Tone.Frequency(harmMidi, "midi").toNote();

        // leggero ritardo per larghezza stereo
        const harmTime = finalTime + 0.01;

        guitarLead.triggerAttackRelease(
            harmNote,
            duration,
            harmTime,
            dynamicVelocity * 0.6 // più morbida
        );

        // logging nello score
        if (score) score.addNote("Lead", harmNote, section.name + " (harm)");
    } catch (e) {}
}

// 🎶 SCALE RUN INTELLIGENTE — Prechorus → Chorus
if ((name.includes("prechorus") || name.includes("chorus")) 
    && (i >= currentPattern.length - 2) 
    && energy > 0.4 
    && complexity > 0.4) {

    try {
        const scale = currentScale; // già calcolata nel tuo engine
        const baseMidi = Tone.Frequency(noteName).toMidi();

        // direzione della run
        const direction = name.includes("prechorus") ? +1 : -1;

        // 2 note veloci
        for (let r = 1; r <= 2; r++) {
            const runMidi = baseMidi + (direction * r * 2); // passi di seconda
            const runNote = Tone.Frequency(runMidi, "midi").toNote();
            const runTime = finalTime + (r * 0.05);

            guitarLead.triggerAttackRelease(
                runNote,
                duration * 0.4,
                runTime,
                dynamicVelocity * 0.85
            );

            if (score) score.addNote("Lead", runNote, section.name + " (run)");
        }
    } catch (e) {}
}

// 🎤 HEROIC LEAD — solo finale epico
if (isSolo && section.isLast && energy > 0.6 && complexity > 0.5) {
    try {
        // 1) Vibrato più profondo e veloce
        leadVibrato.depth.rampTo(0.3, 0.05);
        leadVibrato.frequency.rampTo(7.2, 0.05);

        // 2) Bending più ampio (Floyd Rose)
        const pr = guitarLead.playbackRate;
        const bendUp = 1 + (Math.random() * 0.04); // +4%
        const bendDown = 1 - (Math.random() * 0.03); // -3%

        const t1 = finalTime + 0.04;
        const t2 = t1 + 0.10;
        const t3 = t2 + 0.10;

        pr.setValueAtTime(bendUp, t1);
        pr.linearRampToValueAtTime(bendDown, t2);
        pr.linearRampToValueAtTime(1.0, t3);

        // 3) Velocity più dinamica
        dynamicVelocity *= 1.12;

        // 4) Sustain leggermente più lungo
        // (solo se la nota è già lunga)
        if (duration > 0.3) {
            guitarLead.triggerAttackRelease(
                noteName,
                duration * 1.2,
                finalTime,
                dynamicVelocity * 0.95
            );
        }

        // Logging opzionale
        if (score) score.addNote("Lead", noteName, section.name + " (heroic)");
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
// API PUBBLICA
// ============================================================

export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {

    const tonalCenter = params?.tonalCenter || params?.imageParams?.tonalCenter || "A4";
    const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";

    const rootNote = tonalCenter.replace(/[0-9]/g, "");
    const isMinor = scaleType.includes("minor");

    LeadLegacy.schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, scaleType, score);
}
