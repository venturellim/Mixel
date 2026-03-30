// padEngine.js — ver. 001.7 (stable)
// Multi-Style Deterministic Pad Selector + Lead Accent Reactivity
// Fix: note infinite + releaseAll() automatico

import * as Tone from "https://esm.sh/tone";

console.log("padEngine.js ver. 001.7 loaded");

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
    // PAD TYPE SELECTION
    // ------------------------------------------------------------

    function pickPadType(section, riffAnalysis, profile) {
        const { dominantPattern, palmRatio } = riffAnalysis;
        const dna = profile.dna;
        const rDNA = createDNASeededRandom(dna);

        if (section.name === "intro" || section.name === "outro") return "ambient";
        if (section.name === "chorus") return "choir";
        if (section.name === "solo") return "breathing";

        if (palmRatio > 0.7) return "ambient";
        if (dominantPattern.includes("gallop") || dominantPattern.includes("open"))
            return "harmonic";
        if (dominantPattern.includes("burst") || dominantPattern.includes("tremolo"))
            return "breathing";
        if (dominantPattern.includes("syncopated"))
            return "choir";

        if (bpm < 140) return rDNA() < 0.5 ? "ambient" : "harmonic";
        if (bpm > 170) return "breathing";

        const idx = dna % 4;
        return ["ambient", "harmonic", "breathing", "choir"][idx];
    }

    // ------------------------------------------------------------
    // SAFE NOTE UTILITY
    // ------------------------------------------------------------

    function safeRoot(scale) {
        if (!scale || scale.length === 0) return "C";
        const n = scale[0];
        if (typeof n !== "string") return "C";
        const letter = n[0].toUpperCase();
        return "ABCDEFG".includes(letter) ? letter : "C";
    }

    // ------------------------------------------------------------
    // PAD SCHEDULERS (SAFE)
    // ------------------------------------------------------------

    function scheduleAmbientPad(section, scale) {
        const start = section.startTime;
        const dur = section.measures + "m"; // durata musicale stabile

        const note = safeRoot(scale) + "3";

        Tone.Transport.schedule(time => {
            try {
                ambientPad.triggerAttackRelease(note, dur, time, 0.4);
            } catch (e) {
                console.error("[PAD AMBIENT ERROR]", e);
            }
        }, start);
    }

    function scheduleHarmonicPad(section, scale) {
        const start = section.startTime;
        const note = safeRoot(scale) + "3";

        for (let m = 0; m < section.measures; m++) {
            const t = start + m * 4 * secondsPerBeat;

            Tone.Transport.schedule(time => {
                try {
                    harmonicPad.triggerAttackRelease(note, "1m", time, 0.45);
                } catch (e) {
                    console.error("[PAD HARMONIC ERROR]", e);
                }
            }, t);
        }
    }

    function scheduleBreathingPad(section, scale) {
        const start = section.startTime;
        const beats = section.measures * 4;
        const note = safeRoot(scale) + "3";

        for (let b = 0; b < beats; b++) {
            const t = start + b * secondsPerBeat;
            const vel = 0.3 + 0.1 * Math.sin(b * Math.PI / 2);

            Tone.Transport.schedule(time => {
                try {
                    breathingPad.triggerAttackRelease(note, "8n", time, vel);
                } catch (e) {
                    console.error("[PAD BREATHING ERROR]", e);
                }
            }, t);
        }
    }

    function scheduleChoirPad(section, scale) {
        const start = section.startTime;
        const dur = section.measures + "m";

        const root = safeRoot(scale);
        const third = scale?.[2]?.[0] ?? root;
        const fifth = scale?.[4]?.[0] ?? root;

        const notes = [
            root + "3",
            third + "3",
            fifth + "3"
        ];

        Tone.Transport.schedule(time => {
            try {
                notes.forEach((n, i) => {
                    choirPad.triggerAttackRelease(n, dur, time, 0.25 + i * 0.05);
                });
            } catch (e) {
                console.error("[PAD CHOIR ERROR]", e);
            }
        }, start);
    }

    // ------------------------------------------------------------
    // RELEASE FORZATO (FIX DEFINITIVO)
    // ------------------------------------------------------------

    function forcePadRelease(section) {
        const t = section.endTime - 0.05;

        Tone.Transport.schedule(time => {
            try {
                ambientPad.releaseAll(time);
                harmonicPad.releaseAll(time);
                breathingPad.releaseAll(time);
                choirPad.releaseAll(time);
            } catch (e) {
                console.warn("[PAD RELEASE ERROR]", e);
            }
        }, t);
    }

    // ------------------------------------------------------------
    // LEAD ACCENT REACTIVITY
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

        schedulePadAccents(section, themeEvents, padType);

        // FIX: rilascia SEMPRE il pad alla fine della sezione
        forcePadRelease(section);
    }

    return {
        scheduleSection
    };
}
