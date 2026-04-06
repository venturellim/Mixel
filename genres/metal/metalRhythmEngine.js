// metalRhythmEngine.js — ver. 019 (THE GENOME UPDATE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";
import { chooseRiffPattern } from "./riffPatterns.js";

console.log("metalRhythmEngine.js ver. 019.1 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const secondsPerBeat = measureDur / 4;
    const stepTime = measureDur / 16;
    const { energy = 0.5, complexity = 0.5, brightness = 0.5 } = params.imageParams || {};

    // 1. SCELTA UNICA DEL PATTERN PER LA SEZIONE
    const sectionPattern = chooseRiffPattern(section.name.toLowerCase(), params.imageParams, rand);
    console.log(`%c[METAL ENGINE] Section: ${section.name} | Pattern: ${sectionPattern}`, "color: #00ff00; font-weight: bold;");

    const patternMeasures = {
        pm_sparse: 2, pm_groove: 2, pm_half_time: 2, pedal: 2, pedal_syncopated: 2,
        gallop: 2, gallop_light: 2, pm_support: 2, syncopated_pm: 2,
        open_half_time: 1, open_epic: 1, intro_stratovarius: 1, open_sustain: 1,
        open_drive: 1, open_strike_quarter: 1, default: 1
    };

    // 2. FUNZIONI DI SCHEDULAZIONE RITMICA (Dispatcher dei pattern)
    const playRiff = (pattern, startMeasure, root) => {
        const offset = startMeasure * measureDur;
        const startTime = section.startTime + offset;
        const gP = normalizeNote(root, "guitarPalm") + "2";
        const gO = normalizeNote(root, "guitarOpen") + "2";
        const bN = normalizeNote(root, "bass") + "1";

        // Funzione helper per evitare ripetizioni
        const hit = (beatOffset, instType, dur = "8n") => {
            const t = startTime + (beatOffset * secondsPerBeat);
            Tone.Transport.schedule(time => {
                if (instType === "palm") {
                    guitarPalm.triggerAttackRelease(gP, dur, time);
                } else {
                    guitarOpen.triggerAttackRelease(gO, dur, time);
                }
                bass.triggerAttackRelease(bN, dur, time);
            }, t);
        };

        switch(pattern) {
            case "intro_stratovarius":
                [0, 0.5, 2, 2.5].forEach(b => hit(b, "palm", "16n"));
                [1, 3].forEach(b => hit(b, "open", "2n"));
                break;

            case "gallop":
                // 2 misure di gallop (16esimi: 1-&a 2-&a...)
                for (let i = 0; i < 32; i++) {
                    if (i % 4 !== 1) { // Salta il secondo sedicesimo per fare il "galoppo"
                        const t = startTime + (i * (measureDur / 16));
                        Tone.Transport.schedule(time => {
                            guitarPalm.triggerAttackRelease(gP, "16n", time);
                            bass.triggerAttackRelease(bN, "16n", time);
                        }, t);
                    }
                }
                break;

            case "pm_groove":
                for (let i = 0; i < 16; i++) {
                    if ([0, 3, 6, 8, 11, 14].includes(i)) hit(i/4, "palm", "16n");
                }
                break;

            case "open_epic":
                [0, 1.5, 3].forEach(b => hit(b, "open", "2n"));
                break;

            case "open_sustain":
                hit(0, "open", "1n");
                break;

            case "pedal":
                for (let i = 0; i < 16; i++) hit(i/4, "palm", "16n");
                break;

            default: // Fallback: battiti sui quarti
                [0, 1, 2, 3].forEach(b => hit(b, "palm", "8n"));
        }
    };

    // 3. SCHEDULAZIONE BATTERIA (Robusta)
    const playDrums = (m) => {
        const absoluteStart = section.startTime + (m * measureDur);
        const isChorus = section.name.toLowerCase().includes("chorus");

        for (let s = 0; s < 16; s++) {
            const t = absoluteStart + (s * stepTime);
            Tone.Transport.schedule(time => {
                try {
                    // Cassa e Rullante
                    if (s === 0 || s === 8) drums.player("kick").start(time);
                    if (s === 4 || s === 12) drums.player("snare").start(time);
                    
                    // Piatti con controllo errore specifico
                    if (s % 2 === 0) {
                        const cym = isChorus ? "ride" : "hihat";
                        if (drums.has(cym)) drums.player(cym).start(time, 0, {volume: -15});
                    }
                    if (s === 0 && m === 0) drums.player("crash1").start(time);
                } catch(e) { /* Silenzia errori hi-hat */ }
            }, t);
        }
    };

    // 4. MAIN LOOP
    let currentM = 0;
    while (currentM < section.measures) {
        const root = progression[currentM % progression.length];
        const pLen = patternMeasures[sectionPattern] || 1;

        if (currentM + pLen <= section.measures) {
            playRiff(sectionPattern, currentM, root);
        } else {
            playRiff("open_sustain", currentM, root); // Fallback se non ci sta il pattern lungo
        }

        for (let j = 0; j < pLen && (currentM + j < section.measures); j++) {
            playDrums(currentM + j);
        }

        currentM += pLen;
    }
}
