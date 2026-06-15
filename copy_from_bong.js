const fs = require('fs');
const path = require('path');

const bongBase = 'E:\\BÓNG ĐÁ SỐ MEDIA\\CodeBTS\\LiveScoreboardVite\\dist\\assets';
const dst1 = 'e:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\public\\assets';
const dst2 = 'e:\\Hoc_ReactJS\\phuiscore-web\\vmix-overlay-system\\client\\src\\assets';

// Map files from BONG DA to destination
const fileMappings = [
  // bangtiso
  { src: 'team_home-B1nEwJKM.png', dst: 'bangtiso/team_home-B1nEwJKM.png' },
  { src: 'team_away-CRjDKtHD.png', dst: 'bangtiso/team_away-CRjDKtHD.png' },
  { src: 'score_time-DR0GiOXL.png', dst: 'bangtiso/score_time-DR0GiOXL.png' },
  { src: 'league_logo-BWKIhKEB.png', dst: 'bangtiso/league_logo-BWKIhKEB.png' },
  { src: 'logo_giai.png', dst: 'bangtiso/logo_giai.png' },
  { src: 'bts_duoi/bg_phai.png', dst: 'bts_duoi/khung_phai.png' },
  { src: 'bts_duoi/bg_trai.png', dst: 'bts_duoi/khung_trai.png' },
];

fileMappings.forEach(({ src, dst }) => {
  const srcPath = path.join(bongBase, src);
  if (!fs.existsSync(srcPath)) {
    console.log('NOT FOUND:', srcPath);
    return;
  }
  const buf = fs.readFileSync(srcPath);
  const ok = buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A;
  
  [dst1, dst2].forEach(base => {
    const dstPath = path.join(base, dst);
    fs.mkdirSync(path.dirname(dstPath), { recursive: true });
    fs.writeFileSync(dstPath, buf);
    console.log(`${ok ? 'OK' : 'BAD'} -> ${dstPath}`);
  });
});

// Also copy from ScoreboardWeb which has original named files
const scoreboardWeb = 'E:\\BÓNG ĐÁ SỐ MEDIA\\CodeBTS\\ScoreboardWeb\\assets';
const scoreboardMappings = [
  { src: 'score_time.png', dst: 'bangtiso/score_time-DR0GiOXL.png' }, // may be same or similar
  { src: 'team_home.png', dst: null }, // for reference only  
  { src: 'team_away.png', dst: null },
  { src: 'league_logo.png', dst: 'logo_giai.png' },
];

console.log('\nScoreboardWeb files (for reference):');
scoreboardMappings.forEach(({ src }) => {
  const p = path.join(scoreboardWeb, src);
  if (fs.existsSync(p)) {
    const b = fs.readFileSync(p);
    const ok = b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A;
    console.log(`${ok ? 'OK' : 'BAD'} - ${src} (${b.length} bytes)`);
  }
});

console.log('\nDone!');
