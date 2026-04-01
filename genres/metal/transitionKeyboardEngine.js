// transitionKeyboardEngine.js
// Versione 1.0 — Power Metal Keyboard Engine

console.log("transitionKeyboardEngine.js ver. 001 loaded");

const keyboardPatterns = {};

// ============================================================
// REGISTRAZIONE PATTERN
// ============================================================

export function registerKeyboardPattern(def) {
    keyboardPatterns[def.name] = def;
}

export function pickKeyboardPattern(instrument, imageParams, rand) {

    const energy = imageParams?.energy ?? 0.5;
    const complexity = imageParams?.complexity ?? 0.5;

    // Se la transizione è keyboard → scegli pattern melodico
    if (instrument === "keyboard") {
        if (energy > 0.7) return "scale_run";
        if (complexity > 0.6) return "fanfare";
        return rand() > 0.5 ? "arp_up" : "arp_down";
    }

    // Se la transizione è palm/mixed → arpeggi semplici
    if (instrument === "palm" || instrument === "mixed") {
        return rand() > 0.5 ? "arp_up" : "cluster";
    }

    // Se la transizione è bass → cluster epico
    if (instrument === "bass") return "cluster";

    // Se la transizione è lead → scale run
    if (instrument === "lead") return "scale_run";

    // Default
    return "arp_up";
}

export function generateKeyboardEvents(patternName, scale, durationBeats, rand) {
    const pattern = keyboardPatterns[patternName];
    if (!pattern) return { events: [] };
    return pattern.generate(scale, durationBeats, rand);
}

// ============================================================
// HELPERS
// ============================================================

function vel(base, variation = 0.1, rand) {
    return Math.max(0.1, Math.min(1, base + (rand() * variation * 2 - variation)));
}

function swingOffset(beatOffset, amount = 0.02) {
    return beatOffset + (beatOffset % 0.5 === 0.25 ? amount : 0);
}

// ============================================================
// PATTERN DEFINITI
// ============================================================

// 1) Arpeggio Ascendente
registerKeyboardPattern({
    name: "arp_up",
    generate(scale, durationBeats, rand) {
        const events = [];
        const totalSteps = durationBeats * 4;

        for (let b = 0; b < totalSteps; b++) {
            const beatOffset = swingOffset(b * 0.25);
            const idx = b % scale.length;
            const note = scale[idx] + "5";

            events.push({
                beatOffset,
                note,
                velocity: vel(0.8, 0.1, rand)
            });
        }

        return { events };
    }
});

// 2) Arpeggio Discendente
registerKeyboardPattern({
    name: "arp_down",
    generate(scale, durationBeats, rand) {
        const events = [];
        const totalSteps = durationBeats * 4;

        for (let b = 0; b < totalSteps; b++) {
            const beatOffset = swingOffset(b * 0.25);
            const idx = scale.length - 1 - (b % scale.length);
            const note = scale[idx] + "5";

            events.push({
                beatOffset,
                note,
                velocity: vel(0.8, 0.1, rand)
            });
        }

        return { events };
    }
});

// 3) Scale Run (power metal)
registerKeyboardPattern({
    name: "scale_run",
    generate(scale, durationBeats, rand) {
        const events = [];
        const totalSteps = durationBeats * 4;

        for (let b = 0; b < totalSteps; b++) {
            const beatOffset = swingOffset(b * 0.25);
            const idx = (b * 2) % scale.length;
            const note = scale[idx] + "6";

            events.push({
                beatOffset,
                note,
                velocity: vel(0.9, 0.1, rand)
            });
        }

        // Fill finale
        const fillStart = durationBeats - 0.25;
        for (let i = 0; i < 4; i++) {
            const idx = (scale.length - 1 - i) % scale.length;
            events.push({
                beatOffset: fillStart + i * 0.0625,
                note: scale[idx] + "6",
                velocity: vel(1, 0.1, rand)
            });
        }

        return { events };
    }
});

// 4) Fanfare (triadi epiche)
registerKeyboardPattern({
    name: "fanfare",
    generate(scale, durationBeats, rand) {
        const events = [];
        const totalSteps = durationBeats * 2;

        for (let b = 0; b < totalSteps; b++) {
            const beatOffset = swingOffset(b * 0.5);
            const root = scale[b % scale.length];

            const triad = [
                root + "5",
                scale[(b + 2) % scale.length] + "5",
                scale[(b + 4) % scale.length] + "5"
            ];

            triad.forEach(note => {
                events.push({
                    beatOffset,
                    note,
                    velocity: vel(0.9, 0.1, rand)
                });
            });
        }

        return { events };
    }
});

// 5) Cluster Epico (Nightwish style)
registerKeyboardPattern({
    name: "cluster",
    generate(scale, durationBeats, rand) {
        const events = [];
        const totalSteps = durationBeats * 2;

        for (let b = 0; b < totalSteps; b++) {
            const beatOffset = swingOffset(b * 0.5);

            scale.slice(0, 4).forEach((n, i) => {
                events.push({
                    beatOffset,
                    note: n + (5 + i % 2),
                    velocity: vel(0.7 + i * 0.05, 0.1, rand)
                });
            });
        }

        return { events };
    }
});
