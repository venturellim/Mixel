// pianoEngine.js
import * as Tone from "https://esm.sh/tone";
import { piano } from "./pianoInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../metal/metalTheory.js"; // Riutilizziamo i tuoi ottimi gradi!

export async function createPianoEngine(params) {
    const rand = createSeededRandom(params.dna);
    const bpm = params.rhythm.tempoProfile;
    Tone.Transport.bpm.value = bpm;

    // 1. Generiamo la struttura del brano (BPM-correct)
    const structure = buildSongStructure(params.structure, bpm);
    
    // 2. Costruiamo la scala (es: E4 Natural Minor)
    // Usiamo le tue utility per garantire coerenza con la foto
    const scale = buildScaleFromTonic(params.harmony.tonalCenter + "4", params.harmony.scaleProfile);

    // 3. Scheduliamo la musica sulla timeline (Approccio deterministico)
    structure.sections.forEach(section => {
        const sectionProg = progressions[section.name] ? 
            progressions[section.name][Math.floor(rand() * progressions[section.name].length)] :
            ["i", "VI", "III", "VII"];

        const measureDur = (60 / bpm) * 4;
        
        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            sectionProg.forEach((degree, i) => {
                const chordTime = measureStartTime + (i * (measureDur / sectionProg.length));
                
                // Trasformiamo il grado in nota (es: "i" -> Indice 0 della scala)
                // Usiamo la logica dei gradi che hai già definito
                const rootNote = getScaleDegree(scale, degreeToIndex(degree));
                
                // LOGICA DI ESPRESSIONE (L'anima del JPG)
                // Velocity basata su Energy, Ottava basata su Brightness
                const velocity = 0.3 + (params.global.intensity * 0.5);
                const brightnessOctave = Math.floor(params.imageParams.brightness * 2) - 1; // -1, 0, o +1 ottava

                // Scheduliamo l'evento
                Tone.Transport.schedule((time) => {
                    // Accompagnamento mano sinistra (Bassi)
                    piano.triggerAttackRelease(Tone.Frequency(rootNote).transpose(-12 + (brightnessOctave * 12)), "2n", time, velocity * 0.8);
                    
                    // Melodia deterministica basata sui bit (DNA)
                    const melOffset = Math.floor(rand() * 4);
                    const melNote = getScaleDegree(scale, degreeToIndex(degree) + melOffset);
                    piano.triggerAttackRelease(melNote, "4n", time + Tone.Time("8n").toSeconds(), velocity);
                    
                }, chordTime);
            });
        }
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => Tone.Transport.start("+0.1"),
        pause: () => Tone.Transport.pause(),
        stop: () => {
            Tone.Transport.stop();
            Tone.Transport.cancel(); // Pulisce la timeline
        }
    };
}

// Utility veloce per convertire i tuoi gradi in indici (0-6)
function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6, "bVII":6 };
    return map[degree] || 0;
}
