// funkyRhythmEngine.js — ver. 003 (con fill che silenziano i piatti)
import * as Tone from "https://esm.sh/tone";
import { getFunkyGroove, grooveCharacteristics } from "./funkyGrooves.js";
import { normalizeNote } from "./funkyInstruments.js";
import { scheduleFunkyFill, scheduleTransitionFill } from "./funkyFills.js";

console.log("funkyRhythmEngine.js ver. 003 loaded");

function getRootPitch(root) {
    if (!root || typeof root !== "string") return "C";
    const match = root.toUpperCase().match(/^([A-G](#|B)?)/);
    return match ? match[1] : "C";
}

// Pattern basso slap (syncopato)
const bassPatterns = {
    SoulFunk: (s, isDrop) => [0, 4, 8, 12].includes(s) || (isDrop && s % 2 === 0),
    ClassicFunk: (s, isDrop) => [0, 6, 8, 14].includes(s) || (isDrop && [4, 12].includes(s)),
    JazzFunk: (s, isDrop) => [0, 3, 6, 8, 11, 14].includes(s),
    PartyFunk: (s, isDrop) => [0, 4, 8, 12].includes(s) || (s % 2 === 0 && s !== 0 && s !== 8)
};

// Pattern chitarra muta (ritmica in 16th)
const guitarPatterns = {
    SoulFunk: (s) => s % 4 === 0 || s % 4 === 2,
    ClassicFunk: (s) => s % 2 === 0,
    JazzFunk: (s) => [0, 3, 6, 8, 11, 14].includes(s),
    PartyFunk: (s) => true
};

export function scheduleFunkyRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot, score) {
    const { drumFunky, bassSlap, guitarMute, clavinet } = instruments;
    if (!drumFunky || !bassSlap) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") && !name.includes("pre");
    const isPreChorus = name.includes("pre") || name.includes("bridge");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo");

    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params?.imageParams || {};
    const style = params?.style || "ClassicFunk";
    const isDrop = isChorus || isSolo;

    const sectionType = isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : (isSolo ? "solo" : "verse")));
    const currentGroove = getFunkyGroove(sectionType, energy, brightness, complexity);
    const groove = grooveCharacteristics[currentGroove];

    console.log(`🥁 ${section.name} | Stile: ${style} | Groove: ${currentGroove} | Drop: ${isDrop}`);

    let pattern = groove?.pattern || [0, 4, 8, 12];
    const bassShouldPlay = bassPatterns[style] || bassPatterns.ClassicFunk;
    const guitarShouldPlay = guitarPatterns[style] || guitarPatterns.ClassicFunk;

    const useClavinet = isChorus || isSolo || isPreChorus;

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const pitchRoot = getRootPitch(currentRoot);
        
        const bassNoteRaw = pitchRoot + "1";
        const bassNote = normalizeNote(bassNoteRaw, "bassSlap");
        
        const chordRoot = pitchRoot + "3";
        const chordThird = Tone.Frequency(chordRoot).transpose(4).toNote();
        const chordFifth = Tone.Frequency(chordRoot).transpose(7).toNote();

        // Determina se questa misura ha un fill
        const hasFillAtEnd = (m % 2 === 1) && (m < section.measures - 1);
        const hasTransitionFill = (m === section.measures - 1 && nextSectionRoot);
        
        // Zone di fill (ultimi 2 sedicesimi della misura per il fill)
        const isFillZone = hasFillAtEnd && (s >= 12);
        const isTransitionZone = hasTransitionFill && (s >= 12);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + s * stepTime;
            const isQuarter = (s === 0 || s === 4 || s === 8 || s === 12);
            
            // === FILL ATTIVO? ===
            const isFillActive = (hasFillAtEnd && s >= 12) || (hasTransitionFill && s >= 12);
            
            // === KICK ===
            let playKick = isQuarter;
            if (isDrop && (s === 2 || s === 6 || s === 10 || s === 14)) playKick = true;
            // Durante i fill, kick più presenti
            if (isFillActive && (s === 12 || s === 14)) playKick = true;
            
            if (playKick) {
                Tone.Transport.schedule(t => {
                    drumFunky?.player("kick")?.start(t);
                    if (score) score.addNote("Drums", "Kick", section.name);
                }, absoluteTime);
            }
            
            // === SNARE ===
            let playSnare = !isIntro && (s === 4 || s === 12);
            // Durante i fill, snare più presente
            if (isFillActive && (s === 13 || s === 15)) playSnare = true;
            
            if (playSnare) {
                Tone.Transport.schedule(t => {
                    drumFunky?.player("snare")?.start(t);
                    if (score) score.addNote("Drums", "Snare", section.name);
                }, absoluteTime);
            }
            
            // === HI-HAT (SILENZIATO DURANTE I FILL!) ===
            const shouldPlayHat = !isFillActive && (!isIntro || (isIntro && s % 2 === 0));
            
            if (shouldPlayHat) {
                const useOpenHat = (isDrop && s % 4 === 2) || (s === 6 || s === 14);
                const hatSound = useOpenHat ? "hihatopen" : "hihatclose";
                Tone.Transport.schedule(t => {
                    drumFunky?.player(hatSound)?.start(t);
                    if (score) score.addNote("Drums", hatSound === "hihatopen" ? "OpenHat" : "HiHat", section.name);
                }, absoluteTime);
            }
            
            // === RIDE (SILENZIATO DURANTE I FILL!) ===
            const shouldPlayRide = !isFillActive && isChorus && (s === 0 || s === 8);
            
            if (shouldPlayRide) {
                Tone.Transport.schedule(t => {
                    drumFunky?.player("ride")?.start(t);
                    if (score) score.addNote("Drums", "Ride", section.name);
                }, absoluteTime);
            }
            
            // === BASSO SLAP ===
            if (bassShouldPlay(s, isDrop) && bassNote && !isFillActive) {
                Tone.Transport.schedule(t => {
                    bassSlap.triggerAttackRelease(bassNote, "16n", t);
                    if (score) score.addNote("Bass", bassNote, section.name);
                }, absoluteTime);
            }
            
            // === CHITARRA MUTE ===
            if (guitarShouldPlay(s) && guitarMute && !isFillActive) {
                const guitarNoteRaw = pitchRoot + "3";
                const guitarNote = normalizeNote(guitarNoteRaw, "guitarMute");
                Tone.Transport.schedule(t => {
                    guitarMute.triggerAttackRelease(guitarNote, "16n", t, 0.6);
                    if (score) score.addNote("Guitar", guitarNote, section.name);
                }, absoluteTime);
            }
            
            // === CRASH all'inizio ===
            if (s === 0 && m === 0 && !isIntro) {
                Tone.Transport.schedule(t => {
                    drumFunky?.player("crash")?.start(t);
                    if (score) score.addNote("Drums", "Crash", section.name);
                }, absoluteTime);
            }
        }
        
        // === CLAVINET ===
        if (useClavinet && clavinet) {
            const chordNotes = [chordRoot, chordThird, chordFifth];
            Tone.Transport.schedule(t => {
                chordNotes.forEach(note => {
                    const safeChordNote = normalizeNote(note, "clavinet");
                    clavinet.triggerAttackRelease(safeChordNote, measureDur * 0.8, t, 0.5);
                    if (score) score.addNote("Clavinet", safeChordNote, section.name);
                });
            }, measureStartTime);
        }
        
        // === FILL DI BATTERIA (solo se non c'è già un fill attivo) ===
        if (hasFillAtEnd) {
            const fillStartTime = measureStartTime + measureDur - 0.5;
            scheduleFunkyFill(drumFunky, fillStartTime, section.name, energy, score, section.name);
        }
        
        if (hasTransitionFill) {
            const fillEndTime = measureStartTime + measureDur;
            scheduleTransitionFill(drumFunky, fillEndTime, energy, score, section.name);
        }
    }
}