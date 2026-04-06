// metalRhythmEngine.js — ver. 018 (THE GENOME UPDATE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 018.1 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isIntro = section.name.toLowerCase().includes("intro");
    const isChorus = section.name.toLowerCase().includes("chorus");
    const stepTime = measureDur / 16;
    
    const { energy, brightness, complexity } = params.imageParams;

    function weightedChoice(options) {
        const total = options.reduce((s, o) => s + o.weight, 0);
        if (total <= 0) return options[0].value; 
        let r = rand() * total;
        for (const o of options) {
            if (r < o.weight) return o.value;
            r -= o.weight;
        }
        return options[options.length - 1].value;
    }

    // --- 1. DEFINIZIONE PATTERNS (Spostata sopra per sicurezza) ---
    const PATTERNS = {
        "stratovarius": { k: [0, 8], s: [12], g: [0, 8], inst: "open" },
        "full_power":   { k: [0, 4, 8, 12], s: [4, 12], g: [0, 4, 8, 12], inst: "open" },
        "sparse_open":  { k: [0], s: [12], g: [0], inst: "open" },
        "double_kick":  { k: [0, 2, 4, 6, 8, 10, 12, 14], s: [4, 12], g: [0, 4, 8, 12], inst: "open" },
        "straight":     { k: [0, 4, 8, 12], s: [4, 12], g: [0, 2, 4, 6, 8, 10, 12, 14], inst: "palm" },
        "epic_hold":    { k: [0, 8], s: [4, 12], g: [0, 8], inst: "open" },
        "gallop":       { k: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], s: [4, 12], g: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], inst: "palm" },
        "triplet":      { k: [0, 3, 6, 9, 12, 15], s: [6, 12], g: [0, 3, 6, 9, 12, 15], inst: "palm" },
        "heavy_half":   { k: [0, 8], s: [8], g: [0, 8], inst: "palm" }
    };

    // --- 2. SELEZIONE PATTERN ---
    let patternKey;
    if (isIntro) {
        patternKey = weightedChoice([
            { value: "stratovarius", weight: (complexity || 0.5) * 1.5 },
            { value: "full_power",   weight: (energy || 0.5) * 1.2 },
            { value: "sparse_open",  weight: (1 - (energy || 0.5)) * 1.0 }
        ]);
    } else if (isChorus) {
        patternKey = weightedChoice([
            { value: "double_kick",  weight: (energy || 0.5) * 1.8 },
            { value: "straight",     weight: 1.0 },
            { value: "epic_hold",    weight: (brightness || 0.5) * 1.5 }
        ]);
    } else {
        patternKey = weightedChoice([
            { value: "gallop",       weight: (energy || 0.5) * 1.5 },
            { value: "triplet",      weight: (complexity || 0.5) * 1.2 },
            { value: "heavy_half",   weight: (1 - (brightness || 0.5)) * 1.3 }
        ]);
    }

    // FALLBACK CRITICO: Se per qualche motivo patternKey è sbagliato, usa "straight"
    const activePattern = PATTERNS[patternKey] || PATTERNS["straight"];

    // --- 3. LOOP ---
    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        const isLastMeasure = (m === section.measures - 1);
        const isDrumsOnlyIntro = isIntro && (m < 2) && (complexity < 0.3);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            
            const kickHit = activePattern.k.includes(s);
            const snareHit = activePattern.s.includes(s);
            let playGuitar = activePattern.g.includes(s) && !isDrumsOnlyIntro;
            let currentInst = activePattern.inst;
            let currentRoot = root;

            if (isLastMeasure && s >= 12 && nextSectionRoot && nextSectionRoot !== root) {
                playGuitar = true;
                currentInst = "palm";
                // Calcolo nota di transizione (senza ricreare oggetti Tone ogni volta)
                const rootMidi = Tone.Frequency(root + "2").toMidi();
                const nextMidi = Tone.Frequency(nextSectionRoot + "2").toMidi();
                currentRoot = Tone.Frequency(rootMidi + (nextMidi > rootMidi ? 1 : -1), "midi").toNote();
            }

            const gNote = normalizeNote(currentRoot, currentInst === "open" ? "guitarOpen" : "guitarPalm") + "2";
            const bNote = normalizeNote(currentRoot, "bass") + "1";

            Tone.Transport.schedule(time => {
                if (kickHit) drums.player("kick").start(time);
                if (snareHit) drums.player("snare").start(time);
                if (s % 2 === 0) drums.player(isChorus ? "ride" : "hihat").start(time, 0, {volume: -10});
                if (s === 0 && (m === 0 || isLastMeasure)) drums.player("crash2").start(time);

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
