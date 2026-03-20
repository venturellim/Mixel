//
// leadEngine.js — versione corretta e robusta
// Lead power metal: frasi, direzione, tensione/risoluzione.
//

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote } from "../../utils/harmonyUtils.js";
import { melodicStep } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("leadEngine.js loaded");

function toFlat(note) {
    return Tone.Frequency(note).toNote("flat");
}

export function initLeadEngine(instruments, params, scale, rand, structure) {

    const { guitarLead } = instruments;

    const MIN_MIDI = noteToMidi("C4");
    const MAX_MIDI = noteToMidi("C6");

    // ------------------------------------------------------------
    // 1) Conversione sicura MIDI → nota
    // ------------------------------------------------------------
    function safeMidiToNote(midi) {
        if (isNaN(midi)) return "C4";
        if (midi < MIN_MIDI) midi = MIN_MIDI;
        if (midi > MAX_MIDI) midi = MAX_MIDI;
        return toFlat(midiToNote(midi));
    }

    // ------------------------------------------------------------
    // 2) Clamping sicuro per note in formato stringa
    // ------------------------------------------------------------
    function clampLead(note) {
        if (!note) return "C4";
        const midi = noteToMidi(note);
        return safeMidiToNote(midi);
    }

    // ------------------------------------------------------------
    // 3) Step melodico sicuro
    // ------------------------------------------------------------
    function safeMelodicStep(current, step) {
        if (scale.length === 0) return clampLead(current);

        let next = melodicStep(scale, current, step);

        // Se melodicStep fallisce → resta sulla nota corrente
        if (!next) next = current;

        return clampLead(next);
    }

    // ------------------------------------------------------------
    // 4) Generazione frase lead
    // ------------------------------------------------------------
    function generatePhrase(startNote, length = 8, directionBias = 1) {
        let note = startNote || "C4";
        const phrase = [];

        for (let i = 0; i < length; i++) {
            const dir = rand() < params.intensity ? directionBias : -directionBias;
            const bigJump = rand() < params.leadDensity * 0.25;
            const step = bigJump ? dir * 2 : dir;

            note = safeMelodicStep(note, step);
            phrase.push(note);
        }

        return phrase;
    }

    // ------------------------------------------------------------
    // 5) Scheduling sezioni
    // ------------------------------------------------------------
    function scheduleSection(section, density) {
        const timeline = buildSectionTimeline(section, "8n");

        // Nota di partenza sempre valida
        let baseNote = scale.length > 0
            ? clampLead(scale[Math.floor(rand() * scale.length)])
            : "C4";

        const directionBias =
            section.name === "intro"  ? 1 :
            section.name === "verse"  ? 1 :
            section.name === "chorus" ? 1 :
            section.name === "solo"   ? 1 :
            section.name === "outro"  ? -1 : 1;

        timeline.forEach((t, i) => {
            if (rand() > density) return;

            if (i % 4 === 0) {
                const phrase = generatePhrase(baseNote, 4, directionBias);

                phrase.forEach((n, idx) => {
                    const eventTime = t + idx * duration("16n");
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(n, "16n", time);
                    }, eventTime);
                });

                baseNote = phrase[phrase.length - 1];
            }
        });
    }

    // ------------------------------------------------------------
    // 6) Scheduling globale
    // ------------------------------------------------------------
    function schedule() {
        structure.sections.forEach(section => {
            let density = params.leadDensity;
            if (section.name === "intro")  density *= 0.3;
            if (section.name === "verse")  density *= 0.6;
            if (section.name === "chorus") density *= 1.0;
            if (section.name === "solo")   density *= 1.4;
            if (section.name === "outro")  density *= 0.4;
            scheduleSection(section, density);
        });
    }

    return { schedule };
}
