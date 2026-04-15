// ==========================================
// orchestraEngine.js — ver. 008.2 (SUPER SAFE)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 008.2 loaded");


// Utility interna per validare le note prima di suonarle
function safeNote(note, defaultOctave = "4") {
    if (!note || typeof note !== "string") return null;
    // Se la nota non ha un numero (ottava), gliela aggiungiamo
    return /\d/.test(note) ? note : `${note}${defaultOctave}`;
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

    const structurePreset = (params && Array.isArray(params.structure)) 
        ? params.structure 
        : defaultStructure;

    const structure = buildSongStructure(structurePreset, bpm);
    const scale = buildScaleFromTonic(params.tonalCenter || "A", "harmonicMinor");
    const measureDur = (60 / bpm) * 4;
    const step8n = measureDur / 8;

    structure.sections.forEach(section => {
        const sectionName = section.name.toLowerCase();
        const possibleProgs = progressions[sectionName] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            for (let s = 0; s < 8; s++) {
                const stepTime = measureStartTime + (s * step8n);
                // Protezione contro progressioni vuote o malformate
                const currentDegree = sectionProg[s % sectionProg.length] || "i";
                const rootIdx = degreeToIndex(currentDegree);

                Tone.Transport.schedule((time) => {
                    try {
                        // --- 1. CONTRABBASSO (Ottava 1-2) ---
                        if (s === 0) {
                            const rawDb = getScaleDegree(scale, rootIdx);
                            const dbNote = safeNote(rawDb, "2");
                            if (dbNote) {
                                doubleBass.triggerAttackRelease(Tone.Frequency(dbNote).transpose(-24).toNote(), "2n", time, 0.8);
                            }
                        }

                        // --- 2. CELLO (Ottava 2-3) ---
                        if (s % 2 === 0) {
                            const rawC = getScaleDegree(scale, rootIdx);
                            const cNote = safeNote(rawC, "3");
                            if (cNote) {
                                cello.triggerAttackRelease(Tone.Frequency(cNote).transpose(-12).toNote(), "4n", time, 0.7);
                            }
                        }

                        // --- 3. VIOLINO (Ottava 4-5) ---
                        if (rand() > 0.4) {
                            const rawV = getScaleDegree(scale, rootIdx + 14);
                            const vNote = safeNote(rawV, "4");
                            if (vNote) {
                                violin.triggerAttackRelease(vNote, "8n", time, 0.6);
                                Tone.Draw.schedule(() => {
                                    if (score) score.addNote("Lead", vNote, section.name);
                                }, time);
                            }
                        }
                        
                        // --- 4. TIMPANI (Safe Check) ---
                        if (s === 0 && sectionName === "chorus" && timpani) {
                            const tName = `timpano${Math.floor(rand() * 5) + 1}`;
                            // Usiamo l'interfaccia corretta per i Players
                            if (timpani.has && timpani.has(tName)) {
                                timpani.player(tName).start(time);
                            }
                        }
                    } catch (e) {
                        console.warn("Silent recovery from schedule error:", e);
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
            if (timpani && timpani.stopAll) timpani.stopAll();
        },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { instruments: orchestraInstruments, volumeMap: orchestraVolumeMap }
    };
}

function degreeToIndex(degree) {
    if (!degree) return 0;
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6 };
    // Rimuoviamo alterazioni per il mapping
    const cleanDegree = degree.replace('b', '').replace('#', '');
    return map[cleanDegree] || 0;
}
