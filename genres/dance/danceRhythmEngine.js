// danceRhythmEngine.js — ver. 001 (Gabry Ponte / Prezioso)
import * as Tone from "https://esm.sh/tone";

console.log("danceRhythmEngine.js ver. 001 loaded");

// ------------------------------------------------------------
// ENGINE RITMICO EURODANCE (Gabry Ponte / Prezioso)
// ------------------------------------------------------------
export function scheduleDanceRhythm(
    section,
    progression,
    instruments,
    params,
    rand,
    measureDur,
    score
) {
    const { drums } = instruments;
    if (!drums) return;

    const { kick, clap, snare, hat, openhat, crash } = drums;

    const name = section?.name?.toLowerCase() || "";
    const isIntro = name.includes("intro");
    const isBuild = name.includes("build");
    const isDrop  = name.includes("drop");
    const isRiff  = name.includes("riff");
    const isBreak = name.includes("break");
    const isOutro = name.includes("outro");

    const stepTime = measureDur / 16;

    // --------------------------------------------------------
    // PATTERN BASE EURODANCE
    // --------------------------------------------------------
    const kickPattern = Array(16).fill(false).map((_, i) => i % 4 === 0); // 4/4
    const clapPattern = [false, false, true, false, false, false, true, false,
                         false, false, true, false, false, false, true, false]; // 2 e 4

    const hatPattern = Array(16).fill(true); // 8th costante
    const openHatPattern = [false, true, false, true, false, true, false, true,
                            false, true, false, true, false, true, false, true]; // levare

    // --------------------------------------------------------
    // VARIAZIONI PER SEZIONE
    // --------------------------------------------------------
    let hatVolume = 0.6;
    let clapVolume = 0.9;

    if (isIntro) {
        hatVolume = 0.3;
        clapVolume = 0.5;
    }

    if (isBreak) {
        hatVolume = 0.2;
        clapVolume = 0.3;
    }

    if (isBuild) {
        hatVolume = 0.8;
        clapVolume = 1.0;
    }

    if (isDrop || isRiff) {
        hatVolume = 1.0;
        clapVolume = 1.0;
    }

    // --------------------------------------------------------
    // LOOP MISURE
    // --------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {

        const measureStart = section.startTime + m * measureDur;
        const isLastMeasure = (m === section.measures - 1);

        // Crash all’inizio sezione
        if (m === 0) {
            Tone.Transport.schedule(t => {
                crash.start(t);
                if (score) score.addNote("Drums", "Crash", section.name);
            }, measureStart);
        }

        // ----------------------------------------------------
        // LOOP STEP (0–15)
        // ----------------------------------------------------
        for (let s = 0; s < 16; s++) {

            const absoluteTime = measureStart + s * stepTime;

            // Kick
            if (kickPattern[s]) {
                Tone.Transport.schedule(t => {
                    kick.start(t);
                    if (score) score.addNote("Drums", "Kick", section.name);
                }, absoluteTime);
            }

            // Clap / Snare
            if (clapPattern[s]) {
                Tone.Transport.schedule(t => {
                    clap.volume.value = Tone.gainToDb(clapVolume);
                    clap.start(t);
                    if (score) score.addNote("Drums", "Snare", section.name);
                }, absoluteTime);
            }

            // Hi-hat
            if (hatPattern[s]) {
                Tone.Transport.schedule(t => {
                    hat.volume.value = Tone.gainToDb(hatVolume);
                    hat.start(t);
                    if (score) score.addNote("Drums", "HiHat", section.name);
                }, absoluteTime);
            }

            // Open hat in levare
            if (openHatPattern[s] && (isDrop || isRiff || isBuild)) {
                Tone.Transport.schedule(t => {
                    openhat.volume.value = Tone.gainToDb(hatVolume - 0.2);
                    openhat.start(t);
                    if (score) score.addNote("Drums", "HiHat", section.name);
                }, absoluteTime);
            }

            // ------------------------------------------------
            // FILL SEMPLICE (solo nell’ultima misura)
            // ------------------------------------------------
            if (isLastMeasure && s >= 12 && isDrop) {
                Tone.Transport.schedule(t => {
                    snare.start(t);
                    if (score) score.addNote("Drums", "Snare", section.name);
                }, absoluteTime);
            }
        }
    }
}
