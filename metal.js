// metal.js — TEST SOLO BATTERIA
// Nessun riff, nessun basso, nessun lead.
// Solo kick, snare, hihat. Zero possibilità di note sbagliate.

import * as Tone from "https://esm.sh/tone";
import { drums } from "./common.js";

export async function createMetalEngineFromImage() {

    await Tone.loaded();
    Tone.Transport.bpm.value = 90;

    // Loop batteria sicuro
    const drumLoop = new Tone.Loop((time) => {
        drums.player("kick").start(time);
        drums.player("snare").start(time + Tone.Time("8n"));
        drums.player("hihat").start(time + Tone.Time("16n"));
    }, "4n");

    function play() {
        drumLoop.start(0);
        if (Tone.Transport.state !== "started") {
            Tone.Transport.start();
        }
    }

    function pause() {
        Tone.Transport.pause();
    }

    function stop() {
        drumLoop.stop();
        Tone.Transport.stop();
        Tone.Transport.position = 0;
    }

    function seek(seconds) {
        Tone.Transport.seconds = seconds;
    }

    return {
        play,
        pause,
        stop,
        seek,
        totalDuration: 30
    };
}

export async function waitInstrumentsWithProgress() {
    // Nessun caricamento complicato
    return;
}
