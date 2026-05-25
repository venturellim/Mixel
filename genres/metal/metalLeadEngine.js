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

console.log("metalLeadEngine.js ver. 090.3 loaded");

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

                // Se per qualche motivo la melodia è vuota, saltiamo tutta la misura
if (!currentMelody || currentMelody.length === 0) {
    console.warn("🎸 Lead: currentMelody vuota in", section.name);
    return;
}

const rawIdx = currentMelody[i % currentMelody.length];

if (typeof rawIdx !== "number" || !Number.isFinite(rawIdx)) {
    console.warn("🎸 Lead: noteIdx non valido", rawIdx, "in", section.name);
    return;
}

const noteIdx = rawIdx;

const scaleNote = currentScale[noteIdx % 7];

if (!scaleNote || typeof scaleNote !== "string") {
    console.warn("🎸 Lead: scaleNote undefined/invalid", scaleNote, "per noteIdx", noteIdx, "in", section.name);
    return;
}

const octave = (isChorus || isSolo) ? 5 : 4;

let rawNote;
try {
    rawNote = normalizeNote(scaleNote, "guitarLead") + octave;
} catch (e) {
    console.warn("🎸 Lead: normalizeNote ha lanciato", e, "per", scaleNote, "in", section.name);
    return;
}

let noteName;
try {
    noteName = clampLeadRange(rawNote, name);
} catch (e) {
    console.warn("🎸 Lead: clampLeadRange ha lanciato", e, "per", rawNote, "in", section.name);
    return;
}

                Tone.Transport.schedule(time => {

                    const duration = (nextStep - s) * stepTime;
                    const velocity = computeLeadVelocity(noteIdx, duration, isSolo, name.includes("bridge"));
                    const  microTiming = (Math.random() - 0.5) * 0.004;
let finalTime = time + microTiming;

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

// ============================================================
// ADVANCED MODES
// ============================================================

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

// ⚡ MODALITÀ SHREDDER — solo nei soli molto energici e complessi
if (isSolo && energy > 0.75 && complexity > 0.7) {
    try {
        // 1) Vibrato più veloce e profondo
        leadVibrato.depth.rampTo(0.28, 0.03);
        leadVibrato.frequency.rampTo(7.5, 0.03);

        // 2) Micro-bending più aggressivo
        const pr = guitarLead.playbackRate;
        const shredBend = 1 + ((Math.random() * 0.05) - 0.025); // ±2.5%
        const t1s = finalTime + 0.03;
        const t2s = t1s + 0.06;
        pr.setValueAtTime(shredBend, t1s);
        pr.linearRampToValueAtTime(1.0, t2s);

        // 3) Velocity più incisiva
        dynamicVelocity *= 1.15;

        // 4) Scale-run extra (2 note veloci)
        const baseMidi = Tone.Frequency(noteName).toMidi();
        for (let r = 1; r <= 2; r++) {
            const runMidi = baseMidi + (r * 2); // passi di seconda
            const runNote = Tone.Frequency(runMidi, "midi").toNote();
            const runTime = finalTime + (r * 0.035);

            guitarLead.triggerAttackRelease(
                runNote,
                duration * 0.35,
                runTime,
                dynamicVelocity * 0.9
            );

            if (score) score.addNote("Lead", runNote, section.name + " (shred)");
        }
    } catch (e) {}
}

// 🤘 PALM-MUTE INTELLIGENTE — solo in sezioni aggressive
if (name.includes("solo") 
    && energy > 0.6 
    && texture < 0.4 
    && duration < 0.25) {

    try {
        // 1) Durata più breve (palm-mute)
        const pmDuration = duration * 0.55;

        // 2) Velocity più secca e incisiva
        const pmVelocity = dynamicVelocity * 1.18;

        // 3) Attacco più forte (leggero anticipo)
        const pmTime = finalTime - 0.005;

        guitarLead.triggerAttackRelease(
            noteName,
            pmDuration,
            pmTime,
            pmVelocity
        );

        if (score) score.addNote("Lead", noteName, section.name + " (palm)");
    } catch (e) {}
}

// 🏰 ARMONIZZAZIONE A QUINTE — solo nei chorus luminosi ed energici
if (name.includes("chorus") 
    && energy > 0.6 
    && brightness > 0.5 
    && duration > 0.25 
    && (m % 2 === 1)) {

    try {
        // intervallo: quinta giusta (+7 semitoni)
        const interval5 = 7;

        // calcolo nota armonizzata
        const harmMidi5 = Tone.Frequency(noteName).toMidi() + interval5;
        const harmNote5 = Tone.Frequency(harmMidi5, "midi").toNote();

        // leggero ritardo per larghezza stereo
        const harmTime5 = finalTime + 0.012;

        guitarLead.triggerAttackRelease(
            harmNote5,
            duration,
            harmTime5,
            dynamicVelocity * 0.65 // più morbida
        );

        if (score) score.addNote("Lead", harmNote5, section.name + " (fifth)");
    } catch (e) {}
}

// 🎼 SWEEP-PICKING GENERATOR — solo nei soli molto energici e complessi
if (isSolo && energy > 0.8 && complexity > 0.7 && duration > 0.25) {
    try {
        const baseMidi = Tone.Frequency(noteName).toMidi();

        // Triade: 1 - 3 - 5
        const intervals = [0, 4, 7]; // maggiore (perfetto per sweep)
        // Se vuoi minor: [0, 3, 7]

        intervals.forEach((intv, idx) => {
            const sweepMidi = baseMidi + intv;
            const sweepNote = Tone.Frequency(sweepMidi, "midi").toNote();
            const sweepTime = finalTime + (idx * 0.04); // progressivo

            guitarLead.triggerAttackRelease(
                sweepNote,
                duration * 0.35,
                sweepTime,
                dynamicVelocity * 0.85
            );

            if (score) score.addNote("Lead", sweepNote, section.name + " (sweep)");
        });
    } catch (e) {}
}

// 🎻 MODALITÀ NEO-CLASSICAL — solo nei soli scuri e drammatici
if (isSolo && brightness < 0.4 && texture > 0.6 && duration > 0.25) {
    try {
        // 1) Vibrato più lento ma profondo (drammatico)
        leadVibrato.depth.rampTo(0.22, 0.05);
        leadVibrato.frequency.rampTo(5.2, 0.05);

        // 2) Mini-arpeggio diminuito (1 - ♭3 - ♭5)
        const baseMidi = Tone.Frequency(noteName).toMidi();
        const diminished = [0, 3, 6];

        diminished.forEach((intv, idx) => {
            const neoMidi = baseMidi + intv;
            const neoNote = Tone.Frequency(neoMidi, "midi").toNote();
            const neoTime = finalTime + (idx * 0.045);

            guitarLead.triggerAttackRelease(
                neoNote,
                duration * 0.35,
                neoTime,
                dynamicVelocity * 0.88
            );

            if (score) score.addNote("Lead", neoNote, section.name + " (neo)");
        });

        // 3) Cromatismo discendente (tipico Malmsteen)
        const chromMidi = baseMidi - 1;
        const chromNote = Tone.Frequency(chromMidi, "midi").toNote();
        const chromTime = finalTime + 0.14;

        guitarLead.triggerAttackRelease(
            chromNote,
            duration * 0.3,
            chromTime,
            dynamicVelocity * 0.75
        );

        if (score) score.addNote("Lead", chromNote, section.name + " (chrom)");
    } catch (e) {}
}

// 👻 GHOST-NOTES LEAD — micro-anticipazioni realistiche
if (duration > 0.3 && energy > 0.4 && !(isSolo && complexity > 0.8)) {
    try {
        // 1) Tempo della ghost-note (20–40ms prima)
        const ghostTime = finalTime - (0.02 + Math.random() * 0.02);

        // 2) Pitch: stessa nota o semitono sotto
        const baseMidi = Tone.Frequency(noteName).toMidi();
        const ghostMidi = Math.random() < 0.5 ? baseMidi : baseMidi - 1;
        const ghostNote = Tone.Frequency(ghostMidi, "midi").toNote();

        // 3) Velocity molto bassa
        const ghostVel = dynamicVelocity * 0.35;

        // 4) Durata brevissima
        const ghostDur = duration * 0.25;

        guitarLead.triggerAttackRelease(
            ghostNote,
            ghostDur,
            ghostTime,
            ghostVel
        );

        if (score) score.addNote("Lead", ghostNote, section.name + " (ghost)");
    } catch (e) {}
}

// 🎸 MODALITÀ TWIN LEAD — call & response + alternanza
if ((isSolo || name.includes("chorus")) 
    && energy > 0.5 
    && duration > 0.25 
    && (i % 4 === 0)) {

    try {
        // 1) Risposta leggermente ritardata (call & response)
        const respTime = finalTime + (0.04 + Math.random() * 0.02);

        // 2) Pitch della risposta: stessa nota o terza sopra
        const baseMidi = Tone.Frequency(noteName).toMidi();
        const respMidi = Math.random() < 0.5 ? baseMidi : baseMidi + 4;
        const respNote = Tone.Frequency(respMidi, "midi").toNote();

        // 3) Velocity più morbida
        const respVel = dynamicVelocity * 0.7;

        // 4) Durata leggermente più breve
        const respDur = duration * 0.85;

        guitarLead.triggerAttackRelease(
            respNote,
            respDur,
            respTime,
            respVel
        );

        if (score) score.addNote("Lead", respNote, section.name + " (twin)");
    } catch (e) {}
}

// 🔥 FINAL BOSS SOLO — climax assoluto dell'ultimo solo
if (isSolo && section.isLast && energy > 0.7 && complexity > 0.6 && duration > 0.25) {
    try {
        // 1) Vibrato profondissimo e lento (drammatico)
        leadVibrato.depth.rampTo(0.35, 0.05);
        leadVibrato.frequency.rampTo(5.8, 0.05);

        // 2) Bending larghissimo (Floyd Rose)
        const pr = guitarLead.playbackRate;
        const bendUp = 1 + (Math.random() * 0.06);  // +6%
        const bendDown = 1 - (Math.random() * 0.04); // -4%

        const t1 = finalTime + 0.05;
        const t2 = t1 + 0.12;
        const t3 = t2 + 0.12;

        pr.setValueAtTime(bendUp, t1);
        pr.linearRampToValueAtTime(bendDown, t2);
        pr.linearRampToValueAtTime(1.0, t3);

        // 3) Velocity più dinamica
        dynamicVelocity *= 1.18;

        // 4) Sustain più lungo
        if (duration > 0.3) {
            guitarLead.triggerAttackRelease(
                noteName,
                duration * 1.35,
                finalTime,
                dynamicVelocity * 0.92
            );
        }

        // 5) Armonizzazione doppia (terza + quinta)
        const baseMidi = Tone.Frequency(noteName).toMidi();
        const intervals = [3, 7]; // terza + quinta

        intervals.forEach((intv, idx) => {
            const harmMidi = baseMidi + intv;
            const harmNote = Tone.Frequency(harmMidi, "midi").toNote();
            const harmTime = finalTime + (0.015 + idx * 0.01);

            guitarLead.triggerAttackRelease(
                harmNote,
                duration,
                harmTime,
                dynamicVelocity * 0.6
            );

            if (score) score.addNote("Lead", harmNote, section.name + " (boss-harm)");
        });

        // 6) Scale-run finale (3 note)
        for (let r = 1; r <= 3; r++) {
            const runMidi = baseMidi + (r * 2);
            const runNote = Tone.Frequency(runMidi, "midi").toNote();
            const runTime = finalTime + (r * 0.045);

            guitarLead.triggerAttackRelease(
                runNote,
                duration * 0.3,
                runTime,
                dynamicVelocity * 0.85
            );

            if (score) score.addNote("Lead", runNote, section.name + " (boss-run)");
        }

        // 7) Sweep finale (triade)
        const sweep = [0, 4, 7];
        sweep.forEach((intv, idx) => {
            const swMidi = baseMidi + intv;
            const swNote = Tone.Frequency(swMidi, "midi").toNote();
            const swTime = finalTime + 0.18 + (idx * 0.035);

            guitarLead.triggerAttackRelease(
                swNote,
                duration * 0.25,
                swTime,
                dynamicVelocity * 0.8
            );

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
// API PUBBLICA
// ============================================================

export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {

    const tonalCenter = params?.tonalCenter || params?.imageParams?.tonalCenter || "A4";
    const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";

    const rootNote = tonalCenter.replace(/[0-9]/g, "");
    const isMinor = scaleType.includes("minor");

    LeadLegacy.schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, scaleType, score);
}
