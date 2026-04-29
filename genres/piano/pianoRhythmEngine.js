// pianoRhythmEngine.js — ver. 002 (Metal Groove + Piano Triad Pattern)
import * as Tone from "https://esm.sh/tone";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";

console.log("pianoRhythmEngine.js ver. 002.1 loaded");

// ------------------------------------------------------------
// SAFE NOTE
// ------------------------------------------------------------
function safeNote(note, octave = "2") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${octave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

// ------------------------------------------------------------
// ROOT PITCH
// ------------------------------------------------------------
function getRootPitch(root) {
    if (!root || typeof root !== "string") return "A";
    const match = root.toUpperCase().match(/^([A-G](#|B)?)/);
    return match ? match[1] : "A";
}

// ------------------------------------------------------------
// PIANO RHYTHM ENGINE (Metal Groove → Piano Triad Pattern)
// ------------------------------------------------------------
export function schedulePianoRhythm(
    section,
    progression,
    instruments,
    params,
    rand,
    measureDur,
    nextSectionRoot,
    score
) {
    const { piano, lhBus } = instruments;
    if (!piano || !lhBus) return;

    const stepTime = measureDur / 16;

    // ------------------------------------------------------------
    // 1. Determiniamo il groove esattamente come il metal
    // ------------------------------------------------------------
    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") || (name.includes("solo") && !name.includes("pre"));
    const isPreChorus = name.includes("pre") || name.includes("bridge");
    const isIntro = name.includes("intro") || name.includes("outro");

    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params?.imageParams || {};

    const grooves = {
        intro: ["intro_ambient", "intro_heavy_strikes", "stratovarius_intro", "doom_slow", "cinematic_buildup"],
        verse: ["gallop_classic", "palm_mute_chug", "motorhead_drive", "technical_sync", "thrash_diamond"],
        prechorus: ["pre_build_up", "driving_eights", "march_to_war", "suspended_tension"],
        bridge: ["pre_build_up", "driving_eights", "march_to_war", "suspended_tension"],
        chorus: ["helloween_speed", "chorus_pure_sustain", "chorus_sustain_hit", "power_ride_groove"]
    };

    const grooveCharacteristics = {
        "intro_ambient": { energy: 0.2, brightness: 0.3, complexity: 0.2 },
        "intro_heavy_strikes": { energy: 0.6, brightness: 0.5, complexity: 0.3 },
        "stratovarius_intro": { energy: 0.7, brightness: 0.7, complexity: 0.4 },
        "doom_slow": { energy: 0.3, brightness: 0.2, complexity: 0.2 },
        "cinematic_buildup": { energy: 0.4, brightness: 0.6, complexity: 0.3 },

        "gallop_classic": { energy: 0.7, brightness: 0.5, complexity: 0.5 },
        "palm_mute_chug": { energy: 0.6, brightness: 0.3, complexity: 0.3 },
        "motorhead_drive": { energy: 0.8, brightness: 0.5, complexity: 0.4 },
        "technical_sync": { energy: 0.6, brightness: 0.5, complexity: 0.9 },
        "thrash_diamond": { energy: 0.9, brightness: 0.4, complexity: 0.7 },

        "pre_build_up": { energy: 0.5, brightness: 0.5, complexity: 0.4 },
        "driving_eights": { energy: 0.7, brightness: 0.5, complexity: 0.3 },
        "march_to_war": { energy: 0.6, brightness: 0.4, complexity: 0.4 },
        "suspended_tension": { energy: 0.4, brightness: 0.5, complexity: 0.3 },

        "helloween_speed": { energy: 0.9, brightness: 0.7, complexity: 0.6 },
        "chorus_pure_sustain": { energy: 0.7, brightness: 0.7, complexity: 0.3 },
        "chorus_sustain_hit": { energy: 0.8, brightness: 0.7, complexity: 0.4 },
        "power_ride_groove": { energy: 0.8, brightness: 0.6, complexity: 0.4 }
    };

    const getGroove = (type) => {
        const family = grooves[type] || grooves.verse;
        const scored = family.map(g => {
            const c = grooveCharacteristics[g];
            if (!c) return { name: g, score: 0 };
            const score = 1 - (
                Math.abs(energy - c.energy) * 0.5 +
                Math.abs(brightness - c.brightness) * 0.3 +
                Math.abs(complexity - c.complexity) * 0.2
            );
            return { name: g, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored[0].name;
    };

    const sectionType =
        isIntro ? "intro" :
        isPreChorus ? "prechorus" :
        isChorus ? "chorus" :
        "verse";

    const currentGroove = getGroove(sectionType);

    // ------------------------------------------------------------
    // 2. LOOP MISURE
    // ------------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {

        const measureStart = section.startTime + m * measureDur;
        const isLastMeasure = (m === section.measures - 1);

        const rawRoot = progression[m % progression.length];
        const pitchRoot = getRootPitch(rawRoot);

        // Triade armonica minore (come orchestra)
        const scale = buildScaleFromTonic(pitchRoot + "2", "harmonicMinor");

        const rootNote  = safeNote(getScaleDegree(scale, 0), "2");
        const thirdNote = safeNote(getScaleDegree(scale, 2), "2");
        const fifthNote = safeNote(getScaleDegree(scale, 4), "2");

        const triadPattern = [rootNote, thirdNote, fifthNote, thirdNote];
        let triadIndex = 0;

        // --------------------------------------------------------
        // 3. LOOP STEP (0–15) — come metal
        // --------------------------------------------------------
        for (let s = 0; s < 16; s++) {

            const absoluteTime = measureStart + s * stepTime;

            // Determiniamo se il metal avrebbe suonato la chitarra
            let playGuitar = false;

            switch (currentGroove) {

                case "intro_ambient":
                    playGuitar = (s === 0);
                    break;

                case "intro_heavy_strikes":
                    playGuitar = [0, 4, 8, 12].includes(s);
                    break;

                case "stratovarius_intro":
                    playGuitar = (s === 0 || s === 2 || s === 4);
                    break;

                case "doom_slow":
                    playGuitar = (s === 0 || s === 8);
                    break;

                case "cinematic_buildup":
                    playGuitar = (s === 0);
                    break;

                case "gallop_classic":
                    playGuitar = (s % 4 !== 1);
                    break;

                case "palm_mute_chug":
                    playGuitar = true;
                    break;

                case "motorhead_drive":
                    playGuitar = true;
                    break;

                case "technical_sync":
                    playGuitar = [0, 3, 5, 8, 11, 13].includes(s);
                    break;

                case "thrash_diamond":
                    playGuitar = [0, 2, 4, 6].includes(s);
                    break;

                case "pre_build_up":
                    playGuitar = (s % 2 === 0);
                    break;

                case "driving_eights":
                    playGuitar = true;
                    break;

                case "march_to_war":
                    playGuitar = ([0,2,4,6,8,10,12,14].includes(s));
                    break;

                case "suspended_tension":
                    playGuitar = (s === 0 || s === 8);
                    break;

                case "helloween_speed":
                    playGuitar = (s % 4 === 0);
                    break;

                case "chorus_pure_sustain":
                    playGuitar = (s === 0);
                    break;

                case "chorus_sustain_hit":
                    playGuitar = (s === 0 || s === 14);
                    break;

                case "power_ride_groove":
                    playGuitar = true;
                    break;

                default:
                    playGuitar = (s % 2 === 0);
                    break;
            }

            // --------------------------------------------------------
            // 4. ULTIMA MISURA → ACCORDO PIENO
            // --------------------------------------------------------
            if (isLastMeasure && s === 0) {
                Tone.Transport.schedule(t => {
                    piano.triggerAttackRelease(
                        [rootNote, thirdNote, fifthNote],
                        "1n",
                        t,
                        0.75
                    );
                    if (score) {
                        score.addNote("PianoLH", rootNote, section.name);
                        score.addNote("PianoLH", thirdNote, section.name);
                        score.addNote("PianoLH", fifthNote, section.name);
                    }
                }, absoluteTime);
                continue;
            }

            // --------------------------------------------------------
            // 5. MISURE NORMALI → PATTERN TRIADICO
            // --------------------------------------------------------
            if (playGuitar) {

                const note = triadPattern[triadIndex % triadPattern.length];
                triadIndex++;

                Tone.Transport.schedule(t => {
                    //piano.triggerAttackRelease(note, "8n", t, 0.55);
piano.triggerAttackRelease(note, "8n", t, 0.55, lhBus);

                    
                    if (score) score.addNote("Rhythm", note, section.name);
                }, absoluteTime);
            }
        }
    }
}
