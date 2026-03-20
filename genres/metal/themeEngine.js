//
// themeEngine.js
// Generatore del tema principale power metal.
//

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote } from "../../utils/harmonyUtils.js";
import { melodicStep } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("themeEngine.js loaded");

function toFlat(note) {
    return Tone.Frequency(note).toNote("flat");
}

export function initThemeEngine(instruments, params, scale, rand, structure) {

    const { guitarLead } = instruments;

    const MIN_MIDI = noteToMidi("C4");
    const MAX_MIDI = noteToMidi("C6");

    function clampLead(note) {
        const midi = noteToMidi(note);
        if (midi < MIN_MIDI) return toFlat(midiToNote(MIN_MIDI));
        if (midi > MAX_MIDI) return toFlat(midiToNote(MAX_MIDI));
        return toFlat(note);
    }

    function generateTheme() {
        const length = params.themeStyle === "heroic" ? 8 : 6;

        let note = clampLead(scale[Math.floor(rand() * scale.length)]);
        const theme = [note];

        for (let i = 1; i < length; i++) {
            const direction = params.themeStyle === "heroic" ? 1 : -1;
            const step = rand() < 0.2 ? direction * 2 : direction;

            note = melodicStep(scale, note, step);
            note = clampLead(note);

            theme.push(note);
        }

        return theme;
    }

    const theme = generateTheme();

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
    // Scheduling corretto
    // --------------------------------------------------------

    function scheduleTheme(section, notes) {
        const timeline = buildSectionTimeline(section, "4n");

        notes.forEach((note, i) => {
            const t = timeline[i];
            if (!t) return;

            Tone.Transport.schedule((time) => {
                guitarLead.triggerAttackRelease(note, "4n", time);
            }, t);
        });
    }

    function schedule() {

        structure.sections.forEach(section => {

            if (section.name === "intro") {
                scheduleTheme(section, themeSimple());
                return;
            }

            if (section.name === "verse") {
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

    return {
        schedule
    };
}
