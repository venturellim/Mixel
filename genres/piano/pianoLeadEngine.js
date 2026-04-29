// pianoLeadEngine.js — ver. A (Metal Melodic Library → Piano Lead)
import * as Tone from "https://esm.sh/tone";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { leadRhythmLibrary, leadMelodicLibrary } from "../../utils/leadLibraries.js";
import { applyLeadEnhancer } from "../../utils/leadEnhancers.js";

console.log("pianoLeadEngine.js ver. 001 loaded");

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
    return match ? match[1] : "A";
}

// ------------------------------------------------------------
// PIANO LEAD ENGINE — VERSIONE A
// ------------------------------------------------------------
export function schedulePianoLead(
    section,
    progression,
    instruments,
    params,
    rand,
    measureDur,
    score
) {
    const { piano, rhBus } = instruments;
    if (!piano || !rhBus) return;

    const stepTime = measureDur / 16;

    const {
        energy = 0.5,
        brightness = 0.5,
        complexity = 0.5,
        texture = 0.5
    } = params.imageParams || {};

    // ------------------------------------------------------------
    // 1) SCELTA LIBRERIA (come metal)
    // ------------------------------------------------------------
    const isChorus = section.name.includes("chorus");
    const isSolo = section.name.includes("solo");

    const family = isSolo
        ? leadMelodicLibrary.epic
        : leadMelodicLibrary.emotional;

    const melodyIndex = Math.floor(energy * family.length) % family.length;
    let melody = [...family[melodyIndex]];

    // ------------------------------------------------------------
    // 2) SCELTA PATTERN RITMICO
    // ------------------------------------------------------------
    const rhythm = leadRhythmLibrary.verse[
        Math.floor(brightness * leadRhythmLibrary.verse.length)
    ];

    // ------------------------------------------------------------
    // 3) ENHANCER OGNI 2 MISURE
    // ------------------------------------------------------------
    const measuresPerEnhancer = 2;
    const enhancerList = [
        "enhanceMelodyMicroVariation",
        "enhanceChromaticPassing",
        "addEchoEffect"
    ];

    // ------------------------------------------------------------
    // LOOP MISURE
    // ------------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {

        const measureStart = section.startTime + m * measureDur;

        // Enhancer ogni 2 misure
        if (m % measuresPerEnhancer === 0) {
            const enh = enhancerList[(rand() * enhancerList.length) | 0];
            melody = applyLeadEnhancer(melody, enh, { energy, brightness, complexity, texture });
        }

        const rawRoot = progression[m % progression.length];
        const pitchRoot = getRootPitch(rawRoot);

        const scale = buildScaleFromTonic(pitchRoot + "3", "harmonicMinor");
        const rootIdx = 0;

        // ------------------------------------------------------------
        // LOOP STEP
        // ------------------------------------------------------------
        rhythm.forEach((step, i) => {

            const absoluteTime = measureStart + step * stepTime;

            const degree = rootIdx + melody[i % melody.length];
            const noteName = getScaleDegree(scale, degree);
            const note = safeNote(noteName, "4");

            if (!note) return;

            // Velocity naturale
            const vel = 0.45 + (melody[i % melody.length] * 0.02);

            Tone.Transport.schedule(t => {
                piano.triggerAttackRelease(note, "8n", t, vel);
                if (score) score.addNote("Lead", note, section.name);
            }, absoluteTime);
        });
    }
}
