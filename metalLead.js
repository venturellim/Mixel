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

    function clampMidi(m) {
        return Math.max(MIN, Math.min(MAX, m));
    }

    // ------------------------------------------------------------
    // Note target sugli accordi (fondamentale, terza, quinta, settima)
    // ------------------------------------------------------------
    const chordTones = [0, 3, 4, 7, 10];

    // ------------------------------------------------------------
    // Genera una frase melodica con direzione
    // ------------------------------------------------------------
    function generatePhrase(section) {

        const intervals = section === "solo"
            ? [0, 2, 3, 5, 7, 9, 12, 14]
            : [0, 2, 4, 5, 7, 9, 12];

        const phrase = [];

        // Direzione: ascendente, discendente o onda
        const direction = rand();

        for (let i = 0; i < 8; i++) {

            let interval = intervals[Math.floor(rand() * intervals.length)];

            if (direction < 0.33) {
                interval += i; // salita
            } else if (direction < 0.66) {
                interval -= i; // discesa
            } else {
                if (i % 2 === 0) interval += 2;
                else interval -= 2; // onda
            }

            phrase.push(interval);
        }

        return phrase;
    }

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

        // Ritmica variabile
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

        // Note target sugli accordi all'inizio misura
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

        // Durata variabile
        let dur = "8n";
        if (section === "chorus" && stepInMeasure === 0) dur = "4n";
        if (section === "solo" && rand() < 0.3) dur = "16n";
        if (section === "verse" && rand() < 0.2) dur = "4n";

        guitarLead.triggerAttackRelease(note, dur, time);
    };
}
