//
// themeEngine.js — versione corretta e robusta
// Tema principale: motivo ricorrente, variato per sezione.
//

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote } from "../../utils/harmonyUtils.js";
import { melodicStep } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";

console.log("themeEngine.js loaded");

function toFlat(note) {
    return Tone.Frequency(note).toNote("flat");
}

export function initThemeEngine(instruments, params, scale, rand, structure) {

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
    // 2) Clamping sicuro per note stringa
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

        // fallback se melodicStep fallisce
        if (!next) next = current;

        return clampLead(next);
    }

    // ------------------------------------------------------------
    // 4) Generazione tema principale
    // ------------------------------------------------------------
    function generateTheme() {
        const length = params.themeStyle === "heroic" ? 8 : 6;

        let note = scale.length > 0
            ? clampLead(scale[Math.floor(rand() * scale.length)])
            : "C4";

        const theme = [note];

        for (let i = 1; i < length; i++) {
            const direction = params.themeStyle === "heroic" ? 1 : -1;
            const bigJump = rand() < 0.25;
            const step = bigJump ? direction * 2 : direction;

            note = safeMelodicStep(note, step);
            theme.push(note);
        }

        return theme;
    }

    const theme = generateTheme();

    // ------------------------------------------------------------
    // 5) Varianti del tema
    // ------------------------------------------------------------
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
                const extra = safeMelodicStep(n, step);
                out.push(extra);
            }
        });
        return out;
    }

    function themeOutro() {
        return theme.slice(0, 3);
    }

    // ------------------------------------------------------------
    // 6) Scheduling tema
    // ------------------------------------------------------------
    function scheduleTheme(section, notes) {
        const timeline = buildSectionTimeline(section, "4n");

        if (!timeline || timeline.length === 0) return;

        notes.forEach((note, i) => {
            const t = timeline[i];
            if (!t) return;

            Tone.Transport.schedule(time => {
                guitarLead.triggerAttackRelease(note, "4n", time);
            }, t);
        });
    }

    // ------------------------------------------------------------
    // 7) Scheduling globale
    // ------------------------------------------------------------
    function schedule() {
        if (!structure || !structure.sections) return;

        structure.sections.forEach(section => {
            if (section.name === "intro")  return scheduleTheme(section, themeSimple());
            if (section.name === "verse")  return;
            if (section.name === "chorus") return scheduleTheme(section, themeFull());
            if (section.name === "solo")   return scheduleTheme(section, themeExpanded());
            if (section.name === "outro")  return scheduleTheme(section, themeOutro());

            // fallback sicuro
            scheduleTheme(section, themeSimple());
        });
    }

    return { schedule };
}
