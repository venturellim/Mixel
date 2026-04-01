// transitionDrumEngine.js
// Versione 1.0 — Power Metal Drum Engine

console.log("transitionDrumEngine.js ver. 001 loaded");

const drumPatterns = {};

export function registerDrumPattern(def) {
    drumPatterns[def.name] = def;
}

function vel(base, variation = 0.1, rand) {
    return Math.max(0.1, Math.min(1, base + (rand() * variation * 2 - variation)));
}

function swingOffset(beatOffset, amount = 0.02) {
    return beatOffset + (beatOffset % 0.5 === 0.25 ? amount : 0);
}


export function pickDrumPattern(instrument, imageParams, rand) {

    const energy = imageParams?.energy ?? 0.5;
    const complexity = imageParams?.complexity ?? 0.5;

    // Keyboard → Tom Run
    if (instrument === "keyboard") return "tom_run";

    // Lead → Blast Fill
    if (instrument === "lead") return "blast_fill";

    // Palm / Mixed → Double Kick o Accent
    if (instrument === "palm" || instrument === "mixed") {
        return rand() > 0.4 ? "double_kick" : "double_kick_accent";
    }

    // Bass → Ride Power
    if (instrument === "bass") return "ride_power";

    // Drums → usa il pattern nativo
    if (instrument === "drums") return "native";

    return "double_kick";
}

export function generateDrumEvents(patternName, durationBeats, rand) {
    const pattern = drumPatterns[patternName];
    if (!pattern) return { events: [] };
    return pattern.generate(durationBeats, rand);
}

// ============================================================
// PATTERN DEFINITI
// ============================================================

// 1) Double Kick
registerDrumPattern({
    name: "double_kick",
    generate(durationBeats, rand) {
        const events = [];
        const totalSteps = durationBeats * 4;

        for (let b = 0; b < totalSteps; b++) {
            const beatOffset = swingOffset(b * 0.25);

            // Kick continuo
            events.push({
                beatOffset,
                drum: "kick",
                velocity: vel(0.9, 0.05, rand)
            });

            // Snare su 2 e 4
            if (b % 8 === 4) {
                events.push({
                    beatOffset,
                    drum: "snare",
                    velocity: vel(0.95, 0.05, rand)
                });
            }

            // Ghost note tra i beat
            if (b % 2 === 1) {
                events.push({
                    beatOffset: beatOffset + 0.125,
                    drum: "snare",
                    velocity: vel(0.25, 0.05, rand)
                });
            }
        }

        return { events };
    }
});

// 2) Double Kick Accent
registerDrumPattern({
    name: "double_kick_accent",
    generate(durationBeats, rand) {
        const events = [];
        const totalSteps = durationBeats * 4;

        for (let b = 0; b < totalSteps; b++) {
            const beatOffset = swingOffset(b * 0.25);

            events.push({
                beatOffset,
                drum: "kick",
                velocity: vel(0.9, 0.05, rand)
            });

            if (b % 8 === 4) {
                events.push({
                    beatOffset,
                    drum: "snare",
                    velocity: vel(0.95, 0.05, rand)
                });
            }

            // Crash su 1 e 3
            if (b % 4 === 0) {
                events.push({
                    beatOffset,
                    drum: "crash",
                    velocity: vel(0.8, 0.1, rand)
                });
            }
        }

        return { events };
    }
});

// 3) Tom Run
registerDrumPattern({
    name: "tom_run",
    generate(durationBeats, rand) {
        const toms = ["tom1", "tom2", "tom3", "tom4"];
        const events = [];
        const totalSteps = durationBeats * 4;

        for (let b = 0; b < totalSteps; b++) {
            const beatOffset = swingOffset(b * 0.25);
            const idx = b % 4;

            events.push({
                beatOffset,
                drum: toms[idx],
                velocity: vel(0.85, 0.1, rand)
            });
        }

        // Fill finale negli ultimi 0.5 beat
        const fillStart = durationBeats - 0.5;
        for (let i = 0; i < 4; i++) {
            events.push({
                beatOffset: fillStart + i * 0.125,
                drum: toms[i % 4],
                velocity: vel(1, 0.1, rand)
            });
        }

        return { events };
    }
});

// 4) Blast Fill
registerDrumPattern({
    name: "blast_fill",
    generate(durationBeats, rand) {
        const events = [];
        const totalSteps = durationBeats * 4;

        for (let b = 0; b < totalSteps; b++) {
            const beatOffset = swingOffset(b * 0.25);

            const drum = rand() > 0.5 ? "snare" : "kick";

            events.push({
                beatOffset,
                drum,
                velocity: vel(0.9, 0.1, rand)
            });
        }

        return { events };
    }
});

// 5) Ride Power
registerDrumPattern({
    name: "ride_power",
    generate(durationBeats, rand) {
        const events = [];
        const totalSteps = durationBeats * 4;

        for (let b = 0; b < totalSteps; b++) {
            const beatOffset = swingOffset(b * 0.25);

            if (b % 4 === 0) {
                events.push({
                    beatOffset,
                    drum: "kick",
                    velocity: vel(0.9, 0.05, rand)
                });
            }

            if (b % 8 === 4) {
                events.push({
                    beatOffset,
                    drum: "snare",
                    velocity: vel(0.95, 0.05, rand)
                });
            }

            if (b % 2 === 0) {
                events.push({
                    beatOffset,
                    drum: "ride",
                    velocity: vel(0.7, 0.1, rand)
                });
            }
        }

        return { events };
    }
});

