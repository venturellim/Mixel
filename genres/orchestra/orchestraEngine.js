// ==========================================
// orchestraEngine.js — ver. 006 (FULL)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js";
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 006 loaded");

/**
 * Attende il caricamento dei sample definiti in orchestraInstruments
 */
export async function waitOrchestraInstruments() {
    // Attendiamo i 5 bus/strumenti principali
    await waitForInstruments(5);
}

/**
 * Engine principale dell'Orchestra Barocca
 */
export async function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const { violin, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

    // 1. Parametri estratti dall'immagine
    const energy = params.imageParams?.energy ?? 0.5;
    const complexity = params.imageParams?.complexity ?? 0.5;
    const bpm = 110 + (energy * 60); 

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    // 2. Definizione Struttura
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

    // 3. Loop Generazione Musicale
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
                
                let vNote = null, cNote = null, dbNote = null, hHit = false, tHit = false;
                let vVel = 0.4 + (energy * 0.4);

                // --- LOGICA VIOLINO (Lead) ---
                if (energy > 0.75 || (isChorus && s % 1 === 0)) {
                    // Arpeggi stile Vivaldi
                    const pattern = [0, 2, 4, 7, 9, 7, 4, 2]; 
                    vNote = getScaleDegree(scale, degreeToIndex(currentRoot) + pattern[s % 8] + 14);
                } else if (s % 4 === 0 || (complexity > 0.4 && s % 2 === 0)) {
                    // Melodia più semplice
                    vNote = getScaleDegree(scale, degreeToIndex(currentRoot) + 14);
                }

                // --- LOGICA BASSO (Cello + DBass) ---
                const bassRythm = (energy > 0.7) ? (s % 2 === 0) : (s % 4 === 0);
                if (bassRythm) {
                    cNote = getScaleDegree(scale, degreeToIndex(currentRoot));
                    dbNote = currentRoot; 
                }

                // --- LOGICA CEMBALO (Rhythm) ---
                if (bassRythm || (isChorus && s % 2 !== 0)) hHit = true;

                // --- LOGICA TIMPANI (Percussion) ---
                if (s === 0 && (m === 0 || isChorus)) tHit = true; 
                if (isChorus && s % 8 === 0 && energy > 0.6) tHit = true;

                // --- SCHEDULAZIONE EVENTI ---
                Tone.Transport.schedule(time => {
                    // Violino Solo
                    if (vNote) {
                        violin.triggerAttackRelease(vNote, "16n", time, vVel);
                        Tone.Draw.schedule(() => { if (score) score.addNote("Lead", vNote, section.name); }, time);
                    }

                    // Violoncello
                    if (cNote) {
                        const low = Tone.Frequency(cNote).transpose(-12).toNote();
                        cello.triggerAttackRelease(low, "8n", time, vVel);
                        Tone.Draw.schedule(() => { if (score) score.addNote("Bass", low, section.name); }, time);
                    }

                    // Contrabbasso (Ottava profonda)
                    if (dbNote) {
                        const sub = Tone.Frequency(dbNote + "1").toNote();
                        doubleBass.triggerAttackRelease(sub, "4n", time, vVel + 0.1);
                    }

                    // Clavicembalo
                    if (hHit) {
                        harpsichord.triggerAttackRelease(currentRoot + "3", "16n", time, 0.3);
                        Tone.Draw.schedule(() => { if (score) score.addNote("Rhythm", currentRoot, section.name); }, time);
                    }

                    // Timpani (Uso dei Players)
                    if (tHit && timpani) {
                        const tName = `timpano${Math.floor(rand() * 5) + 1}`;
                        if (timpani.has(tName)) {
                            timpani.player(tName).start(time).stop(time + 2);
                        }
                        Tone.Draw.schedule(() => { if (score) score.addNote("Drums", "Kick", section.name); }, time);
                    }
                }, absoluteTime);
            }
        }
    });

    // 4. Interfaccia di controllo per main.js
    return {
        totalDuration: structure.totalDuration,
        
        play: () => { 
            if (Tone.context.state !== 'running') Tone.context.resume();
            Tone.Transport.start("+0.1"); 
        },

        stop: () => { 
            Tone.Transport.stop(); 
            Tone.Transport.cancel(); 
            // Rilascio di tutti i sampler per evitare note appese
            [violin, cello, doubleBass, harpsichord].forEach(instr => {
                if (instr && instr.releaseAll) instr.releaseAll();
            });
            if (timpani) timpani.stopAll();
        },

        pause: () => Tone.Transport.pause(),
        
        seek: (seconds) => {
            Tone.Transport.seconds = seconds;
        },

        // Dati cruciali per initFxPanel(mixerData) in main.js
        mixerData: { 
            instruments: orchestraInstruments, // Passiamo l'oggetto con la funzione setVolume
            volumeMap: orchestraVolumeMap      // Passiamo le etichette per gli slider
        }
    };
}

/**
 * Converte il grado armonico in indice per la scala
 */
function degreeToIndex(degree) {
    const map = { 
        "i":0, "I":0, 
        "ii":1, "ii°":1,
        "iii":2, "III":2, 
        "iv":3, "IV":3, 
        "v":4, "V":4, 
        "vi":5, "VI":5, 
        "vii":6, "VII":6 
    };
    return map[degree.replace('b', '')] || 0;
}
