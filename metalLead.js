// metalLead.js — lead melodica con hook DNA-driven

import * as Tone from "https://esm.sh/tone";
import { guitarLead, humanizeTime } from "./common.js";

console.log("metalLead.js loaded");

export function createLeadEngine(analysis, params, timeline, riffData, rand, theme) {

    const direction = analysis.direction ?? 0.5;

    // ------------------------------------------------------------
    // DIREZIONE MELODICA
    // ------------------------------------------------------------

    const melodicSlope = (direction - 0.5) * 2;

    const { stepsPerMeasure, totalSteps } = timeline;
    const scale = params.scale;

    const MIN = 60; // C4
    const MAX = 84; // C6

    function clampMidi(m) {
        return Math.max(MIN, Math.min(MAX, m));
    }

    // ------------------------------------------------------------
    // HOOK DNA (NUOVO)
    // ------------------------------------------------------------

    function generateHook(scale, dna, stepsPerMeasure, octave) {

        const hook = [];

        for (let i = 0; i < stepsPerMeasure; i++) {

            const bit = (dna >> i) & 1;

            if (bit === 1) {

                const noteIndex =
                    (dna >> (i + 3)) % scale.length;

                hook.push(
                    scale[noteIndex] + octave
                );

            } else {

                hook.push(null);

            }
        }

        return hook;
    }

    const hookPattern =
        generateHook(
            scale,
            analysis.dna || 123456,
            stepsPerMeasure,
            4
        );

    // ------------------------------------------------------------
    // MOTIVI
    // ------------------------------------------------------------

    function generateMotif() {

        const motif = [];
        const len = 2 + Math.floor(rand() * 3);

        let pos = Math.floor(rand() * scale.length);

        for (let i = 0; i < len; i++) {

            motif.push(scale[pos]);

            let stepMove;

            if (melodicSlope > 0.3)
                stepMove = rand() < 0.7 ? 1 : -1;
            else if (melodicSlope < -0.3)
                stepMove = rand() < 0.7 ? -1 : 1;
            else
                stepMove = rand() < 0.5 ? 1 : -1;

            pos = (pos + stepMove + scale.length) % scale.length;
        }

        return motif;
    }

    function generatePhrase() {

        const phrase = [];

        let pos = Math.floor(rand() * scale.length);

        for (let i = 0; i < stepsPerMeasure; i++) {

            phrase.push(scale[pos]);

            let move;

            if (melodicSlope > 0.3)
                move = rand() < 0.65 ? 1 : -1;
            else if (melodicSlope < -0.3)
                move = rand() < 0.65 ? -1 : 1;
            else
                move = rand() < 0.5 ? 1 : -1;

            pos = (pos + move + scale.length) % scale.length;
        }

        return phrase;
    }

    let motif = generateMotif();
    let phrase = generatePhrase();

    // ------------------------------------------------------------
    // MOVIMENTO MELODICO CONTINUO
    // ------------------------------------------------------------

    let melodicDirection = rand() < 0.5 ? 1 : -1;
    let melodicIndex = Math.floor(rand() * scale.length);

    function nextScaleNote() {

        melodicIndex += melodicDirection;

        if (melodicIndex >= scale.length) {
            melodicIndex = scale.length - 1;
            melodicDirection = -1;
        }

        if (melodicIndex < 0) {
            melodicIndex = 0;
            melodicDirection = 1;
        }

        return scale[melodicIndex];
    }

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
        // VARIAZIONE OGNI MISURA
        // --------------------------------------------------------

        if (stepInMeasure === 0) {
            motif = generateMotif();
            phrase = generatePhrase();
        }

        // --------------------------------------------------------
        // DENSITÀ
        // --------------------------------------------------------

        const density =
            section === "intro"  ? 0.5 :
            section === "verse"  ? 0.6 :
            section === "chorus" ? 0.95 :
            section === "solo"   ? 1.0 :
            section === "outro"  ? 0.4 : 0.6;

        if (rand() > density) return;

        // --------------------------------------------------------
        // SCELTA NOTA
        // --------------------------------------------------------

        let noteName = null;

        // accento forte
        if (stepInMeasure === 0) {

            const chordChoice = [0,1,2,1];

            noteName =
                chord[
                    chordChoice[
                        Math.floor(rand() * chordChoice.length)
                    ]
                ];
        }

        // anticipazione
        else if (
            stepInMeasure === stepsPerMeasure - 1 &&
            nextChord &&
            rand() < 0.6
        ) {
            noteName = nextChord[0];
        }

        // SOLO
        else if (section === "solo") {

            if (rand() < 0.7)
                noteName = nextScaleNote();
            else
                noteName =
                    phrase[
                        stepInMeasure % phrase.length
                    ];
        }

        // VERSE
        else if (section === "verse") {

            noteName =
                motif[
                    stepInMeasure % motif.length
                ];
        }

        // CHORUS → HOOK DNA
        else if (section === "chorus") {

            const hookNote =
                hookPattern[stepInMeasure];

            if (hookNote) {

                noteName = Tone.Frequency(
                    hookNote,
                    "midi"
                ).toNote();

            }

            // variazione leggera
            if (rand() < 0.15) {

                const idx =
                    Math.floor(rand() * scale.length);

                noteName = scale[idx];
            }
        }

        // INTRO / OUTRO
        else {

            const themeIdx =
                step % theme.length;

            const scaleIndex =
                theme[themeIdx] % scale.length;

            noteName = scale[scaleIndex];
        }

        // --------------------------------------------------------
        // FALLBACK
        // --------------------------------------------------------

        if (!noteName && chord) {

            noteName =
                chord[
                    Math.floor(rand() * chord.length)
                ];
        }

        if (!noteName) return;

        // --------------------------------------------------------
        // MIDI
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
            dur = "8n";
        else if (section === "intro")
            dur = "4n";
        else if (section === "outro")
            dur = "2n";
        else
            dur = "8n";

        // --------------------------------------------------------
        // VELOCITY (ACCENTI)
        // --------------------------------------------------------

        const isAccent =
            section === "chorus"
                ? !!hookPattern[stepInMeasure]
                : stepInMeasure === 0;

        const velocity =
            isAccent
                ? 1.0
                : 0.7 + rand() * 0.25;

        // --------------------------------------------------------
        // PLAY
        // --------------------------------------------------------

        guitarLead.triggerAttackRelease(
            note,
            dur,
            humanizeTime(time, rand, 0.012),
            velocity
        );
    };
}