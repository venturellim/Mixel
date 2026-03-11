// metalDrums.js — batteria sincronizzata con riffData, sezioni e timeSignature

import { drums } from "./common.js";
import * as Tone from "https://esm.sh/tone";

export function createDrumEngine(analysis, params, riffData, rand) {

    const beatsPerMeasure = riffData.beatsPerMeasure;
    const totalSteps = riffData.totalSteps;

    const energy = analysis.energy;
    const brightness = analysis.brightness;
    const texture = analysis.texture;
    const entropy = analysis.entropy;

    // ------------------------------------------------------------
    // Pattern per sezione
    // ------------------------------------------------------------
    function getKickDensity(section) {
        if (section === "intro")  return 0.2 + energy * 0.2;
        if (section === "verse")  return 0.4 + energy * 0.3;
        if (section === "chorus") return 0.6 + energy * 0.4;
        if (section === "solo")   return 0.3 + energy * 0.3;
        if (section === "outro")  return 0.15 + energy * 0.2;
        return 0.4;
    }

    function getSnareBeats(section) {
        if (beatsPerMeasure === 6) {
            // 6/8 → accenti su 3 e 6
            return [2, 5];
        }
        // 4/4 → accenti su 2 e 4
        return [1, 3];
    }

    function getCymbal(section) {
        if (section === "chorus") return brightness > 0.6 ? "openhat" : "ride";
        if (section === "verse")  return "hihat";
        if (section === "intro")  return "ride";
        if (section === "solo")   return "ride";
        if (section === "outro")  return "hihat";
        return "hihat";
    }

    function getCymbalRate(section) {
        if (section === "chorus") return "8n";
        if (section === "verse")  return "8n";
        if (section === "intro")  return "4n";
        if (section === "solo")   return "8n";
        if (section === "outro")  return "4n";
        return "8n";
    }

    // ------------------------------------------------------------
    // Fill generator
    // ------------------------------------------------------------
    function generateFill(stepInMeasure) {
        const events = [];

        if (entropy < 0.3) {
            if (stepInMeasure === beatsPerMeasure - 2) events.push("snare");
            if (stepInMeasure === beatsPerMeasure - 1) events.push("crash1");
            return events;
        }

        if (entropy < 0.6) {
            if (stepInMeasure === beatsPerMeasure - 4) events.push("tom2");
            if (stepInMeasure === beatsPerMeasure - 3) events.push("tom3");
            if (stepInMeasure === beatsPerMeasure - 1) events.push("crash2");
            return events;
        }

        if (stepInMeasure === beatsPerMeasure - 6) events.push("tom1");
        if (stepInMeasure === beatsPerMeasure - 5) events.push("tom2");
        if (stepInMeasure === beatsPerMeasure - 3) events.push("tom3");
        if (stepInMeasure === beatsPerMeasure - 2) events.push("tom4");
        if (stepInMeasure === beatsPerMeasure - 1) events.push("china");

        return events;
    }

    // ------------------------------------------------------------
    // ENGINE ritornato a metal.js
    // ------------------------------------------------------------
    return function drumEngine(time, step) {

        const idx = step % totalSteps;

        const section = riffData.sectionTimeline[idx];
        const chord = riffData.chordTimeline[idx];

        const stepInMeasure = idx % beatsPerMeasure;

        const kickDensity = getKickDensity(section);
        const snareBeats = getSnareBeats(section);
        const cymbal = getCymbal(section);
        const cymbalRate = getCymbalRate(section);

        // --------------------------------------------------------
        // Kick
        // --------------------------------------------------------
        if (rand() < kickDensity) {
            drums.player("kick").start(time);
        }

        // --------------------------------------------------------
        // Snare
        // --------------------------------------------------------
        if (snareBeats.includes(stepInMeasure)) {
            drums.player("snare").start(time);
        }

        // --------------------------------------------------------
        // Ghost notes (texture)
        // --------------------------------------------------------
        if (texture > 0.4 && rand() < texture * 0.3) {
            if (!snareBeats.includes(stepInMeasure)) {
                drums.player("ghost").start(time);
            }
        }

        // --------------------------------------------------------
        // Cymbals
        // --------------------------------------------------------
        if (cymbalRate === "16n") {
            drums.player(cymbal).start(time);
        } else if (cymbalRate === "8n" && stepInMeasure % 2 === 0) {
            drums.player(cymbal).start(time);
        } else if (cymbalRate === "4n" && stepInMeasure === 0) {
            drums.player(cymbal).start(time);
        }

        // --------------------------------------------------------
        // Fill at end of measure
        // --------------------------------------------------------
        if (stepInMeasure >= beatsPerMeasure - 6) {
            const fillEvents = generateFill(stepInMeasure);
            for (const f of fillEvents) {
                drums.player(f).start(time);
            }
        }
    };
}
