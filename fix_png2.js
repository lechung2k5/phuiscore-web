const fs = require('fs');
const path = require('path');

// PNG Correct signature: 89 50 4E 47 0D 0A 1A 0A
// After bad fix:         89 50 4E 47 0A 1A 0A xx  (missing 0D at index 4)
//
// The original git-corrupted state had CRLF everywhere in binary:
//   every lone 0A was turned into 0D 0A
//
// The previous fix script did: remove every 0D that is followed by 0A
// This correctly reverses CRLF->LF for the BODY data.
// BUT it also incorrectly affected the PNG header:
//   Original corrupted header: 89 50 4E 47 0D 0D 0A 1A 0D 0A
//   After bad fix:             89 50 4E 47 0D 0A 1A 0A  -- wait, this is correct?
//
// Let me think again from what I see:
// Current bad header:  89 50 4E 47 0A 1A 0A 00
// Correct header:      89 50 4E 47 0D 0A 1A 0A
// 
// So: position 4 is 0A (should be 0D), position 5 is 1A (correct), position 6 is 0A (correct), position 7 is 00 (should be next byte of IHDR chunk)
//
// This means the script previously REMOVED a 0D that was at position 4 (before 0A at position 5)
// AND also removed 0D at position 7 (before 0A at position 8 of the correct file).
//
// The CORRECT original bytes: 89 50 4E 47 0D 0A 1A 0A [00 00 00 0D 49 48 44 52...]
// After git CRLF corruption:  89 50 4E 47 0D 0D 0A 1A 0D 0A [00 00 00 0D 49 48 44 52...]
//   (each 0A became 0D 0A, so 0D 0A -> 0D 0D 0A, and 1A 0A -> 1A 0D 0A)
// After bad CRLF->LF fix:     89 50 4E 47 0D 0A 1A 0A [00 00 00 0D 49 48 44 52...]
//   Wait this is CORRECT... hmm
//
// But scanner says header is 89 50 4E 47 0A 1A 0A 00
// That means fix script over-removed. The fix ran twice on some files (once on src, once on public copy).
// Running CRLF->LF twice would:
// First pass:  0D 0A -> 0A  (correct)
// Second pass: nothing to do if already 0A (fine)
// BUT: original byte 0D 0A 1A 0A:
//   After first corruption: 0D 0D 0A 1A 0D 0A
//   After first fix: 0D 0A 1A 0A (correct!)
//   After second fix on the already-correct file: 0A 1A 0A (WRONG - removed the 0D that was supposed to stay!)
//
// YES! That's the bug. The second fix ran on already-correct files and broke them.
// Now we need to re-run the fix by inserting 0D back before 0A in the PNG header.
//
// Strategy: For files with broken header 89 50 4E 47 0A 1A 0A:
//   Simply patch bytes 4-7 to be 0D 0A 1A 0A
//   The BODY data should be fine (it was correctly de-CRLFed in first pass, second pass didn't change it
//   because there were no more 0D 0A sequences in the body)

const assetDirs = [
  'E:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\src\\assets',
  'E:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\public\\assets',
];

function fixPng(filePath) {
  const buf = fs.readFileSync(filePath);
  
  // Must start with PNG magic bytes
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) {
    console.log('SKIP (not PNG):', path.basename(filePath));
    return;
  }
  
  // Already correct
  if (buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A) {
    console.log('OK:', path.basename(filePath));
    return;
  }
  
  // Broken header: 89 50 4E 47 0A 1A 0A xx -> need to insert 0D at position 4
  if (buf[4] === 0x0A && buf[5] === 0x1A && buf[6] === 0x0A) {
    // Insert 0D before position 4
    const fixed = Buffer.alloc(buf.length + 1);
    buf.copy(fixed, 0, 0, 4);    // Copy 89 50 4E 47
    fixed[4] = 0x0D;              // Insert 0D
    buf.copy(fixed, 5, 4);        // Copy rest (0A 1A 0A ...)
    
    fs.writeFileSync(filePath, fixed);
    console.log(`FIXED: ${path.basename(filePath)} (${buf.length} -> ${fixed.length} bytes)`);
    return;
  }
  
  // Unknown state
  console.log('UNKNOWN state:', path.basename(filePath), 
    'bytes 4-7:', [buf[4], buf[5], buf[6], buf[7]].map(b => '0x' + b.toString(16)).join(' '));
}

assetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  console.log('\n=== Processing:', dir, '===');
  function walk(d) {
    fs.readdirSync(d).forEach(f => {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (f.toLowerCase().endsWith('.png')) fixPng(full);
    });
  }
  walk(dir);
});

console.log('\nDone!');
