import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 014.1 loaded");

// Utility: Valida la nota e aggiunge l'ottava se manca
function safeNote(note, defaultOctave = "4") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

// 🧬 GENERATORE DI MOTTO (DETERMINISTICO)
// Crea una sequenza di salti melodici basata sui pixel della foto
function generateOrchestraMotto(rand, complexity) {
    const size = complexity > 0.6 ? 8 : 4;
    const motto = [];
    for (let i = 0; i < size; i++) {
        motto.push(Math.floor(rand() * 12) - 6); // Salti tra -6 e +6 gradi
    }
    return motto;
}

export async function waitOrchestraInstruments() {
    await waitForInstruments(6);
}

export async function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const { violin, viola, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

    // --- 1. LETTURA MASCHERE DNA (Dal Metal Engine) ---
    const img = params.imageParams || {};
    const energy = img.energy ?? 0.5;
    const brightness = img.brightness ?? 0.5;
    const contrast = img.contrast ?? 0.5;
    const complexity = img.complexity ?? 0.5;

    const bpm = 80 + (energy * 60);
    const motto = generateOrchestraMotto(rand, complexity);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    // --- 2. 🧬 STRUTTURA DINAMICA (Lunghezza Variabile) ---
    const hasBridge = complexity > 0.7; // Solo per foto molto complesse
    
    const dynamicStructure = [
        { name: "intro",  measures: energy > 0.6 ? 2 : 4 },
        { name: "verse",  measures: complexity > 0.5 ? 12 : 8 },
        { name: "chorus", measures: energy > 0.5 ? 16 : 8 }
    ];

    if (hasBridge) {
        dynamicStructure.push({ name: "bridge", measures: 4 });
    }

    dynamicStructure.push({ name: "outro", measures: energy < 0.3 ? 8 : 4 });

    const structure = buildSongStructure(dynamicStructure, bpm);
    
    // Tonalità: brightness alta = ottava più alta
    const baseOctave = brightness > 0.6 ? "4" : "3";
    const tCenter = (params.tonalCenter || "A") + baseOctave;
    const scale = buildScaleFromTonic(tCenter, "harmonicMinor");

    const measureDur = (60 / bpm) * 4;
    const step8n = measureDur / 8;

    // Reset visivo spartito
    if (score) {
        score.notes = [];
        if (score.setTheme) score.setTheme("orchestra");
    }

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
                        const baseNote = getScaleDegree(scale, rootIdx) || scale[0];

                        // --- VIOLINO & VIOLA (Canale: Lead) ---
                        // Melodia deterministica basata sul Motto
                        const mottoShift = motto[s % motto.length];
                        const vNote = safeNote(getScaleDegree(scale, rootIdx + 14 + mottoShift), "5");
                        const duration = contrast > 0.7 ? "16n" : "8n";

                        if (vNote && rand() > (0.6 - energy * 0.3)) {
                            violin.triggerAttackRelease(vNote, duration, time, 0.6);
                            // La Viola raddoppia in armonia
                            const violaNote = safeNote(getScaleDegree(scale, rootIdx + 7), "4");
                            if (violaNote && rand() > 0.5) viola.triggerAttackRelease(violaNote, "4n", time, 0.4);

                            // --- VIOLINO ---
Tone.Draw.schedule(() => { 
    if (score) score.addNote("Lead", vNote, section.name, false); // false = primario (nero)
}, time);

// --- VIOLA ---
Tone.Draw.schedule(() => { 
    if (score) score.addNote("Lead", violaNote, section.name, true); // true = secondario (blu)
}, time);

                        }

                        // --- CLAVICEMBALO (Canale: Rhythm) ---
                        if (s % 2 === 1 && energy > 0.4) {
                            const hNote = safeNote(baseNote, "4");
                            if (hNote) harpsichord.triggerAttackRelease(hNote, "16n", time, 0.3);
                        }

                        // --- CELLO & BASS (Canale: Bass) ---
                        // --- CELLO & BASS (Canale: Bass) ---
if (s % 4 === 0) {
    const bNote = safeNote(baseNote, "2");
    if (bNote) {
        // Esecuzione audio
        cello.triggerAttackRelease(bNote, "2n", time, 0.7);
        const dbNote = Tone.Frequency(bNote).transpose(-12).toNote();
        doubleBass.triggerAttackRelease(dbNote, "2n", time, 0.5);

        // Visualizzazione sdoppiata
        Tone.Draw.schedule(() => { 
            if (score) {
                // 1. Il Cello (nero, posizione standard)
                score.addNote("Bass", bNote, section.name, false); 
                // 2. Il Contrabbasso (blu notte, posizione sfasata)
                score.addNote("Bass", dbNote, section.name, true); 
            }
        }, time);
                            }
                        }

                        // --- TIMPANI (Canale: Drums) ---
                        if (s === 0 && (energy > 0.6 || sectionName === "chorus")) {
                            const tName = `timpano${Math.floor(rand() * 5) + 1}`;
                            if (timpani && timpani.has(tName)) {
                                timpani.player(tName).start(time);
                                Tone.Draw.schedule(() => { 
                                    if (score) score.addNote("Drums", "Kick", section.name); 
                                }, time);
                            }
                        }
                    } catch (e) { console.warn("Engine Error:", e.message); }
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
            [violin, viola, cello, doubleBass, harpsichord].forEach(i => i && i.releaseAll?.());
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
