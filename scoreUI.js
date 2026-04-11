// ScoreUI.js - Il "Foglietto Bianco" Orisontale
export class scoreVisualizer {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = "scoreCanvas";
        this.ctx = this.canvas.getContext('2d');
        this.isVisible = false;
        this.notes = []; 
        
        document.body.appendChild(this.canvas);
        
        // Chiudi al click sul foglio
        this.canvas.onclick = () => this.toggle();
        
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.canvas.style.display = this.isVisible ? 'block' : 'none';
        if (this.isVisible) this.render();
    }

    // Aggiunge una nota al flusso (chiamata dai motori)
    addNote(inst, note, sectionName) {
        this.notes.push({
            x: this.canvas.width, // Parte da destra
            y: this.getInstY(inst, note),
            label: note,
            inst: inst,
            section: sectionName,
            time: Date.now()
        });
    }

    getInstY(inst, note) {
        const h = this.canvas.height;
        if (inst === "Lead") return h * 0.3;
        if (inst === "Rhythm") return h * 0.6;
        return h * 0.8;
    }

    render() {
        if (!this.isVisible) return;
        
        const ctx = this.ctx;
        ctx.fillStyle = "#fdfdf5";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Disegna Linea di Esecuzione (Playhead)
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(100, 0); ctx.lineTo(100, this.canvas.height);
        ctx.stroke();

        // Disegna Pentagrammi semplificati
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 1;
        [0.3, 0.6, 0.8].forEach(pos => {
            ctx.beginPath();
            ctx.moveTo(0, this.canvas.height * pos);
            ctx.lineTo(this.canvas.width, this.canvas.height * pos);
            ctx.stroke();
        });

        // Muovi e disegna note
        ctx.fillStyle = "#1a1a1a";
        ctx.font = "bold 16px Courier New";
        
        this.notes.forEach((n, i) => {
            n.x -= 4; // Velocità di scorrimento
            ctx.fillText(n.label, n.x, n.y - 10);
            ctx.fillRect(n.x, n.y - 5, 15, 10); // Testa della nota
            
            // Scrivi nome sezione se cambia
            if (n.x > 90 && n.x < 110) {
                ctx.fillStyle = "red";
                ctx.fillText(n.section.toUpperCase(), 110, 50);
                ctx.fillStyle = "#1a1a1a";
            }
        });

        // Pulizia buffer
        if (this.notes.length > 200) this.notes.shift();

        requestAnimationFrame(() => this.render());
    }
}
