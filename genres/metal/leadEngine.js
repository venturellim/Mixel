//
// leadEngine.js
// Generatore di melodie power metal.
// Nessuna logica di routing. Nessuna logica di strumenti.
// Solo generazione di note + scheduling.
//

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote } from "../../utils/harmonyUtils.js";
import { melodicStep } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("leadEngine.js loaded");

// ============================================================
// 🎼 FUNZIONE ENARMONICA → SOLO BEMOLLE
// ============================================================
//
// Converte automaticamente:
// C# → Db
// D# → Eb
// F# → Gb
// G# → Ab
// A# → Bb
//
// Tone.js gestisce perfettamente questa conversione.
//

function toFlat(note) {
    return Tone.Frequency(note).toNote("flat");
}

// ============================================================
// 🎸 INIZIALIZZAZIONE
// ============================================================

export function initLeadEngine(instruments, params, scale, rand, structure) {

    const { guitarLead } = instruments;

    // --------------------------------------------------------
    // 1) Range della lead guitar
    // --------------------------------------------------------
    const MIN_MIDI = noteToMidi("C4");
    const MAX_MIDI = noteToMidi("C6");

    function clampLead(note) {
        const midi = noteToMidi(note);
        if (midi < MIN_MIDI) return toFlat(midiToNote(MIN_MIDI));
        if (midi > MAX_MIDI) return toFlat(midiToNote(MAX_MIDI));
        return toFlat(note);
    }

    // --------------------------------------------------------
    // 2) Generazione frase melodica
    // --------------------------------------------------------
    function generatePhrase(startNote, length = 8) {
        let note = startNote;
        const phrase = [];

        for (let i = 0; i < length; i++) {

            // Direzione melodica basata sull'intensità
            const step = rand() < params.intensity ? 1 : -1;

            // Salti occasionali
            if (rand() < params.leadDensity * 0.2) {
                const jump = rand() < 0.5 ? 2 : -2;
                note = melodicStep(scale, note, jump);
            } else {
                note = melodicStep(scale, note, step);
            }

            note = clampLead(note);
            phrase.push(note);
        }

        return phrase;
    }

    // --------------------------------------------------------
    // 3) Scheduling di una sezione
    // --------------------------------------------------------
    function scheduleSection(section, density) {
        const timeline = buildSectionTimeline(section, "8n");

        // Nota di partenza
        let currentNote = clampLead(
            scale[Math.floor(rand() * scale.length)]
        );

        timeline.forEach((t, i) => {

            if (rand() > density) return;

            // Ogni 4 step generiamo una nuova frase
            if (i % 4 === 0) {
                const phrase = generatePhrase(currentNote, 4);

                phrase.forEach((n, idx) => {
                    const time = t + idx * duration("16n");
                    guitarLead.triggerAttackRelease(n, "16n", time);
                });

                currentNote = phrase[phrase.length - 1];
            }
        });
    }

    // ============================================================
    // 🎵 SCHEDULING COMPLETO
    // ============================================================

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

    // ============================================================
    // EXPORT ENGINE
    // ============================================================

    return {
        schedule
    };
}
