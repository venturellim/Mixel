// danceGrooves.js — Pattern ritmici per Dance (compatibili con architettura metal)
console.log("danceGrooves.js ver. 001 loaded");

export const danceGrooves = {
    intro: ["four_on_floor_light", "kick_only", "ambient_intro"],
    verse: ["four_on_floor", "club_groove", "minimal_house"],
    prechorus: ["build_up", "riser_pattern", "tension_groove"],
    bridge: ["build_up", "breakbeat", "minimal"],
    chorus: ["anthem_drop", "full_power", "big_room"],
    solo: ["full_power", "anthem_drop", "techno_loop"],
    outro: ["kick_only", "fade_out", "ambient_outro"]
};

export const grooveCharacteristics = {
    // INTRO
    four_on_floor_light: { energy: 0.2, brightness: 0.3, complexity: 0.2, pattern: [0, 4, 8, 12] },
    kick_only: { energy: 0.3, brightness: 0.2, complexity: 0.1, pattern: [0, 4, 8, 12] },
    ambient_intro: { energy: 0.2, brightness: 0.4, complexity: 0.2, pattern: [0, 8] },
    
    // VERSE
    four_on_floor: { energy: 0.5, brightness: 0.4, complexity: 0.3, pattern: [0, 4, 8, 12] },
    club_groove: { energy: 0.6, brightness: 0.5, complexity: 0.4, pattern: [0, 3, 4, 7, 8, 11, 12, 15] },
    minimal_house: { energy: 0.4, brightness: 0.5, complexity: 0.3, pattern: [0, 2, 4, 6, 8, 10, 12, 14] },
    
    // PRECHORUS / BUILD
    build_up: { energy: 0.5, brightness: 0.5, complexity: 0.5, pattern: [0, 2, 4, 6, 8, 10, 12, 14] },
    riser_pattern: { energy: 0.6, brightness: 0.6, complexity: 0.5, pattern: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
    tension_groove: { energy: 0.5, brightness: 0.4, complexity: 0.4, pattern: [0, 6, 8, 14] },
    breakbeat: { energy: 0.5, brightness: 0.4, complexity: 0.5, pattern: [0, 3, 4, 7, 8, 11, 12, 15] },
    minimal: { energy: 0.3, brightness: 0.3, complexity: 0.2, pattern: [0, 8] },
    
    // CHORUS / DROP
    anthem_drop: { energy: 0.8, brightness: 0.7, complexity: 0.5, pattern: [0, 4, 8, 12] },
    full_power: { energy: 0.9, brightness: 0.6, complexity: 0.6, pattern: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
    big_room: { energy: 0.9, brightness: 0.7, complexity: 0.4, pattern: [0, 4, 8, 12] },
    techno_loop: { energy: 0.7, brightness: 0.5, complexity: 0.6, pattern: [0, 2, 4, 6, 8, 10, 12, 14] },
    
    // OUTRO
    fade_out: { energy: 0.2, brightness: 0.3, complexity: 0.1, pattern: [0, 8] },
    ambient_outro: { energy: 0.1, brightness: 0.4, complexity: 0.1, pattern: [0] }
};

export function getDanceGroove(sectionType, energy, brightness, complexity) {
    const family = danceGrooves[sectionType] || danceGrooves.verse;
    
    const scoredGrooves = family.map(groove => {
        const chars = grooveCharacteristics[groove];
        if (!chars) return { name: groove, score: 0 };
        
        const energyDiff = Math.abs(energy - chars.energy);
        const brightnessDiff = Math.abs(brightness - chars.brightness);
        const complexityDiff = Math.abs(complexity - chars.complexity);
        
        let score = 1 - (energyDiff * 0.5 + brightnessDiff * 0.3 + complexityDiff * 0.2);
        return { name: groove, score: score };
    });
    
    scoredGrooves.sort((a, b) => b.score - a.score);
    return scoredGrooves[0].name;
}