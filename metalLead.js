// metalLead.js — lead melodica con motivi A A B A’, frasi vere e sustain dinamico

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

    // ------------------------------------------------------------
    // NOTE TARGET SUGLI ACCORDI
    // ------------------------------------------------------------
    const chordTones = [0, 3, 4, 7, 10];

    // ------------------------------------------------------------
    // MOTIVO A (2–4 note)
    // ------------------------------------------------------------
    function generateMotif() {
        const motif = [];
        const len = 2 + Math.floor(rand() * 3);
        const intervals = [0, 2, 3, 5, 7, 9, 12];

        for (let i = 0; i < len; i++) {
            motif.push(intervals[Math.floor(rand() * intervals.length)]);
        }
        return motif;
    }

    // ------------------------------------------------------------
    // VARIAZIONE A’ (stesso motivo, ma con shift)
    // ------------------------------------------------------------
    function varyMotif(motif) {
        const shift = [-2, -1, 1, 2][Math.floor(rand() * 4)];
        return motif.map(n => n + shift);
    }

    // ------------------------------------------------------------
    // FRASE B (frase contrastante)
    // ------------------------------------------------------------
    function generatePhraseB() {
        const phrase = [];
        const intervals = [0, 2, 3, 5, 7, 9, 12, 14];
        for (let i = 0; i < 8; i++) {
            phrase.push(intervals[Math.floor(rand() * intervals.length)]);
        }
        return phrase;
    }

    // Stato motivico
    let motifA = generateMotif();
    let motifAprime = varyMotif(motifA);
    let phraseB = generatePhraseB();

    // Indice frase 4-misure
    let phraseMeasure = 0;

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------
    return function leadEngine(time, step) {

        const idx = step % totalSteps;

        const chord = riffData.chordTimeline[idx];
        const section = riffData.sectionTimeline[idx];
        const stepInMeasure = idx % beatsPerMeasure;

        // Base melodica
        const baseMidi = Tone.Frequency("C" + (4 + Math.floor(params.lead.range * 1.0))).toMidi();

        // --------------------------------------------------------
        // DENSITÀ PER SEZIONE
        // --------------------------------------------------------
        let density =
            section === "intro"  ? 0.4 :
            section === "verse"  ? 0.7 :
            section === "chorus" ? 0.9 :
            section === "solo"   ? 1.0 :
            section === "outro"  ? 0.5 : 0.7;

        if (rand() > density) return;

        // --------------------------------------------------------
        // RITMICA PER SEZIONE
        // --------------------------------------------------------
        const allow =
            (section === "chorus" && stepInMeasure % 1 === 0) ||
            (section === "verse"  && stepInMeasure % 2 === 0) ||
            (section === "solo") ||
            (section === "intro" && stepInMeasure % 2 === 0) ||
            (section === "outro" && stepInMeasure % 2 === 0);

        if (!allow) return;

        // --------------------------------------------------------
        // CAMBIO MOTIVO OGNI 4 MISURE
        // --------------------------------------------------------
        if (stepInMeasure === 0) {
            phraseMeasure = (phraseMeasure + 1) % 4;

            if (phraseMeasure === 0) {
                motifA = generateMotif();
                motifAprime = varyMotif(motifA);
                phraseB = generatePhraseB();
            }
        }

        let noteMidi;

        // --------------------------------------------------------
        // SOLO: scale, arpeggi, gruppi veloci
        // --------------------------------------------------------
        if (section === "solo") {

            if (rand() < 0.5) {
                noteMidi = baseMidi + (stepInMeasure * 2);
            }
            else if (rand() < 0.8) {
                const arp = [0, 4, 7, 12];
                noteMidi = baseMidi + arp[stepInMeasure % 4];
            }
            else {
                noteMidi = baseMidi + phraseB[stepInMeasure % phraseB.length];
            }
        }

        // --------------------------------------------------------
        // A A B A’ (4 misure)
        // --------------------------------------------------------
        else {

            if (phraseMeasure === 0) {
                // A
                const interval = motifA[stepInMeasure % motifA.length];
                noteMidi = baseMidi + interval;
            }
            else if (phraseMeasure === 1) {
                // A (ripetizione)
                const interval = motifA[stepInMeasure % motifA.length];
                noteMidi = baseMidi + interval;
            }
            else if (phraseMeasure === 2) {
                // B (contrasto)
                const interval = phraseB[stepInMeasure % phraseB.length];
                noteMidi = baseMidi + interval;
            }
            else if (phraseMeasure === 3) {
                // A’ (variazione)
                const interval = motifAprime[stepInMeasure % motifAprime.length];
                noteMidi = baseMidi + interval;
            }
        }

        // --------------------------------------------------------
        // RISOLUZIONE SUGLI ACCORDI (inizio misura)
        // --------------------------------------------------------
        if (stepInMeasure === 0 && section !== "solo") {
            const interval = chordTones[Math.floor(rand() * chordTones.length)];
            noteMidi = baseMidi + interval;
        }

        const clamped = clampMidi(noteMidi);
        const note = Tone.Frequency(clamped, "midi").toNote();

        // --------------------------------------------------------
        // DURATA DINAMICA (sustain vero)
        // --------------------------------------------------------
        let dur;

        if (section === "chorus") {
            if (stepInMeasure === 0 && rand() < 0.7) dur = "2n";
            else if (rand() < 0.4) dur = "4n";
            else dur = "8n";
        }

        else if (section === "verse") {
            if (rand() < 0.25) dur = "4n";
            else dur = "8n";
        }

        else if (section === "solo") {
            if (rand() < 0.2) dur = "4n";
            else if (rand() < 0.5) dur = "16n";
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
