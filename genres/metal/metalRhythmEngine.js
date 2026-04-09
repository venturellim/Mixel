// metalRhythmEngine.js — ver. 068
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 013.1 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    if (!drums || !guitarPalm || !bass) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5, texture = 0.5 } = params?.imageParams || {};

    // --- 🧬 LIBRERIA GROOVE "ULTIMATE" ---
    const grooves = {
        intro: [
            "intro_ambient", "intro_heavy_strikes", "stratovarius_intro", 
            "doom_slow", "cinematic_buildup", "industrial_static"
        ],
        verse: [
            "gallop_classic", "gallop_triplet", "thrash_diamond", "palm_mute_chug", 
            "motorhead_drive", "technical_sync", "meshuggah_ish", "breakdown_heavy",
            "jump_groove", "double_time_punk"
        ],
        chorus: [
            "helloween_speed", "chorus_pure_sustain", "chorus_sustain_hit", 
            "anthem_half_time", "power_ride_groove", "double_kick_wall",
            "blast_beat_light", "epic_waltz_feel"
        ]
    };

    const getGroove = (type) => {
        const family = grooves[type] || grooves.verse;
        let dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2) + (texture * 0.1);
        const sectionMultipliers = { intro: 1.33, verse: 0.77, chorus: 2.15 };
        const finalScore = Math.floor(dnaScore * (sectionMultipliers[type] || 1.0));
        return family[finalScore % family.length];
    };

    let currentGroove = getGroove(isIntro ? "intro" : (isChorus ? "chorus" : "verse"));

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const nextRoot = progression[(m + 1) % progression.length] || nextSectionRoot;
        const isLastMeasureOfPart = (m === section.measures - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let kick = false, snare = false, playGuitar = false, inst = guitarPalm, sustain = false, customNote = null;

            switch (currentGroove) {
                // --- NUOVE AGGIUNTE E VARIANTI ---
                case "meshuggah_ish": // Sincopi poliritmiche (3+3+2)
                    if ([0, 3, 6, 8, 11, 14].includes(s)) { playGuitar = true; kick = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;

                case "breakdown_heavy": // Pesantissimo, tutto su 0-8-14
                    if ([0, 8, 14].includes(s)) { playGuitar = true; inst = guitarOpen; kick = true; sustain = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;

                case "jump_groove": // Tipico Nu-Metal (0 - 3 - 8 - 11)
                    if ([0, 3, 8, 11].includes(s)) { playGuitar = true; kick = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;

                case "blast_beat_light": // Sedicesimi di kick e rullante alternati
                    kick = true; snare = (s % 2 !== 0);
                    playGuitar = true;
                    break;

                case "cinematic_buildup": // Solo kick che aumenta di intensità
                    kick = true;
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    break;

                case "double_time_punk": // Kick e snare velocissimi (Tupa-tupa)
                    kick = (s % 4 === 0 || s % 4 === 1);
                    snare = (s % 4 === 2);
                    playGuitar = (s % 2 === 0);
                    break;

                case "epic_waltz_feel": // Accento ogni 3 sedicesimi (finto 3/4)
                    if (s % 3 === 0) { playGuitar = true; inst = guitarOpen; kick = true; }
                    if (s === 6 || s === 12) snare = true;
                    break;

                // --- VECCHIE MASCHERE (Mantenute per coerenza) ---
                case "gallop_classic":
                    if (s % 4 !== 1) { playGuitar = true; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "helloween_speed":
                    kick = true;
                    if (s % 4 === 0) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "thrash_diamond":
                    if ([0, 3, 6, 8, 11, 14].includes(s)) { playGuitar = true; kick = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "anthem_half_time":
                    if (s === 0 || s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 8) snare = true;
                    break;
                default: 
                    if (s % 2 === 0) { playGuitar = true; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;
            }

            // --- LOGICA FILL & TEXTURE ---
            const isFillZone = isLastMeasureOfPart && s >= 12;
            if (isFillZone && complexity > 0.4) {
                playGuitar = true; inst = guitarPalm; sustain = false;
                kick = true; snare = (s % 2 === 0);
                const currMidi = Tone.Frequency(currentRoot + "2").toMidi();
                const nextMidi = Tone.Frequency((nextRoot || currentRoot) + "2").toMidi();
                const stepScale = Math.round(((nextMidi - currMidi) / 4) * (s - 11));
                customNote = Tone.Frequency(currMidi + stepScale, "midi").toNote();
            }

            if (playGuitar) {
                const rootToUse = customNote || currentRoot;
                const gNote = normalizeNote(rootToUse, inst === guitarOpen ? "guitarOpen" : "guitarPalm") + "2";
                const bNote = normalizeNote(rootToUse, "bass") + "1";
                const palmLen = texture < 0.3 ? "8n" : "16n";
                Tone.Transport.schedule(t => {
                    inst.triggerAttackRelease(gNote, sustain ? "1n" : palmLen, t);
                    bass.triggerAttackRelease(bNote, sustain ? "1n" : "16n", t);
                }, absoluteTime);
            }

            Tone.Transport.schedule(time => {
                if (kick) drums.player("kick").start(time);
                if (snare) drums.player("snare").start(time);
                if (s % 2 === 0 && !isFillZone) {
                    try {
                        const cym = drums.player((isChorus || energy > 0.7) ? "ride" : "hihat");
                        cym.start(time);
                    } catch(e) {}
                }
                if (isFillZone) { try { drums.player("tom" + (s - 11)).start(time); } catch(e) {} }
                if (s === 0 && m === 0) { try { drums.player("crash1").start(time); } catch(e) {} }
            }, absoluteTime);
        }
    }
}
