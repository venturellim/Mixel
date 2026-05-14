// danceEngineNew.js - Versione minimal e funzionante
import * as Tone from "https://esm.sh/tone";
import { danceInstruments } from "./danceInstruments.js";
import { masterEQ } from "../../common.js";

console.log("🎵 DANCE ENGINE NEW - versione minimal");

// Connessione diretta al master (senza riverberi complessi)
Object.values(danceInstruments).forEach(inst => {
    if (inst && typeof inst.connect === 'function') {
        try { inst.connect(masterEQ); } catch(e) {}
    }
});

export function createDanceEngine(params, score) {
    const bpm = 128;
    const rootNote = "C";
    const measures = 32; // 32 battute totali
    
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;
    
    const measureDur = (60 / bpm) * 4;
    const totalDuration = measures * measureDur;
    
    console.log(`🎵 Dance Engine: BPM=${bpm}, durata=${totalDuration}s`);
    
    // SCHEDULA UN SEMPLICE PATTERN 4/4
    for (let m = 0; m < measures; m++) {
        const t0 = m * measureDur;
        
        // Kick su ogni beat
        for (let beat = 0; beat < 4; beat++) {
            const time = t0 + beat * measureDur / 4;
            Tone.Transport.schedule(() => {
                danceInstruments.percussion?.player("bassDrum")?.start();
                if (score) score.addNote("Kick", "beat", "pattern");
            }, time);
        }
        
        // Bassline semplice (sul primo beat di ogni misura)
        Tone.Transport.schedule(() => {
            const bassNote = rootNote + "2";
            danceInstruments.bass?.triggerAttackRelease(bassNote, "8n");
            if (score) score.addNote("Bass", bassNote, "pattern");
        }, t0);
        
        // Pad (accordo tenuto)
        Tone.Transport.schedule(() => {
            const padNote = rootNote + "3";
            danceInstruments.warmPad?.triggerAttackRelease(padNote, measureDur * 0.9);
            if (score) score.addNote("Pad", padNote, "pattern");
        }, t0);
    }
    
    return {
        totalDuration,
        play: () => {
            if (Tone.context.state !== "running") Tone.context.resume();
            Tone.Transport.start();
            console.log("✅ Dance started!");
        },
        pause: () => Tone.Transport.pause(),
        stop: () => {
            Tone.Transport.stop();
            Tone.Transport.cancel();
            Tone.Transport.seconds = 0;
        },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { instruments: danceInstruments, volumeMap: {} }
    };
}

export async function waitDanceInstruments() {
    console.log("⏳ Attendo strumenti Dance...");
    await Tone.loaded();
    console.log("✅ Strumenti Dance pronti!");
}