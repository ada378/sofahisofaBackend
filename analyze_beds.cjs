const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'temp_bed_images');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

async function run() {
  const meta = [];
  for (let f of files) {
    const filePath = path.join(dir, f);
    const img = sharp(filePath);
    const { width, height } = await img.metadata();
    const stats = await img.stats();
    // Average color
    const [r, g, b] = stats.channels.slice(0, 3).map(c => Math.round(c.mean));
    meta.push({ file: f, width, height, avgColor: `rgb(${r},${g},${b})`, r, g, b });
  }

  console.log(JSON.stringify(meta, null, 2));
}

run();
