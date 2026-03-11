// metalLead.js — lead melodica, frasi vere, range C4–C6

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
    // Note target sugli accordi (fondamentale, terza, quinta)
    // ------------------------------------------------------------
    const chordTones = [0, 4, 7];

    // ------------------------------------------------------------
    // Genera una frase melodica di 4 step
    // ------------------------------------------------------------
    function generatePhrase(section) {

        // Intervalli possibili
        const intervals = section === "solo"
            ? [0, 2, 3, 5, 7, 9, 12, 14]
            : [0, 2, 4, 5, 7, 9, 12];

        // Frase di 4 note
        const phrase = [];

        for (let i = 0; i < 4; i++) {
            const interval = intervals[Math.floor(rand() * intervals.length)];
            phrase.push(interval);
        }

        return phrase;
    }

    // Frase corrente
    let currentPhrase = generatePhrase("verse");

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------
    return function leadEngine(time, step) {

        const idx = step % totalSteps;

        const chord = riffData.chordTimeline[idx];
        const section = riffData.sectionTimeline[idx];

        const stepInMeasure = idx % beatsPerMeasure;

        // Densità per sezione
        let density = 0.7;
        if (section === "intro") density = 0.5;
        if (section === "verse") density = 0.75;
        if (section === "chorus") density = 0.9;
        if (section === "solo") density = 0.95;
        if (section === "outro") density = 0.6;

        if (rand() > density) return;

        // Ritmica per sezione
        const allow =
            (section === "chorus" && stepInMeasure % 1 === 0) ||
            (section === "verse"  && stepInMeasure % 2 === 0) ||
            (section === "solo") ||
            (section === "intro" && stepInMeasure % 2 === 0) ||
            (section === "outro" && stepInMeasure % 2 === 0);

        if (!allow) return;

        // Cambia frase ogni misura
        if (stepInMeasure === 0) {
            currentPhrase = generatePhrase(section);
        }

        // Base melodica: C4–C5
        const baseOct = 4 + Math.floor(lead.range * 1.0);
        const baseMidi = Tone.Frequency(scale[0] + baseOct).toMidi();

        let noteMidi;

        // Nota target sugli accordi all'inizio misura (tranne solo)
        if (stepInMeasure === 0 && section !== "solo") {
            const interval = chordTones[Math.floor(rand() * chordTones.length)];
            noteMidi = baseMidi + interval;
        } else {
            // Nota dalla frase
            const phraseInterval = currentPhrase[stepInMeasure % currentPhrase.length];

            // Slope (ascendente/discendente)
            const slopeShift = Math.floor(lead.slope * 4) - 2;

            noteMidi = baseMidi + phraseInterval + slopeShift;
        }

        const clamped = clampMidi(noteMidi);
        const note = Tone.Frequency(clamped, "midi").toNote();

        guitarLead.triggerAttackRelease(note, "8n", time);
    };
}
