// themeEngine.js — versione compatibile con la nuova architettura
// Tema principale: motivo ricorrente, variato per sezione.

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote } from "../../utils/harmonyUtils.js";
import { melodicStep } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";

console.log("themeEngine.js ver. 001 loaded");

function toFlat(note) {
    return Tone.Frequency(note).toNote("flat");
}

export function initThemeEngine(instruments, params, rand) {

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
    // Clamping sicuro
    // ------------------------------------------------------------
    function clampLead(note) {
        if (!note) return "C4";
        const midi = noteToMidi(note);
        return safeMidiToNote(midi);
    }

    // ------------------------------------------------------------
    // Step melodico sicuro
    // ------------------------------------------------------------
    function safeMelodicStep(current, step, sectionScale) {
        if (!sectionScale || sectionScale.length === 0) return clampLead(current);

        let next = melodicStep(sectionScale, current, step);

        if (!next) next = current;

        return clampLead(next);
    }

    // ------------------------------------------------------------
    // Generazione tema principale (basato sulla scala della sezione)
    // ------------------------------------------------------------
    function generateTheme(sectionScale) {
        const length = params.themeStyle === "heroic" ? 8 : 6;

        let note = sectionScale.length > 0
            ? clampLead(sectionScale[Math.floor(rand() * sectionScale.length)])
            : "C4";

        const theme = [note];

        for (let i = 1; i < length; i++) {
            const direction = params.themeStyle === "heroic" ? 1 : -1;
            const bigJump = rand() < 0.25;
            const step = bigJump ? direction * 2 : direction;

            note = safeMelodicStep(note, step, sectionScale);
            theme.push(note);
        }

        return theme;
    }

    // ------------------------------------------------------------
    // Varianti del tema
    // ------------------------------------------------------------
    function themeSimple(theme) {
        return theme.slice(0, Math.ceil(theme.length / 2));
    }

    function themeFull(theme) {
        return theme;
    }

    function themeExpanded(theme, sectionScale) {
        const out = [];
        theme.forEach(n => {
            out.push(n);
            if (rand() < 0.4) {
                const step = rand() < 0.5 ? 1 : -1;
                const extra = safeMelodicStep(n, step, sectionScale);
                out.push(extra);
            }
        });
        return out;
    }

    function themeOutro(theme) {
        return theme.slice(0, 3);
    }

    // ------------------------------------------------------------
    // Scheduling tema
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
    // Scheduling di una singola sezione
    // ------------------------------------------------------------
    function scheduleSection(section, sectionScale, root) {

        // Generiamo il tema sulla scala della sezione
        const theme = generateTheme(sectionScale);

        if (section.name === "intro")  return scheduleTheme(section, themeSimple(theme));
        if (section.name === "verse")  return; // niente tema nel verse
        if (section.name === "chorus") return scheduleTheme(section, themeFull(theme));
        if (section.name === "solo")   return scheduleTheme(section, themeExpanded(theme, sectionScale));
        if (section.name === "outro")  return scheduleTheme(section, themeOutro(theme));

        // fallback
        scheduleTheme(section, themeSimple(theme));
    }

    // ------------------------------------------------------------
    // EXPORT
    // ------------------------------------------------------------
    return {
        scheduleSection
    };
}
