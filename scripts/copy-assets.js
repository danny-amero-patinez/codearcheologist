// Build asset copier — runs after tsc as part of `npm run build`
// Copies non-TypeScript runtime assets (Ghidra Java scripts, etc.) into dist/
// tsc does NOT copy .java or other asset files automatically.

const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
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
  path.join(__dirname, 'src', 'modules', 'ghidra', 'scripts'),
  path.join(__dirname, 'dist', 'modules', 'ghidra', 'scripts'),
);

console.log('Asset copy complete.');
