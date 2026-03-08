//
// drumsEngine.js
// Drum Engine Sequenziale a 4 misure per sezione
//

import { drums } from "./common.js";   // i tuoi sample
import * as Tone from "tone";

// -------------------------------------------------------------
// Utility
// -------------------------------------------------------------
function rand(seed) {
    // LCG deterministico basato sul DNA
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
}

function choose(arr, r) {
    return arr[Math.floor(r * arr.length)];
}

function humanize(time, amount = 0.005) {
    return time + (Math.random() * amount - amount / 2);
}

// -------------------------------------------------------------
// Pattern base per stile (1 misura)
// -------------------------------------------------------------
function patternThrash(seed, params) {
    const r = rand(seed);
    const kickDensity = 0.6 + params.energy * 0.4;
    const rideRate = params.energy > 0.5 ? "16n" : "8n";

    return {
        kick: kickDensity,
        snare: [2, 4], // backbeat
        cymbal: "ride",
        cymbalRate: rideRate
    };
}

function patternPower(seed, params) {
    const r = rand(seed);
    const kickDensity = 0.4 + params.energy * 0.3;

    return {
        kick: kickDensity,
        snare: [2, 4],
        cymbal: params.brightness > 0.75 ? "openhat" : "ride",
        cymbalRate: "8n"
    };
}

function patternHeavy(seed, params) {
    const r = rand(seed);
    const kickDensity = 0.3 + params.energy * 0.3;

    return {
        kick: kickDensity,
        snare: [2, 4],
        cymbal: "hihat",
        cymbalRate: "8n"
    };
}

function patternDoom(seed, params) {
    const r = rand(seed);
    const kickDensity = 0.15 + params.energy * 0.2;

    return {
        kick: kickDensity,
        snare: [3], // colpo pesante
        cymbal: "ride",
        cymbalRate: "4n"
    };
}

// -------------------------------------------------------------
// Fill generator (fine misura 4)
// -------------------------------------------------------------
function generateFill(seed, params) {
    const r = rand(seed);
    const complexity = params.complexity;

    if (complexity < 0.3) {
        return [
            { sample: "snare", pos: "3:3:2" },
            { sample: "crash1", pos: "4:0:0" }
        ];
    }

    if (complexity < 0.6) {
        return [
            { sample: "tom2", pos: "3:2:0" },
            { sample: "tom3", pos: "3:2:2" },
            { sample: "snare", pos: "3:3:0" },
            { sample: "crash2", pos: "4:0:0" }
        ];
    }

    return [
        { sample: "tom1", pos: "3:1:0" },
        { sample: "tom2", pos: "3:1:2" },
        { sample: "tom3", pos: "3:2:0" },
        { sample: "tom4", pos: "3:2:2" },
        { sample: "snare", pos: "3:3:0" },
        { sample: "china", pos: "3:3:2" },
        { sample: "crash1", pos: "4:0:0" }
    ];
}

// -------------------------------------------------------------
// Genera 1 misura completa
// -------------------------------------------------------------
function generateMeasure(seed, style, params) {
    let base;

    if (style === "thrash") base = patternThrash(seed, params);
    else if (style === "power") base = patternPower(seed, params);
    else if (style === "doom") base = patternDoom(seed, params);
    else base = patternHeavy(seed, params);

    const events = [];

    // Kick
    for (let step = 0; step < 16; step++) {
        const r = rand(seed + step);
        if (r < base.kick) {
            events.push({ sample: "kick", pos: `0:0:${step}` });
        }
    }

    // Snare
    for (let beat of base.snare) {
        events.push({ sample: "snare", pos: `0:${beat}:0` });
    }

    // Ghost notes (texture)
    if (params.texture > 0.4) {
        for (let step = 1; step < 16; step += 4) {
            const r = rand(seed + step * 2);
            if (r < params.texture) {
                events.push({ sample: "ghost", pos: `0:0:${step}` });
            }
        }
    }

    // Cymbal
    const cymbal = base.cymbal;
    const rate = base.cymbalRate;
    const steps = rate === "16n" ? 16 : rate === "8n" ? 8 : 4;

    for (let i = 0; i < steps; i++) {
        const pos = rate === "16n"
            ? `0:0:${i}`
            : rate === "8n"
            ? `0:${Math.floor(i/2)}:${(i%2)*2}`
            : `0:${i}:0`;

        events.push({ sample: cymbal, pos });
    }

    return events;
}

// -------------------------------------------------------------
// Genera 4 misure complete
// -------------------------------------------------------------
function generate4Bars(style, params) {
    const events = [];
    let seed = params.dna;

    for (let bar = 0; bar < 4; bar++) {
        const measure = generateMeasure(seed + bar * 1000, style, params);

        for (let ev of measure) {
            const [m, b, s] = ev.pos.split(":").map(Number);
            const newPos = `${bar}:${b}:${s}`;
            events.push({ sample: ev.sample, pos: newPos });
        }
    }

    // Fill alla misura 4
    const fill = generateFill(seed + 99999, params);
    for (let ev of fill) {
        events.push(ev);
    }

    return events;
}

// -------------------------------------------------------------
// Drum Engine principale
// -------------------------------------------------------------
export function createDrumEngine(style, params) {
    return {
        playSection(time, duration) {
            const events = generate4Bars(style, params);

            for (let ev of events) {
                Tone.Transport.schedule((absTime) => {
                    drums.player(ev.sample).start(humanize(absTime), 0, 1);
                }, time + Tone.Time(ev.pos).toSeconds());
            }
        }
    };
}
