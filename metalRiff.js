// metalRiff.js — versione sincronizzata con metalTimeline

import * as Tone from "https://esm.sh/tone";
import { guitarPalm, guitarOpen, clampNote, humanizeTime } from "./common.js";

export function generateMetalRiff(
    analysis,
    params,
    timeline,
    rand,
    theme
) {

    const scale = params.scale;
    
    // ------------------------------------------------------------
// NOTE DERIVATE DAL TEMA
// ------------------------------------------------------------

const themeNotes = [];

for (const t of theme) {

    const idx = t % scale.length;
    themeNotes.push(scale[idx]);

}

    const {
        stepsPerMeasure,
        totalSteps,
        sectionTimeline
    } = timeline;

    const MIN = 36; // C2
    const MAX = 52; // E3
    const octave = 2;
    
    function chooseChordRoot(scale, rand) {

    const r = rand();

    if (r < 0.55)
        return scale[0]; // tonica

    if (r < 0.8)
        return scale[4 % scale.length]; // dominante

    if (r < 0.95)
        return scale[5 % scale.length]; // sottodominante

    return scale[Math.floor(rand() * scale.length)];

}

    // ------------------------------------------------------------
    // COSTRUZIONE POWER CHORD
    // ------------------------------------------------------------

    function buildChord(root) {

        const rootMidi = Tone.Frequency(root).toMidi();

        return [
            root,
            Tone.Frequency(rootMidi + 7, "midi").toNote(),
            Tone.Frequency(rootMidi + 12, "midi").toNote()
        ];
    }

    // ------------------------------------------------------------
    // PROGRESSIONE POWER METAL
    // I–VI–VII–V (molto usata nel power)
    // ------------------------------------------------------------

    const progression = [

        scale[0] + octave,
        scale[5 % scale.length] + octave,
        scale[6 % scale.length] + octave,
        scale[4 % scale.length] + octave

    ];

    // ------------------------------------------------------------
    // COSTRUZIONE RIFF
    // ------------------------------------------------------------

    const fullRiff = new Array(totalSteps);
    const chordTimeline = new Array(totalSteps);

    for (let step = 0; step < totalSteps; step++) {

        const { stepInMeasure } = timeline.getStepData(step);

        const measure =
            Math.floor(step / stepsPerMeasure);

        const chordRoot =
          progression[measure % progression.length];
          

        const chord = buildChord(chordRoot);

        chordTimeline[step] = chord;

        // --------------------------------------------------------
        // RIFF LOGIC
        // --------------------------------------------------------

        if (stepInMeasure === 0) {

            // forte su inizio misura
            fullRiff[step] = clampNote(chordRoot, MIN, MAX);

        }

        else if (stepInMeasure % 2 === 0) {

    let note;

    // 40% usa il tema
    if (rand() < 0.4 && themeNotes.length) {

        note =
            themeNotes[
                Math.floor(rand() * themeNotes.length)
            ];

    }

    // altrimenti usa accordo
    else {

        note =
            chord[
                Math.floor(rand() * chord.length)
            ];

    }

    fullRiff[step] = clampNote(note, MIN, MAX);

}

        else {

            fullRiff[step] = null;

        }

    }

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------

    function riffEngine(time, step) {

        const idx = step % totalSteps;

        const note = fullRiff[idx];

        if (!note) return;

        const chord = chordTimeline[idx];

        const { section } = timeline.getStepData(step);
        const energy =
    section === "chorus" ? 1 :
    section === "solo" ? 0.9 :
    section === "verse" ? 0.7 :
    section === "intro" ? 0.5 :
    0.4;
    
    if (rand() > energy) return;

        const sound =
            section === "verse" || section === "chorus"
                ? guitarPalm
                : guitarOpen;

        const dur =
            section === "chorus"
                ? "4n"
                : "8n";

        for (const n of chord) {

            sound.triggerAttackRelease(
    n,
    dur,
    humanizeTime(time, rand)
);
        }

    }

    return {

        engine: riffEngine,

        data: {
            fullRiff,
            chordTimeline,
            sectionTimeline,
            stepsPerMeasure,
            totalSteps
        }

    };

}