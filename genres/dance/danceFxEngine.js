// danceFxEngine.js — ver. 001 (FX per transizioni e accenti)
import * as Tone from "https://esm.sh/tone";

console.log("danceFxEngine.js ver. 001 loaded");

// ============================================================
// FX SCHEDULER
// ============================================================

export function scheduleDanceFx(section, instruments, params, measureDur, score) {
    const {
        fxSweep,
        fxNoise,
        fxFantasy,
        fxHeaven,
        fxJump,
        fxHardFTCore
    } = instruments;
    
    const name = section?.name?.toLowerCase() || "";
    const isIntro = name.includes("intro");
    const isBuild = name.includes("prechorus") || name.includes("bridge");
    const isDrop = name.includes("chorus") || name.includes("solo");
    const isOutro = name.includes("outro");
    
    const style = params?.style || "Prezioso";
    const intensity = params?.imageParams?.energy || 0.5;
    
    // ============================================================
    // 1. INIZIO SEZIONE (CRASH e FANTASY)
    // ============================================================
    if (!isIntro && !isOutro) {
        // Fantasy all'inizio di ogni sezione (atmosfera)
        Tone.Transport.schedule(time => {
            if (fxFantasy) {
                fxFantasy.triggerAttackRelease("C4", "2n", time, 0.5);
                if (score) score.addNote("FX", "Fantasy", section.name);
            }
        }, section.startTime);
    }
    
    // ============================================================
    // 2. BUILD-UP (PRECHORUS/BRIDGE) - SWEEP + NOISE
    // ============================================================
    if (isBuild) {
        // Sweep ascendente all'inizio del build
        Tone.Transport.schedule(time => {
            if (fxSweep) {
                fxSweep.triggerAttackRelease("C5", "2n", time, 0.7);
                if (score) score.addNote("FX", "Sweep", section.name);
            }
        }, section.startTime);
        
        // Noise pulsante ogni 2 beats nel build
        const stepTime = measureDur / 8;
        for (let i = 0; i < section.measures * 4; i++) {
            const t = section.startTime + i * stepTime;
            if (i % 2 === 0) {
                Tone.Transport.schedule(time => {
                    if (fxNoise) {
                        fxNoise.triggerAttackRelease("C4", "8n", time, 0.3);
                        if (score) score.addNote("FX", "Noise", section.name);
                    }
                }, t);
            }
        }
    }
    
    // ============================================================
    // 3. DROP (CHORUS/SOLO) - HARD FTCORE + JUMP
    // ============================================================
    if (isDrop) {
        const dropStart = section.startTime;
        
        // HardFTCore (impact) all'inizio del drop
        Tone.Transport.schedule(time => {
            if (fxHardFTCore) {
                fxHardFTCore.triggerAttackRelease("C4", "1n", time, 0.9);
                if (score) score.addNote("FX", "HardImpact", section.name);
            }
        }, dropStart);
        
        // Jump accent dopo 2 beats (energia)
        Tone.Transport.schedule(time => {
            if (fxJump) {
                fxJump.triggerAttackRelease("C5", "8n", time, 0.8);
                if (score) score.addNote("FX", "Jump", section.name);
            }
        }, dropStart + measureDur / 2);
        
        // Heaven staccato ogni 2 misure nel drop
        if (intensity > 0.5) {
            for (let m = 0; m < section.measures; m += 2) {
                const t = dropStart + m * measureDur;
                Tone.Transport.schedule(time => {
                    if (fxHeaven) {
                        fxHeaven.triggerAttackRelease("C5", "4n", time, 0.6);
                        if (score) score.addNote("FX", "Heaven", section.name);
                    }
                }, t);
            }
        }
    }
    
    // ============================================================
    // 4. TRANSIZIONE TRA SEZIONI (fine sezione)
    // ============================================================
    const endTime = section.startTime + section.measures * measureDur;
    
    // Sweep discendente alla fine del build (pre-drop)
    if (isBuild) {
        Tone.Transport.schedule(time => {
            if (fxSweep) {
                fxSweep.triggerAttackRelease("C3", "1n", time, 0.8);
                if (score) score.addNote("FX", "SweepDown", section.name);
            }
        }, endTime - measureDur / 4);
    }
    
    // Noise finale per sezioni lunghe
    if (isDrop && section.measures > 4) {
        Tone.Transport.schedule(time => {
            if (fxNoise) {
                fxNoise.triggerAttackRelease("C4", "1n", time, 0.5);
                if (score) score.addNote("FX", "NoiseOut", section.name);
            }
        }, endTime - measureDur / 2);
    }
    
    // ============================================================
    // 5. INTRO SPECIFIC FX
    // ============================================================
    if (isIntro) {
        // Sweep d'apertura
        Tone.Transport.schedule(time => {
            if (fxSweep) {
                fxSweep.triggerAttackRelease("C4", "2n", time, 0.6);
                if (score) score.addNote("FX", "IntroSweep", section.name);
            }
        }, section.startTime);
        
        // Fantasy atmosferico nell'intro
        for (let m = 0; m < section.measures; m += 2) {
            const t = section.startTime + m * measureDur;
            Tone.Transport.schedule(time => {
                if (fxFantasy) {
                    fxFantasy.triggerAttackRelease("C4", "1m", time, 0.4);
                    if (score) score.addNote("FX", "FantasyAtmo", section.name);
                }
            }, t);
        }
    }
    
    // ============================================================
    // 6. OUTRO SPECIFIC FX
    // ============================================================
    if (isOutro) {
        // Fade out con Heaven
        for (let m = 0; m < section.measures; m++) {
            const t = section.startTime + m * measureDur + measureDur / 2;
            const velocity = 0.5 - (m / section.measures) * 0.4;
            Tone.Transport.schedule(time => {
                if (fxHeaven) {
                    fxHeaven.triggerAttackRelease("C4", "2n", time, velocity);
                    if (score) score.addNote("FX", "HeavenOut", section.name);
                }
            }, t);
        }
    }
}