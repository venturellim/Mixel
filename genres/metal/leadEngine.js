// leadEngine.js — versione compatibile con la nuova architettura

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote } from "../../utils/harmonyUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("leadEngine.js ver. 001 loaded");

function toFlat(note) {
    return Tone.Frequency(note).toNote("flat");
}

export function initLeadEngine(instruments, params, rand) {

    const { guitarLead } = instruments;

    const MIN_MIDI = noteToMidi("C4");
    const MAX_MIDI = noteToMidi("C6");

    // ------------------------------------------------------------
    // Conversione sicura MIDI → nota
    // ------------------------------------------------------------
    function safeMidiToNote(midi) {
        if (isNaN(midi)) return "C4";
        if (midi < MIN_MIDI) midi = MIN_MIDI;
        if (midi > MAX_MIDI) midi = MAX_MIDI;
        return toFlat(midiToNote(midi));
    }

    // ------------------------------------------------------------
    // Clamping sicuro per note in formato stringa
    // ------------------------------------------------------------
    function clampLead(note) {
        if (!note) return "C4";
        const midi = noteToMidi(note);
        return safeMidiToNote(midi);
    }

    // ------------------------------------------------------------
    // Step melodico robusto su leadScaleMidi
    // ------------------------------------------------------------
    function safeMelodicStep(current, step, leadScaleMidi) {
        if (!leadScaleMidi || leadScaleMidi.length === 0) return clampLead(current);

        const currentMidi = noteToMidi(current);
        if (isNaN(currentMidi)) return safeMidiToNote(leadScaleMidi[0]);

        // Trova l'indice della nota più vicina
        let bestIdx = 0;
        let bestDiff = Infinity;
        leadScaleMidi.forEach((m, i) => {
            const d = Math.abs(m - currentMidi);
            if (d < bestDiff) {
                bestDiff = d;
                bestIdx = i;
            }
        });

        let nextIdx = bestIdx + step;
        if (nextIdx < 0) nextIdx = 0;
        if (nextIdx >= leadScaleMidi.length) nextIdx = leadScaleMidi.length - 1;

        return safeMidiToNote(leadScaleMidi[nextIdx]);
    }

    // ------------------------------------------------------------
    // Generazione frase lead power metal
    // ------------------------------------------------------------
    function generatePhrase(startNote, length, directionBias, leadScaleMidi) {
        let note = startNote || "C4";
        const phrase = [];

        for (let i = 0; i < length; i++) {
            const dir = rand() < params.intensity ? directionBias : -directionBias;
            const bigJump = rand() < params.leadDensity * 0.25;
            const step = bigJump ? dir * 2 : dir;

            note = safeMelodicStep(note, step, leadScaleMidi);
            phrase.push(note);
        }

        return phrase;
    }

    // ------------------------------------------------------------
    // Scheduling di una singola sezione
    // ------------------------------------------------------------
    function scheduleSection(section, sectionScale, root) {

        // Costruiamo la leadScale MIDI per questa sezione
        const leadScaleMidi = sectionScale
            .map(n => typeof n === "number" ? n : noteToMidi(n))
            .filter(m => !isNaN(m) && m >= MIN_MIDI && m <= MAX_MIDI);

        const timeline = buildSectionTimeline(section, "8n");

        // Nota di partenza
        let baseNote;
        if (leadScaleMidi.length > 0) {
            const startMidi = leadScaleMidi[Math.floor(rand() * leadScaleMidi.length)];
            baseNote = safeMidiToNote(startMidi);
        } else {
            baseNote = "C4";
        }

        // Direzione melodica
        const directionBias =
            section.name === "outro" ? -1 : 1;

        timeline.forEach((t, i) => {
            if (rand() > params.leadDensity) return;

            // Una frase ogni mezzo tempo
            if (i % 2 === 0) {
                const phrase = generatePhrase(baseNote, 4, directionBias, leadScaleMidi);

                phrase.forEach((n, idx) => {
                    const eventTime = t + idx * duration("16n");
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(n, "8n", time);
                    }, eventTime);
                });

                baseNote = phrase[phrase.length - 1];
            }
        });
    }

    // ------------------------------------------------------------
    // EXPORT
    // ------------------------------------------------------------
    return {
        scheduleSection
    };
}
