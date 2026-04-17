// scoreUI.js — ver. 013.4
// Logica: Batteria 8.1 (precisa), Canali Xtra, ZigZag e No Ottave
// CORRETTO: note scorrono, etichette visibili

console.log("scoreUI.js ver. 013.7 loaded");

export class scoreVisualizer {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        
        this.canvas.style.display = "none";
        this.isVisible = false;
        this.currentGenre = "metal";
        this.notes = [];
        this.currentSection = "";

        this.bgImage = new Image();
        this.bgImage.src = "Pentagramma.jpg"; 
        this.imageLoaded = false;
        this.bgImage.onload = () => { this.imageLoaded = true; };

        this.closeBtn = document.createElement("button");
        this.closeBtn.innerHTML = "✕";
        this.closeBtn.className = "close-score-btn";
        this.closeBtn.style.display = "none";
        this.closeBtn.onclick = () => this.hide();

        this.themes = {
            metal: { 
                "Lead": "GT LEAD", "LeadXtra": "", 
                "Rhythm": "GT RHYTHM", "RhythmXtra": "",
                "Bass": "BASS", "BassXtra": "",
                "Drums": "DRUMS" 
            },
            orchestra: { 
                "Lead": "VIOLIN", "LeadXtra": "VIOLA", 
                "Rhythm": "HARPSICHORD", "RhythmXtra": "",
                "Bass": "DOUBLE BASS", "BassXtra": "CELLO",
                "Drums": "TIMPANI" 
            },
            piano: { 
                "Lead": "PIANO R", "LeadXtra": "", 
                "Rhythm": "PIANO L", "RhythmXtra": "" 
            }
        };

        this.initCanvas();
        window.addEventListener("resize", () => this.initCanvas());
    }

    setTheme(genre) {
        if (this.themes[genre]) {
            this.currentGenre = genre;
        }
    }

    cleanNoteLabel(note) {
        if (!note || typeof note !== 'string') return "";
        if (["Kick", "Snare", "HiHat", "Crash", "Timpano"].some(t => note.includes(t))) return note;
        return isNaN(parseInt(note[1])) ? note.substring(0, 2) : note.substring(0, 1);
    }

    initCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.id = "scoreCanvas"; 
        if (!this.canvas.parentElement) document.body.appendChild(this.canvas);
        if (!this.closeBtn.parentElement) document.body.appendChild(this.closeBtn);
        this.playheadX = this.canvas.width * 0.75;
        this.leftLimit = this.canvas.width * 0.12; 
    }

    show() {
        this.isVisible = true;
        this.canvas.style.display = "block";
        this.closeBtn.style.display = "flex";
        this.render(); 
    }

    hide() {
        this.isVisible = false;
        this.canvas.style.display = "none";
        this.closeBtn.style.display = "none";
        this.notes = []; 
    }

    addNote(track, note, section) {
        this.currentSection = section;
        if (this.notes.length > 500) this.notes.shift();
        this.notes.push({
            x: this.playheadX,
            track: track,
            label: this.cleanNoteLabel(note),
            index: Date.now() + Math.random() 
        });
    }

    render() {
        if (!this.isVisible) return;
        const { ctx, canvas, playheadX, leftLimit, bgImage, imageLoaded } = this;
        const currentLabels = this.themes[this.currentGenre] || this.themes.metal;
        
        // Posizioni Y per ogni track (LE STESSE usate per disegnare le note)
        const tracksY = {
            "Lead": 0.22, "LeadXtra": 0.22,
            "Rhythm": 0.45, "RhythmXtra": 0.45,
            "Bass": 0.70, "BassXtra": 0.70,
            "Drums": 0.88
        };
        
        // Etichette per la visualizzazione a sinistra
        const tracksDisplay = {
            "Lead": { y: 0.22, label: currentLabels["Lead"] },
            "LeadXtra": { y: 0.22, label: currentLabels["LeadXtra"] },
            "Rhythm": { y: 0.45, label: currentLabels["Rhythm"] },
            "RhythmXtra": { y: 0.45, label: currentLabels["RhythmXtra"] },
            "Bass": { y: 0.70, label: currentLabels["Bass"] },
            "BassXtra": { y: 0.70, label: currentLabels["BassXtra"] },
            "Drums": { y: 0.88, label: currentLabels["Drums"] }
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imageLoaded) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        // Scrive la sezione corrente
        if (this.currentSection) {
            ctx.fillStyle = "#ff0000"; 
            ctx.font = "bold 22px serif"; 
            ctx.textAlign = "left";
            ctx.fillText(this.currentSection.toUpperCase(), leftLimit + 20, canvas.height * 0.12); 
        }

        // Playhead (linea rossa)
        ctx.strokeStyle = "#ff000022";
        ctx.lineWidth = 2;
        ctx.beginPath(); 
        ctx.moveTo(playheadX, 0); 
        ctx.lineTo(playheadX, canvas.height); 
        ctx.stroke();
        
        // Scrive le etichette degli strumenti a DESTRA della playhead
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "left";
        
        // Etichette per ogni track, allineate a destra della playhead
        const labelOffsetX = playheadX + 15; // 15px dopo la playhead

        // Disegna tutte le note (scorrono verso sinistra)
        
        Object.keys(tracksY).forEach(trackName => {
            if (trackName === "Drums") {
                const label = currentLabels["Drums"];
                if (label && label !== "") {
                    const y = canvas.height * tracksY[trackName];
                    ctx.fillStyle = "#444";
                    ctx.fillText(label, labelOffsetX, y - 8);
                }
            } else {
                const baseTrack = trackName.replace("Xtra", "");
                const label = currentLabels[trackName];
                if (label && label !== "") {
                    const y = canvas.height * tracksY[trackName];
                    // Colore diverso per Xtra
                    ctx.fillStyle = trackName.includes("Xtra") ? "#000080" : "#444";
                    ctx.fillText(label, labelOffsetX, y - 8);
                }
            }
        });
        
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            const trackY_ratio = tracksY[n.track];
            if(!trackY_ratio) continue;
            
            let y = canvas.height * trackY_ratio;
            n.x -= 3.5; // SPOSTA LA NOTA A SINISTRA (scorrimento)

            if (n.x > leftLimit) {
                // --- BATTERIA ---
                if (n.track === "Drums") {
                    ctx.fillStyle = "#000";
                    if (n.label.includes("Kick"))  y += 6;
                    if (n.label.includes("Snare")) y -= 2;
                    if (n.label.includes("HiHat")) y -= 12;
                    if (n.label.includes("Crash")) y -= 22;

                    if (n.label.includes("Kick") || n.label.includes("Snare") || n.label.includes("Timpano")) {
                        ctx.fillRect(n.x - 3, y - 3, 6, 6);
                    } else {
                        ctx.font = "bold 10px sans-serif";
                        ctx.fillText("✕", n.x, y + 4);
                    }
                } 
                // --- STRUMENTI ---
                else {
                    const isXtra = n.track.includes("Xtra");
                    const hasPartner = currentLabels[n.track.replace("Xtra", "") + "Xtra"] !== "";
                    
                    // Verifica se currentLabels esiste per il base track
                    const baseTrack = n.track.replace("Xtra", "");
                    const hasValidPartner = currentLabels[baseTrack + "Xtra"] !== undefined && currentLabels[baseTrack + "Xtra"] !== "";

                    if (hasValidPartner) {
                        ctx.fillStyle = isXtra ? "#000080" : "#000000";
                        const rectY = isXtra ? y + 5 : y - 3;
                        ctx.fillRect(n.x - 3, rectY, 6, 6);
                        ctx.font = "bold 11px 'Courier New', monospace";
                        ctx.fillStyle = isXtra ? "#000080" : "#000000";
                        ctx.fillText(n.label, n.x, isXtra ? y - 25 : y - 12);
                    } else {
                        ctx.fillStyle = "#000000";
                        ctx.fillRect(n.x - 3, y - 3, 6, 6);
                        const isEven = Math.floor(n.index / 100) % 2 === 0;
                        ctx.font = "bold 11px 'Courier New', monospace";
                        ctx.fillStyle = "#000000";
                        ctx.fillText(n.label, n.x, isEven ? y - 12 : y - 22);
                    }
                }
            }
            // Rimuove le note uscite dal limite sinistro
            if (n.x < leftLimit) {
                this.notes.splice(i, 1);
            }
        }
        
        requestAnimationFrame(() => this.render());
    }
}