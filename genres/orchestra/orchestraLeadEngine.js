// orchestraLeadEngine.js — ver. C (Metal Logic + Orchestral Safe Pipeline)
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

console.log("orchestraLeadEngine.js ver. C loaded");

// ------------------------------------------------------------
// SAFE NOTE (stessa filosofia di orchestraEngine)
// ------------------------------------------------------------
function safeNote(note, defaultOctave = "4") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

// ------------------------------------------------------------
// ROOT PITCH (estrae solo la nota, ignora accordi)
// ------------------------------------------------------------
function getRootPitch(root) {
    if (!root || typeof root !== "string") return "A";
    const match = root.toUpperCase().match(/^([A-G](#|B)?)/);
    if (!match) return "A";
    return match[1];
}

// ============================================================
// VIBRATO NATURALE (solo violino)
// ============================================================
function applyNaturalVibrato(violin, time, duration) {
    if (!violin || duration < 0.25) return;
    const pr = violin.playbackRate;
    const depth = 0.01;
    const speed = 0.12;

    for (let i = 0; i < 4; i++) {
        const t = time + i * speed;
        const val = i % 2 === 0 ? 1 + depth : 1 - depth;
        pr.setValueAtTime(val, t);
    }
    pr.setValueAtTime(1, time + duration);
}

// ============================================================
// VELOCITY ORCHESTRALE (più morbido del metal)
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
// SUPPORTO VIOLA (solo sezioni normali)
// ============================================================
function violaSupport(melody, i) {
    if (i % 4 === 0) return melody[i] - 2; // terza sotto
    if (Math.random() < 0.15) return melody[i] + 2; // terza sopra
    return null;
}

// ============================================================
// BRIDGE ORCHESTRALE (più dolce del metal)
// ============================================================
function shapeOrchestraBridge(melody) {
    let out = [...melody];
    out = out.filter((_, i) => i % 4 !== 0);
    out = out.map(n => Math.min(n, 6));
    return out;
}

// ============================================================
// SELEZIONE FAMIGLIA MELODICA (identica al metal)
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
// SELEZIONE FAMIGLIA ASSOLO (identica al metal)
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
// ORCHESTRA LEAD ENGINE — VERSIONE C
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

    // ------------------------------------------------------------
    // 1) SCELTA LIBRARY (identica al metal)
    // ------------------------------------------------------------
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

    // ------------------------------------------------------------
    // 2) SCELTA MELODIA BASE (identica al metal)
    // ------------------------------------------------------------
    let melodyFamily = isSolo
        ? getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture)
        : getMelodyFamily(isPreChorus, isChorus, energy, brightness, complexity, texture);

    const melodyIndex = Math.floor(energy * melodyFamily.data.length) % melodyFamily.data.length;
    const baseMelody = melodyFamily.data[melodyIndex];

    // ------------------------------------------------------------
    // 3) VIOLA = LEAD PRINCIPALE (melodia + enhancer)
    // ------------------------------------------------------------
    let violaPattern = getPattern(sectionType);
    let violaMelody = [...baseMelody];

    if (isSolo) {
        violaMelody = applyLeadEnhancer(violaMelody, "enhanceMelodyMicroVariation", enhancerContext);
        violaMelody = applyLeadEnhancer(violaMelody, "addTrills", enhancerContext);
        violaMelody = applyLeadEnhancer(violaMelody, "addEchoEffect", enhancerContext);

        if (isBridge) violaMelody = shapeOrchestraBridge(violaMelody);
    }

    // ------------------------------------------------------------
    // 4) VIOLINO = LEAD ORNAMENTALE (melodia + enhancer)
    // ------------------------------------------------------------
    let violinPattern = [...violaPattern];
    let violinMelody = [...baseMelody];

    if (!isSolo) {
        violinMelody = applyLeadEnhancer(violinMelody, "enhanceMelodyMicroVariation", enhancerContext);
        violinMelody = applyLeadEnhancer(violinMelody, "enhanceChromaticPassing", enhancerContext);
    } else {
        violinMelody = applyLeadEnhancer(violinMelody, "addScaleRunBetweenPeaks", enhancerContext);
        violinMelody = applyLeadEnhancer(violinMelody, "addMirrorInversion", enhancerContext);
        violinMelody = applyLeadEnhancer(violinMelody, "enhanceChromaticPassing", enhancerContext);

        if (isBridge) violinMelody = shapeOrchestraBridge(violinMelody);
    }

    // ------------------------------------------------------------
    // 5) SCHEDULAZIONE NOTE (pipeline orchestrale sicura)
    // ------------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {

        const measureStartTime = section.startTime + m * measureDur;

        const rawRoot = progression[m % progression.length];
        const pitchRoot = getRootPitch(rawRoot);

        // Scala armonica minore come orchestraEngine
        const scale = buildScaleFromTonic(pitchRoot + "3", "harmonicMinor");
        const rootIdx = 0;

        violinPattern.forEach((s, i) => {

            const absoluteTime = measureStartTime + s * stepTime;
            const nextStep = violinPattern[i + 1] ?? 16;
            const duration = (nextStep - s) * stepTime;

            const violaIdx = violaMelody[i % violaMelody.length];
            const violinIdx = violinMelody[i % violinMelody.length];

            // ----------------------------------------------------
            // CONVERSIONE GRADO → NOTA DI SCALA → SAFE NOTE
            // ----------------------------------------------------
            const violaDegree = rootIdx + violaIdx;
            const violinDegree = rootIdx + violinIdx + 2; // violino un po' più alto

            const violaName = getScaleDegree(scale, violaDegree);
            const violinNameBase = getScaleDegree(scale, violinDegree);

            // Viola: range medio-alto
            const violaNote = safeNote(violaName, isSolo ? "5" : "4");

            // Violino: un'ottava sopra la scala base
            let violinNoteRaw = violinNameBase;
            try {
                const midi = Tone.Frequency(violinNameBase).toMidi();
                violinNoteRaw = Tone.Frequency(midi + (isSolo ? 12 : 7), "midi").toNote();
            } catch (e) {
                // fallback: usa direttamente la nota di scala
                violinNoteRaw = violinNameBase;
            }
            const violinNote = safeNote(violinNoteRaw, isSolo ? "6" : "5");

            const velViola = computeOrchestraVelocity(violaIdx, duration, isSolo, isBridge);
            const velViolin = computeOrchestraVelocity(violinIdx, duration, isSolo, isBridge);

            // VIOLA (lead principale)
            if (violaNote) {
                Tone.Transport.schedule(time => {
                    viola.triggerAttackRelease(violaNote, duration, time, velViola);
                    if (score) score.addNote("Viola", violaNote, section.name);
                }, absoluteTime);
            }

            // VIOLINO (lead ornamentale)
            if (violinNote) {
                Tone.Transport.schedule(time => {
                    violin.triggerAttackRelease(violinNote, duration, time, velViolin);
                    applyNaturalVibrato(violin, time, duration);
                    if (score) score.addNote("Violin", violinNote, section.name);
                }, absoluteTime);
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
        });
    }
}
