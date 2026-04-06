// metalRhythmEngine.js — ver. 018 (THE GENOME UPDATE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 018.2 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isIntro = section.name.toLowerCase().includes("intro");
    const isChorus = section.name.toLowerCase().includes("chorus");
    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params.imageParams || {};

    // --- 1. LOGICA DEL TUO VECCHIO riffPatterns.js ---
    const PATTERN_DATA = {
        "stratovarius": { k: [0, 8, 10], s: [4, 12], g: [0, 8, 10], inst: "open" },
        "gallop": { k: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], s: [4, 12], g: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], inst: "palm" },
        "open_epic": { k: [0, 6, 8], s: [4, 12], g: [0, 6, 8], inst: "open" },
        "pm_groove": { k: [0, 4, 8, 12], s: [4, 12], g: [0, 4, 8, 12], inst: "palm" },
        "sparse": { k: [0, 8], s: [12], g: [0], inst: "open" }
    };

    // Scelta pesata
    const weightedChoice = (options) => {
        const total = options.reduce((s, o) => s + o.weight, 0);
        let r = rand() * total;
        for (const o of options) { if (r < o.weight) return o.value; r -= o.weight; }
        return options[0].value;
    };

    // SCEGLIAMO IL PATTERN UNA VOLTA PER TUTTA LA SEZIONE
    let selectedKey;
    if (isIntro) {
        selectedKey = weightedChoice([
            { value: "stratovarius", weight: complexity },
            { value: "sparse", weight: 1 - energy }
        ]);
    } else if (isChorus) {
        selectedKey = weightedChoice([
            { value: "open_epic", weight: brightness },
            { value: "gallop", weight: energy }
        ]);
    } else {
        selectedKey = weightedChoice([
            { value: "pm_groove", weight: 0.5 },
            { value: "gallop", weight: energy }
        ]);
    }

    const pattern = PATTERN_DATA[selectedKey] || PATTERN_DATA["pm_groove"];

    // --- 2. LOOP DI SCHEDULAZIONE ---
    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        
        // Gestione Intro progressiva
        const muteGuitarInIntro = isIntro && (m < 1) && (complexity < 0.4);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            
            const kickHit = pattern.k.includes(s);
            const snareHit = pattern.s.includes(s);
            const playGuitar = pattern.g.includes(s) && !muteGuitarInIntro;

            const gNote = normalizeNote(root, pattern.inst === "open" ? "guitarOpen" : "guitarPalm") + "2";
            const bNote = normalizeNote(root, "bass") + "1";

            Tone.Transport.schedule(time => {
                // Esecuzione batteria (con controllo esistenza player)
                if (kickHit && drums.has("kick")) drums.player("kick").start(time);
                if (snareHit && drums.has("snare")) drums.player("snare").start(time);
                
                // Piatti (solo ogni 2 step per stabilità)
                if (s % 2 === 0 && drums.has("hihat")) {
                    const cymbal = isChorus ? "ride" : "hihat";
                    if (drums.has(cymbal)) {
                        drums.player(cymbal).start(time, 0, { volume: -12 });
                    }
                }

                // Chitarra e Basso
                if (playGuitar) {
                    guitarOpen.releaseAll(time);
                    guitarPalm.releaseAll(time);
                    bass.releaseAll(time);

                    if (pattern.inst === "open") {
                        guitarOpen.triggerAttack(gNote, time);
                        bass.triggerAttackRelease(bNote, "4n", time);
                    } else {
                        guitarPalm.triggerAttackRelease(gNote, "16n", time);
                        bass.triggerAttackRelease(bNote, "16n", time);
                    }
                }
            }, absoluteTime);
        }
    }
}
