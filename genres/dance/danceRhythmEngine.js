// danceRhythmEngine.js — Kick/Clap/Hat + Bassline + Pad + FX
import * as Tone from "https://esm.sh/tone";

import { normalizeNote } from "./danceInstruments.js";

console.log("danceRhythmEngine.js ver. 005 FINALE loaded");

// ------------------------------------------------------------
// FUNZIONI DI SICUREZZA
// ------------------------------------------------------------

function safeTrigger(instrument, note, duration, time, velocity = 0.5, instrumentName = "unknown") {
    if (!instrument) {
        console.warn(`⚠️ ${instrumentName}: instrument is null/undefined`);
        return false;
    }
    
    if (typeof instrument.triggerAttackRelease !== 'function') {
        console.warn(`⚠️ ${instrumentName}: triggerAttackRelease not a function`);
        return false;
    }
    
    if (!note || typeof note !== 'string') {
        console.warn(`⚠️ ${instrumentName}: invalid note "${note}"`);
        return false;
    }
    
    if (time === undefined || time === null || isNaN(time)) {
        console.warn(`⚠️ ${instrumentName}: invalid time ${time}`);
        return false;
    }
    
    try {
        instrument.triggerAttackRelease(note, duration, time, velocity);
        return true;
    } catch (e) {
        console.warn(`⚠️ ${instrumentName} failed for note ${note}:`, e.message);
        return false;
    }
}

function safePlayPercussion(percussion, soundName, time, score, sectionName) {
    if (!percussion || !percussion.player) {
        console.warn(`⚠️ Percussion not ready for ${soundName}`);
        return false;
    }
    
    const player = percussion.player(soundName);
    if (!player) {
        console.warn(`⚠️ Percussion sound "${soundName}" not found`);
        return false;
    }
    
    if (time === undefined || time === null || isNaN(time)) {
        console.warn(`⚠️ Invalid time for percussion ${soundName}`);
        return false;
    }
    
    try {
        player.start(time);
        if (score) score.addNote("Drums", soundName, sectionName);
        return true;
    } catch (e) {
        console.warn(`⚠️ Failed to play "${soundName}":`, e.message);
        return false;
    }
}

// ------------------------------------------------------------
// BASSLINE FUNCTIONS
// ------------------------------------------------------------

function getBassOctave(root) {
    const octave2Notes = ["C", "E"];
    const octave3Notes = ["C", "F#"];
    
    if (octave2Notes.includes(root)) return "2";
    if (octave3Notes.includes(root)) return "3";
    return "2";
}

function bassGigi(root, t0, sixteenth, bass, score, sectionName) {
    const pattern = [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0];
    const bassOctave = getBassOctave(root);
    const note = root + bassOctave;

    pattern.forEach((p, i) => {
        if (!p) return;
        const t = t0 + i * sixteenth;
        Tone.Transport.schedule(time => {
            safeTrigger(bass, note, "8n", time, 0.6, "Bass");
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
            safeTrigger(bass, note, "16n", time, 0.6, "Bass");
            if (score) score.addNote("Bass", note, sectionName);
        }, t);
    }
}

function bassEiffel(root, t0, sixteenth, bass, score, sectionName) {
    const bassOctave = getBassOctave(root);
    const rootNote = root + bassOctave;
    
    let fifth;
    try {
        fifth = Tone.Frequency(rootNote).transpose(7).toNote();
    } catch (e) {
        fifth = rootNote;
    }

    for (let i = 0; i < 16; i++) {
        const t = t0 + i * sixteenth;
        const note = (i % 2 === 0) ? rootNote : fifth;
        Tone.Transport.schedule(time => {
            safeTrigger(bass, note, "16n", time, 0.6, "Bass");
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
            safeTrigger(bass, note, "16n", time, 0.6, "Bass");
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
// PAD SAFE NOTES
// ------------------------------------------------------------

const PAD_SAFE_NOTES = {
    warmPad: ["C3", "F#3", "C4", "F#4"],
    wavePad: ["C3", "E3", "C4", "E4"],
    glassPad: ["C2", "C3", "C4"],
    bellsPad: ["C2", "C3", "C4", "C5"],
    StStringPad: ["C2", "C3", "C4", "C5"],
    shakuPad: ["C3", "F#3", "C4", "F#4"]
};

function getSafePadNote(rawNote, padName) {
    if (!padName || !PAD_SAFE_NOTES[padName]) {
        return rawNote;
    }
    
    const safeNotes = PAD_SAFE_NOTES[padName];
    if (safeNotes.includes(rawNote)) return rawNote;
    
    try {
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
    } catch (e) {
        return safeNotes[0];
    }
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
    try {
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

        if (!percussion || !bass) {
            console.warn("⚠️ Missing percussion or bass");
            return;
        }

        const bpm = params.bpm;
        if (!bpm || isNaN(bpm)) {
            console.warn("⚠️ Invalid BPM:", bpm);
            return;
        }
        
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
        // PAD SETUP
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
        // TONAL CENTER
        // ------------------------------------------------------------
        let tonal = params?.tonalCenter ?? params?.imageParams?.tonalCenter ?? "C4";

        if (typeof tonal !== "string" || tonal.length < 2) {
            tonal = "C4";
        }

        const match = tonal.match(/^([A-G][#b]?)(\d)$/);
        let rootNoteRaw = match ? match[1] : "C";
        
        const safeRootForBass = normalizeNote(rootNoteRaw, "bass");
        const safeRootForPad = normalizeNote(rootNoteRaw, "pad");

        function buildChord(root, padName) {
            try {
                const baseMidi = Tone.Frequency(root + "3").toMidi();
                const rawNotes = intervals.map(semi => Tone.Frequency(baseMidi + semi, "midi").toNote());
                return rawNotes.map(note => getSafePadNote(note, padName));
            } catch (e) {
                console.warn("⚠️ buildChord failed:", e.message);
                return [root + "3", root + "4"];
            }
        }

        let padGain = 0.4;
        if (isIntro) padGain = 0.2;
        if (isBuild) padGain = 0.15;
        if (isDrop)  padGain = 0.7;
        if (isBreak) padGain = 0.1;
        if (isChorus) padGain = 0.6;

        // FX note sicura
        const fxNote = "C4";

        // ------------------------------------------------------------
        // FX BUILD-UP
        // ------------------------------------------------------------
        if (isBuild) {
            if (fxSweep) {
                Tone.Transport.schedule(time => {
                    safeTrigger(fxSweep, fxNote, measureDur * section.measures, time, 0.6, "Sweep");
                    if (score) score.addNote("FX", "Sweep", section.name);
                }, section.startTime);
            }

            for (let m2 = 0; m2 < section.measures; m2++) {
                const tNoise = section.startTime + m2 * measureDur + measureDur * 0.5;
                if (fxNoise) {
                    Tone.Transport.schedule(time => {
                        safeTrigger(fxNoise, fxNote, "8n", time, 0.4, "Noise");
                        if (score) score.addNote("FX", "Noise", section.name);
                    }, tNoise);
                }
            }
        }

        // FX DROP IMPACT
        if (isDrop) {
            const tImpact = section.startTime;
            
            if (fxHardFTCore) {
                Tone.Transport.schedule(time => {
                    safeTrigger(fxHardFTCore, fxNote, "2n", time, 0.9, "HardFTCore");
                    if (score) score.addNote("FX", "Impact", section.name);
                }, tImpact);
            }

            if (fxJump) {
                Tone.Transport.schedule(time => {
                    safeTrigger(fxJump, fxNote, "8n", time, 0.7, "Jump");
                    if (score) score.addNote("FX", "Jump", section.name);
                }, tImpact + 0.1);
            }
        }

        // FX BREAK
        if (isBreak && fxFantasy) {
            Tone.Transport.schedule(time => {
                safeTrigger(fxFantasy, fxNote, "1n", time, 0.4, "Fantasy");
                if (score) score.addNote("FX", "Fantasy", section.name);
            }, section.startTime);
        }

        // ------------------------------------------------------------
        // LOOP MISURE
        // ------------------------------------------------------------
        for (let m = 0; m < section.measures; m++) {
            const t0 = section.startTime + m * measureDur;

            // CRASH all'inizio sezione
            if (m === 0) {
                Tone.Transport.schedule(time => {
                    safePlayPercussion(percussion, "crash", time, score, section.name);
                }, t0);
            }

            // KICK 4/4
            for (let i = 0; i < 4; i++) {
                if (isBreak && i !== 0) continue;
                const t = t0 + i * step;
                Tone.Transport.schedule(time => {
                    safePlayPercussion(percussion, "bassDrum", time, score, section.name);
                }, t);
            }

            // CLAP sul 2 e 4
            if (!isIntro) {
                [1, 3].forEach(i => {
                    const t = t0 + i * step;
                    Tone.Transport.schedule(time => {
                        safePlayPercussion(percussion, "handClap", time, score, section.name);
                    }, t);
                });
            }

            // HI-HAT
            for (let i = 0; i < 8; i++) {
                const t = t0 + i * eighth;
                if (isBuild || isDrop || i % 2 === 0) {
                    Tone.Transport.schedule(time => {
                        safePlayPercussion(percussion, "closedHat", time, score, section.name);
                    }, t);
                }
            }

            // MINI TRANSIZIONI FX
            if (isBuild && fxNoise) {
                const tMini = t0 + measureDur * 0.75;
                Tone.Transport.schedule(time => {
                    safeTrigger(fxNoise, fxNote, "16n", time, 0.3, "NoiseMini");
                    if (score) score.addNote("FX", "NoiseMini", section.name);
                }, tMini);
            }

            // PAD: accordi per misura
            if (padA && padA.inst) {
                const chordA = buildChord(safeRootForPad, padA.name);
                Tone.Transport.schedule(time => {
                    chordA.forEach(n => {
                        safeTrigger(padA.inst, n, measureDur * 0.95, time, padGain, padA.name);
                        if (score) score.addNote("Pad", n, section.name);
                    });
                }, t0);
            }
            
            if (padB && padB.inst) {
                const chordB = buildChord(safeRootForPad, padB.name);
                Tone.Transport.schedule(time => {
                    chordB.forEach(n => {
                        safeTrigger(padB.inst, n, measureDur * 0.95, time, padGain * 0.8, padB.name);
                    });
                }, t0);
            }
            
            // BASSLINE
            try {
                bassFn(safeRootForBass, t0, sixteenth, bass, score, section.name);
            } catch (e) {
                console.warn("⚠️ Bassline failed:", e.message);
            }
        }
    } catch (outerError) {
        console.error("❌ FATAL ERROR in scheduleDanceRhythm:", outerError);
        console.trace();
    }
}

