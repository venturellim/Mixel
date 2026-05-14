// danceEngine.js — ver. 003 COMPLETAMENTE RIFATTO
import * as Tone from "https://esm.sh/tone";

import { chooseDanceStyle } from "./chooseDanceStyle.js";
import { buildDanceParams } from "./danceParams.js";
import { danceInstruments, danceVolumeMap } from "./danceInstruments.js";
import { scheduleDanceRhythm } from "./danceRhythmEngine.js";
import { scheduleDanceLead } from "./danceLeadEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("danceEngine.js ver. 003 RIFATTO loaded");

// ------------------------------------------------------------
// WAIT FOR INSTRUMENTS
// ------------------------------------------------------------
export async function waitDanceInstruments() {
    // Crea un oggetto con i contatori degli strumenti Dance
    const danceInstrumentCount = {
        dance: 19  // ← numero totale di strumenti dance
    };
    console.log("🎵 Attendo caricamento strumenti Dance...");
    await waitForInstruments(danceInstrumentCount);
    console.log("✅ Strumenti Dance pronti!");
}
// ------------------------------------------------------------
// SEED RANDOM
// ------------------------------------------------------------
function createSeededRandom(seed) {
    return function () {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

// ------------------------------------------------------------
// MAIN ENGINE (ASYNC!)
// ------------------------------------------------------------
export async function createDanceEngine(params, score) {
    console.log("🎬 createDanceEngine START");
    
    // 1. ASPETTA che gli strumenti siano pronti
    await waitDanceInstruments();
    
    // 2. Verifica che Tone.context sia avviato
    if (Tone.context.state !== "running") {
        console.log("🎵 Avvio contesto Tone...");
        await Tone.context.resume();
    }
    
    // 3. Random deterministico
    const rand = createSeededRandom(params.dna);
    
    // 4. Stile dance
    const style = chooseDanceStyle(params.dna, params.global);
    console.log("🎛 Dance style scelto:", style);
    
    // 5. Parametri dance
    const danceParams = buildDanceParams(rand, params.global);
    console.log("🎵 Dance params:", danceParams);
    
    // 6. RESET COMPLETO del Transport
    Tone.Transport.stop();
    Tone.Transport.cancel(0);
    Tone.Transport.seconds = 0;
    Tone.Transport.bpm.value = danceParams.bpm;
    
    console.log("✅ Transport resettato, BPM:", danceParams.bpm);
    
    // ------------------------------------------------------------
    // STRUTTURA DEL BRANO
    // ------------------------------------------------------------
    const structure = [
        { name: "intro",  measures: 4 },
        { name: "build",  measures: 4 },
        { name: "drop",   measures: 8 },
        { name: "break",  measures: 4 },
        { name: "chorus", measures: 8 },
        { name: "outro",  measures: 4 }
    ];
    
    // Calcolo startTime per ogni sezione
    let currentTime = 0;
    const measureDur = (60 / danceParams.bpm) * 4;
    
    structure.forEach(sec => {
        sec.startTime = currentTime;
        currentTime += sec.measures * measureDur;
        console.log(`📐 Sezione ${sec.name}: start=${sec.startTime.toFixed(2)}s, measures=${sec.measures}`);
    });
    
    // ------------------------------------------------------------
    // SCHEDULAZIONE SEZIONI (con try/catch)
    // ------------------------------------------------------------
    structure.forEach(sec => {
        try {
            // Log visivo all'inizio di ogni sezione
            Tone.Transport.schedule(() => {
                console.log(
                    `%c ▶ DANCE | ${sec.name.toUpperCase()} | STYLE: ${style} | TIME: ${Tone.Transport.seconds.toFixed(2)}s`,
                    "color:#ff1493; font-weight:bold;"
                );
            }, sec.startTime);
            
            // Ritmica (kick, clap, hat, bassline, pad, FX)
            scheduleDanceRhythm(sec, danceInstruments, danceParams, style, score, rand);
            
            // Lead melodici/ritmici
            scheduleDanceLead(sec, danceInstruments, danceParams, style, score, rand);
            
        } catch (e) {
            console.error(`❌ Errore durante scheduling sezione ${sec.name}:`, e);
        }
    });
    
    // ------------------------------------------------------------
    // TIMER DI DEBUG
    // ------------------------------------------------------------
    let lastLogTime = 0;
    Tone.Transport.scheduleRepeat(() => {
        const now = Tone.Transport.seconds;
        if (Math.floor(now) > lastLogTime) {
            lastLogTime = Math.floor(now);
            console.log(`⏱️ Transport time: ${now.toFixed(1)}s`);
        }
    }, 1);
    
    // ------------------------------------------------------------
    // API PUBBLICA
    // ------------------------------------------------------------
    return {
        totalDuration: currentTime,
        
        play: async () => {
            console.log("🎵 play() chiamato");
            console.log("   - Transport state:", Tone.Transport.state);
            console.log("   - Transport seconds:", Tone.Transport.seconds);
            console.log("   - Context state:", Tone.context.state);
            
            // Assicura che il contesto sia attivo
            if (Tone.context.state !== "running") {
                console.log("🎵 Avvio contesto audio...");
                await Tone.context.resume();
                console.log("✅ Contesto audio avviato");
            }
            
            // Piccolo delay per stabilizzare
            await new Promise(r => setTimeout(r, 50));
            
            // Reset finale prima della partenza
            Tone.Transport.cancel(0);
            Tone.Transport.seconds = 0;
            
            // START SENZA ARGOMENTI (non "+0.1")
            Tone.Transport.start();
            console.log("✅ Transport avviato");
        },
        
        pause: () => {
            console.log("⏸️ Pause");
            Tone.Transport.pause();
        },
        
        stop: () => {
            console.log("⏹️ Stop");
            Tone.Transport.stop();
            Tone.Transport.cancel(0);
            Tone.Transport.seconds = 0;
            if (score) score.hide();
        },
        
        seek: (s) => {
            console.log(`⏩ Seek to ${s}s`);
            Tone.Transport.seconds = s;
        },
        
        mixerData: {
            instruments: danceInstruments,
            volumeMap: danceVolumeMap
        }
    };
}