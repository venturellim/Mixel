// orchestraRhythmEngine.js — ver. 002.3 (Timpani fix)

import * as Tone from "https://esm.sh/tone";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";

console.log("orchestraRhythmEngine.js ver. 002.3 loaded");

// ------------------------------------------------------------
// SAFE NOTE
// ------------------------------------------------------------
function safeNote(note, defaultOctave = "3") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
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
// SMART TIMPANI ROLL (corretto)
// ------------------------------------------------------------
function smartTimpaniRoll(startTime, percussion, score, lastMidi, nextMidi, rand, sectionName) {
    if (!percussion || !percussion.player) return;

    let sequence;

    if (lastMidi < nextMidi) {
        sequence = ["timpano1", "timpano2", "timpano3", "timpano4", "timpano5"];
    } else if (lastMidi > nextMidi) {
        sequence = ["timpano5", "timpano4", "timpano3", "timpano2", "timpano1"];
    } else {
        sequence = ["timpano3", "timpano4", "timpano3", "timpano4"];
    }

    const interval = 0.12;

    sequence.forEach((key, idx) => {
        Tone.Transport.schedule(t => {
            const player = percussion.player(key);
            if (player) {
                player.start(t);
                if (score) score.addNote("Percussion", "Timpani", sectionName);
            }
        }, startTime + idx * interval);
    });

    const lastHitTime = startTime + (sequence.length - 1) * interval;

    Tone.Transport.schedule(t => {
        const gong = percussion.player("gong");
        if (gong) {
            gong.start(t);
            if (score) score.addNote("Drums", "Crash", sectionName);
        }
    }, lastHitTime);
}

// ------------------------------------------------------------
// TIMPANI SINGOLO
// ------------------------------------------------------------
function playTimpaniHit(time, percussion, score, sectionName, energy) {
    if (!percussion || !percussion.player) return;
    
    // Timpano diverso in base all'energia
    const timpanoKey = energy > 0.6 ? "timpano5" : "timpano3";
    const player = percussion.player(timpanoKey);
    if (player) {
        Tone.Transport.schedule(t => {
            player.start(t);
            if (score) score.addNote("Drums", "Kick", sectionName);
        }, time);
    }
}

// ------------------------------------------------------------
// RHYTHM ENGINE
// ------------------------------------------------------------
export function scheduleOrchestraRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot, score) {

    const { cello, doubleBass, percussion } = instruments;
    if (!cello || !doubleBass || !percussion) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isPreChorus = name.includes("pre") || name.includes("bridge");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo");

    const stepTime = measureDur / 16;
    const { energy = 0.5, complexity = 0.5 } = params?.imageParams || {};

    // ------------------------------------------------------------
    // GROOVE MAP
    // ------------------------------------------------------------
    const grooveMap = {
        intro: "long_sustain",
        verse: energy > 0.6 ? "ostinato_fast" : "ostinato_slow",
        prechorus: "build_up",
        bridge: "build_up",
        chorus: "anthemic",
        solo: "supportive"
    };

    const grooveType =
        isIntro ? grooveMap.intro :
        isPreChorus ? grooveMap.prechorus :
        isChorus ? grooveMap.chorus :
        isSolo ? grooveMap.solo :
        grooveMap.verse;

    console.log(`🥁 ${section.name} → groove: ${grooveType}, energy: ${energy}`);

    // ------------------------------------------------------------
    // LOOP MISURE
    // ------------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {
    
        const isLastMeasure = (m === section.measures - 1);
        const measureStartTime = section.startTime + m * measureDur;

        const rawRoot = progression[m % progression.length];
        const pitchRoot = getRootPitch(rawRoot);

        const scale = buildScaleFromTonic(pitchRoot + "2", "harmonicMinor");
        const rootIdx = 0;

        // FILL ALL'INIZIO DELL'ULTIMA MISURA (non a metà!)
        if (isLastMeasure && section.name.toLowerCase() !== "outro") {
            const prevScale = buildScaleFromTonic(getRootPitch(progression[(m-1) % progression.length] || pitchRoot) + "2", "harmonicMinor");
            const nextScale = buildScaleFromTonic(getRootPitch(nextSectionRoot) + "2", "harmonicMinor");

            const prevNote = getScaleDegree(prevScale, 0);
            const nextNote = getScaleDegree(nextScale, 0);

            const prevMidi = Tone.Frequency(prevNote).toMidi();
            const nextMidi = Tone.Frequency(nextNote).toMidi();

            // Fill all'inizio dell'ultima misura (step 0 della misura)
            const fillStartTime = measureStartTime;
            smartTimpaniRoll(
                fillStartTime,
                percussion,
                score,
                prevMidi,
                nextMidi,
                rand,
                section.name
            );
        }

        for (let s = 0; s < 16; s++) {

            const absoluteTime = measureStartTime + s * stepTime;

            let playCello = false;
            let playBass = false;
            let playTimpani = false;
            let sustain = false;

            // ------------------------------------------------------------
            // LOGICA GROOVE (con timpani aggiunti ovunque!)
            // ------------------------------------------------------------
            switch (grooveType) {

                case "long_sustain":
                    if (s === 0) { playCello = true; sustain = true; }
                    if (s === 0) playBass = true;
                    // Timpani sul beat 1 e 3
                    if (s === 0 || s === 8) playTimpani = true;
                    break;

                case "ostinato_slow":
                    if (s % 4 === 0) playCello = true;
                    if (s === 0 || s === 8) playBass = true;
                    // Timpani sul beat 1 e 3 quando energia media/alta
                    if ((s === 0 || s === 8) && energy > 0.4) playTimpani = true;
                    break;

                case "ostinato_fast":
                    if (s % 2 === 0) playCello = true;
                    if (s === 0 || s === 8) playBass = true;
                    // Timpani sul beat 1 e 3 quando energia alta
                    if ((s === 0 || s === 8) && energy > 0.5) playTimpani = true;
                    break;

                case "build_up":
                    if (s % 4 === 0) playCello = true;
                    if (s === 0 || s === 8) playBass = true;
                    // Timpani che aumentano verso la fine della sezione
                    const progress = m / section.measures;
                    if (s === 0 && progress > 0.5) playTimpani = true;
                    if (s === 8 && progress > 0.7) playTimpani = true;
                    if (s === 12 && complexity > 0.4) playTimpani = true;
                    break;

                case "anthemic":
                    if (s === 0 || s === 8) { playCello = true; sustain = true; }
                    if (s === 0 || s === 8) playBass = true;
                    // Timpani su ogni beat forte (1, 5, 9, 13)
                    if (s === 0 || s === 4 || s === 8 || s === 12) playTimpani = true;
                    break;

                case "supportive":
                    if (s % 4 === 0) playCello = true;
                    if (s === 0 || s === 8) playBass = true;
                    // Timpani rari nell'assolo (solo se energia alta)
                    if (s === 0 && energy > 0.7) playTimpani = true;
                    break;

                default:
                    if (s % 4 === 0) playCello = true;
                    if (s === 0 || s === 8) playBass = true;
                    if (s === 0 && energy > 0.5) playTimpani = true;
                    break;
            }

            // ------------------------------------------------------------
            // NOTE SICURE
            // ------------------------------------------------------------
            const celloName = getScaleDegree(scale, rootIdx);
            const safeCello = safeNote(celloName, "3");

            const bassDegree = (rootIdx - 2 + scale.length) % scale.length;
            const bassName = getScaleDegree(scale, bassDegree);
            const safeBass = safeNote(bassName, "1");

            // ------------------------------------------------------------
            // TRIGGER
            // ------------------------------------------------------------
            if (playCello && safeCello) {
                Tone.Transport.schedule(t => {
                    cello.triggerAttackRelease(
                        safeCello,
                        sustain ? "1n" : "8n",
                        t
                    );
                    if (score) score.addNote("BassXtra", safeCello, section.name);
                }, absoluteTime);
            }

            if (playBass && safeBass) {
                Tone.Transport.schedule(t => {
                    doubleBass.triggerAttackRelease(
                        safeBass,
                        sustain ? "1n" : "8n",
                        t
                    );
                    if (score) score.addNote("Bass", safeBass, section.name);
                }, absoluteTime);
            }

            if (playTimpani) {
                playTimpaniHit(absoluteTime, percussion, score, section.name, energy);
            }
        }
    }
}