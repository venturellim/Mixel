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
// PROGRESSIONI METAL
// ------------------------------------------------------------

const progressions = [

    [0,5,6,4], // power metal classico
    [0,6,5,6], // epico
    [0,4,5,0], // heavy classico
    [0,3,4,5], // più oscuro
    [0,6,4,5]  // cinematico

];

const chosenProg =
    progressions[
        Math.floor(rand() * progressions.length)
    ];

const progression =
    chosenProg.map(
        i => scale[i % scale.length] + octave
    );
    
    // ------------------------------------------------------------
    // COSTRUZIONE RIFF
    // ------------------------------------------------------------

    const fullRiff = new Array(totalSteps);
    const chordTimeline = new Array(totalSteps);

    for (let step = 0; step < totalSteps; step++) {

        const { stepInMeasure } = timeline.getStepData(step);

        const measure =
            Math.floor(step / stepsPerMeasure);

        let chordRoot =
    progression[measure % progression.length];

// 25% variazione armonica
if (rand() < 0.25) {

    chordRoot =
        chooseChordRoot(scale, rand) + octave;

}
          

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

            const t1 = humanizeTime(time, rand, 0.004);
const t2 = humanizeTime(time, rand, 0.009);

sound.triggerAttackRelease(n, dur, t1, 0.9 + rand()*0.2);
sound.triggerAttackRelease(n, dur, t2, 0.9 + rand()*0.2);
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