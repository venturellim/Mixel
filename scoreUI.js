// scoreUI.js — ver. 014
// Base: 008.1 (drums perfetti)
// Modifiche:
// 1) Eliminazione ottava dal label (C#4 -> C#, C4 -> C)
// 2) Due strumenti stessa riga: primario nero (sotto), secondario blu (sopra con etichetta +15px)
// 3) Strumento singolo: note a righe alternate, quadratini stessa riga

console.log("scoreUI.js ver. 014 loaded");

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
        this.bgImage.onload = () => {
            this.imageLoaded = true;
            console.log("✅ Immagine pentagramma caricata.");
        };

        this.closeBtn = document.createElement("button");
        this.closeBtn.innerHTML = "✕";
        this.closeBtn.className = "close-score-btn";
        this.closeBtn.style.display = "none";
        this.closeBtn.onclick = () => this.hide();

        this.themes = {
            metal: {
                "Lead": "GT LEAD", "Rhythm": "GT RHYTHM", "Bass": "BASS", "Drums": "DRUMS"
            },
            orchestra: {
                "Lead": "VIOLIN / VIOLA",
                "Rhythm": "HARPSICHORD",
                "Bass": "CELLO / BASS",
                "Drums": "TIMPANI"
            },
            piano: {
                "Lead": "PIANO RIGHT", "Rhythm": "PIANO LEFT"
            }
        };

        this.initCanvas();
        window.addEventListener("resize", () => this.initCanvas());
    }

    setTheme(genre) {
        if (this.themes[genre]) {
            this.currentGenre = genre;
            console.log(`🎵 Score Theme impostato su: ${genre}`);
        }
    }

    // MODIFICA 1: Elimina l'ottava dal label
    cleanNoteLabel(note) {
        if (!note || typeof note !== 'string') return "";
        // Se il secondo carattere è un numero, prendi solo il primo carattere (es: "C4" -> "C")
        // Altrimenti prendi i primi due (es: "C#4" -> "C#")
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

    // MODIFICA: Aggiunto parametro isSecondary e cleaned label
    addNote(track, note, section, isSecondary = false) {
        this.currentSection = section;
        if (this.notes.length > 500) this.notes.shift();
        this.notes.push({
            x: this.playheadX,
            track: track,
            label: this.cleanNoteLabel(note),
            isSecondary: isSecondary,
            index: Date.now() + Math.random()  // per zigzag
        });
    }

    render() {
        if (!this.isVisible) return;

        const { ctx, canvas, playheadX, leftLimit, bgImage, imageLoaded } = this;
        const currentLabels = this.themes[this.currentGenre] || this.themes.metal;
        
        const tracks = {
            "Lead":   { y: 0.22, label: currentLabels["Lead"] },      // MODIFICA: Y da 0.24 a 0.22
            "Rhythm": { y: 0.42, label: currentLabels["Rhythm"] },  
            "Bass":   { y: 0.60, label: currentLabels["Bass"] },       
            "Drums":  { y: 0.80, label: currentLabels["Drums"] }       
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (imageLoaded) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#fffaf0";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

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

        // MODIFICA: Playhead rossa (invece che nera)
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, canvas.height); ctx.stroke();

        ctx.font = "bold 8px 'Courier New', monospace"; 
        ctx.textAlign = "center";

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            const trackCfg = tracks[n.track];
            if(!trackCfg) continue;
            
            let y = canvas.height * trackCfg.y;
            
            // DRUMS (identico alla 008.1)
            if (this.currentGenre === "metal" && n.track === "Drums") {
                if (n.label.includes("Kick"))  y += 6;
                if (n.label.includes("Snare")) y -= 2;
                if (n.label.includes("HiHat")) y -= 12;
                if (n.label.includes("Crash")) y -= 22;
            }

            n.x -= 3.5; 

            if (n.x > leftLimit) {
                
                // === DRUMS (identico alla 008.1) ===
                if (this.currentGenre === "metal" && n.track === "Drums") {
                    ctx.fillStyle = "#000";
                    if (n.label.includes("Kick") || n.label.includes("Snare")) {
                        ctx.fillRect(n.x - 3, y - 3, 6, 6);
                    } else {
                        ctx.font = "bold 8px sans-serif";
                        ctx.fillText("✕", n.x, y + 4);
                        ctx.font = "bold 8px 'Courier New', monospace";
                    }
                }
                
                // === MODIFICA 2 + 3: Gestione strumenti ===
                else {
                    // Determina se è secondario (viola, contrabbasso)
                    const isSecondary = n.isSecondary === true;
                    
                    // MODIFICA 3: Zigzag per etichette (strumento singolo o entrambi)
                    // Alterna ogni 2 note (usando l'indice)
                    const isEven = Math.floor(n.index / 100) % 2 === 0;
                    
                    // POSIZIONE QUADRATINO
                    let rectY;
                    if (isSecondary) {
                        // MODIFICA 2: Strumento secondario (blu) - quadratino una riga SOTTO (-8px)
                        rectY = y + 5;
                    } else {
                        // Strumento primario (nero) - quadratino sulla riga base
                        rectY = y - 3;
                    }
                    
                    // POSIZIONE ETICHETTA (nota musicale)
                    let textY;
                    if (isSecondary) {
                        // MODIFICA 2: Strumento secondario - etichetta una riga SOPRA (-20px dalla base)
                        textY = y - 20;
                    } else {
                        // MODIFICA 3: Strumento primario - zigzag (alterna tra -12 e -22)
                        textY = isEven ? y - 12 : y - 22;
                    }
                    
                    // Colore: nero per primario, blu notte per secondario
                    ctx.fillStyle = isSecondary ? "#191970" : "#000000";
                    
                    // Disegna quadratino
                    ctx.fillRect(n.x - 3, rectY, 6, 6);
                    
                    // Disegna etichetta
                    ctx.font = "bold 10px 'Courier New', monospace";
                    ctx.fillText(n.label, n.x, textY);
                    
                    // Reset font per prossimi cicli
                    ctx.font = "bold 8px 'Courier New', monospace";
                }
            }
            if (n.x < leftLimit) this.notes.splice(i, 1);
        }
        requestAnimationFrame(() => this.render());
    }
}