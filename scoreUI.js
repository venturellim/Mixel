// scoreUI.js — ver. 010
// Fix: Label alternate (zigzag) per Piano/Metal, Dual-color per Orchestra, No Ottave

console.log("scoreUI.js ver. 010 loaded");

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

    // 1️⃣ PARSING NOTA: Rimuove l'ottava (es. C4 -> C, F#3 -> F#)
    cleanNoteLabel(note) {
        if (!note || typeof note !== 'string') return "";
        // Se il secondo carattere è un numero, prendiamo solo il primo
        // Se è un simbolo (es. #), verifichiamo il terzo
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
            // Usiamo il timestamp o un contatore per l'alternanza zigzag
            index: this.notes.length 
        });
    }

    render() {
        if (!this.isVisible) return;
        const { ctx, canvas, playheadX, leftLimit, bgImage, imageLoaded } = this;
        const currentLabels = this.themes[this.currentGenre] || this.themes.metal;
        
        const tracks = {
            "Lead":   { y: 0.22, label: currentLabels["Lead"] },    
            "Rhythm": { y: 0.45, label: currentLabels["Rhythm"] },  
            "Bass":   { y: 0.70, label: currentLabels["Bass"] },       
            "Drums":  { y: 0.88, label: currentLabels["Drums"] }       
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imageLoaded) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        // Disegno Playhead
        ctx.strokeStyle = "#ff000022";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, canvas.height); ctx.stroke();

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            const trackCfg = tracks[n.track];
            if(!trackCfg) continue;
            
            let y = canvas.height * trackCfg.y;
            n.x -= 3.5; 

            if (n.x > leftLimit) {
                // --- LOGICA COLORE (Orchestra) ---
                if (this.currentGenre === "orchestra" && n.isSecondary) {
                    ctx.fillStyle = "#191970"; // Blu Notte per Viola/Contrabbasso
                } else {
                    ctx.fillStyle = "#000000"; // Nero standard
                }

                // 2️⃣ I QUADRATI RESTANO ALLINEATI
                // Per il secondario (Viola/Bass) li abbassiamo solo di 8px per non sovrapporli
                const rectY = n.isSecondary ? y + 5 : y - 3;
                ctx.fillRect(n.x - 3, rectY, 6, 6);

                // 3️⃣ LE ETICHETTE ALTERNANO (ZIGZAG)
                // Usiamo l'indice della nota per decidere se stare su riga 1 o riga 2
                ctx.font = "bold 9px 'Courier New', monospace";
                ctx.textAlign = "center";
                
                let textY;
                if (this.currentGenre === "orchestra" && n.isSecondary) {
                    // La Viola/Bass ha le etichette ancora più in alto per non scontrarsi col Violino
                    textY = (n.index % 2 === 0) ? y - 28 : y - 38;
                } else {
                    // Violino, Piano Lead, Metal Lead usano zigzag standard
                    textY = (n.index % 2 === 0) ? y - 12 : y - 22;
                }

                if (n.track !== "Drums") {
                    ctx.fillText(n.label, n.x, textY);
                } else {
                    // Logica Drums (Metal)
                    if (n.label.includes("Kick")) {
                         ctx.fillRect(n.x - 3, y + 5, 6, 6);
                    } else {
                         ctx.fillText("✕", n.x, y);
                    }
                }
            }
            if (n.x < leftLimit) this.notes.splice(i, 1);
        }
        requestAnimationFrame(() => this.render());
    }
}
