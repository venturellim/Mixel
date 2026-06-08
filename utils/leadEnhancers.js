// utils/leadEnhancers.js
// Tutti gli enhancer centralizzati + dispatcher unico

console.log("leadEnhancers.js ver. 001 loaded");

// Utility interna
const LeadUtils = {
    rand() { return Math.random(); },
    choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
};

// ============================================================
// ENHANCER RITMICI (interni, non esportati)
// ============================================================

function enhanceRhythmPattern(basePattern) {
    if (!Array.isArray(basePattern) || basePattern.length === 0) return basePattern;
    const result = [...basePattern];

    for (let i = 0; i < basePattern.length - 1; i++) {
        const a = basePattern[i];
        const b = basePattern[i + 1];
        const gap = b - a;
        if (gap >= 4 && LeadUtils.rand() < 0.5) {
            const mid = a + Math.floor(gap / 2);
            if (!result.includes(mid)) result.push(mid);
        }
    }
    return [...new Set(result)].sort((a, b) => a - b);
}

function enhanceRhythmGhostSteps(pattern) {
    if (!Array.isArray(pattern) || pattern.length < 2) return pattern;
    const out = [...pattern];

    if (Math.random() < 0.20) {
        const i = Math.floor(Math.random() * out.length);
        const ghost = out[i] - 1;
        if (ghost >= 0) out.push(ghost);
    }

    if (Math.random() < 0.20) {
        const i = Math.floor(Math.random() * out.length);
        const ghost = out[i] + 1;
        if (ghost <= 15) out.push(ghost);
    }

    return [...new Set(out)].sort((a, b) => a - b);
}

function addAnticipation(pattern, energy) {
    if (energy < 0.5) return pattern;
    if (pattern.length < 2) return pattern;

    const out = [...pattern];
    if (Math.random() < 0.25) {
        const last = out[out.length - 1];
        const prev = out[out.length - 2];
        const mid = Math.floor((last + prev) / 2);
        if (!out.includes(mid)) out.push(mid);
    }
    return out.sort((a, b) => a - b);
}

function addStrategicPause(pattern, energy) {
    if (energy > 0.7) return pattern;
    if (pattern.length < 3) return pattern;

    const out = [...pattern];
    if (Math.random() < 0.20) {
        out.splice(Math.floor(out.length / 2), 1);
    }
    return out;
}

function addPolyrhythmHint(pattern, complexity) {
    if (complexity < 0.7) return pattern;
    const out = [...pattern];
    [2, 6, 10].forEach(s => {
        if (Math.random() < 0.3 && !out.includes(s)) out.push(s);
    });
    return out.sort((a, b) => a - b);
}

function addGentleSwing(pattern, texture) {
    if (texture < 0.5) return pattern;
    return pattern.map(step =>
        step % 2 === 0 && Math.random() < 0.4 ? step - 0.5 : step
    );
}

function addGhostAccent(pattern, energy) {
    if (energy < 0.6) return pattern;
    const out = [...pattern];
    [1, 3, 5, 7, 9, 11, 13].forEach(s => {
        if (Math.random() < 0.15 && !out.includes(s)) out.push(s);
    });
    return out.sort((a, b) => a - b);
}

// ============================================================
// ENHANCER MELODICI (interni)
// ============================================================

function enhanceMelodyLine(base) {
    const out = [];
    for (let i = 0; i < base.length; i++) {
        const curr = base[i];
        const next = base[i + 1];
        out.push(curr);
        if (Math.random() < 0.25) out.push(curr);
        if (next !== undefined && Math.abs(next - curr) === 2 && Math.random() < 0.5) {
            out.push(curr + (next > curr ? 1 : -1));
        }
    }
    return out;
}

function enhanceMelodyMicroVariation(melody) {
    const out = [...melody];
    if (Math.random() < 0.20 && out.length > 2) {
        const i = Math.floor(Math.random() * (out.length - 1));
        [out[i], out[i + 1]] = [out[i + 1], out[i]];
    }
    return out;
}

function enhanceChromaticPassing(melody, energy) {
    if (energy < 0.6) return melody;
    const out = [];
    for (let i = 0; i < melody.length - 1; i++) {
        const curr = melody[i];
        const next = melody[i + 1];
        out.push(curr);
        if (Math.abs(next - curr) === 2 && Math.random() < 0.3) {
            out.push(curr + (next > curr ? 1 : -1));
        }
    }
    out.push(melody[melody.length - 1]);
    return out;
}

function addTrills(melody, complexity) {
    if (complexity < 0.6) return melody;
    const out = [];
    for (let i = 0; i < melody.length - 1; i++) {
        const curr = melody[i];
        const next = melody[i + 1];
        out.push(curr);
        if (Math.random() < 0.15 && Math.abs(next - curr) <= 2) {
            out.push(next, curr, next);
        }
    }
    out.push(melody[melody.length - 1]);
    return out;
}

function addBendEffect(melody, brightness) {
    if (brightness < 0.5) return melody;
    const out = [];
    for (let n of melody) {
        out.push(n);
        if (Math.random() < 0.1 && n < 7) out.push(n + 1, n);
    }
    return out;
}

function addSlideEffect(melody, texture) {
    if (texture < 0.5) return melody;
    const out = [];
    for (let i = 0; i < melody.length - 1; i++) {
        const curr = melody[i];
        const next = melody[i + 1];
        out.push(curr);
        if (Math.abs(next - curr) >= 3 && Math.random() < 0.2) {
            const step = next > curr ? 1 : -1;
            for (let n = curr + step; n !== next; n += step) out.push(n);
        }
    }
    out.push(melody[melody.length - 1]);
    return out;
}

function addOctaveDoubling(melody, brightness) {
    if (brightness < 0.6) return melody;
    const out = [];
    for (let n of melody) {
        out.push(n);
        if (Math.random() < 0.15 && n + 7 <= 12) out.push(n + 7);
    }
    return out;
}

function addMirrorInversion(melody, complexity) {
    if (complexity < 0.8) return melody;
    const max = Math.max(...melody);
    const min = Math.min(...melody);
    return melody.map(n => min + (max - n));
}

function addEchoEffect(melody, texture) {
    if (texture < 0.6) return melody;
    return [...melody, ...melody.slice(0, Math.min(3, melody.length / 3))];
}

function addScaleRunBetweenPeaks(melody, energy) {
    if (energy < 0.7) return melody;
    const out = [];
    for (let i = 0; i < melody.length - 1; i++) {
        const curr = melody[i];
        const next = melody[i + 1];
        out.push(curr);
        if (Math.abs(next - curr) > 2 && Math.random() < 0.3) {
            const step = next > curr ? 1 : -1;
            for (let n = curr + step; n !== next; n += step) out.push(n);
        }
    }
    out.push(melody[melody.length - 1]);
    return out;
}

// ============================================================
// VELOCITY + SHAPE (questi li esportiamo)
// ============================================================

export function computeLeadVelocity(noteIdx, duration, isSolo, isBridge) {
    let vel = 0.75;
    if (duration > 0.30) vel += 0.10;
    if (duration < 0.15) vel -= 0.10;
    if (noteIdx >= 5) vel += 0.05;
    if (noteIdx > 7) vel -= 0.10;
    if (isBridge) vel -= 0.05;
    if (isSolo && !isBridge) vel += 0.05;
    return Math.min(1, Math.max(0.3, vel));
}

export function shapeBridgeSolo(melody, pattern) {
    let outMelody = melody.filter((_, i) => i % 5 !== 0).map(n => Math.min(n, 7));
    outMelody = outMelody.filter((n, i, arr) => !(i > 0 && Math.abs(n - arr[i - 1]) > 3));
    if (Math.max(...outMelody) > 7) outMelody = outMelody.map(n => n - 7);

    const outPattern = pattern.filter(step => Number.isInteger(step));

    const last = outMelody[outMelody.length - 1];
    outMelody.push(last, last - 1 >= 0 ? last - 1 : last, last);

    return { melody: outMelody, pattern: outPattern };
}

// ============================================================
// DISPATCHER UNICO (questo è ciò che importeranno i generi)
// ============================================================

export function applyLeadEnhancer(sequence, enhancerName, params = {}) {
    const { energy = 0.5, brightness = 0.5, texture = 0.5, complexity = 0.5 } = params;

    switch (enhancerName) {
        case "enhanceRhythmPattern": return enhanceRhythmPattern(sequence);
        case "enhanceRhythmGhostSteps": return enhanceRhythmGhostSteps(sequence);
        case "addAnticipation": return addAnticipation(sequence, energy);
        case "addStrategicPause": return addStrategicPause(sequence, energy);
        case "addPolyrhythmHint": return addPolyrhythmHint(sequence, complexity);
        case "addGentleSwing": return addGentleSwing(sequence, texture);
        case "addGhostAccent": return addGhostAccent(sequence, energy);

        case "enhanceMelodyLine": return enhanceMelodyLine(sequence);
        case "enhanceMelodyMicroVariation": return enhanceMelodyMicroVariation(sequence);
        case "enhanceChromaticPassing": return enhanceChromaticPassing(sequence, energy);
        case "addTrills": return addTrills(sequence, complexity);
        case "addBendEffect": return addBendEffect(sequence, brightness);
        case "addSlideEffect": return addSlideEffect(sequence, texture);
        case "addOctaveDoubling": return addOctaveDoubling(sequence, brightness);
        case "addMirrorInversion": return addMirrorInversion(sequence, complexity);
        case "addEchoEffect": return addEchoEffect(sequence, texture);
        case "addScaleRunBetweenPeaks": return addScaleRunBetweenPeaks(sequence, energy);

        default:
            console.warn("Enhancer sconosciuto:", enhancerName);
            return sequence;
    }
}

export function padMotionEnhancer(pad, time, params, rand) {
    return rand.range(0.75, 1.0);
}
