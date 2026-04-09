
// metalRhythmEngine.js — ver. 066
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 013 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    if (!drums || !guitarPalm || !bass) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const stepTime = measureDur / 16;

    // --- 🧬 RECUPERO PARAMETRI DNA ---
    const { energy = 0.5, brightness = 0.5, complexity = 0.5, texture = 0.5 } = params?.imageParams || {};

    // --- 🧬 MOTORE DI SCELTA GROOVE (Basato su Pesi DNA) ---
    const getGroove = (type) => {
        // Pesi: Energia (Dominante), Luce (Struttura), Complessità (Dettaglio)
        let dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2) + (texture * 0.1);
        const sectionMultipliers = { intro: 1.33, verse: 0.77, chorus: 2.15 };
        const finalScore = Math.floor(dnaScore * (sectionMultipliers[type] || 1.0));

        const grooves = {
            intro: ["intro_ambient", "intro_heavy_strikes", "stratovarius", "straight"],
            verse: ["gallop", "thrash_diamond", "blind_guardian", "straight", "gallop"],
            chorus: ["helloween", "chorus_pure_sustain", "chorus_sustain_hit", "helloween"]
        };

        const family = grooves[type] || grooves.verse;
        return family[finalScore % family.length];
    };

    let currentGroove = getGroove(isIntro ? "intro" : (isChorus ? "chorus" : "verse"));

    for (let m = 0; m < section.measures; m++) {
        // Cambio groove a metà sezione se la complessità è alta
        if (m === Math.floor(section.measures / 2) && complexity > 0.6) {
            currentGroove = getGroove(isIntro ? "intro" : (isChorus ? "chorus" : "verse"));
        }

        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const nextRoot = progression[(m + 1) % progression.length] || nextSectionRoot;
        const isLastMeasureOfPart = (m === section.measures - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let kick = false, snare = false, playGuitar = false, inst = guitarPalm, sustain = false, customNote = null;

            // --- 🥁 🎸 LOGICA MASCHERE GROOVE ---
            switch (currentGroove) {
                case "intro_ambient":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    break;
                case "intro_heavy_strikes":
                    if ([0, 4, 8, 12].includes(s)) { playGuitar = true; inst = guitarOpen; kick = true; snare = (s === 4 || s === 12); }
                    break;
                case "stratovarius":
                    if (s === 0 || s === 2) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 4) { playGuitar = true; inst = guitarOpen; snare = true; sustain = true; }
                    if (s === 12) snare = true;
                    break;
                case "thrash_diamond":
                    if ([0, 2, 6].includes(s)) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 4) { playGuitar = true; inst = guitarOpen; sustain = true; snare = true; }
                    if (s === 12) snare = true;
                    break;
                case "gallop": // Il classico metal gallop: 1 - 3 4
                    if (s % 4 !== 1) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "helloween": // Double kick costante
                    kick = true;
                    if (s % 4 === 0) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "chorus_pure_sustain":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 8) kick = true;
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "chorus_sustain_hit":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 14) { playGuitar = true; inst = guitarOpen; kick = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                default: // "Straight"
                    if (s % 2 === 0) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;
            }

            // --- ⚡ FILL LOGIC (Basata su Complexity) ---
            const isFillZone = isLastMeasureOfPart && s >= 12;
            if (isFillZone && complexity > 0.4) {
                playGuitar = true; inst = guitarPalm; sustain = false;
                kick = true; snare = (s % 2 === 0);
                
                // Melodia del basso durante il fill
                const currMidi = Tone.Frequency(currentRoot + "2").toMidi();
                const nextMidi = Tone.Frequency((nextRoot || currentRoot) + "2").toMidi();
                const stepScale = Math.round(((nextMidi - currMidi) / 4) * (s - 11));
                customNote = Tone.Frequency(currMidi + stepScale, "midi").toNote();
            }

            // --- 🎸 ESECUZIONE CHITARRA E BASSO ---
            if (playGuitar) {
                const rootToUse = customNote || currentRoot;
                const gNote = normalizeNote(rootToUse, inst === guitarOpen ? "guitarOpen" : "guitarPalm") + "2";
                const bNote = normalizeNote(rootToUse, "bass") + "1";

                // TEXTURE IMPACT: Se la texture è bassa (liscia), le note palm-mute durano di più
                const palmLen = texture < 0.3 ? "8n" : "16n";

                Tone.Transport.schedule(t => {
                    inst.triggerAttackRelease(gNote, sustain ? "1n" : palmLen, t);
                    bass.triggerAttackRelease(bNote, sustain ? "1n" : "16n", t);
                }, absoluteTime);
            }

            // --- 🥁 ESECUZIONE BATTERIA ---
            Tone.Transport.schedule(time => {
                if (kick) drums.player("kick").start(time);
                if (snare) drums.player("snare").start(time);
                
                // Piatti (Ride se Chorus o Alta Energia)
                if (s % 2 === 0 && !isFillZone) {
                    try {
                        const cym = drums.player((isChorus || energy > 0.7) ? "ride" : "hihat");
                        cym.volume.value = isChorus ? -10 : -18;
                        cym.start(time);
                    } catch(e) {}
                }

                // Tom durante i fill
                if (isFillZone) {
                    try { drums.player("tom" + (s - 11)).start(time); } catch(e) {}
                }
                
                // Crash all'inizio delle sezioni
                if (s === 0 && (m === 0)) {
                    try { drums.player("crash1").start(time); } catch(e) {}
                }
            }, absoluteTime);
        }
    }
}
