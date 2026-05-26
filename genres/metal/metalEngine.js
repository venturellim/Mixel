// metalEngine.js — ver. 015 (con Bridge support)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { metalInstruments, metalVolumeMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { scheduleLead } from "./metalLeadEngine.js"; 

console.log("metalEngine.js ver. 016.5 loaded");

export function createMetalEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    Tone.Transport.stop();
    Tone.Transport.cancel(); 
    Tone.Transport.bpm.value = metalParams.bpm;

    const hasPreChorus = params.imageParams.energy > 0.3; 
    const preChorusWeight = hasPreChorus ? 4 : 0;
    const hasBridge = params.imageParams.complexity > 0.4; // bridge se complessità > 0.4

    const rawStructure = [
        { name: "intro",     weight: 4 + (rand() * 4) }, 
        { name: "verse",     weight: 8 },
        { name: "prechorus", weight: preChorusWeight },
        { name: "chorus",    weight: 8 },
        { name: "verse",     weight: 4 },
        { name: "chorus",    weight: 4 },
        { name: "soloPt1",    weight: params.imageParams.complexity > 0.6 ? 8 : 0 },
        { name: "soloPt2",    weight: params.imageParams.complexity > 0.6 ? 8 : 0 },
        //{ name: "solo",      weight: params.imageParams.complexity > 0.6 ? 16 : 0 },
        { name: "bridge",    weight: hasBridge ? preChorusWeight : 0 },  // bridge solo se attivo
        { name: "soloPt1",    weight: params.imageParams.complexity > 0.6 ? 8 : 0 },
        { name: "soloPt2",    weight: params.imageParams.complexity > 0.6 ? 8 : 0 },
        //{ name: "solo",      weight: params.imageParams.complexity > 0.6 ? 16 : 0 },
        { name: "bridge",    weight: hasBridge ? preChorusWeight : 0 },  // bridge solo se attivo
        { name: "chorus",    weight: 4 },
        { name: "chorusEnd",    weight: 8 },
        { name: "outro",     weight: 4 }
    ];

    // 2. QUADRATURA MUSICALE
    const finalStructure = rawStructure.map(s => {
        let m = Math.floor(s.weight);
        if (m > 0) {
            if (["intro", "verse", "chorus", "solo"].includes(s.name)) {
                m = Math.ceil(m / 4) * 4; 
            } else {
                m = Math.ceil(m / 2) * 2;
            }
        }
        return { name: s.name, measures: m };
    }).filter(s => s.measures > 0);

    const structure = buildSongStructure(finalStructure, metalParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);

    // ============================================================
    // FORZA PROGRESSIONE PER BRIDGE (usa la stessa del prechorus)
    // ============================================================
    const preChorusSection = structure.sections.find(s => s.name === "prechorus");
    const bridgeSection = structure.sections.find(s => s.name === "bridge");
    const chorusSection = structure.sections.find(s => s.name === "chorus");
    const soloPt1Section = structure.sections.find(s => s.name === "soloPt1");
const soloPt2Section = structure.sections.find(s => s.name === "soloPt2");
    
    if (bridgeSection && preChorusSection) {
        // Usa la progressione del prechorus per il bridge
        const preChorusProg = progressions["prechorus"];
        if (preChorusProg) {
            progressions["bridge"] = {
                root: preChorusProg.root,
                progression: preChorusProg.progression
            };
            console.log("🌉 BRIDGE: usa progressione del PRECHORUS →", preChorusProg.progression);
        } else {
            // Fallback: progressione classica
            progressions["bridge"] = {
                root: metalParams.tonalCenter[0] || "A",
                progression: ["i", "iv", "v", "i", "i", "iv", "v", "i"]
            };
        }
    }

// FORZA PROGRESSIONE PER LE PARTI DELL'ASSOLO (usa la stessa del chorus)
// ============================================================
if (soloPt1Section && chorusSection) {
    const chorusProg = progressions["chorus"];
    if (chorusProg) {
        progressions["soloPt1"] = {
            root: chorusProg.root,
            progression: chorusProg.progression
        };
        progressions["soloPt2"] = {
            root: chorusProg.root,
            progression: chorusProg.progression
        };
        console.log("🎸 SOLO Pt1/Pt2: usa progressione del CHORUS →", chorusProg.progression);
    } else {
        const fallbackProg = ["i", "iv", "v", "vi", "i", "iv", "v", "i"];
        progressions["soloPt1"] = {
            root: metalParams.tonalCenter[0] || "A",
            progression: fallbackProg
        };
        progressions["soloPt2"] = {
            root: metalParams.tonalCenter[0] || "A",
            progression: fallbackProg
        };
    }
}

    const measureDur = (60 / metalParams.bpm) * 4;

    const combinedParams = {
        ...metalParams,
        imageParams: params.imageParams 
    };

    structure.sections.forEach((sec, index) => {
        const info = progressions[sec.name];
        const sectionRoot = info?.root || metalParams.tonalCenter[0] || "E";
        const degrees = info?.progression || ["i"];

        let fullProgression = [];
        while (fullProgression.length < sec.measures) {
            fullProgression = fullProgression.concat(degrees);
        }
        fullProgression = fullProgression.slice(0, sec.measures);

        const realNotes = fullProgression.map(d => degreeToRoot(d, sectionRoot));

        const nextSec = structure.sections[index + 1];
        const nextSectionRoot = nextSec ? (progressions[nextSec.name]?.root || sectionRoot) : sectionRoot;

        // Visual feedback
        Tone.Transport.schedule(() => {
            const mood = sec.name === "bridge" ? "BRIDGE (solo lead!)" : currentDnaMood(params.imageParams);
            console.log(`%c ▶ ${sec.name.toUpperCase()} | ${mood}`, "color: #191970; font-weight: bold;");
        }, sec.startTime);

        // SCHEDULAZIONE
        scheduleRhythm(sec, realNotes, metalInstruments, combinedParams, rand, measureDur, nextSectionRoot, score);
        scheduleLead(sec, realNotes, metalInstruments, combinedParams, rand, measureDur, score); 
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => { 
            if (Tone.context.state !== 'running') Tone.context.resume(); 
            Tone.Transport.start("+0.1"); 
        },
        pause: () => Tone.Transport.pause(),
        stop: () => { 
            Tone.Transport.stop(); 
            Tone.Transport.cancel(); 
            Tone.Transport.seconds = 0; 
        },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { instruments: metalInstruments, volumeMap: metalVolumeMap }
    };
}

function currentDnaMood(p) {
    if (p.energy > 0.7) return "AGGRESSIVE";
    if (p.brightness > 0.7) return "EPIC";
    if (p.complexity > 0.7) return "TECHNICAL";
    return "ATMOSPHERIC";
}