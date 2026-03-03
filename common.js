// common.js

export async function createInstruments() {

    // =====================
    // MASTER
    // =====================

    const masterEQ = new Tone.EQ3(-2, 0, 2).toDestination();

    // =====================
    // LEAD FX CHAIN
    // =====================

    const leadEQ = new Tone.EQ3(0, 0, 2);
    const leadChorus = new Tone.Chorus(4, 2.5, 0.3).start();
    const leadDelay = new Tone.FeedbackDelay("8n", 0.3);
    const leadReverb = new Tone.Reverb({ decay: 3, wet: 0.3 });
    const leadAutoWah = new Tone.AutoWah(100, 6, -30);

    leadEQ.connect(leadChorus);
    leadChorus.connect(leadDelay);
    leadDelay.connect(leadReverb);
    leadReverb.connect(leadAutoWah);
    leadAutoWah.connect(masterEQ);
    
    const rhythmComp = new Tone.Compressor({
    threshold: -20,
    ratio: 3,
    attack: 0.003,
    release: 0.2
});

rhythmComp.connect(masterEQ);

    // =====================
    // GUITAR LEAD
    // =====================

    const guitarLead = new Tone.Sampler({
        urls: {
            C3: "Samples/Guitar/C3.mp3",
            D3: "Samples/Guitar/D3.mp3",
            E3: "Samples/Guitar/E3.mp3",
            F3: "Samples/Guitar/F3.mp3",
            G3: "Samples/Guitar/G3.mp3",
            A3: "Samples/Guitar/A3.mp3",
            B3: "Samples/Guitar/B3.mp3",
            C4: "Samples/Guitar/C4.mp3"
        }
    }).connect(leadEQ);

    // =====================
    // GUITAR RHYTHM
    // =====================

    const guitarRhythm = new Tone.Sampler({
            urls: {
        C2: "Samples/Guitar/C2.mp3",
        Db2: "Samples/Guitar/Db2.mp3",
        D2: "Samples/Guitar/D2.mp3",
        Eb2: "Samples/Guitar/Eb2.mp3",
        E2: "Samples/Guitar/E2.mp3",
        F2: "Samples/Guitar/F2.mp3",
        Gb2: "Samples/Guitar/Gb2.mp3",
        G2: "Samples/Guitar/G2.mp3",
         Ab2: "Samples/Guitar/Ab2.mp3",
        A2: "Samples/Guitar/A2.mp3",
        Bb2: "Samples/Guitar/Bb2.mp3",
        B2: "Samples/Guitar/B2.mp3",
        C3: "Samples/Guitar/C3.mp3",
        Db3: "Samples/Guitar/Db3.mp3",
        D3: "Samples/Guitar/D3.mp3",
        Eb3: "Samples/Guitar/Eb3.mp3",
        E3: "Samples/Guitar/E3.mp3",
        F3: "Samples/Guitar/F3.mp3",
         Gb3: "Samples/Guitar/Gb3.mp3",
        G3: "Samples/Guitar/G3.mp3",
        Ab3 : "Samples/Guitar/Ab3.mp3",
        A3: "Samples/Guitar/A3.mp3",
        Bb3: "Samples/Guitar/Bb3.mp3",
        B3: "Samples/Guitar/B3.mp3",
        C4: "Samples/Guitar/C4.mp3",
        Db4: "Samples/Guitar/Db4.mp3",
        D4: "Samples/Guitar/D4.mp3",
        Eb4: "Samples/Guitar/Eb4.mp3",
        E4: "Samples/Guitar/E4.mp3",
        F4: "Samples/Guitar/F4.mp3",
         Gb4: "Samples/Guitar/Gb4.mp3",
        G4: "Samples/Guitar/G4.mp3",
        Ab4: "Samples/Guitar/Ab4.mp3",
        A4: "Samples/Guitar/A4.mp3",
        Bb4: "Samples/Guitar/Bb4.mp3",
        B4: "Samples/Guitar/B4.mp3",
        C5: "Samples/Guitar/C5.mp3"
    }
}).connect(rhythmComp);

guitarRhythm.set({
    envelope: {
        attack: 0.001,
        decay: 0.08,
        sustain: 0.2,
        release: 0.05
    }
});


    // =====================
    // BASS
    // =====================

    const bass = new Tone.Sampler({
        urls: {
        C1: "Samples/Bass/C1.mp3",
        D1: "Samples/Bass/D1.mp3",
        E1: "Samples/Bass/E1.mp3",
        F1: "Samples/Bass/F1.mp3",
        G1: "Samples/Bass/G1.mp3",
        A1: "Samples/Bass/A1.mp3",
        B1: "Samples/Bass/B1.mp3",
        C2: "Samples/Bass/C2.mp3",
        D2: "Samples/Bass/D2.mp3",
        E2: "Samples/Bass/E2.mp3",
        F2: "Samples/Bass/F2.mp3",
        G2: "Samples/Bass/G2.mp3",
        A2: "Samples/Bass/A2.mp3",
        B2: "Samples/Bass/B2.mp3",
        C3: "Samples/Bass/C3.mp3",
        D3: "Samples/Bass/D3.mp3",
        E3: "Samples/Bass/E3.mp3",
        F3: "Samples/Bass/F3.mp3",
        G3: "Samples/Bass/G3.mp3",
        A3: "Samples/Bass/A3.mp3",
        B3: "Samples/Bass/B3.mp3",
        C4: "Samples/Bass/C4.mp3"
    }
}).connect(masterEQ);

    // =====================
    // DRUMS
    // =====================

    const drums = new Tone.Players({
        kick: "Samples/Drums/kick.mp3",
        snare: "Samples/Drums/snare.mp3",
        hihat: "Samples/Drums/hihat_closed.mp3",
        openhat: "Samples/Drums/hihat_open.mp3",
        crash: "Samples/Drums/crash.mp3"
    }).connect(masterEQ);

    await Tone.loaded();

    return {
        guitarLead,
        guitarRhythm,
        bass,
        drums,
        masterEQ
    };
}