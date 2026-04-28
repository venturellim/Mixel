// orchestraRhythmEngine.js — ver. 002 (Cello + DoubleBass + Timpani)
import * as Tone from "https://esm.sh/tone";

console.log("orchestraRhythmEngine.js ver. 002 loaded");

export function scheduleOrchestraRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot, score) {
    const { cello, doubleBass, percussion } = instruments;
    if (!cello || !doubleBass || !percussion) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isPreChorus = name.includes("pre") || name.includes("bridge");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo");

    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params?.imageParams || {};

    // ============================================================
    // GROOVE ORCHESTRALE
    // ============================================================

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

    // ============================================================
    // LOOP MISURE
    // ============================================================

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const nextRoot = progression[(m + 1) % progression.length] || nextSectionRoot;

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);

            let playCello = false;
            let playBass = false;
            let playTimpani = false;
            let sustain = false;

            // ============================================================
            // LOGICA GROOVE ORCHESTRALE
            // ============================================================

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

            // ============================================================
            // SCHEDULAZIONE NOTE (senza normalizeNote)
            // ============================================================

            const celloNote = currentRoot + "3";       // Cello range
            const bassNote = currentRoot + "1";        // Double bass range

            if (playCello) {
                Tone.Transport.schedule(t => {
                    cello.triggerAttackRelease(
                        celloNote,
                        sustain ? "1n" : "8n",
                        t
                    );
                    if (score) score.addNote("Cello", celloNote, section.name);
                }, absoluteTime);
            }

            if (playBass) {
                Tone.Transport.schedule(t => {
                    doubleBass.triggerAttackRelease(
                        bassNote,
                        sustain ? "1n" : "8n",
                        t
                    );
                    if (score) score.addNote("DoubleBass", bassNote, section.name);
                }, absoluteTime);
            }

            if (playTimpani) {
                Tone.Transport.schedule(t => {
                    percussion.player("timpano1").start(t);
                    if (score) score.addNote("Percussion", "Timpani", section.name);
                }, absoluteTime);
            }
        }
    }
}
