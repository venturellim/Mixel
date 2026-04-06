// metalLeadEngine.js — ver. 001
import * as Tone from "https://esm.sh/tone";

console.log("metalLeadEngine.js ver. 001 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead, keyboardLead, keyboardPad } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isSolo = section.name.toLowerCase().includes("solo") || section.name.toLowerCase().includes("bridge");
    const stepTime = measureDur / 16;
    
    // Parametri DNA
    const { brightness = 0.5, complexity = 0.5 } = params.imageParams;

    // Scale Power Metal (Minore Naturale / Minore Armonica)
    const scale = ["A", "B", "C", "D", "E", "F", "G#"]; // Minore Armonica per il gusto Tolkki/Johansson

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];

        // --- 1. IL "CANTO" (Verse & Chorus) ---
        if (!isSolo) {
            // Nel Verse/Chorus la lead fa note lunghe e "respira" (una frase ogni 2 misure)
            if (m % 2 === 0) {
                // Scegliamo una nota della triade dell'accordo per farla "cantare" bene
                const melodyNote = currentRoot + (isChorus ? "5" : "4"); // Più alta nel Chorus
                
                Tone.Transport.schedule(time => {
                    // Chitarra Lead con sustain
                    guitarLead.triggerAttackRelease(melodyNote, "1n", time);
                    
                    // Se la foto è "bright", aggiungiamo il Pad di tastiera per l'effetto orchestrale
                    if (isChorus || brightness > 0.6) {
                        keyboardPad.triggerAttackRelease(melodyNote, "1n", time, 0.4);
                    }
                }, measureStartTime);

                // Aggiungiamo una piccola risposta melodica a metà misura
                Tone.Transport.schedule(time => {
                    const responseNote = scale[rand() > 0.5 ? 2 : 4] + (isChorus ? "5" : "4");
                    guitarLead.triggerAttackRelease(responseNote, "2n", time);
                }, measureStartTime + (measureDur / 2));
            }
        } 
        
        // --- 2. L'ASSOLO (The Shredder) ---
        else {
            // Qui scateniamo la tecnica con scale e unisono Chitarra + Tastiera
            for (let s = 0; s < 16; s++) {
                // Non suoniamo su ogni singolo step per non fare confusione, 
                // ma creiamo dei "cluster" di velocità
                if (s % 2 === 0 && rand() < 0.7) {
                    const absoluteTime = measureStartTime + (s * stepTime);
                    const noteIndex = Math.floor(rand() * scale.length);
                    const soloNote = scale[noteIndex] + (s > 8 ? "5" : "4");

                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(soloNote, "16n", time);
                        
                        // Il classico "Unisono" Stratovarius: Chitarra + Tastiera Lead
                        if (complexity > 0.5) {
                            keyboardLead.triggerAttackRelease(soloNote, "16n", time, 0.3);
                        }
                    }, absoluteTime);
                }
            }
        }
    }
}
