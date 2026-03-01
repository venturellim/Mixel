export function generateMetal(dna) {

    const bpm = 135 + Math.floor(Math.random() * 20);
    Tone.Transport.bpm.value = bpm;

    const synth = new Tone.Synth().toDestination();

    function start() {
        Tone.Transport.stop();
        Tone.Transport.cancel();

        Tone.Transport.scheduleRepeat((time) => {
            synth.triggerAttackRelease("C3", "8n", time);
        }, "4n");

        Tone.Transport.start();
    }

    return {
        start
    };
}