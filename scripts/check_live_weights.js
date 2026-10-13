const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /(?:src=["']|url\(["']?|img:\s*['"])([^"')\s]+\.(?:png|jpg|jpeg|webp|svg|gif))/gi;
let m;
let totalSize = 0;
let largeCount = 0;
const checked = new Set();

while ((m = regex.exec(html)) !== null) {
  const p = m[1];
  if (!p.startsWith('http') && !checked.has(p) && fs.existsSync(p)) {
    checked.add(p);
    const size = fs.statSync(p).size;
    totalSize += size;
    if (size > 1024 * 1024) {
      console.log(`STILL LARGE (>1MB): ${p} (${(size / (1024 * 1024)).toFixed(2)} MB)`);
      largeCount++;
    }
  }
}

console.log('Total unique referenced images:', checked.size);
console.log('Total unique image weight in index.html:', (totalSize / (1024 * 1024)).toFixed(2), 'MB');
console.log('Images over 1MB:', largeCount);
