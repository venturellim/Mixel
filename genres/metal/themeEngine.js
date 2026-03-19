//
// themeEngine.js
// Generatore del tema principale power metal.
// Nessuna logica di routing. Nessuna logica di strumenti.
// Solo generazione di note + scheduling.
//

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote } from "../../utils/harmonyUtils.js";
import { melodicStep } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("themeEngine.js loaded");

// ============================================================
// 🎼 FUNZIONE ENARMONICA → SOLO BEMOLLE
// ============================================================

function toFlat(note) {
    return Tone.Frequency(note).toNote("flat");
}

// ============================================================
// 🎸 INIZIALIZZAZIONE
// ============================================================

export function initThemeEngine(instruments, params, scale, rand, structure) {

    const { guitarLead } = instruments;

    // --------------------------------------------------------
    // 1) Range lead (C4–C6)
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
    // 2) Generazione del tema principale
    // --------------------------------------------------------
    function generateTheme() {
        const length = params.themeStyle === "heroic" ? 8 : 6;

        let note = clampLead(scale[Math.floor(rand() * scale.length)]);
        const theme = [note];

        for (let i = 1; i < length; i++) {

            // Heroic → frasi ascendenti
            // Dark → frasi discendenti
            const direction = params.themeStyle === "heroic" ? 1 : -1;

            // Salti occasionali
            const step = rand() < 0.2 ? direction * 2 : direction;

            note = melodicStep(scale, note, step);
            note = clampLead(note);

            theme.push(note);
        }

        return theme;
    }

    const theme = generateTheme();

    // --------------------------------------------------------
    // 3) Varianti del tema per sezione
    // --------------------------------------------------------

    function themeSimple() {
        return theme.slice(0, Math.ceil(theme.length / 2));
    }

    function themeFull() {
        return theme;
    }

    function themeExpanded() {
        const out = [];
        theme.forEach(n => {
            out.push(n);
            if (rand() < 0.4) {
                const step = rand() < 0.5 ? 1 : -1;
                const extra = clampLead(melodicStep(scale, n, step));
                out.push(extra);
            }
        });
        return out;
    }

    function themeOutro() {
        return theme.slice(0, 3);
    }

    // --------------------------------------------------------
    // 4) Scheduling del tema in una sezione
    // --------------------------------------------------------

    function scheduleTheme(section, notes) {
        const timeline = buildSectionTimeline(section, "4n");

        notes.forEach((note, i) => {
            const t = timeline[i];
            if (!t) return;
            guitarLead.triggerAttackRelease(note, "4n", t);
        });
    }

    // ============================================================
    // 🎵 SCHEDULING COMPLETO
    // ============================================================

    function schedule() {

        structure.sections.forEach(section => {

            if (section.name === "intro") {
                scheduleTheme(section, themeSimple());
                return;
            }

            if (section.name === "verse") {
                // Tema non suona nel verse
                return;
            }

            if (section.name === "chorus") {
                scheduleTheme(section, themeFull());
                return;
            }

            if (section.name === "solo") {
                scheduleTheme(section, themeExpanded());
                return;
            }

            if (section.name === "outro") {
                scheduleTheme(section, themeOutro());
                return;
            }
        });
    }

    // ============================================================
    // EXPORT ENGINE
    // ============================================================

    return {
        schedule
    };
}
