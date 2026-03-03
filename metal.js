// metal.js

import { createInstruments } from "./common.js";

export async function createMetalEngineFromImage(imgElement) {

    await Tone.start();
    Tone.Transport.cancel();
    Tone.Transport.stop();
    Tone.Transport.bpm.value = 150;

    const instruments = await createInstruments();
    const { guitarRhythm, bass, drums } = instruments;

    const scale = ["E2","F#2","G2","A2","B2","C3","D3"];
    const riffPattern = [0,0,2,0,3,0,1,0];

    const loop = new Tone.Loop((time) => {

        const step = Math.floor(
            (Tone.Transport.ticks / Tone.Time("8n").toTicks()) 
            % riffPattern.length
        );

        const root = scale[riffPattern[step]];
        const fifth = Tone.Frequency(root).transpose(7).toNote();
        const octave = Tone.Frequency(root).transpose(12).toNote();

        guitarRhythm.triggerAttackRelease(
            [root, fifth, octave],
            "8n",
            time
        );

        bass.triggerAttackRelease(root, "8n", time);

        drums.player("kick").start(time);

        if (step % 4 === 2) {
            drums.player("snare").start(time);
        }

    }, "8n");

    loop.start(0);

    function play() { Tone.Transport.start(); }
    function pause() { Tone.Transport.pause(); }
    function stop() { Tone.Transport.stop(); Tone.Transport.seconds = 0; }
    function seek(sec) { Tone.Transport.seconds = sec; }

    return {
        play,
        pause,
        stop,
        seek,
        totalDuration: 999
    };
}