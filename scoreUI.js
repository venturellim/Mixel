// scoreUI.js — ver. 015.1 (FULL VERSION)
// Logica: Batteria 10x5, Note su altezze reali (Challenge), Canali Xtra

console.log("scoreUI.js ver. 015.1 loaded - Full Challenge Mode");

export class scoreVisualizer {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        
        // --- CONFIGURAZIONE STILI ---
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

        // --- MAPPA ALTEZZE PENTAGRAMMA ---
        // Offset in pixel rispetto alla riga centrale di ogni strumento
        this.pitchMap = {
            "C": 10, "C#": 10, "D": 6, "D#": 6, "E": 2, 
            "F": -2, "F#": -2, "G": -6, "G#": -6, "A": -10, "A#": -10, "B": -14
        };

        this.themes = {
            metal: { 
                "Lead": "CHITARRA SOLISTA", "LeadXtra": "", 
                "Rhythm": "CHITARRA RITMICA", "RhythmXtra": "",
                "Bass": "BASSO", "BassXtra": "",
                "Drums": "BATTERIA" 
            },
            orchestra: { 
                "Lead": "VIOLINO", "LeadXtra": "VIOLA", 
                "Rhythm": "CLAVICEMBALO", "RhythmXtra": "",
                "Bass": "CONTRABBASSO", "BassXtra": "VIOLONCELLO",
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
        // Protezione etichette batteria
        if (["Kick", "Snare", "HiHat", "Crash", "Timpano"].some(t => note.includes(t))) return note;
        // Rimozione ottava (es: C4 -> C)
        return isNaN(parseInt(note[1])) ? note.substring(0, 2) : note.substring(0, 1);
    }

    initCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.id = "scoreCanvas"; 
        if (!this.canvas.parentElement) document.body.appendChild(this.canvas);
        if (!this.closeBtn.parentElement) document.body.appendChild(this.closeBtn);
        this.playheadX = this.canvas.width * 0.80;
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
            // Salviamo la lettera pura per la pitchMap (es: "C#" -> "C#")
            rawKey: (note.substring(0, 1) + (note.includes("#") ? "#" : "")).toUpperCase(),
            index: Date.now() + Math.random() 
        });
    }

    render() {
        if (!this.isVisible) return;
        const { ctx, canvas, playheadX, leftLimit, bgImage, imageLoaded } = this;
        const currentLabels = this.themes[this.currentGenre] || this.themes.metal;
        
        // Griglia Y fissa per i righi musicali
        const tracksY = {
            "Lead": 0.22, "LeadXtra": 0.22,
            "Rhythm": 0.40, "RhythmXtra": 0.40,
            "Bass": 0.58, "BassXtra": 0.58,
            "Drums": 0.76
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imageLoaded) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        // Disegno Titolo Sezione
        if (this.currentSection) {
            ctx.fillStyle = "#ff0000"; 
            ctx.font = "bold 24px serif"; 
            ctx.textAlign = "left";
            ctx.fillText(this.currentSection.toUpperCase(), leftLimit + 20, canvas.height * 0.10); 
        }

        // Playhead
        ctx.strokeStyle = "#ff000022";
        ctx.lineWidth = 2;
        ctx.beginPath(); 
        ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, canvas.height); 
        ctx.stroke();

        // Disegno Etichette Strumenti (a destra della linea rossa)
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "left";
        Object.keys(tracksY).forEach(t => {
            const label = currentLabels[t];
            if (label && label !== "") {
                const y = canvas.height * tracksY[t];
                ctx.fillStyle = t.includes("Xtra") ? "#000080" : "#444";
                const yOff = t.includes("Xtra") ? y - 22 : y - 8;
                ctx.fillText(label, playheadX + 15, yOff);
            }
        });

        // CICLO DISEGNO NOTE
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            const trackY_ratio = tracksY[n.track];
            if(!trackY_ratio) continue;
            
            let baseY = canvas.height * trackY_ratio;
            n.x -= 3.5; // Velocità scorrimento

            if (n.x > leftLimit) {
                // --- 1) LOGICA BATTERIA ---
                if (n.track === "Drums") {
                    ctx.fillStyle = "#000";
                    let drumY = baseY;
                    // Posizioni relative 8.1
                    if (n.label.includes("Kick"))  drumY += 20;
                    if (n.label.includes("Snare")) drumY += 14;
                    if (n.label.includes("HiHat")) drumY += 6;
                    if (n.label.includes("Crash")) drumY -= 0;

                    if (n.label.includes("Kick") || n.label.includes("Snare") || n.label.includes("Timpano")) {
                        // Rettangolo 10x5 chiesto dall'utente
                        ctx.fillRect(n.x - 5, drumY - 2.5, 10, 5); 
                    } else {
                        ctx.font = "bold 16px sans-serif";
                        ctx.textAlign = "center";
                        ctx.fillText("✕", n.x, drumY + 6);
                    }
                } 
                // --- 2) LOGICA STRUMENTI (SFIDA PITCH REALE) ---
                else {
                    const isXtra = n.track.includes("Xtra");
                    // Calcolo altezza dinamica dal centro del rigo
                    const pitchOffset = this.pitchMap[n.rawKey] || 0;
                    const finalY = baseY + pitchOffset;

                    ctx.fillStyle = isXtra ? "#000080" : "#000000";
                    ctx.textAlign = "center";

                    // Disegno simbolo nota (♩)
                    ctx.font = "22px serif";
                    ctx.fillText("♩", n.x, finalY + 7);

                    // Disegno Etichetta (C, D, E...)
                    ctx.font = "bold 12px 'Courier New', monospace";
                    const isEven = Math.floor(n.index / 100) % 2 === 0;
                    // Zigzag o offset fisso per Xtra
                    const labelY = isXtra ? finalY + 20 : (isEven ? finalY - 15 : finalY - 28);
                    ctx.fillText(n.label, n.x, labelY);
                }
            }
            // Pulizia memoria
            if (n.x < leftLimit) this.notes.splice(i, 1);
        }
        
        requestAnimationFrame(() => this.render());
    }
}
