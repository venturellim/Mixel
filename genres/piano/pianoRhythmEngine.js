// pianoRhythmEngine.js — ver. 006 (con fill LH al cambio sezione)

import * as Tone from "https://esm.sh/tone";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";

console.log("pianoRhythmEngine.js ver. 006 loaded");

function getPianoStyle({ energy, brightness, complexity, texture }) {

    if (energy < 0.30 && brightness < 0.45 && texture > 0.55)
        return "ambient";

    if (brightness > 0.55 && energy < 0.55 && complexity < 0.55)
        return "pop_ballad";

    if (texture > 0.65 && brightness > 0.50 && complexity < 0.70)
        return "cinematic";

    if (energy > 0.70 && complexity > 0.65)
        return "virtuoso";

    if (brightness < 0.35 && complexity > 0.50)
        return "dark";

    if (texture > 0.45 && brightness > 0.40 && energy < 0.60 && complexity > 0.40)
        return "jazz";

    if (energy > 0.60 && brightness > 0.60 && texture < 0.50)
        return "edm_lead";

    return "standard";
}

// ============================================================
// RHYTHM STYLES — pattern diversi per stile pianistico
// ============================================================
const RHYTHM_STYLES = {
    ambient: ["intro_ambient", "doom_slow", "suspended_tension"],
    pop_ballad: ["power_ballad", "march_to_war", "chorus_sustain_hit"],
    cinematic: ["cinematic_buildup", "epic_waltz_feel", "intro_heavy_strikes"],
    virtuoso: ["gallop_triplet", "technical_sync", "speed_metal"],
    dark: ["black_tremolo", "death_roll", "thrash_diamond"],
    jazz: ["driving_eights", "prog_odd", "pre_build_up"],
    edm_lead: ["power_ride_groove", "double_time_punk", "motorhead_drive"],
    standard: ["driving_eights"]
};

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
// FILL DI CAMBIO SEZIONE (mano sinistra)
// ------------------------------------------------------------
function playSectionTransitionFill(absoluteTime, currentRoot, nextRoot, piano, lhBus, score, sectionName) {
    if (!piano || !currentRoot || !nextRoot) return;
    
    const pitchCurrent = getRootPitch(currentRoot);
    const pitchNext = getRootPitch(nextRoot);
    
    const { triadPattern: patternCurrent } = buildTriad(pitchCurrent, "harmonicMinor");
    const { triadPattern: patternNext } = buildTriad(pitchNext, "harmonicMinor");
    
    // Fill di 4 note (scala ascendente dalla root corrente alla prossima)
    const fillNotes = [
        patternCurrent[0],  // root corrente
        patternCurrent[2],  // quinta corrente
        patternNext[1],     // terza prossima
        patternNext[0]      // root prossima
    ];
    
    const stepTime = 0.1; // 100ms tra una nota e l'altra
    
    fillNotes.forEach((note, idx) => {
        Tone.Transport.schedule(t => {
            piano.triggerAttackRelease(note, "8n", t, 0.7, lhBus);
            if (score) score.addNote("Rhythm", note, sectionName);
        }, absoluteTime + idx * stepTime);
    });
}

// ------------------------------------------------------------
// APPLICA VARIAZIONI RITMICHE IN BASE ALL'ENERGIA
// ------------------------------------------------------------
function applyRhythmVariations(originalSteps, energy) {
    if (!originalSteps || originalSteps.length === 0) return [0, 4, 8, 12];
    if (energy < 0.3) return [...originalSteps];
    
    const steps = [...originalSteps];
    const newSteps = [...steps];
    
    if (energy >= 0.3 && energy < 0.5) {
        for (let beat = 0; beat < 16; beat += 8) {
            if (!newSteps.includes(beat + 2)) newSteps.push(beat + 2);
            if (!newSteps.includes(beat + 6)) newSteps.push(beat + 6);
        }
    } 
    else if (energy >= 0.5 && energy < 0.7) {
        for (let beat = 0; beat < 16; beat += 4) {
            if (!newSteps.includes(beat + 1)) newSteps.push(beat + 1);
            if (!newSteps.includes(beat + 3)) newSteps.push(beat + 3);
        }
    }
    else if (energy >= 0.7 && energy < 0.9) {
        for (let s = 0; s < 16; s++) {
            if (s % 2 === 1 && !newSteps.includes(s)) newSteps.push(s);
        }
    }
    else if (energy >= 0.9) {
        for (let s = 0; s < 16; s++) {
            if (!newSteps.includes(s)) newSteps.push(s);
        }
    }
    
    return newSteps.sort((a, b) => a - b);
}

// ------------------------------------------------------------
// PIANO RHYTHM ENGINE
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
const pianoStyle = getPianoStyle({ energy, brightness, complexity, texture });
console.log("🎹 Rhythm Style:", pianoStyle);



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

    // ============================================================
// SCEGLI GROOVE IN BASE ALLO STILE PIANISTICO
// ============================================================
const styleGrooves = RHYTHM_STYLES[pianoStyle] || RHYTHM_STYLES.standard;
const currentGroove = styleGrooves[(rand() * styleGrooves.length) | 0];

console.log(`🎹 Groove scelto per stile ${pianoStyle}: ${currentGroove}`);


    console.log(`🎹 [${section.name}] Piano Rhythm Groove: ${currentGroove} | energy=${energy.toFixed(2)}`);

    // ============================================================
    // LOOP MISURE
    // ============================================================
    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const nextRoot = progression[(m + 1) % progression.length] || nextSectionRoot;
        const isLastMeasure = (m === section.measures - 1);

        // FILL DI CAMBIO SEZIONE (solo all'ultima misura, PRIMA della nuova sezione)
        if (isLastMeasure && nextRoot && nextRoot !== currentRoot) {
            const fillStartTime = measureStartTime + measureDur - 0.4; // poco prima della fine
            playSectionTransitionFill(fillStartTime, currentRoot, nextRoot, piano, lhBus, score, section.name);
        }

        const pitchRoot = getRootPitch(currentRoot);
        const { rootNote, thirdNote, fifthNote, triadPattern } = buildTriad(pitchRoot, "harmonicMinor");
        let triadIndex = 0;

        // Ottieni i pattern base dal groove
        let baseSteps = [];
        switch (currentGroove) {
            case "intro_ambient": baseSteps = [0]; break;
            case "stratovarius_intro": baseSteps = [0, 2, 4]; break;
            case "doom_slow": baseSteps = [0, 8]; break;
            case "gallop_classic": baseSteps = [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15]; break;
            case "palm_mute_chug": baseSteps = Array.from({length: 16}, (_, i) => i); break;
            case "motorhead_drive": baseSteps = Array.from({length: 16}, (_, i) => i); break;
            case "technical_sync": baseSteps = [0, 3, 5, 8, 11, 13]; break;
            case "thrash_diamond": baseSteps = [0, 2, 4, 6]; break;
            case "pre_build_up": baseSteps = Array.from({length: 16}, (_, i) => i % 2 === 0 ? i : null).filter(v => v !== null); break;
            case "driving_eights": baseSteps = Array.from({length: 16}, (_, i) => i); break;
            case "march_to_war": baseSteps = [0, 2, 4, 6, 8, 10, 12, 14]; break;
            case "suspended_tension": baseSteps = [0, 8]; break;
            case "helloween_speed": baseSteps = [0, 4, 8, 12]; break;
            case "chorus_pure_sustain": baseSteps = [0]; break;
            case "chorus_sustain_hit": baseSteps = [0, 14]; break;
            case "power_ride_groove": baseSteps = Array.from({length: 16}, (_, i) => i); break;
            default: baseSteps = Array.from({length: 16}, (_, i) => i % 2 === 0 ? i : null).filter(v => v !== null); break;
        }

        // Applica variazioni ritmiche in base all'energia
        let currentSteps = applyRhythmVariations(baseSteps, energy);

        for (let s of currentSteps) {
            const absoluteTime = measureStartTime + s * stepTime;
            let isFullChord = false;

            // ULTIMA MISURA DELLA SEZIONE: accordo pieno al primo step
            if (isLastMeasure && s === currentSteps[0]) {
                isFullChord = true;
            }

            if (isFullChord) {
                Tone.Transport.schedule(t => {
                    let velocity = 0.45 + (energy * 0.3);

// Dinamica per stile
switch (pianoStyle) {
    case "ambient":
        velocity *= 0.7;
        break;
    case "pop_ballad":
        velocity *= 0.85;
        break;
    case "cinematic":
        velocity *= 1.1;
        break;
    case "virtuoso":
        velocity *= 1.25;
        break;
    case "dark":
        velocity *= 1.3;
        break;
    case "jazz":
        velocity *= 0.9;
        break;
    case "edm_lead":
        velocity *= 1.35;
        break;
}

                    piano.triggerAttackRelease([rootNote, thirdNote, fifthNote], "1n", t, velocity, lhBus);
                    if (score) {
                        score.addNote("Rhythm", rootNote, section.name);
                        score.addNote("Rhythm", thirdNote, section.name);
                        score.addNote("Rhythm", fifthNote, section.name);
                    }
                }, absoluteTime);
            } else {
                const note = triadPattern[triadIndex % triadPattern.length];
                const duration = "8n";
                let velocity = 0.45 + (energy * 0.3);

// Dinamica per stile
switch (pianoStyle) {
    case "ambient": velocity *= 0.7; break;
    case "pop_ballad": velocity *= 0.85; break;
    case "cinematic": velocity *= 1.1; break;
    case "virtuoso": velocity *= 1.25; break;
    case "dark": velocity *= 1.3; break;
    case "jazz": velocity *= 0.9; break;
    case "edm_lead": velocity *= 1.35; break;
}
                
      Tone.Transport.schedule(t => {
                 // MICRO-TIMING UMANO
let micro = (Math.random() - 0.5) * 0.008;

// Stile-based timing
if (pianoStyle === "ambient") micro += 0.006;
if (pianoStyle === "virtuoso") micro -= 0.004;
if (pianoStyle === "jazz") micro += (Math.random() * 0.004);

t += micro;

piano.triggerAttackRelease(note, duration, t, velocity, lhBus);


                    if (score) score.addNote("Rhythm", note, section.name);
                }, absoluteTime);
                
                triadIndex++;
            }
        }
    }
}