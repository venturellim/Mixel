// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 002.6 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead, keyboardLead, keyboardPad } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;

    // HELPER: Genera la scala usando solo diesis o solo bemolli per evitare conflitti
    const getStrictScale = (root) => {
        // Usiamo un set di note "neutro" per i calcoli semitonali
        const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        
        // Puliamo la root (es. "Am7" -> "A", "G2" -> "G")
        let cleanRoot = root.replace(/[0-9]/g, '').replace('m', '');
        // Gestione veloce della normalizzazione inversa per trovare l'indice
        if (cleanRoot === "Db") cleanRoot = "C#";
        if (cleanRoot === "Eb") cleanRoot = "D#";
        if (cleanRoot === "Gb") cleanRoot = "F#";
        if (cleanRoot === "Ab") cleanRoot = "G#";
        if (cleanRoot === "Bb") cleanRoot = "A#";

        let rootIdx = allNotes.indexOf(cleanRoot);
        if (rootIdx === -1) rootIdx = 9; // Default A

        const isMinor = root.includes('m') || root !== root.toUpperCase();
        const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
        
        return intervals.map(interval => allNotes[(rootIdx + interval) % 12]);
    };

    const buildNote = (noteName, octave) => {
        // Usiamo la tua normalizeNote ma ci assicuriamo che il risultato sia coerente
        return normalizeNote(noteName, "guitarLead") + octave;
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";
        const currentScale = getStrictScale(currentRoot);

        // --- 1. INTRO / OUTRO ---
        if (isIntro) {
            [0, 4, 8, 12].forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                // Intro: Tonica e Quinta sono sempre "safe"
                const noteName = buildNote(i % 2 === 0 ? currentScale[0] : currentScale[4], 4);
                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "2n", time);
                    if (keyboardPad) keyboardPad.triggerAttackRelease(noteName, "2n", time, 0.3);
                }, absoluteTime);
            });
        }

        // --- 2. VERSE / CHORUS ---
        else if (!isSolo) {
            [0, 8].forEach((s) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                const mainNote = buildNote(currentScale[0], isChorus ? 5 : 4);

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(mainNote, "2n", time);
                    if (isChorus && keyboardPad) keyboardPad.triggerAttackRelease(mainNote, "2n", time, 0.4);
                }, absoluteTime);

                // Note di collegamento: ora pescano SOLO dai gradi 1, 3, 5 della scala reale
                [4, 6, 12, 14].forEach((step, idx) => {
                    const linkTime = measureStartTime + (step * stepTime);
                    // 0 = Tonica, 2 = Terza (Maggiore o Minore!), 4 = Quinta
                    const safeIdx = [2, 4, 0, 4][idx % 4];
                    const linkNoteName = currentScale[safeIdx];
                    const linkNote = buildNote(linkNoteName, isChorus ? 5 : 4);
                    
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(linkNote, "4n", time, 0.2);
                    }, linkTime);
                });
            });
        }

        // --- 3. SOLO ---
        else if (isSolo) {
            let scaleIdx = 0;
            for (let s = 0; s < 16; s++) {
                const isFastZone = (s > 4 && s < 12);
                if (isFastZone || s % 2 === 0) {
                    const absoluteTime = measureStartTime + (s * stepTime);
                    scaleIdx = (scaleIdx + (rand() > 0.5 ? 1 : -1) + 7) % 7;
                    const soloNote = buildNote(currentScale[scaleIdx], s > 8 ? 5 : 4);

                    Tone.Transport.schedule(time => {
                        try {
                            guitarLead.triggerAttackRelease(soloNote, isFastZone ? "16n" : "8n", time);
                            if (keyboardLead && s % 2 === 0) {
                                keyboardLead.triggerAttackRelease(soloNote, "8n", time, 0.3);
                            }
                        } catch(e) {}
                    }, absoluteTime);
                }
            }
        }
    }
}
