// metalRhythmEngine.js — ver. 018 (THE GENOME UPDATE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 018 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isIntro = section.name.toLowerCase().includes("intro");
    const isChorus = section.name.toLowerCase().includes("chorus");
    const stepTime = measureDur / 16;
    
    // --- 1. LOGICA DI SCELTA PESATA (Dal tuo vecchio riffPatterns) ---
    const { energy, brightness, complexity } = params.imageParams;

    function weightedChoice(options) {
        const total = options.reduce((s, o) => s + o.weight, 0);
        let r = rand() * total;
        for (const o of options) {
            if (r < o.weight) return o.value;
            r -= o.weight;
        }
        return options[options.length - 1].value;
    }

    // --- 2. SELEZIONE DEL PATTERN UNICO PER LA SEZIONE ---
    let patternType;
    if (isIntro) {
        patternType = weightedChoice([
            { value: "stratovarius", weight: complexity * 1.5 },
            { value: "full_power",   weight: energy * 1.2 },
            { value: "sparse_open",  weight: (1 - energy) * 1.0 }
        ]);
    } else if (isChorus) {
        patternType = weightedChoice([
            { value: "double_kick",  weight: energy * 1.8 },
            { value: "straight",     weight: 1.0 },
            { value: "epic_hold",    weight: brightness * 1.5 }
        ]);
    } else { // Verse / Pre-Chorus
        patternType = weightedChoice([
            { value: "gallop",       weight: energy * 1.5 },
            { value: "triplet",      weight: complexity * 1.2 },
            { value: "heavy_half",   weight: (1 - brightness) * 1.3 }
        ]);
    }

    // Definizione dei colpi per il pattern scelto
    const PATTERNS = {
        "stratovarius": { k: [0, 8], s: [12], g: [0, 8], inst: "open" },
        "full_power":   { k: [0, 4, 8, 12], s: [4, 12], g: [0, 4, 8, 12], inst: "open" },
        "sparse_open":  { k: [0], s: [12], g: [0], inst: "open" },
        "double_kick":  { k: [0, 2, 4, 6, 8, 10, 12, 14], s: [4, 12], g: [0, 4, 8, 12], inst: "open" },
        "straight":     { k: [0, 4, 8, 12], s: [4, 12], g: [0, 2, 4, 6, 8, 10, 12, 14], inst: "palm" },
        "gallop":       { k: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], s: [4, 12], g: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], inst: "palm" },
        "heavy_half":   { k: [0, 8], s: [8], g: [0, 8], inst: "palm" }
    };

    const activePattern = PATTERNS[patternType];

    // --- 3. LOOP DI SCHEDULAZIONE ---
    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        const isLastMeasure = (m === section.measures - 1);

        // LOGICA INTRO: Solo batteria per la prima metà? (Ora è una chance basata su complexity)
        const isDrumsOnlyIntro = isIntro && (m < 2) && (complexity < 0.3);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            
            // Pre-calcolo eventi
            const kickHit = activePattern.k.includes(s);
            const snareHit = activePattern.s.includes(s);
            let playGuitar = activePattern.g.includes(s) && !isDrumsOnlyIntro;
            let currentInst = activePattern.inst;
            let currentRoot = root;

            // Variazione di fine sezione (Fill)
            if (isLastMeasure && s >= 12) {
                if (nextSectionRoot && nextSectionRoot !== root) {
                    const diff = Tone.Frequency(nextSectionRoot + "2").toMidi() > Tone.Frequency(root + "2").toMidi() ? 1 : -1;
                    currentRoot = Tone.Frequency(Tone.Frequency(root + "2").toMidi() + (s === 12 ? diff : diff * 2), "midi").toNote();
                    playGuitar = true;
                    currentInst = "palm";
                }
            }

            const gNote = normalizeNote(currentRoot, currentInst === "open" ? "guitarOpen" : "guitarPalm") + "2";
            const bNote = normalizeNote(currentRoot, "bass") + "1";

            // CALLBACK ESECUZIONE (Stabile)
            Tone.Transport.schedule(time => {
                // Batteria
                if (kickHit) drums.player("kick").start(time);
                if (snareHit) drums.player("snare").start(time);
                if (s % 2 === 0) drums.player(isChorus ? "ride" : "hihat").start(time);
                
                // Crash solo all'inizio o nei momenti epici
                if (s === 0 && (m === 0 || isLastMeasure)) drums.player("crash2").start(time);

                // Chitarra e Basso
                if (playGuitar) {
                    guitarOpen.releaseAll(time);
                    guitarPalm.releaseAll(time);
                    bass.releaseAll(time);

                    if (currentInst === "open") {
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
