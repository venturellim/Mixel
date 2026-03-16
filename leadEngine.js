// leadEngine.js

import * as Tone from "https://esm.sh/tone";

console.log("leadEngine.js loaded");

export function createLeadEngine(obj) {

    const sampler = obj.sampler;
    const lead = obj.lead;
    const style = obj.style;
    const dna = obj.dna;
    const rand = obj.rand;
    const master = obj.master;

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

        let octave = 4;
        if (style === "power") octave = 5;
        if (style === "doom")  octave = 3;

        const fullNote = note + octave;

        if ((style === "power" || style === "heavy") && rand() > 0.7) {
            sampler.triggerAttackRelease(fullNote, "8n", time);
            sampler.triggerAttackRelease(
                Tone.Frequency(fullNote).transpose(2).toNote(),
                "16n",
                time + Tone.Time("16n")
            );
            return;
        }

        if ((style === "thrash" || energy > 0.7) && rand() > 0.6) {
            sampler.triggerAttackRelease(fullNote, "32n", time);
            sampler.triggerAttackRelease(fullNote, "32n", time + Tone.Time("32n"));
            sampler.triggerAttackRelease(fullNote, "32n", time + Tone.Time("32n") * 2);
            return;
        }

        if (texture > 0.6 && rand() > 0.8) {
            const slideTo = Tone.Frequency(fullNote).transpose(2).toNote();
            sampler.triggerAttackRelease(fullNote, "16n", time);
            sampler.triggerAttackRelease(slideTo, "16n", time + Tone.Time("16n"));
            return;
        }

        if (style === "power" && rand() > 0.75) {
            const harmony = Tone.Frequency(fullNote).transpose(4).toNote();
            sampler.triggerAttackRelease(fullNote, "8n", time);
            sampler.triggerAttackRelease(harmony, "8n", time);
            return;
        }

        sampler.triggerAttackRelease(fullNote, "8n", time);
    }

    // ============================
    // LOOP
    // ============================

    let step = 0;

    const loop = new Tone.Loop(function(time) {
        const note = lead[step];
        performLeadNote(note, time);
        step = (step + 1) % lead.length;
    }, "8n");

    // ============================
    // API
    // ============================

    return {

        playSection: function(startTime, duration) {
            step = 0;
            loop.start(startTime);

            Tone.Transport.scheduleOnce(function() {
                loop.stop();
                step = 0;
            }, startTime + duration);
        },

        stop: function() {
            loop.stop();
            step = 0;
        }
    };
}
