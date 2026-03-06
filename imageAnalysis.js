export function extractPhotoDNA(img) {

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 32;
    canvas.height = 32;

    ctx.drawImage(img,0,0,32,32);

    const data = ctx.getImageData(0,0,32,32).data;

    let hash = 0;

    for(let i=0;i<data.length;i+=4){

        hash = (hash*31 + data[i] + data[i+1] + data[i+2]) >>> 0;

    }

    return hash;

}