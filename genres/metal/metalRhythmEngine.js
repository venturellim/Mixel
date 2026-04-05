// metalRhythmEngine.js — ver. 008.1 (SUSTAINED & FULL LOGIC)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 008.1 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    
    // Groove unico per i versi
    const sectionGroove = (rand() > 0.5) ? "gallop" : "straight";
    
    // DECISIONE CHORUS: Usiamo il DNA per decidere se questo specifico chorus è "Sustain" o "Ribattuto"
    // In alternativa, potresti forzare il secondo chorus a essere sempre ribattuto.
    const chorusStyle = rand() > 0.5 ? "sustainOnly" : "doublePick";

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        
        const isLastMeasure = (m === section.measures - 1);
        const isHalfway = (m === Math.floor(section.measures / 2) - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            const isEighth = s % 2 === 0;
            const isDownbeat = s === 0;

            let currentRoot = root;
            let isLeadIn = isLastMeasure && s >= 12;

            // --- 1. TRANSITION (Scala cromatica pulita) ---
            if (isLeadIn && nextSectionRoot && nextSectionRoot !== root) {
                if (s === 12 || s === 14) {
                    const rootMidi = Tone.Frequency(root + "2").toMidi();
                    const nextMidi = Tone.Frequency(nextSectionRoot + "2").toMidi();
                    const diff = nextMidi > rootMidi ? 1 : -1;
                    const interval = (s === 12) ? diff : diff * 2; 
                    currentRoot = Tone.Frequency(rootMidi + interval, "midi").toNote();
                } else {
                    isLeadIn = false; 
                }
            }

            // --- 2. CHITARRA LOGIC (Chorus Variabili) ---
            let playGuitar = false;
            let inst = isChorus ? guitarOpen : guitarPalm;
            let dur = "16n";

            if (isChorus) {
                inst = guitarOpen;
                // COLPO PRINCIPALE (Sempre presente)
                if (s === 0) {
                    playGuitar = true;
                    dur = "2n";
                } 
                // COLPO DI RINFORZO (Solo se lo stile è doublePick)
                else if (chorusStyle === "doublePick" && s === 10) {
                    playGuitar = true;
                    dur = "8n";
                }
            } else if (isIntro && m < section.measures / 2) {
                if (s % 8 === 0) { playGuitar = true; inst = guitarOpen; dur = "1n"; }
            } else {
                // VERSE / SOLO
                if (isLeadIn) { playGuitar = true; inst = guitarPalm; dur = "16n"; }
                else {
                    playGuitar = sectionGroove === "gallop" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : isEighth;
                }
            }

            if (playGuitar) {
                const gNote = normalizeNote(currentRoot, inst === guitarOpen ? "guitarOpen" : "guitarPalm");
                const bNote = normalizeNote(currentRoot, "bass");
                Tone.Transport.schedule(t => {
                    inst.triggerAttackRelease(gNote + "2", dur, t);
                    bass.triggerAttackRelease(bNote + "1", "16n", t);
                }, absoluteTime);
            }

            // --- 3. BATTERIA (Pulita e con transizioni umane) ---
            Tone.Transport.schedule((time) => {
                if (isIntro && m < section.measures / 2) {
                    if (s === 0) drums.player("crash1").start(time);
                    if (s % 6 === 0) drums.player("snare").start(time);
                    if (isEighth) drums.player("hihat").start(time);
                    return;
                }

                if (s === 0 && (m === 0 || isHalfway)) drums.player("crash2").start(time);

                const kickHit = (isChorus || isLeadIn) ? isEighth : (sectionGroove === "gallop" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : isEighth);
                if (kickHit) drums.player("kick").start(time);
                
                if (s === 4 || s === 12) drums.player("snare").start(time);
                if (isLastMeasure && s > 13) drums.player("snare").start(time);

                if (isEighth) drums.player(isChorus ? "ride" : "hihat").start(time);
                
                // Tom solo su accenti (ottavi) nelle transizioni
                if ((isLastMeasure || isHalfway) && s >= 12 && s % 2 === 0) {
                    drums.player("tom" + (s === 12 ? 1 : 3)).start(time);
                }
            }, absoluteTime);
        }
    }
}
