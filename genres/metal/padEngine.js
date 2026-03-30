// padEngine.js — ver. 3.0
// Power Metal Keyboardist: Pad Layering + Arpeggi + Contro‑melodie + Reverse Swell
// Versione LFO-driven: nessuna automazione param live nel mezzo del playback

import * as Tone from "https://esm.sh/tone";

console.log("padEngine.js ver. 003.0 test loaded");

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
    
    function dropFourthOctave(note) {
    if (!note || typeof note !== "string") return note;
    const letter = note[0];
    const oct = parseInt(note.slice(1), 10);
    if (Number.isNaN(oct)) return note;
    if (oct >= 4) return letter + "3";
    return note;
}


    // ------------------------------------------------------------
    // PROFILE FROM IMAGE
    // ------------------------------------------------------------

    function getProfile(imageParams) {
        return {
            energy: imageParams?.energy ?? 0.5,
            darkness: imageParams?.texture ?? 0.5,
            complexity: imageParams?.complexity ?? 0.5,
            dna: imageParams?.dna ?? 123456
        };
    }

    // ------------------------------------------------------------
    // SAFE NOTE UTILITY (solo per evitare note strane)
    // ------------------------------------------------------------

    function safeRoot(scale) {
        if (!scale || scale.length === 0) return "C";
        const n = scale[0];
        if (typeof n !== "string") return "C";
        const letter = n[0].toUpperCase();
        return "ABCDEFG".includes(letter) ? letter : "C";
    }

    function buildVoicing(scale) {
        const root = safeRoot(scale);
        const third = scale?.[2]?.[0] ?? root;
        const fifth = scale?.[4]?.[0] ?? root;

        return [
            root + "3",
            third + "3",
            fifth + "3",
            root + "4"
        ];
    }

    function buildScaleInRange(scale, lowOct, highOct) {
        const letters = scale.map(n => n[0].toUpperCase());
        const notes = [];
        for (let o = lowOct; o <= highOct; o++) {
            letters.forEach(l => notes.push(l + o));
        }
        return notes;
    }

    // ------------------------------------------------------------
    // PAD SCHEDULERS
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
                    harmonicPad.triggerAttackRelease(n, "1m", time, 0.45)
                );
            }, t);
        }
    }

    function scheduleBreathingPad(section, scale) {
    const start = section.startTime;
    const beats = section.measures * 4;
    const rawNotes = buildVoicing(scale);

    // qui applichiamo il clamp difensivo
    const notes = rawNotes.map(dropFourthOctave);

    for (let b = 0; b < beats; b++) {
        const t = start + b * secondsPerBeat;
        const vel = 0.25 + 0.1 * Math.sin(b * Math.PI / 2);

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
    // ARPEGGI POWER METAL
    // ------------------------------------------------------------

    function scheduleArp8th(section, scale) {
        const start = section.startTime;
        const notes = buildVoicing(scale);
        const pattern = notes;
        const beats = section.measures * 4;

        for (let b = 0; b < beats; b++) {
            const t = start + b * secondsPerBeat;
            const n = pattern[b % pattern.length];

            Tone.Transport.schedule(time => {
                arpeggioPad.triggerAttackRelease(n, "8n", time, 0.35);
            }, t);
        }
    }

    function scheduleArp16th(section, scale) {
        const start = section.startTime;
        const notes = buildVoicing(scale);
        const pattern = notes;
        const steps = section.measures * 16;

        for (let s = 0; s < steps; s++) {
            const t = start + s * (secondsPerBeat / 4);
            const n = pattern[s % pattern.length];

            Tone.Transport.schedule(time => {
                arpeggioPad.triggerAttackRelease(n, "16n", time, 0.3);
            }, t);
        }
    }

    function scheduleArpBroken(section, scale) {
        const start = section.startTime;
        const notes = buildVoicing(scale);

        const pattern = [
            notes[0],
            notes[2],
            notes[1],
            notes[0]
        ];

        const beats = section.measures * 4;

        for (let b = 0; b < beats; b++) {
            const t = start + b * secondsPerBeat;
            const n = pattern[b % pattern.length];

            Tone.Transport.schedule(time => {
                arpeggioPad.triggerAttackRelease(n, "8n", time, 0.35);
            }, t);
        }
    }

    function scheduleArpMixed(section, scale) {
        if (section.name === "chorus") {
            scheduleArp16th(section, scale);
        } else {
            scheduleArp8th(section, scale);
        }
    }

    function pickArpeggioStyle(profile) {
        const { energy, darkness, complexity } = profile;

        if (complexity > 0.7 && energy > 0.6) return "16th";
        if (darkness > 0.6) return "broken";
        if (energy > 0.7 && darkness < 0.4) return "mixed";
        return "8th";
    }

    function scheduleArpeggio(section, scale, profile) {
        if (section.name === "intro" || section.name === "outro") return;

        const style = pickArpeggioStyle(profile);

        switch (style) {
            case "8th":    scheduleArp8th(section, scale); break;
            case "16th":   scheduleArp16th(section, scale); break;
            case "broken": scheduleArpBroken(section, scale); break;
            case "mixed":  scheduleArpMixed(section, scale); break;
        }
    }

    // ------------------------------------------------------------
    // CONTRO‑MELODIE
    // ------------------------------------------------------------

    function pickCounterMelodyStyle(profile) {
        const { energy, darkness } = profile;

        if (energy > 0.7) return "energetic";
        if (darkness > 0.6) return "epic";
        return "lyric";
    }

    function isSafeAgainstLead(note, themeEvents) {
        if (!themeEvents || themeEvents.length === 0) return true;
        const pitch = note[0].toUpperCase();
        return !themeEvents.some(ev => {
            if (!ev.note) return false;
            return ev.note[0].toUpperCase() === pitch;
        });
    }

    function scheduleCounterMelodyLyrical(section, scale, themeEvents, profile) {
        const start = section.startTime;
        const beats = section.measures * 4;
        const notesPool = buildScaleInRange(scale, 4, 5);

        for (let b = 0; b < beats; b += 2) {
            const t = start + b * secondsPerBeat;
            const idx = (b / 2) % notesPool.length;
            const n = notesPool[idx];

            if (!isSafeAgainstLead(n, themeEvents)) continue;

            Tone.Transport.schedule(time => {
                counterPad.triggerAttackRelease(n, "4n", time, 0.4);
            }, t);
        }
    }

    function scheduleCounterMelodyEnergetic(section, scale, themeEvents, profile) {
        const start = section.startTime;
        const beats = section.measures * 4;
        const notesPool = buildScaleInRange(scale, 4, 5);

        for (let s = 0; s < beats * 2; s++) {
            const t = start + s * (secondsPerBeat / 2);
            const idx = s % notesPool.length;
            const n = notesPool[idx];

            if (!isSafeAgainstLead(n, themeEvents)) continue;

            Tone.Transport.schedule(time => {
                counterPad.triggerAttackRelease(n, "8n", time, 0.35);
            }, t);
        }
    }

    function scheduleCounterMelodyEpic(section, scale, themeEvents, profile) {
        const start = section.startTime;
        const beats = section.measures * 4;

        const voicing = buildVoicing(scale);
        const pattern = [
            voicing[0],
            voicing[2],
            voicing[1],
            voicing[3]
        ];

        for (let b = 0; b < beats; b++) {
            const t = start + b * secondsPerBeat;
            const n = pattern[b % pattern.length];

            if (!isSafeAgainstLead(n, themeEvents)) continue;

            Tone.Transport.schedule(time => {
                counterPad.triggerAttackRelease(n, "4n", time, 0.4);
            }, t);
        }
    }

    function scheduleCounterMelody(section, scale, themeEvents, profile) {
        if (section.name === "intro" || section.name === "outro") return;
        if (section.name === "verse" && profile.complexity <= 0.6) return;

        const style = pickCounterMelodyStyle(profile);

        switch (style) {
            case "energetic":
                scheduleCounterMelodyEnergetic(section, scale, themeEvents, profile);
                break;
            case "epic":
                scheduleCounterMelodyEpic(section, scale, themeEvents, profile);
                break;
            case "lyric":
            default:
                scheduleCounterMelodyLyrical(section, scale, themeEvents, profile);
                break;
        }
    }

    // ------------------------------------------------------------
    // LFO-BASED MOVEMENT (no scheduleRepeat)
    // ------------------------------------------------------------

    // Qui creiamo LFO lenti e li colleghiamo ai filtri/reverb.
    // Nessuna automazione via callback, solo modulazione continua.

    const ambientLFO = new Tone.LFO({
        type: "sine",
        frequency: 0.05, // molto lento
        min: 1500,
        max: 2500
    }).start();
    ambientLFO.connect(ambientFilter.frequency);

    const breathingQLFO = new Tone.LFO({
        type: "sine",
        frequency: 0.07,
        min: 0.5,
        max: 1.2
    }).start();
    breathingQLFO.connect(breathingFilter.Q);

    const choirWetLFO = new Tone.LFO({
        type: "sine",
        frequency: 0.03,
        min: 0.6,
        max: 0.8
    }).start();
    choirWetLFO.connect(choirReverb.wet);

    const counterCutoffLFO = new Tone.LFO({
        type: "sine",
        frequency: 0.09,
        min: 2800,
        max: 3800
    }).start();
    counterCutoffLFO.connect(counterFilter.frequency);

    // ------------------------------------------------------------
    // REVERSE SWELL (solo intro/chorus)
    // ------------------------------------------------------------

    function scheduleReverseSwell(section, scale, profile) {
        if (section.name !== "intro" && section.name !== "chorus") return;

        const start = section.startTime - 4 * secondsPerBeat;
        if (start < 0) return;

        const notes = buildScaleInRange(scale, 5, 6);
        const cluster = notes.slice(0, 4);

        cluster.forEach((n, i) => {
            Tone.Transport.schedule(time => {
                ambientPad.triggerAttackRelease(n, "2m", time, 0.15);
            }, start + i * 0.05);
        });

        Tone.Transport.schedule(time => {
            padBus.gain.setValueAtTime(Tone.dbToGain(-24), time);
            padBus.gain.linearRampToValueAtTime(Tone.dbToGain(-12), section.startTime);
        }, start);
    }

    // ------------------------------------------------------------
    // RELEASE FORZATO
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
    // DYNAMIC TRANSITIONS (solo sul padBus, ma statiche per sezione)
    // ------------------------------------------------------------

    function applyPadBusAutomation(section, profile) {
        const start = section.startTime;
        const end = section.endTime;

        const padFilter = padBus._filter ?? (padBus._filter = new Tone.Filter(4000).connect(padBus));
        const padReverb = padBus._reverb ?? (padBus._reverb = new Tone.Reverb({ decay: 2, wet: 0.15 }).connect(padBus));

        let volStart = -12;
        let volEnd = -12;

        if (section.name === "intro") {
            volStart = -24;
            volEnd = -12;
        }
        if (section.name === "chorus") {
            volStart = -12;
            volEnd = -8;
        }
        if (section.name === "solo") {
            volStart = -14;
            volEnd = -12;
        }
        if (section.name === "outro") {
            volStart = -12;
            volEnd = -24;
        }

        Tone.Transport.schedule(time => {
            padBus.gain.setValueAtTime(Tone.dbToGain(volStart), time);
            padBus.gain.linearRampToValueAtTime(Tone.dbToGain(volEnd), end);
        }, start);

        let cutoffStart = 2000;
        let cutoffEnd = 4000;

        if (section.name === "intro") {
            cutoffStart = 800;
            cutoffEnd = 3500;
        }
        if (section.name === "chorus") {
            cutoffStart = 3000;
            cutoffEnd = 6000;
        }
        if (section.name === "outro") {
            cutoffStart = 3000;
            cutoffEnd = 800;
        }

        Tone.Transport.schedule(time => {
            padFilter.frequency.setValueAtTime(cutoffStart, time);
            padFilter.frequency.linearRampToValueAtTime(cutoffEnd, end);
        }, start);

        let wetStart = 0.1;
        let wetEnd = 0.15;

        if (section.name === "intro") {
            wetStart = 0.2;
            wetEnd = 0.15;
        }
        if (section.name === "chorus") {
            wetStart = 0.15;
            wetEnd = 0.25;
        }
        if (section.name === "outro") {
            wetStart = 0.15;
            wetEnd = 0.3;
        }

        Tone.Transport.schedule(time => {
            padReverb.wet.setValueAtTime(wetStart, time);
            padReverb.wet.linearRampToValueAtTime(wetEnd, end);
        }, start);
    }

    function applyDynamicTransitions(prevSection, nextSection, scale, profile) {
        if (!prevSection || !nextSection) return;

        const prevEnd = prevSection.endTime;
        const nextStart = nextSection.startTime;
        const energyDelta = (profile.energy ?? 0.5);

        Tone.Transport.schedule(time => {
            padBus.gain.cancelScheduledValues(time);
            padBus.gain.setValueAtTime(padBus.gain.value, time);
            padBus.gain.linearRampToValueAtTime(
                Tone.dbToGain(-18),
                prevEnd - 0.1
            );
        }, prevEnd - 0.5);

        Tone.Transport.schedule(time => {
            padBus._filter.frequency.cancelScheduledValues(time);
            padBus._filter.frequency.setValueAtTime(
                padBus._filter.frequency.value,
                time
            );
            padBus._filter.frequency.linearRampToValueAtTime(
                800 + 400 * (1 - energyDelta),
                prevEnd
            );
        }, prevEnd - 0.5);

        if (profile.complexity > 0.6) {
            const clusterNotes = buildScaleInRange(scale, 4, 5).slice(0, 3);
            clusterNotes.forEach((n, i) => {
                Tone.Transport.schedule(time => {
                    ambientPad.triggerAttackRelease(n, "2n", time, 0.15);
                }, prevEnd - 0.4 + i * 0.03);
            });
        }

        Tone.Transport.schedule(time => {
            padBus.gain.setValueAtTime(Tone.dbToGain(-18), time);
            padBus.gain.linearRampToValueAtTime(
                Tone.dbToGain(-12 + energyDelta * 4),
                nextStart + 0.5
            );
        }, nextStart);

        Tone.Transport.schedule(time => {
            padBus._filter.frequency.setValueAtTime(
                1200 + 800 * energyDelta,
                time
            );
            padBus._filter.frequency.linearRampToValueAtTime(
                4000 + 2000 * energyDelta,
                nextStart + 1
            );
        }, nextStart);

        Tone.Transport.schedule(time => {
            padBus._reverb.wet.setValueAtTime(0.1, time);
            padBus._reverb.wet.linearRampToValueAtTime(
                0.2 + 0.1 * energyDelta,
                nextStart + 1
            );
        }, nextStart);
    }

    // ------------------------------------------------------------
    // PUBLIC API
    // ------------------------------------------------------------

    function pickLayers(section) {
        switch (section.name) {
            case "intro":  return ["ambient", "choir"];
            case "verse":  return ["harmonic", "breathing"];
            case "chorus": return ["choir", "harmonic", "ambient"];
            case "solo":   return ["breathing", "ambient"];
            case "outro":  return ["ambient", "choir"];
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

    function scheduleSection(section, scale, progression, riffEvents, riffAnalysis, themeEvents, prevSection) {

        const profile = getProfile(imageParams);
        const layers = pickLayers(section);

        applyDynamicTransitions(prevSection, section, scale, profile);
        applyPadBusAutomation(section, profile);
        scheduleReverseSwell(section, scale, profile);

        scheduleLayeredPads(section, scale, layers);
        scheduleArpeggio(section, scale, profile);
        scheduleCounterMelody(section, scale, themeEvents, profile);

        forcePadRelease(section);
    }

    return {
        scheduleSection
    };
}
