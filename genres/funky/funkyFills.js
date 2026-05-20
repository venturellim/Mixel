// funkyFills.js — Fill di batteria per Funky
import * as Tone from "https://esm.sh/tone";

console.log("funkyFills.js ver. 001 loaded");

// Libreria fill per batteria funky
const FUNKY_FILLS = {
    classic: [
        { time: 0, sound: "snare", velocity: 0.7 },
        { time: 0.125, sound: "racktom", velocity: 0.6 },
        { time: 0.25, sound: "snare", velocity: 0.8 },
        { time: 0.375, sound: "floortom", velocity: 0.7 },
        { time: 0.5, sound: "kick", velocity: 0.9 },
        { time: 0.625, sound: "snare", velocity: 0.6 },
        { time: 0.75, sound: "racktom", velocity: 0.7 },
        { time: 0.875, sound: "crash", velocity: 0.8 }
    ],
    fast: [
        { time: 0, sound: "snare", velocity: 0.6 },
        { time: 0.0625, sound: "racktom", velocity: 0.5 },
        { time: 0.125, sound: "snare", velocity: 0.7 },
        { time: 0.1875, sound: "floortom", velocity: 0.6 },
        { time: 0.25, sound: "snare", velocity: 0.8 },
        { time: 0.3125, sound: "racktom", velocity: 0.7 },
        { time: 0.375, sound: "snare", velocity: 0.9 },
        { time: 0.5, sound: "crash", velocity: 0.9 }
    ],
    tomRoll: [
        { time: 0, sound: "racktom", velocity: 0.6 },
        { time: 0.125, sound: "racktom", velocity: 0.7 },
        { time: 0.25, sound: "floortom", velocity: 0.7 },
        { time: 0.375, sound: "floortom", velocity: 0.8 },
        { time: 0.5, sound: "snare", velocity: 0.8 },
        { time: 0.625, sound: "snare", velocity: 0.7 },
        { time: 0.75, sound: "kick", velocity: 0.9 },
        { time: 0.875, sound: "crash", velocity: 0.8 }
    ],
    ghost: [
        { time: 0, sound: "snare", velocity: 0.3 },
        { time: 0.125, sound: "snare", velocity: 0.25 },
        { time: 0.25, sound: "snare", velocity: 0.3 },
        { time: 0.375, sound: "snare", velocity: 0.2 },
        { time: 0.5, sound: "snare", velocity: 0.7 },
        { time: 0.625, sound: "racktom", velocity: 0.6 },
        { time: 0.75, sound: "floortom", velocity: 0.7 },
        { time: 0.875, sound: "crash", velocity: 0.8 }
    ],
    crashKick: [
        { time: 0, sound: "crash", velocity: 0.9 },
        { time: 0.25, sound: "kick", velocity: 0.8 },
        { time: 0.5, sound: "snare", velocity: 0.7 },
        { time: 0.75, sound: "kick", velocity: 0.9 }
    ],
    snareRoll: [
        { time: 0, sound: "snare", velocity: 0.4 },
        { time: 0.0625, sound: "snare", velocity: 0.5 },
        { time: 0.125, sound: "snare", velocity: 0.6 },
        { time: 0.1875, sound: "snare", velocity: 0.7 },
        { time: 0.25, sound: "snare", velocity: 0.8 },
        { time: 0.3125, sound: "snare", velocity: 0.7 },
        { time: 0.375, sound: "snare", velocity: 0.6 },
        { time: 0.5, sound: "crash", velocity: 0.9 }
    ]
};

const fillTypes = {
    intro: "classic",
    verse: "ghost",
    prechorus: "fast",
    chorus: "tomRoll",
    bridge: "snareRoll",
    solo: "fast",
    outro: "crashKick"
};

export function scheduleFunkyFill(drumFunky, startTime, sectionName, intensity = 0.5, score, sectionNameStr) {
    if (!drumFunky) return;
    
    let fillType = fillTypes[sectionName] || "classic";
    
    const variants = ["classic", "fast", "tomRoll", "ghost", "crashKick", "snareRoll"];
    if (intensity > 0.7 && Math.random() < 0.3) {
        fillType = variants[Math.floor(Math.random() * variants.length)];
    }
    
    const fill = FUNKY_FILLS[fillType];
    if (!fill) return;
    
    console.log(`🥁 Fill batteria: ${fillType} a ${startTime.toFixed(2)}s (${sectionName})`);
    
    fill.forEach(hit => {
        const absoluteTime = startTime + hit.time;
        Tone.Transport.schedule(t => {
            try {
                const player = drumFunky.player(hit.sound);
                if (player) {
                    player.start(t);
                    if (score) score.addNote("Drums", hit.sound, sectionNameStr);
                }
            } catch(e) {}
        }, absoluteTime);
    });
}

export function scheduleTransitionFill(drumFunky, endTime, intensity, score, sectionNameStr) {
    if (!drumFunky) return;
    
    const transitionFill = [
        { time: 0, sound: "snare", velocity: 0.8 },
        { time: 0.083, sound: "racktom", velocity: 0.7 },
        { time: 0.166, sound: "floortom", velocity: 0.8 },
        { time: 0.25, sound: "snare", velocity: 0.9 },
        { time: 0.333, sound: "kick", velocity: 0.8 },
        { time: 0.416, sound: "snare", velocity: 0.7 },
        { time: 0.5, sound: "crash", velocity: 0.9 },
        { time: 0.583, sound: "kick", velocity: 0.8 }
    ];
    
    const startTime = endTime - 0.5;
    
    console.log(`🔄 Transition fill a ${startTime.toFixed(2)}s`);
    
    transitionFill.forEach(hit => {
        const absoluteTime = startTime + hit.time;
        Tone.Transport.schedule(t => {
            try {
                const player = drumFunky.player(hit.sound);
                if (player) {
                    player.start(t);
                    if (score) score.addNote("Drums", hit.sound, sectionNameStr);
                }
            } catch(e) {}
        }, absoluteTime);
    });
}