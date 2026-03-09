// metal.js — versione finta con sezioni vere per testare audio e struttura

import * as Tone from "https://esm.sh/tone";

import {
    guitarPalm,
    guitarOpen,
    guitarLead,
    bass,
    drums
} from "./common.js";

// ======================================================
// ENGINE FISSO DI TEST CON SEZIONI
// ======================================================

export async function createMetalEngineFromImage() {

    await Tone.loaded();

    // BPM fisso
    Tone.Transport.bpm.value = 120;

    // Scala fissa compatibile con i sample
    const scale = ["C", "D", "Eb", "F", "G", "Ab", "Bb"];

    // Durate sezioni (in secondi)
    const introDur = 8;
    const verseDur = 16;
    const chorusDur = 16;
    const soloDur = 8;
    const chorus2Dur = 16;
    const outroDur = 8;

    const totalDuration = introDur + verseDur + chorusDur + soloDur + chorus2Dur + outroDur;

    // ======================================================
    // LOOP SEMPLICI PER TEST
    // ======================================================

    function playRiff(time, note) {
        guitarPalm.triggerAttackRelease(note, "8n", time);
    }

    function playBass(time, note) {
        bass.triggerAttackRelease(note, "4n", time);
    }

    function playLead(time, note) {
        guitarLead.triggerAttackRelease(note, "8n", time);
    }

    function playDrums(time) {
        drums.player("kick").start(time);
        drums.player("snare").start(time + Tone.Time("8n"));
        drums.player("hihat").start(time + Tone.Time("16n"));
    }

    // ======================================================
    // SCHEDULAZIONE SEZIONI
    // ======================================================

    let t = 0;

    function scheduleSection(duration, riffNote, bassNote, leadNote) {

        // Riff
        const riffLoop = new Tone.Loop((time) => playRiff(time, riffNote), "8n").start(t);

        // Bass
        const bassLoop = new Tone.Loop((time) => playBass(time, bassNote), "4n").start(t);

        // Lead (solo se leadNote non è null)
        let leadLoop = null;
        if (leadNote) {
            leadLoop = new Tone.Loop((time) => playLead(time, leadNote), "8n").start(t);
        }

        // Drums
        const drumLoop = new Tone.Loop((time) => playDrums(time), "4n").start(t);

        // Stop loops alla fine della sezione
        Tone.Transport.scheduleOnce(() => {
            riffLoop.stop();
            bassLoop.stop();
            drumLoop.stop();
            if (leadLoop) leadLoop.stop();
        }, t + duration);

        t += duration;
    }

    // Intro
    scheduleSection(introDur, "C2", "C1", null);

    // Verse
    scheduleSection(verseDur, "C2", "C1", null);

    // Chorus
    scheduleSection(chorusDur, "G2", "C1", null);

    // Solo
    scheduleSection(soloDur, "C2", "C1", "C4");

    // Chorus 2
    scheduleSection(chorus2Dur, "G2", "C1", null);

    // Outro
    scheduleSection(outroDur, "C2", "C1", null);

    // ======================================================
    // CONTROLLI
    // ======================================================

    function play() {
        if (Tone.Transport.state !== "started") {
            Tone.Transport.start();
        }
    }

    function pause() {
        Tone.Transport.pause();
    }

    function stop() {
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
        totalDuration
    };
}

// ======================================================
// LOADER STRUMENTI (rimane uguale)
// ======================================================

export async function waitInstrumentsWithProgress() {

    const overlay = document.getElementById("loadingOverlay");
    const bar = document.getElementById("loadingBar");
    const text = document.getElementById("loadingText");

    overlay.style.display = "flex";

    const instruments = [
        guitarPalm.loaded,
        guitarOpen.loaded,
        guitarLead.loaded,
        bass.loaded,
        drums.loaded
    ];

    let loaded = 0;
    const total = instruments.length;

    for (const inst of instruments) {
        await inst;
        loaded++;
        const percent = Math.floor((loaded / total) * 100);
        bar.style.width = percent + "%";
        text.innerText = "Caricamento strumenti… " + percent + "%";
    }

    overlay.style.display = "none";
}
