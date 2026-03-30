// padEngine.js — ver. 001.5
// Multi-Style Deterministic Pad Selector + Lead Accent Reactivity

import * as Tone from "https://esm.sh/tone";

console.log("padEngine.js ver. 001.6 loaded");

export function initPadEngine(instruments, metalParams, rand, imageParams) {

    const {
        ambientPad,
        harmonicPad,
        breathingPad,
        choirPad,
        padBus
    } = instruments;

    const bpm = metalParams.bpm;
    const secondsPerBeat = 60 / bpm;

    // ------------------------------------------------------------
    // UTILITIES
    // ------------------------------------------------------------

    function createDNASeededRandom(dna) {
        let seed = (dna ?? 123456) >>> 0;
        return function () {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 0xFFFFFFFF;
        };
    }

    function getProfile(imageParams) {
        return {
            energy: imageParams?.energy ?? 0.5,
            darkness: imageParams?.texture ?? 0.5,
            complexity: imageParams?.complexity ?? 0.5,
            dna: imageParams?.dna ?? 123456
        };
    }

    // ------------------------------------------------------------
    // PAD TYPE SELECTION (deterministic)
    // ------------------------------------------------------------

    function pickPadType(section, riffAnalysis, profile) {
        const { dominantPattern, palmRatio } = riffAnalysis;
        const dna = profile.dna;
        const rDNA = createDNASeededRandom(dna);

        // Sezione → priorità assoluta
        if (section.name === "intro" || section.name === "outro") return "ambient";
        if (section.name === "chorus") return "choir";
        if (section.name === "solo") return "breathing";

        // Pattern riff
        if (palmRatio > 0.7) return "ambient";
        if (dominantPattern.includes("gallop") || dominantPattern.includes("open"))
            return "harmonic";
        if (dominantPattern.includes("burst") || dominantPattern.includes("tremolo"))
            return "breathing";
        if (dominantPattern.includes("syncopated"))
            return "choir";

        // BPM
        if (bpm < 140) return rDNA() < 0.5 ? "ambient" : "harmonic";
        if (bpm > 170) return "breathing";

        // DNA fallback
        const idx = dna % 4;
        return ["ambient", "harmonic", "breathing", "choir"][idx];
    }

    // ------------------------------------------------------------
    // PAD SCHEDULERS
    // ------------------------------------------------------------

    // ------------------------------------------------------------
// PAD SCHEDULERS (versione corretta, solo note valide A–G)
// ------------------------------------------------------------

// Utility: prende SEMPRE una nota valida dalla scala
function safeRoot(scale) {
    if (!scale || scale.length === 0) return "C";
    const n = scale[0];
    if (typeof n !== "string") return "C";
    const letter = n[0].toUpperCase();
    return "ABCDEFG".includes(letter) ? letter : "C";
}

function scheduleAmbientPad(section, scale) {
    const start = section.startTime;
    const duration = section.measures * 4 * secondsPerBeat;

    const root = safeRoot(scale);
    const note = root + "3";

    Tone.Transport.schedule(time => {
        try {
            ambientPad.triggerAttackRelease(note, duration, time, 0.4);
        } catch (e) {
            console.error("[PAD AMBIENT ERROR]", e);
        }
    }, start);
}

function scheduleHarmonicPad(section, scale) {
    const start = section.startTime;
    const beats = section.measures * 4;

    const root = safeRoot(scale);
    const note = root + "3";

    for (let m = 0; m < section.measures; m++) {
        const t = start + m * 4 * secondsPerBeat;

        Tone.Transport.schedule(time => {
            try {
                harmonicPad.triggerAttackRelease(note, 4 * secondsPerBeat, time, 0.45);
            } catch (e) {
                console.error("[PAD HARMONIC ERROR]", e);
            }
        }, t);
    }
}

function scheduleBreathingPad(section, scale) {
    const start = section.startTime;
    const beats = section.measures * 4;

    const root = safeRoot(scale);
    const note = root + "3";

    for (let b = 0; b < beats; b++) {
        const t = start + b * secondsPerBeat;
        const dur = 0.75 * secondsPerBeat;
        const vel = 0.3 + 0.1 * Math.sin(b * Math.PI / 2);

        Tone.Transport.schedule(time => {
            try {
                breathingPad.triggerAttackRelease(note, dur, time, vel);
            } catch (e) {
                console.error("[PAD BREATHING ERROR]", e);
            }
        }, t);
    }
}

function scheduleChoirPad(section, scale) {
    const start = section.startTime;
    const beats = section.measures * 4;

    const root = safeRoot(scale);
    const third = scale?.[2]?.[0] ?? root;
    const fifth = scale?.[4]?.[0] ?? root;

    const notes = [
        root + "3",
        third + "3",
        fifth + "3"
    ];

    const dur = beats * secondsPerBeat;

    Tone.Transport.schedule(time => {
        try {
            notes.forEach((n, i) => {
                const vel = 0.25 + i * 0.05;
                choirPad.triggerAttackRelease(n, dur, time, vel);
            });
        } catch (e) {
            console.error("[PAD CHOIR ERROR]", e);
        }
    }, start);
}


    // ------------------------------------------------------------
    // LEAD ACCENT REACTIVITY (musical, non-rhythmic)
    // ------------------------------------------------------------

    function schedulePadAccents(section, themeEvents, padType) {
        if (!themeEvents) return;

        themeEvents
            .filter(ev => ev.isAccent)
            .forEach(ev => {
                const t = section.startTime + ev.beatOffset * secondsPerBeat;

                Tone.Transport.schedule(time => {
                    try {
                        if (padType === "harmonic") {
                            padBus.volume.rampTo("+2", 0.1);
                            padBus.volume.rampTo("0", 0.3);
                        }

                        if (padType === "breathing") {
                            breathingPad.filter?.frequency?.rampTo?.(3000, 0.2);
                            breathingPad.filter?.frequency?.rampTo?.(1500, 0.4);
                        }

                        if (padType === "choir") {
                            choirPad.reverb?.wet?.rampTo?.(0.9, 0.2);
                            choirPad.reverb?.wet?.rampTo?.(0.7, 0.4);
                        }

                    } catch (e) {
                        console.error("[PAD ACCENT ERROR]", e);
                    }
                }, t);
            });
    }

    // ------------------------------------------------------------
    // PUBLIC API
    // ------------------------------------------------------------

    function scheduleSection(section, scale, progression, riffEvents, riffAnalysis, themeEvents) {
        const profile = getProfile(imageParams);
        const padType = pickPadType(section, riffAnalysis, profile);

        console.log(
            "%c[PAD ENGINE] section:",
            "color:#66ccff; font-weight:bold;",
            section.name,
            "→ type:",
            padType
        );

        if (!padBus) {
            console.warn("[PAD ENGINE] padBus non definito, skip");
            return;
        }

        // Pad principale
        switch (padType) {
    case "ambient":
        scheduleAmbientPad(section, scale);
        break;
    case "harmonic":
        scheduleHarmonicPad(section, scale);
        break;
    case "breathing":
        scheduleBreathingPad(section, scale);
        break;
    case "choir":
        scheduleChoirPad(section, scale);
        break;
}


        // Reattività agli accenti della lead
        schedulePadAccents(section, themeEvents, padType);
    }

    return {
        scheduleSection
    };
}
