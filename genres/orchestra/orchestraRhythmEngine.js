// orchestraRhythmEngine.js — ver. C (Cello + DoubleBass + Timpani, Safe Pipeline)
import * as Tone from "https://esm.sh/tone";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";

console.log("orchestraRhythmEngine.js ver. 002 loaded");

// ------------------------------------------------------------
// SAFE NOTE (identico a orchestraEngine originale)
// ------------------------------------------------------------
function safeNote(note, defaultOctave = "3") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

// ------------------------------------------------------------
// ROOT PITCH (estrae solo la nota, ignora accordi)
// ------------------------------------------------------------
function getRootPitch(root) {
    if (!root || typeof root !== "string") return "A";
    const match = root.toUpperCase().match(/^([A-G](#|B)?)/);
    return match ? match[1] : "A";
}

// ------------------------------------------------------------
// RHYTHM ENGINE — VERSIONE C
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
    // GROOVE MAP (identico)
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

    // ------------------------------------------------------------
    // LOOP MISURE
    // ------------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {

        const measureStartTime = section.startTime + m * measureDur;

        const rawRoot = progression[m % progression.length];
        const pitchRoot = getRootPitch(rawRoot);

        // Scala armonica minore (come orchestraEngine)
        const scale = buildScaleFromTonic(pitchRoot + "2", "harmonicMinor");
        const rootIdx = 0;

        for (let s = 0; s < 16; s++) {

            const absoluteTime = measureStartTime + s * stepTime;

            let playCello = false;
            let playBass = false;
            let playTimpani = false;
            let sustain = false;

            // ------------------------------------------------------------
            // LOGICA GROOVE
            // ------------------------------------------------------------
            switch (grooveType) {

                case "long_sustain":
                    if (s === 0) { playCello = true; sustain = true; }
                    if (s === 0) playBass = true;
                    if (s === 0 && energy > 0.4) playTimpani = true;
                    break;

                case "ostinato_slow":
                    if (s % 4 === 0) playCello = true;
                    if (s === 0 || s === 8) playBass = true;
                    if (s === 0 && energy > 0.5) playTimpani = true;
                    break;

                case "ostinato_fast":
                    if (s % 2 === 0) playCello = true;
                    if (s === 0 || s === 8) playBass = true;
                    if (s === 0 && energy > 0.6) playTimpani = true;
                    break;

                case "build_up":
                    if (s % 4 === 0) playCello = true;
                    if (s === 0 || s === 8) playBass = true;
                    if (s === 12 && complexity > 0.4) playTimpani = true;
                    break;

                case "anthemic":
                    if (s === 0 || s === 8) { playCello = true; sustain = true; }
                    if (s === 0 || s === 8) playBass = true;
                    if (s === 0 || s === 8) playTimpani = true;
                    break;

                case "supportive":
                    if (s % 4 === 0) playCello = true;
                    if (s === 0 || s === 8) playBass = true;
                    break;

                default:
                    if (s % 4 === 0) playCello = true;
                    if (s === 0 || s === 8) playBass = true;
                    break;
            }

            // ------------------------------------------------------------
            // NOTE SICURE (Versione C)
            // ------------------------------------------------------------

            // Cello: grado 0 della scala
            const celloName = getScaleDegree(scale, rootIdx);
            const safeCello = safeNote(celloName, "3");

            // Double bass: grado -2 (quinta sotto)
            const bassName = getScaleDegree(scale, rootIdx - 2);
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
                    if (score) score.addNote("Rhythm", safeCello, section.name);
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
                Tone.Transport.schedule(t => {
                    percussion.player("timpano1").start(t);
                    if (score) score.addNote("Drums", "Kick", section.name);
                }, absoluteTime);
            }
        }
    }
}
