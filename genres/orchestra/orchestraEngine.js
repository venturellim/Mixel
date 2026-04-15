// ==========================================
// orchestraEngine.js — ver. 010 (ULTIMATE)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 010 loaded");


// Forza l'aggiunta dell'ottava se manca e valida la nota
function safeNote(note, defaultOctave = "4") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    // Verifica se Tone.js la riconosce come nota valida
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

export async function waitOrchestraInstruments() {
    await waitForInstruments(5);
}

export async function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const { violin, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

    const energy = params.imageParams?.energy ?? 0.5;
    const bpm = 100 + (energy * 60);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    const defaultStructure = [
        { name: "intro", measures: 4 },
        { name: "verse", measures: 8 },
        { name: "chorus", measures: 8 },
        { name: "outro", measures: 4 }
    ];

    const structurePreset = (params && Array.isArray(params.structure)) ? params.structure : defaultStructure;
    const structure = buildSongStructure(structurePreset, bpm);
    
    // Garantiamo che il centro tonale abbia un'ottava di base per la scala
    const tCenter = params.tonalCenter || "A";
    const scaleBase = /\d/.test(tCenter) ? tCenter : tCenter + "3";
    const scale = buildScaleFromTonic(scaleBase, "harmonicMinor");

    const measureDur = (60 / bpm) * 4;
    const step8n = measureDur / 8;

    structure.sections.forEach(section => {
        const sectionName = section.name.toLowerCase();
        const pool = progressions[sectionName] || progressions.verse;
        const sectionProg = pool[Math.floor(rand() * pool.length)];

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            for (let s = 0; s < 8; s++) {
                const stepTime = measureStartTime + (s * step8n);
                const currentDegree = sectionProg[s % sectionProg.length] || "i";
                const rootIdx = degreeToIndex(currentDegree);

                Tone.Transport.schedule((time) => {
                    try {
                        // Estrazione nota base dalla scala con paracadute (scale[0])
                        const baseNote = getScaleDegree(scale, rootIdx) || scale[0] || "A3";

                        // --- 1. CONTRABBASSO (Sempre sul battere) ---
                        if (s === 0) {
                            const dbNote = safeNote(baseNote, "2");
                            if (dbNote) {
                                const finalDb = Tone.Frequency(dbNote).transpose(-12).toNote();
                                doubleBass.triggerAttackRelease(finalDb, "2n", time, 0.8);
                            }
                        }

                        // --- 2. VIOLONCELLO (Ottavi pari) ---
                        if (s % 2 === 0) {
                            const cNote = safeNote(baseNote, "3");
                            if (cNote) cello.triggerAttackRelease(cNote, "4n", time, 0.7);
                        }

                        // --- 3. VIOLINO (Lead Melodico) ---
                        if (rand() > 0.4) {
                            const vRaw = getScaleDegree(scale, rootIdx + 14) || scale[0];
                            const vNote = safeNote(vRaw, "5");
                            if (vNote) {
                                violin.triggerAttackRelease(vNote, "8n", time, 0.6);
                                Tone.Draw.schedule(() => { if (score) score.addNote("Lead", vNote, section.name); }, time);
                            }
                        }

                        // --- 4. TIMPANI (Solo nel Chorus o accenti) ---
                        if (s === 0 && (sectionName === "chorus" || energy > 0.7)) {
                            const tName = `timpano${Math.floor(rand() * 5) + 1}`;
                            if (timpani && timpani.has(tName)) {
                                timpani.player(tName).start(time);
                            }
                        }
                    } catch (e) {
                        console.warn("Schedule Guard:", e.message);
                    }
                }, stepTime);
            }
        }
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => { 
            if (Tone.context.state !== 'running') Tone.context.resume();
            Tone.Transport.start("+0.1"); 
        },
        pause: () => Tone.Transport.pause(),
        stop: () => { 
            Tone.Transport.stop(); 
            Tone.Transport.cancel(); 
            [violin, cello, doubleBass, harpsichord].forEach(i => i.releaseAll?.());
            if (timpani) timpani.stopAll();
        },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { instruments: orchestraInstruments, volumeMap: orchestraVolumeMap }
    };
}

function degreeToIndex(degree) {
    if (!degree) return 0;
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6 };
    const clean = degree.replace('b', '').replace('#', '');
    return map[clean] || 0;
}
