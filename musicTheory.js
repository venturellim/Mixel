import * as Tone from "https://esm.sh/tone";

console.log("musicTheory.js loaded");

export function chooseKey(dna){

    const keys = ["E","F","Gb","G","Ab","A","Bb","B","C","Db","D","Eb"];

    return keys[dna % keys.length];

}


export function chooseScale(dna,key,avgColor){

    const minor = [0,2,3,5,7,8,10];
    const harmonicMinor = [0,2,3,5,7,8,11];

    let scaleType;

if(avgColor){

    const {r,g,b} = avgColor;

    if(b > r && b > g)

        scaleType = [0,2,3,5,7,8,10]; // minor

    else if(r > g && r > b)

        scaleType = [0,1,3,5,7,8,10]; // phrygian

    else if(g > r && g > b)

        scaleType = [0,2,3,5,7,9,10]; // dorian

    else

        scaleType = (dna % 2 === 0)
            ? [0,2,3,5,7,8,10]
            : [0,2,3,5,7,8,11];

}

    const notes = [];

    const noteNames = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

    const rootIndex = noteNames.indexOf(key);

    for(let step of scaleType){

        const noteIndex = (rootIndex + step) % 12;

        notes.push(noteNames[noteIndex]);

    }

    return notes;

}


export function powerChord(root){

    const fifth = Tone.Frequency(root+"2").transpose(7).toNote();
    const octave = Tone.Frequency(root+"2").transpose(12).toNote();

    return [root+"2", fifth, octave];

}