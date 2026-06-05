// ============================================================
// leadPadEngine.js — Pad Engine per Ballad + Epic
// ============================================================

console.log("padEngine.js ver. 001 loaded");

// ------------------------------------------------------------
// IMPORT
// ------------------------------------------------------------

import * as Tone from "https://esm.sh/tone";

import { normalizeNote } from "../metal/metalInstruments.js";

export const leadPadRhythmLibrary = {

    // EPIC STATIC — accordi lunghi
    static: [
        [0],            // un colpo all'inizio
        [0, 8],         // due colpi per misura
        [0, 4, 8, 12],  // quattro colpi (stile rhapsody)
    ],

    // EPIC MOTION — movimento interno lento
    motion: [
        [0, 2, 4, 6],   // movimento lento
        [0, 3, 6, 9],   // movimento più largo
        [0, 4, 8, 12],  // movimento quadrato
    ],

    // ARP SLOW — arpeggi lenti
    arpSlow: [
        [0, 4, 8, 12],  // arpeggio su 4 punti
        [0, 2, 6, 10],  // arpeggio più “turilli”
        [0, 3, 7, 11],  // arpeggio più “fantasy”
    ],

    // OCTAVE SPREAD — chorus epico
    octaveSpread: [
        [0, 8],         // due colpi larghi
        [0, 4, 8, 12],  // pieno
        [0, 6, 12],     // spread più aperto
    ]
};

export const leadPadMelodicLibrary = {

    // ============================================================
    // 1) BALLAD — linee morbide, lente, emotive
    // ============================================================
    ballad: [
        [0, 2, 4, 5, 4, 2, 0],          // salita e discesa morbida
        [0, 4, 7, 4, 2, 0],             // triade ariosa
        [0, 3, 5, 7, 5, 3, 0],          // frase “romantica”
        [0, 2, 5, 7, 5, 2, 0],          // più aperta
        [0, 5, 4, 2, 0],                // discendente emotiva
        [0, 7, 5, 4, 2, 0]              // più ampia
    ],

    // ============================================================
    // 2) EPIC INTRO — Turilli / Stratovarius style
    // ============================================================
    epicIntro: [
        [0, 4, 7, 12, 7, 4, 0],         // frase ampia, “heroic”
        [0, 5, 7, 10, 7, 5, 0],         // più fantasy
        [0, 3, 7, 10, 7, 3, 0],         // più drammatica
        [0, 7, 12, 7, 5, 3, 0],         // molto epica
        [0, 4, 5, 7, 5, 4, 0],          // motion morbido
        [0, 2, 4, 7, 4, 2, 0]           // frase “turilli”
    ],

    // ============================================================
    // 3) EPIC MOTION — movimento interno continuo
    // ============================================================
    motion: [
        [0, 2, 4, 2, 5, 4, 2, 0],       // ondeggiamento
        [0, 3, 5, 3, 7, 5, 3, 0],       // più fantasy
        [0, 4, 7, 4, 9, 7, 4, 0],       // molto epico
        [0, 2, 5, 2, 7, 5, 2, 0],       // più aperto
        [0, 5, 7, 5, 9, 7, 5, 0],       // più brillante
        [0, 7, 5, 4, 2, 4, 5, 7]        // discendente/ascendente
    ],

    // ============================================================
    // 4) COUNTERLEAD — contrappunti morbidi
    // ============================================================
    counter: [
        [0, 2, 3, 5, 3, 2, 0],          // contrappunto leggero
        [0, 4, 5, 7, 5, 4, 0],          // più classico
        [0, 3, 5, 8, 5, 3, 0],          // più fantasy
        [0, 2, 5, 9, 5, 2, 0],          // più aperto
        [0, 7, 5, 3, 2, 3, 5, 7],       // discendente/ascendente
        [0, 5, 4, 2, 0, 2, 4, 5]        // frase morbida
    ],

    // ============================================================
    // 5) EMOTIONAL — perfetto per ballad e outro
    // ============================================================
    emotional: [
        [0, 6, 5, 4, 2, 3, 2, 0],       // molto emotiva
        [2, 3, 2, 0, 4, 5, 4, 2],       // più dolce
        [0, 4, 6, 7, 6, 4, 2, 0],       // ampia
        [5, 4, 2, 0, 5, 4, 2, 0],       // discendente
        [0, 2, 4, 6, 4, 2, 0],          // semplice e pulita
        [4, 5, 7, 5, 4, 2, 0]           // frase finale
    ]
};

// ------------------------------------------------------------
// ENHANCER: padMotionEnhancer
// ------------------------------------------------------------
export function padMotionEnhancer(pad, time, params, rand) {

    // 1) Tremolo lentissimo
    if (!pad._padTremolo) {
        pad._padTremolo = new Tone.LFO({
            frequency: rand.range(0.05, 0.15),
            min: 0.85,
            max: 1.0
        }).start();
        pad._padTremolo.connect(pad.volume);
    }

    // 2) Filtro in movimento
    if (!pad._padFilter) {
        pad._padFilter = new Tone.Filter({
            type: "lowpass",
            frequency: 800,
            rolloff: -12
        }).connect(pad.output);

        pad.disconnect();
        pad.connect(pad._padFilter);

        pad._padFilterLFO = new Tone.LFO({
            frequency: rand.range(0.02, 0.08),
            min: 400,
            max: 1200
        }).start();
        pad._padFilterLFO.connect(pad._padFilter.frequency);
    }

    // 3) Micro‑velocity
    const vel = rand.range(0.75, 1.0);

    // 4) Vibrato leggerissimo
    if (!pad._padVibrato) {
        pad._padVibrato = new Tone.Vibrato({
            frequency: rand.range(4, 6),
            depth: 0.05
        }).connect(pad._padFilter);

        pad.disconnect();
        pad.connect(pad._padVibrato);
    }

    // 5) Stereo motion
    if (!pad._padPan) {
        pad._padPan = new Tone.Panner(0).connect(pad._padVibrato);
        pad.disconnect();
        pad.connect(pad._padPan);

        pad._padPanLFO = new Tone.LFO({
            frequency: rand.range(0.01, 0.03),
            min: -0.2,
            max: 0.2
        }).start();
        pad._padPanLFO.connect(pad._padPan.pan);
    }

    return vel;
}

// ------------------------------------------------------------
// PAD CHORD BUILDER — accordi veri per il pad
// ------------------------------------------------------------
export function buildPadChord(root, octave, type = "triad") {

    // Intervalli in semitoni
    const intervals = {
        triad:        [0, 4, 7],            // 1–3–5
        triad7:       [0, 4, 7, 11],        // 1–3–5–7
        triad9:       [0, 4, 7, 14],        // 1–3–5–9
        triad11:      [0, 4, 7, 17],        // 1–3–5–11
        open:         [0, 7, 12],           // 1–5–8 (aperto)
        open9:        [0, 7, 14],           // 1–5–9
        open11:       [0, 7, 17],           // 1–5–11
        low5:         [-5, 0, 7, 12],       // quinta bassa + triade
        epicSpread:   [0, 7, 12, 14, 19],   // 1–5–8–9–12 (epic)
        wide:         [0, 12, 19],          // 1–8–12 (super aperto)
        cinematic:    [0, 5, 12, 17],       // 1–4–8–11 (cinematic)
    };

    const chosen = intervals[type] || intervals.triad;

    const notes = chosen.map(semi => {
        const midi = Tone.Frequency(root + octave).toMidi() + semi;
        const note = Tone.Frequency(midi, "midi").toNote();
        return normalizeNote(note, "StStringPad");
    });

    return notes;
}

// ------------------------------------------------------------
// FUNZIONE PRINCIPALE: schedulePad() — con chord builder + motion melodico
// ------------------------------------------------------------
export function schedulePad(section, progression, instruments, params, rand) {

    const pad = instruments.StStringPad;
    if (!pad) return;

    const { melodicSpeed = 2, melodicDensity = 1 } = params;

    // --------------------------------------------------------
    // 1) Scegli libreria e tipo di accordo
    // --------------------------------------------------------
    let rhythmLib = null;
    let melodicLib = null;
    let chordType = "triad";

    switch (section.type) {
        case "ballad":
            melodicLib = leadPadMelodicLibrary.ballad;
            chordType = "open9";
            break;

        case "intro":
            melodicLib = leadPadMelodicLibrary.epicIntro;
            chordType = "cinematic";
            break;

        case "verse":
            rhythmLib = leadPadRhythmLibrary.static;
            chordType = "triad";
            break;

        case "prechorus":
            rhythmLib = leadPadRhythmLibrary.motion;
            chordType = "triad9";
            break;

        case "chorus":
            rhythmLib = leadPadRhythmLibrary.octaveSpread;
            chordType = "epicSpread";
            break;

        default:
            rhythmLib = leadPadRhythmLibrary.static;
            chordType = "triad";
            break;
    }

    // --------------------------------------------------------
    // 2) Scegli pattern
    // --------------------------------------------------------
    const pattern = melodicLib
        ? rand.pick(melodicLib)
        : rand.pick(rhythmLib);

    if (!pattern) return;

    // --------------------------------------------------------
    // 3) Determina la root dalla progression
    // --------------------------------------------------------
    const chordIndex = section.index % progression.length;
    const chordSymbol = progression[chordIndex]; // es: "Am", "F", "G"
    const root = chordSymbol.replace(/[^A-G#]/g, ""); // estrae "A" da "Am"
    const octave = 3;

    // --------------------------------------------------------
    // 4) Costruisci accordo base
    // --------------------------------------------------------
    const baseChord = buildPadChord(root, octave, chordType);

    // --------------------------------------------------------
    // 5) Scheduling step-based
    // --------------------------------------------------------
    const measureDur = Tone.Time("1m").toSeconds();
    const stepDur = measureDur / 16;

    pattern.forEach((value, index) => {

        // densità melodica
        if (melodicLib && (index % melodicDensity !== 0)) return;

        // velocità melodica
        const step = melodicLib
            ? index * melodicSpeed
            : value;

        const time = section.startTime + step * stepDur;

        // enhancer
        const vel = padMotionEnhancer(pad, time, params, rand);

        // nota alta
        let highNote;

        if (melodicLib) {
            const interval = value;
            const highMidi = Tone.Frequency(root + (octave + 2)).toMidi() + interval;
            highNote = normalizeNote(Tone.Frequency(highMidi, "midi").toNote(), "StStringPad");
        } else {
            highNote = normalizeNote(root + (octave + 2), "StStringPad");
        }

        const chord = [...baseChord, highNote];

        pad.triggerAttackRelease(chord, stepDur * 1.5, time, vel);
    });
}

// ------------------------------------------------------------
// EXPORT
// ------------------------------------------------------------
export const padEngine = {
    schedulePad,
    padMotionEnhancer
};
