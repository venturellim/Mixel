// metalInstruments.js — ver. 012
import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded, logNote } from "../../common.js";

console.log("metalInstruments.js ver. 014 loaded");

// ============================================================
// 🎚 BUS SPECIFICI DEL METAL
// ============================================================
export const guitarBus = new Tone.Gain(1);
export const bassBus = new Tone.Gain(1);
export const drumBus = new Tone.Gain(1);
export const leadBus = new Tone.Gain(1);
export const acousticBus = new Tone.Gain(1);
export const stringBus = new Tone.Gain(1);



const guitarEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const bassEQ   = new Tone.EQ3({ low: 4, mid: -2, high: -4 });
const drumEQ   = new Tone.EQ3({ low: 2, mid: 1, high: 3 });
const leadEQ   = new Tone.EQ3({ low: -3, mid: 2, high: 6 });
const padEQ = new Tone.EQ3({ low: -2, mid: -1, high: 2 });
const acousticEQ = new Tone.EQ3({ low: -2, mid: -1, high: 2 });

const drumComp = new Tone.Compressor({
    threshold: -18,
    ratio: 4,
    attack: 0.01,
    release: 0.2
});

// --- RIVERBERO ---
const hallReverb = new Tone.Reverb({
    decay: 2.8,
    preDelay: 0.01,
    wet: 0.35
}).toDestination();

// Routing bus → EQ → master
guitarBus.connect(guitarEQ).connect(masterEQ);
bassBus.connect(bassEQ).connect(masterEQ);
drumBus.connect(drumEQ).connect(drumComp).connect(masterEQ);
leadBus.connect(leadEQ).connect(masterEQ);
stringBus.connect(padEQ).connect(hallReverb).connect(masterEQ);
acousticBus.connect(acousticEQ).connect(masterEQ);

// ============================================================
// 🎸 FIX CHITARRE RITMICHE: CABINET & STEREO HAAS
// ============================================================
const guitarCabinet = new Tone.Filter({
    type: "lowpass",
    frequency: 4200, 
    rolloff: -24
});

const stereoDelay = new Tone.Delay(0.012); 
const panL = new Tone.Panner(-0.3);
const panR = new Tone.Panner(0.3);

const guitarFX = new Tone.Gain();
guitarFX.connect(guitarCabinet);
guitarCabinet.connect(panL).connect(guitarBus);
guitarCabinet.connect(stereoDelay).connect(panR).connect(guitarBus);

// ============================================================
// 🎸 FIX CHITARRA LEAD: CABINET, DELAY & VIBRATO
// ============================================================
const leadCabinet = new Tone.Filter({
    type: "lowpass",
    frequency: 5200, 
    rolloff: -24
}).connect(leadBus);

const leadDelay = new Tone.FeedbackDelay({
    delayTime: "8n",
    feedback: 0.2,
    wet: 0.12
}).connect(leadCabinet);

const leadVibrato = new Tone.Vibrato({
    frequency: 5,
    depth: 0.1
}).connect(leadDelay);

// ============================================================
// 🎸 STRUMENTI (SAMPLERS)
// ============================================================

// SO TRUE STRING PAD 

export function createStStringPad() {

    // 1) CREA IL SAMPLER
    const pad = new Tone.Sampler({
        urls: {  
            A0: "Samples/StringEssemble/A0.mp3", 
            A1: "Samples/StringEssemble/A1.mp3", 
            A2: "Samples/StringEssemble/A2.mp3", 
            A3: "Samples/StringEssemble/A3.mp3", 
            A4: "Samples/StringEssemble/A4.mp3",
            A5: "Samples/StringEssemble/A5.mp3",
            C0: "Samples/StringEssemble/C0.mp3", 
            C1: "Samples/StringEssemble/C1.mp3", 
            C2: "Samples/StringEssemble/C2.mp3", 
            C3: "Samples/StringEssemble/C3.mp3", 
            C4: "Samples/StringEssemble/C4.mp3",
            C5: "Samples/StringEssemble/C5.mp3",
            C6: "Samples/StringEssemble/C6.mp3",
            "D#0": "Samples/StringEssemble/Ds0.mp3", 
            "D#1": "Samples/StringEssemble/Ds1.mp3", 
            "D#2": "Samples/StringEssemble/Ds2.mp3", 
            "D#3": "Samples/StringEssemble/Ds3.mp3", 
            "D#4": "Samples/StringEssemble/Ds4.mp3",
            "D#5": "Samples/StringEssemble/Ds5.mp3",
            "F#0": "Samples/StringEssemble/Fs0.mp3", 
            "F#1": "Samples/StringEssemble/Fs1.mp3", 
            "F#2": "Samples/StringEssemble/Fs2.mp3", 
            "F#3": "Samples/StringEssemble/Fs3.mp3", 
            "F#4": "Samples/StringEssemble/Fs4.mp3",
            "F#5": "Samples/StringEssemble/Fs5.mp3"
        },
        release: 1.2,
        onload: () => { 
            registerInstrumentLoaded("So true String");
            pad.set({
                envelope: {
                    attack: 1.5,
                    decay: 0.5,
                    sustain: 1.0,
                    release: 2.5
                }
            });
        }
    });

    // 2) ROUTING DI BASE
    pad.connect(stringBus);
    
    // ============================================================
    // 🎹 PAD EFFECTS — creati UNA SOLA VOLTA
    // ============================================================

    // FILTER
    pad._padFilter = new Tone.Filter({
        type: "lowpass",
        frequency: 800,
        rolloff: -12
    }).connect(stringBus);

    pad.disconnect();
    pad.connect(pad._padFilter);

    // FILTER LFO
    pad._padFilterLFO = new Tone.LFO({
        frequency: 0.04,
        min: 400,
        max: 1200
    }).start();
    pad._padFilterLFO.connect(pad._padFilter.frequency);

    // VIBRATO
    pad._padVibrato = new Tone.Vibrato({
        frequency: 5,
        depth: 0.05
    }).connect(pad._padFilter);

    pad.disconnect();
    pad.connect(pad._padVibrato);

    // PAN
    pad._padPan = new Tone.Panner(0).connect(pad._padVibrato);
    pad.disconnect();
    pad.connect(pad._padPan);

    // PAN LFO
    pad._padPanLFO = new Tone.LFO({
        frequency: 0.02,
        min: -0.2,
        max: 0.2
    }).start();
    pad._padPanLFO.connect(pad._padPan.pan);

    return pad;
}
    
export function createShimmerMajor() {
    const sampler = new Tone.Sampler({
        urls: {
            C2: "Samples/Shimmer/C2.mp3",
            D2: "Samples/Shimmer/D2.mp3",
            E2: "Samples/Shimmer/E2.mp3",
            F2: "Samples/Shimmer/F2.mp3",
            G2: "Samples/Shimmer/G2.mp3",
            A2: "Samples/Shimmer/A2.mp3",
            B2: "Samples/Shimmer/B2.mp3",
            "C#2": "Samples/Shimmer/Cs2.mp3",
            "D#2": "Samples/Shimmer/Ds2.mp3",
            "F#2": "Samples/Shimmer/Fs2.mp3",
            "G#2": "Samples/Shimmer/Gs2.mp3",
            "A#2": "Samples/Shimmer/As2.mp3"
        },
        release: 1.2,
        onload: () => { 
            registerInstrumentLoaded("Shimmer (Maggiore)");
            sampler.set({
                envelope: {
                    attack: 1.5,
                    decay: 0.5,
                    sustain: 1.0,
                    release: 2.5
                }
            });
        }
    });
    
    return sampler;
}

export function createShimmerMinor() {
    const sampler = new Tone.Sampler({
        urls: {
            C2: "Samples/Shimmer/Cm2.mp3",
            D2: "Samples/Shimmer/Dm2.mp3",
            E2: "Samples/Shimmer/Em2.mp3",
            F2: "Samples/Shimmer/Fm2.mp3",
            G2: "Samples/Shimmer/Gm2.mp3",
            A2: "Samples/Shimmer/Am2.mp3",
            B2: "Samples/Shimmer/Bm2.mp3",
            "C#2": "Samples/Shimmer/Csm2.mp3",
            "D#2": "Samples/Shimmer/Dsm2.mp3",
            "F#2": "Samples/Shimmer/Fsm2.mp3",
            "G#2": "Samples/Shimmer/Gsm2.mp3",
            "A#2": "Samples/Shimmer/Asm2.mp3"
        },
        release: 1.2,
        onload: () => { 
            registerInstrumentLoaded("Shimmer (Minore)");
            sampler.set({
                envelope: {
                    attack: 1.5,
                    decay: 0.5,
                    sustain: 1.0,
                    release: 2.5
                }
            });
        }
    });
    
    return sampler;
}
    
export function createAcousticGuitar() {

    const sampler = new Tone.Sampler({
        urls: {
            "E2": "Samples/AcousticGuitar/E2.mp3", "F2": "Samples/AcousticGuitar/F2.mp3", "F#2": "Samples/AcousticGuitar/Fs2.mp3", "G2": "Samples/AcousticGuitar/G2.mp3", "G#2": "Samples/AcousticGuitar/Gs2.mp3",
            "A2": "Samples/AcousticGuitar/A2.mp3", "A#2": "Samples/AcousticGuitar/As2.mp3", "B2": "Samples/AcousticGuitar/B2.mp3", "C3": "Samples/AcousticGuitar/C3.mp3", "C#3": "Samples/AcousticGuitar/Cs3.mp3",
            "D3": "Samples/AcousticGuitar/D3.mp3", "D#3": "Samples/AcousticGuitar/Ds3.mp3", "E3": "Samples/AcousticGuitar/E3.mp3", "F3": "Samples/AcousticGuitar/F3.mp3", "G3": "Samples/AcousticGuitar/G3.mp3",
            "G#3": "Samples/AcousticGuitar/Gs3.mp3", "A3": "Samples/AcousticGuitar/A3.mp3", "A#3": "Samples/AcousticGuitar/As3.mp3", "B3": "Samples/AcousticGuitar/B3.mp3", "C4": "Samples/AcousticGuitar/C4.mp3",
            "C#4": "Samples/AcousticGuitar/Cs4.mp3", "D4": "Samples/AcousticGuitar/D4.mp3", "D#4": "Samples/AcousticGuitar/Ds4.mp3", "E4": "Samples/AcousticGuitar/E4.mp3", "F4": "Samples/AcousticGuitar/F4.mp3",
            "F#4": "Samples/AcousticGuitar/Fs4.mp3", "G4": "Samples/AcousticGuitar/G4.mp3", "G#4": "Samples/AcousticGuitar/Gs4.mp3", "A4": "Samples/AcousticGuitar/A4.mp3", "A#4": "Samples/AcousticGuitar/As4.mp3",
            "B4": "Samples/AcousticGuitar/B4.mp3", "C5": "Samples/AcousticGuitar/C5.mp3", "C#5": "Samples/AcousticGuitar/Cs5.mp3", "D5": "Samples/AcousticGuitar/D5.mp3", "D#5": "Samples/AcousticGuitar/Ds5.mp3",
            "E5": "Samples/AcousticGuitar/E5.mp3", "F5": "Samples/AcousticGuitar/F5.mp3", "F#5": "Samples/AcousticGuitar/Fs5.mp3", "G5": "Samples/AcousticGuitar/G5.mp3", "G#5": "Samples/AcousticGuitar/Gs5.mp3",
            "A#5": "Samples/AcousticGuitar/As5.mp3", "B5": "Samples/AcousticGuitar/B5.mp3"
        },
        release: 1.2,
        onload: () => registerInstrumentLoaded("Chitarra Acustica")
    }).connect(acousticBus);

    return sampler;
}

export function createAcousticChordMajor() {
    const sampler = new Tone.Sampler({
        urls: {
            C2: "Samples/AcousticGuitar/Chord/C2.mp3",
            D2: "Samples/AcousticGuitar/Chord/D2.mp3",
            E2: "Samples/AcousticGuitar/Chord/E2.mp3",
            F2: "Samples/AcousticGuitar/Chord/F2.mp3",
            G2: "Samples/AcousticGuitar/Chord/G2.mp3",
            A2: "Samples/AcousticGuitar/Chord/A2.mp3",
            B2: "Samples/AcousticGuitar/Chord/B2.mp3"
        },
        release: 1.2,
        onload: () => registerInstrumentLoaded("Chitarra Acustica Accordi (Maggiori)")
    }).connect(acousticBus);

    return sampler;
}

export function createAcousticChordMinor() {
    const sampler = new Tone.Sampler({
        urls: {
            C2: "Samples/AcousticGuitar/Chord/Cm2.mp3",
            D2: "Samples/AcousticGuitar/Chord/Dm2.mp3",
            E2: "Samples/AcousticGuitar/Chord/Em2.mp3",
            F2: "Samples/AcousticGuitar/Chord/Fm2.mp3",
            G2: "Samples/AcousticGuitar/Chord/Gm2.mp3",
            A2: "Samples/AcousticGuitar/Chord/Am2.mp3",
            B2: "Samples/AcousticGuitar/Chord/Bm2.mp3"
        },
        release: 1.2,
        onload: () => registerInstrumentLoaded("Chitarra Acustica Accordi (Minori)")
    }).connect(acousticBus);

    return sampler;
}
 
export function createGuitarPalm() {

    const sampler = new Tone.Sampler({
        urls: {
            C2: "Samples/GuitarPalm/C.mp3",
            D2: "Samples/GuitarPalm/D.mp3",
            E2: "Samples/GuitarPalm/E.mp3",
            F2: "Samples/GuitarPalm/F.mp3",
            G2: "Samples/GuitarPalm/G.mp3",
            A2: "Samples/GuitarPalm/A.mp3",
            B2: "Samples/GuitarPalm/B.mp3"
        },
        attack: 0.015,
        release: 0.6,
        onload: () => registerInstrumentLoaded("Chitarra Palm")
    }).connect(guitarFX);

    return sampler;
}

export function createGuitarOpen() {

    const sampler = new Tone.Sampler({
        urls: {
            C2: "Samples/GuitarOpen/C.mp3",
            D2: "Samples/GuitarOpen/D.mp3",
            E2: "Samples/GuitarOpen/E.mp3",
            F2: "Samples/GuitarOpen/F.mp3",
            G2: "Samples/GuitarOpen/G.mp3",
            A2: "Samples/GuitarOpen/A.mp3",
            B2: "Samples/GuitarOpen/B.mp3"
        },
        attack: 0.02,
        release: 1.2,
        onload: () => registerInstrumentLoaded("Chitarra Open")
    }).connect(guitarFX);

    return sampler;
}

export function createGuitarLead() {

    const sampler = new Tone.Sampler({
        urls: {
            C2: "Samples/GuitarLead/C2.mp3", D2: "Samples/GuitarLead/D2.mp3",
            E2: "Samples/GuitarLead/E2.mp3", F2: "Samples/GuitarLead/F2.mp3",
            "G#2": "Samples/GuitarLead/Gs2.mp3", A2: "Samples/GuitarLead/A2.mp3", B2: "Samples/GuitarLead/B2.mp3",

            C3: "Samples/GuitarLead/C3.mp3", D3: "Samples/GuitarLead/D3.mp3",
            E3: "Samples/GuitarLead/E3.mp3", F3: "Samples/GuitarLead/F3.mp3",
            "G#3": "Samples/GuitarLead/Gs3.mp3", G3: "Samples/GuitarLead/G3.mp3", B3: "Samples/GuitarLead/B3.mp3",

            "C#4": "Samples/GuitarLead/Cs4.mp3", D4: "Samples/GuitarLead/D4.mp3",
            E4: "Samples/GuitarLead/E4.mp3", F4: "Samples/GuitarLead/F4.mp3",
            "G#4": "Samples/GuitarLead/Gs4.mp3", G4: "Samples/GuitarLead/G4.mp3", B4: "Samples/GuitarLead/B4.mp3",

            C5: "Samples/GuitarLead/C5.mp3", D5: "Samples/GuitarLead/D5.mp3",
            F5: "Samples/GuitarLead/F5.mp3",
            "G#5": "Samples/GuitarLead/Gs5.mp3", "A#5": "Samples/GuitarLead/As5.mp3",
            B5: "Samples/GuitarLead/B5.mp3",

            "C#6": "Samples/GuitarLead/Cs6.mp3", D6: "Samples/GuitarLead/D6.mp3"
        },
        attack: 0.02,
        release: 0.8,
        onload: () => registerInstrumentLoaded("Chitarra Lead")
    }).connect(leadVibrato);

    return sampler;
}

export function createBass() {

    const sampler = new Tone.Sampler({
        urls: {
            C1: "Samples/Bass/C1.mp3", Db1: "Samples/Bass/Db1.mp3", D1: "Samples/Bass/D1.mp3",
            Eb1: "Samples/Bass/Eb1.mp3", E1: "Samples/Bass/E1.mp3", F1: "Samples/Bass/F1.mp3",
            Gb1: "Samples/Bass/Gb1.mp3", G1: "Samples/Bass/G1.mp3", Ab1: "Samples/Bass/Ab1.mp3",
            A1: "Samples/Bass/A1.mp3", Bb1: "Samples/Bass/Bb1.mp3", B1: "Samples/Bass/B1.mp3",
            C2: "Samples/Bass/C2.mp3"
        },
        onload: () => registerInstrumentLoaded("Basso")
    }).connect(bassBus);

       return sampler;
}

export function createDrums() {

    const players = new Tone.Players({
        urls: {
            kick: "Samples/Drums/kick.mp3", 
            snare: "Samples/Drums/snare.mp3",
            ghost: "Samples/Drums/ghost.mp3", 
            hihat: "Samples/Drums/hihatclosed.mp3",
            openhat: "Samples/Drums/hihatopen.mp3", 
            crash1: "Samples/Drums/crash1.mp3",
            crash2: "Samples/Drums/crash2.mp3", 
            tom1: "Samples/Drums/tom1.mp3",
            tom2: "Samples/Drums/tom2.mp3", 
            tom3: "Samples/Drums/tom3.mp3",
            tom4: "Samples/Drums/tom4.mp3", 
            ride: "Samples/Drums/ride.mp3",
            ridebell: "Samples/Drums/ridebell.mp3", 
            china: "Samples/Drums/china.mp3"
        },
        onload: () => registerInstrumentLoaded("Batteria")
    }).connect(drumBus);

    // Logging per ogni player
    [
        "kick","snare","ghost","hihat","openhat",
        "crash1","crash2","tom1","tom2","tom3","tom4",
        "ride","ridebell","china"
    ].forEach(key => {
        const p = players.player(key);
        if (p) {
            const orig = p.start.bind(p);
            p.start = (time, offset, dur) => {
                //logNote("drums."+key, "(sample)", time);
                return orig(time, offset, dur);
            };
        }
    });

    return players;
}

// ============================================================
// 🎸 METAL PACK — crea TUTTI gli strumenti solo quando serve
// ============================================================
export async function loadMetalPack() {
    // Creazione strumenti
    const guitarPalm = createGuitarPalm();
    const guitarOpen = createGuitarOpen();
    const guitarLead = createGuitarLead();
    const acousticGuitar = createAcousticGuitar();
    const acousticChordMajor = createAcousticChordMajor();
    const acousticChordMinor = createAcousticChordMinor();
    const bass = createBass();
    const drums = createDrums();
    const StStringPad = createStStringPad();
    const shimmerMajor = createShimmerMajor();
    const shimmerMinor = createShimmerMinor();

    return {
        guitarPalm,
        guitarOpen,
        guitarLead,
        acousticGuitar,
        acousticChordMajor,
        acousticChordMinor,
        bass,
        drums,
        StStringPad,
        shimmerMajor,
        shimmerMinor,

        // Bus
        guitarBus,
        bassBus,
        drumBus,
        leadBus,
        stringBus,
        acousticBus,

        // Utility
        setVolume
    };
}

// ============================================================
// ⚙️ FUNZIONI DI UTILITY
// ============================================================
export function setVolume(busName, dbValue) {
    const mixer = { 
        guitar: guitarBus, 
        bass: bassBus, 
        drums: drumBus, 
        lead: leadBus,
        pad: stringBus,
        acustica: acousticBus
    };
    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

// ============================================================
// VOLUMI DI DEFAULT
// ============================================================

guitarBus.gain.value = Tone.dbToGain(6);  // Chitarra ritmica
bassBus.gain.value = Tone.dbToGain(4);    // Basso
leadBus.gain.value = Tone.dbToGain(0);   // Lead
drumBus.gain.value = Tone.dbToGain(0);   // Batteria
stringBus.gain.value = Tone.dbToGain(0);   // String Pad
acousticBus.gain.value = Tone.dbToGain(4);   // Chitarra Acustica 

// metalInstruments.js
export function normalizeNote(note, instrument, isMinor = false) {
    if (!note || typeof note !== "string") return "C3";

    // Estrai root e ottava
    const match = note.match(/^([A-G][#b]?)(\d+)?$/);
    const targetRoot = match ? match[1] : "C";
    const targetOctave = match && match[2] ? parseInt(match[2]) : 4;

    // ============================================================
    // CHITARRA ACUSTICA (ACCORDI PRONTI)
    // ============================================================
    if (instrument === "acousticChord") {
        let root = targetRoot;
        // Converte diesis in formato file
        if (root === "F#") root = "Fs";
        if (root === "G#") root = "Gs";
        if (root === "A#") root = "As";
        if (root === "C#") root = "Cs";
        if (root === "D#") root = "Ds";
        
        // Aggiunge "m" se minore, altrimenti lascia invariato
        const suffix = isMinor ? "m" : "";
        return `${root}${suffix}2`;  // ottava 2 fissa per gli accordi
    }

    // ============================================================
    // SHIMMER PAD
    // ============================================================
    if (instrument === "shimmer") {
        let root = targetRoot;
        if (root === "F#") root = "Fs";
        if (root === "G#") root = "Gs";
        if (root === "A#") root = "As";
        if (root === "C#") root = "Cs";
        if (root === "D#") root = "Ds";
        
        const suffix = isMinor ? "m" : "";
        return `${root}${suffix}2`;
    }

    // ============================================================
    // CHITARRE RITMICHE (solo root, ottava 2)
    // ============================================================
    if (instrument === "guitarPalm" || instrument === "guitarOpen") {
        return targetRoot[0];
    }

    // ============================================================
    // CHITARRA LEAD (mantiene diesis, ottava variabile)
    // ============================================================
    if (instrument === "guitarLead") {
        let root = targetRoot;
        if (targetRoot.includes("#")) {
            // mantieni il diesis
        } else if (targetRoot.includes("b")) {
            root = targetRoot;
        }
        return root;
    }

    // ============================================================
    // CHITARRA ACUSTICA VECCHIA (legacy, per compatibilità)
    // ============================================================
    if (instrument === "acousticGuitar") {
        let octave = targetOctave;
        octave = Math.min(5, Math.max(2, octave));
        
        let root = targetRoot;
        if (targetRoot === "F#") root = "Fs";
        if (targetRoot === "G#") root = "Gs";
        if (targetRoot === "A#") root = "As";
        if (targetRoot === "C#") root = "Cs";
        if (targetRoot === "D#") root = "Ds";
        
        return root + octave;
    }

    // ============================================================
    // STRING PAD
    // ============================================================
    if (instrument === "StStringPad") {
        const roots = ["A", "C", "D#", "F#"];
        let root = targetRoot.toUpperCase();
        
        const flatToSharp = {
            "BB": "A#", "EB": "D#", "AB": "G#", "DB": "C#", "GB": "F#"
        };
        if (root.includes("B")) {
            root = flatToSharp[root] || root;
        }
        
        const semitone = n => ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"].indexOf(n);
        const targetSemi = semitone(root);
        
        let best = "C";
        let bestDist = Infinity;
        
        roots.forEach(r => {
            const dist = Math.abs(semitone(r) - targetSemi);
            if (dist < bestDist) {
                bestDist = dist;
                best = r;
            }
        });
        
        let octave = Math.min(5, Math.max(0, targetOctave));
        return best + octave;
    }

    // ============================================================
    // BASSO (converte # in bemolle, ottava 1-2)
    // ============================================================
    if (instrument === "bass") {
        let root = targetRoot;
        if (targetRoot.includes("#")) {
            const sharpToFlat = {
                "C#": "Db", "D#": "Eb", "F#": "Gb",
                "G#": "Ab", "A#": "Bb"
            };
            root = sharpToFlat[targetRoot] ?? targetRoot[0];
        }
        if (targetRoot.includes("b")) {
            root = targetRoot;
        }
        return root;
    }

    // ============================================================
    // DEFAULT (fallback sicuro)
    // ============================================================
    return targetRoot[0] + targetOctave;
}

export const metalVolumeMap = {
    guitar: "Chitarre",
    bass: "Basso",
    drums: "Batteria",
    lead: "Lead Solo",
    pad: "So True String Pad",
    acustica: "Chitarra Acustica"
};