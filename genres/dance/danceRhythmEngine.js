// danceRhythmEngine.js — ver. 002
import * as Tone from "https://esm.sh/tone";

console.log("danceRhythmEngine.js ver. 002 loaded");

export function scheduleDanceRhythm(section, progression, instruments, params, rand, measureDur, score) {
    const { kick, snare, hihat, clap, crash } = instruments;
    if (!kick || !snare) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const stepTime = measureDur / 16;
    const { energy = 0.5 } = params?.imageParams || {};

    for (let m = 0; m < section.measures; m++) {
        const measureStart = section.startTime + m * measureDur;
        const isLastMeasure = (m === section.measures - 1);

        // Crash all'inizio sezione
        if (m === 0 && crash) {
            Tone.Transport.schedule(t => crash.triggerAttackRelease("4n", t, 0.8), measureStart);
        }

        for (let s = 0; s < 16; s++) {
            const time = measureStart + s * stepTime;
            
            // Kick: 4/4 (ogni 4 sedicesimi)
            if (s % 4 === 0) {
                Tone.Transport.schedule(t => {
                    kick.triggerAttackRelease("8n", t, 0.7);
                    if (score) score.addNote("Drums", "Kick", section.name);
                }, time);
            }
            
            // Snare/Clap: sul 2° e 4° beat (step 4 e 12)
            if (s === 4 || s === 12) {
                const vel = isChorus ? 0.8 : 0.6;
                Tone.Transport.schedule(t => {
                    (clap || snare).triggerAttackRelease("8n", t, vel);
                    if (score) score.addNote("Drums", "Snare", section.name);
                }, time);
            }
            
            // HiHat: ottavi costanti (step pari)
            if (s % 2 === 0 && hihat) {
                const vel = energy > 0.6 ? 0.5 : 0.3;
                Tone.Transport.schedule(t => hihat.triggerAttackRelease("16n", t, vel), time);
            }
            
            // Fill alla fine della sezione
            if (isLastMeasure && s >= 12 && energy > 0.6 && snare) {
                Tone.Transport.schedule(t => snare.triggerAttackRelease("8n", t, 0.7), time);
            }
        }
    }
}