// padEngine.js — ver. 3.1
// Power Metal Pad Engine — Stable Edition
// Ridotta polifonia, layering ottimizzato, FX leggeri, LFO-driven

import * as Tone from "https://esm.sh/tone";

console.log("padEngine.js ver. 003.1 loaded");

export function initPadEngine(instruments, metalParams, rand, imageParams) {

    const {
        ambientPad,
        harmonicPad,
        breathingPad,
        choirPad,
        arpeggioPad,
        counterPad,
        padBus,

        ambientFilter,
        harmonicFilter,
        breathingFilter,
        choirFilter,
        choirReverb,
        counterFilter
    } = instruments;

    const bpm = metalParams.bpm;
    const secondsPerBeat = 60 / bpm;

    // ------------------------------------------------------------
    // PROFILE
    // ------------------------------------------------------------

    function getProfile(imageParams) {
        return {
            energy: imageParams?.energy ?? 0.5,
            darkness: imageParams?.texture ?? 0.5,
            complexity: imageParams?.complexity ?? 0.5
        };
    }

    // ------------------------------------------------------------
    // SAFE VOICING (2 NOTE)
    // ------------------------------------------------------------

    function safeRoot(scale) {
        if (!scale || scale.length === 0) return "C";
        const n = scale[0];
        return typeof n === "string" ? n[0].toUpperCase() : "C";
    }

    function buildVoicing(scale) {
        const root = safeRoot(scale);
        const fifth = scale?.[4]?.[0] ?? root;
        return [
            root + "3",
            fifth + "3"
        ];
    }

    // ------------------------------------------------------------
    // PAD SCHEDULERS (2 note max)
    // ------------------------------------------------------------

    function scheduleAmbientPad(section, scale) {
        const start = section.startTime;
        const notes = buildVoicing(scale);

        Tone.Transport.schedule(time => {
            notes.forEach(n =>
                ambientPad.triggerAttackRelease(n, "4m", time, 0.35)
            );
        }, start);
    }

    function scheduleHarmonicPad(section, scale) {
        const start = section.startTime;
        const notes = buildVoicing(scale);

        for (let m = 0; m < section.measures; m++) {
            const t = start + m * 4 * secondsPerBeat;
            Tone.Transport.schedule(time => {
                notes.forEach(n =>
                    harmonicPad.triggerAttackRelease(n, "1m", time, 0.4)
                );
            }, t);
        }
    }

    function scheduleBreathingPad(section, scale) {
        const start = section.startTime;
        const beats = section.measures * 4;
        const notes = buildVoicing(scale);

        for (let b = 0; b < beats; b++) {
            const t = start + b * secondsPerBeat;
            const vel = 0.22 + 0.08 * Math.sin(b * Math.PI / 2);

            Tone.Transport.schedule(time => {
                notes.forEach(n =>
                    breathingPad.triggerAttackRelease(n, "8n", time, vel)
                );
            }, t);
        }
    }

    function scheduleChoirPad(section, scale) {
        const start = section.startTime;
        const notes = buildVoicing(scale);

        Tone.Transport.schedule(time => {
            notes.forEach((n, i) =>
                choirPad.triggerAttackRelease(n, "4m", time, 0.25 + i * 0.05)
            );
        }, start);
    }

    // ------------------------------------------------------------
    // ARPEGGI (2 note)
    // ------------------------------------------------------------

    function scheduleArp8th(section, scale) {
        const start = section.startTime;
        const notes = buildVoicing(scale);
        const beats = section.measures * 4;

        for (let b = 0; b < beats; b++) {
            const t = start + b * secondsPerBeat;
            const n = notes[b % notes.length];

            Tone.Transport.schedule(time => {
                arpeggioPad.triggerAttackRelease(n, "8n", time, 0.3);
            }, t);
        }
    }

    function scheduleArpeggio(section, scale, profile) {
        if (section.name === "intro" || section.name === "outro") return;
        scheduleArp8th(section, scale);
    }

    // ------------------------------------------------------------
    // CONTRO-MELODIE (1 nota per volta)
    // ------------------------------------------------------------

    function scheduleCounterMelody(section, scale, themeEvents, profile) {
        if (section.name !== "chorus") return;

        const start = section.startTime;
        const beats = section.measures * 4;
        const pool = scale.map(n => n[0].toUpperCase() + "4");

        for (let b = 0; b < beats; b += 2) {
            const t = start + b * secondsPerBeat;
            const n = pool[b % pool.length];

            Tone.Transport.schedule(time => {
                counterPad.triggerAttackRelease(n, "4n", time, 0.35);
            }, t);
        }
    }

    // ------------------------------------------------------------
    // LFO MOVEMENT (safe)
    // ------------------------------------------------------------

    new Tone.LFO({ type: "sine", frequency: 0.05, min: 1500, max: 2500 })
        .start()
        .connect(ambientFilter.frequency);

    new Tone.LFO({ type: "sine", frequency: 0.07, min: 0.5, max: 1.2 })
        .start()
        .connect(breathingFilter.Q);

    new Tone.LFO({ type: "sine", frequency: 0.03, min: 0.6, max: 0.8 })
        .start()
        .connect(choirReverb.wet);

    // ------------------------------------------------------------
    // RELEASE
    // ------------------------------------------------------------

    function forcePadRelease(section) {
        const t = section.endTime - 0.05;
        Tone.Transport.schedule(time => {
            ambientPad.releaseAll(time);
            harmonicPad.releaseAll(time);
            breathingPad.releaseAll(time);
            choirPad.releaseAll(time);
            arpeggioPad.releaseAll(time);
            counterPad.releaseAll(time);
        }, t);
    }

    // ------------------------------------------------------------
    // LAYERING OTTIMIZZATO (max 2 pad)
    // ------------------------------------------------------------

    function pickLayers(section) {
        switch (section.name) {
            case "intro":  return ["ambient"];
            case "verse":  return ["harmonic"];
            case "chorus": return ["choir", "ambient"];
            case "solo":   return ["breathing"];
            case "outro":  return ["ambient"];
            default:       return ["ambient"];
        }
    }

    function scheduleLayeredPads(section, scale, layers) {
        layers.forEach(layer => {
            switch (layer) {
                case "ambient":   scheduleAmbientPad(section, scale); break;
                case "harmonic":  scheduleHarmonicPad(section, scale); break;
                case "breathing": scheduleBreathingPad(section, scale); break;
                case "choir":     scheduleChoirPad(section, scale); break;
            }
        });
    }

    // ------------------------------------------------------------
    // PUBLIC API
    // ------------------------------------------------------------

    function scheduleSection(section, scale, progression, riffEvents, riffAnalysis, themeEvents, prevSection) {
        const profile = getProfile(imageParams);
        const layers = pickLayers(section);

        scheduleLayeredPads(section, scale, layers);
        scheduleArpeggio(section, scale, profile);
        scheduleCounterMelody(section, scale, themeEvents, profile);

        forcePadRelease(section);
    }

    return {
        scheduleSection
    };
}
