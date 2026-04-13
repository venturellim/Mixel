// ==========================================
// orchestraEngine.js — ver. 002 (COORDINATED BAROQUE)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js";
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 002 loaded");

export async function waitOrchestraInstruments() {
    await waitForInstruments(5);
}

export async function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const { violin, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

    // Parametri dinamici
    const bpm = 120 + (params.imageParams.energy * 50); 
    const energy = params.imageParams.energy;
    const complexity = params.imageParams.complexity;
    
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    const structure = buildSongStructure(params.structure || "I-V-C-V-C-O", bpm);
    const scale = buildScaleFromTonic(params.tonalCenter || "A", "harmonicMinor");
    const measureDur = (60 / bpm) * 4;
    const step16n = measureDur / 16;

    structure.sections.forEach(section => {
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];
        const isChorus = section.name.toLowerCase().includes("chorus");

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            const currentRoot = sectionProg[m % sectionProg.length];

            for (let s = 0; s < 16; s++) {
                const absoluteTime = measureStartTime + (s * step16n);
                
                // --- MOTORE DI COORDINAZIONE ---
                let vNote = null, cNote = null, hHit = false, tHit = false;
                let vVel = 0.5 + (energy * 0.3);

                // 1. LOGICA VIOLINO (Lead)
                // Se l'energia è altissima, facciamo sedicesimi "Storm" (L'Estate)
                if (energy > 0.8 || (isChorus && s % 1 === 0)) {
                    const pattern = [0, 2, 4, 7, 9, 7, 4, 2]; // Arpeggio esteso
                    vNote = getScaleDegree(scale, degreeToIndex(currentRoot) + pattern[s % 8] + 14);
                } 
                // Altrimenti alterniamo note lunghe e brevi (Staccato)
                else if (s % 2 === 0) {
                    vNote = getScaleDegree(scale, degreeToIndex(currentRoot) + 14);
                }

                // 2. LOGICA BASSO (Cello + DoubleBass)
                // Martellato barocco: ottavi costanti, ma sedicesimi se l'energia sale
                const bassRythm = (energy > 0.7) ? (s % 2 === 0) : (s % 4 === 0);
                if (bassRythm) {
                    cNote = getScaleDegree(scale, degreeToIndex(currentRoot));
                }

                // 3. LOGICA CEMBALO
                // Il cembalo raddoppia sempre il basso per dare attacco "metallico"
                if (bassRythm || (isChorus && s % 4 === 2)) hHit = true;

                // 4. LOGICA TIMPANI
                // Accenti solo sui quarti nelle sezioni spinte
                if (isChorus && s % 4 === 0 && energy > 0.6) tHit = true;
                if (s === 0 && m === 0) tHit = true; // Sempre all'inizio sezione

                // --- SCHEDULAZIONE CON TONE.DRAW PER LO SPARTITO ---
                Tone.Transport.schedule(time => {
                    // Violino
                    if (vNote) {
                        violin.triggerAttackRelease(vNote, "16n", time, vVel);
                        Tone.Draw.schedule(() => { if (score) score.addNote("Lead", vNote, section.name); }, time);
                    }

                    // Basso Unisono
                    if (cNote) {
                        const low = Tone.Frequency(cNote).transpose(-12).toNote();
                        const sub = Tone.Frequency(cNote).transpose(-24).toNote();
                        cello.triggerAttackRelease(low, "8n", time, vVel);
                        doubleBass.triggerAttackRelease(sub, "8n", time, vVel + 0.1);
                        Tone.Draw.schedule(() => { if (score) score.addNote("Bass", low, section.name); }, time);
                    }

                    // Cembalo
                    if (hHit) {
                        harpsichord.triggerAttackRelease(currentRoot + "3", "16n", time, 0.4);
                        Tone.Draw.schedule(() => { if (score) score.addNote("Rhythm", currentRoot, section.name); }, time);
                    }

                    // Timpani
                    if (tHit) {
                        timpani.triggerAttackRelease(currentRoot + "2", "2n", time, 0.9);
                        Tone.Draw.schedule(() => { if (score) score.addNote("Drums", "Kick", section.name); }, time);
                    }
                }, absoluteTime);
            }
        }
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => { 
            if (Tone.context.state !== 'running') Tone.context.resume();
            Tone.Transport.start("+0.1"); 
        },
        stop: () => { 
            Tone.Transport.stop(); 
            Tone.Transport.cancel(); 
            // Rilasciamo tutti i campioni per evitare code sonore
            [violin, cello, doubleBass, harpsichord, timpani].forEach(i => i.releaseAll());
        },
        pause: () => Tone.Transport.pause(),
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { 
            instruments: [
                { id: "violin", name: "Violin Solo" },
                { id: "cello", name: "Cello & Bass" },
                { id: "harpsichord", name: "Harpsichord" },
                { id: "timpani", name: "Timpani" }
            ]
        }
    };
}

function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6 };
    return map[degree.replace('b', '')] || 0;
}
