const fs = require('fs');
const path = require('path');

const assetDirs = [
  'E:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\src\\assets',
  'E:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\public\\assets',
];

// Correct PNG signature (8 bytes): 89 50 4E 47 0D 0A 1A 0A
// After bad fix we now have:       89 50 4E 47 0A 1A 0A 00
// We need to properly restore binary PNGs from their corrupted-by-git state.
//
// The original corruption was: Windows git autocrlf replaced every 0A byte -> 0D 0A
// This turned binary data 0D 0A -> 0D 0D 0A (extra 0D inserted)
// AND lone 0A -> 0D 0A (0D inserted before every lone 0A)
//
// The previous fix script tried to reverse CRLF->LF but overdid it on files that
// had already been partially fixed, resulting in missing 0D bytes.
//
// The CORRECT fix: treat the file as git-corrupted (LF added 0D before every 0A),
// so we need to find every 0D 0A pair and replace it with just 0A.
// But we must be careful about the PNG header specifically.
//
// Actually the cleanest approach: 
// For files with header 89 50 4E 47 0A 1A 0A (missing 0D at pos 4):
//   These were already partially fixed. We need to restore the 0D at pos 4.
//   But the rest of the file was also processed wrong.
//
// The real problem: the original corrupted files had CRLF everywhere.
// The fix script removed 0D wherever followed by 0A, which is correct in principle.
// BUT the PNG header contains 0D 0A 1A 0A - after removing 0D before 0A it becomes 0A 1A 0A
// which broke the header. 
//
// Solution: After the CRLF->LF fix, we need to patch the header back to correct PNG header.

function fixPng(filePath) {
  const buf = fs.readFileSync(filePath);
  
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) {
    console.log('SKIP (not PNG header):', path.basename(filePath));
    return;
  }

  // Check if it's already perfectly correct
  if (buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A) {
    console.log('OK:', path.basename(filePath));
    return;
  }

  // State after previous bad fix: 89 50 4E 47 0A 1A 0A ...
  // We know this file had CRLF corruption and was then "fixed" but header got mangled.
  // Strategy: 
  //   1. Insert the missing 0D at position 4 to restore the correct header
  //   2. But we already removed all 0D 0A pairs in the whole file...
  //   Actually since the body data was also mangled by the bad fix, we can't easily recover.
  //
  // BETTER: check git for original. Let's use git show to get the original file.
  console.log('NEEDS REPAIR:', path.basename(filePath), '| header:', 
    [buf[4], buf[5], buf[6], buf[7]].map(b => b.toString(16).padStart(2,'0')).join(' '));
}

assetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  function walk(d) {
    fs.readdirSync(d).forEach(f => {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (f.endsWith('.png')) fixPng(full);
    });
  }
  walk(dir);
});
