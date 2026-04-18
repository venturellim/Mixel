// ==========================================
// pianoEngine.js — ver. 021 (SOLO ENGINE V1 + LH ACTIVE)
// ==========================================

import * as Tone from "https://esm.sh/tone";
import { piano, pianoInstruments, pianoVolumeMap, lhBus, rhBus } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("pianoEngine.js ver. 021 loaded");

export async function waitPianoInstruments() {
    await waitForInstruments(1);
}

// ─────────────────────────────────────────────
// SOLO ENGINE V1 — Minimal/Modern + Romantic
// (Integrato direttamente qui dentro)
// ─────────────────────────────────────────────

// Utility
const PU = {
    r() { return Math.random(); },
    ri(a,b){ return Math.floor(Math.random()*(b-a+1))+a; },
    ch(a){ return a[Math.floor(Math.random()*a.length)]; },
    clamp(v,a,b){ return Math.max(a,Math.min(b,v)); },
    dist(start,end,count){
        const step=(end-start)/count;
        return Array.from({length:count},(_,i)=>start+i*step);
    }
};

// Scale
const PScales = {
    major(r){ return [0,2,4,5,7,9,11].map(i=>r+i); },
    naturalMinor(r){ return [0,2,3,5,7,8,10].map(i=>r+i); },
    harmonicMinor(r){ return [0,2,3,5,7,8,11].map(i=>r+i); },
    pentatonic(r){ return [0,3,5,7,10].map(i=>r+i); },
    lydian(r){ return [0,2,4,6,7,9,11].map(i=>r+i); }
};

// Pattern melodici
const PMel = {
    lyrical: [
        [0,2,4,2,0],
        [0,3,5,3,0],
        [0,2,5,4,2]
    ],
    minimal: [
        [0,0,2,0],
        [0,3,0,5],
        [0,2,0,4]
    ],
    romantic: [
        [0,4,7,4,2],
        [0,5,9,5,2],
        [0,3,7,3,1]
    ],
    cinematic: [
        [0,5,7,12],
        [0,7,12,7],
        [0,4,7,11]
    ]
};

// Arpeggi
const PArp = {
    brokenChords: [
        [0,2,4,2],
        [0,4,7,4],
        [0,3,7,3]
    ],
    octaveMelody: [
        [0,12,0,12],
        [0,12,7,12],
        [0,12,5,12]
    ],
    wideChords: [
        [0,7,12],
        [0,5,12],
        [0,4,11]
    ]
};

// Densità
const PDensity = {
    maxNPS(e,c,b){
        let base=2.5;
        if(e>0.6) base+=1;
        if(c>0.6) base+=1;
        if(b>0.6) base+=0.5;
        return Math.min(5,base);
    }
};

// Rubato
const PTime = {
    rub(t,i,n,int){ return t + Math.sin((i/n)*Math.PI)*int; },
    hum(t,rand,a=0.015){ return t + (rand()*a*2 - a); }
};

// Espansione pattern
const PPhrase = {
    expand(pattern,scale,root,desired){
        const out=[];
        while(out.length<desired){
            for(let step of pattern){
                const idx=(step%scale.length+scale.length)%scale.length;
                out.push(scale[idx]+root);
                if(out.length>=desired) break;
            }
        }
        return out;
    },

    build(pattern,scale,root,phraseTime,maxNPS,params,rand){
        const maxNotes=Math.floor(phraseTime*maxNPS);
        const desired=PU.clamp(maxNotes,6,14);
        const notes=this.expand(pattern,scale,root,desired);
        const times=PU.dist(0,phraseTime,notes.length);

        const rub=params.complexity*0.04;
        const hum=params.texture*0.01;

        return notes.map((m,i)=>{
            let t=times[i];
            t=PTime.rub(t,i,notes.length,rub);
            t=PTime.hum(t,rand,hum);
            return {midi:m,relTime:t};
        });
    }
};

// Selettore frasi
const PSelect = {
    pick(params,rand){
        const {energy,complexity,texture}=params;

        if(texture>0.6 && rand()>0.3) return PU.ch(PArp.brokenChords);
        if(complexity>0.6 && rand()>0.4) return PU.ch(PMel.romantic);
        if(energy>0.6 && rand()>0.5) return PU.ch(PMel.cinematic);

        return PU.ch([...PMel.minimal,...PMel.lyrical]);
    },

    phrase(params,scale,root,phraseTime,rand){
        const pattern=this.pick(params,rand);
        const maxNPS=PDensity.maxNPS(params.energy,params.complexity,params.brightness);
        return PPhrase.build(pattern,scale,root,phraseTime,maxNPS,params,rand);
    }
};

// Sezioni interne
const PSections = [
    {type:"lyrical",pattern:"lyrical",scale:"naturalMinor"},
    {type:"minimal",pattern:"minimal",scale:"pentatonic"},
    {type:"arpeggio",pattern:"brokenChords",scale:"major"},
    {type:"octaveMelody",pattern:"octaveMelody",scale:"lydian"},
    {type:"finalCadence",pattern:"wideChords",scale:"harmonicMinor"}
];

// Tema
const PTheme = {
    pick(b,c){
        if(b>0.6) return PMel.lyrical[PU.ri(0,2)];
        if(c>0.6) return PMel.romantic[PU.ri(0,2)];
        return PMel.minimal[0];
    }
};

// Struttura solo
const PSoloStruct = {
    total(measures,md){ return measures*md; },
    count(total,e){
        let c=e>0.6?4:3;
        while(c*2>total) c--;
        return Math.max(1,c);
    },
    phraseTime(total,c){ return total/c; },
    filter(p){
        return PSections.filter(sec=>{
            if(p.brightness<0.3 && sec.type==="octaveMelody") return false;
            if(p.complexity<0.3 && sec.type==="arpeggio") return false;
            if(p.energy<0.3 && sec.type==="finalCadence") return false;
            return true;
        });
    }
};

// SOLO ENGINE
const PianoSoloV1 = {
    generate(section,progression,instruments,params,rand,measureDur,score){
        const {piano}=instruments;
        if(!piano) return;

        const p=params.imageParams;
        const total=PSoloStruct.total(section.measures,measureDur);
        const count=PSoloStruct.count(total,p.energy);
        const pTime=PSoloStruct.phraseTime(total,count);
        const usable=PSoloStruct.filter(p);

        const theme=PTheme.pick(p.brightness,p.complexity);
        const root=60;

        let phrases=[];

        for(let i=0;i<count;i++){
            const sec=usable[i%usable.length];
            const patternSet=(i===0)
                ? [theme]
                : PMel[sec.pattern] || PArp[sec.pattern] || PArp.wideChords;

            const pattern=PU.ch(patternSet);
            const scale=PScales[sec.scale](0);

            const phrase=PSelect.phrase(p,scale,root,pTime,rand);
            phrases.push({phrase});
        }

        let cursor=section.startTime;

        for(let ph of phrases){
            for(let n of ph.phrase){
                const abs=cursor+n.relTime;

                Tone.Transport.schedule(time=>{
                    const note=Tone.Frequency(n.midi,"midi").toNote();
                    piano.triggerAttackRelease(note,"8n",time,0.7);

                    Tone.Draw.schedule(()=>{
                        if(score) score.addNote("Lead",note,"SOLO");
                    },time);
                },abs);
            }
            cursor+=pTime;
        }
    }
};

// Wrapper
function schedulePianoLead(section,progression,instruments,params,rand,measureDur,score){
    const name=section.name.toLowerCase();
    if(!name.includes("solo")) return;
    PianoSoloV1.generate(section,progression,instruments,params,rand,measureDur,score);
}



// ─────────────────────────────────────────────
// PIANO ENGINE ORIGINALE + SOLO (LH attiva)
// ─────────────────────────────────────────────

function generateMotto(rand) {
    const motto = [];
    for (let i = 0; i < 4; i++) motto.push(Math.floor(rand() * 7)); 
    return motto;
}

function getLHPattern(sectionName, stepIdx, rand, complexity) {
    const patterns = {
        intro:  [1,0,0,0,0,0,0,0],
        verse:  [1,0,0,0,1,0,0,0],
        chorus: [1,0,1,0,1,0,1,0],
        outro:  [1,0,0,0,0,0,0,0]  
    };
    const base = patterns[sectionName] || patterns.verse;
    let hit = base[stepIdx];
    if (hit === 0 && complexity > 0.6 && (stepIdx === 2 || stepIdx === 6) && rand() > 0.8) hit = 0.6;
    return hit;
}

export async function createPianoEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const p = buildPianoParams(rand, params.imageParams);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = p.bpm;

    const structure = buildSongStructure(p.structure, p.bpm);
    const scale = buildScaleFromTonic(p.tonalCenter, p.scaleType);
    const measureDur = (60 / p.bpm) * 4;
    const step8n = measureDur / 8;

    const mottoIndices = generateMotto(rand); 
    let lastNoteIdx = 1; 

    const rubatoIntensity = params.imageParams.complexity * 0.05;
    const swingFactor = params.imageParams.saturation * 0.15;

    structure.sections.forEach(section => {

        const isSolo = section.name.toLowerCase().includes("solo");
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];

        // SOLO → mano destra = solo engine (LH continua)
        if (isSolo) {
            schedulePianoLead(section, sectionProg, { piano }, params, rand, measureDur, score);
        }

        // LH SEMPRE ATTIVA
        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            const isClosingMeasure = (m === section.measures - 1);

            sectionProg.forEach((degree, i) => {
                const chordStartTime = measureStartTime + (i * (measureDur / sectionProg.length));
                
                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ].map(n => Tone.Frequency(n).transpose(section.name === "chorus" ? 12 : 0).toNote());

                const mottoNotes = mottoIndices.map(idx => 
                    Tone.Frequency(getScaleDegree(scale, degreeToIndex(degree) + idx)).transpose(12).toNote()
                );

                for (let s = 0; s < 8; s++) {
                    const isEvenStep = s % 2 !== 0;
                    const swingOffset = isEvenStep ? (step8n * swingFactor) : 0;
                    const waveRubato = Math.sin((s / 8) * Math.PI) * rubatoIntensity;
                    const ritardando = (isClosingMeasure && s > 4) ? (s - 4) * 0.03 : 0;

                    const stepTime = chordStartTime + (s * step8n) + swingOffset + waveRubato + ritardando;
                    
                    // LH (sempre attiva)
                    const lhHit = getLHPattern(section.name, s, rand, p.complexity);
                    if (lhHit > 0) {
                        const isFirstHit = s === 0;
                        const noteLH = Tone.Frequency(chordNotes[0]).transpose(isFirstHit ? -24 : -12).toNote();

                        Tone.Transport.schedule((time) => {
                            const vel = 0.4 * lhHit * lhBus.gain.value;
                            piano.triggerAttackRelease(noteLH, isFirstHit ? "1n" : "2n", time, vel);
                            
                            Tone.Draw.schedule(() => {
                                if (score) score.addNote("Rhythm", noteLH, section.name);
                            }, time);
                        }, stepTime);
                    }

                    // RH NORMALE SOLO SE NON È SOLO
                    if (isSolo) continue;

                    let noteToPlay = null;
                    let rhVel = 0.5;

                    if (["intro","outro","prechorus"].includes(section.name)) {
                        if (s % 2 === 0) { 
                            noteToPlay = mottoNotes[(s / 2) % mottoNotes.length];
                            rhVel = 0.6;
                        }
                    } else {
                        if (rand() > 0.4) {
                            const move = rand() > 0.5 ? 1 : -1;
                            lastNoteIdx = Math.max(0, Math.min(2, lastNoteIdx + move));
                            noteToPlay = chordNotes[lastNoteIdx];
                            rhVel = 0.45;
                        }
                    }

                    if (noteToPlay) {
                        const accent = (s === 0 || s === 4) ? 1.2 : 0.8;
                        const microDelay = rand() * 0.01;

                        Tone.Transport.schedule((time) => {
                            const t = time + microDelay;
                            piano.triggerAttackRelease(noteToPlay, "1n", t, rhVel * accent * rhBus.gain.value);
                            
                            Tone.Draw.schedule(() => {
                                if (score) score.addNote("Lead", noteToPlay, section.name);
                            }, t);
                        }, stepTime);
                    }
                }
            });
        }
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => { 
            if (Tone.context.state !== 'running') Tone.context.resume();
            piano.releaseAll();
            Tone.Transport.start("+0.1"); 
        },
        pause: () => Tone.Transport.pause(),
        stop: () => { 
            Tone.Transport.stop(); 
            Tone.Transport.cancel(); 
            piano.releaseAll();
        },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { instruments: pianoInstruments, volumeMap: pianoVolumeMap }
    };
}

function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6, "bVII":6 };
    return map[degree] || 0;
}
