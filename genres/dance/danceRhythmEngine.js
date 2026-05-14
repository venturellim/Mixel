// danceRhythmEngine.js — Kick/Clap/Hat + Bassline + Pad + FX
import * as Tone from "https://esm.sh/tone";

console.log("danceRhythmEngine.js ver. 002.3 loaded");

// ------------------------------------------------------------
//  BASSLINE FUNCTIONS
// ------------------------------------------------------------

function bassGigi(root, t0, sixteenth, bass, score, sectionName) {
    const pattern = [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0];

    pattern.forEach((p, i) => {
        if (!p) return;
        const t = t0 + i * sixteenth;
        Tone.Transport.schedule(time => {
            const note = root + "2";
            bass.triggerAttackRelease(note, "8n", time);
            if (score) score.addNote("Bass", note, sectionName);
        }, t);
    });
}

function bassPrezioso(root, t0, eighth, bass, score, sectionName) {
    for (let i = 0; i < 8; i++) {
        const t = t0 + i * eighth;
        Tone.Transport.schedule(time => {
            const note = root + "2";
            bass.triggerAttackRelease(note, "16n", time);
            if (score) score.addNote("Bass", note, sectionName);
        }, t);
    }
}

function bassEiffel(root, t0, sixteenth, bass, score, sectionName) {
    const fifth = Tone.Frequency(root + "2").transpose(7).toNote();

    for (let i = 0; i < 16; i++) {
        const t = t0 + i * sixteenth;
        const note = (i % 2 === 0) ? root + "2" : fifth;
        Tone.Transport.schedule(time => {
            bass.triggerAttackRelease(note, "16n", time);
            if (score) score.addNote("Bass", note, sectionName);
        }, t);
    }
}

function bassGabry(root, t0, sixteenth, bass, score, sectionName) {
    const low  = root + "2";
    const high = root + "3";

    const pattern = [low, null, high, null, low, high, null, null];

    pattern.forEach((note, i) => {
        if (!note) return;
        const t = t0 + i * sixteenth;
        Tone.Transport.schedule(time => {
            bass.triggerAttackRelease(note, "16n", time);
            if (score) score.addNote("Bass", note, sectionName);
        }, t);
    });
}

const styleBass = {
    Gigi: bassGigi,
    Prezioso: bassPrezioso,
    Eiffel65: bassEiffel,
    GabryPonte: bassGabry
};

// ------------------------------------------------------------
//  FUNZIONE PRINCIPALE
// ------------------------------------------------------------

export function scheduleDanceRhythm(
    section,
    instruments,
    params,
    style,
    score,
    rand
) {
    const {
        percussion,
        bass,
        warmPad,
        wavePad,
        glassPad,
        bellsPad,
        shakuPad,
        StStringPad,
        fxSweep,
        fxNoise,
        fxJump,
        fxFantasy,
        fxHeaven,
        fxHardFTCore
    } = instruments;

    if (!percussion || !bass) return;

    const bpm = params.bpm;
    const measureDur = (60 / bpm) * 4;
    const step = measureDur / 4;
    const eighth = measureDur / 8;
    const sixteenth = measureDur / 16;

    const name = section.name.toLowerCase();
    const isBuild = name.includes("build");
    const isDrop  = name.includes("drop");
    const isBreak = name.includes("break");
    const isIntro = name.includes("intro");
    const isChorus = name.includes("chorus");

    const bassFn = styleBass[style] || bassPrezioso;

    // ------------------------------------------------------------
    // PAD: scelta set in base allo style
    // ------------------------------------------------------------
    const padSets = {
        Gigi:      [warmPad, StStringPad],
        Prezioso:  [wavePad, warmPad],
        Eiffel65:  [glassPad, bellsPad],
        GabryPonte:[warmPad, wavePad]
    };
    const [padA, padB] = padSets[style] || [warmPad, wavePad];

    const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";

    const triads = {
        naturalMinor:  [0, 3, 7],
        harmonicMinor: [0, 3, 7],
        major:         [0, 4, 7]
    };
    const intervals = triads[scaleType] || triads.naturalMinor;

    function buildChord(root) {
        const baseMidi = Tone.Frequency(root + "3").toMidi();
        return intervals.map(semi => Tone.Frequency(baseMidi + semi, "midi").toNote());
    }

    let padGain = 0.4;
    if (isIntro) padGain = 0.2;
    if (isBuild) padGain = 0.15;
    if (isDrop)  padGain = 0.7;
    if (isBreak) padGain = 0.1;
    if (isChorus) padGain = 0.6;

// ------------------------------------------------------------
// TONAL CENTER FIX (robusto e coerente)
// ------------------------------------------------------------
let tonal = params?.tonalCenter ?? params?.imageParams?.tonalCenter ?? "C4";

// fallback se formato invalido
if (typeof tonal !== "string" || tonal.length < 2) {
    tonal = "C4";
}

// estrai nota e ottava (es. "F#3" → "F#", "3")
const match = tonal.match(/^([A-G][#b]?)(\d)$/);
const rootNote = match ? match[1] : "C";
const rootOct  = match ? match[2] : "4";

// radice sicura per bassline
const safeRoot = rootNote;

    const chord = buildChord(rootNote);

    // ------------------------------------------------------------
    // FX BUILD-UP GLOBALI (una volta per sezione)
    // ------------------------------------------------------------
    if (isBuild) {
        // Sweep lungo
        Tone.Transport.schedule(time => {
            fxSweep.triggerAttackRelease("C4", measureDur * section.measures, time, 0.6);
            if (score) score.addNote("FX", "Sweep", section.name);
        }, section.startTime);

        // Noise pulsante ogni mezza misura
        for (let m2 = 0; m2 < section.measures; m2++) {
            const tNoise = section.startTime + m2 * measureDur + measureDur * 0.5;
            Tone.Transport.schedule(time => {
                fxNoise.triggerAttackRelease("C4", "8n", time, 0.4);
                if (score) score.addNote("FX", "Noise", section.name);
            }, tNoise);
        }
    }

    // FX DROP IMPACT (solo all’inizio sezione)
    if (isDrop) {
        const tImpact = section.startTime;

        Tone.Transport.schedule(time => {
            fxHardFTCore.triggerAttackRelease("C4", "2n", time, 0.9);
            if (score) score.addNote("FX", "Impact", section.name);
        }, tImpact);

        Tone.Transport.schedule(time => {
            fxJump.triggerAttackRelease("C4", "8n", time, 0.7);
            if (score) score.addNote("FX", "Jump", section.name);
        }, tImpact + 0.1);
    }

    // FX BREAK (respiro)
    if (isBreak) {
        Tone.Transport.schedule(time => {
            fxFantasy.triggerAttackRelease("C4", "1n", time, 0.4);
            if (score) score.addNote("FX", "Fantasy", section.name);
        }, section.startTime);
    }

    // ------------------------------------------------------------
    // LOOP MISURE
    // ------------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {
        const t0 = section.startTime + m * measureDur;

        // CRASH all’inizio sezione
        if (m === 0) {
            Tone.Transport.schedule(time => {
                percussion.player("crash").start(time);
                if (score) score.addNote("Drums", "Crash", section.name);
            }, t0);
        }

        // KICK 4/4
        for (let i = 0; i < 4; i++) {
            if (isBreak && i !== 0) continue;
            const t = t0 + i * step;
            Tone.Transport.schedule(time => {
                percussion.player("bassDrum").start(time);
                if (score) score.addNote("Drums", "Kick", section.name);
            }, t);
        }

        // CLAP sul 2 e 4
        if (!isIntro) {
            [1, 3].forEach(i => {
                const t = t0 + i * step;
                Tone.Transport.schedule(time => {
                    percussion.player("handClap").start(time);
                    if (score) score.addNote("Drums", "Snare", section.name);
                }, t);
            });
        }

        // HI-HAT
        for (let i = 0; i < 8; i++) {
            const t = t0 + i * eighth;

            if (isBuild || isDrop || i % 2 === 0) {
                Tone.Transport.schedule(time => {
                    percussion.player("closedHat").start(time);
                    if (score) score.addNote("Drums", "HiHat", section.name);
                }, t);
            }
        }

        // MINI TRANSIZIONI FX (noise corto verso fine misura, solo in build)
        if (isBuild) {
            const tMini = t0 + measureDur * 0.75;
            Tone.Transport.schedule(time => {
                fxNoise.triggerAttackRelease("C4", "16n", time, 0.3);
                if (score) score.addNote("FX", "NoiseMini", section.name);
            }, tMini);
        }

        // PAD: un accordo per misura
        Tone.Transport.schedule(time => {
            chord.forEach(n => {
                if (padA) padA.triggerAttackRelease(n, measureDur * 0.95, time, padGain);
                if (padB) padB.triggerAttackRelease(n, measureDur * 0.95, time, padGain * 0.8);
                if (score) score.addNote("Pad", n, section.name);
            });
        }, t0);
        
// ------------------------------------------------------------
// BASSLINE
// ------------------------------------------------------------
bassFn(safeRoot, t0, sixteenth, bass, score, section.name);


    }
}

