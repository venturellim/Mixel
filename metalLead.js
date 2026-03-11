// metalLead.js — lead melodica, sezionale, coerente con riffData

import * as Tone from "https://esm.sh/tone";
import { guitarLead, clampNote } from "./common.js";

export function createLeadEngine(analysis, params, riffData, rand) {

    const scale = params.scale;
    const lead = params.lead;

    const beatsPerMeasure = riffData.beatsPerMeasure;
    const totalSteps = riffData.totalSteps;

    const MIN = 48; // C3
    const MAX = 84; // C6

    // ------------------------------------------------------------
    // Utility: scegli una nota dalla scala
    // ------------------------------------------------------------
    function pickScaleNote(rootMidi, interval = 0) {
        const note = Tone.Frequency(rootMidi + interval, "midi").toNote();
        return note;
    }

    // ------------------------------------------------------------
    // Genera una frase melodica per sezione
    // ------------------------------------------------------------
    function generatePhrase(section, chord, stepInMeasure) {

        const root = chord[0];
        const rootMidi = Tone.Frequency(root).toMidi();

        // Range melodico
        const baseOct = 3 + Math.floor(lead.range * 2); // C3–C5
        const baseMidi = Tone.Frequency(scale[0] + baseOct).toMidi();

        // Densità
        if (rand() > lead.density) return null;

        // Evita di suonare sopra i vuoti del riff
        if (!riffData.fullRiff[stepInMeasure]) {
            if (rand() < 0.4) return null;
        }

        // Pattern per sezione
        let interval = 0;

        if (section === "intro") {
            interval = (rand() < 0.5) ? 0 : 2;
        }

        if (section === "verse") {
            interval = (rand() < 0.5) ? 2 : 4;
        }

        if (section === "chorus") {
            interval = (rand() < 0.5) ? 4 : 7;
        }

        if (section === "solo") {
            interval = Math.floor(rand() * 12) - 6; // fraseggio libero
        }

        if (section === "outro") {
            interval = (rand() < 0.5) ? 0 : -2;
        }

        // Slope (ascendente/discendente)
        interval += Math.floor(lead.slope * 3);

        const noteMidi = baseMidi + interval;
        const clampedMidi = Math.max(MIN, Math.min(MAX, noteMidi));

        return Tone.Frequency(clampedMidi, "midi").toNote();
    }

    // ------------------------------------------------------------
    // ENGINE ritornato a metal.js
    // ------------------------------------------------------------
    return function leadEngine(time, step) {

        const idx = step % totalSteps;

        const chord = riffData.chordTimeline[idx];
        const section = riffData.sectionTimeline[idx];

        const stepInMeasure = idx % beatsPerMeasure;

        // Non suonare troppo spesso
        if (rand() > lead.density) return;

        const note = generatePhrase(section, chord, stepInMeasure);
        if (!note) return;

        guitarLead.triggerAttackRelease(note, "8n", time);
    };
}
