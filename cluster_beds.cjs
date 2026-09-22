const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'temp_bed_images');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

async function run() {
  const thumbBuffers = [];
  
  // Resize each image to 32x32 greyscale and 32x32 color for fast comparison
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const filePath = path.join(dir, f);
    const buf = await sharp(filePath)
      .resize(32, 32, { fit: 'fill' })
      .raw()
      .toBuffer();
    thumbBuffers.push({ file: f, buf });
  }

  // Calculate pairwise distance (mean absolute difference per pixel)
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const matches = [];
    for (let j = 0; j < files.length; j++) {
      if (i === j) continue;
      let diff = 0;
      const b1 = thumbBuffers[i].buf;
      const b2 = thumbBuffers[j].buf;
      for (let k = 0; k < b1.length; k++) {
        diff += Math.abs(b1[k] - b2[k]);
      }
      const score = diff / b1.length; // lower means more similar
      matches.push({ file: files[j], score: Math.round(score * 10) / 10 });
    }
    matches.sort((a, b) => a.score - b.score);
    results.push({ file: files[i], closest: matches.slice(0, 5) });
  }

  fs.writeFileSync(path.join(__dirname, 'similarity_results.json'), JSON.stringify(results, null, 2));
  console.log('Similarity computed!');
}

run();
