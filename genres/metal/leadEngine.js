// leadEngine.js — versione con leadScale dedicata

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote } from "../../utils/harmonyUtils.js";
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
    // 0) Costruiamo una leadScale dedicata (in MIDI) nel range C4–C6
    // ------------------------------------------------------------
    const leadScaleMidi = scale
        .map(n => typeof n === "number" ? n : noteToMidi(n))
        .filter(m => !isNaN(m) && m >= MIN_MIDI && m <= MAX_MIDI);

    console.log("[leadEngine] leadScaleMidi:", leadScaleMidi);

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
    // 3) Step melodico robusto sulla leadScaleMidi
    // ------------------------------------------------------------
    function safeMelodicStep(current, step) {
        if (leadScaleMidi.length === 0) return clampLead(current);

        const currentMidi = noteToMidi(current);
        if (isNaN(currentMidi)) return safeMidiToNote(leadScaleMidi[0]);

        // Trova l'indice della nota più vicina nella leadScale
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

        const nextMidi = leadScaleMidi[nextIdx];
        return safeMidiToNote(nextMidi);
    }

    // ------------------------------------------------------------
    // 4) Generazione frase lead (come tua, ma usando il nuovo safeMelodicStep)
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
    // 5) Scheduling sezioni (identico al tuo)
    // ------------------------------------------------------------
    function scheduleSection(section, density) {
        const timeline = buildSectionTimeline(section, "8n");

        let baseNote;
        if (leadScaleMidi.length > 0) {
            const startMidi = leadScaleMidi[Math.floor(rand() * leadScaleMidi.length)];
            baseNote = safeMidiToNote(startMidi);
        } else {
            baseNote = "C4";
        }

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
    // 6) Scheduling globale (come il tuo)
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
