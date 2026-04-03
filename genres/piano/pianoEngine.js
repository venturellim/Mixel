// pianoEngine.js — ver. 004
import * as Tone from "https://esm.sh/tone";
import { piano } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../metal/metalTheory.js"; 
import { waitForInstruments } from "../../common.js";

export async function waitPianoInstruments() {
    await waitForInstruments(1); // Salamander C5
}

export async function createPianoEngine(params) {
    const rand = createSeededRandom(params.dna);
    
    // Traduciamo i parametri grezzi in parametri specifici per piano
    const p = buildPianoParams(rand, params.imageParams);

    // Configurazione Transport
    Tone.Transport.bpm.value = p.bpm;

    // Costruzione timeline e scala
    const structure = buildSongStructure(p.structure, p.bpm);
    const scale = buildScaleFromTonic(p.tonalCenter, p.scaleType);

    const secondsPerBeat = 60 / p.bpm;
    const measureDur = secondsPerBeat * 4;

    structure.sections.forEach(section => {
        // Scegliamo una progressione dalla teoria (condivisa col metal)
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            sectionProg.forEach((degree, i) => {
                const chordTime = measureStartTime + (i * (measureDur / sectionProg.length));
                const duration = (measureDur / sectionProg.length) * 0.9;
                
                // 1. MANO SINISTRA: Nota singola (Basso)
                const rootNote = getScaleDegree(scale, degreeToIndex(degree));
                const bassNote = Tone.Frequency(rootNote).transpose(-12); // Un'ottava sotto

                // 2. MANO DESTRA: Accordo (Fondamentale, Terza, Quinta)
                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ];

                Tone.Transport.schedule((time) => {
                    // Esegui LH (Mano Sinistra)
                    piano.triggerAttackRelease(bassNote, duration, time, p.velocityBase * 1.1);

                    // Esegui RH (Mano Destra)
                    chordNotes.forEach((note, index) => {
                        // Se p.useArpeggio è vero, ritarda le note (effetto arpeggio)
                        // Il ritardo dipende dalla texture della foto
                        const delay = p.useArpeggio ? index * (0.05 + p.texture * 0.1) : index * 0.02;
                        
                        piano.triggerAttackRelease(note, duration, time + delay, p.velocityBase * 0.8);
                    });
                }, chordTime);
            });
        }
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => {
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
