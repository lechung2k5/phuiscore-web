const fs = require('fs');
const path = require('path');

const bong = 'E:\\BÓNG ĐÁ SỐ MEDIA\\CodeBTS';
const pub = 'e:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\public\\assets';
const src = 'e:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\src\\assets';

function copy(from, ...toDsts) {
  if (!fs.existsSync(from)) { console.log('NOT FOUND:', from); return false; }
  const buf = fs.readFileSync(from);
  const ok = buf[4]===0x0D && buf[5]===0x0A && buf[6]===0x1A && buf[7]===0x0A;
  if (!ok) { console.log('BAD header:', from); return false; }
  toDsts.forEach(dst => {
    fs.mkdirSync(path.dirname(dst), {recursive:true});
    fs.writeFileSync(dst, buf);
  });
  console.log('OK ->', toDsts[0].split('public\\assets\\')[1] || toDsts[0]);
  return true;
}

// 1. logo_giai.png (root)
copy(
  `${bong}\\ScoreboardWeb\\assets\\league_logo.png`,
  `${pub}\\logo_giai.png`, `${src}\\logo_giai.png`
);

// 2. nha_tai_tro (from PressConference)
copy(`${bong}\\PressConferenceOverlayVite\\dist\\assets\\Nha_Tai_Tro\\akpro.png`,    `${pub}\\nha_tai_tro\\AKPRO.png`,    `${src}\\nha_tai_tro\\AKPRO.png`);
copy(`${bong}\\PressConferenceOverlayVite\\dist\\assets\\Nha_Tai_Tro\\hoangnong.png`, `${pub}\\nha_tai_tro\\HOANGNONG.png`, `${src}\\nha_tai_tro\\HOANGNONG.png`);
copy(`${bong}\\PressConferenceOverlayVite\\dist\\assets\\Nha_Tai_Tro\\ligpro.png`,    `${pub}\\nha_tai_tro\\ligpro.png`,    `${src}\\nha_tai_tro\\ligpro.png`);

// 3. List what's available for the remaining broken files
console.log('\n--- Searching for remaining broken files ---');
const toFind = ['vs', 'bg_trai', 'bg_phai', 'bg_overlay', 'khung_giua', 'khung_trai', 'khung_phai'];

function walkSearch(dir, keywords) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walkSearch(full, keywords);
      else if (f.toLowerCase().endsWith('.png')) {
        const name = f.toLowerCase().replace('.png','');
        if (keywords.some(k => name.includes(k))) {
          const buf = fs.readFileSync(full);
          const ok = buf[4]===0x0D && buf[5]===0x0A && buf[6]===0x1A && buf[7]===0x0A;
          console.log(`${ok ? 'OK' : 'BAD'} | ${full}`);
        }
      }
    } catch(e) {}
  });
}

walkSearch(bong, toFind);
