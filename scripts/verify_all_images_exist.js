const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('index.html', 'utf8');

function checkRegex(name, regex) {
  const matches = content.match(regex) || [];
  const unique = [...new Set(matches)];
  let missing = 0;
  let ok = 0;

  console.log(`\nChecking ${name} (${unique.length} unique references)...`);
  unique.forEach(ref => {
    const fullPath = path.resolve(__dirname, '..', ref);
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.size === 0) {
        console.error(`  [EMPTY FILE] ${ref}`);
        missing++;
      } else {
        ok++;
      }
    } else {
      console.error(`  [MISSING] ${ref}`);
      missing++;
    }
  });
  console.log(`  Result: ${ok} valid, ${missing} missing.`);
  return missing;
}

const imgMissing = checkRegex('images', /images\/[^"'\)\s>]+/g);
const assetMissing = checkRegex('assets', /assets\/[^"'\)\s>]+/g);

if (imgMissing > 0 || assetMissing > 0) {
  console.error('\nVerification FAILED: Some referenced files are missing or empty!');
  process.exit(1);
} else {
  console.log('\nAll referenced images and assets exist and are verified valid!');
}
