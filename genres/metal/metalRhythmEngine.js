// metalRhythmEngine.js — ver. 072 (Full Score Integration)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 072 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot, score) {
    // Destrutturato anche StStringPad per evitare crash nei nuovi groove
    const { drums, guitarPalm, guitarOpen, bass, StStringPad } = instruments;
    if (!drums || !guitarPalm || !bass) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") || (name.includes("solo") && !name.includes("pre")); 
    const isPreChorus = name.includes("pre") || name.includes("bridge");
    const isIntro = name.includes("intro");
    const isOutro = name.includes("outro");
    
    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5, texture = 0.5 } = params?.imageParams || {};
    
    const isEpicIntro = isIntro && brightness > 0.45 && texture > 0.4;
    const isEpicOutro = isOutro && energy > 0.45 && brightness > 0.45 && texture > 0.4;

    const grooves = {
        intro: ["intro_ambient", "intro_heavy_strikes", "stratovarius_intro", "doom_slow", "cinematic_buildup", "industrial_static", "stoner_doom", "power_ballad"],
        intro_epic: ["intro_pad_swell", "intro_timpani_roll", "intro_open_chord"],
        verse: ["gallop_classic", "gallop_triplet", "thrash_diamond", "palm_mute_chug", "motorhead_drive", "technical_sync", "meshuggah_ish", "breakdown_heavy", "jump_groove", "double_time_punk", "power_gallop", "groove_metal", "black_tremolo", "speed_metal", "death_roll", "thrash_skank"],
        prechorus: ["pre_build_up", "driving_eights", "march_to_war", "suspended_tension", "epic_buildup", "power_ballad"],
        bridge: ["pre_build_up", "driving_eights", "march_to_war", "suspended_tension", "epic_buildup", "power_ballad"],
        chorus: ["helloween_speed", "chorus_pure_sustain", "chorus_sustain_hit", "anthem_half_time", "power_ride_groove", "double_kick_wall", "blast_beat_light", "epic_waltz_feel", "symphonic_blast", "power_gallop", "speed_metal", "power_ballad"],
        outro_epic: ["outro_epic_hit", "outro_epic_roll", "outro_epic_finale"],
        outro: ["outro_sustain", "outro_timpani", "outro_final_hit"]
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
        "intro_pad_swell": { energy: 0.2, brightness: 0.6, complexity: 0.2 },
        "intro_timpani_roll": { energy: 0.3, brightness: 0.4, complexity: 0.3 },
        "intro_open_chord": { energy: 0.4, brightness: 0.6, complexity: 0.2 },
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
        "djent": { energy: 0.6, brightness: 0.3, complexity: 0.9 },
        "outro_sustain": { energy: 0.4, brightness: 0.6, complexity: 0.2 },
        "outro_timpani": { energy: 0.3, brightness: 0.4, complexity: 0.3 },
        "outro_final_hit": { energy: 0.5, brightness: 0.7, complexity: 0.2 },
        "outro_epic_hit": { energy: 0.6, brightness: 0.7, complexity: 0.3 },
        "outro_epic_roll": { energy: 0.5, brightness: 0.6, complexity: 0.5 },
        "outro_epic_finale": { energy: 0.7, brightness: 0.8, complexity: 0.4 }
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
        isEpicIntro ? "intro_epic" : isIntro ? "intro" : isEpicOutro ? "outro_epic" : isOutro ? "outro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : "verse")),
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
                case "intro_pad_swell":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 8) kick = true;
                    if (StStringPad) StStringPad.triggerAttackRelease(currentRoot + "3", "2n", absoluteTime);
                    break;
                case "intro_timpani_roll":
                    if (s % 2 === 0) kick = true;
                    if (s === 0 && StStringPad) StStringPad.triggerAttackRelease(currentRoot + "3", "1n", absoluteTime);
                    break;
                case "intro_open_chord":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 8) snare = true;
                    if (StStringPad) StStringPad.triggerAttackRelease(currentRoot + "3", "1n", absoluteTime);
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
                    playGuitar = ([0, 3, 5, 8, 10, 13].includes(s)); kick = ([0, 3, 5, 8, 10, 13].includes(s)); snare = (s === 6 || s === 14);
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
                    playGuitar = ([0, 3, 5, 8, 11, 13].includes(s)); kick = ([0, 3, 5, 8, 11, 13].includes(s)); snare = (s === 6 || s === 14);
                    inst = guitarPalm; if (s === 0 || s === 8) inst = guitarOpen;
                    break;
                case "outro_sustain":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (StStringPad) StStringPad.triggerAttackRelease(currentRoot + "3", "1n", absoluteTime);
                    break;
                case "outro_timpani":
                    if (s % 4 === 0) kick = true;
                    if (s === 0 && StStringPad) StStringPad.triggerAttackRelease(currentRoot + "3", "1n", absoluteTime);
                    break;
                case "outro_final_hit":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; snare = true; }
                    if (s === 8) { kick = true; snare = true; }
                    if (StStringPad) StStringPad.triggerAttackRelease(currentRoot + "3", "1n", absoluteTime);
                    break;
                case "outro_epic_hit":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; snare = true; }
                    if (s === 0) { try { drums.player("crash1").start(absoluteTime); } catch(e){} }
                    break;
                case "outro_epic_roll":
                    if (s % 2 === 0) kick = true;
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    try { drums.player("tom1").start(absoluteTime); } catch(e){}
                    break;
                case "outro_epic_finale":
                    if (s === 0) {
                        playGuitar = true; inst = guitarOpen; sustain = true; kick = true; snare = true;
                        try { drums.player("crash2").start(absoluteTime); } catch(e){}
                    }
                    if (s === 8) { kick = true; snare = true; }
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
                
                if (isEpicOutro) {
                    try { drums.player("tom1").start(absoluteTime); } catch(e){}
                    try { drums.player("tom2").start(absoluteTime + 0.05); } catch(e){}
                    try { drums.player("tom3").start(absoluteTime + 0.10); } catch(e){}
                    try { drums.player("crash1").start(absoluteTime + 0.20); } catch(e){}
                } else {
                    // Mappiamo i tom dinamicamente ma teniamo conto del range 1-3 se non hai tom4
                    const tomId = Math.min(s - 11, 3); 
                    try { drums.player("tom" + tomId).start(absoluteTime); } catch(e){}
                }
            } 
            
            if (isEpicOutro && s === 0) {
                playGuitar = true; inst = guitarOpen; sustain = true; kick = true; snare = true;
                const bNote = normalizeNote(currentRoot, "bass") + "1";
                bass.triggerAttackRelease(bNote, "2n", absoluteTime);
            }

            if (playGuitar) {
                const rootToUse = customNote || currentRoot;
                const gNote = normalizeNote(rootToUse, inst === guitarOpen ? "guitarOpen" : "guitarPalm") + "2";
                const bNote = normalizeNote(rootToUse, "bass") + "1";
                const palmLen = texture < 0.3 ? "8n" : "16n";

                Tone.Transport.schedule(t => {
                    if (inst === guitarOpen) {
                        Tone.Transport.schedule((stopTime) => {
                            try { inst.triggerRelease(stopTime); } catch(e) {}
                        }, t + 0.002);
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

            Tone.Transport.schedule(time => {
                let playedHiHat = false; let playedRide = false; let playedCrash = false;

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
                    try { drums.player("tom" + Math.min(s - 11, 3)).start(time); } catch(e) {} 
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
