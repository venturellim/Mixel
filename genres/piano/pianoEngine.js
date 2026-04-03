// pianoEngine.js — ver. 010 (Full Dynamics & BPM Fix)
import * as Tone from "https://esm.sh/tone";
import { piano } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../metal/metalTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("pianoEngine.js ver. 010 loaded");

const PIANO_INTERPRETER = {
    "pm_sparse":        { lh: [1, 0, 0, 0, 1, 0, 0, 0], rh: [1, 0, 1, 0, 1, 0, 1, 0], type: "static" },
    "pm_groove":        { lh: [1, 0, 0.8, 0, 1, 0, 0.8, 0], rh: [1, 1, 1, 1, 1, 1, 1, 1], type: "arpeggio" },
    "open_epic":        { lh: [1, 1, 1, 1, 1, 1, 1, 1], rh: [1, 1, 1, 1, 1, 1, 1, 1], type: "arpeggio" },
    "pedal":            { lh: [1, 1, 1, 1, 1, 1, 1, 1], rh: [1, 0, 1, 0, 1, 0, 1, 0], type: "staccato" },
    "default":          { lh: [1, 0, 0.8, 0, 1, 0, 0.8, 0], rh: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5], type: "arpeggio" }
};

export async function waitPianoInstruments() {
    await waitForInstruments(1);
}

export async function createPianoEngine(params) {
    const rand = createSeededRandom(params.dna);
    // IMPORTANTE: Passiamo i parametri dell'immagine per il calcolo del BPM
    const p = buildPianoParams(rand, params.imageParams);

    console.log(`🎵 Generazione brano: BPM ${p.bpm}, Tonalità ${p.tonalCenter} ${p.scaleType}`);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = p.bpm;

    const sustainValue = (params.imageParams.brightness > 0.7) ? 2.8 : 1.5; 
    piano.set({ release: sustainValue });
    piano.volume.value = params.imageParams.brightness > 0.8 ? 0 : -4; 
    const humanTouch = params.imageParams.complexity * 0.25; 

    const structure = buildSongStructure(p.structure, p.bpm);
    const scale = buildScaleFromTonic(p.tonalCenter, p.scaleType);
    const measureDur = (60 / p.bpm) * 4;
    const step8n = measureDur / 8;

    structure.sections.forEach(section => {
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];
        const halfMeasures = Math.ceil(section.measures / 2);

        for (let m = 0; m < section.measures; m++) {
            const isSecondHalf = m >= halfMeasures;
            const measureStartTime = section.startTime + (m * measureDur);

            // Selezione Stile
            let styleName = "pm_groove";
            if (section.name === "intro") styleName = isSecondHalf ? "pm_groove" : "pm_sparse";
            if (section.name === "chorus") styleName = "open_epic";
            const style = PIANO_INTERPRETER[styleName] || PIANO_INTERPRETER.default;

            let octaveOffset = (section.name === "chorus" || (section.name === "intro" && isSecondHalf)) ? 12 : 0;

            sectionProg.forEach((degree, i) => {
                const chordStartTime = measureStartTime + (i * (measureDur / sectionProg.length));
                const chordDuration = (measureDur / sectionProg.length);
                const stepsInChord = Math.floor(chordDuration / step8n);
                
                const rootNote = getScaleDegree(scale, degreeToIndex(degree));
                if (!rootNote) return;

                // Accordi DX trasposti
                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ].map(n => Tone.Frequency(n).transpose(octaveOffset).toNote());

                for (let s = 0; s < stepsInChord; s++) {
                    const stepTime = chordStartTime + (s * step8n);
                    const patternIdx = s % 8;
                    const h = (rand() - 0.5) * 0.03;

                    // --- MANO SINISTRA EVOLUTA (Accordi e quinte) ---
                    if (style.lh[patternIdx] > 0) {
                        const dynamicVel = (p.velocityBase * style.lh[patternIdx]) + ((rand() - 0.5) * humanTouch);
                        
                        // Alternanza Tonica/Quinta per non essere ripetitivi
                        const isAlternate = s % 4 === 2; // Colpo sulla quinta al terzo movimento
                        const noteLH = isAlternate ? 
                            Tone.Frequency(rootNote).transpose(-5).toNote() : 
                            Tone.Frequency(rootNote).transpose(-12).toNote();

                        Tone.Transport.schedule((time) => {
                            piano.triggerAttackRelease(noteLH, "2n", time, Math.max(0.1, dynamicVel * 0.9));
                            // Se siamo nel chorus, aggiungiamo una quinta sopra al basso (Power Chord)
                            if (section.name === "chorus") {
                                const fifth = Tone.Frequency(noteLH).transpose(7).toNote();
                                piano.triggerAttackRelease(fifth, "2n", time, dynamicVel * 0.6);
                            }
                        }, stepTime + h);
                    }

                    // --- MANO DESTRA (Sempre attiva tranne Intro A) ---
                    let canPlayRH = true;
                    if (section.name === "intro" && !isSecondHalf) canPlayRH = rand() > 0.8;

                    if (canPlayRH) {
                        const isPatternActive = style.rh[patternIdx] > 0;
                        // Probabilità di riempimento alta ovunque
                        const shouldFill = rand() > 0.4; 

                        if (isPatternActive || shouldFill) {
                            const fillModifier = isPatternActive ? 1 : 0.4;
                            const dynamicVelBase = ((p.velocityBase * (style.rh[patternIdx] || 0.6)) + ((rand() - 0.5) * humanTouch)) * fillModifier;

                            // Se è arpeggio o fill, suona note singole, se è Chorus/Pattern attivo suona accordi
                            if (style.type === "arpeggio" || !isPatternActive) {
                                const note = chordNotes[Math.floor(rand() * chordNotes.length)];
                                Tone.Transport.schedule((time) => {
                                    piano.triggerAttackRelease(note, "4n", time, Math.max(0.05, dynamicVelBase * 0.7));
                                }, stepTime + h);
                            } else {
                                chordNotes.forEach((note, idx) => {
                                    Tone.Transport.schedule((time) => {
                                        piano.triggerAttackRelease(note, "2n", time + idx * 0.02, Math.max(0.1, dynamicVelBase * 0.5));
                                    }, stepTime + h);
                                });
                            }
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
