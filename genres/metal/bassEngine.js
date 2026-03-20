//
// bassEngine.js
// Linee di basso power metal.
// Nessuna logica di routing. Nessuna logica di strumenti.
// Solo generazione di note + scheduling.
//

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote } from "../../utils/harmonyUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("bassEngine.js loaded");

// ============================================================
// 🎼 FUNZIONE ENARMONICA → SOLO BEMOLLE
// ============================================================

function toFlat(note) {
    return Tone.Frequency(note).toNote("flat");
}

// ============================================================
// 🎸 INIZIALIZZAZIONE
// ============================================================

export function initBassEngine(instruments, params, scale, rand, structure) {

    const { bass } = instruments;

    // --------------------------------------------------------
    // 1) Range del basso (C1–C2)
    // --------------------------------------------------------
    const MIN_MIDI = noteToMidi("C1");
    const MAX_MIDI = noteToMidi("C2");

    function clampBass(note) {
        const midi = noteToMidi(note);
        if (midi < MIN_MIDI) return toFlat(midiToNote(MIN_MIDI));
        if (midi > MAX_MIDI) return toFlat(midiToNote(MAX_MIDI));
        return toFlat(note);
    }

    // --------------------------------------------------------
    // 2) Nota fondamentale (pedal tone)
    // --------------------------------------------------------
    const tonic = clampBass(scale[0]);

    // --------------------------------------------------------
    // 3) Funzioni di stile
    // --------------------------------------------------------

    // Gallop tipico power metal: 1/16 + 1/16 + 1/8
    function scheduleGallop(note, t) {

        Tone.Transport.schedule((time) => {
            bass.triggerAttackRelease(note, "16n", time);
        }, t);

        Tone.Transport.schedule((time) => {
            bass.triggerAttackRelease(note, "16n", time);
        }, t + duration("16n"));

        Tone.Transport.schedule((time) => {
            bass.triggerAttackRelease(note, "8n", time);
        }, t + duration("8n"));
    }

    // Linea dritta: 1/8
    function scheduleStraight(note, t) {
        Tone.Transport.schedule((time) => {
            bass.triggerAttackRelease(note, "8n", time);
        }, t);
    }

    // --------------------------------------------------------
    // 4) Scheduling di una sezione
    // --------------------------------------------------------
    function scheduleSection(section, style) {
        const timeline = buildSectionTimeline(section, "8n");

        timeline.forEach(t => {

            // Nota di base: tonic
            let note = tonic;

            // Variazioni occasionali
            if (rand() < params.bassIntensity * 0.15) {
                const idx = Math.floor(rand() * scale.length);
                note = clampBass(scale[idx]);
            }

            // Stile
            if (style === "gallop") {
                scheduleGallop(note, t);
            } else {
                scheduleStraight(note, t);
            }
        });
    }

    // ============================================================
    // 🎵 SCHEDULING COMPLETO
    // ============================================================

    function schedule() {

        structure.sections.forEach(section => {

            let style = params.bassStyle; // "gallop" o "straight"

            // Chorus più energico
            if (section.name === "chorus") style = "gallop";

            // Solo: basso più semplice
            if (section.name === "solo") style = "straight";

            scheduleSection(section, style);
        });
    }

    // ============================================================
    // EXPORT ENGINE
    // ============================================================

    return {
        schedule
    };
}
