// metalLead.js — lead melodica, range corretto C4–C6

import * as Tone from "https://esm.sh/tone";
import { guitarLead } from "./common.js";

export function createLeadEngine(analysis, params, riffData, rand) {

    const scale = params.scale;
    const lead = params.lead;

    const beatsPerMeasure = riffData.beatsPerMeasure;
    const totalSteps = riffData.totalSteps;

    // Range corretto per i tuoi sample
    const MIN = 60; // C4
    const MAX = 84; // C6

    // ------------------------------------------------------------
    // Utility: clamp MIDI
    // ------------------------------------------------------------
    function clampMidi(m) {
        return Math.max(MIN, Math.min(MAX, m));
    }

    // ------------------------------------------------------------
    // Scegli una nota melodica coerente con l’accordo
    // ------------------------------------------------------------
    function pickMelodicNote(chord, section) {

        const root = chord[0];
        const rootMidi = Tone.Frequency(root).toMidi();

        // Base melodica: C5–C6
        const baseOct = 5 + Math.floor(lead.range * 1.2); // 5 → C5, 6 → C6
        const baseMidi = Tone.Frequency(scale[0] + baseOct).toMidi();

        // Intervalli melodici più ampi
        const intervals = section === "solo"
            ? [0, 2, 3, 5, 7, 9, 12, 14]   // più libertà
            : [0, 2, 4, 5, 7, 9];          // melodico classico

        const interval = intervals[Math.floor(rand() * intervals.length)];

        // Slope (ascendente/discendente)
        const slopeShift = Math.floor(lead.slope * 4) - 2;

        const noteMidi = baseMidi + interval + slopeShift;

        const clamped = clampMidi(noteMidi);
        return Tone.Frequency(clamped, "midi").toNote();
    }

    // ------------------------------------------------------------
    // Densità per sezione
    // ------------------------------------------------------------
    function getLeadDensity(section) {
        if (section === "intro")  return 0.5 + lead.density * 0.3;
        if (section === "verse")  return 0.7 + lead.density * 0.3;
        if (section === "chorus") return 0.85 + lead.density * 0.3;
        if (section === "solo")   return 0.95;
        if (section === "outro")  return 0.6;
        return 0.7;
    }

    // ------------------------------------------------------------
    // Ritmica per sezione
    // ------------------------------------------------------------
    function getLeadRhythm(section, stepInMeasure) {
        if (section === "chorus") return stepInMeasure % 1 === 0; // ogni 8n
        if (section === "verse")  return stepInMeasure % 2 === 0; // ogni 4n
        if (section === "solo")   return true;                    // libero
        if (section === "intro")  return stepInMeasure % 2 === 0;
        if (section === "outro")  return stepInMeasure % 2 === 0;
        return false;
    }

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------
    return function leadEngine(time, step) {

        const idx = step % totalSteps;

        const chord = riffData.chordTimeline[idx];
        const section = riffData.sectionTimeline[idx];

        const stepInMeasure = idx % beatsPerMeasure;

        // Densità
        const density = getLeadDensity(section);
        if (rand() > density) return;

        // Ritmica
        if (!getLeadRhythm(section, stepInMeasure)) return;

        // Evita di coprire i power chord forti
        if (stepInMeasure === 0 && section !== "solo") {
            if (rand() < 0.6) return;
        }

        // Nota melodica
        const note = pickMelodicNote(chord, section);
        if (!note) return;

        guitarLead.triggerAttackRelease(note, "8n", time);
    };
}
