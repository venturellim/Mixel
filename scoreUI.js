// scoreUI.js — ver. 012
// Logica: Canali Xtra per Orchestra, ZigZag per Solo, No Ottave

console.log("scoreUI.js ver. 012.1 loaded");

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

        // Configurazione Temi con canali Xtra
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

    // 1️⃣ RIMOZIONE OTTAVA
    cleanNoteLabel(note) {
        if (!note || typeof note !== 'string') return "";
        return isNaN(parseInt(note[1])) ? note.substring(0, 2) : note.substring(0, 1);
    }

    initCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.id = "scoreCanvas"; 
        if (!this.canvas.parentElement) document.body.appendChild(this.canvas);
        if (!this.closeBtn.parentElement) document.body.appendChild(this.closeBtn);
        this.playheadX = this.canvas.width * 0.85;
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
        
        // Mappatura coordinate Y per i canali principali
        const tracksY = {
            "Lead": 0.22, "LeadXtra": 0.22,
            "Rhythm": 0.45, "RhythmXtra": 0.45,
            "Bass": 0.70, "BassXtra": 0.70,
            "Drums": 0.88
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imageLoaded) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        // Disegno Playhead
        ctx.strokeStyle = "#ff000022";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, canvas.height); ctx.stroke();

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            const baseT = n.track.replace("Xtra", ""); // Es: LeadXtra -> Lead
            const trackY_ratio = tracksY[n.track];
            if(!trackY_ratio) continue;
            
            let y = canvas.height * trackY_ratio;
            n.x -= 3.5; 

            if (n.x > leftLimit) {
                const isXtra = n.track.includes("Xtra");
                const hasPartner = currentLabels[baseT + "Xtra"] !== "";

                // 2️⃣ LOGICA DUAL-CHANNEL (ORCHESTRA)
                if (hasPartner) {
                    if (isXtra) {
                        ctx.fillStyle = "#191970"; // Blu Notte
                        ctx.fillRect(n.x - 3, y + 5, 6, 6); // Quadratino sotto
                        ctx.font = "bold 9px 'Courier New', monospace";
                        ctx.fillText(n.label, n.x, y - 25); // Testo molto sopra
                    } else {
                        ctx.fillStyle = "#000000"; // Nero
                        ctx.fillRect(n.x - 3, y - 3, 6, 6); // Quadratino standard
                        ctx.font = "bold 9px 'Courier New', monospace";
                        ctx.fillText(n.label, n.x, y - 12); // Testo sopra
                    }
                } 
                // 3️⃣ LOGICA ZIGZAG (METAL / PIANO)
                else {
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(n.x - 3, y - 3, 6, 6);
                    if (n.track !== "Drums") {
                        const isEven = Math.floor(n.index / 100) % 2 === 0;
                        ctx.font = "bold 9px 'Courier New', monospace";
                        ctx.fillText(n.label, n.x, isEven ? y - 12 : y - 22);
                    }
                }
            }
            if (n.x < leftLimit) this.notes.splice(i, 1);
        }
        requestAnimationFrame(() => this.render());
    }
}
