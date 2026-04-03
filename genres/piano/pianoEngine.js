// pianoEngine.js
import * as Tone from "https://esm.sh/tone";
import { piano } from "./pianoInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../metal/metalTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("pianoEngine.js ver. 001 loaded");


export async function waitPianoInstruments() {
    await waitForInstruments(1);
}

export async function createPianoEngine(params) {
    // 1. Controllo di sicurezza sui parametri
    console.log("Parametri ricevuti:", params) 

    if (!params || !params.rhythm || !params.rhythm.tempoProfile) {
        console.warn("Parametri ritmici mancanti, uso default 120bpm");
    }

    const rand = createSeededRandom(params.dna || 12345);
    const bpm = params.rhythm?.tempoProfile || 120; // Fallback a 120
    
    // Tone.js vuole un numero finito
    Tone.Transport.bpm.value = bpm;

    const structure = buildSongStructure(params.structure, bpm);
    const scale = buildScaleFromTonic(params.harmony.tonalCenter + "4", params.harmony.scaleProfile);

    structure.sections.forEach(section => {
        const sectionProg = progressions[section.name] ? 
            progressions[section.name][Math.floor(rand() * progressions[section.name].length)] :
            ["i", "VI", "III", "VII"];

        const measureDur = (60 / bpm) * 4;
        
        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            sectionProg.forEach((degree, i) => {
                const chordTime = measureStartTime + (i * (measureDur / sectionProg.length));
                // Durata dell'accordo: lo facciamo durare quasi fino al prossimo per non interromperlo bruscamente
                const duration = (measureDur / sectionProg.length) * 0.9;
                
                const rootNote = getScaleDegree(scale, degreeToIndex(degree));
                
                // Costruiamo l'accordo della mano destra
                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ];

                const velocity = 0.3 + (params.global.intensity * 0.5);

                Tone.Transport.schedule((time) => {
                    // --- MANO SINISTRA (Bassi) ---
                    const bassNote = Tone.Frequency(rootNote).transpose(-12); 
                    // Usiamo 'duration' per rilasciare il tasto correttamente
                    piano.triggerAttackRelease(bassNote, duration, time, velocity * 0.8);

                    // --- MANO DESTRA (Accordi) ---
                    chordNotes.forEach((note, index) => {
                        // "Humanize": se la foto è complessa, aumentiamo leggermente l'arpeggio (strum)
                        const strum = index * (0.02 + (params.global.complexity * 0.05)); 
                        piano.triggerAttackRelease(note, duration, time + strum, velocity * 0.6);
                    });

                }, chordTime);
            });
        }
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => {
            // Piccolo trucco: rilasciamo tutte le note prima di partire
            piano.releaseAll();
            Tone.Transport.start("+0.1");
        },
        pause: () => Tone.Transport.pause(),
        stop: () => {
            Tone.Transport.stop();
            Tone.Transport.cancel();
            piano.releaseAll(); // Fondamentale per non lasciare note appese
        }
    };
}

function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6, "bVII":6 };
    return map[degree] || 0;
}
