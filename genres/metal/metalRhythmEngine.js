
// metalRhythmEngine.js — ver. 012
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 012.3 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    
    // Parametri DNA dalla foto
    const energy = params.imageParams.energy || 0.5;
    const brightness = params.imageParams.brightness || 0.5;
    const complexity = params.imageParams.complexity || 0.5;
    const dice = rand();

    // --- 1. SELEZIONE GROOVE BASATA SUL DNA ---
    let grooveType = "straight";

    if (isIntro) {
        if (complexity > 0.6) grooveType = "stratovarius"; // Mute-Mute-Open
        else if (brightness > 0.6) grooveType = "helloween"; // Double kick solare
        else grooveType = "straight";
    } else if (isChorus) {
        // Le tue nuove maschere per il Chorus
        if (energy > 0.8) grooveType = "chorus_sustain_hit"; // C--C-D--D-
        else if (energy > 0.4) grooveType = "chorus_pure_sustain"; // C----D----
        else grooveType = "helloween";
    } else { // Verse / Solo
        if (dice < 0.3) grooveType = "gallop"; // Iron Maiden style
        else if (dice < 0.6) grooveType = "blind_guardian"; // Sincopato PM
        else grooveType = "straight";
    }

    console.log(`%c[METAL ENGINE] Section: ${section.name} | Pattern: ${grooveType}`, "color: #ff00ff; font-weight: bold;");

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const isLastMeasure = (m === section.measures - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let kick = false, snare = false, playGuitar = false, inst = guitarPalm, sustain = false;

            // --- 2. LIBRERIA MASCHERE RITMICHE ---
            switch (grooveType) {
                case "stratovarius": // It's a Mystery style
                    if (s === 0 || s === 2) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 4) { playGuitar = true; inst = guitarOpen; snare = true; sustain = true; }
                    if (s === 12) snare = true;
                    break;

                case "gallop": // The Trooper style
                    if (s % 4 !== 1) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;

                case "helloween": // I Want Out style
                    kick = true; // Double kick fisso
                    if (s % 4 === 0) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;

                case "blind_guardian": // Syncopated PM
                    if ([0, 3, 6, 8, 11].includes(s)) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 14) { playGuitar = true; inst = guitarOpen; snare = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;

                case "chorus_pure_sustain": // Maschera 1: C-------
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 4 || s === 12) snare = true;
                    if (s === 8) kick = true;
                    break;

                case "chorus_sustain_hit": // Maschera 2: C----C--
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 14) { playGuitar = true; inst = guitarOpen; kick = true; } // Il colpo prima del cambio
                    if (s === 4 || s === 12) snare = true;
                    if (s === 8) kick = true;
                    break;

                default: // Straight Metal
                    if (s % 2 === 0) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;
            }

            // --- 3. ESECUZIONE CHITARRA E BASSO ---
            if (playGuitar) {
                const gNote = normalizeNote(currentRoot, inst === guitarOpen ? "guitarOpen" : "guitarPalm") + "2";
                const bNote = normalizeNote(currentRoot, "bass") + "1";
                Tone.Transport.schedule(t => {
                    inst.triggerAttackRelease(gNote, sustain ? "1n" : "16n", t);
                    bass.triggerAttackRelease(bNote, sustain ? "1n" : "16n", t);
                }, absoluteTime);
            }

            // --- 4. ESECUZIONE BATTERIA (Anti-Crash Fix) ---
            Tone.Transport.schedule(time => {
                if (kick) drums.player("kick").start(time);
                if (snare) drums.player("snare").start(time);
                
                // Bypass log hihat/ride per evitare "Script Error"
                if (s % 2 === 0) {
                    try {
                        const cymName = (isChorus || energy > 0.7) ? "ride" : "hihat";
                        const cym = drums.player(cymName);
                        cym.volume.value = -15;
                        cym.start(time);
                    } catch(e) {}
                }

                // Fill finale della sezione (Tom)
                if (isLastMeasure && s >= 12 && s % 2 === 0) {
                    try { drums.player("tom" + (s === 12 ? "1" : "2")).start(time); } catch(e) {}
                }
            }, absoluteTime);
        }
    }
}
