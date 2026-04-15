// ==========================================
// orchestraEngine.js — ver. 008 (FIXED STRUCTURE)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 008 loaded");

export async function waitOrchestraInstruments() {
    await waitForInstruments(5);
}

export async function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const { violin, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

    const energy = params.imageParams?.energy ?? 0.5;
    const bpm = 100 + (energy * 60);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    // --- FIX DEFINITIVO PER LA STRUTTURA ---
    // Assicuriamoci che structurePreset sia SEMPRE un array valido
    const defaultStructure = [
        { name: "intro", measures: 4 },
        { name: "verse", measures: 8 },
        { name: "chorus", measures: 8 },
        { name: "outro", measures: 4 }
    ];

    const structurePreset = (params && Array.isArray(params.structure)) 
        ? params.structure 
        : defaultStructure;

    const structure = buildSongStructure(structurePreset, bpm);
    // ---------------------------------------

    const scale = buildScaleFromTonic(params.tonalCenter || "A", "harmonicMinor");
    const measureDur = (60 / bpm) * 4;
    const step8n = measureDur / 8;

    structure.sections.forEach(section => {
        const sectionName = section.name.toLowerCase();
        const possibleProgs = progressions[sectionName] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            for (let s = 0; s < 8; s++) {
                const stepTime = measureStartTime + (s * step8n);
                const currentDegree = sectionProg[s % sectionProg.length];
                const rootIdx = degreeToIndex(currentDegree);

                Tone.Transport.schedule((time) => {
                    // Logica semplificata stile Piano Engine
                    if (s === 0) {
                        const dbNote = getScaleDegree(scale, rootIdx);
                        doubleBass.triggerAttackRelease(Tone.Frequency(dbNote).transpose(-24).toNote(), "2n", time, 0.8);
                    }

                    if (s % 2 === 0) {
                        const cNote = getScaleDegree(scale, rootIdx);
                        cello.triggerAttackRelease(Tone.Frequency(cNote).transpose(-12).toNote(), "4n", time, 0.7);
                    }

                    if (rand() > 0.4) {
                        const vNote = getScaleDegree(scale, rootIdx + 14);
                        violin.triggerAttackRelease(vNote, "8n", time, 0.6);
                        
                        Tone.Draw.schedule(() => {
                            if (score) score.addNote("Lead", vNote, section.name);
                        }, time);
                    }
                    
                    // Timpani (Chiamata corretta per Players)
                    if (s === 0 && sectionName === "chorus") {
                        const tName = `timpano${Math.floor(rand() * 5) + 1}`;
                        if (timpani.has(tName)) timpani.player(tName).start(time);
                    }
                }, stepTime);
            }
        }
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
            [violin, cello, doubleBass, harpsichord].forEach(i => i.releaseAll?.());
            if (timpani) timpani.stopAll();
        },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { instruments: orchestraInstruments, volumeMap: orchestraVolumeMap }
    };
}

function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6 };
    return map[degree.replace('b', '')] || 0;
}
