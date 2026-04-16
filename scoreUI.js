// scoreUI.js — ver. 011
// Fix: Aggiunto setTheme, Label zigzag, Dual-color Orchestra, No Ottave

console.log("scoreUI.js ver. 011.1 loaded");

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
            metal: { "Lead": "GT LEAD", "Rhythm": "GT RHYTHM", "Bass": "BASS", "Drums": "DRUMS" },
            orchestra: { "Lead": "VIOLIN / VIOLA", "Rhythm": "HARPSICHORD", "Bass": "CELLO / BASS", "Drums": "TIMPANI" },
            piano: { "Lead": "PIANO RIGHT", "Rhythm": "PIANO LEFT" }
        };

        this.initCanvas();
        window.addEventListener("resize", () => this.initCanvas());
    }

    // --- NUOVA FUNZIONE SETTHEME ---
    setTheme(genre) {
        if (this.themes[genre]) {
            this.currentGenre = genre;
            console.log(`🎨 Score Theme set to: ${genre}`);
        }
    }

    cleanNoteLabel(note) {
        if (!note || typeof note !== 'string') return "";
        // Prende solo la nota senza il numero dell'ottava (es: C#4 -> C#)
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

    addNote(track, note, section, isSecondary = false) {
        this.currentSection = section;
        if (this.notes.length > 500) this.notes.shift();
        this.notes.push({
            x: this.playheadX,
            track: track,
            label: this.cleanNoteLabel(note),
            isSecondary: isSecondary,
            index: Date.now() + Math.random() // Indice univoco per lo zigzag
        });
    }

    render() {
        if (!this.isVisible) return;
        const { ctx, canvas, playheadX, leftLimit, bgImage, imageLoaded } = this;
        const currentLabels = this.themes[this.currentGenre] || this.themes.metal;
        
        const tracks = {
            "Lead":   { y: 0.22, label: currentLabels["Lead"] },    
            "Rhythm": { y: 0.42, label: currentLabels["Rhythm"] },  
            "Bass":   { y: 0.60, label: currentLabels["Bass"] },       
            "Drums":  { y: 0.80, label: currentLabels["Drums"] }       
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imageLoaded) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        if (this.currentSection) {
            ctx.fillStyle = "#ff0000"; 
            ctx.font = "bold 22px serif"; 
            ctx.textAlign = "left";
            ctx.fillText(this.currentSection.toUpperCase(), leftLimit + 20, canvas.height * 0.12); 
        }
        
        Object.keys(tracks).forEach(key => {
            const trackY = canvas.height * tracks[key].y;
            ctx.fillStyle = "#444";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(tracks[key].label, canvas.width * 0.02, trackY - 15);
        });

        ctx.strokeStyle = "#ff000022";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, canvas.height); ctx.stroke();

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            const trackCfg = tracks[n.track];
            if(!trackCfg) continue;
            
            let y = canvas.height * trackCfg.y;
            n.x -= 3.5; 
            if (this.currentGenre === "metal" && n.track === "Drums") {
                if (n.label.includes("Kick"))  y += 6;
                if (n.label.includes("Snare")) y -= 2;
                if (n.label.includes("HiHat")) y -= 12;
                if (n.label.includes("Crash")) y -= 22;
            }

            n.x -= 3.5; 

            if (n.x > leftLimit) {
                ctx.fillStyle = "#000";
                if (this.currentGenre === "metal" && n.track === "Drums") {
                    if (n.label.includes("Kick") || n.label.includes("Snare")) {
                        ctx.fillRect(n.x - 3, y - 3, 6, 6);
                    } else {
                        ctx.font = "bold 8px sans-serif";
                        ctx.fillText("✕", n.x, y + 4);
                        ctx.font = "bold 8px 'Courier New', monospace";
                    }
                } else {
                    ctx.fillRect(n.x - 3, y - 3, 6, 6); 
                    ctx.fillText(n.label, n.x, y - 12);
                }
            }

            if (n.x > leftLimit) {
                // Gestione Colore (Orchestra: Blu Notte per Viola/Bass)
                ctx.fillStyle = (n.isSecondary && this.currentGenre === "orchestra") ? "#191970" : "#000000";

                // QUADRATI: Allineati (ma sfalsati leggermente se secondari per non sovrapporsi)
                const rectY = n.isSecondary ? y + 5 : y - 3;
                ctx.fillRect(n.x - 3, rectY, 6, 6);

                // ETICHETTE: ZigZag (una sopra e una sotto l'altra)
                ctx.font = "bold 9px 'Courier New', monospace";
                ctx.textAlign = "center";
                
                // Determina altezza testo (alternata ogni 2 note)
                const isEven = Math.floor(n.index / 100) % 2 === 0;
                let textY = isEven ? y - 12 : y - 22;

                // Se è un secondario (Viola), alza ancora di più per non coprire il Violino
                if (n.isSecondary) textY -= 15;

                ctx.fillText(n.label, n.x, textY);
            }

            if (n.x < leftLimit) this.notes.splice(i, 1);
        }
        
        requestAnimationFrame(() => this.render());
    }
}