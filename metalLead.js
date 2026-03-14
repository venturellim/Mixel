// metalLead.js — lead melodica con tema principale

import * as Tone from "https://esm.sh/tone";
import { guitarLead, humanizeTime } from "./common.js";
import { generateLeadTheme } from "./leadTheme.js";

export function createLeadEngine(analysis, params, timeline, riffData, rand) {

    const { stepsPerMeasure, totalSteps } = timeline;
    const scale = params.scale;

    const MIN = 60; // C4
    const MAX = 84; // C6

    function clampMidi(m) {
        return Math.max(MIN, Math.min(MAX, m));
    }

    // ------------------------------------------------------------
    // NOTE DERIVATE DAL RIFF
    // ------------------------------------------------------------

    function extractRiffNotes() {

        const notes = [];

        for (const n of riffData.fullRiff) {

            if (!n) continue;

            const pitch = n.replace(/[0-9]/g, "");

            if (!notes.includes(pitch)) {
                notes.push(pitch);
            }

        }

        return notes;

    }

    const riffNotes = extractRiffNotes();

    // ------------------------------------------------------------
    // TEMA PRINCIPALE
    // ------------------------------------------------------------

    const theme = generateLeadTheme(params, rand);

    // ------------------------------------------------------------
    // HOOK MELODICO
    // ------------------------------------------------------------

    const hook = [];

    const hookLength = 3 + Math.floor(rand() * 3);

    for (let i = 0; i < hookLength; i++) {

        const idx = Math.floor(rand() * scale.length);

        if (scale[idx]) {
            hook.push(scale[idx]);
        }

    }

    // fallback sicurezza
    if (hook.length === 0) hook.push(scale[0]);

    // ------------------------------------------------------------
    // MOTIVI SECONDARI
    // ------------------------------------------------------------

    function generateMotif() {

        const motif = [];
        const len = 2 + Math.floor(rand() * 3);

        for (let i = 0; i < len; i++) {

            const idx = Math.floor(rand() * scale.length);

            if (scale[idx]) motif.push(scale[idx]);

        }

        return motif.length ? motif : [scale[0]];

    }

    function generatePhrase() {

        const phrase = [];

        for (let i = 0; i < stepsPerMeasure; i++) {

            const idx = Math.floor(rand() * scale.length);

            if (scale[idx]) phrase.push(scale[idx]);

        }

        return phrase.length ? phrase : [scale[0]];

    }

    let motif = generateMotif();
    let phrase = generatePhrase();

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------

    return function leadEngine(time, step) {

        const idx = step % totalSteps;

        const { stepInMeasure, section } =
            timeline.getStepData(step);

        const chord = riffData.chordTimeline[idx];
        const nextChord =
            riffData.chordTimeline[(idx + 1) % totalSteps];

        if (!chord) return;

        // --------------------------------------------------------
        // NUOVA VARIAZIONE OGNI MISURA
        // --------------------------------------------------------

        if (stepInMeasure === 0) {

            motif = generateMotif();
            phrase = generatePhrase();

        }

        // --------------------------------------------------------
        // DENSITÀ MUSICALE
        // --------------------------------------------------------

        const density =
            section === "intro"  ? 0.5 :
            section === "verse"  ? 0.6 :
            section === "chorus" ? 0.9 :
            section === "solo"   ? 1.0 :
            section === "outro"  ? 0.4 : 0.6;

        if (rand() > density) return;

        // --------------------------------------------------------
        // SELEZIONE NOTA
        // --------------------------------------------------------

        let noteName = null;

        // forte su inizio misura
        if (stepInMeasure === 0) {

            const chordChoice = [0,1,2,1];

            noteName =
                chord[
                    chordChoice[
                        Math.floor(rand() * chordChoice.length)
                    ]
                ];

        }

        // anticipazione accordo successivo
        else if (
            stepInMeasure === stepsPerMeasure - 1 &&
            nextChord &&
            rand() < 0.6
        ) {

            noteName = nextChord[0];

        }

        // SOLO → frase improvvisata
        else if (section === "solo") {

            noteName =
                phrase[
                    stepInMeasure % phrase.length
                ];

        }

        // VERSE → motivo
        else if (section === "verse") {

            noteName =
                motif[
                    stepInMeasure % motif.length
                ];

        }

        // CHORUS → hook
        else if (section === "chorus") {

            noteName =
                hook[
                    stepInMeasure % hook.length
                ];

        }

        // INTRO / OUTRO → tema principale
        else {

            const themeIdx =
                step % theme.length;

            const scaleIndex =
                theme[themeIdx] % scale.length;

            noteName = scale[scaleIndex];

        }

        // sicurezza anti-bug
        if (!noteName) return;

        // --------------------------------------------------------
        // CONVERSIONE MIDI
        // --------------------------------------------------------

        let midi;

        if (/[0-9]/.test(noteName)) {

            midi = Tone.Frequency(noteName).toMidi();

        } else {

            midi = Tone.Frequency(noteName + "4").toMidi();

        }

        midi = clampMidi(midi);

        const note =
            Tone.Frequency(midi, "midi").toNote();

        // --------------------------------------------------------
        // DURATA
        // --------------------------------------------------------

        let dur;

        if (section === "solo")
            dur = rand() < 0.5 ? "16n" : "8n";

        else if (section === "chorus")
            dur = rand() < 0.6 ? "4n" : "8n";

        else if (section === "intro")
            dur = "4n";

        else if (section === "outro")
            dur = "2n";

        else
            dur = "8n";

        // --------------------------------------------------------
        // PLAY
        // --------------------------------------------------------

        guitarLead.triggerAttackRelease(
    note,
    dur,
    humanizeTime(time, rand, 0.012)
);
    };

}