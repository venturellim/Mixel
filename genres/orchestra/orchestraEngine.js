import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { generateSongProgressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 015 loaded");

function safeNote(note, defaultOctave = "4") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

function generateOrchestraMotto(rand, complexity) {
    const size = complexity > 0.6 ? 8 : 4;
    const motto = [];
    for (let i = 0; i < size; i++) {
        motto.push(Math.floor(rand() * 12) - 6); 
    }
    return motto;
}

export async function waitOrchestraInstruments() {
    await waitForInstruments(6);
}

export async function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const { violin, viola, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

    const img = params.imageParams || {};
    const energy = img.energy ?? 0.5;
    const complexity = img.complexity ?? 0.5;

    const bpm = 80 + (energy * 60);
    const motto = generateOrchestraMotto(rand, complexity);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    // --- 1. 🧬 STRUTTURA DINAMICA (Come nel Metal) ---
    const rawStructure = [
        { name: "intro",     measures: energy > 0.6 ? 4 : 8 }, 
        { name: "verse",     measures: 8 },
        { name: "chorus",    measures: 8 },
        { name: "verse",     measures: 8 },
        { name: "chorus",    measures: 12 },
        { name: "outro",     measures: 4 }
    ];
    const structure = buildSongStructure(rawStructure, bpm);

    // --- 2. 🎼 ARMONIA CONDIVISA (Usa musicTheory.js) ---
    // Passiamo la tonalità di base (es. "A") e i parametri immagine
    const tonalBase = params.tonalCenter || "A";
    const songProgressions = generateSongProgressions(structure, img, tonalBase, rand);

    const measureDur = (60 / bpm) * 4;
    const step8n = measureDur / 8;

    if (score) {
        score.notes = [];
        if (score.setTheme) score.setTheme("orchestra");
    }

    structure.sections.forEach(section => {
        // Recuperiamo la progressione generata da musicTheory per questa sezione
        const sectionData = songProgressions[section.name];
        const progression = sectionData.progression; // Array di gradi (es. ["i", "VI", "VII"])
        const sectionRoot = sectionData.root + (img.brightness > 0.6 ? "4" : "3");
        
        // Scala specifica per la sezione
        const scale = buildScaleFromTonic(sectionRoot, "harmonicMinor");

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            for (let s = 0; s < 8; s++) {
                const stepTime = measureStartTime + (s * step8n);
                
                // Determina il grado corrente all'interno della misura
                const currentDegree = progression[m % progression.length];

                Tone.Transport.schedule((time) => {
                    try {
                        // Converte il grado in indice per scaleUtils
                        const rootIdx = degreeToIndex(currentDegree);
                        const baseNote = getScaleDegree(scale, rootIdx) || scale[0];

                        // --- LEAD (Violino + Motto DNA) ---
                        const mottoShift = motto[s % motto.length];
                        const vNote = safeNote(getScaleDegree(scale, rootIdx + 7 + mottoShift), "5");
                        
                        if (vNote && rand() > (0.6 - energy * 0.3)) {
                            violin.triggerAttackRelease(vNote, "8n", time, 0.6);
                            
                            // Viola fa armonia fissa sulla terza/quinta
                            const violaNote = safeNote(getScaleDegree(scale, rootIdx + 2), "4");
                            if (violaNote) viola.triggerAttackRelease(violaNote, "4n", time, 0.4);

                            Tone.Draw.schedule(() => { if (score) score.addNote("Lead", vNote, section.name); }, time);
                        }

                        // --- BASS (Cello + DoubleBass) ---
                        if (s === 0 || (s === 4 && energy > 0.7)) {
                            const bNote = safeNote(baseNote, "2");
                            if (bNote) {
                                cello.triggerAttackRelease(bNote, "2n", time, 0.7);
                                doubleBass.triggerAttackRelease(Tone.Frequency(bNote).transpose(-12).toNote(), "2n", time, 0.8);
                                Tone.Draw.schedule(() => { if (score) score.addNote("Bass", bNote, section.name); }, time);
                            }
                        }

                        // --- PERCUSSION (Timpani) ---
                        if (s === 0 && (energy > 0.5 || section.name === "chorus")) {
                            timpani.player(`timpano${(m % 5) + 1}`).start(time);
                            Tone.Draw.schedule(() => { if (score) score.addNote("Drums", "Kick", section.name); }, time);
                        }

                    } catch (e) { console.warn(e); }
                }, stepTime);
            }
        }
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => { Tone.context.resume(); Tone.Transport.start("+0.1"); },
        stop: () => { Tone.Transport.stop(); Tone.Transport.cancel(); },
        mixerData: { instruments: orchestraInstruments, volumeMap: orchestraVolumeMap }
    };
}

// Helper per mappare i gradi di musicTheory (i, VI, etc) agli indici di scala (0, 5, etc)
function degreeToIndex(degree) {
    const d = degree.toLowerCase().replace('b', '').replace('#', '');
    const map = { 'i': 0, 'ii': 1, 'iii': 2, 'iv': 3, 'v': 4, 'vi': 5, 'vii': 6 };
    return map[d] || 0;
}
