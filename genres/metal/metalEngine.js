// metalEngine.js — ver. 015 (con Bridge support)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { metalInstruments, metalVolumeMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { scheduleLead } from "./metalLeadEngine.js"; 
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 016.3 loaded");


export async function waitMetalInstruments() {
    const totalInstruments = 5; // guitarPalm, guitarOpen, guitarLead, bass, drums
    await waitForInstruments(totalInstruments, "Metal");
}

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
    { name: "chorus1",   weight: 8 },
    { name: "verse",     weight: 4 },
    { name: "chorus1",   weight: 4 },
    { name: "soloPt1",   weight: params.imageParams.complexity > 0.6 ? 8 : 0 },
    { name: "soloPt2",   weight: params.imageParams.complexity > 0.6 ? 8 : 0 },
    { name: "bridge1",   weight: hasBridge ? preChorusWeight : 0 },
    { name: "soloPt3",   weight: params.imageParams.energy > 0.5 ? 8 : 0 },
    { name: "soloPt4",   weight: params.imageParams.energy > 0.5 ? 8 : 0 },
    { name: "bridge2",   weight: hasBridge ? preChorusWeight : 0 },
    { name: "chorus2",   weight: 8 },
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
    const bridgeSection  = structure.sections.find(s => s.name === "bridge"  || s.name === "bridge1" || s.name === "bridge2");
const chorusSection = structure.sections.find(
    s => ["chorus", "chorus1", "chorus2"].includes(s.name)
);
const soloPt1Section = structure.sections.find(s => s.name === "soloPt1");
const soloPt2Section = structure.sections.find(s => s.name === "soloPt2");
const soloPt3Section = structure.sections.find(s => s.name === "soloPt3");
const soloPt4Section = structure.sections.find(s => s.name === "soloPt4");

    
    // 1. Rimuovi le dichiarazioni duplicate di soloPt3Section/soloPt4Section
// 2. Correggi il blocco bridge:
if (bridgeSection && preChorusSection) {
    const preChorusProg = progressions["prechorus"];
    if (preChorusProg) {
        ["bridge1", "bridge2"].forEach(bridgeName => {
            progressions[bridgeName] = {
                root: preChorusProg.root,
                progression: preChorusProg.progression
            };
        });
        console.log("🌉 BRIDGE1/BRIDGE2: usano progressione del PRECHORUS →", preChorusProg.progression);
    } else {
        // Fallback
        ["bridge1", "bridge2"].forEach(bridgeName => {
            progressions[bridgeName] = {
                root: metalParams.tonalCenter[0] || "A",
                progression: ["i", "iv", "v", "i", "i", "iv", "v", "i"]
            };
        });
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
// FORZA PROGRESSIONE PER SOLO PT3/PT4 (usa la stessa del CHORUS)
if ((soloPt3Section || soloPt4Section) && chorusSection) {
    const chorusProg = progressions["chorus"];
    if (chorusProg) {
        if (soloPt3Section) {
            progressions["soloPt3"] = {
                root: chorusProg.root,
                progression: chorusProg.progression
            };
        }
        if (soloPt4Section) {
            progressions["soloPt4"] = {
                root: chorusProg.root,
                progression: chorusProg.progression
            };
        }
        console.log("🎸 SOLO Pt3/Pt4: usa progressione del CHORUS →", chorusProg.progression);
    } else {
        const fallbackProg = ["i", "iv", "v", "vi", "i", "iv", "v", "i"];
        if (soloPt3Section) {
            progressions["soloPt3"] = {
                root: metalParams.tonalCenter[0] || "A",
                progression: fallbackProg
            };
        }
        if (soloPt4Section) {
            progressions["soloPt4"] = {
                root: metalParams.tonalCenter[0] || "A",
                progression: fallbackProg
            };
        }
    }
}


    const measureDur = (60 / metalParams.bpm) * 4;

    const combinedParams = {
        ...metalParams,
        imageParams: params.imageParams 
    };

    structure.sections.forEach((sec, index) => {
        const info =
    progressions[sec.name] ||
    (sec.name === "chorus1" ? progressions["chorus"] : null) ||
    (sec.name === "chorus2" ? progressions["chorus"] : null);
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