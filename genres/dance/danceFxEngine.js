// danceFxEngine.js — ver. 002 (FX corretti + sidechain + timing)
import * as Tone from "https://esm.sh/tone";

console.log("danceFxEngine.js ver. 002 loaded");

export function scheduleDanceFx(section, instruments, params, measureDur, score) {
    const {
        fxSweep,
        fxNoise,
        fxFantasy,
        fxHeaven,
        fxJump,
        fxHardFTCore,
        fxBus
    } = instruments;

    // SIDECHAIN: ora anche gli FX respirano con la kick
    if (instruments.duckGain && !fxBus._duckConnected) {
        fxBus.connect(instruments.duckGain);
        fxBus._duckConnected = true;
    }

    const name = section?.name?.toLowerCase() || "";
    const isIntro = name.includes("intro");
    const isBuild = name.includes("prechorus") || name.includes("bridge");
    const isDrop = name.includes("chorus") || name.includes("solo");
    const isOutro = name.includes("outro");

    const style = params?.style || "Prezioso";
    const intensity = params?.imageParams?.energy || 0.5;

    const stepTime = measureDur / 16;
    const swing = params.swing || 0;

    const swingOffset = (s) => (s % 2 === 0 ? stepTime * 0.3 * swing : 0);

    // ------------------------------------------------------------
    // 1. INIZIO SEZIONE
    // ------------------------------------------------------------
    if (!isIntro && !isOutro) {
        Tone.Transport.schedule(time => {
            fxFantasy?.triggerAttackRelease("C4", "2n", time + swingOffset(0), 0.35);
            score?.addNote("FX", "Fantasy", section.name);
        }, section.startTime);
    }

    // ------------------------------------------------------------
    // 2. BUILD-UP
    // ------------------------------------------------------------
    if (isBuild) {
        // Sweep ascendente
        Tone.Transport.schedule(time => {
            fxSweep?.triggerAttackRelease("C5", "2n", time, 0.55);
            score?.addNote("FX", "SweepUp", section.name);
        }, section.startTime);

        // Noise pulsante (densità ridotta)
        for (let i = 0; i < section.measures * 4; i++) {
            if (i % 4 === 0) {
                const t = section.startTime + i * (measureDur / 4);
                Tone.Transport.schedule(time => {
                    fxNoise?.triggerAttackRelease("C4", "8n", time + swingOffset(i), 0.25);
                    score?.addNote("FX", "NoisePulse", section.name);
                }, t);
            }
        }
    }

    // ------------------------------------------------------------
    // 3. DROP
    // ------------------------------------------------------------
    if (isDrop) {
        const dropStart = section.startTime;

        // Hard FTCore impatto
        Tone.Transport.schedule(time => {
            fxHardFTCore?.triggerAttackRelease("C4", "1n", time, 0.75);
            score?.addNote("FX", "HardImpact", section.name);
        }, dropStart);

        // Jump accent
        Tone.Transport.schedule(time => {
            fxJump?.triggerAttackRelease("C5", "8n", time, 0.6);
            score?.addNote("FX", "Jump", section.name);
        }, dropStart + measureDur / 2);

        // Heaven ogni 2 misure
        if (intensity > 0.5) {
            for (let m = 0; m < section.measures; m += 2) {
                const t = dropStart + m * measureDur;
                Tone.Transport.schedule(time => {
                    fxHeaven?.triggerAttackRelease("C5", "4n", time, 0.45);
                    score?.addNote("FX", "Heaven", section.name);
                }, t);
            }
        }
    }

    // ------------------------------------------------------------
    // 4. TRANSIZIONE
    // ------------------------------------------------------------
    const endTime = section.startTime + section.measures * measureDur;

    if (isBuild) {
        Tone.Transport.schedule(time => {
            fxSweep?.triggerAttackRelease("C3", "1n", time, 0.6);
            score?.addNote("FX", "SweepDown", section.name);
        }, endTime - measureDur / 4);
    }

    if (isDrop && section.measures > 4) {
        Tone.Transport.schedule(time => {
            fxNoise?.triggerAttackRelease("C4", "1n", time, 0.35);
            score?.addNote("FX", "NoiseOut", section.name);
        }, endTime - measureDur / 2);
    }

    // ------------------------------------------------------------
    // 5. INTRO
    // ------------------------------------------------------------
    if (isIntro) {
        Tone.Transport.schedule(time => {
            fxSweep?.triggerAttackRelease("C4", "2n", time, 0.45);
            score?.addNote("FX", "IntroSweep", section.name);
        }, section.startTime);

        for (let m = 0; m < section.measures; m += 2) {
            const t = section.startTime + m * measureDur;
            Tone.Transport.schedule(time => {
                fxFantasy?.triggerAttackRelease("C4", "1m", time, 0.3);
                score?.addNote("FX", "FantasyAtmo", section.name);
            }, t);
        }
    }

    // ------------------------------------------------------------
    // 6. OUTRO
    // ------------------------------------------------------------
    if (isOutro) {
        for (let m = 0; m < section.measures; m++) {
            const t = section.startTime + m * measureDur + measureDur / 2;
            const vel = 0.4 - (m / section.measures) * 0.3;
            Tone.Transport.schedule(time => {
                fxHeaven?.triggerAttackRelease("C4", "2n", time, vel);
                score?.addNote("FX", "HeavenOut", section.name);
            }, t);
        }
    }
}
