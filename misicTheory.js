import * as Tone from "https://esm.sh/tone";

export function chooseKey(dna){

    const keys = ["E","F","G","A","B","C","D"];

    return keys[dna % keys.length];

}


export function chooseScale(dna,key){

    const minor = ["E","Gb","G","A","B","C","D"];
    const phrygian = ["E","F","G","A","B","C","D"];

    if(dna % 2 === 0)
        return minor;

    return phrygian;

}


export function powerChord(note){

    const fifth = Tone.Frequency(note).transpose(7).toNote();
    const octave = Tone.Frequency(note).transpose(12).toNote();

    return [note,fifth,octave];

}