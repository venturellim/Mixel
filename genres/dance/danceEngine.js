// danceEngineNEW.js - STEP 1: Parametri dinamici dall'immagine
import * as Tone from "https://esm.sh/tone";
import { danceInstruments } from "./danceInstruments.js";
import { scheduleRhythmNEW } from "./danceRhythmEngine.js";
import { masterEQ } from "../../common.js";

console.log("🎵 DANCE ENGINE NEW - STEP 1 (parametri dinamici)");

// Connessione semplice al master
Object.values(danceInstruments).forEach(inst => {
    if (inst?.connect) {
        try { inst.connect(masterEQ); } catch(e) {}
    }
});

export async function waitDanceInstruments() {
    await Tone.loaded();
    console.log("✅ Dance instruments ready");
}

export function createDanceEngine(params, score) {
    // ------------------------------------------------------------
    // 1. ESTRAI PARAMETRI DALLA FOTO
    // ------------------------------------------------------------
    const intensity = params.global?.intensity ?? 0.5;
    const mood = params.global?.mood ?? 0.5;
    const complexity = params.global?.complexity ?? 0.5;
    
    // BPM: da 110 (tranquillo) a 150 (energico)
    const bpm = Math.round(110 + intensity * 40);
    
    // Tonalità: in base alla luminosità/mood
    const tonics = mood > 0.6 ? ["C", "G", "D"] : ["A", "E", "F"];
    const tonic = tonics[Math.floor(Math.random() * tonics.length)];
    const rootNote = tonic;
    
    // Scala: maggiore se mood alto, minore se mood basso
    const scaleType = mood > 0.5 ? "major" : "naturalMinor";
    
    // Durata brano: in base alla complessità (32-64 battute)
    const measures = Math.floor(32 + complexity * 32);
    const measureDur = (60 / bpm) * 4;
    const totalDuration = measures * measureDur;
    
    console.log("🎵 Parametri Dance dalla foto:");
    console.log(`   - Intensity: ${intensity.toFixed(2)} → BPM: ${bpm}`);
    console.log(`   - Mood: ${mood.toFixed(2)} → Tonalità: ${rootNote} ${scaleType}`);
    console.log(`   - Complexity: ${complexity.toFixed(2)} → Misure: ${measures}`);
    
    // ------------------------------------------------------------
    // 2. RESET TRANSPORT
    // ------------------------------------------------------------
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;
    
    // ------------------------------------------------------------
    // 3. SCHEDULA CON PARAMETRI DINAMICI
    // ------------------------------------------------------------
    scheduleRhythmNEW(danceInstruments, score, {
        bpm,
        rootNote,
        scaleType,
        measures,
        intensity,
        mood
    });
    
    // ------------------------------------------------------------
    // 4. API
    // ------------------------------------------------------------
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