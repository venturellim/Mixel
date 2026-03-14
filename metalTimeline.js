// metalTimeline.js — timeline musicale intelligente

export function createMetalTimeline(params, rand) {

    const bpm = params.bpm;
    const entropy = params.entropy ?? 0.5;

    // ------------------------------------------------------------
    // TIME SIGNATURE
    // ------------------------------------------------------------

    const meter = rand() < 0.2 ? 6 : 4;

    const beatsPerMeasure = meter;
    const stepsPerBeat = meter === 6 ? 3 : 2;
const stepsPerMeasure = beatsPerMeasure * stepsPerBeat;

    // ------------------------------------------------------------
    // DURATA BRANO (BPM dipendente)
    // ------------------------------------------------------------

    let durationMin;

    if (bpm < 100) {

        durationMin = 3 + rand() * 0.4;

    } else if (bpm < 130) {

        durationMin = 3.4 + rand() * 0.6;

    } else {

        durationMin = 4 + rand() * 1;

    }

    const measuresTarget =
        Math.floor(durationMin * bpm / beatsPerMeasure);

    // ------------------------------------------------------------
    // LUNGHEZZA SOLO
    // ------------------------------------------------------------

    let soloMeasures;

    if (bpm < 100) {

        soloMeasures = 4;

    } else if (bpm < 130) {

        soloMeasures = 8;

    } else {

        soloMeasures = 12 + Math.floor(entropy * 4);

    }

    // ------------------------------------------------------------
    // STRUTTURA BASE
    // ------------------------------------------------------------

    const structure = [

        { section: "intro",  len: 4 },

        { section: "verse",  len: 8 },
        { section: "chorus", len: 8 },

        { section: "verse",  len: 8 },
        { section: "chorus", len: 8 },

        { section: "solo",   len: soloMeasures },

        { section: "chorus", len: 8 },

        { section: "outro",  len: 4 }

    ];

    // ------------------------------------------------------------
    // ALLUNGAMENTO AUTOMATICO
    // ------------------------------------------------------------

    let measuresCurrent =
        structure.reduce((a,s)=>a+s.len,0);

    while (measuresCurrent < measuresTarget) {

        structure.splice(
            structure.length - 2,
            0,
            { section: "verse", len: 8 }
        );

        structure.splice(
            structure.length - 2,
            0,
            { section: "chorus", len: 8 }
        );

        measuresCurrent += 16;

    }

    // ------------------------------------------------------------
    // COSTRUZIONE TIMELINE
    // ------------------------------------------------------------

    const totalMeasures =
        structure.reduce((a,s)=>a+s.len,0);

    const totalSteps =
        totalMeasures * stepsPerMeasure;

    const sectionTimeline =
        new Array(totalSteps);

    let cursor = 0;

    for (const block of structure) {

        for (let m = 0; m < block.len; m++) {

            for (let s = 0; s < stepsPerMeasure; s++) {

                sectionTimeline[cursor] = block.section;
                cursor++;

            }

        }

    }

    // ------------------------------------------------------------
    // STEP DATA
    // ------------------------------------------------------------

    function getStepData(step) {

        const idx = step % totalSteps;

        const stepInMeasure =
            idx % stepsPerMeasure;

        const measure =
            Math.floor(idx / stepsPerMeasure);

        const section =
            sectionTimeline[idx];

        return {
            stepInMeasure,
            measure,
            section
        };

    }

    return {

        bpm,
        meter,

        beatsPerMeasure,
        stepsPerMeasure,

        totalMeasures,
        totalSteps,

        sectionTimeline,

        getStepData

    };

}