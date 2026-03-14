// metalTheory.js

export function detectMetalStyle(brightness,dna){

    if(brightness > 0.7) return "power";
    if(brightness < 0.35) return "doom";

    if(dna % 2 === 0) return "thrash";

    return "heavy";

}

// ------------------------------------------------------------
// NORMALIZZA SCALA PER METAL
// ------------------------------------------------------------

export function normalizeMetalScale(scale, analysis) {

    if (!scale || scale.length === 0) {

        return ["E","F#","G","A","B","C","D"]; // fallback E minor

    }

    const { brightness, entropy } = analysis;

    // --------------------------------------------------------
    // Scegli tipo scala
    // --------------------------------------------------------

    let type;

    if (brightness < 0.35)
        type = "phrygian";

    else if (entropy > 0.65)
        type = "harmonicMinor";

    else
        type = "naturalMinor";

    // --------------------------------------------------------
    // Costruzione scale
    // --------------------------------------------------------

    const root = scale[0];

    const scales = {

        naturalMinor: [0,2,3,5,7,8,10],
        harmonicMinor: [0,2,3,5,7,8,11],
        phrygian: [0,1,3,5,7,8,10],
        pentatonic: [0,3,5,7,10]

    };

    const intervals = scales[type];

    const rootMidi = Tone.Frequency(root + "3").toMidi();

    const newScale = intervals.map(i =>
        Tone.Frequency(rootMidi + i, "midi").toNote().replace(/[0-9]/g,"")
    );

    return newScale;

}

export function computeBPM(brightness,dna){

    const base = 120 + Math.floor(brightness*40);

    return base + (dna % 20);

}


export function generateRiffFromDNA(dna,scale,length,rand){

    const riff = [];

    for(let i=0;i<length;i++){

        const index = Math.floor(rand()*scale.length);

        riff.push(scale[index]);

    }

    return riff;

}