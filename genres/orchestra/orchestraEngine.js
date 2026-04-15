// ==========================================
// orchestraEngine.js — ver. 007 (PIANO-BASED)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 007 loaded");

export async function waitOrchestraInstruments() {
    await waitForInstruments(5); // Attendiamo i 5 canali orchestrali
}

export async function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const { violin, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

    // Parametri derivati dall'immagine
    const energy = params.imageParams?.energy ?? 0.5;
    const bpm = 100 + (energy * 60);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    // Struttura fissa ma quadrata (stile Piano Engine)
    const structure = buildSongStructure(params.structure || [
        { name: "intro", measures: 4 },
        { name: "verse", measures: 8 },
        { name: "chorus", measures: 8 },
        { name: "outro", measures: 4 }
    ], bpm);

    const scale = buildScaleFromTonic(params.tonalCenter || "A", "harmonicMinor");
    const measureDur = (60 / bpm) * 4;
    const step8n = measureDur / 8; // Usiamo la suddivisione in ottavi come nel piano

    structure.sections.forEach(section => {
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            // Ciclo sui passi (8 ottavi per misura)
            for (let s = 0; s < 8; s++) {
                const stepTime = measureStartTime + (s * step8n);
                const currentDegree = sectionProg[Math.floor(s / (8 / sectionProg.length)) % sectionProg.length];
                const rootIdx = degreeToIndex(currentDegree);

                Tone.Transport.schedule((time) => {
                    // --- 1. CONTRABBASSO (Pedale di Tonica) ---
                    if (s === 0 || (energy > 0.6 && s === 4)) {
                        const dbNote = getScaleDegree(scale, rootIdx);
                        doubleBass.triggerAttackRelease(Tone.Frequency(dbNote).transpose(-24).toNote(), "2n", time, 0.8);
                    }

                    // --- 2. VIOLONCELLO (Arpeggio/Basso) ---
                    if (s % 2 === 0) {
                        const cNote = getScaleDegree(scale, rootIdx + (s % 4 === 0 ? 0 : 2));
                        cello.triggerAttackRelease(Tone.Frequency(cNote).transpose(-12).toNote(), "4n", time, 0.7);
                        if (score && s === 0) score.addNote("Bass", cNote, section.name);
                    }

                    // --- 3. VIOLINO (Lead Melodico) ---
                    if (rand() > 0.3) {
                        const vNote = getScaleDegree(scale, rootIdx + 14 + (Math.floor(rand() * 3) * 2));
                        violin.triggerAttackRelease(vNote, "8n", time, 0.6);
                        Tone.Draw.schedule(() => {
                            if (score) score.addNote("Lead", vNote, section.name);
                        }, time);
                    }

                    // --- 4. CLAVICEMBALO (Rampante) ---
                    if (energy > 0.4) {
                        const hNote = getScaleDegree(scale, rootIdx + 7);
                        harpsichord.triggerAttackRelease(hNote, "16n", time, 0.4);
                    }

                    // --- 5. TIMPANI (Solo accenti) ---
                    if (s === 0 && (section.name === "chorus" || m % 4 === 0)) {
                        const tName = `timpano${Math.floor(rand() * 5) + 1}`;
                        const player = timpani.player(tName);
                        if (player) player.start(time);
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
            [violin, cello, doubleBass, harpsichord].forEach(instr => instr.releaseAll());
            timpani.stopAll();
        },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { instruments: orchestraInstruments, volumeMap: orchestraVolumeMap }
    };
}

function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6 };
    return map[degree.replace('b', '')] || 0;
}
