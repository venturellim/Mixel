// drumsEngine.js — versione moderna per Tone.js 15
import { drums } from "./common.js";
import * as Tone from "https://esm.sh/tone";

// -------------------------------------------------------------
// Utility
// -------------------------------------------------------------
function seededRand(seed) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
}

function humanize(time, amount = 0.005) {
    return time + (Math.random() * amount - amount / 2);
}

// -------------------------------------------------------------
// Pattern base per stile (1 misura = 16 step)
// -------------------------------------------------------------
function getBasePattern(style, params) {
    const energy = params.energy;
    const brightness = params.brightness;

    if (style === "thrash") {
        return {
            kickDensity: 0.6 + energy * 0.4,
            snareBeats: [4, 12],
            cymbal: "ride",
            cymbalRate: "16n"
        };
    }

    if (style === "power") {
        return {
            kickDensity: 0.4 + energy * 0.3,
            snareBeats: [4, 12],
            cymbal: brightness > 0.75 ? "openhat" : "ride",
            cymbalRate: "8n"
        };
    }

    if (style === "doom") {
        return {
            kickDensity: 0.15 + energy * 0.2,
            snareBeats: [8],
            cymbal: "ride",
            cymbalRate: "4n"
        };
    }

    // heavy default
    return {
        kickDensity: 0.3 + energy * 0.3,
        snareBeats: [4, 12],
        cymbal: "hihat",
        cymbalRate: "8n"
    };
}

// -------------------------------------------------------------
// Genera una misura di 16 step
// -------------------------------------------------------------
function generateMeasure(style, params, seed) {
    const base = getBasePattern(style, params);
    const events = Array.from({ length: 16 }, () => []);

    // Kick
    for (let step = 0; step < 16; step++) {
        const r = seededRand(seed + step);
        if (r < base.kickDensity) {
            events[step].push("kick");
        }
    }

    // Snare
    for (let s of base.snareBeats) {
        events[s].push("snare");
    }

    // Ghost notes
    if (params.texture > 0.4) {
        for (let step = 1; step < 16; step += 4) {
            const r = seededRand(seed + step * 2);
            if (r < params.texture) {
                events[step].push("ghost");
            }
        }
    }

    // Cymbal pattern
    const cym = base.cymbal;
    const rate = base.cymbalRate;

    if (rate === "16n") {
        for (let i = 0; i < 16; i++) events[i].push(cym);
    } else if (rate === "8n") {
        for (let i = 0; i < 8; i++) events[i * 2].push(cym);
    } else if (rate === "4n") {
        for (let i = 0; i < 4; i++) events[i * 4].push(cym);
    }

    return events;
}

// -------------------------------------------------------------
// Fill generator (1 misura)
// -------------------------------------------------------------
function generateFill(params, seed) {
    const complexity = params.entropy;
    const events = Array.from({ length: 16 }, () => []);

    if (complexity < 0.3) {
        events[14].push("snare");
        events[15].push("crash1");
        return events;
    }

    if (complexity < 0.6) {
        events[10].push("tom2");
        events[11].push("tom3");
        events[14].push("snare");
        events[15].push("crash2");
        return events;
    }

    events[6].push("tom1");
    events[7].push("tom2");
    events[10].push("tom3");
    events[11].push("tom4");
    events[14].push("snare");
    events[15].push("china");
    return events;
}

// -------------------------------------------------------------
// Drum Engine continuo (step-based)
// -------------------------------------------------------------
export function createDrumEngine(analysis, rand) {
    const style = analysis.style || "heavy";
    let seed = Math.floor(analysis.brightness * 1000000);

    let currentMeasure = generateMeasure(style, analysis, seed);
    let nextMeasure = generateMeasure(style, analysis, seed + 999);

    let step = 0;
    let measureCount = 0;

    return function(time, globalStep) {

        const events = currentMeasure[step];

        // Suona gli eventi dello step
        for (let sample of events) {
            drums.player(sample).start(humanize(time), 0, 1);
        }

        step++;

        // Fine misura → passa alla successiva
        if (step >= 16) {
            step = 0;
            measureCount++;

            // Ogni 4 misure → fill
            if (measureCount % 4 === 0) {
                currentMeasure = generateFill(analysis, seed + measureCount * 1234);
            } else {
                currentMeasure = nextMeasure;
            }

            nextMeasure = generateMeasure(style, analysis, seed + measureCount * 999);
        }
    };
}
