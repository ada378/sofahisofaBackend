import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../temp_bed_images');

const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
console.log(`Found ${files.length} images.`);

files.forEach((f, i) => {
  const stat = fs.statSync(path.join(dir, f));
  console.log(`${i + 1}. ${f} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
});
