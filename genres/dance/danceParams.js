// danceParams.js — ver. 002
console.log("danceParams.js ver. 002 loaded");

export function buildDanceParams(rand) {
    const bpm = 120 + rand() * 30; // 120-150 BPM
    const tonalCenters = ["C", "D", "E", "F", "G", "A"];
    const tonalCenter = tonalCenters[Math.floor(rand() * tonalCenters.length)];
    
    return {
        bpm,
        tonalCenter,
        imageParams: {
            energy: rand(),
            brightness: rand(),
            complexity: rand(),
            texture: rand()
        }
    };
}