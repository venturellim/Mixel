import * as Tone from "https://cdn.skypack.dev/tone";

export async function createMetalEngineFromImage(imgElement) {

    console.log("🔥 Avvio METAL ENGINE");

    await Tone.start();
    Tone.Transport.cancel();
    Tone.Transport.stop();

    Tone.Transport.bpm.value = 140;

    // ========================
    // STRUMENTI
    // ========================

    const guitar = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.1 }
    }).toDestination();

    const bass = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1 }
    }).toDestination();

    const kick = new Tone.MembraneSynth().toDestination();
    const snare = new Tone.NoiseSynth({
        envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    }).toDestination();

    // ========================
    // RIFF BASE
    // ========================

    const riff = ["E2", "E2", "G2", "E2", "A2", "E2", "D2", "E2"];

    const loop = new Tone.Loop((time) => {

        const step = Math.floor((Tone.Transport.ticks / Tone.Time("8n").toTicks()) % riff.length);
        const note = riff[step];

        guitar.triggerAttackRelease(note, "8n", time);
        bass.triggerAttackRelease(note, "8n", time);

        // Kick su ogni battito
        kick.triggerAttackRelease("C1", "8n", time);

        // Snare su 2 e 4
        if (step % 4 === 2) {
            snare.triggerAttackRelease("16n", time);
        }

    }, "8n");

    loop.start(0);

    // ========================
    // ENGINE CONTROLLER
    // ========================

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