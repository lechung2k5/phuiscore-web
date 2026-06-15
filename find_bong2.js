const fs = require('fs');
const path = require('path');

const bongFolder = 'E:\\BÓNG ĐÁ SỐ MEDIA';
const codeBTS = path.join(bongFolder, 'CodeBTS');

console.log('Checking:', codeBTS);
if (!fs.existsSync(codeBTS)) {
  console.log('CodeBTS not found. Contents of BONG:');
  fs.readdirSync(bongFolder).forEach(f => console.log(' -', f));
  process.exit(1);
}

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (f.toLowerCase().endsWith('.png')) {
      const b = fs.readFileSync(full);
      const ok = b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A;
      console.log(`${ok ? 'OK ' : 'BAD'} | ${full}`);
    }
  });
}

walk(codeBTS);
