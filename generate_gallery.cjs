const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'temp_bed_images');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

// Sort naturally
files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bed Images Gallery</title>
  <style>
    body { font-family: sans-serif; background: #18181b; color: #f4f4f5; padding: 24px; margin: 0; }
    h1 { margin-bottom: 20px; font-size: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .card { background: #27272a; border-radius: 8px; overflow: hidden; padding: 12px; text-align: center; border: 1px solid #3f3f46; }
    img { width: 100%; height: 200px; object-fit: cover; background: #09090b; border-radius: 6px; }
    p { margin: 8px 0 0; font-size: 13px; font-weight: 500; color: #e4e4e7; }
    .badge { display: inline-block; background: #3b82f6; color: #fff; padding: 2px 8px; border-radius: 9999px; font-size: 11px; margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>All Bed Images (${files.length} files)</h1>
  <div class="grid">
`;

files.forEach((f, idx) => {
  html += `    <div class="card">
      <span class="badge">#${idx + 1}</span>
      <img src="./${encodeURIComponent(f)}" alt="${f}">
      <p>${f}</p>
    </div>\n`;
});

html += `  </div>
</body>
</html>`;

fs.writeFileSync(path.join(dir, 'gallery.html'), html);
console.log('gallery.html created with', files.length, 'images');
