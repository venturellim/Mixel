// danceBassEngine.js — ver. 002
import * as Tone from "https://esm.sh/tone";

console.log("danceBassEngine.js ver. 002 loaded");

function getMajorScale(root) {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const match = root.toUpperCase().match(/^([A-G](#|B)?)/);
    let note = match ? match[1] : "C";
    if (note === "C#") note = "C#";
    if (note === "D#") note = "D#";
    if (note === "F#") note = "F#";
    if (note === "G#") note = "G#";
    if (note === "A#") note = "A#";
    let idx = notes.indexOf(note);
    if (idx === -1) idx = 0;
    const intervals = [0, 2, 4, 5, 7, 9, 11];
    return intervals.map(i => notes[(idx + i) % 12]);
}

export function scheduleDanceBass(section, progression, instruments, params, rand, measureDur, score) {
    const { bass } = instruments;
    if (!bass) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const stepTime = measureDur / 16;
    const { energy = 0.5, complexity = 0.5 } = params?.imageParams || {};

    for (let m = 0; m < section.measures; m++) {
        const measureStart = section.startTime + m * measureDur;
        const rootChord = progression[m % progression.length];
        const scale = getMajorScale(rootChord);
        
        // Scegli nota basso (root o quinta)
        const rootNote = scale[0] + "2";
        const fifthNote = scale[4] + "2";
        
        for (let s = 0; s < 16; s++) {
            let play = false;
            let note = rootNote;
            
            // Pattern off-beat (tipico dance)
            if (s % 4 === 1) {
                play = true;
                note = rootNote;
            }
            if (s % 4 === 3 && energy > 0.6) {
                play = true;
                note = fifthNote;
            }
            // Ottave per chorus
            if (isChorus && s % 8 === 0) {
                play = true;
                note = scale[0] + "3";
            }
            
            if (play) {
                const time = measureStart + s * stepTime;
                const vel = isChorus ? 0.7 : 0.5;
                Tone.Transport.schedule(t => {
                    bass.triggerAttackRelease(note, "8n", t, vel);
                    if (score) score.addNote("Bass", note, section.name);
                }, time);
            }
        }
    }
}