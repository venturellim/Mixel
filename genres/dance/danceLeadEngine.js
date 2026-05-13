// danceLeadEngine.js — Lead ritmici/melodici per Dance Engine
import * as Tone from "https://esm.sh/tone";

export function scheduleDanceLead(
    section,
    instruments,
    params,
    style,
    score,
    rand
) {
    const name = section.name.toLowerCase();
    const isIntro = name.includes("intro");
    const isBuild = name.includes("build");
    const isDrop  = name.includes("drop");
    const isBreak = name.includes("break");
    const isChorus = name.includes("chorus");

    // Lead disponibili
    const {
        leadSaw,
        leadSynthBrass1,
        leadSynthBrass2,
        piano
    } = instruments;

    // Sezione senza lead
    if (isIntro || isBreak) return;

    // BPM e timing
    const bpm = params.bpm;
    const measureDur = (60 / bpm) * 4;
    const sixteenth = measureDur / 16;
    const eighth = measureDur / 8;

    // Tonalità
    const root = params.tonalCenter.replace(/[0-9]/g, "");
    const scaleType = params.scaleType;

    // Scala (semplice)
    const scales = {
        naturalMinor:  [0, 2, 3, 5, 7, 8, 10],
        harmonicMinor: [0, 2, 3, 5, 7, 8, 11]
    };
    const intervals = scales[scaleType] || scales.naturalMinor;

    function scaleNote(degree, octave = 4) {
        const base = Tone.Frequency(root + octave).toMidi();
        const semi = intervals[degree % intervals.length];
        return Tone.Frequency(base + semi, "midi").toNote();
    }

    // ------------------------------------------------------------
    // 1. PATTERN LEAD PER STILE
    // ------------------------------------------------------------

    const leadPatterns = {
        Gigi:      [0, 2, 4, 5, 4, 2, 0, null], // dream/piano
        Prezioso:  [0, null, 2, null, 4, null, 2, null], // sincopato
        Eiffel65:  [0, 0, 4, 4, 0, 0, 4, 4], // robotico ottave
        GabryPonte:[0, 3, 4, 2, 0, 5, 4, 3] // anthem
    };

    const pattern = leadPatterns[style] || leadPatterns.Prezioso;

    // ------------------------------------------------------------
    // 2. SCELTA STRUMENTO LEAD PER STILE
    // ------------------------------------------------------------

    const leadInstrument = {
        Gigi: piano,
        Prezioso: leadSaw,
        Eiffel65: leadSynthBrass1,
        GabryPonte: leadSynthBrass2
    }[style] || leadSaw;

    // ------------------------------------------------------------
    // 3. VOLUME LEAD PER SEZIONE
    // ------------------------------------------------------------

    let leadGain = 0.5;
    if (isBuild) leadGain = 0.3;
    if (isDrop)  leadGain = 0.9;
    if (isChorus) leadGain = 0.8;

    // ------------------------------------------------------------
    // 4. SCHEDULAZIONE LEAD
    // ------------------------------------------------------------

    for (let m = 0; m < section.measures; m++) {
        const t0 = section.startTime + m * measureDur;

        pattern.forEach((degree, i) => {
            if (degree === null) return;

            const t = t0 + i * eighth;
            const note = scaleNote(degree, isDrop ? 5 : 4);

            Tone.Transport.schedule(time => {
                leadInstrument.triggerAttackRelease(note, "8n", time, leadGain);
                if (score) score.addNote("Lead", note, section.name);
            }, t);
        });
    }
}
