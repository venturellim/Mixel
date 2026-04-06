// metalRhythmEngine.js — ver. 019 (THE GENOME UPDATE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";
import { chooseRiffPattern } from "./riffPatterns.js";

console.log("metalRhythmEngine.js ver. 019 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const secondsPerBeat = measureDur / 4;
    const stepTime = measureDur / 16;
    const { energy = 0.5, complexity = 0.5 } = params.imageParams || {};

    // 1. SCELTA DEL PATTERN (Una sola volta per sezione come nel vecchio engine)
    const sectionPattern = chooseRiffPattern(section.name.toLowerCase(), params.imageParams, rand);
    
    // Mappatura durate (dal vecchio riffEngine)
    const patternMeasures = {
        pm_sparse: 2, pm_groove: 2, pm_half_time: 2, pedal: 2, 
        gallop: 2, gallop_light: 2, pm_support: 2,
        open_half_time: 1, open_epic: 1, intro_stratovarius: 1, default: 1
    };

    // 2. DISPATCHER DELLE FUNZIONI RITMICHE (Logica evoluta dal vecchio motore)
    // Invece di switch enormi, usiamo un oggetto per mappare i pattern alle funzioni
    const playPattern = (pattern, startMeasure, root) => {
        const offset = startMeasure * measureDur;
        const gNote = normalizeNote(root, "guitarPalm") + "2";
        const bNote = normalizeNote(root, "bass") + "1";
        const gNoteOpen = normalizeNote(root, "guitarOpen") + "2";

        // Esempio: STRATOVARIUS (1 misura)
        if (pattern === "intro_stratovarius") {
            [0, 0.5, 2, 2.5].forEach(b => { // Palm
                Tone.Transport.schedule(t => {
                    guitarPalm.triggerAttackRelease(gNote, "8n", t);
                    bass.triggerAttackRelease(bNote, "8n", t);
                }, section.startTime + offset + (b * secondsPerBeat));
            });
            [1, 3].forEach(b => { // Open
                Tone.Transport.schedule(t => {
                    guitarOpen.triggerAttackRelease(gNoteOpen, "2n", t);
                    bass.triggerAttackRelease(bNote, "2n", t);
                }, section.startTime + offset + (b * secondsPerBeat));
            });
        }
        
        // Esempio: GALLOP (2 misure)
        if (pattern === "gallop") {
            for (let i = 0; i < 16; i++) {
                if (i % 4 === 0 || i % 4 === 2 || i % 4 === 3) {
                    const t = section.startTime + offset + (i * (measureDur / 8));
                    Tone.Transport.schedule(time => {
                        guitarPalm.triggerAttackRelease(gNote, "16n", time);
                        bass.triggerAttackRelease(bNote, "16n", time);
                    }, t);
                }
            }
        }

        // ... qui aggiungeremo gli altri dispatcher man mano ...
        // Per ora usiamo un FALLBACK PM GROOVE se non riconosce il pattern
        if (pattern === "pm_groove" || (!["intro_stratovarius", "gallop"].includes(pattern))) {
            for (let i = 0; i < 16; i++) {
                if (i % 2 === 0) {
                    Tone.Transport.schedule(t => {
                        guitarPalm.triggerAttackRelease(gNote, "8n", t);
                        bass.triggerAttackRelease(bNote, "8n", t);
                    }, section.startTime + offset + (i * stepTime));
                }
            }
        }
    };

    // 3. SCHEDULAZIONE BATTERIA (Più "stupida" e solida, segue la misura)
    const scheduleDrums = (m, absoluteMeasureStart) => {
        const isIntro = section.name.toLowerCase().includes("intro");
        const isChorus = section.name.toLowerCase().includes("chorus");

        for (let s = 0; s < 16; s++) {
            const t = absoluteMeasureStart + (s * stepTime);
            
            Tone.Transport.schedule(time => {
                // Kick & Snare Standard
                if (s === 0 || s === 8) drums.player("kick").start(time);
                if (s === 4 || s === 12) drums.player("snare").start(time);
                
                // Piatti (senza fronzoli per ora)
                if (s % 2 === 0) {
                    const cym = isChorus ? "ride" : "hihat";
                    drums.player(cym).start(time, 0, {volume: -12});
                }

                // Accenti
                if (s === 0 && (m === 0)) drums.player("crash1").start(time);
            }, t);
        }
    };

    // 4. MAIN LOOP (Avanza di patternLength invece che di 1)
    for (let m = 0; m < section.measures; ) {
        const root = progression[m % progression.length];
        const patternLen = patternMeasures[sectionPattern] || 1;
        
        // Suona Chitarra/Basso (Pattern Multi-misura)
        playPattern(sectionPattern, m, root);
        
        // Suona Batteria (Misura per misura)
        for (let j = 0; j < patternLen; j++) {
            if (m + j < section.measures) {
                scheduleDrums(m + j, section.startTime + (m + j) * measureDur);
            }
        }

        m += patternLen;
    }
}
