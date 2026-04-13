// ==========================================
// orchestraEngine.js — ver. 004 (FULL COHESION)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js";
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 004.1 loaded");

export async function waitOrchestraInstruments() {
    await waitForInstruments(5);
}

export async function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const { violin, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

    // 1. Parametri e Setup Tempo
    const energy = params.imageParams?.energy ?? 0.5;
    const complexity = params.imageParams?.complexity ?? 0.5;
    const bpm = 110 + (energy * 60); // Range 110 - 170 BPM

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    // 2. Costruzione Struttura (Fix per evitare TypeError)
    const defaultStructure = [
        { name: "Intro", measures: 4 },
        { name: "Verse", measures: 8 },
        { name: "Chorus", measures: 8 },
        { name: "Verse", measures: 8 },
        { name: "Chorus", measures: 8 },
        { name: "Outro", measures: 4 }
    ];

    const structureToBuild = (params.structure && Array.isArray(params.structure)) 
        ? params.structure 
        : defaultStructure;

    const structure = buildSongStructure(structureToBuild, bpm);
    const scale = buildScaleFromTonic(params.tonalCenter || "A", "harmonicMinor");
    const measureDur = (60 / bpm) * 4;
    const step16n = measureDur / 16;

    // 3. Generazione Musicale
    structure.sections.forEach(section => {
        const sectionKey = section.name.toLowerCase();
        const possibleProgs = progressions[sectionKey] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];
        const isChorus = sectionKey.includes("chorus");

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            const currentRoot = sectionProg[m % sectionProg.length];

            for (let s = 0; s < 16; s++) {
                const absoluteTime = measureStartTime + (s * step16n);
                
                // Variabili di decisione per lo step corrente
                let vNote = null, cNote = null, hHit = false, tHit = false;
                let vVel = 0.4 + (energy * 0.4);

                // --- LOGICA VIOLINO (Lead) ---
                // Se energia alta o Chorus, sedicesimi con arpeggio rotante (Stile Vivaldi)
                if (energy > 0.75 || (isChorus && s % 1 === 0)) {
                    const pattern = [0, 2, 4, 7, 9, 7, 4, 2]; 
                    const degree = pattern[s % pattern.length];
                    vNote = getScaleDegree(scale, degreeToIndex(currentRoot) + degree + 14);
                } 
                // Altrimenti, fraseggio più arioso (Stile Canon)
                else if (s % 4 === 0 || (complexity > 0.4 && s % 2 === 0)) {
                    vNote = getScaleDegree(scale, degreeToIndex(currentRoot) + 14);
                }

                // --- LOGICA BASSO (Cello + DBass) ---
                // Ottavi martellati o sedicesimi serrati
                const bassRythm = (energy > 0.7) ? (s % 2 === 0) : (s % 4 === 0);
                if (bassRythm) {
                    cNote = getScaleDegree(scale, degreeToIndex(currentRoot));
                }

                // --- LOGICA CEMBALO ---
                // Il rintocco costante del tempo
                if (bassRythm || (isChorus && s % 2 !== 0)) hHit = true;

                // --- LOGICA TIMPANI ---
                // Enfasi sui cambi e sui quarti del Chorus
                if (s === 0 && m === 0) tHit = true; 
                if (isChorus && s % 8 === 0 && energy > 0.6) tHit = true;

                // --- SCHEDULAZIONE FINALE ---
                Tone.Transport.schedule(time => {
                    // Violino Solo
                    if (vNote) {
                        violin.triggerAttackRelease(vNote, "16n", time, vVel);
                        Tone.Draw.schedule(() => { if (score) score.addNote("Lead", vNote, section.name); }, time);
                    }

                    // Sezione Bassa (Unisono Cello + Contrabbasso)
                    if (cNote) {
                        const low = Tone.Frequency(cNote).transpose(-12).toNote();
                        const sub = Tone.Frequency(cNote).transpose(-24).toNote();
                        cello.triggerAttackRelease(low, "8n", time, vVel);
                        doubleBass.triggerAttackRelease(sub, "8n", time, vVel + 0.1);
                        Tone.Draw.schedule(() => { if (score) score.addNote("Bass", low, section.name); }, time);
                    }

                    // Cembalo (Harpsichord)
                    if (hHit) {
                        harpsichord.triggerAttackRelease(currentRoot + "3", "16n", time, 0.35);
                        Tone.Draw.schedule(() => { if (score) score.addNote("Rhythm", currentRoot, section.name); }, time);
                    }

                    // Timpani
                    if (tHit) {
                        timpani.triggerAttackRelease(currentRoot + "2", "2n", time, 0.85);
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
            // Pulizia code sonore degli archi
            [violin, cello, doubleBass, harpsichord, timpani].forEach(instr => {
                if (instr && instr.releaseAll) instr.releaseAll();
            });
        },
        pause: () => Tone.Transport.pause(),
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { 
            instruments: [
                { id: "violin", name: "Violin Solo" },
                { id: "cello", name: "Strings Section" },
                { id: "harpsichord", name: "Harpsichord" },
                { id: "timpani", name: "Orchestral Perc." }
            ]
        }
    };
}

function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6 };
    return map[degree.replace('b', '')] || 0;
}
