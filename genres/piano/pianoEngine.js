// pianoEngine.js — piano con SoundFont MusyngKite

import * as Tone from "https://esm.sh/tone";

console.log("pianoEngine.js ver. 001 loaded");

let piano = null;
let isLoaded = false;

// --------------------------------------------------
// LOADER
// --------------------------------------------------

export async function waitPianoInstruments() {

    if (isLoaded) return;

    const overlay = document.getElementById("loadingOverlay");
    const bar = document.getElementById("loadingBar");
    const text = document.getElementById("loadingText");

    overlay.style.display = "flex";

    text.innerText = "Caricamento Piano (MusyngKite)...";

    // SoundFont load
    piano = await Soundfont.instrument(
        Tone.getContext().rawContext,
        "acoustic_grand_piano",
        {
            soundfont: "MusyngKite",
            format: "mp3"
        }
    );

    isLoaded = true;

    bar.style.width = "100%";
    text.innerText = "Piano pronto 🎹";

    await new Promise(res => setTimeout(res, 300));

    overlay.style.display = "none";
}

// --------------------------------------------------
// ENGINE
// --------------------------------------------------

export async function createPianoEngine(params, analysis) {

    await Tone.loaded();

    Tone.Transport.bpm.value = params.bpm;

    const scale = params.scale;

    const totalMeasures = 32;
    const beatsPerMeasure = 4;

    const totalDuration =
        totalMeasures * beatsPerMeasure * (60 / params.bpm);

    // --------------------------------------------------
    // MODE SELEZIONE DA IMMAGINE
    // --------------------------------------------------

    const mode =
        analysis.energy > 0.6
            ? "pattern"
            : "arp";

    console.log("🎹 Piano mode:", mode);

    // --------------------------------------------------
    // UTILS
    // --------------------------------------------------

    function pickNote() {
        const idx = Math.floor(Math.random() * scale.length);
        return scale[idx] + "4";
    }

    function buildChord(root) {
        const midi = Tone.Frequency(root).toMidi();
        return [
            root,
            Tone.Frequency(midi + 4, "midi").toNote(),
            Tone.Frequency(midi + 7, "midi").toNote()
        ];
    }

    // --------------------------------------------------
    // PROGRESSIONE
    // --------------------------------------------------

    const progression = [0, 4, 5, 3];

    function getChord(measure) {
        const degree = progression[measure % progression.length];
        const root = scale[degree] + "3";
        return buildChord(root);
    }

    // --------------------------------------------------
    // LOOP
    // --------------------------------------------------

    let step = 0;

    const loop = new Tone.Loop((time) => {

        if (!piano) return;

        const measure = Math.floor(step / 8);
        const stepInMeasure = step % 8;

        const chord = getChord(measure);

        // ----------------------------------------------
        // ARPEGGIO MODE
        // ----------------------------------------------

        if (mode === "arp") {

            const note = chord[stepInMeasure % chord.length];

            piano.play(
                note,
                time,
                { duration: 0.8, gain: 0.6 }
            );
        }

        // ----------------------------------------------
        // PATTERN MODE (EINAUDI STYLE)
        // ----------------------------------------------

        else {

            if (stepInMeasure % 2 === 0) {

                const note = chord[0];

                piano.play(
                    note,
                    time,
                    { duration: 1.2, gain: 0.7 }
                );
            }

            if (Math.random() < 0.4) {

                const note = pickNote();

                piano.play(
                    note,
                    time,
                    { duration: 0.5, gain: 0.5 }
                );
            }
        }

        step++;

    }, "8n");

    // --------------------------------------------------
    // CONTROLLI
    // --------------------------------------------------

    function play() {
        loop.start(0);

        if (Tone.Transport.state !== "started") {
            Tone.Transport.start();
        }
    }

    function pause() {
        Tone.Transport.pause();
    }

    function stop() {
        loop.stop();
        Tone.Transport.stop();
    }

    function seek(seconds) {
        Tone.Transport.start(undefined, seconds);
    }

    return {
        play,
        pause,
        stop,
        seek,
        totalDuration
    };
}