// metalRhythmEngine.js — ver. 012 (DYNAMIC SECTIONS & MIXED PATTERNS)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 012 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    
    const energy = params.imageParams.energy;

    // --- FUNZIONE PER CAMBIARE GROOVE (Punto 4: Varietà tra semisezioni) ---
    const getGrooveType = (measureIndex) => {
        const isSecondHalf = measureIndex >= Math.floor(section.measures / 2);
        const dice = rand();

        if (isIntro) return "epicHold";
        if (isChorus) return energy > 0.7 ? "doubleKick" : "straight";

        // Verse/Solo: Cambiamo pattern a metà sezione per dare movimento
        if (!isSecondHalf) {
            if (dice < 0.5) return "gallop";
            return "straight";
        } else {
            if (dice < 0.5) return "triplet";
            return "doubleKick";
        }
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        const isIntroFirstHalf = isIntro && (m < Math.floor(section.measures / 2));
        const isLastMeasure = (m === section.measures - 1);
        
        // Determiniamo il groove specifico per questa misura
        const grooveType = getGrooveType(m);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let currentRoot = root;
            
            // --- 2. DEFINIZIONE DEGLI HIT & STRUMENTI (Punti 1, 3, 5) ---
            let kick = false;
            let snare = (s === 4 || s === 12);
            let playGuitar = false;
            let inst = guitarPalm;
            let sustain = false;

            // Logica Scelta Chitarra
            if (isIntro) {
                inst = guitarOpen; // Punto 1: Intro sempre Open
                sustain = true;
            } else if (isChorus) {
                // Punto 3: Chorus più probabile Open (80% Open)
                inst = (rand() > 0.2) ? guitarOpen : guitarPalm;
                sustain = (inst === guitarOpen);
            } else {
                // Punto 5: Pattern Misto (Palm Mute che apre su Open negli ultimi step)
                const isEndingStep = s >= 12;
                if (isEndingStep && rand() > 0.6) {
                    inst = guitarOpen;
                    sustain = true;
                } else {
                    inst = guitarPalm;
                    sustain = false;
                }
            }

            // Logica Ritmica (Groove)
            switch(grooveType) {
                case "gallop":
                    kick = (s % 4 === 0 || s % 4 === 2 || s % 4 === 3);
                    playGuitar = kick;
                    break;
                case "triplet":
                    const tripletSteps = [0, 2, 3, 6, 8, 9, 12, 14, 15];
                    kick = tripletSteps.includes(s);
                    snare = (s === 6 || s === 12);
                    playGuitar = kick;
                    break;
                case "doubleKick":
                    kick = (s % 2 === 0); 
                    playGuitar = (s % 4 === 0 || s === 10); // Aggiunto accento su 10 per groove
                    break;
                case "epicHold":
                    kick = (s % 8 === 0);
                    snare = (s === 12);
                    playGuitar = (s % 8 === 0);
                    sustain = true; // Forza sustain per Stratovarius style
                    break;
                default: // straight
                    kick = (s % 4 === 0 || s % 8 === 6);
                    playGuitar = (s % 2 === 0);
            }

            // --- 3. SCHEDULING STRUMENTI ---
            if (playGuitar || (isLastMeasure && s >= 12 && s % 2 === 0)) {
                // Transizione cromatica
                if (isLastMeasure && s >= 12 && nextSectionRoot && nextSectionRoot !== root) {
                    const rootMidi = Tone.Frequency(root + "2").toMidi();
                    const nextMidi = Tone.Frequency(nextSectionRoot + "2").toMidi();
                    const diff = nextMidi > rootMidi ? 1 : -1;
                    currentRoot = Tone.Frequency(rootMidi + (s === 12 ? diff : diff * 2), "midi").toNote();
                    playGuitar = true;
                }

                const gNote = normalizeNote(currentRoot, inst === guitarOpen ? "guitarOpen" : "guitarPalm");
                const bNote = normalizeNote(currentRoot, "bass");
                
                Tone.Transport.schedule(t => {
                    // Usiamo "1n" per le note aperte (sustain) per coprire i buchi
                    inst.triggerAttackRelease(gNote + "2", sustain ? "1n" : "16n", t);
                    bass.triggerAttackRelease(bNote + "1", sustain ? "1n" : "16n", t);
                }, absoluteTime);
            }

            // --- 4. SCHEDULING BATTERIA ---
            Tone.Transport.schedule(time => {
                if (isIntroFirstHalf) {
                    if (s === 0) {
                        drums.player("crash1").start(time);
                        drums.player("kick").start(time);
                        drums.player("tom1").start(time);
                    }
                    return;
                }
                
                if (kick) drums.player("kick").start(time);
                if (snare) drums.player("snare").start(time);
                
                // Piatti: Ride nel chorus o se l'energia è alta
                const cymbal = (isChorus || energy > 0.8) ? "ride" : "hihat";
                if (s % 2 === 0) drums.player(cymbal).start(time);
                
                // Accenti e riempimenti Tom
                if (s === 0 && (m === 0 || isLastMeasure)) drums.player("crash2").start(time);
                if (isLastMeasure && s >= 12 && s % 2 === 0) {
                    drums.player("tom" + (s === 12 ? 1 : 3)).start(time);
                }
            }, absoluteTime);
        }
    }
}
