// metalRhythmEngine.js — ver. 013 (DYNAMIC SECTIONS & MIXED PATTERNS)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 013 loaded");

// metalRhythmEngine.js — ver. 013 (CLEAN CHANNELS & MUTING)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    const energy = params.imageParams.energy;

    const getGrooveType = (mIdx) => {
        const isSecondHalf = mIdx >= Math.floor(section.measures / 2);
        if (isIntro) return "epicHold";
        if (isChorus) return energy > 0.7 ? "doubleKick" : "straight";
        return isSecondHalf ? "doubleKick" : "gallop";
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        const isIntroFirstHalf = isIntro && (m < Math.floor(section.measures / 2));
        const isLastMeasure = (m === section.measures - 1);
        const grooveType = getGrooveType(m);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let currentRoot = root;
            
            // --- 1. LOGICA DECISIONALE UNIFICATA ---
            let playGuitar = false;
            let useOpen = false;

            // Decidiamo IL RITMO (playGuitar)
            switch(grooveType) {
                case "gallop": playGuitar = (s % 4 === 0 || s % 4 === 2 || s % 4 === 3); break;
                case "doubleKick": playGuitar = (s % 2 === 0); break;
                case "epicHold": playGuitar = (s % 8 === 0); break;
                default: playGuitar = (s % 2 === 0);
            }

            // Decidiamo IL TIMBRO (useOpen)
            if (isIntro) {
                useOpen = true;
            } else if (isChorus) {
                useOpen = (rand() > 0.2); // 80% Open
            } else {
                // VERSE: Usiamo Open solo per enfatizzare (es. ogni inizio quarto o se deciso dal DNA)
                // Se s=0 (inizio misura) o s=8 (metà), diamo una chance di Open
                if ((s === 0 || s === 8) && rand() > 0.5) useOpen = true;
                else useOpen = false;
            }

            // --- 2. APPLICAZIONE MUTING (Il "Choke") ---
            if (playGuitar) {
                const gNote = normalizeNote(currentRoot, useOpen ? "guitarOpen" : "guitarPalm");
                const bNote = normalizeNote(currentRoot, "bass");

                Tone.Transport.schedule(t => {
                    // STOP IMMEDIATO: Prima di suonare, fermiamo entrambi i canali
                    // Questo impedisce alla Open di sovrapporsi alla Palm successiva
                    guitarOpen.releaseAll(t);
                    guitarPalm.releaseAll(t);
                    
                    if (useOpen) {
                        // Se è Open, la facciamo durare fino al prossimo colpo (niente durata fissa)
                        guitarOpen.triggerAttack(gNote + "2", t);
                    } else {
                        // Se è Palm, è un colpo secco
                        guitarPalm.triggerAttackRelease(gNote + "2", "16n", t);
                    }
                    
                    // Basso sempre presente per il low-end
                    bass.releaseAll(t);
                    bass.triggerAttackRelease(bNote + "1", useOpen ? "8n" : "16n", t);
                }, absoluteTime);
            }

            // --- 3. BATTERIA ---
            Tone.Transport.schedule(time => {
                if (isIntroFirstHalf) {
                    if (s === 0) {
                        drums.player("crash1").start(time);
                        drums.player("kick").start(time);
                    }
                    return;
                }
                const kick = (grooveType === "gallop") ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : (s % 2 === 0);
                const snare = (s === 4 || s === 12);
                if (kick) drums.player("kick").start(time);
                if (snare) drums.player("snare").start(time);
                if (s % 2 === 0) drums.player(isChorus ? "ride" : "hihat").start(time);
                if (s === 0 && (m === 0 || isLastMeasure)) drums.player("crash2").start(time);
            }, absoluteTime);
        }
    }
}
