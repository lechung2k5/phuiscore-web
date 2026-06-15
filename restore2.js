const fs = require('fs');
const path = require('path');

const bong = 'E:\\BÓNG ĐÁ SỐ MEDIA';
const pub = 'e:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\public\\assets';
const src2 = 'e:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\src\\assets';

function isGoodPng(buf) {
  return buf[0]===0x89 && buf[1]===0x50 && buf[2]===0x4E && buf[3]===0x47 &&
         buf[4]===0x0D && buf[5]===0x0A && buf[6]===0x1A && buf[7]===0x0A;
}

function copyFile(from, ...dsts) {
  if (!fs.existsSync(from)) return false;
  const buf = fs.readFileSync(from);
  if (!isGoodPng(buf)) { console.log('BAD:', from); return false; }
  dsts.forEach(d => {
    fs.mkdirSync(path.dirname(d), {recursive:true});
    fs.writeFileSync(d, buf);
  });
  console.log('OK ->', path.basename(dsts[0]), `(${buf.length} bytes)`);
  return true;
}

// 1. Fix logo_giai.png root - dùng bản lớn từ bangtiso (LiveScoreboardVite)
console.log('=== Fix logo_giai.png ===');
copyFile(
  `${pub}\\bangtiso\\logo_giai.png`,
  `${pub}\\logo_giai.png`,
  `${src2}\\logo_giai.png`
);

// 2. logo_amban.png nằm thẳng trong BONG DA root
console.log('\n=== logo_amban ===');
copyFile(
  `${bong}\\logo_amban.png`,
  `${pub}\\banner_gioithieu\\logo_amban.png`,
  `${src2}\\banner_gioithieu\\logo_amban.png`
);

// 3. vs.png - tìm trong các thư mục
console.log('\n=== vs.png ===');
const vsCandidates = [
  `${bong}\\Chung_AFCU23\\IMG\\vs.png`,
  `${bong}\\PRESET_C1 ASIAN\\Image\\vs.png`,
  `${bong}\\VMIX NHAT\\SaruMinh\\Image\\vs.png`,
];
for (const c of vsCandidates) {
  if (copyFile(c, `${pub}\\banner_gioithieu\\vs.png`, `${src2}\\banner_gioithieu\\vs.png`)) break;
}

// 4. Search rộng hơn cho tất cả các file còn lại
console.log('\n=== Searching BONG DA broadly ===');
const targets = {
  'bg_trai': [], 'bg_phai': [], 'khung_giua': [],
  'khung_trai': [], 'khung_phai': [], 
  'bg_overlay': [], 'banner': [],
  'cau_thu': [], 'logo_doi': []
};

function walkDeep(dir, depth=0) {
  if (depth > 6 || !fs.existsSync(dir)) return;
  let items;
  try { items = fs.readdirSync(dir); } catch(e) { return; }
  items.forEach(f => {
    const full = path.join(dir, f);
    let stat;
    try { stat = fs.statSync(full); } catch(e) { return; }
    if (stat.isDirectory()) {
      walkDeep(full, depth+1);
    } else if (f.toLowerCase().endsWith('.png')) {
      const lf = f.toLowerCase().replace('.png','').replace(/\s/g,'_');
      Object.keys(targets).forEach(key => {
        if (lf.includes(key)) {
          const buf = fs.readFileSync(full);
          targets[key].push({ path: full, ok: isGoodPng(buf), size: buf.length });
        }
      });
    }
  });
}

walkDeep(bong);

Object.entries(targets).forEach(([key, files]) => {
  if (files.length > 0) {
    console.log(`\n[${key}]`);
    files.forEach(f => console.log(`  ${f.ok ? 'OK ' : 'BAD'} ${f.path} (${f.size})`));
  }
});
