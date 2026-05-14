// danceRhythmEngineNEW.js - STEP 1: Pattern con parametri dinamici
import * as Tone from "https://esm.sh/tone";

console.log("🎵 DANCE RHYTHM NEW - STEP 1");

export function scheduleRhythmNEW(instruments, score, options) {
    const {
        bpm = 130,
        rootNote = "C",
        scaleType = "naturalMinor",
        measures = 32,
        intensity = 0.5,
        mood = 0.5
    } = options || {};
    
    const { percussion, bass, warmPad, wavePad } = instruments;
    
    const measureDur = (60 / bpm) * 4;
    const beatDur = measureDur / 4;
    const eighthDur = measureDur / 8;
    
    console.log(`🎵 Scheduling ${measures} misure, root=${rootNote}, scale=${scaleType}`);
    
    // Determina l'ottava del basso in base alla nota
    const getBassOctave = (note) => {
        const lowNotes = ["C", "C#", "D", "D#", "E"];
        return lowNotes.includes(note) ? "2" : "1";
    };
    const bassNote = rootNote + getBassOctave(rootNote);
    
    // Scegli il pad in base al mood
    const selectedPad = mood > 0.5 ? wavePad : warmPad;
    const padNote = rootNote + "3";
    
    // Densità dell'hi-hat in base all'intensità
    const hatDensity = intensity > 0.6 ? 0.5 : 0.25;
    
    for (let m = 0; m < measures; m++) {
        const t0 = m * measureDur;
        
        // --- KICK (sempre su ogni beat) ---
        for (let i = 0; i < 4; i++) {
            Tone.Transport.schedule(() => {
                percussion?.player("bassDrum")?.start();
                score?.addNote("Kick", "beat", "loop");
            }, t0 + i * beatDur);
        }
        
        // --- SNARE/CLAP (sul 2 e 4) ---
        [1, 3].forEach(i => {
            Tone.Transport.schedule(() => {
                percussion?.player("handClap")?.start();
                score?.addNote("Snare", "beat", "loop");
            }, t0 + i * beatDur);
        });
        
        // --- HI-HAT (pattern in base all'intensità) ---
        for (let i = 0; i < 8; i++) {
            if (Math.random() < hatDensity || i % 2 === 0) {
                Tone.Transport.schedule(() => {
                    percussion?.player("closedHat")?.start();
                    score?.addNote("Hat", "beat", "loop");
                }, t0 + i * eighthDur);
            }
        }
        
        // --- BASS (pattern in base all'intensità) ---
        if (intensity > 0.7) {
            // Bass più fitto: su ogni beat
            for (let i = 0; i < 4; i++) {
                Tone.Transport.schedule(() => {
                    bass?.triggerAttackRelease(bassNote, "8n");
                    score?.addNote("Bass", bassNote, "loop");
                }, t0 + i * beatDur);
            }
        } else {
            // Bass semplice: solo sul primo beat
            Tone.Transport.schedule(() => {
                bass?.triggerAttackRelease(bassNote, "4n");
                score?.addNote("Bass", bassNote, "loop");
            }, t0);
        }
        
        // --- PAD (accordi in base alla scala) ---
        // Costruisci un accordo semplice
        const getChordNote = (offset) => {
            if (scaleType === "major") {
                const majorIntervals = [0, 4, 7];
                const semi = majorIntervals[offset % majorIntervals.length];
                return Tone.Frequency(rootNote + "3").transpose(semi).toNote();
            } else {
                const minorIntervals = [0, 3, 7];
                const semi = minorIntervals[offset % minorIntervals.length];
                return Tone.Frequency(rootNote + "3").transpose(semi).toNote();
            }
        };
        
        Tone.Transport.schedule(() => {
            // Accordo di 3 note
            const chordNotes = [0, 1, 2].map(i => getChordNote(i));
            chordNotes.forEach(note => {
                selectedPad?.triggerAttackRelease(note, measureDur * 0.9);
                score?.addNote("Pad", note, "loop");
            });
        }, t0);
    }
    
    console.log("✅ Rhythm scheduling completato");
}