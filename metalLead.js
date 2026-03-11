// metalLead.js — lead melodica, sezionale, coerente con riffData

import * as Tone from "https://esm.sh/tone";
import { guitarLead, clampNote } from "./common.js";

export function createLeadEngine(analysis, params, riffData, rand) {

    const scale = params.scale;
    const lead = params.lead;

    const beatsPerMeasure = riffData.beatsPerMeasure;
    const totalSteps = riffData.totalSteps;

    const MIN = 60;  // C4 (lead deve stare più in alto)
    const MAX = 88;  // E6

    // ------------------------------------------------------------
    // Utility: scegli una nota della scala vicina all’accordo
    // ------------------------------------------------------------
    function pickMelodicNote(chord, section) {

        const root = chord[0];
        const rootMidi = Tone.Frequency(root).toMidi();

        // Range melodico base
        const baseOct = 4 + Math.floor(lead.range * 2); // C4–C6
        const baseMidi = Tone.Frequency(scale[0] + baseOct).toMidi();

        // Intervalli tipici metal
        const intervals = section === "solo"
            ? [0, 2, 3, 5, 7, 9, 12]  // più libertà
            : [0, 2, 4, 5, 7];        // melodico

        const interval = intervals[Math.floor(rand() * intervals.length)];

        // Slope (ascendente/discendente)
        const slopeShift = Math.floor(lead.slope * 4) - 2;

        const noteMidi = baseMidi + interval + slopeShift;

        const clampedMidi = Math.max(MIN, Math.min(MAX, noteMidi));
        return Tone.Frequency(clampedMidi, "midi").toNote();
    }

    // ------------------------------------------------------------
    // Pattern per sezione
    // ------------------------------------------------------------
    function getLeadDensity(section) {
        if (section === "intro")  return 0.4 + lead.density * 0.3;
        if (section === "verse")  return 0.6 + lead.density * 0.3;
        if (section === "chorus") return 0.8 + lead.density * 0.3;
        if (section === "solo")   return 0.9;
        if (section === "outro")  return 0.5;
        return 0.6;
    }

    function getLeadRhythm(section, stepInMeasure) {
        if (section === "chorus") return stepInMeasure % 1 === 0; // ogni 8n
        if (section === "verse")  return stepInMeasure % 2 === 0; // ogni 4n
        if (section === "solo")   return true;                    // libero
        if (section === "intro")  return stepInMeasure % 2 === 0;
        if (section === "outro")  return stepInMeasure % 2 === 0;
        return false;
    }

    // ------------------------------------------------------------
    // ENGINE ritornato a metal.js
    // ------------------------------------------------------------
    return function leadEngine(time, step) {

        const idx = step % totalSteps;

        const chord = riffData.chordTimeline[idx];
        const section = riffData.sectionTimeline[idx];

        const stepInMeasure = idx % beatsPerMeasure;

        // Densità per sezione
        const density = getLeadDensity(section);
        if (rand() > density) return;

        // Ritmica per sezione
        if (!getLeadRhythm(section, stepInMeasure)) return;

        // Evita di suonare sopra i power chord forti
        if (stepInMeasure === 0 && section !== "solo") {
            if (rand() < 0.7) return;
        }

        // Genera nota melodica
        const note = pickMelodicNote(chord, section);
        if (!note) return;

        guitarLead.triggerAttackRelease(note, "8n", time);
    };
}
