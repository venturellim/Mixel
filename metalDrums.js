// metalDrums.js — batteria con transizioni di sezione, fill intelligenti e pattern musicali

import { drums } from "./common.js";
import * as Tone from "https://esm.sh/tone";

export function createDrumEngine(analysis, params, riffData, rand) {

    const beatsPerMeasure = riffData.beatsPerMeasure;
    const totalSteps = riffData.totalSteps;

    // ------------------------------------------------------------
    // Pattern base per sezione
    // ------------------------------------------------------------
    function getCymbal(section) {
        if (section === "intro")  return "ride";
        if (section === "verse")  return "hihat";
        if (section === "chorus") return "openhat";
        if (section === "solo")   return "ride";
        if (section === "outro")  return "hihat";
        return "hihat";
    }

    function getCymbalRate(section) {
        if (section === "intro")  return "4n";
        if (section === "verse")  return "8n";
        if (section === "chorus") return "8n";
        if (section === "solo")   return "8n";
        if (section === "outro")  return "4n";
        return "8n";
    }

    function getKickDensity(section) {
        if (section === "intro")  return 0.3;
        if (section === "verse")  return 0.6;
        if (section === "chorus") return 0.85;
        if (section === "solo")   return 0.5;
        if (section === "outro")  return 0.4;
        return 0.6;
    }

    function getSnareBeats(section) {
        if (beatsPerMeasure === 6) return [2, 5];
        return [1, 3];
    }

    // ------------------------------------------------------------
    // Fill intelligenti (non casuali)
    // ------------------------------------------------------------
    function generateFill(stepInMeasure, section) {

        const events = [];

        // Fill più aggressivi prima del chorus
        if (section === "verse") {
            if (stepInMeasure === beatsPerMeasure - 4) events.push("tom2");
            if (stepInMeasure === beatsPerMeasure - 3) events.push("tom3");
            if (stepInMeasure === beatsPerMeasure - 2) events.push("snare");
            if (stepInMeasure === beatsPerMeasure - 1) events.push("crash1");
            return events;
        }

        // Fill più melodici prima del solo
        if (section === "chorus") {
            if (stepInMeasure === beatsPerMeasure - 4) events.push("tom1");
            if (stepInMeasure === beatsPerMeasure - 3) events.push("tom2");
            if (stepInMeasure === beatsPerMeasure - 2) events.push("tom3");
            if (stepInMeasure === beatsPerMeasure - 1) events.push("china");
            return events;
        }

        // Fill più semplici nell’outro
        if (section === "outro") {
            if (stepInMeasure === beatsPerMeasure - 2) events.push("snare");
            if (stepInMeasure === beatsPerMeasure - 1) events.push("crash2");
            return events;
        }

        return events;
    }

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------
    return function drumEngine(time, step) {

        const idx = step % totalSteps;

        const section = riffData.sectionTimeline[idx];
        const nextSection = riffData.sectionTimeline[idx + beatsPerMeasure];
        const stepInMeasure = idx % beatsPerMeasure;

        const cymbal = getCymbal(section);
        const cymbalRate = getCymbalRate(section);
        const kickDensity = getKickDensity(section);
        const snareBeats = getSnareBeats(section);

        // --------------------------------------------------------
        // CYMBALS
        // --------------------------------------------------------
        if (cymbalRate === "16n") {
            drums.player(cymbal).start(time);
        } else if (cymbalRate === "8n" && stepInMeasure % 1 === 0) {
            drums.player(cymbal).start(time);
        } else if (cymbalRate === "4n" && stepInMeasure === 0) {
            drums.player(cymbal).start(time);
        }

        // --------------------------------------------------------
        // KICK
        // --------------------------------------------------------
        if (rand() < kickDensity) {
            drums.player("kick").start(time);
        }

        // --------------------------------------------------------
        // SNARE
        // --------------------------------------------------------
        if (snareBeats.includes(stepInMeasure)) {
            drums.player("snare").start(time);
        }

        // --------------------------------------------------------
        // TRANSIZIONI DI SEZIONE
        // --------------------------------------------------------
        if (nextSection && nextSection !== section) {
            const fillEvents = generateFill(stepInMeasure, section);
            for (const f of fillEvents) {
                drums.player(f).start(time);
            }
        }
    };
}
