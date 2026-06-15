const fs = require('fs');
const path = require('path');

// State of dist files (original git-corrupted):
// 89 50 4E 47 0D 0A 1A 0D 0A 00 00 00 0D 0A 49 48 44 52...
// Correct PNG:
// 89 50 4E 47 0D 0A 1A 0A 00 00 00 0D 49 48 44 52...
//
// Differences:
//   Position 7: 0D (extra, should not be there) -> remove it
//   Position 13 (after removing pos 7): 0A (extra, should not be there) -> remove it
//
// The pattern: every 0A byte in the original got 0D inserted before it by git CRLF.
// BUT: the PNG header bytes 4-7 are 0D 0A 1A 0A. 
//   - 0D 0A: already CRLF, git leaves it alone
//   - 1A 0A: the 0A at position 7 got converted to 0D 0A -> 1A 0D 0A
//   So we just need to remove the 0D at position 7.
//
// For the body: the pattern is the same - every standalone 0A becomes 0D 0A.
// To reverse: find every 0D 0A pair and convert to 0A.
// BUT we must NOT convert the 0D 0A at positions 4-5 (which is part of PNG signature).
//
// Strategy: 
//   1. Copy the file from dist to public/assets
//   2. Patch bytes 7: remove the extra 0D (shift everything after left by 1)
//   3. Then scan the rest of the body for 0D 0A patterns and convert to 0A
//   But be careful: the 0D 0A at positions 4-5 should stay.
//
// Simpler approach:
//   Process the entire file removing 0D before 0A EXCEPT for the 0D at position 4.

const srcBase = 'e:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\dist\\assets';
const dstBases = [
  'e:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\public\\assets',
  'e:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\src\\assets',
];

function fixAndCopy(srcPath, dstPaths) {
  const buf = fs.readFileSync(srcPath);
  
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) {
    console.log('SKIP (not PNG):', path.basename(srcPath));
    return;
  }

  // Check state
  const isGitCorrupted = (buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0D && buf[8] === 0x0A);
  const isAlreadyCorrect = (buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A);
  
  let fixed;
  
  if (isAlreadyCorrect) {
    console.log('OK:', path.basename(srcPath));
    fixed = buf;
  } else if (isGitCorrupted) {
    // Remove every 0D that is immediately followed by 0A, EXCEPT for the one at position 4
    // (which is the legitimate 0D 0A in PNG signature)
    const result = [];
    result.push(buf[0], buf[1], buf[2], buf[3]); // 89 50 4E 47
    result.push(buf[4]); // 0D (keep - part of signature)
    result.push(buf[5]); // 0A (keep - part of signature)
    result.push(buf[6]); // 1A (keep - part of signature)
    // Skip buf[7] which is 0D (extra, from git corruption)
    // buf[8] is 0A (final byte of PNG signature)
    result.push(buf[8]); // 0A (keep - final byte of signature)
    
    // Now process the rest of the file (body): remove 0D before 0A
    for (let i = 9; i < buf.length; i++) {
      if (buf[i] === 0x0D && i + 1 < buf.length && buf[i + 1] === 0x0A) {
        continue; // skip this 0D (git-inserted)
      }
      result.push(buf[i]);
    }
    
    fixed = Buffer.from(result);
    console.log(`FIXED: ${path.basename(srcPath)} (${buf.length} -> ${fixed.length} bytes)`);
  } else {
    console.log('UNKNOWN state:', path.basename(srcPath), 
      [buf[4],buf[5],buf[6],buf[7],buf[8]].map(b => b.toString(16).padStart(2,'0')).join(' '));
    fixed = buf; // copy as-is
  }
  
  // Verify fixed header
  if (fixed[4] !== 0x0D || fixed[5] !== 0x0A || fixed[6] !== 0x1A || fixed[7] !== 0x0A) {
    console.log('  WARNING: header still wrong!', [fixed[4],fixed[5],fixed[6],fixed[7]].map(b => b.toString(16)).join(' '));
  }
  
  // Write to all destinations
  dstPaths.forEach(dst => {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, fixed);
  });
}

function walkAndFix(srcDir) {
  if (!fs.existsSync(srcDir)) {
    console.log('Source not found:', srcDir);
    return;
  }
  
  fs.readdirSync(srcDir).forEach(f => {
    const srcPath = path.join(srcDir, f);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      walkAndFix(srcPath);
    } else if (f.toLowerCase().endsWith('.png')) {
      // Build destination paths
      const relPath = path.relative(srcBase, srcPath);
      const dstPaths = dstBases.map(b => path.join(b, relPath));
      fixAndCopy(srcPath, dstPaths);
    }
  });
}

console.log('Starting fix from dist...');
walkAndFix(srcBase);
console.log('\nDone!');
