// metal.js

import * as Tone from "https://esm.sh/tone";

import {
    guitarPalm,
    guitarOpen,
    bass,
    drums,
    analyzeImageBrightness,
    generateImageDNA,
    createSeededRandom
} from "./common.js";

export async function createMetalEngineFromImage(imgElement) {

    // await Tone.start();
    Tone.Transport.cancel();
    Tone.Transport.stop();

    // =========================
    // ANALISI IMMAGINE
    // =========================

    const brightness = analyzeImageBrightness(imgElement);
    console.log("Luminosità:", brightness);

const dna = generateImageDNA(imgElement);
const rng = createSeededRandom(dna);

console.log("DNA:", dna);

    let scale;
    let bpm;
    let usePalmMore = false;

    if (brightness < 0.33) {
        // Foto scura → cupo
        scale = ["D2","E2","F2","G2","A2","Bb2","C3"];
        bpm = 140;
        usePalmMore = true;
    }
    else if (brightness < 0.66) {
        // Media → metal classico
        scale = ["E2","Gb2","G2","A2","B2","C3","D3"];
        bpm = 155;
    }
    else {
        // Luminosa → power brillante
        scale = ["Gb2","Ab2","A2","B2","Db3","D3","E3"];
        bpm = 170;
    }

    Tone.Transport.bpm.value = bpm;

    // =========================
    // RIFF BASE
    // =========================

    const riffLength = 8;
const riffPattern = [];

for (let i = 0; i < riffLength; i++) {
    riffPattern.push(Math.floor(rng() * scale.length));
}

    const loop = new Tone.Loop((time) => {

        const step = Math.floor(
            (Tone.Transport.ticks / Tone.Time("8n").toTicks()) 
            % riffPattern.length
        );

        const root = scale[riffPattern[step]];
        const fifth = Tone.Frequency(root).transpose(7).toNote().replace("#", "b");
        const octave = Tone.Frequency(root).transpose(12).toNote();

        const chord = [root, fifth, octave];

        // 🎸 Alternanza palm/open
        if (usePalmMore || step % 4 !== 3) {
            //guitarPalm.triggerAttackRelease(chord, "8n", time);
            guitarPalm.triggerAttackRelease(root, "8n", time);
        } else {
            guitarOpen.triggerAttackRelease(chord, "8n", time);
        }

        // 🎸 Basso
        bass.triggerAttackRelease(root, "8n", time);

        // 🥁 Kick sempre
        drums.player("kick").start(time);

        // 🥁 Snare su 2 e 4
        if (step % 4 === 2) {
            drums.player("snare").start(time);
        }
        
        if (rng() > 0.7 && step % 4 === 0) {
    drums.player("crash").start(time);
}
    if (brightness > 0.6 && step % 2 === 0) {
    drums.player("hihat").start(time);

}

    }, "8n");
    
    

    loop.start(0);

    // =========================
    // ENGINE CONTROLLER
    // =========================

    function play() { Tone.Transport.start(); }
    function pause() { Tone.Transport.pause(); }
    function stop() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    loop.stop(0);
    Tone.Transport.seconds = 0;
}
    function seek(sec) { Tone.Transport.seconds = sec; }

    return {
        play,
        pause,
        stop,
        seek,
        totalDuration: 999
    };
}