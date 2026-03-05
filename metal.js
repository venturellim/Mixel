// metal.js

import * as Tone from "https://cdn.skypack.dev/tone";
import {
guitarPalm,
guitarOpen,
guitarLead,
bass,
drums,
analyzeImageBrightness,
generateImageDNA
} from "./common.js";

export async function createMetalEngineFromImage(imgElement) {

Tone.Transport.cancel();
Tone.Transport.stop();

Tone.Transport.bpm.value = 150;

const brightness = analyzeImageBrightness(imgElement);
const dna = generateImageDNA(imgElement);

const modulation = (dna % 2) + 1;

const scale = [
"E2","Gb2","G2","A2","B2","C3","D3"
];

function generateRiff(dna) {

const pattern = [];

for (let i = 0; i < 16; i++) {

const index = (dna >> (i * 2)) & 7;
pattern.push(index % 7);

}

return pattern;

}

const riff = generateRiff(dna);

let step = 0;
let bar = 0;

function getSection() {

if (bar < 8) return "intro";
if (bar < 24) return "verse";
if (bar < 40) return "chorus";
if (bar < 56) return "verse2";
if (bar < 72) return "chorus2";
if (bar < 88) return "solo";
if (bar < 104) return "final_chorus";
return "outro";

}

const loop = new Tone.Loop((time) => {

const section = getSection();

let note = scale[riff[step % riff.length]];

if (section === "final_chorus") {

note = Tone.Frequency(note)
.transpose(modulation)
.toNote();

}

const fifth = Tone.Frequency(note).transpose(7).toNote();
const octave = Tone.Frequency(note).transpose(12).toNote();

if (section === "intro") {

guitarOpen.triggerAttackRelease(
[note, fifth],
"4n",
time
);

}

if (section === "verse" || section === "verse2") {

guitarPalm.triggerAttackRelease(
[note, fifth],
"8n",
time
);

}

if (section === "chorus" || section === "chorus2") {

guitarOpen.triggerAttackRelease(
[note, fifth, octave],
"8n",
time
);

}

if (section === "solo") {

guitarLead.triggerAttackRelease(
Tone.Frequency(note).transpose(12).toNote(),
"8n",
time
);

}

if (section === "final_chorus") {

guitarOpen.triggerAttackRelease(
[note, fifth, octave],
"8n",
time
);

guitarLead.triggerAttackRelease(
Tone.Frequency(note).transpose(12).toNote(),
"8n",
time
);

}

if (section === "outro") {

guitarOpen.triggerAttackRelease(
[note],
"4n",
time
);

}

bass.triggerAttackRelease(note,"8n",time);

drums.player("kick").start(time);

if (step % 4 === 2)
drums.player("snare").start(time);

if (section.includes("chorus"))
drums.player("ride").start(time);
else
drums.player("hihat").start(time);

if (step === 15) {

drums.player("tom1").start(time);
drums.player("tom2").start(time + 0.05);
drums.player("tom3").start(time + 0.1);
drums.player("tom4").start(time + 0.15);

bar++;

}

step++;

},"8n");

loop.start(0);

function play() {

Tone.Transport.start();

}

function pause() {

Tone.Transport.pause();

}

function stop() {

Tone.Transport.stop();
Tone.Transport.seconds = 0;

}

function seek(sec) {

Tone.Transport.seconds = sec;

}

return {
play,
pause,
stop,
seek,
totalDuration: 240
};

}