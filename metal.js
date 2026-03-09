// metal.js — versione finta “Sad But True style”
// Perfetta per testare strumenti, sezioni e sincronizzazione

import * as Tone from "https://esm.sh/tone";

import {
    guitarPalm,
    guitarOpen,
    guitarLead,
    bass,
    drums
} from "./common.js";

export async function createMetalEngineFromImage() {

    await Tone.loaded();

    Tone.Transport.bpm.value = 90;

    // Note sicure
    const R_C2 = "C2";
    const R_G2 = "G2";
    const R_Bb2 = "Bb2";

    const B_C1 = "C1";
    const B_G1 = "G1";
    const B_Bb1 = "Bb1";

    const L_C4 = "C4";
    const L_Eb4 = "Eb4";
    const L_F4 = "F4";
    const L_G4 = "G4";

    // Durate sezioni
    const introDur = 8;
    const riffDur = 16;
    const verseDur = 16;
    const chorusDur = 16;
    const soloDur = 16;
    const chorus2Dur = 16;
    const outroDur = 8;

    const totalDuration = introDur + riffDur + verseDur + chorusDur + soloDur + chorus2Dur + outroDur;

    let t = 0;

    function scheduleSection(duration, riffPattern, bassNote, leadPattern, drumsType) {

        // Riff
        const riffLoop = new Tone.Loop((time, step) => {
            const note = riffPattern[step % riffPattern.length];
            guitarPalm.triggerAttackRelease(note, "8n", time);
        }, "8n").start(t);

        // Bass
        const bassLoop = new Tone.Loop((time) => {
            bass.triggerAttackRelease(bassNote, "4n", time);
        }, "4n").start(t);

        // Lead (solo se presente)
        let leadLoop = null;
        if (leadPattern) {
            leadLoop = new Tone.Loop((time, step) => {
                const note = leadPattern[step % leadPattern.length];
                guitarLead.triggerAttackRelease(note, "8n", time);
            }, "8n").start(t);
        }

        // Drums
        const drumLoop = new Tone.Loop((time) => {
            drums.player("kick").start(time);
            drums.player("snare").start(time + Tone.Time("8n"));
            drums.player("hihat_closed").start(time + Tone.Time("16n"));
        }, "4n").start(t);

        // Stop alla fine
        Tone.Transport.scheduleOnce(() => {
            riffLoop.stop();
            bassLoop.stop();
            drumLoop.stop();
            if (leadLoop) leadLoop.stop();
        }, t + duration);

        t += duration;
    }

    // Intro (palm mute)
    scheduleSection(
        introDur,
        [R_C2, R_C2, R_C2, R_C2],
        B_C1,
        null
    );

    // Main Riff (open)
    scheduleSection(
        riffDur,
        [R_C2, R_G2, R_Bb2, R_G2],
        B_C1,
        null
    );

    // Verse (palm mute)
    scheduleSection(
        verseDur,
        [R_C2, R_C2, R_G2, R_C2],
        B_C1,
        null
    );

    // Chorus (open)
    scheduleSection(
        chorusDur,
        [R_C2, R_G2, R_Bb2, R_G2],
        B_C1,
        null
    );

    // Solo (lead pentatonico)
    scheduleSection(
        soloDur,
        [R_C2, R_C2, R_G2, R_C2],
        B_C1,
        [L_C4, L_Eb4, L_F4, L_G4]
    );

    // Chorus 2
    scheduleSection(
        chorus2Dur,
        [R_C2, R_G2, R_Bb2, R_G2],
        B_C1,
        null
    );

    // Outro (palm mute)
    scheduleSection(
        outroDur,
        [R_C2, R_C2, R_C2, R_C2],
        B_C1,
        null
    );

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
