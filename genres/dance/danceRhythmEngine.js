// danceRhythmEngine.js — Kick/Clap/Hat + Bassline + Pad + FX
// VER 006 CON LOG DI DEBUG COMPLETI
import * as Tone from "https://esm.sh/tone";

import { normalizeNote } from "./danceInstruments.js";

console.log("danceRhythmEngine.js ver. 006 DEBUG loaded");

// ------------------------------------------------------------
// FUNZIONI DI SICUREZZA CON LOG
// ------------------------------------------------------------

function safeTrigger(instrument, note, duration, time, velocity = 0.5, instrumentName = "unknown") {
    // Log parametri ricevuti
    console.log(`🔍 [safeTrigger] ${instrumentName}: note=${note}, duration=${duration}, time=${time}, vel=${velocity}`);
    
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
    
    // VALIDAZIONE DURATION
    let safeDuration = duration;
    if (duration === undefined || duration === null || isNaN(duration)) {
        console.warn(`⚠️ ${instrumentName}: invalid duration "${duration}", using "8n"`);
        safeDuration = "8n";
    }
    
    if (typeof safeDuration === 'number' && safeDuration <= 0) {
        console.warn(`⚠️ ${instrumentName}: duration <= 0 (${safeDuration}), using 0.1`);
        safeDuration = 0.1;
    }
    
    // Validazione velocity
    let safeVelocity = velocity;
    if (velocity === undefined || velocity === null || isNaN(velocity)) {
        safeVelocity = 0.5;
    }
    
    try {
        console.log(`✅ [safeTrigger] Executing: ${instrumentName}.triggerAttackRelease("${note}", ${safeDuration}, ${time}, ${safeVelocity})`);
        instrument.triggerAttackRelease(note, safeDuration, time, safeVelocity);
        return true;
    } catch (e) {
        console.error(`❌ ${instrumentName} failed for note ${note}:`, e.message);
        console.trace();
        return false;
    }
}

function safePlayPercussion(percussion, soundName, time, score, sectionName) {
    console.log(`🔍 [percussion] Playing ${soundName} at time ${time}`);
    
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
        console.log(`✅ [percussion] Started ${soundName} at ${time}`);
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
    
    console.log(`🎸 [Bass Gigi] root=${root}, note=${note}, t0=${t0}`);

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
    
    console.log(`🎸 [Bass Prezioso] root=${root}, note=${note}, t0=${t0}`);
    
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
    
    console.log(`🎸 [Bass Eiffel] root=${root}, rootNote=${rootNote}, fifth=${fifth}, t0=${t0}`);

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
    
    console.log(`🎸 [Bass Gabry] low=${low}, high=${high}, t0=${t0}`);

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
        console.log(`🔍 [Pad] Normalized ${rawNote} → ${best} for ${padName}`);
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
    console.log(`🎬 [scheduleDanceRhythm] START section: ${section.name}, style: ${style}`);
    console.log(`📊 section object:`, JSON.stringify({ name: section.name, measures: section.measures, startTime: section.startTime }));
    
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
        const quarterNote = measureDur / 4;
        
        console.log(`🎵 BPM=${bpm}, measureDur=${measureDur}, step=${step}, eighth=${eighth}, sixteenth=${sixteenth}`);

        // VALIDAZIONE CRITICA: section.measures
        if (section.measures === undefined || section.measures === null) {
            console.error(`❌ section.measures is undefined for section ${section.name}!`, section);
            return;
        }
        
        console.log(`📏 Section ${section.name} has ${section.measures} measures`);

        const name = section.name.toLowerCase();
        const isBuild = name.includes("build");
        const isDrop  = name.includes("drop");
        const isBreak = name.includes("break");
        const isIntro = name.includes("intro");
        const isChorus = name.includes("chorus");
        
        console.log(`🎯 Section flags: isBuild=${isBuild}, isDrop=${isDrop}, isBreak=${isBreak}, isIntro=${isIntro}, isChorus=${isChorus}`);

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
        
        console.log(`🎹 Pads: A=${padA?.name}, B=${padB?.name}`);

        const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";

        const triads = {
            naturalMinor:  [0, 3, 7],
            harmonicMinor: [0, 3, 7],
            major:         [0, 4, 7]
        };
        const intervals = triads[scaleType] || triads.naturalMinor;
        
        console.log(`🎼 Scale: ${scaleType}, intervals: [${intervals}]`);

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
        
        console.log(`🎵 Tonal: ${tonal}, rootRaw=${rootNoteRaw}, safeBass=${safeRootForBass}, safePad=${safeRootForPad}`);

        function buildChord(root, padName) {
            try {
                const baseMidi = Tone.Frequency(root + "3").toMidi();
                const rawNotes = intervals.map(semi => Tone.Frequency(baseMidi + semi, "midi").toNote());
                const safeNotes = rawNotes.map(note => getSafePadNote(note, padName));
                console.log(`🎹 [buildChord] root=${root}, raw=${rawNotes}, safe=${safeNotes}`);
                return safeNotes;
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
        
        console.log(`🎚️ Pad gain: ${padGain}`);

        // FX note sicura
        const fxNote = "C4";

        // ------------------------------------------------------------
        // FX BUILD-UP
        // ------------------------------------------------------------
        if (isBuild) {
            console.log(`🔊 Scheduling BUILD FX for section ${section.name}`);
            
            if (fxSweep) {
                const sweepDuration = (measureDur && section.measures) ? measureDur * section.measures : 4;
                console.log(`🔊 Sweep duration: ${sweepDuration} seconds`);
                
                Tone.Transport.schedule(time => {
                    safeTrigger(fxSweep, fxNote, sweepDuration, time, 0.6, "Sweep");
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
            console.log(`💥 Scheduling DROP FX for section ${section.name}`);
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
            console.log(`🌊 Scheduling BREAK FX for section ${section.name}`);
            Tone.Transport.schedule(time => {
                safeTrigger(fxFantasy, fxNote, "1n", time, 0.4, "Fantasy");
                if (score) score.addNote("FX", "Fantasy", section.name);
            }, section.startTime);
        }

        // ------------------------------------------------------------
        // LOOP MISURE
        // ------------------------------------------------------------
        console.log(`🔄 Starting measure loop for ${section.measures} measures`);
        
        for (let m = 0; m < section.measures; m++) {
            const t0 = section.startTime + m * measureDur;
            console.log(`📐 Measure ${m}/${section.measures}, t0=${t0.toFixed(3)}`);

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
                console.log(`🎹 PadA chord at t0=${t0}: ${chordA.join(", ")}`);
                
                Tone.Transport.schedule(time => {
                    chordA.forEach(n => {
                        safeTrigger(padA.inst, n, measureDur * 0.95, time, padGain, padA.name);
                        if (score) score.addNote("Pad", n, section.name);
                    });
                }, t0);
            }
            
            if (padB && padB.inst) {
                const chordB = buildChord(safeRootForPad, padB.name);
                console.log(`🎹 PadB chord at t0=${t0}: ${chordB.join(", ")}`);
                
                Tone.Transport.schedule(time => {
                    chordB.forEach(n => {
                        safeTrigger(padB.inst, n, measureDur * 0.95, time, padGain * 0.8, padB.name);
                    });
                }, t0);
            }
            
            // BASSLINE
            try {
                console.log(`🎸 Scheduling bassline at t0=${t0}`);
                bassFn(safeRootForBass, t0, sixteenth, bass, score, section.name);
            } catch (e) {
                console.warn("⚠️ Bassline failed:", e.message);
            }
        }
        
        console.log(`✅ [scheduleDanceRhythm] END section: ${section.name}`);
        
    } catch (outerError) {
        console.error(`❌ FATAL ERROR in scheduleDanceRhythm for section ${section?.name}:`, outerError);
        console.trace();
    }
}