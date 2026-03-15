// metalRiff.js — riff engine migliorato

import * as Tone from "https://esm.sh/tone";
import { guitarPalm, guitarOpen, clampNote, humanizeTime } from "./common.js";

const powerMetalProgressions = [

    [0,4,5,3],   // I V vi IV
    [0,5,3,4],   // I vi IV V
    [0,3,4,3],   // I IV V IV
    [0,4,3,5],   // I V IV vi
    [0,3,5,4]    // I IV vi V

];

export function generateMetalRiff(analysis, params, timeline, rand) {

    const scale = params.scale;

    const {
        stepsPerMeasure,
        totalSteps,
        sectionTimeline
    } = timeline;

    const MIN = 36; // C2
    const MAX = 52; // E3
    const octave = 2;
    const progression =
    powerMetalProgressions[
        Math.floor(rand() * powerMetalProgressions.length)
    ];

    // ------------------------------------------------------------
    // SCELTA TONICA ACCORDO
    // ------------------------------------------------------------

    function chooseChordRoot(scale, rand) {

        const r = rand();

        if (r < 0.55)
            return scale[0];

        if (r < 0.8)
            return scale[4 % scale.length];

        if (r < 0.95)
            return scale[5 % scale.length];

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
    // PEDAL PATTERN
    // ------------------------------------------------------------

    function generatePedalPattern(bpm) {

        if (bpm < 100)
            return [0,4,8,12];

        if (bpm < 130)
            return [0,3,6,8,12];

        return [0,2,4,6,8,10,12];

    }

    const pedalPattern =
        generatePedalPattern(params.bpm);

// ------------------------------------------------------------
// RIFF BASE (2 MISURE)
// ------------------------------------------------------------

const riffMeasures = 2;

const riffLength =
    riffMeasures * stepsPerMeasure;

const baseRiff =
    new Array(riffLength);

    // ------------------------------------------------------------
    // COSTRUZIONE RIFF
    // ------------------------------------------------------------

    const fullRiff = new Array(totalSteps);
    const chordTimeline = new Array(totalSteps);

    // ------------------------------------------------------------
// COSTRUZIONE RIFF BASE
// ------------------------------------------------------------

let chordRoot =
    chooseChordRoot(scale, rand) + octave;

let chord =
    buildChord(chordRoot);

for (let step = 0; step < riffLength; step++) {

    const stepInMeasure =
        step % stepsPerMeasure;

    if (stepInMeasure === 0) {

    const measure =
        Math.floor(step / stepsPerMeasure);

    const degree =
        progression[
            measure % progression.length
        ];

    chordRoot =
        scale[degree] + octave;

    chord =
        buildChord(chordRoot);

}

    if (pedalPattern.includes(stepInMeasure)) {

        baseRiff[step] =
            clampNote(chordRoot, MIN, MAX);

    }

    else if (stepInMeasure === stepsPerMeasure - 1) {

        const chordTone =
            chord[Math.floor(rand()*chord.length)];

        baseRiff[step] =
            clampNote(chordTone, MIN, MAX);

    }

    else {

        baseRiff[step] = null;

    }

}

// ------------------------------------------------------------
// RIFF COMPLETO (ripetizione con variazioni)
// ------------------------------------------------------------

for (let step = 0; step < totalSteps; step++) {

    const baseStep =
        step % riffLength;

    let note =
        baseRiff[baseStep];

    // piccola variazione
    if (note && rand() < 0.1) {

        const idx =
            Math.floor(rand()*scale.length);

        note =
            clampNote(
                scale[idx] + octave,
                MIN,
                MAX
            );

    }

    fullRiff[step] = note;
    
    let currentChord =
    buildChord(
        chooseChordRoot(scale, rand) + octave
    );

for (let step = 0; step < totalSteps; step++) {

    const stepInMeasure =
        step % stepsPerMeasure;

    if (stepInMeasure === 0) {

        currentChord =
            buildChord(
                chooseChordRoot(scale, rand) + octave
            );

    }

    chordTimeline[step] = currentChord;

}

}

let pickDirection = 1;

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------

    function riffEngine(time, step) {

        const idx =
            step % totalSteps;

        const note =
            fullRiff[idx];

        if (!note) return;

        const chord =
            chordTimeline[idx];

        const { section, stepInMeasure } =
            timeline.getStepData(step);

        const energy =
            section === "chorus" ? 1 :
            section === "solo" ? 0.9 :
            section === "verse" ? 0.7 :
            section === "intro" ? 0.5 :
            0.4;

        if (rand() > energy) return;

        // --------------------------------------------------------
        // SCELTA SUONO
        // --------------------------------------------------------

        let sound;

        if (section === "chorus")

    sound = guitarOpen;

else if (stepInMeasure === stepsPerMeasure - 1)

    sound = guitarOpen;

else

    sound = guitarPalm;

        // --------------------------------------------------------
        // DURATA
        // --------------------------------------------------------

        let dur;

if (section === "chorus")

    dur = "4n";

else

    dur =
        params.bpm > 130
            ? "16n"
            : "8n";

        // --------------------------------------------------------
        // TRIGGER
        // --------------------------------------------------------

        if (sound === guitarOpen) {

    for (const n of chord) {

        sound.triggerAttackRelease(

            n,
            dur,
            humanizeTime(time, rand)

        );

    }

}

        else {

            sound.triggerAttackRelease(

                note,

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