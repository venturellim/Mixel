// metalLead.js — lead melodica con tema principale

import * as Tone from "https://esm.sh/tone";
import { guitarLead, humanizeTime } from "./common.js";
import { generateLeadTheme } from "./leadTheme.js";

console.log("metalLead.js loaded");

export function createLeadEngine(analysis, params, timeline, riffData, rand, theme) {
const direction = analysis.direction ?? 0.5;

// ------------------------------------------------------------
// DIREZIONE MELODICA DERIVATA DALL'IMMAGINE
// ------------------------------------------------------------

const melodicSlope = (direction - 0.5) * 2;

// range circa:
// -1 = discendente
//  0 = neutra
// +1 = ascendente

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
// HOOK PRINCIPALE DELLA CANZONE
// ------------------------------------------------------------

const hookLength = 4;

const hook = [];

for (let i = 0; i < hookLength; i++) {

    // favorisce tonica e dominante
    const choices = [0,0,4,2,5];

    const idx =
        choices[Math.floor(rand()*choices.length)] % scale.length;

    hook.push(scale[idx]);

}

    // fallback sicurezza
    if (hook.length === 0) hook.push(scale[0]);

    // ------------------------------------------------------------
    // MOTIVI SECONDARI
    // ------------------------------------------------------------

    function generateMotif() {

    const motif = [];
    const len = 2 + Math.floor(rand() * 3);

    let pos =
        Math.floor(rand() * scale.length);

    for (let i = 0; i < len; i++) {

        motif.push(scale[pos]);

        // movimento influenzato dall'immagine
        let stepMove;

        if (melodicSlope > 0.3)
            stepMove = rand() < 0.7 ? 1 : -1;

        else if (melodicSlope < -0.3)
            stepMove = rand() < 0.7 ? -1 : 1;

        else
            stepMove = rand() < 0.5 ? 1 : -1;

        pos =
            (pos + stepMove + scale.length)
            % scale.length;

    }

    return motif;

}

    function generatePhrase() {

    const phrase = [];

    let pos =
        Math.floor(rand() * scale.length);

    for (let i = 0; i < stepsPerMeasure; i++) {

        phrase.push(scale[pos]);

        let move;

        if (melodicSlope > 0.3)
            move = rand() < 0.65 ? 1 : -1;

        else if (melodicSlope < -0.3)
            move = rand() < 0.65 ? -1 : 1;

        else
            move = rand() < 0.5 ? 1 : -1;

        pos =
            (pos + move + scale.length)
            % scale.length;

    }

    return phrase;

}

    let motif = generateMotif();
    let phrase = generatePhrase();
    
    // direzione melodica
let melodicDirection =
    rand() < 0.5 ? 1 : -1;

let melodicIndex =
    Math.floor(rand() * scale.length);
    
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

    if (rand() < 0.7)

        noteName = nextScaleNote();

    else

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

    const hookIdx =
        stepInMeasure % hook.length;

    noteName = hook[hookIdx];

    // variazione melodica leggera
    if (rand() < 0.2) {

        const idx =
            Math.floor(rand() * scale.length);

        noteName = scale[idx];

    }

}

        // INTRO / OUTRO → tema principale
        else {

            const themeIdx =
                step % theme.length;

            const scaleIndex =
                theme[themeIdx] % scale.length;

            noteName = scale[scaleIndex];

        }

        // --------------------------------------------------------
// FALLBACK → usa nota dell'accordo
// --------------------------------------------------------

if (!noteName && chord) {

    noteName =
        chord[
            Math.floor(rand() * chord.length)
        ];

}

// sicurezza finale
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