const fs = require('fs');

// Find the BONG DA folder
const eDrive = fs.readdirSync('E:\\');
const bongFolder = eDrive.find(f => f.startsWith('BONG'));
if (!bongFolder) {
  console.log('Not found. Folders:', eDrive.join(', '));
  process.exit(1);
}
console.log('Found:', bongFolder);

const codeBTS = `E:\\${bongFolder}\\CodeBTS`;
console.log('CodeBTS path:', codeBTS);

if (!fs.existsSync(codeBTS)) {
  console.log('CodeBTS not found');
  const items = fs.readdirSync(`E:\\${bongFolder}`);
  console.log('Contents:', items.join(', '));
} else {
  function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
      const full = `${dir}\\${f}`;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (f.endsWith('.png')) {
        const b = fs.readFileSync(full);
        const ok = b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A;
        console.log(`${ok ? 'OK ' : 'BAD'} | ${full}`);
      }
    });
  }
  walk(codeBTS);
}
