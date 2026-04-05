// metalRhythmEngine.js — ver. 008.2 (SUSTAINED & FULL LOGIC)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 008.2 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    
    const sectionGroove = (rand() > 0.5) ? "gallop" : "straight";
    const chorusStyle = rand() > 0.5 ? "sustainOnly" : "doublePick";

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        const isLastMeasure = (m === section.measures - 1);
        const isHalfway = (m === Math.floor(section.measures / 2) - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            const isEighth = s % 2 === 0;

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

            // --- 2. CHITARRA LOGIC (FIX SUSTAIN) ---
            let playGuitar = false;
            let inst = isChorus ? guitarOpen : guitarPalm;
            
            // Determiniamo se la nota deve essere "aperta" (sustain) o "palm" (stoppata)
            let isSustainNote = false;

            if (isChorus) {
                isSustainNote = true;
                if (s === 0) playGuitar = true;
                else if (chorusStyle === "doublePick" && s === 10) playGuitar = true;
            } else if (isIntro && m < section.measures / 2) {
                isSustainNote = true;
                if (s % 8 === 0) playGuitar = true;
            } else {
                // VERSE / SOLO
                if (isLeadIn) playGuitar = true;
                else {
                    playGuitar = sectionGroove === "gallop" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : isEighth;
                }
            }

            if (playGuitar) {
                const gNote = normalizeNote(currentRoot, isSustainNote ? "guitarOpen" : "guitarPalm");
                const bNote = normalizeNote(currentRoot, "bass");
                
                Tone.Transport.schedule(t => {
                    // FIX CRUCIALE: Se è una nota di sustain (Chorus/Intro), 
                    // NON usiamo triggerAttackRelease con una durata breve.
                    // Usiamo una durata molto lunga ("1n" = una misura intera) 
                    // per assicurarci che il campione non venga mai tagliato 
                    // prima del colpo successivo.
                    const duration = isSustainNote ? "1n" : "16n";
                    
                    inst.triggerAttackRelease(gNote + "2", duration, t);
                    bass.triggerAttackRelease(bNote + "1", "16n", t);
                }, absoluteTime);
            }

            // --- 3. BATTERIA ---
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
                if ((isLastMeasure || isHalfway) && s >= 12 && s % 2 === 0) {
                    drums.player("tom" + (s === 12 ? 1 : 3)).start(time);
                }
            }, absoluteTime);
        }
    }
}
