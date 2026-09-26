// Build asset copier — runs after tsc as part of `npm run build`
// Copies non-TypeScript runtime assets (Ghidra Java scripts, etc.) into dist/
// tsc does NOT copy .java or other asset files automatically.

const fs = require('fs');
const path = require('path');

// Project root is one level up from this script's own directory (scripts/)
const PROJECT_ROOT = path.resolve(__dirname, '..');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`copy-assets: source not found, skipping: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} → ${destPath}`);
    }
  }
}

// Copy Ghidra scripts
copyDir(
  path.join(PROJECT_ROOT, 'src', 'modules', 'ghidra', 'scripts'),
  path.join(PROJECT_ROOT, 'dist', 'modules', 'ghidra', 'scripts'),
);

console.log('Asset copy complete.');
