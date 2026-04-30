// danceLeadEngine.js — ver. 002
import * as Tone from "https://esm.sh/tone";

console.log("danceLeadEngine.js ver. 002 loaded");

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

// Pattern melodici dance
const MELODIES = {
    simple: [[0, 4, 5, 4, 0, 4, 5, 7], [0, 3, 5, 3, 0, 3, 5, 7], [0, 2, 4, 2, 0, 2, 4, 5]],
    energetic: [[0, 5, 7, 5, 4, 5, 7, 9], [0, 7, 9, 7, 5, 7, 9, 12], [0, 5, 7, 9, 7, 5, 4, 2]],
    dark: [[0, 3, 2, 3, 0, 3, 2, 1], [0, 2, 1, 2, 0, 2, 1, -1], [0, 3, 5, 3, 1, 3, 5, 7]]
};

export function scheduleDanceLead(section, progression, instruments, params, rand, measureDur, score) {
    const { lead } = instruments;
    if (!lead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isVerse = name.includes("verse");
    
    // Nessuna lead in intro/break/outro
    if (!isChorus && !isVerse) return;

    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5 } = params?.imageParams || {};

    // Scegli melodia
    let melody;
    if (energy > 0.7 && brightness > 0.5) melody = MELODIES.energetic;
    else if (brightness < 0.4) melody = MELODIES.dark;
    else melody = MELODIES.simple;
    
    const pattern = melody[Math.floor(rand() * melody.length)];
    const octave = isChorus ? 5 : 4;

    for (let m = 0; m < section.measures; m++) {
        const measureStart = section.startTime + m * measureDur;
        const rootChord = progression[m % progression.length];
        const scale = getMajorScale(rootChord);

        pattern.forEach((degree, i) => {
            const step = i * 2; // ogni 2 sedicesimi = ottavi
            if (step >= 16) return;
            
            const time = measureStart + step * stepTime;
            const noteIdx = (degree % 7 + 7) % 7;
            const noteName = scale[noteIdx] + octave;
            
            Tone.Transport.schedule(t => {
                lead.triggerAttackRelease(noteName, "8n", t, 0.8);
                if (score) score.addNote("Lead", noteName, section.name);
            }, time);
        });
    }
}