// metalRhythmEngine.js — ver. 011 (SUSTAINED & FULL LOGIC)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 011 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    
    // --- 1. SELEZIONE DEL PATTERN (Basata su Energy e DNA) ---
    const energy = params.imageParams.energy;
    const dice = rand();
    let grooveType = "straight";

    if (isChorus) {
        grooveType = energy > 0.7 ? "doubleKick" : "straight";
    } else if (isIntro) {
        grooveType = "epicHold"; // Quello che abbiamo fatto per Stratovarius
    } else {
        // Verse/Solo: Varietà totale
        if (dice < 0.25) grooveType = "gallop";
        else if (dice < 0.50) grooveType = "triplet";  // 12/8 feel (Helloween style)
        else if (dice < 0.75 && energy > 0.6) grooveType = "doubleKick";
        else if (energy < 0.4) grooveType = "heavySlow"; // Doom/Epic feel
    }

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        const isIntroFirstHalf = isIntro && (m < Math.floor(section.measures / 2));
        const isLastMeasure = (m === section.measures - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let currentRoot = root;
            
            // --- 2. DEFINIZIONE DEGLI HIT (Cassa, Rullante, Chitarra) ---
            let kick = false;
            let snare = (s === 4 || s === 12);
            let playGuitar = false;
            let inst = guitarPalm;
            let sustain = false;

            switch(grooveType) {
                case "gallop": // [1 - - 4 1 - - 4]
                    kick = (s % 4 === 0 || s % 4 === 2 || s % 4 === 3);
                    playGuitar = kick;
                    break;

                case "triplet": // Feel terzinato (Maiden/Helloween)
                    // Usiamo una maschera per simulare le terzine su 16 step
                    const tripletSteps = [0, 2, 3, 6, 8, 9, 12, 14, 15];
                    kick = tripletSteps.includes(s);
                    snare = (s === 6 || s === 12);
                    playGuitar = kick;
                    break;

                case "doubleKick": // Tappeto a 16esimi
                    kick = (s % 2 === 0); 
                    playGuitar = (s % 4 === 0); // Chitarra più larga per non impastare
                    break;

                case "heavySlow": // Half-time pesante
                    kick = (s === 0 || s === 6);
                    snare = (s === 8); // Rullante spostato sul 3 (molto lento)
                    playGuitar = (s === 0 || s === 6 || s === 8);
                    sustain = true;
                    inst = guitarOpen;
                    break;

                case "epicHold": // Stratovarius Style
                    kick = (s % 8 === 0);
                    snare = (s === 12);
                    playGuitar = (s % 8 === 0);
                    sustain = true;
                    inst = guitarOpen;
                    break;

                default: // Straight (Standard 4/4)
                    kick = (s % 4 === 0 || s % 8 === 6);
                    playGuitar = (s % 2 === 0);
            }

            // --- 3. SCHEDULING STRUMENTI ---
            if (playGuitar || (isLastMeasure && s >= 12 && s % 2 === 0)) {
                // Transizione cromatica (rimane attiva)
                if (isLastMeasure && s >= 12 && nextSectionRoot && nextSectionRoot !== root) {
                    const diff = Tone.Frequency(nextSectionRoot + "2").toMidi() > Tone.Frequency(root + "2").toMidi() ? 1 : -1;
                    currentRoot = Tone.Frequency(Tone.Frequency(root + "2").toMidi() + (s === 12 ? diff : diff * 2), "midi").toNote();
                    playGuitar = true; // Forza il colpo nella transizione
                }

                const gNote = normalizeNote(currentRoot, inst === guitarOpen ? "guitarOpen" : "guitarPalm");
                const bNote = normalizeNote(currentRoot, "bass");
                Tone.Transport.schedule(t => {
                    inst.triggerAttackRelease(gNote + "2", sustain ? "1n" : "16n", t);
                    bass.triggerAttackRelease(bNote + "1", sustain ? "1n" : "16n", t);
                }, absoluteTime);
            }

            // --- 4. SCHEDULING BATTERIA (Dinamica) ---
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
                
                // Piatti: Ride nel chorus, HiHat nel resto
                if (s % 2 === 0) drums.player(isChorus ? "ride" : "hihat").start(time);
                
                // Accenti e Fill
                if (s === 0 && (m === 0 || isLastMeasure)) drums.player("crash2").start(time);
                if (isLastMeasure && s >= 12 && s % 2 === 0) drums.player("tom" + (s === 12 ? 1 : 3)).start(time);
            }, absoluteTime);
        }
    }
}
