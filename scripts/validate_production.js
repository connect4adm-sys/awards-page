const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('index.html', 'utf8');

// 1. Check script syntax
const lastScript = html.substring(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
try {
  new vm.Script(lastScript);
  console.log('[PASS] JavaScript syntax is 100% valid!');
} catch (e) {
  console.error('[FAIL] Script syntax error:', e);
}

// 2. Check local paths
const badPatterns = ['C:\\Users', 'file://', 'localhost'];
badPatterns.forEach(bp => {
  if (html.includes(bp)) {
    console.error('[FAIL] Found bad pattern:', bp);
  } else {
    console.log('[PASS] Clean of:', bp);
  }
});

// 3. Check all image references
const regex = /(?:src=["']|url\(["']?|img:\s*['"])([^"')\s]+\.(?:png|jpg|jpeg|webp|svg|gif))/gi;
let m;
const missing = [];
let total = 0;
while ((m = regex.exec(html)) !== null) {
  const p = m[1];
  if (!p.startsWith('http') && !p.startsWith('data:')) {
    total++;
    if (!fs.existsSync(p)) {
      missing.push(p);
    }
  }
}

console.log('[INFO] Checked local image references. Total:', total);
if (missing.length === 0) {
  console.log('[PASS] All referenced image files exist on disk!');
} else {
  console.error('[FAIL] Missing files:', missing);
}
