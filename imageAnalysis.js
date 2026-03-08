//
// analyzeImage.js
// Analisi visiva accurata per generatore musicale metal
// Estrae: brightness, dna, energy, texture, complexity, direction
// Risoluzione: 64×64
//

// -------------------------------------------------------------
// Utility
// -------------------------------------------------------------
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function normalize(v, min, max) {
    return (v - min) / (max - min);
}

// -------------------------------------------------------------
// Brightness (già tua, adattata a 64×64)
// -------------------------------------------------------------
export function analyzeImageBrightness(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0.5;

    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;

    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        total += brightness;
    }

    const avg = total / (data.length / 4);
    return avg / 255;
}

// -------------------------------------------------------------
// DNA (già tua)
// -------------------------------------------------------------
export function extractPhotoDNA(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 32;
    canvas.height = 32;

    ctx.drawImage(img, 0, 0, 32, 32);
    const data = ctx.getImageData(0, 0, 32, 32).data;

    let hash = 0;
    for (let i = 0; i < data.length; i += 4) {
        hash = (hash * 31 + data[i] + data[i + 1] + data[i + 2]) >>> 0;
    }

    return hash;
}

// -------------------------------------------------------------
// Gaussian blur leggero (per stabilizzare Sobel)
// -------------------------------------------------------------
function gaussianBlur(data, width, height) {
    const kernel = [1, 4, 6, 4, 1];
    const ksum = 16;

    const temp = new Uint8ClampedArray(data.length);
    const out = new Uint8ClampedArray(data.length);

    // Blur orizzontale
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            let r = 0, g = 0, b = 0;
            for (let k = -2; k <= 2; k++) {
                const xx = clamp(x + k, 0, width - 1);
                const idx = (y * width + xx) * 4;
                const w = kernel[k + 2];

                r += data[idx] * w;
                g += data[idx + 1] * w;
                b += data[idx + 2] * w;
            }

            const idx2 = (y * width + x) * 4;
            temp[idx2] = r / ksum;
            temp[idx2 + 1] = g / ksum;
            temp[idx2 + 2] = b / ksum;
            temp[idx2 + 3] = 255;
        }
    }

    // Blur verticale
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            let r = 0, g = 0, b = 0;
            for (let k = -2; k <= 2; k++) {
                const yy = clamp(y + k, 0, height - 1);
                const idx = (yy * width + x) * 4;
                const w = kernel[k + 2];

                r += temp[idx] * w;
                g += temp[idx + 1] * w;
                b += temp[idx + 2] * w;
            }

            const idx2 = (y * width + x) * 4;
            out[idx2] = r / ksum;
            out[idx2 + 1] = g / ksum;
            out[idx2 + 2] = b / ksum;
            out[idx2 + 3] = 255;
        }
    }

    return out;
}

// -------------------------------------------------------------
// Energy = contrasto globale (deviazione standard luminanza)
// -------------------------------------------------------------
export function analyzeEnergy(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;

    let luminances = [];
    for (let i = 0; i < data.length; i += 4) {
        const L = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        luminances.push(L);
    }

    const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
    const variance = luminances.reduce((a, b) => a + (b - mean) ** 2, 0) / luminances.length;
    const std = Math.sqrt(variance);

    return clamp(std / 128, 0, 1);
}

// -------------------------------------------------------------
// Texture = densità bordi (Sobel magnitude)
// -------------------------------------------------------------
export function analyzeTexture(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);
    let data = ctx.getImageData(0, 0, 64, 64).data;

    data = gaussianBlur(data, 64, 64);

    const sobelX = [-1,0,1,-2,0,2,-1,0,1];
    const sobelY = [-1,-2,-1,0,0,0,1,2,1];

    let totalMag = 0;
    let count = 0;

    for (let y = 1; y < 63; y++) {
        for (let x = 1; x < 63; x++) {

            let gx = 0, gy = 0;
            let idx = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {

                    const px = (y + ky) * 64 + (x + kx);
                    const L = 0.299 * data[px*4] + 0.587 * data[px*4+1] + 0.114 * data[px*4+2];

                    gx += L * sobelX[idx];
                    gy += L * sobelY[idx];
                    idx++;
                }
            }

            const mag = Math.sqrt(gx*gx + gy*gy);
            totalMag += mag;
            count++;
        }
    }

    const avgMag = totalMag / count;
    return clamp(avgMag / 200, 0, 1);
}

// -------------------------------------------------------------
// Complexity = varianza colori + entropia luminanza
// -------------------------------------------------------------
export function analyzeComplexity(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;

    let luminances = [];
    let colors = [];

    for (let i = 0; i < data.length; i += 4) {
        const L = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        luminances.push(L);
        colors.push([data[i], data[i+1], data[i+2]]);
    }

    const meanL = luminances.reduce((a,b)=>a+b,0)/luminances.length;
    const varL = luminances.reduce((a,b)=>a+(b-meanL)**2,0)/luminances.length;

    let hist = new Array(256).fill(0);
    for (let L of luminances) hist[Math.floor(L)]++;

    let entropy = 0;
    for (let h of hist) {
        if (h > 0) {
            const p = h / luminances.length;
            entropy -= p * Math.log2(p);
        }
    }

    const varNorm = clamp(varL / 5000, 0, 1);
    const entNorm = clamp(entropy / 8, 0, 1);

    return clamp((varNorm + entNorm) / 2, 0, 1);
}

// -------------------------------------------------------------
// Direction = direzione dominante bordi (0–1)
// -------------------------------------------------------------
export function analyzeDirection(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);
    let data = ctx.getImageData(0, 0, 64, 64).data;

    data = gaussianBlur(data, 64, 64);

    const sobelX = [-1,0,1,-2,0,2,-1,0,1];
    const sobelY = [-1,-2,-1,0,0,0,1,2,1];

    let hist = new Array(180).fill(0);

    for (let y = 1; y < 63; y++) {
        for (let x = 1; x < 63; x++) {

            let gx = 0, gy = 0;
            let idx = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {

                    const px = (y + ky) * 64 + (x + kx);
                    const L = 0.299 * data[px*4] + 0.587 * data[px*4+1] + 0.114 * data[px*4+2];

                    gx += L * sobelX[idx];
                    gy += L * sobelY[idx];
                    idx++;
                }
            }

            const angle = Math.atan2(gy, gx) * (180 / Math.PI);
            const a = Math.floor((angle + 180) % 180);
            hist[a]++;
        }
    }

    let maxVal = 0;
    let maxIdx = 0;
    for (let i = 0; i < 180; i++) {
        if (hist[i] > maxVal) {
            maxVal = hist[i];
            maxIdx = i;
        }
    }

    return maxIdx / 179;
}

// -------------------------------------------------------------
// Funzione finale
// -------------------------------------------------------------
export function analyzeImage(img) {
    const brightness = analyzeImageBrightness(img);
    const dna = extractPhotoDNA(img);
    const energy = analyzeEnergy(img);
    const texture = analyzeTexture(img);
    const complexity = analyzeComplexity(img);
    const direction = analyzeDirection(img);

    // Derivati per i nuovi engine
    const entropy = complexity;   // alias più musicale
    const edges = texture;        // densità bordi = edges
    const symmetry = 0.5;         // placeholder neutro (0 = asimmetrico, 1 = molto simmetrico)

    return {
        // valori originali
        brightness,
        dna,
        energy,
        texture,
        complexity,
        direction,

        // alias/derivati per i nuovi engine
        entropy,
        edges,
        symmetry
    };
}
