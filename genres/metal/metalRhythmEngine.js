
// metalRhythmEngine.js — ver. 027
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";
import { chooseRiffPattern } from "./riffPatterns.js";

console.log("metalRhythmEngine.js ver. 020 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const stepTime = measureDur / 16;
    const secondsPerBeat = measureDur / 4;
    
    // 1. SCELTA DEL PATTERN (Una volta per sezione per coerenza)
    const sectionPattern = chooseRiffPattern(section.name.toLowerCase(), params.imageParams, rand);
    
    // Definiamo quanto dura ogni pattern (fondamentale per non avere glitch)
    const patternMeasures = {
        pm_groove: 2, gallop: 2, pedal: 2, pm_half_time: 2,
        open_epic: 1, intro_stratovarius: 1, open_sustain: 1, default: 1
    };

    const pLen = patternMeasures[sectionPattern] || 1;

    // 2. FUNZIONE DI ESECUZIONE (Il "Cuore" del Riff)
    const playGuitarAndBass = (p, measureOffset, rootNote) => {
        const startTime = section.startTime + (measureOffset * measureDur);
        const gP = normalizeNote(rootNote, "guitarPalm") + "2";
        const gO = normalizeNote(rootNote, "guitarOpen") + "2";
        const bN = normalizeNote(rootNote, "bass") + "1";

        // Dispatcher dei pattern (Evolviamo la logica dello switch)
        if (p === "intro_stratovarius") {
            [0, 0.5, 2, 2.5].forEach(b => {
                Tone.Transport.schedule(t => {
                    guitarPalm.triggerAttackRelease(gP, "16n", t);
                    bass.triggerAttackRelease(bN, "16n", t);
                }, startTime + (b * secondsPerBeat));
            });
            [1, 3].forEach(b => {
                Tone.Transport.schedule(t => {
                    guitarOpen.triggerAttackRelease(gO, "2n", t);
                    bass.triggerAttackRelease(bN, "2n", t);
                }, startTime + (b * secondsPerBeat));
            });
        } 
        else if (p === "gallop") {
            for (let s = 0; s < 16 * pLen; s++) {
                if (s % 4 !== 1) { // Classico 1-&a 2-&a
                    Tone.Transport.schedule(t => {
                        guitarPalm.triggerAttackRelease(gP, "16n", t);
                        bass.triggerAttackRelease(bN, "16n", t);
                    }, startTime + (s * (stepTime/1))); 
                }
            }
        }
        else {
            // Default: PM Groove o note sui quarti se non riconosciuto
            [0, 1, 2, 3].forEach(b => {
                Tone.Transport.schedule(t => {
                    guitarPalm.triggerAttackRelease(gP, "8n", t);
                    bass.triggerAttackRelease(bN, "8n", t);
                }, startTime + (b * secondsPerBeat));
            });
        }
    };

    // 3. LOGICA DELLA BATTERIA (Semplice e Robusta)
    const playDrums = (mIndex) => {
        const mStart = section.startTime + (mIndex * measureDur);
        const isChorus = section.name.toLowerCase().includes("chorus");

        for (let s = 0; s < 16; s++) {
            const t = mStart + (s * stepTime);
            Tone.Transport.schedule(time => {
                if (s === 0 || s === 8) drums.player("kick").start(time);
                if (s === 4 || s === 12) drums.player("snare").start(time);
                if (s % 2 === 0) {
                    const cym = isChorus ? "ride" : "hihat";
                    drums.player(cym).start(time, 0, { volume: -15 });
                }
            }, t);
        }
    };

    // 4. MAIN LOOP DI SCHEDULAZIONE
    for (let m = 0; m < section.measures; m += pLen) {
        const currentRoot = progression[m % progression.length];
        
        // Suona il pattern scelto
        playGuitarAndBass(sectionPattern, m, currentRoot);
        
        // Suona la batteria per ogni misura del pattern
        for (let j = 0; j < pLen && (m + j < section.measures); j++) {
            playDrums(m + j);
        }
    }
}
