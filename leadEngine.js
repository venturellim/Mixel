// leadEngine.js

import * as Tone from "https://esm.sh/tone";

export function createLeadEngine({
    sampler,
    lead,
    style,
    dna,
    rand,
    master
}) {

    // ============================
    // PARAMETRI DAL DNA
    // ============================

    const complexity = (dna % 1000) / 1000;
    const texture    = ((dna >> 8)  % 1000) / 1000;
    const energy     = ((dna >> 16) % 1000) / 1000;
    const direction  = ((dna >> 24) % 1000) / 1000;


    // ============================
    // FX CHAIN
    // ============================

    const leadEQ = new Tone.EQ3({
        low: -2,
        mid: 1,
        high: 3
    });

    const leadChorus = new Tone.Chorus({
        frequency: 4,
        delayTime: 2.5,
        depth: 0.4,
        spread: 180
    }).start();

    const leadVibrato = new Tone.Vibrato({
        frequency: 6,
        depth: 0.3
    });

    const leadDelay = new Tone.FeedbackDelay({
        delayTime: "8n",
        feedback: 0.35,
        wet: 0.4
    });

    const leadReverb = new Tone.Reverb({
        decay: 3,
        wet: 0.3
    });

    sampler.chain(
        leadEQ,
        leadChorus,
        leadVibrato,
        leadDelay,
        leadReverb,
        master
    );


    // ============================
    // PERFORMANCE ENGINE
    // ============================

    function performLeadNote(note, time) {

        // ----------------------------
        // OTTAVA AUTOMATICA
        // ----------------------------

        let octave = 4;
        if (style === "power") octave = 5;
        if (style === "doom")  octave = 3;

        const fullNote = note + octave;


        // ----------------------------
        // BENDING (power, heavy)
        // ----------------------------

        if ((style === "power" || style === "heavy") && rand() > 0.7) {
            sampler.triggerAttackRelease(fullNote, "8n", time);
            sampler.triggerAttackRelease(
                Tone.Frequency(fullNote).transpose(2).toNote(),
                "16n",
                time + Tone.Time("16n")
            );
            return;
        }


        // ----------------------------
        // TREMOLO PICKING (thrash, black)
        // ----------------------------

        if ((style === "thrash" || energy > 0.7) && rand() > 0.6) {
            sampler.triggerAttackRelease(fullNote, "32n", time);
            sampler.triggerAttackRelease(fullNote, "32n", time + Tone.Time("32n"));
            sampler.triggerAttackRelease(fullNote, "32n", time + Tone.Time("32n") * 2);
            return;
        }


        // ----------------------------
        // SLIDE (texture alta)
        // ----------------------------

        if (texture > 0.6 && rand() > 0.8) {
            const slideTo = Tone.Frequency(fullNote).transpose(2).toNote();
            sampler.triggerAttackRelease(fullNote, "16n", time);
            sampler.triggerAttackRelease(slideTo, "16n", time + Tone.Time("16n"));
            return;
        }


        // ----------------------------
        // TWIN GUITAR (power metal)
        // ----------------------------

        if (style === "power" && rand() > 0.75) {
            const harmony = Tone.Frequency(fullNote).transpose(4).toNote(); // terza maggiore
            sampler.triggerAttackRelease(fullNote, "8n", time);
            sampler.triggerAttackRelease(harmony, "8n", time);
            return;
        }


        // ----------------------------
        // NOTA NORMALE
        // ----------------------------

        sampler.triggerAttackRelease(fullNote, "8n", time);
    }


    // ============================
    // PLAYER LOOP
    // ============================

    let step = 0;

    const loop = new Tone.Loop((time) => {

        const note = lead[step];

        performLeadNote(note, time);

        step++;
        if (step >= lead.length) step = 0;

    }, "8n");

    loop.start(0);


    // ============================
    // API
    // ============================

    return {
        stop() {
            loop.stop();
            step = 0;
        }
    };
}
