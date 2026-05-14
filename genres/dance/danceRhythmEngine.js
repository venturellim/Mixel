// danceRhythmEngine.js — versione 004 con normalizzazione completa
import * as Tone from "https://esm.sh/tone";

import { normalizeNote } from "./danceInstruments.js";

console.log("danceRhythmEngine.js ver. 004 loaded");

// ------------------------------------------------------------
// BASSLINE FUNCTIONS (corrette con ottave sicure)
// ------------------------------------------------------------

// Ottava sicura per il basso: il sampler ha C2, C3, E2, F#3
// Usiamo ottava 2 o 3 in base alla root
function getBassOctave(root) {
    // Note che esistono a ottava 2: C2, E2
    // Note che esistono a ottava 3: C3, F#3
    const octave2Notes = ["C", "E"];
    const octave3Notes = ["C", "F#"];
    
    if (octave2Notes.includes(root)) return "2";
    if (octave3Notes.includes(root)) return "3";
    return "2"; // fallback
}

function bassGigi(root, t0, sixteenth, bass, score, sectionName) {
    const pattern = [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0];
    const bassOctave = getBassOctave(root);
    const note = root + bassOctave;

    pattern.forEach((p, i) => {
        if (!p) return;
        const t = t0 + i * sixteenth;
        Tone.Transport.schedule(time => {
            bass.triggerAttackRelease(note, "8n", time);
            if (score) score.addNote("Bass", note, sectionName);
        }, t);
    });
}

function bassPrezioso(root, t0, eighth, bass, score, sectionName) {
    const bassOctave = getBassOctave(root);
    const note = root + bassOctave;
    
    for (let i = 0; i < 8; i++) {
        const t = t0 + i * eighth;
        Tone.Transport.schedule(time => {
            bass.triggerAttackRelease(note, "16n", time);
            if (score) score.addNote("Bass", note, sectionName);
        }, t);
    }
}

function bassEiffel(root, t0, sixteenth, bass, score, sectionName) {
    const bassOctave = getBassOctave(root);
    const rootNote = root + bassOctave;
    const fifth = Tone.Frequency(rootNote).transpose(7).toNote();

    for (let i = 0; i < 16; i++) {
        const t = t0 + i * sixteenth;
        const note = (i % 2 === 0) ? rootNote : fifth;
        Tone.Transport.schedule(time => {
            bass.triggerAttackRelease(note, "16n", time);
            if (score) score.addNote("Bass", note, sectionName);
        }, t);
    }
}

function bassGabry(root, t0, sixteenth, bass, score, sectionName) {
    const bassOctave = getBassOctave(root);
    const low  = root + bassOctave;
    const high = root + (parseInt(bassOctave) + 1);

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
// FUNZIONE PER GENERARE ACCORDI SICURI PER I PAD
// ------------------------------------------------------------

// Note sicure per i pad (basate sui sample disponibili)
const PAD_SAFE_NOTES = {
    warmPad: ["C3", "F#3", "C4", "F#4"],
    wavePad: ["C3", "E3", "C4", "E4"],
    glassPad: ["C2", "C3", "C4"],
    bellsPad: ["C2", "C3", "C4", "C5"],
    StStringPad: ["C2", "C3", "C4", "C5"],
    shakuPad: ["C3", "F#3", "C4", "F#4"]
};

function getSafePadNote(rawNote, padInstrument) {
    // Se non abbiamo la mappa per questo pad, restituisci la nota originale
    if (!padInstrument || !PAD_SAFE_NOTES[padInstrument.name]) {
        return rawNote;
    }
    
    const safeNotes = PAD_SAFE_NOTES[padInstrument.name];
    if (safeNotes.includes(rawNote)) return rawNote;
    
    // Trova la nota più vicina
    const rawMidi = Tone.Frequency(rawNote).toMidi();
    let best = safeNotes[0];
    let bestDist = Infinity;
    
    for (const safe of safeNotes) {
        const safeMidi = Tone.Frequency(safe).toMidi();
        const dist = Math.abs(rawMidi - safeMidi);
        if (dist < bestDist) {
            bestDist = dist;
            best = safe;
        }
    }
    
    return best;
}

// ------------------------------------------------------------
// FUNZIONE PRINCIPALE
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
        Gigi:      [{ inst: warmPad, name: "warmPad" }, { inst: StStringPad, name: "StStringPad" }],
        Prezioso:  [{ inst: wavePad, name: "wavePad" }, { inst: warmPad, name: "warmPad" }],
        Eiffel65:  [{ inst: glassPad, name: "glassPad" }, { inst: bellsPad, name: "bellsPad" }],
        GabryPonte:[{ inst: warmPad, name: "warmPad" }, { inst: wavePad, name: "wavePad" }]
    };
    const [padA, padB] = padSets[style] || padSets.Prezioso;

    const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";

    const triads = {
        naturalMinor:  [0, 3, 7],
        harmonicMinor: [0, 3, 7],
        major:         [0, 4, 7]
    };
    const intervals = triads[scaleType] || triads.naturalMinor;

    // ------------------------------------------------------------
    // TONAL CENTER con normalizzazione
    // ------------------------------------------------------------
    let tonal = params?.tonalCenter ?? params?.imageParams?.tonalCenter ?? "C4";

    if (typeof tonal !== "string" || tonal.length < 2) {
        tonal = "C4";
    }

    const match = tonal.match(/^([A-G][#b]?)(\d)$/);
    let rootNoteRaw = match ? match[1] : "C";
    let rootOct = match ? match[2] : "4";

    // Normalizza root per bass e pad separatamente
    const safeRootForBass = normalizeNote(rootNoteRaw, "bass");
    const safeRootForPad = normalizeNote(rootNoteRaw, "pad");

    // Funzione per costruire accordi con note normalizzate
    function buildChord(root, padInst) {
        const baseMidi = Tone.Frequency(root + "3").toMidi();
        const rawNotes = intervals.map(semi => Tone.Frequency(baseMidi + semi, "midi").toNote());
        
        // Normalizza ogni nota del accordo per questo pad specifico
        return rawNotes.map(note => getSafePadNote(note, padInst));
    }

    let padGain = 0.4;
    if (isIntro) padGain = 0.2;
    if (isBuild) padGain = 0.15;
    if (isDrop)  padGain = 0.7;
    if (isBreak) padGain = 0.1;
    if (isChorus) padGain = 0.6;

    // ------------------------------------------------------------
    // FX NOTE SICURE
    // ------------------------------------------------------------
    // Gli FX hanno principalmente C4, alcuni hanno anche C3, C5
    const fxNote = "C4";  // sicuro per tutti gli FX

    // ------------------------------------------------------------
    // FX BUILD-UP GLOBALI
    // ------------------------------------------------------------
    if (isBuild && fxSweep && fxNoise) {
        Tone.Transport.schedule(time => {
            if (fxSweep.triggerAttackRelease) {
                fxSweep.triggerAttackRelease(fxNote, measureDur * section.measures, time, 0.6);
                if (score) score.addNote("FX", "Sweep", section.name);
            }
        }, section.startTime);

        for (let m2 = 0; m2 < section.measures; m2++) {
            const tNoise = section.startTime + m2 * measureDur + measureDur * 0.5;
            Tone.Transport.schedule(time => {
                if (fxNoise.triggerAttackRelease) {
                    fxNoise.triggerAttackRelease(fxNote, "8n", time, 0.4);
                    if (score) score.addNote("FX", "Noise", section.name);
                }
            }, tNoise);
        }
    }

    // FX DROP IMPACT
    if (isDrop && fxHardFTCore && fxJump) {
        const tImpact = section.startTime;

        Tone.Transport.schedule(time => {
            if (fxHardFTCore.triggerAttackRelease) {
                fxHardFTCore.triggerAttackRelease(fxNote, "2n", time, 0.9);
                if (score) score.addNote("FX", "Impact", section.name);
            }
        }, tImpact);

        Tone.Transport.schedule(time => {
            if (fxJump.triggerAttackRelease) {
                fxJump.triggerAttackRelease(fxNote, "8n", time, 0.7);
                if (score) score.addNote("FX", "Jump", section.name);
            }
        }, tImpact + 0.1);
    }

    // FX BREAK
    if (isBreak && fxFantasy) {
        Tone.Transport.schedule(time => {
            if (fxFantasy.triggerAttackRelease) {
                fxFantasy.triggerAttackRelease(fxNote, "1n", time, 0.4);
                if (score) score.addNote("FX", "Fantasy", section.name);
            }
        }, section.startTime);
    }

    // ------------------------------------------------------------
    // LOOP MISURE
    // ------------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {
        const t0 = section.startTime + m * measureDur;

        // CRASH all'inizio sezione
        if (m === 0 && percussion) {
            Tone.Transport.schedule(time => {
                if (percussion.player && percussion.player("crash")) {
                    percussion.player("crash").start(time);
                    if (score) score.addNote("Drums", "Crash", section.name);
                }
            }, t0);
        }

        // KICK 4/4
        for (let i = 0; i < 4; i++) {
            if (isBreak && i !== 0) continue;
            const t = t0 + i * step;
            Tone.Transport.schedule(time => {
                if (percussion && percussion.player("bassDrum")) {
                    percussion.player("bassDrum").start(time);
                    if (score) score.addNote("Drums", "Kick", section.name);
                }
            }, t);
        }

        // CLAP sul 2 e 4
        if (!isIntro && percussion) {
            [1, 3].forEach(i => {
                const t = t0 + i * step;
                Tone.Transport.schedule(time => {
                    if (percussion.player("handClap")) {
                        percussion.player("handClap").start(time);
                        if (score) score.addNote("Drums", "Snare", section.name);
                    }
                }, t);
            });
        }

        // HI-HAT
        for (let i = 0; i < 8; i++) {
            const t = t0 + i * eighth;
            if ((isBuild || isDrop || i % 2 === 0) && percussion) {
                Tone.Transport.schedule(time => {
                    if (percussion.player("closedHat")) {
                        percussion.player("closedHat").start(time);
                        if (score) score.addNote("Drums", "HiHat", section.name);
                    }
                }, t);
            }
        }

        // MINI TRANSIZIONI FX
        if (isBuild && fxNoise) {
            const tMini = t0 + measureDur * 0.75;
            Tone.Transport.schedule(time => {
                if (fxNoise.triggerAttackRelease) {
                    fxNoise.triggerAttackRelease(fxNote, "16n", time, 0.3);
                    if (score) score.addNote("FX", "NoiseMini", section.name);
                }
            }, tMini);
        }

        // PAD: accordi per misura (con note sicure)
        const chordA = buildChord(safeRootForPad, padA);
        const chordB = buildChord(safeRootForPad, padB);
        
        Tone.Transport.schedule(time => {
            chordA.forEach(n => {
                if (padA && padA.inst && padA.inst.triggerAttackRelease) {
                    padA.inst.triggerAttackRelease(n, measureDur * 0.95, time, padGain);
                    if (score) score.addNote("Pad", n, section.name);
                }
            });
            chordB.forEach(n => {
                if (padB && padB.inst && padB.inst.triggerAttackRelease) {
                    padB.inst.triggerAttackRelease(n, measureDur * 0.95, time, padGain * 0.8);
                }
            });
        }, t0);
        
        // BASSLINE
        bassFn(safeRootForBass, t0, sixteenth, bass, score, section.name);
    }
}

