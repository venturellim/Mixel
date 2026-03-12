// metalLead.js — lead melodica avanzata, motivi, frasi, assolo vero, range C4–C6

import * as Tone from "https://esm.sh/tone";
import { guitarLead } from "./common.js";

export function createLeadEngine(analysis, params, riffData, rand) {

    const beatsPerMeasure = riffData.beatsPerMeasure;
    const totalSteps = riffData.totalSteps;

    // Range dei tuoi sample
    const MIN = 60; // C4
    const MAX = 84; // C6

    function clampMidi(m) {
        return Math.max(MIN, Math.min(MAX, m));
    }

console.log("LEAD SAMPLER", guitarLead);


    // ------------------------------------------------------------
    // Note target sugli accordi (fondamentale, terza, quinta, settima)
    // ------------------------------------------------------------
    const chordTones = [0, 3, 4, 7, 10];

    // ------------------------------------------------------------
    // Genera un motivo melodico (2–4 note)
    // ------------------------------------------------------------
    function generateMotif() {
        const motif = [];
        const len = 2 + Math.floor(rand() * 3); // 2–4 note
        const intervals = [0, 2, 3, 4, 5, 7, 9, 12];

        for (let i = 0; i < len; i++) {
            motif.push(intervals[Math.floor(rand() * intervals.length)]);
        }
        return motif;
    }

    // ------------------------------------------------------------
    // Genera una frase di 8 step con direzione
    // ------------------------------------------------------------
    function generatePhrase() {
        const phrase = [];
        const intervals = [0, 2, 3, 5, 7, 9, 12, 14];
        const direction = rand();

        for (let i = 0; i < 8; i++) {
            let interval = intervals[Math.floor(rand() * intervals.length)];

            if (direction < 0.33) interval += i;       // salita
            else if (direction < 0.66) interval -= i;  // discesa
            else interval += (i % 2 === 0 ? 2 : -2);   // onda

            phrase.push(interval);
        }
        return phrase;
    }

    let motif = generateMotif();
    let phrase = generatePhrase();

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------
    return function leadEngine(time, step) {

        const idx = step % totalSteps;

        const chord = riffData.chordTimeline[idx];
        const section = riffData.sectionTimeline[idx];
        const stepInMeasure = idx % beatsPerMeasure;

        // Base melodica: C4–C5
        const baseMidi = Tone.Frequency("C" + (4 + Math.floor(params.lead.range * 1.0))).toMidi();

        // --------------------------------------------------------
        // Densità per sezione
        // --------------------------------------------------------
        let density =
            section === "intro"  ? 0.4 :
            section === "verse"  ? 0.7 :
            section === "chorus" ? 0.9 :
            section === "solo"   ? 1.0 :
            section === "outro"  ? 0.5 : 0.7;

        if (rand() > density) return;

        // --------------------------------------------------------
        // Ritmica per sezione
        // --------------------------------------------------------
        const allow =
            (section === "chorus" && stepInMeasure % 1 === 0) ||
            (section === "verse"  && stepInMeasure % 2 === 0) ||
            (section === "solo") ||
            (section === "intro" && stepInMeasure % 2 === 0) ||
            (section === "outro" && stepInMeasure % 2 === 0);

        if (!allow) return;

        // --------------------------------------------------------
        // Cambia motivo e frase ogni misura
        // --------------------------------------------------------
        if (stepInMeasure === 0) {
            motif = generateMotif();
            phrase = generatePhrase();
        }

        let noteMidi;

        // --------------------------------------------------------
        // Note target sugli accordi all'inizio misura
        // --------------------------------------------------------
        if (stepInMeasure === 0 && section !== "solo") {
            const interval = chordTones[Math.floor(rand() * chordTones.length)];
            noteMidi = baseMidi + interval;
        }

        // --------------------------------------------------------
        // SOLO: scale, arpeggi, gruppi di 4
        // --------------------------------------------------------
        else if (section === "solo") {

            // 50% scale veloci
            if (rand() < 0.5) {
                noteMidi = baseMidi + (stepInMeasure * 2);
            }

            // 30% arpeggi
            else if (rand() < 0.8) {
                const arp = [0, 4, 7, 12];
                noteMidi = baseMidi + arp[stepInMeasure % 4];
            }

            // 20% frase
            else {
                noteMidi = baseMidi + phrase[stepInMeasure % phrase.length];
            }
        }

        // --------------------------------------------------------
        // Altre sezioni: motivo + frase
        // --------------------------------------------------------
        else {
            const motifInterval = motif[stepInMeasure % motif.length];
            const phraseInterval = phrase[stepInMeasure % phrase.length];
            const slopeShift = Math.floor(params.lead.slope * 4) - 2;

            noteMidi = baseMidi + motifInterval + phraseInterval + slopeShift;
        }

        const clamped = clampMidi(noteMidi);
        const note = Tone.Frequency(clamped, "midi").toNote();

        // --------------------------------------------------------
        // Durata variabile
        // --------------------------------------------------------
        // --------------------------------------------------------
// Durata variabile con molto più sustain
// --------------------------------------------------------
let dur;

if (section === "chorus") {
    if (stepInMeasure === 0 && rand() < 0.7) dur = "2n";   // nota lunga
    else if (rand() < 0.4) dur = "4n";
    else dur = "8n";
}

else if (section === "verse") {
    if (rand() < 0.25) dur = "4n";
    else dur = "8n";
}

else if (section === "solo") {
    if (rand() < 0.2) dur = "4n";   // risoluzioni
    else if (rand() < 0.5) dur = "16n"; // gruppi veloci
    else dur = "8n";
}

else if (section === "intro" || section === "outro") {
    if (stepInMeasure === 0) dur = "2n";
    else dur = "4n";
}

else {
    dur = "8n";
}

guitarLead.triggerAttackRelease(note, dur, time);

    };
}
