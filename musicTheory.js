import * as Tone from "https://esm.sh/tone";

export function chooseKey(dna){

    const keys = ["E","F","Gb","G","Ab","A","Bb","B","C","Db","D","Eb"];

    return keys[dna % keys.length];

}


export function chooseScale(dna,key){

    const minor = [0,2,3,5,7,8,10];
    const harmonicMinor = [0,2,3,5,7,8,11];

    const scaleType = (dna % 2 === 0) ? minor : harmonicMinor;

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