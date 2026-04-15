// ==========================================
// orchestraEngine.js — ver. 012 (VIOLA UPDATE)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 012 loaded");

function safeNote(note, defaultOctave = "4") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

export async function waitOrchestraInstruments() {
    // Ora attendiamo 6 elementi (Violino, Viola, Cello, Basso, Cembalo, Timpani)
    await waitForInstruments(6);
}

export async function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    // Estraiamo anche la viola dagli strumenti
    const { violin, viola, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

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
    
    const tCenter = params.tonalCenter || "A";
    const scaleBase = /\d/.test(tCenter) ? tCenter : tCenter + "3";
    const scale = buildScaleFromTonic(scaleBase, "harmonicMinor");

    const measureDur = (60 / bpm) * 4;
    const step8n = measureDur / 8;

    if (score && score.setTheme) score.setTheme("orchestra");

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
                        const baseNote = getScaleDegree(scale, rootIdx) || scale[0] || "A3";

                        // --- 1. VIOLINO (Lead) ---
                        const vNote = safeNote(getScaleDegree(scale, rootIdx + 14), "5");
                        if (vNote && rand() > 0.3) {
                            violin.triggerAttackRelease(vNote, "8n", time, 0.6);
                            Tone.Draw.schedule(() => { 
                                if (score) score.addNote("Lead", vNote, section.name); 
                            }, time);
                        }

                        // --- 2. VIOLA (Controcanto - Canale Lead) ---
                        // La viola suona una terza o quinta sopra la base, nel registro medio
                        const violaRaw = getScaleDegree(scale, rootIdx + 7) || baseNote;
                        const violaNote = safeNote(violaRaw, "4");
                        if (violaNote && rand() > 0.4) {
                            viola.triggerAttackRelease(violaNote, "4n", time, 0.5);
                            Tone.Draw.schedule(() => { 
                                // Visualizzata insieme al violino nello score
                                if (score) score.addNote("Lead", violaNote, section.name); 
                            }, time);
                        }

                        // --- 3. CLAVICEMBALO (Rhythm) ---
                        if (energy > 0.5 && s % 2 === 1) {
                            const hNote = safeNote(baseNote, "4");
                            if (hNote) harpsichord.triggerAttackRelease(hNote, "16n", time, 0.3);
                        }

                        // --- 4. CELLO/BASSO (Bass) ---
                        if (s % 2 === 0) {
                            const bNote = safeNote(baseNote, "2");
                            if (bNote) {
                                cello.triggerAttackRelease(bNote, "4n", time, 0.7);
                                Tone.Draw.schedule(() => { 
                                    if (score) score.addNote("Bass", bNote, section.name); 
                                }, time);
                            }
                        }

                        // --- 5. TIMPANI (Drums) ---
                        if (s === 0 && (sectionName === "chorus" || energy > 0.7)) {
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
