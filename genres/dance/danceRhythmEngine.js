// danceRhythmEngineNEW.js - Pattern semplice
import * as Tone from "https://esm.sh/tone";

export function scheduleRhythmNEW(instruments, score) {
    const { percussion, bass, warmPad } = instruments;
    const bpm = 130;
    const measureDur = (60 / bpm) * 4;
    const beatDur = measureDur / 4;
    
    for (let m = 0; m < 32; m++) {
        const t0 = m * measureDur;
        
        // Kick su ogni beat
        for (let i = 0; i < 4; i++) {
            Tone.Transport.schedule(() => {
                percussion?.player("bassDrum")?.start();
                score?.addNote("Kick", "beat", "loop");
            }, t0 + i * beatDur);
        }
        
        // Snare su 2 e 4
        [1, 3].forEach(i => {
            Tone.Transport.schedule(() => {
                percussion?.player("handClap")?.start();
                score?.addNote("Snare", "beat", "loop");
            }, t0 + i * beatDur);
        });
        
        // Bass sul primo beat
        Tone.Transport.schedule(() => {
            bass?.triggerAttackRelease("C2", "8n");
            score?.addNote("Bass", "C2", "loop");
        }, t0);
        
        // Pad tenuto
        Tone.Transport.schedule(() => {
            warmPad?.triggerAttackRelease("C3", measureDur * 0.9);
            score?.addNote("Pad", "C3", "loop");
        }, t0);
    }
}