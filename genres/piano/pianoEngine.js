// pianoEngine.js — ver. 006 (Final Evolution)
import * as Tone from "https://esm.sh/tone";
import { piano } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../metal/metalTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("pianoEngine.js ver. 003.1 loaded");

// Mappa di traduzione: dal nome del pattern metal al movimento pianistico
const PIANO_INTERPRETER = {
    "pm_sparse":        { lh: [1, 0, 0, 0, 0, 0, 0, 0], rh: [1, 0, 0, 0, 0, 0, 0, 0], type: "static" },
    "pm_groove":        { lh: [1, 0, 0.7, 0, 1, 0, 0.7, 0], rh: [0, 0, 1, 0, 0, 0, 1, 0], type: "arpeggio" },
    "open_epic":        { lh: [1, 0, 0, 0, 1, 0, 0, 0], rh: [1, 0.6, 0.8, 0.6, 1, 0.6, 0.8, 0.6], type: "arpeggio" },
    "pedal":            { lh: [1, 1, 1, 1, 1, 1, 1, 1], rh: [1, 0, 1, 0, 1, 0, 1, 0], type: "staccato" },
    "open_sustain":     { lh: [1, 0, 0, 0, 0, 0, 0, 0], rh: [1, 0, 0, 0, 0, 0, 0, 0], type: "sustained" },
    "default":          { lh: [1, 0, 0, 0, 1, 0, 0, 0], rh: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5], type: "arpeggio" }
};

export async function waitPianoInstruments() {
    await waitForInstruments(1);
}

// ... (import precedenti)

export async function createPianoEngine(params) {
    const rand = createSeededRandom(params.dna);
    const p = buildPianoParams(rand, params.imageParams);

    // 1. RESET E SETUP BPM
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = p.bpm;

    const sustainValue = (params.imageParams.brightness > 0.7) ? 2.5 : 1.2; 
    piano.set({ release: sustainValue });
    // Aumenta il volume del riverbero se la foto è "vasta" (texture bassa o brightness alta)
piano.volume.value = params.imageParams.brightness > 0.8 ? 0 : -5; 
// Più la foto è complessa, più il pianista è "agitato" (variazioni di volume più ampie)
// Se la foto è semplice, il tocco è costante e meditativo.
const humanTouch = params.imageParams.complexity * 0.2; 

    // -----------------------------------------

    const structure = buildSongStructure(p.structure, p.bpm);
    const scale = buildScaleFromTonic(p.tonalCenter, p.scaleType);

    const measureDur = (60 / p.bpm) * 4;
    const step8n = measureDur / 8; // Divisione in ottavi

    structure.sections.forEach(section => {
        // Scegliamo la progressione (coerente con la foto)
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];

        // Qui potresti importare la tua funzione chooseRiffPattern o simularla
        // Per ora usiamo un fallback basato sulla sezione
        const styleName = section.name === "chorus" ? "open_epic" : "pm_groove";
        const style = PIANO_INTERPRETER[styleName] || PIANO_INTERPRETER.default;

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            sectionProg.forEach((degree, i) => {
                const chordStartTime = measureStartTime + (i * (measureDur / sectionProg.length));
                const chordDuration = (measureDur / sectionProg.length);
                
                // Note dell'accordo
                const rootNote = getScaleDegree(scale, degreeToIndex(degree));
                if (!rootNote) return;

                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ];

                // Dividiamo la durata dell'accordo in step di ottavi
                const stepsInChord = Math.floor(chordDuration / step8n);

                for (let s = 0; s < stepsInChord; s++) {
                    const stepTime = chordStartTime + (s * step8n);
                    const patternIdx = s % 8;

                    // 1. MANO SINISTRA (Bassi)
                    // ... dentro il loop degli step (s) ...

// 1. MANO SINISTRA (Bassi)
if (style.lh[patternIdx] > 0) {
    const bassNote = Tone.Frequency(rootNote).transpose(-12).toNote();
    
    // CALCOLO VELOCITY DINAMICA
    // Partiamo dalla base, aggiungiamo il valore del pattern, 
    // e poi applichiamo una variazione casuale basata sulla complessità
    const dynamicVel = (p.velocityBase * style.lh[patternIdx]) + ((rand() - 0.5) * humanTouch);
    
    const h = (rand() - 0.5) * 0.02; 

    Tone.Transport.schedule((time) => {
        // Usiamo dynamicVel (limitandola tra 0.1 e 1 per sicurezza)
        piano.triggerAttackRelease(bassNote, "2n", time, Math.max(0.1, Math.min(1, dynamicVel * 0.9)));
    }, stepTime + h);
}

// 2. MANO DESTRA (Accordi/Arpeggi)
if (style.rh[patternIdx] > 0) {
    const h = (rand() - 0.5) * 0.03;

    if (style.type === "arpeggio") {
        const note = chordNotes[s % chordNotes.length];
        
        // Applichiamo la velocity dinamica anche qui
        const dynamicVel = (p.velocityBase * style.rh[patternIdx]) + ((rand() - 0.5) * humanTouch);

        Tone.Transport.schedule((time) => {
            piano.triggerAttackRelease(note, "4n", time, Math.max(0.1, Math.min(1, dynamicVel * 0.7)));
        }, stepTime + h);
    } else {
        // Per gli accordi pieni
        chordNotes.forEach((note, idx) => {
            const strum = idx * 0.02;
            // Ogni nota dell'accordo avrà una velocity leggermente diversa
            const dynamicVel = (p.velocityBase * style.rh[patternIdx]) + ((rand() - 0.5) * humanTouch);

            Tone.Transport.schedule((time) => {
                piano.triggerAttackRelease(note, "2n", time + strum, Math.max(0.1, Math.min(1, dynamicVel * 0.5)));
            }, stepTime + h);
        });
    }
                        } else {
                            // Suona l'accordo pieno
                            chordNotes.forEach((note, idx) => {
                                const strum = idx * 0.02; // Leggero arpeggio del tasto
                                Tone.Transport.schedule((time) => {
                                    piano.triggerAttackRelease(note, "2n", time + strum, vel * 0.5);
                                }, stepTime + h);
                            });
                        }
                    }
                }
            });
        }
    });

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
