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

    Tone.Transport.cancel();
    Tone.Transport.stop();

    Tone.Transport.bpm.value = 150;

    const brightness = analyzeImageBrightness(imgElement);

    const dna = Math.floor(brightness * 1000000000);

    const scale = [
        "E2","Gb2","G2","A2","B2","C3","D3"
    ];

    function generateRiff(dna) {

        const pattern = [];

        for (let i = 0; i < 8; i++) {

            const index = (dna >> (i * 2)) & 7;
            pattern.push(index % 7);

        }

        return pattern;
    }

    const riffPattern = generateRiff(dna);

    let step = 0;

    const loop = new Tone.Loop((time) => {

        const note = scale[riffPattern[step]];

        const fifth = Tone.Frequency(note).transpose(7).toNote();
        const octave = Tone.Frequency(note).transpose(12).toNote();

        guitarPalm.triggerAttackRelease(
            [note, fifth, octave],
            "8n",
            time
        );

        bass.triggerAttackRelease(
            note,
            "8n",
            time
        );

        drums.player("kick").start(time);

        if (step === 2 || step === 6)
            drums.player("snare").start(time);

        if (brightness > 0.6)
            drums.player("ride").start(time);
        else
            drums.player("hihat").start(time);

        if (step === 7 && Math.random() > 0.7) {

            drums.player("tom1").start(time);
            drums.player("tom2").start(time + 0.05);
            drums.player("tom3").start(time + 0.1);
            drums.player("tom4").start(time + 0.15);

        }

        step++;

        if (step >= 8)
            step = 0;

    }, "8n");

    loop.start(0);

    function play() {
        Tone.Transport.start();
    }

    function pause() {
        Tone.Transport.pause();
    }

    function stop() {
        Tone.Transport.stop();
        Tone.Transport.seconds = 0;
    }

    function seek(sec) {
        Tone.Transport.seconds = sec;
    }

    return {
        play,
        pause,
        stop,
        seek,
        totalDuration: 999
    };

}