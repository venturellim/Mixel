// funkyGrooves.js — Pattern ritmici per Funky
console.log("funkyGrooves.js ver. 001 loaded");

export const funkyGrooves = {
    intro: ["four_on_floor", "breakbeat_light"],
    verse: ["standard_funk", "syncopated_groove", "16th_rhythm"],
    prechorus: ["build_up", "tension_groove"],
    bridge: ["breakdown", "minimal_groove"],
    chorus: ["anthem_funk", "full_power"],
    solo: ["jazz_fusion", "open_groove"],
    outro: ["fade_out", "breakbeat"]
};

export const grooveCharacteristics = {
    // INTRO
    four_on_floor: { energy: 0.3, brightness: 0.4, complexity: 0.2, pattern: [0, 6, 8, 14] },
    breakbeat_light: { energy: 0.3, brightness: 0.4, complexity: 0.3, pattern: [0, 4, 8, 12] },
    
    // VERSE
    standard_funk: { energy: 0.5, brightness: 0.5, complexity: 0.4, pattern: [0, 4, 8, 12, 14] },
    syncopated_groove: { energy: 0.6, brightness: 0.5, complexity: 0.5, pattern: [0, 3, 4, 7, 8, 11, 12, 15] },
    "16th_rhythm": { energy: 0.5, brightness: 0.5, complexity: 0.4, pattern: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
    
    // PRECHORUS
    build_up: { energy: 0.6, brightness: 0.5, complexity: 0.5, pattern: [0, 2, 4, 6, 8, 10, 12, 14] },
    tension_groove: { energy: 0.5, brightness: 0.4, complexity: 0.4, pattern: [0, 6, 8, 14] },
    
    // BRIDGE
    breakdown: { energy: 0.3, brightness: 0.3, complexity: 0.2, pattern: [0, 8] },
    minimal_groove: { energy: 0.3, brightness: 0.3, complexity: 0.2, pattern: [0, 4, 8, 12] },
    
    // CHORUS
    anthem_funk: { energy: 0.8, brightness: 0.7, complexity: 0.5, pattern: [0, 4, 8, 12] },
    full_power: { energy: 0.9, brightness: 0.6, complexity: 0.6, pattern: [0, 2, 4, 6, 8, 10, 12, 14] },
    
    // SOLO
    jazz_fusion: { energy: 0.6, brightness: 0.5, complexity: 0.7, pattern: [0, 3, 6, 9, 12, 15] },
    open_groove: { energy: 0.5, brightness: 0.5, complexity: 0.5, pattern: [0, 4, 8, 12] },
    
    // OUTRO
    fade_out: { energy: 0.2, brightness: 0.3, complexity: 0.1, pattern: [0, 8] },
    breakbeat: { energy: 0.4, brightness: 0.4, complexity: 0.3, pattern: [0, 4, 8, 12] }
};

export function getFunkyGroove(sectionType, energy, brightness, complexity) {
    const family = funkyGrooves[sectionType] || funkyGrooves.verse;
    
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