// ==========================================
// pianoEngine.js — ver. 011 (EMOTIONAL UPDATE)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { piano } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../metal/metalTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("🎹 pianoEngine v011: Rubato & Emotional Logic Active");

const PIANO_INTERPRETER = {
    "pm_sparse":    { lh: [1, 0, 0, 0, 0, 0, 0, 0], rh: [1, 0, 0, 0, 0, 0, 0, 0], type: "static" },
    "pm_groove":    { lh: [1, 0, 0.7, 0, 1, 0, 0.7, 0], rh: [0, 0, 1, 0, 0, 0, 1, 0], type: "arpeggio" },
    "open_epic":    { lh: [1, 0, 0, 0, 1, 0, 0, 0], rh: [1, 0.6, 0.8, 0.6, 1, 0.6, 0.8, 0.6], type: "arpeggio" },
    "pedal":        { lh: [1, 1, 1, 1, 1, 1, 1, 1], rh: [1, 0, 1, 0, 1, 0, 1, 0], type: "staccato" },
    "default":      { lh: [1, 0, 0.8, 0, 1, 0, 0.8, 0], rh: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5], type: "arpeggio" }
};

export async function waitPianoInstruments() {
    await waitForInstruments(1);
}

export async function createPianoEngine(params) {
    const rand = createSeededRandom(params.dna);
    const p = buildPianoParams(rand, params.imageParams);

    // 1. SETUP INIZIALE
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = p.bpm;

    // Parametri espressivi basati sulla foto
    const sustainValue = (params.imageParams.brightness > 0.7) ? 3.0 : 1.8; 
    piano.set({ release: sustainValue });
    piano.volume.value = params.imageParams.brightness > 0.8 ? 0 : -4; 
    
    const humanTouch = params.imageParams.complexity * 0.3; 
    const rubatoAmount = params.imageParams.energy * 0.15; // Oscillazione del tempo

    const structure = buildSongStructure(p.structure, p.bpm);
    const scale = buildScaleFromTonic(p.tonalCenter, p.scaleType);
    const measureDur = (60 / p.bpm) * 4;
    const step8n = measureDur / 8;

    // ------------------------------------------------------------
    // INIZIO CICLO SEZIONI (Verse, Chorus, etc.)
    // ------------------------------------------------------------
    structure.sections.forEach(section => {
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];
        const halfMeasures = Math.ceil(section.measures / 2);

        for (let m = 0; m < section.measures; m++) {
            const isSecondHalf = m >= halfMeasures;
            
            // --- EFFETTO RUBATO ---
            // Spostiamo l'inizio della misura di qualche millisecondo casuale
            const measureRubato = (rand() - 0.5) * rubatoAmount;
            const measureStartTime = section.startTime + (m * measureDur) + measureRubato;

            // Selezione Stile
            let styleName = section.name === "chorus" ? "open_epic" : "pm_groove";
            if (section.name === "intro") styleName = isSecondHalf ? "pm_groove" : "pm_sparse";
            const style = PIANO_INTERPRETER[styleName] || PIANO_INTERPRETER.default;

            let octaveOffset = (section.name === "chorus" || (section.name === "intro" && isSecondHalf)) ? 12 : 0;

            // --------------------------------------------------------
            // CICLO PROGRESSIONE ACCORDI
            // --------------------------------------------------------
            sectionProg.forEach((degree, i) => {
                const chordStartTime = measureStartTime + (i * (measureDur / sectionProg.length));
                const chordDuration = (measureDur / sectionProg.length);
                const stepsInChord = Math.floor(chordDuration / step8n);
                
                const rootNote = getScaleDegree(scale, degreeToIndex(degree));
                if (!rootNote) return;

                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ].map(n => Tone.Frequency(n).transpose(octaveOffset).toNote());

                // ----------------------------------------------------
                // CICLO STEP (OTTAVI)
                // ----------------------------------------------------
                for (let s = 0; s < stepsInChord; s++) {
                    const stepTime = chordStartTime + (s * step8n);
                    const patternIdx = s % 8;

                    // --- LOGICA DELLE PAUSE ---
                    // Più probabile saltare note nell'intro/outro per far respirare il brano
                    const skipChance = (section.name === "intro" || section.name === "outro") ? 0.6 : 0.3;
                    if (s > 0 && rand() < skipChance) continue; 

                    // --- MANO SINISTRA ---
                    if (style.lh[patternIdx] > 0) {
                        const dynamicVel = (p.velocityBase * style.lh[patternIdx]) + ((rand() - 0.5) * humanTouch);
                        
                        // Alternanza Tonica / Quinta (Do... Sol...)
                        const noteLH = (s % 4 === 2 && rand() > 0.5) ? 
                            Tone.Frequency(rootNote).transpose(-5).toNote() : 
                            Tone.Frequency(rootNote).transpose(-12).toNote();

                        Tone.Transport.schedule((time) => {
                            piano.triggerAttackRelease(noteLH, "2n", time, Math.max(0.1, dynamicVel * 0.8));
                            // Power chord nel chorus
                            if (section.name === "chorus") {
                                piano.triggerAttackRelease(Tone.Frequency(noteLH).transpose(7).toNote(), "2n", time, dynamicVel * 0.5);
                            }
                        }, stepTime);
                    }

                    // --- MANO DESTRA ---
                    let canPlayRH = true;
                    if (section.name === "intro" && !isSecondHalf) canPlayRH = rand() > 0.85;

                    if (canPlayRH) {
                        const isPatternActive = style.rh[patternIdx] > 0;
                        if (isPatternActive || rand() > 0.5) {
                            
                            // "Emotional Lag": la destra suona leggermente dopo il basso
                            const emotionalLag = rand() * 0.05; 
                            const h = ((rand() - 0.5) * 0.02) + emotionalLag;

                            const fillModifier = isPatternActive ? 1 : 0.4;
                            const dynamicVelBase = ((p.velocityBase * (style.rh[patternIdx] || 0.6)) + ((rand() - 0.5) * humanTouch)) * fillModifier;

                            const note = chordNotes[Math.floor(rand() * chordNotes.length)];
                            
                            Tone.Transport.schedule((time) => {
                                // Nota lunga "1n" per sfruttare il riverbero
                                piano.triggerAttackRelease(note, "1n", time, Math.max(0.05, dynamicVelBase * 0.6));
                            }, stepTime + h);
                        }
                    }
                } // fine ciclo step
            }); // fine ciclo progressione
        } // fine ciclo misure
    }); // fine ciclo sezioni

    return {
        totalDuration: structure.totalDuration,
        play: () => {
            if (Tone.context.state !== 'running') Tone.context.resume();
            piano.releaseAll();
            Tone.Transport.start("+0.1");
        },
        pause: () => Tone.Transport.pause(),
        stop: () => {
            Tone.Transport.stop();
            Tone.Transport.cancel();
            piano.releaseAll();
        }
    };
}

function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6, "bVII":6 };
    return map[degree] || 0;
}
