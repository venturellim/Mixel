// metalRhythmEngine.js — ver. 010 (SUSTAINED & FULL LOGIC)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 010 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    
    // Il groove della chitarra viene deciso qui e resta uguale per tutta la sezione
    const sectionGroove = (rand() > 0.5) ? "gallop" : "straight";
    const chorusStyle = rand() > 0.5 ? "sustainOnly" : "doublePick";

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        
        // Batteria: prima metà "accentata", seconda metà "piena"
        const isIntroFirstHalf = isIntro && (m < Math.floor(section.measures / 2));
        
        const isLastMeasure = (m === section.measures - 1);
        const isHalfway = (m === Math.floor(section.measures / 2) - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            const isEighth = s % 2 === 0;

            let currentRoot = root;
            let isLeadIn = isLastMeasure && s >= 12;

            // --- 1. TRANSITION ---
            if (isLeadIn && nextSectionRoot && nextSectionRoot !== root) {
                if (s === 12 || s === 14) {
                    const rootMidi = Tone.Frequency(root + \"2\").toMidi();
                    const nextMidi = Tone.Frequency(nextSectionRoot + \"2\").toMidi();
                    const diff = nextMidi > rootMidi ? 1 : -1;
                    currentRoot = Tone.Frequency(rootMidi + (s === 12 ? diff : diff * 2), \"midi\").toNote();
                } else { isLeadIn = false; }
            }

            // --- 2. CHITARRA E BASSO (Coerenti per tutta la sezione) ---
            let playGuitar = false;
            let inst = guitarPalm;
            let isSustainNote = false;

            if (isChorus) {
                isSustainNote = true;
                inst = guitarOpen;
                if (s === 0 || (chorusStyle === \"doublePick\" && s === 10)) playGuitar = true;
            } else if (isIntro) {
                // Intro: Chitarra uguale dall'inizio alla fine (Open o Gallop a seconda del DNA)
                // Usiamo guitarOpen per un'intro epica alla Stratovarius
                isSustainNote = true; 
                inst = guitarOpen;
                if (s === 0 || s === 8) playGuitar = true; // Colpi larghi ma costanti
            } else {
                // VERSE / SOLO
                if (isLeadIn) { playGuitar = true; inst = guitarPalm; }
                else { playGuitar = sectionGroove === \"gallop\" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : isEighth; }
            }

            if (playGuitar) {
                const gNote = normalizeNote(currentRoot, inst === guitarOpen ? \"guitarOpen\" : \"guitarPalm\");
                const bNote = normalizeNote(currentRoot, \"bass\");
                Tone.Transport.schedule(t => {
                    inst.triggerAttackRelease(gNote + \"2\", isSustainNote ? \"1n\" : \"16n\", t);
                    bass.triggerAttackRelease(bNote + \"1\", isSustainNote ? \"1n\" : \"16n\", t);
                }, absoluteTime);
            }

            // --- 3. BATTERIA (L'unica che cambia a metà Intro) ---
            Tone.Transport.schedule((time) => {
                if (isIntroFirstHalf) {
                    // PARTE 1: Solo accenti (Crash + Cassa + Tom) all'inizio di ogni misura
                    if (s === 0) {
                        drums.player(\"crash1\").start(time);
                        drums.player(\"kick\").start(time);
                        drums.player(\"tom1\").start(time);
                    }
                    return; 
                }

                // PARTE 2 (o altre sezioni): Batteria Completa
                if (s === 0 && (m === 0 || isHalfway)) drums.player(\"crash2\").start(time);
                
                const kickHit = (isChorus || isLeadIn || (isIntro && !isIntroFirstHalf)) ? isEighth : (sectionGroove === \"gallop\" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : isEighth);
                if (kickHit) drums.player(\"kick\").start(time);
                
                if (s === 4 || s === 12) drums.player(\"snare\").start(time);
                if (isLastMeasure && s > 13) drums.player(\"snare\").start(time);
                
                if (isEighth) drums.player(isChorus ? \"ride\" : \"hihat\").start(time);
                
                if ((isLastMeasure || isHalfway) && s >= 12 && s % 2 === 0) {
                    drums.player(\"tom\" + (s === 12 ? 1 : 3)).start(time);
                }
            }, absoluteTime);
        }
    }
}
