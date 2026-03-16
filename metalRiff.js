// metalRiff.js — riff engine power metal

import * as Tone from "https://esm.sh/tone";
import {
    guitarPalm,
    guitarOpen,
    orchestraPad,
    clampNote,
    humanizeTime
} from "./common.js";

console.log("metalRiff.js loaded");


// ------------------------------------------------------------
// PROGRESSIONI POWER METAL
// ------------------------------------------------------------

const powerMetalProgressions = [

    [0,4,5,3],
    [0,5,3,4],
    [0,3,4,3],
    [0,4,3,5],
    [0,3,5,4]

];


// ------------------------------------------------------------
// ENGINE
// ------------------------------------------------------------

export function generateMetalRiff(analysis, params, timeline, rand) {

    const scale = params.scale;
    
    // ------------------------------------------------------------
// FOTO → COMPORTAMENTO RIFF
// ------------------------------------------------------------

const palmProbability =
    0.8 - analysis.brightness * 0.5;

const fillProbability =
    0.4 + analysis.texture * 0.5;

const variationProbability =
    0.05 + analysis.complexity * 0.15;

    const {
        stepsPerMeasure,
        totalSteps,
        sectionTimeline
    } = timeline;

    const MIN = 36;
    const MAX = 52;

    const octave = 2;

    const progression =
        powerMetalProgressions[
            Math.floor(rand() * powerMetalProgressions.length)
        ];


// ------------------------------------------------------------
// COSTRUZIONE POWER CHORD
// ------------------------------------------------------------

function buildChord(root){

    const rootMidi =
        Tone.Frequency(root).toMidi();

    return [

        root,

        Tone.Frequency(rootMidi + 7,"midi").toNote(),

        Tone.Frequency(rootMidi + 12,"midi").toNote()

    ];

}


// ------------------------------------------------------------
// CHORUS PROGRESSION
// ------------------------------------------------------------

function generateChorusProgression(){

    const patterns = [

        [0,5,6,4],
        [0,3,4,5],
        [0,4,5,3]

    ];

    const pattern =
        patterns[Math.floor(rand()*patterns.length)];

    const chords = [];

    for(const p of pattern){

        const root =
            scale[p % scale.length] + octave;

        chords.push(buildChord(root));

    }

    return chords;

}

const chorusProgression =
    generateChorusProgression();


// ------------------------------------------------------------
// PEDAL PATTERN
// ------------------------------------------------------------

function generatePedalPattern(bpm){

    if (bpm < 100) return [0,4,8,12];

    if (bpm < 130) return [0,3,6,8,12];

    return [0,2,4,6,8,10,12];

}

const pedalPattern =
    generatePedalPattern(params.bpm);


// ------------------------------------------------------------
// RIFF BASE
// ------------------------------------------------------------

const riffMeasures = 2;

const riffLength =
    riffMeasures * stepsPerMeasure;

const baseRiff =
    new Array(riffLength);


// ------------------------------------------------------------
// COSTRUZIONE RIFF BASE
// ------------------------------------------------------------

let chordRoot =
    scale[0] + octave;

let chord =
    buildChord(chordRoot);

for(let step = 0; step < riffLength; step++){

    const stepInMeasure =
        step % stepsPerMeasure;

    if(stepInMeasure === 0){

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

    if(pedalPattern.includes(stepInMeasure)){

    baseRiff[step] =
        clampNote(chordRoot, MIN, MAX);

}
else if(stepInMeasure === stepsPerMeasure - 1){

    const chordTone =
        chord[Math.floor(rand()*chord.length)];

    baseRiff[step] =
        clampNote(chordTone, MIN, MAX);

}
else{

    // palm mute riempitivo

    if(rand() < 0.6){

        baseRiff[step] =
            clampNote(chordRoot, MIN, MAX);

    }else{

    if(rand() < fillProbability){

        baseRiff[step] =
            clampNote(chordRoot, MIN, MAX);

    }else{

        baseRiff[step] = null;

    }

}


// ------------------------------------------------------------
// RIFF COMPLETO
// ------------------------------------------------------------

const fullRiff =
    new Array(totalSteps);

for(let step = 0; step < totalSteps; step++){

    const baseStep =
        step % riffLength;

    let note =
    baseRiff[baseStep];

if(!note){

    fullRiff[step] = null;
    continue;

}

    if(rand() < variationProbability){

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

// ------------------------------------------------------------
// TIMELINE ACCORDI
// ------------------------------------------------------------

const chordTimeline =
    new Array(totalSteps);

let currentChord =
    buildChord(scale[0] + octave);

for(let step = 0; step < totalSteps; step++){

    const stepInMeasure =
        step % stepsPerMeasure;

    if(stepInMeasure === 0){

        const measure =
            Math.floor(step / stepsPerMeasure);

        const degree =
            progression[
                measure % progression.length
            ];

        const root =
            scale[degree] + octave;

        currentChord =
            buildChord(root);

    }

    chordTimeline[step] =
        currentChord;

}


// ------------------------------------------------------------
// ENGINE
// ------------------------------------------------------------

function riffEngine(time, step){

    const idx =
        step % totalSteps;

    let note = fullRiff[idx];

if(!note){

    if(section === "chorus" || section === "verse"){

        note = chord[0]; // pedal tone

    }else{

        return;

    }

}

    const {
        section,
        stepInMeasure
    } =
        timeline.getStepData(step);

    let chord;

    if(section === "chorus" && stepInMeasure === 0){

        const measure =
            Math.floor(step / stepsPerMeasure);

        chord =
            chorusProgression[
                measure % chorusProgression.length
            ];

    }
    else{

        chord =
            chordTimeline[idx];

    }


// ------------------------------------------------------------
// PAD ORCHESTRALE
// ------------------------------------------------------------

if(section === "chorus" && stepInMeasure === 0){

    orchestraPad.triggerAttackRelease(

        chord,
        "1m",
        time

    );

}


// ------------------------------------------------------------
// ENERGIA
// ------------------------------------------------------------

const energy =

    section === "chorus" ? 1 :
    section === "solo" ? 0.95 :
    section === "verse" ? 0.9 :
    section === "intro" ? 0.8 :
    0.7;

if(rand() > energy) return;


// ------------------------------------------------------------
// SUONO
// ------------------------------------------------------------

let sound;

if(section === "chorus"){

    sound = guitarOpen;

}
else{

    if(rand() < palmProbability)

        sound = guitarPalm;

    else

        sound = guitarOpen;

}


// ------------------------------------------------------------
// DURATA
// ------------------------------------------------------------

let dur;

if(section === "chorus")

    dur = "4n";

else

    dur =
        params.bpm > 130
            ? "16n"
            : "8n";


// ------------------------------------------------------------
// TRIGGER
// ------------------------------------------------------------

if(section === "chorus"){

    for(const n of chord){

        guitarOpen.triggerAttackRelease(

            n,
            "4n",
            humanizeTime(time, rand)

        );

    }

}
else if(sound === guitarOpen){

    sound.triggerAttackRelease(

        note,
        dur,
        humanizeTime(time, rand, 0.010),
        0.95 + rand()*0.1

    );

}
else{

    sound.triggerAttackRelease(

        note,
        dur,
        humanizeTime(time, rand)

    );

}

// ------------------------------------------------------------

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