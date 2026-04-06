// metalRhythmEngine.js — ver. 015 (THE GENOME UPDATE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 015.1 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isIntro = section.name.toLowerCase().includes("intro");
    const isChorus = section.name.toLowerCase().includes("chorus");
    const stepTime = measureDur / 16;

    // Pattern Library 
    const RHYTHM_LIBRARY = {
        verse: [
            { kick: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], snare: [4, 12] },
            { kick: [0, 4, 8, 12], snare: [4, 12] } 
        ],
        chorus: [{ kick: [0, 2, 4, 6, 8, 10, 12, 14], snare: [4, 12] }],
        intro: [{ kick: [0], snare: [12], type: "open" }]
    };

    const typePool = isIntro ? "intro" : (isChorus ? "chorus" : "verse");
    const lib = RHYTHM_LIBRARY[typePool];
    const sectionPattern = lib[Math.floor(rand() * lib.length)];

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        const isIntroFirstHalf = isIntro && (m < Math.floor(section.measures / 2));
        const isLastMeasure = (m === section.measures - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);

            const kickHit = sectionPattern.kick.includes(s);
            const snareHit = sectionPattern.snare.includes(s);
            let useOpen = (isIntro && sectionPattern.type === "open") || (isChorus && rand() > 0.3);
            let playGuitar = kickHit;

            let currentRoot = root;
            if (isLastMeasure && s >= 12 && nextSectionRoot && nextSectionRoot !== root) {
                const rootMidi = Tone.Frequency(root + "2").toMidi();
                const nextMidi = Tone.Frequency(nextSectionRoot + "2").toMidi();
                const diff = nextMidi > rootMidi ? 1 : -1;
                currentRoot = Tone.Frequency(rootMidi + (s === 12 ? diff : diff * 2), "midi").toNote();
                playGuitar = true;
            }

            // --- SCHEDULING ROBUSTO ---
            Tone.Transport.schedule(time => {
                try {
                    // 1. BATTERIA (Con check di sicurezza)
                    if (isIntroFirstHalf) {
                        if (s === 0) {
                            drums.player("kick").start(time);
                            drums.player("crash1").start(time);
                        }
                    } else {
                        if (kickHit) drums.player("kick").start(time);
                        if (snareHit) drums.player("snare").start(time);
                        if (s % 2 === 0) {
                            const cym = isChorus ? "ride" : "hihat";
                            // Solo se il player esiste e il buffer è pronto
                            if (drums.has(cym)) drums.player(cym).start(time);
                        }
                        if (s === 0 && (m === 0 || isLastMeasure)) {
                            if (drums.has("crash2")) drums.player("crash2").start(time);
                        }
                    }

                    // 2. CHITARRA E BASSO
                    if (playGuitar) {
                        const gNote = normalizeNote(currentRoot, useOpen ? "guitarOpen" : "guitarPalm");
                        
                        guitarOpen.releaseAll(time);
                        guitarPalm.releaseAll(time);
                        bass.releaseAll(time);

                        if (useOpen) {
                            guitarOpen.triggerAttack(gNote + "2", time);
                        } else {
                            guitarPalm.triggerAttackRelease(gNote + "2", "16n", time);
                        }
                        bass.triggerAttackRelease(normalizeNote(currentRoot, "bass") + "1", "16n", time);
                    }
                } catch (e) {
                    // Silenzia l'errore per non bloccare il loop audio
                }
            }, absoluteTime);
        }
    }
}
