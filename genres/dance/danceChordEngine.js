// danceChordEngine.js — ver. 001 (Eurodance Chords)
import * as Tone from "https://esm.sh/tone";

console.log("danceChordEngine.js ver. 001 loaded");

// ------------------------------------------------------------
// CHORD ENGINE (Eurodance 1995–2005)
// ------------------------------------------------------------
export function scheduleDanceChords(
    section,
    progression,
    instruments,
    params,
    rand,
    measureDur,
    score
) {
    const { pad } = instruments;
    if (!pad) return;

    const name = section?.name?.toLowerCase() || "";
    const isIntro = name.includes("intro");
    const isBuild = name.includes("build");
    const isDrop  = name.includes("drop");
    const isRiff  = name.includes("riff");
    const isBreak = name.includes("break");
    const isOutro = name.includes("outro");

    const stepTime = measureDur / 16;

    // --------------------------------------------------------
    // GATING PATTERN (alla Gabry Ponte)
    // --------------------------------------------------------
    const gatePatternIntro = [0];
    const gatePatternBuild = [0, 4, 8, 12];
    const gatePatternDrop  = [0, 2, 4, 6, 8, 10, 12, 14];
    const gatePatternRiff  = [0, 4, 8, 12];
    const gatePatternBreak = [0];
    const gatePatternOutro = [0, 8];

    let gatePattern = gatePatternDrop;

    if (isIntro) gatePattern = gatePatternIntro;
    if (isBuild) gatePattern = gatePatternBuild;
    if (isRiff)  gatePattern = gatePatternRiff;
    if (isBreak) gatePattern = gatePatternBreak;
    if (isOutro) gatePattern = gatePatternOutro;

    // --------------------------------------------------------
    // LOOP MISURE
    // --------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {

        const measureStart = section.startTime + m * measureDur;

        const root = progression[m % progression.length];

        // ----------------------------------------------------
        // COSTRUZIONE ACCORDO EURODANCE
        // ----------------------------------------------------
        const rootNote   = `${root}3`;
        const thirdNote  = `${Tone.Frequency(rootNote).transpose(3).toNote()}`;
        const fifthNote  = `${Tone.Frequency(rootNote).transpose(7).toNote()}`;
        const octaveNote = `${Tone.Frequency(rootNote).transpose(12).toNote()}`;

        const chord = [rootNote, thirdNote, fifthNote, octaveNote];

        // Break → pad lungo
        if (isBreak) {
            Tone.Transport.schedule(t => {
                pad.triggerAttackRelease(chord, "1n", t, 0.7);
                if (score) chord.forEach(n => score.addNote("Chords", n, section.name));
            }, measureStart);
            continue;
        }

        // ----------------------------------------------------
        // GATING (alla Gabry Ponte)
        // ----------------------------------------------------
        gatePattern.forEach(step => {

            const absoluteTime = measureStart + step * stepTime;

            Tone.Transport.schedule(t => {
                pad.triggerAttackRelease(chord, "8n", t, isDrop ? 0.9 : 0.6);

                if (score) {
                    chord.forEach(n => score.addNote("Chords", n, section.name));
                }

            }, absoluteTime);
        });
    }
}
