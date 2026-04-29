// pianoRhythmEngine.js — ver. 004 (Convertito da metalRhythmEngine)
import * as Tone from "https://esm.sh/tone";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";

console.log("pianoRhythmEngine.js ver. 004 loaded");

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
// COSTRUISCI TRIADE
// ------------------------------------------------------------
function buildTriad(root, scaleType = "harmonicMinor") {
    const scale = buildScaleFromTonic(root + "2", scaleType);
    const rootNote = safeNote(getScaleDegree(scale, 0), "2");
    const thirdNote = safeNote(getScaleDegree(scale, 2), "2");
    const fifthNote = safeNote(getScaleDegree(scale, 4), "2");
    return { rootNote, thirdNote, fifthNote, triadPattern: [rootNote, thirdNote, fifthNote, thirdNote] };
}

// ------------------------------------------------------------
// PIANO RHYTHM ENGINE (IDENTICO AL METAL)
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

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") || (name.includes("solo") && !name.includes("pre"));
    const isPreChorus = name.includes("pre") || name.includes("bridge");
    const isIntro = name.includes("intro") || name.includes("outro");
    const stepTime = measureDur / 16;
    
    const { energy = 0.5, brightness = 0.5, complexity = 0.5, texture = 0.5 } = params?.imageParams || {};

    // ============================================================
    // GROOVES (IDENTICO AL METAL)
    // ============================================================
    const grooves = {
        intro: ["intro_ambient", "intro_heavy_strikes", "stratovarius_intro", "doom_slow", "cinematic_buildup", "industrial_static", "stoner_doom", "power_ballad"],
        verse: ["gallop_classic", "gallop_triplet", "thrash_diamond", "palm_mute_chug", "motorhead_drive", "technical_sync", "meshuggah_ish", "breakdown_heavy", "jump_groove", "double_time_punk", "power_gallop", "groove_metal", "black_tremolo", "speed_metal", "death_roll", "thrash_skank"],
        prechorus: ["pre_build_up", "driving_eights", "march_to_war", "suspended_tension", "epic_buildup", "power_ballad"],
        bridge: ["pre_build_up", "driving_eights", "march_to_war", "suspended_tension", "epic_buildup", "power_ballad"],
        chorus: ["helloween_speed", "chorus_pure_sustain", "chorus_sustain_hit", "anthem_half_time", "power_ride_groove", "double_kick_wall", "blast_beat_light", "epic_waltz_feel", "symphonic_blast", "power_gallop", "speed_metal", "power_ballad"]
    };

    const grooveCharacteristics = {
        "intro_ambient": { energy: 0.2, brightness: 0.3, complexity: 0.2 },
        "intro_heavy_strikes": { energy: 0.6, brightness: 0.5, complexity: 0.3 },
        "stratovarius_intro": { energy: 0.7, brightness: 0.7, complexity: 0.4 },
        "cinematic_buildup": { energy: 0.4, brightness: 0.6, complexity: 0.3 },
        "industrial_static": { energy: 0.5, brightness: 0.3, complexity: 0.6 },
        "doom_slow": { energy: 0.3, brightness: 0.2, complexity: 0.2 },
        "stoner_doom": { energy: 0.3, brightness: 0.2, complexity: 0.3 },
        "power_ballad": { energy: 0.4, brightness: 0.6, complexity: 0.3 },
        "gallop_classic": { energy: 0.7, brightness: 0.5, complexity: 0.5 },
        "gallop_triplet": { energy: 0.7, brightness: 0.5, complexity: 0.6 },
        "power_gallop": { energy: 0.8, brightness: 0.7, complexity: 0.5 },
        "thrash_diamond": { energy: 0.9, brightness: 0.4, complexity: 0.7 },
        "palm_mute_chug": { energy: 0.6, brightness: 0.3, complexity: 0.3 },
        "motorhead_drive": { energy: 0.8, brightness: 0.5, complexity: 0.4 },
        "technical_sync": { energy: 0.6, brightness: 0.5, complexity: 0.9 },
        "meshuggah_ish": { energy: 0.7, brightness: 0.3, complexity: 0.8 },
        "breakdown_heavy": { energy: 0.5, brightness: 0.2, complexity: 0.4 },
        "jump_groove": { energy: 0.7, brightness: 0.4, complexity: 0.5 },
        "double_time_punk": { energy: 0.8, brightness: 0.5, complexity: 0.4 },
        "groove_metal": { energy: 0.6, brightness: 0.3, complexity: 0.6 },
        "black_tremolo": { energy: 0.8, brightness: 0.2, complexity: 0.7 },
        "speed_metal": { energy: 0.9, brightness: 0.6, complexity: 0.6 },
        "death_roll": { energy: 0.9, brightness: 0.2, complexity: 0.7 },
        "thrash_skank": { energy: 0.9, brightness: 0.4, complexity: 0.6 },
        "pre_build_up": { energy: 0.5, brightness: 0.5, complexity: 0.4 },
        "driving_eights": { energy: 0.7, brightness: 0.5, complexity: 0.3 },
        "march_to_war": { energy: 0.6, brightness: 0.4, complexity: 0.4 },
        "suspended_tension": { energy: 0.4, brightness: 0.5, complexity: 0.3 },
        "epic_buildup": { energy: 0.5, brightness: 0.7, complexity: 0.4 },
        "prog_odd": { energy: 0.6, brightness: 0.5, complexity: 0.9 },
        "metalcore_breakdown": { energy: 0.4, brightness: 0.3, complexity: 0.4 },
        "helloween_speed": { energy: 0.9, brightness: 0.7, complexity: 0.6 },
        "chorus_pure_sustain": { energy: 0.7, brightness: 0.7, complexity: 0.3 },
        "chorus_sustain_hit": { energy: 0.8, brightness: 0.7, complexity: 0.4 },
        "anthem_half_time": { energy: 0.7, brightness: 0.8, complexity: 0.3 },
        "power_ride_groove": { energy: 0.8, brightness: 0.6, complexity: 0.4 },
        "double_kick_wall": { energy: 0.9, brightness: 0.5, complexity: 0.5 },
        "blast_beat_light": { energy: 1.0, brightness: 0.3, complexity: 0.7 },
        "epic_waltz_feel": { energy: 0.6, brightness: 0.7, complexity: 0.4 },
        "symphonic_blast": { energy: 0.9, brightness: 0.8, complexity: 0.7 },
        "folk_hop": { energy: 0.7, brightness: 0.7, complexity: 0.5 },
        "djent": { energy: 0.6, brightness: 0.3, complexity: 0.9 }
    };

    const getGroove = (type) => {
        const family = grooves[type] || grooves.verse;
        const scoredGrooves = family.map(groove => {
            const chars = grooveCharacteristics[groove];
            if (!chars) return { name: groove, score: 0 };
            const energyDiff = Math.abs(energy - chars.energy);
            const brightnessDiff = Math.abs(brightness - chars.brightness);
            const complexityDiff = Math.abs(complexity - chars.complexity);
            let score = 1 - (energyDiff * 0.5 + brightnessDiff * 0.3 + complexityDiff * 0.2);
            return { name: groove, score: score };
        });
        scoredGrooves.sort((a, b) => b.score - a.score);
        return scoredGrooves[0].name;
    };

    const currentGroove = getGroove(
        isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : "verse"))
    );

    console.log(`🎹 [${section.name}] Piano Rhythm Groove: ${currentGroove}`);

    // ============================================================
    // LOOP MISURE
    // ============================================================
    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const nextRoot = progression[(m + 1) % progression.length] || nextSectionRoot;
        const isLastMeasure = (m === section.measures - 1);

        // Costruisci triade per la root corrente
        const pitchRoot = getRootPitch(currentRoot);
        const { rootNote, thirdNote, fifthNote, triadPattern } = buildTriad(pitchRoot, "harmonicMinor");
        let triadIndex = 0;

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let playPiano = false;
            let sustain = false;
            let isFullChord = false;

            // ============================================================
            // LOGICA GROOVE (IDENTICA AL METAL, ma senza kick/snare)
            // ============================================================
            switch (currentGroove) {
                // INTRO
                case "intro_ambient":
                    if (s === 0) { playPiano = true; sustain = true; }
                    break;
                case "intro_heavy_strikes":
                    if ([0, 4, 8, 12].includes(s)) { playPiano = true; }
                    break;
                case "stratovarius_intro":
                    if (s === 0 || s === 2) { playPiano = true; }
                    if (s === 4) { playPiano = true; sustain = true; }
                    break;
                case "cinematic_buildup":
                    if (s === 0) { playPiano = true; sustain = true; }
                    break;
                case "industrial_static":
                    if (s % 4 === 0) { playPiano = true; }
                    if (s === 8) { playPiano = true; sustain = true; }
                    break;
                case "doom_slow":
                    if (s === 0 || s === 8) { playPiano = true; sustain = true; }
                    break;
                case "stoner_doom":
                    if (s === 0 || s === 8) { playPiano = true; sustain = true; }
                    break;
                case "power_ballad":
                    if (s === 0 || s === 8) { playPiano = true; sustain = true; }
                    break;

                // VERSE
                case "gallop_classic":
                    if (s % 4 !== 1) { playPiano = true; }
                    break;
                case "gallop_triplet":
                    const tripletBeat = Math.floor(s / 2.666);
                    if (tripletBeat % 3 !== 0) { playPiano = true; }
                    break;
                case "power_gallop":
                    if (s % 4 !== 1) { playPiano = true; }
                    break;
                case "thrash_diamond":
                    if ([0, 2, 6].includes(s)) { playPiano = true; }
                    if (s === 4) { playPiano = true; sustain = true; }
                    break;
                case "palm_mute_chug":
                    playPiano = true;
                    break;
                case "motorhead_drive":
                    playPiano = true;
                    if (s === 0 || s === 8) { sustain = true; }
                    break;
                case "technical_sync":
                    playPiano = ([0, 3, 5, 8, 11, 13].includes(s));
                    break;
                case "meshuggah_ish":
                    playPiano = ([0, 3, 6, 8, 11, 14].includes(s));
                    break;
                case "breakdown_heavy":
                    if ([0, 8, 14].includes(s)) { playPiano = true; sustain = true; }
                    break;
                case "jump_groove":
                    playPiano = ([0, 3, 8, 11].includes(s));
                    break;
                case "double_time_punk":
                    playPiano = (s % 2 === 0);
                    break;
                case "groove_metal":
                    playPiano = ([0, 3, 5, 8, 10, 13].includes(s));
                    break;
                case "black_tremolo":
                    playPiano = true;
                    break;
                case "speed_metal":
                    playPiano = true;
                    if (s % 4 === 0) { sustain = true; }
                    break;
                case "death_roll":
                    playPiano = (s % 2 === 0);
                    if (s % 8 === 0) { sustain = true; }
                    break;
                case "thrash_skank":
                    playPiano = true;
                    break;

                // PRECHORUS / BRIDGE
                case "pre_build_up":
                    playPiano = (s % 2 === 0);
                    break;
                case "driving_eights":
                    playPiano = true;
                    break;
                case "march_to_war":
                    playPiano = ([0, 2, 4, 6, 8, 10, 12, 14].includes(s));
                    if (s === 0 || s === 8) { sustain = true; }
                    break;
                case "suspended_tension":
                    if (s === 0 || s === 8) { playPiano = true; sustain = true; }
                    break;
                case "epic_buildup":
                    if (s === 0) { playPiano = true; sustain = true; }
                    if (Math.floor(s / 4) > 1 && s % 4 === 0) { playPiano = true; sustain = true; }
                    break;
                case "prog_odd":
                    playPiano = ([0, 2, 4, 6, 9, 11, 13].includes(s));
                    break;
                case "metalcore_breakdown":
                    if ([0, 4, 8, 12].includes(s)) { playPiano = true; sustain = true; }
                    break;

                // CHORUS
                case "helloween_speed":
                    playPiano = (s % 4 === 0);
                    if (playPiano) { sustain = true; }
                    break;
                case "chorus_pure_sustain":
                    if (s === 0) { playPiano = true; sustain = true; }
                    break;
                case "chorus_sustain_hit":
                    if (s === 0) { playPiano = true; sustain = true; }
                    if (s === 14) { playPiano = true; }
                    break;
                case "anthem_half_time":
                    if (s === 0 || s === 8) { playPiano = true; sustain = true; }
                    break;
                case "power_ride_groove":
                    playPiano = true;
                    break;
                case "double_kick_wall":
                    playPiano = true;
                    break;
                case "blast_beat_light":
                    playPiano = true;
                    break;
                case "epic_waltz_feel":
                    if (s % 3 === 0) { playPiano = true; }
                    break;
                case "symphonic_blast":
                    playPiano = (s % 4 === 0);
                    if (playPiano) { sustain = true; }
                    break;
                case "folk_hop":
                    playPiano = ([0, 4, 8, 12].includes(s));
                    break;
                case "djent":
                    playPiano = ([0, 3, 5, 8, 11, 13].includes(s));
                    break;

                default:
                    if (s % 2 === 0) { playPiano = true; }
                    break;
            }

            // FILL ZONE (ultimi 4 step dell'ultima misura)
            const isFillZone = isLastMeasure && s >= 12;
            if (isFillZone && complexity > 0.4) {
                playPiano = true;
                sustain = false;
            }

            // ULTIMA MISURA DELLA SEZIONE: accordo pieno al primo step
            if (isLastMeasure && s === 0) {
                isFullChord = true;
                playPiano = true;
                sustain = true;
            }

            if (playPiano) {
                if (isFullChord) {
                    // Accordo pieno (triade suonata insieme)
                    Tone.Transport.schedule(t => {
                        piano.triggerAttackRelease([rootNote, thirdNote, fifthNote], "1n", t, 0.7, lhBus);
                        if (score) {
                            score.addNote("PianoLH", rootNote, section.name);
                            score.addNote("PianoLH", thirdNote, section.name);
                            score.addNote("PianoLH", fifthNote, section.name);
                        }
                    }, absoluteTime);
                } else {
                    // Pattern ad arpeggio (triade + terza)
                    const note = triadPattern[triadIndex % triadPattern.length];
                    const duration = sustain ? "1n" : "8n";
                    const velocity = isFillZone ? 0.65 : 0.55;
                    
                    Tone.Transport.schedule(t => {
                        piano.triggerAttackRelease(note, duration, t, velocity, lhBus);
                        if (score) score.addNote("Rhythm", note, section.name);
                    }, absoluteTime);
                    
                    triadIndex++;
                }
            }
        }
    }
}