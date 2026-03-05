// metal.js

import * as Tone from "https://esm.sh/tone";

import { createInstruments, analyzeImageBrightness } from "./common.js";

export async function createMetalEngineFromImage(imgElement) {

    Tone.Transport.cancel();
    Tone.Transport.stop();

    Tone.Transport.bpm.value = 150;

    const instruments = await createInstruments();

    const {
        guitarPalm,
        guitarOpen,
        guitarLead,
        bass,
        drums
    } = instruments;

    const brightness = analyzeImageBrightness(imgElement);

    const dna = Math.floor(brightness * 1000000000);

    const scale = [
        "E2","Gb2","G2","A2","B2","C3","D3"
    ];

    function generatePattern(seed, length) {

        const pattern = [];

        for (let i = 0; i < length; i++) {

            const index = (seed >> (i * 3)) & 7;

            pattern.push(index % scale.length);

        }

        return pattern;

    }

    const riffVerse = generatePattern(dna, 16);
    const riffChorus = generatePattern(dna * 3, 16);
    const riffSolo = generatePattern(dna * 7, 32);

    const leadVerse = generatePattern(dna * 5, 8);
    const leadChorus = generatePattern(dna * 9, 8);

    const sections = [
        { name:"intro", bars:4 },
        { name:"verse", bars:8 },
        { name:"chorus", bars:8 },
        { name:"verse", bars:8 },
        { name:"chorus", bars:8 },
        { name:"solo", bars:8 },
        { name:"chorusFinal", bars:8 },
        { name:"outro", bars:4 }
    ];

    const totalBars = sections.reduce((a,b)=>a+b.bars,0);

    let currentBar = 0;
    let step = 0;

    const loop = new Tone.Loop((time)=>{

        const barPosition = Math.floor(step / 8);

        let sectionName = "verse";

        let acc = 0;

        for(const s of sections){

            if(barPosition < acc + s.bars){

                sectionName = s.name;
                break;

            }

            acc += s.bars;

        }

        let riff;

        if(sectionName === "verse") riff = riffVerse;
        else if(sectionName === "chorus") riff = riffChorus;
        else if(sectionName === "solo") riff = riffSolo;
        else if(sectionName === "chorusFinal") riff = riffChorus;
        else riff = riffVerse;

        const note = scale[riff[step % riff.length]];

        const fifth = Tone.Frequency(note).transpose(7).toNote();
        const octave = Tone.Frequency(note).transpose(12).toNote();

        if(sectionName === "intro"){

            guitarOpen.triggerAttackRelease(
                [note,fifth],
                "8n",
                time
            );

        }

        if(sectionName === "verse"){

            guitarPalm.triggerAttackRelease(
                [note,fifth],
                "8n",
                time
            );

        }

        if(sectionName === "chorus" || sectionName === "chorusFinal"){

            guitarOpen.triggerAttackRelease(
                [note,fifth,octave],
                "8n",
                time
            );

        }

        if(sectionName === "solo"){

            const soloNote = scale[riffSolo[step % riffSolo.length]];

            guitarLead.triggerAttackRelease(
                Tone.Frequency(soloNote).transpose(12).toNote(),
                "16n",
                time
            );

        }

        bass.triggerAttackRelease(
            note,
            "8n",
            time
        );

        drums.player("kick").start(time);

        if(step % 4 === 2)
            drums.player("snare").start(time);

        if(sectionName === "chorus" || sectionName === "chorusFinal")
            drums.player("crash").start(time);

        if(brightness > 0.6)
            drums.player("ride").start(time);
        else
            drums.player("hihat").start(time);

        if(sectionName === "solo" && Math.random() > 0.8){

            drums.player("tom1").start(time);
            drums.player("tom2").start(time + 0.05);
            drums.player("tom3").start(time + 0.1);

        }

        step++;

    }, "8n");

    loop.start(0);

    function play(){

        Tone.Transport.start();

    }

    function pause(){

        Tone.Transport.pause();

    }

    function stop(){

        Tone.Transport.stop();
        Tone.Transport.seconds = 0;

    }

    function seek(sec){

        Tone.Transport.seconds = sec;

    }

    const totalDuration = Tone.Time(totalBars + "m").toSeconds();

    return {

        play,
        pause,
        stop,
        seek,
        totalDuration

    };

}