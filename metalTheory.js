export function detectMetalStyle(brightness,dna){

    if(brightness > 0.7) return "power";
    if(brightness < 0.35) return "doom";

    if(dna % 2 === 0) return "thrash";

    return "heavy";

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