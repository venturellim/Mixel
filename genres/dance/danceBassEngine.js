// danceBassEngine.js — ver. 001 (Gigi D’Agostino / Gabry Ponte)
import * as Tone from "https://esm.sh/tone";

console.log("danceBassEngine.js ver. 001 loaded");

// ------------------------------------------------------------
// BASS ENGINE (Eurodance 1995–2005)
// ------------------------------------------------------------
export function scheduleDanceBass(
    section,
    progression,
    instruments,
    params,
    rand,
    measureDur,
    score
) {
    const { bass } = instruments;
    if (!bass) return;

    const name = section?.name?.toLowerCase() || "";
    const isIntro = name.includes("intro");
    const isBuild = name.includes("build");
    const isDrop  = name.includes("drop");
    const isRiff  = name.includes("riff");
    const isBreak = name.includes("break");
    const isOutro = name.includes("outro");

    const stepTime = measureDur / 16;

    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params?.imageParams || {};

    // --------------------------------------------------------
    // SELEZIONE PATTERN BASSO
    // --------------------------------------------------------
    let patternType = "offbeat";

    if (isDrop || isRiff) {
        if (energy > 0.6 && brightness > 0.5) patternType = "octave";
        else if (complexity > 0.5) patternType = "rolling";
        else patternType = "offbeat";
    }

    if (isBreak) patternType = "rolling";
    if (isIntro) patternType = "offbeat";

    // --------------------------------------------------------
    // DEFINIZIONE PATTERN
    // --------------------------------------------------------
    const offbeatPattern = Array(16).fill(false).map((_, i) => i % 4 === 2);
    const rollingPattern = [true, false, true, false, true, false, true, false,
                            true, false, true, false, true, false, true, false];
    const octavePattern  = [true, false, true, false, true, false, true, false,
                            true, false, true, false, true, false, true, false];

    let activePattern = offbeatPattern;
    if (patternType === "rolling") activePattern = rollingPattern;
    if (patternType === "octave")  activePattern = octavePattern;

    // --------------------------------------------------------
    // LOOP MISURE
    // --------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {

        const measureStart = section.startTime + m * measureDur;

        const root = progression[m % progression.length];
        const rootNote = `${root}2`;
        const fifthNote = `${Tone.Frequency(rootNote).transpose(7).toNote()}`;
        const octaveNote = `${Tone.Frequency(rootNote).transpose(12).toNote()}`;

        // ----------------------------------------------------
        // LOOP STEP (0–15)
        // ----------------------------------------------------
        for (let s = 0; s < 16; s++) {

            const absoluteTime = measureStart + s * stepTime;

            if (!activePattern[s]) continue;

            let note = rootNote;

            if (patternType === "rolling") {
                note = (s % 4 === 2) ? fifthNote : rootNote;
            }

            if (patternType === "octave") {
                note = (s % 4 === 2) ? octaveNote : rootNote;
            }

            // BREAK → basso più morbido
            const velocity = isBreak ? 0.4 : 0.8;

            Tone.Transport.schedule(t => {
                bass.triggerAttackRelease(note, "8n", t, velocity);
                if (score) score.addNote("Bass", note, section.name);
            }, absoluteTime);
        }
    }
}
