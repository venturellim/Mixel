// metalRhythmEngine.js — ver. 021 (Complete Metal + Ballad Acoustic Rhythm)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 021 loaded");

// ============================================================
// FUNZIONI DI SUPPORTO PER LA BALLAD
// ============================================================

function buildThird(root) {
    const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let idx = scale.indexOf(root);
    if (idx === -1) idx = 0;
    return scale[(idx + 3) % 12];
}

function buildFifth(root) {
    const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let idx = scale.indexOf(root);
    if (idx === -1) idx = 0;
    return scale[(idx + 7) % 12];
}

function buildPassingNote(root, step) {
    const scale = ["C", "D", "E", "F", "G", "A", "B"];
    let idx = scale.indexOf(root);
    if (idx === -1) idx = 0;
    const passing = [1, 2, 3, 4, 5, 6, 0];
    return scale[(idx + passing[step % 7]) % 7];
}

// ============================================================
// FUNZIONE PRINCIPALE
// ============================================================

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot, score) {
    const { drums, guitarPalm, guitarOpen, bass, acousticGuitar, StStringPad } = instruments;
    if (!drums || !guitarPalm || !bass) return;

    const hasBalladInstruments = !!(acousticGuitar && StStringPad);

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") || (name.includes("solo") && !name.includes("pre"));
    const isPreChorus = name.includes("pre") || name.includes("bridge");
    const isIntro = name.includes("intro");
    const isOutro = name.includes("outro");
    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5, texture = 0.5 } = params?.imageParams || {};

    // Condizione per ballad: energy bassa (<0.4) e complexity bassa (<0.4)
    const isBalladMode = hasBalladInstruments && energy < 0.4 && complexity < 0.4;
    section.isBallad = isBalladMode;

    // ============================================================
    // BALLAD MODE
    // ============================================================
    if (isBalladMode) {
        console.log(`🎸 BALLAD MODE | ${section.name} | energy=${energy.toFixed(2)}, complexity=${complexity.toFixed(2)}`);
        
        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            const currentRoot = progression[m % progression.length];
            
            const rootNote = normalizeNote(currentRoot, "acousticGuitar");
            const thirdNote = buildThird(currentRoot);
            const fifthNote = buildFifth(currentRoot);
            
            // ============================================================
            // CHITARRA ACUSTICA: POWER CHORD + ARPEGGI
            // ============================================================
            for (let s = 0; s < 16; s++) {
                const absoluteTime = measureStartTime + (s * stepTime);
                const isBeat = (s === 0 || s === 4 || s === 8 || s === 12);
                const isOffBeat = (s === 2 || s === 6 || s === 10 || s === 14);
                
                if (isBeat && acousticGuitar) {
                    const powerChord = [rootNote + "3", fifthNote + "3"];
                    Tone.Transport.schedule(t => {
                        powerChord.forEach(note => {
                            acousticGuitar.triggerAttackRelease(note, "8n", t, 0.5);
                            if (score) score.addNote("AcousticGuitar", note, section.name);
                        });
                    }, absoluteTime);
                }
                
                if (isOffBeat && acousticGuitar && complexity > 0.3) {
                    const passNote = buildPassingNote(currentRoot, s);
                    Tone.Transport.schedule(t => {
                        acousticGuitar.triggerAttackRelease(passNote + "3", "16n", t, 0.35);
                        if (score) score.addNote("AcousticGuitar", passNote, section.name);
                    }, absoluteTime);
                }
            }
            
            // ============================================================
            // BATTERIA MINIMAL
            // ============================================================
            for (let s = 0; s < 16; s++) {
                const absoluteTime = measureStartTime + (s * stepTime);
                
                if (s === 0) {
                    Tone.Transport.schedule(t => {
                        try { drums.player("kick").start(t); } catch(e) {}
                        if (score) score.addNote("Drums", "Kick", section.name);
                    }, absoluteTime);
                }
                
                if (s % 4 === 0) {
                    Tone.Transport.schedule(t => {
                        try { drums.player("hihat").start(t); } catch(e) {}
                        if (score) score.addNote("Drums", "HiHat", section.name);
                    }, absoluteTime);
                }
                
                if (s === 0 && m === 0) {
                    Tone.Transport.schedule(t => {
                        try { drums.player("crash1").start(t); } catch(e) {}
                        if (score) score.addNote("Drums", "Crash", section.name);
                    }, absoluteTime);
                }
            }
        }
        return;
    }

    // ============================================================
    // METAL MODE NORMALE
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

    const getGroove = (type, energy, brightness, complexity) => {
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
        isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : "verse")),
        energy, brightness, complexity
    );

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const nextRoot = progression[(m + 1) % progression.length] || nextSectionRoot;
        const isLastMeasure = (m === section.measures - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let kick = false, snare = false, playGuitar = false, sustain = false, customNote = null;
            let inst = guitarPalm;

            if (isChorus) {
                inst = (rand() < 0.85) ? guitarOpen : guitarPalm;
            }

            // LOGICA GROOVE
            switch (currentGroove) {
                case "intro_ambient":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    break;
                case "intro_heavy_strikes":
                    if ([0, 4, 8, 12].includes(s)) { playGuitar = true; inst = guitarOpen; kick = true; snare = (s === 4 || s === 12); }
                    break;
                case "stratovarius_intro":
                    if (s === 0 || s === 2) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 4) { playGuitar = true; inst = guitarOpen; snare = true; sustain = true; }
                    if (s === 12) snare = true;
                    break;
                case "cinematic_buildup":
                    kick = true;
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    break;
                case "industrial_static":
                    if (s % 4 === 0) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 6 || s === 14) snare = true;
                    if (s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    break;
                case "doom_slow":
                    if (s === 0 || s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; snare = (s === 8); }
                    break;
                case "gallop_classic":
                    if (s % 4 !== 1) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "gallop_triplet":
                    const tripletBeat = Math.floor(s / 2.666);
                    if (tripletBeat % 3 !== 0) { playGuitar = true; inst = guitarPalm; }
                    kick = (tripletBeat % 3 === 0);
                    if (tripletBeat === 4 || tripletBeat === 10) snare = true;
                    break;
                case "palm_mute_chug":
                    playGuitar = true; inst = guitarPalm; kick = (s % 2 === 0);
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "motorhead_drive":
                    playGuitar = true; inst = guitarPalm; kick = (s % 2 === 0); snare = (s === 4 || s === 12);
                    if (s === 0 || s === 8) inst = guitarOpen;
                    break;
                case "technical_sync":
                    playGuitar = ([0, 3, 5, 8, 11, 13].includes(s));
                    kick = ([0, 4, 8, 12].includes(s)) || (s === 3 || s === 11);
                    snare = (s === 4 || s === 12);
                    if (playGuitar) inst = guitarPalm;
                    break;
                case "thrash_diamond":
                    if ([0, 2, 6].includes(s)) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 4) { playGuitar = true; inst = guitarOpen; sustain = true; snare = true; }
                    if (s === 12) snare = true;
                    break;
                case "meshuggah_ish":
                    if ([0, 3, 6, 8, 11, 14].includes(s)) { playGuitar = true; kick = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "breakdown_heavy":
                    if ([0, 8, 14].includes(s)) { playGuitar = true; inst = guitarOpen; kick = true; sustain = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "jump_groove":
                    if ([0, 3, 8, 11].includes(s)) { playGuitar = true; kick = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "double_time_punk":
                    kick = (s % 4 === 0 || s % 4 === 1); snare = (s % 4 === 2); playGuitar = (s % 2 === 0);
                    break;
                case "pre_build_up":
                    kick = (s % 4 === 0); snare = (s === 12); playGuitar = (s % 2 === 0);
                    break;
                case "driving_eights":
                    kick = (s % 2 === 0); snare = (s === 4 || s === 12); playGuitar = true;
                    break;
                case "march_to_war":
                    kick = ([0, 4, 8, 12].includes(s)); snare = (s === 4 || s === 12);
                    playGuitar = ([0, 2, 4, 6, 8, 10, 12, 14].includes(s));
                    if (playGuitar) inst = guitarPalm;
                    if (s === 0 || s === 8) inst = guitarOpen;
                    break;
                case "suspended_tension":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    if (s === 12) snare = true;
                    break;
                case "helloween_speed":
                    kick = true;
                    if (s % 4 === 0) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "chorus_pure_sustain":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 8) kick = true;
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "chorus_sustain_hit":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 14) { playGuitar = true; inst = guitarOpen; kick = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "anthem_half_time":
                    if (s === 0 || s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; if (s === 8) snare = true; }
                    break;
                case "power_ride_groove":
                    playGuitar = true; inst = guitarOpen; kick = (s % 4 === 0); snare = (s === 4 || s === 12);
                    break;
                case "double_kick_wall":
                    kick = true; playGuitar = true; if (s === 4 || s === 12) snare = true;
                    break;
                case "blast_beat_light":
                    kick = true; snare = (s % 2 !== 0); playGuitar = true;
                    break;
                case "epic_waltz_feel":
                    if (s % 3 === 0) { playGuitar = true; inst = guitarOpen; kick = true; }
                    if (s === 6 || s === 12) snare = true;
                    break;
                case "power_gallop":
                    if (s % 4 !== 1) { 
                        playGuitar = true; 
                        inst = (s % 8 === 0 || s % 8 === 4) ? guitarOpen : guitarPalm;
                        kick = (s % 4 === 0); 
                    }
                    if (s === 4 || s === 12) snare = true;
                    if (s === 8) kick = true;
                    break;
                case "symphonic_blast":
                    kick = true; snare = (s % 2 !== 0); playGuitar = (s % 4 === 0);
                    if (playGuitar) { inst = guitarOpen; sustain = true; }
                    break;
                case "groove_metal":
                    playGuitar = ([0, 3, 5, 8, 10, 13].includes(s));
                    kick = ([0, 3, 5, 8, 10, 13].includes(s));
                    snare = (s === 6 || s === 14);
                    if (playGuitar) inst = guitarPalm;
                    break;
                case "black_tremolo":
                    playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0 || s % 4 === 2); snare = (s === 4 || s === 12);
                    break;
                case "stoner_doom":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; snare = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "prog_odd":
                    const oddPattern = [0, 2, 4, 6, 9, 11, 13];
                    playGuitar = oddPattern.includes(s); kick = oddPattern.includes(s); snare = (s === 6 || s === 13);
                    if (playGuitar) inst = guitarPalm;
                    break;
                case "folk_hop":
                    playGuitar = ([0, 4, 8, 12].includes(s)); kick = ([0, 3, 6, 8, 11, 14].includes(s)); snare = (s === 4 || s === 12);
                    if (playGuitar) inst = guitarOpen;
                    break;
                case "metalcore_breakdown":
                    if (s === 0 || s === 4 || s === 8 || s === 12) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 6 || s === 14) snare = true;
                    break;
                case "speed_metal":
                    kick = true; playGuitar = true; inst = guitarPalm; snare = (s === 4 || s === 12);
                    if (s % 4 === 0) inst = guitarOpen;
                    break;
                case "epic_buildup":
                    const buildupIntensity = Math.floor(s / 4);
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (buildupIntensity > 1 && s % 4 === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (buildupIntensity > 2 && s === 14) snare = true;
                    if (buildupIntensity > 3) kick = true;
                    break;
                case "death_roll":
                    kick = (s % 2 === 0); snare = (s % 4 === 1 || s % 4 === 3); playGuitar = (s % 2 === 0); inst = guitarPalm;
                    if (s % 8 === 0) inst = guitarOpen;
                    break;
                case "power_ballad":
                    if (s === 0 || s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "thrash_skank":
                    playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0 || s % 4 === 2); snare = (s % 4 === 1 || s % 4 === 3);
                    if (s % 8 === 0) inst = guitarOpen;
                    break;
                case "djent":
                    playGuitar = ([0, 3, 5, 8, 11, 13].includes(s));
                    kick = ([0, 3, 5, 8, 11, 13].includes(s));
                    snare = (s === 6 || s === 14);
                    inst = guitarPalm;
                    if (s === 0 || s === 8) inst = guitarOpen;
                    break;
                default:
                    if (s % 2 === 0) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;
            }

            const isFillZone = isLastMeasure && s >= 12;
            if (isFillZone && complexity > 0.4) {
                playGuitar = true; inst = guitarPalm; sustain = false; kick = true; snare = (s % 2 === 0 || s > 14);
                const currMidi = Tone.Frequency(currentRoot + "2").toMidi();
                const nextMidi = Tone.Frequency((nextRoot || currentRoot) + "2").toMidi();
                const stepScale = Math.round(((nextMidi - currMidi) / 4) * (s - 11));
                customNote = Tone.Frequency(currMidi + stepScale, "midi").toNote();
            }

            // SCHEDULAZIONE CHITARRA E BASSO
            if (playGuitar) {
                const rootToUse = customNote || currentRoot;
                const gNote = normalizeNote(rootToUse, inst === guitarOpen ? "guitarOpen" : "guitarPalm") + "2";
                const bNote = normalizeNote(rootToUse, "bass") + "1";
                const palmLen = texture < 0.3 ? "8n" : "16n";

                Tone.Transport.schedule(t => {
                    if (inst === guitarOpen) {
                        Tone.Transport.schedule((stopTime) => { try { inst.triggerRelease(stopTime); } catch(e) {} }, t + 0.002);
                    }
                    inst.triggerAttackRelease(gNote, sustain ? "1n" : palmLen, t);
                    bass.triggerAttackRelease(bNote, sustain ? "1n" : "16n", t);
                    Tone.Draw.schedule(() => {
                        if (score) {
                            score.addNote("Rhythm", gNote, section.name);
                            score.addNote("Bass", bNote, section.name);
                        }
                    }, t);
                }, absoluteTime);
            }

            // SCHEDULAZIONE BATTERIA
            Tone.Transport.schedule(time => {
                let playedHiHat = false;
                let playedRide = false;
                let playedCrash = false;

                if (kick) drums.player("kick").start(time);
                if (snare) drums.player("snare").start(time);
                
                if (s % 2 === 0 && !isLastMeasure) {
                    try { 
                        const cymbal = (isChorus || energy > 0.7) ? "ride" : "hihat";
                        drums.player(cymbal).start(time); 
                        if (cymbal === "ride") playedRide = true; else playedHiHat = true;
                    } catch(e) {}
                }
                
                if (s === 0 && m === 0) { 
                    try { drums.player("crash1").start(time); playedCrash = true; } catch(e) {} 
                }

                if (isFillZone) { 
                    try { drums.player("tom" + (s - 11)).start(time); } catch(e) {} 
                }

                Tone.Draw.schedule(() => {
                    if (score) {
                        if (kick) score.addNote("Drums", "Kick", section.name);
                        if (snare) score.addNote("Drums", "Snare", section.name);
                        if (playedHiHat || playedRide) score.addNote("Drums", "HiHat", section.name);
                        if (playedCrash) score.addNote("Drums", "Crash", section.name);
                        if (isFillZone) score.addNote("Drums", "Snare", section.name);
                    }
                }, time);
            }, absoluteTime);
        }
    }
}