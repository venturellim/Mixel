// orchestraLeadEngine.js — ver. 002.2 (FIX Violino che smette di suonare)

import * as Tone from "https://esm.sh/tone";

import {
    leadRhythmLibrary,
    leadMelodicLibrary
} from "../../utils/leadLibraries.js";

import {
    applyLeadEnhancer,
    shapeBridgeSolo
} from "../../utils/leadEnhancers.js";

import {
    buildScaleFromTonic,
    getScaleDegree
} from "../../utils/scaleUtils.js";

console.log("orchestraLeadEngine.js ver. 002.2 loaded");

// ------------------------------------------------------------
// SAFE NOTE
// ------------------------------------------------------------
function safeNote(note, defaultOctave = "4") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

// ------------------------------------------------------------
// ROOT PITCH
// ------------------------------------------------------------
function getRootPitch(root) {
    if (!root || typeof root !== "string") return "A";
    const match = root.toUpperCase().match(/^([A-G](#|B)?)/);
    if (!match) return "A";
    return match[1];
}

// ============================================================
// VIBRATO NATURALE
// ============================================================
function applyNaturalVibrato(violin, time, duration) {
    if (!violin || duration < 0.25) return;
    const pr = violin.playbackRate;
    if (!pr) return;
    const depth = 0.01;
    const speed = 0.12;

    for (let i = 0; i < 4; i++) {
        const t = time + i * speed;
        const val = i % 2 === 0 ? 1 + depth : 1 - depth;
        try { pr.setValueAtTime(val, t); } catch(e) {}
    }
    try { pr.setValueAtTime(1, time + duration); } catch(e) {}
}

// ============================================================
// VELOCITY ORCHESTRALE
// ============================================================
function computeOrchestraVelocity(noteIdx, duration, isSolo, isBridge) {
    let vel = 0.7;
    if (duration > 0.3) vel += 0.1;
    if (duration < 0.15) vel -= 0.1;
    if (noteIdx >= 5) vel += 0.05;
    if (isBridge) vel -= 0.05;
    return Math.min(1, Math.max(0.3, vel));
}

// ============================================================
// SUPPORTO VIOLA
// ============================================================
function violaSupport(melody, i) {
    if (i % 4 === 0) return melody[i] - 2;
    if (Math.random() < 0.15) return melody[i] + 2;
    return null;
}

// ============================================================
// BRIDGE ORCHESTRALE
// ============================================================
function shapeOrchestraBridge(melody) {
    let out = [...melody];
    out = out.filter((_, i) => i % 4 !== 0);
    out = out.map(n => Math.min(n, 6));
    return out;
}

// ============================================================
// SELEZIONE FAMIGLIA MELODICA
// ============================================================
function getMelodyFamily(isPreChorus, isChorus, energy, brightness, complexity, texture) {
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
}

// ============================================================
// SELEZIONE FAMIGLIA ASSOLO
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
// ORCHESTRA LEAD ENGINE
// ============================================================
export function scheduleOrchestraLead(section, progression, instruments, params, rand, measureDur, score) {

    const { violin, viola } = instruments;
    if (!violin || !viola) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") && !name.includes("pre");
    const isPreChorus = name.includes("pre");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const isSoloPt2 = name.includes("solopt2");
    const isBridge = name.includes("bridge");

    const stepTime = measureDur / 16;

    const {
        energy = 0.5,
        brightness = 0.5,
        texture = 0.5,
        complexity = 0.5
    } = params?.imageParams || {};

    const enhancerContext = { energy, brightness, texture, complexity };

    // ============================================================
    // SELEZIONE PATTERN RITMICO
    // ============================================================
    let sectionType =
        isIntro ? "intro" :
        isPreChorus ? "prechorus" :
        isChorus ? "chorus" :
        "verse";

    const getPattern = (type) => {
        const family = leadRhythmLibrary[type] || leadRhythmLibrary.verse;
        const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
        const index = Math.floor(Math.abs(dnaScore)) % family.length;
        return family[index];
    };

    // ============================================================
    // SELEZIONE MELODIA BASE
    // ============================================================
    let melodyFamily = isSolo
        ? getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture)
        : getMelodyFamily(isPreChorus, isChorus, energy, brightness, complexity, texture);

    const melodyIndex = Math.floor(energy * melodyFamily.data.length) % melodyFamily.data.length;
    const baseMelody = melodyFamily.data[melodyIndex];

    // ============================================================
    // PATTERN RITMICO BASE
    // ============================================================
    const basePattern = getPattern(sectionType);

    // ============================================================
    // VIOLA (LEAD PRINCIPALE) - pattern e melodia
    // ============================================================
    let violaPattern = [...basePattern];
    let violaMelody = [...baseMelody];

    if (isSolo) {
        violaMelody = applyLeadEnhancer(violaMelody, "enhanceMelodyMicroVariation", enhancerContext);
        violaMelody = applyLeadEnhancer(violaMelody, "addTrills", enhancerContext);
        violaMelody = applyLeadEnhancer(violaMelody, "addEchoEffect", enhancerContext);
        if (isBridge) violaMelody = shapeOrchestraBridge(violaMelody);
    }

    // ============================================================
    // VIOLINO (LEAD ORNAMENTALE) - pattern e melodia SEPARATI
    // ============================================================
    let violinPattern = [...basePattern];  // usa lo stesso pattern ritmico di base
    let violinMelody = [...baseMelody];    // parte dalla stessa melodia base

    if (!isSolo) {
        violinMelody = applyLeadEnhancer(violinMelody, "enhanceMelodyMicroVariation", enhancerContext);
        violinMelody = applyLeadEnhancer(violinMelody, "enhanceChromaticPassing", enhancerContext);
    } else {
        violinMelody = applyLeadEnhancer(violinMelody, "addScaleRunBetweenPeaks", enhancerContext);
        violinMelody = applyLeadEnhancer(violinMelody, "addMirrorInversion", enhancerContext);
        violinMelody = applyLeadEnhancer(violinMelody, "enhanceChromaticPassing", enhancerContext);
        if (isBridge) violinMelody = shapeOrchestraBridge(violinMelody);
    }

    // DEBUG: verifica che violino abbia pattern e melodia validi
    console.log(`🎻 ${section.name}: violaMelody length=${violaMelody.length}, violinMelody length=${violinMelody.length}, pattern length=${violaPattern.length}`);

    // ============================================================
    // SCHEDULAZIONE
    // ============================================================
    for (let m = 0; m < section.measures; m++) {

        const measureStartTime = section.startTime + m * measureDur;

        const rawRoot = progression[m % progression.length];
        const pitchRoot = getRootPitch(rawRoot);

        const scale = buildScaleFromTonic(pitchRoot + "3", "harmonicMinor");
        const rootIdx = 0;

        // Usa violaPattern (o violinPattern, sono uguali per lunghezza)
        const patternToUse = violaPattern;

        for (let i = 0; i < patternToUse.length; i++) {
            const s = patternToUse[i];
            const absoluteTime = measureStartTime + s * stepTime;
            const nextStep = patternToUse[i + 1] ?? 16;
            const duration = (nextStep - s) * stepTime;

            // Indici melodia (con modulo per evitare out-of-range)
            const violaIdx = violaMelody[i % violaMelody.length];
            const violinIdx = violinMelody[i % violinMelody.length];

            // CONVERSIONE GRADO → NOTA DI SCALA
            const violaDegree = rootIdx + violaIdx;
            const violinDegree = rootIdx + ((violinIdx + 2) % scale.length);

            const violaName = getScaleDegree(scale, violaDegree);
            const violinNameBase = getScaleDegree(scale, violinDegree);

            // Viola: range medio
            const violaOctave = isSolo ? 5 : 4;
            const violaNote = safeNote(violaName, violaOctave);

            // Violino: un'ottava sopra la viola
            let violinNote = safeNote(violinNameBase, violaOctave + 1);
            if (!violinNote && violinNameBase) {
                // fallback: prova con ottava diversa
                violinNote = safeNote(violinNameBase, violaOctave + 2);
            }

            const velViola = computeOrchestraVelocity(violaIdx, duration, isSolo, isBridge);
            const velViolin = computeOrchestraVelocity(violinIdx, duration, isSolo, isBridge);

            // VIOLA (lead principale)
            if (violaNote) {
                Tone.Transport.schedule(time => {
                    viola.triggerAttackRelease(violaNote, duration, time, velViola);
                    if (score) score.addNote("Rhythm", violaNote, section.name);
                }, absoluteTime);
            } else {
                console.warn(`🎻 violaNote null per degree=${violaDegree}, idx=${violaIdx}`);
            }

            // VIOLINO (lead ornamentale) - schedulato SEMPRE, indipendentemente dalla viola
            if (violinNote) {
                Tone.Transport.schedule(time => {
                    violin.triggerAttackRelease(violinNote, duration, time, velViolin);
                    applyNaturalVibrato(violin, time, duration);
                    if (score) score.addNote("Lead", violinNote, section.name);
                }, absoluteTime);
            } else {
                console.warn(`🎻 violinNote null per degree=${violinDegree}, idx=${violinIdx}`);
            }

            // SUPPORTO VIOLA (solo sezioni normali)
            if (!isSolo) {
                const supportIdx = violaSupport(violaMelody, i);
                if (supportIdx !== null) {
                    const supportDegree = rootIdx + supportIdx;
                    const supportName = getScaleDegree(scale, supportDegree);
                    const supportNote = safeNote(supportName, "3");
                    if (supportNote) {
                        Tone.Transport.schedule(time => {
                            viola.triggerAttackRelease(
                                supportNote,
                                duration * 0.8,
                                time + 0.01,
                                velViola * 0.8
                            );
                            if (score) score.addNote("Viola-Support", supportNote, section.name);
                        }, absoluteTime);
                    }
                }
            }
        }
    }
}