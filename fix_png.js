const fs = require('fs');
const path = require('path');

const assetDirs = [
  'E:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\src\\assets',
  'E:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\public\\assets',
];

// Correct PNG signature: 89 50 4E 47 0D 0A 1A 0A
// Corrupted:             89 50 4E 47 0D 0A 1A 0D 0A
// The problem is Windows autocrlf turning 0A -> 0D 0A throughout the binary file.
// We need to remove all 0D bytes that appear before 0A (i.e., reverse CRLF -> LF conversion).

function fixPng(filePath) {
  const buf = fs.readFileSync(filePath);
  
  // Check if corrupted: PNG header should be 89 50 4E 47 0D 0A 1A 0A
  // Corrupted files have 89 50 4E 47 0D 0A 1A 0D 0A
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) {
    console.log('SKIP (not PNG):', filePath);
    return;
  }
  
  // Check if already correct
  if (buf[6] === 0x1A && buf[7] === 0x0A) {
    console.log('OK (already correct):', filePath);
    return;
  }
  
  // Remove all 0D that are immediately followed by 0A (CRLF -> LF)
  const result = [];
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0D && buf[i + 1] === 0x0A) {
      // Skip the 0D
      continue;
    }
    result.push(buf[i]);
  }
  
  const fixed = Buffer.from(result);
  fs.writeFileSync(filePath, fixed);
  console.log(`FIXED: ${filePath} (${buf.length} -> ${fixed.length} bytes)`);
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walkDir(full);
    } else if (f.endsWith('.png') || f.endsWith('.PNG')) {
      fixPng(full);
    }
  });
}

assetDirs.forEach(walkDir);
console.log('\nDone!');
