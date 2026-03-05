// metal.js

import * as Tone from "https://esm.sh/tone";

import {
    guitarPalm,
    guitarOpen,
    bass,
    drums,
    extractPhotoDNA
    analyzeImageBrightness
} from "./common.js";

export async function createMetalEngineFromImage(imgElement) {

    /* ---------------- RESET TRANSPORT ---------------- */

    Tone.Transport.cancel();
    Tone.Transport.stop();
    Tone.Transport.seconds = 0;

    Tone.Transport.bpm.value = 150;

    /* ---------------- DNA FOTO ---------------- */

    const brightness = analyzeImageBrightness(imgElement);

    const dna = Math.floor(brightness * 1000000000);

    /* ---------------- SCALA ---------------- */

    const scale = [
        "E2","Gb2","G2","A2","B2","C3","D3"
    ];

    /* ---------------- GENERAZIONE RIFF ---------------- */

    function generateRiff(dna, shift = 0, length = 16) {

        const riff = [];

        let pos = (dna + shift) % scale.length;

        for (let i = 0; i < length; i++) {

            const step = ((dna >> ((i + shift) * 3)) & 7) - 3;

            pos += step;

            if (pos < 0) pos = 0;
            if (pos >= scale.length) pos = scale.length - 1;

            riff.push(scale[pos]);
        }

        return riff;
    }

    const riffVerse  = generateRiff(dna, 0);
    const riffChorus = generateRiff(dna, 5);
    const riffSolo   = generateRiff(dna, 11);
    const riffOutro  = generateRiff(dna, 17);

    /* ---------------- STRUTTURA CANZONE ---------------- */

    const songStructure = [

        { name: "intro",  riff: riffVerse,  bars: 4 },
        { name: "verse",  riff: riffVerse,  bars: 8 },
        { name: "chorus", riff: riffChorus, bars: 8 },

        { name: "verse",  riff: riffVerse,  bars: 8 },
        { name: "chorus", riff: riffChorus, bars: 8 },

        { name: "solo",   riff: riffSolo,   bars: 8 },

        { name: "chorus", riff: riffChorus, bars: 12 },

        { name: "outro",  riff: riffOutro,  bars: 6 }

    ];

    /* ---------------- STATO PLAYBACK ---------------- */

    let sectionIndex = 0;
    let bar = 0;
    let step = 0;

    /* ---------------- LOOP PRINCIPALE ---------------- */

    const loop = new Tone.Loop((time) => {

        const section = songStructure[sectionIndex];
        const riff = section.riff;

        const note = riff[step % riff.length];

        const fifth  = Tone.Frequency(note).transpose(7).toNote();
        const octave = Tone.Frequency(note).transpose(12).toNote();

        /* -------- CHITARRA RITMICA -------- */

        guitarPalm.triggerAttackRelease(
            [note, fifth, octave],
            "8n",
            time
        );

        /* -------- BASSO -------- */

        bass.triggerAttackRelease(
            note,
            "8n",
            time
        );

        /* -------- DRUMS -------- */

        drums.player("kick").start(time);

        if (step % 4 === 2)
            drums.player("snare").start(time);

        drums.player("hihat").start(time);

        /* -------- CAMBIO SEZIONI -------- */

        step++;

        if (step >= 8) {

            step = 0;
            bar++;

            if (bar >= section.bars) {

                bar = 0;
                sectionIndex++;

                if (sectionIndex >= songStructure.length)
                    sectionIndex = 0;
            }
        }

    }, "8n");

    loop.start(0);

    /* ---------------- CONTROLLI PLAYER ---------------- */

    function play() {

        Tone.Transport.start();

    }

    function pause() {

        Tone.Transport.pause();

    }

    function stop() {

        Tone.Transport.stop();
        Tone.Transport.seconds = 0;

        sectionIndex = 0;
        bar = 0;
        step = 0;

    }

    function seek(sec) {

        Tone.Transport.seconds = sec;

    }

    return {

        play,
        pause,
        stop,
        seek,
        totalDuration: 240

    };
}