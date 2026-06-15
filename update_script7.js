const fs = require('fs');
let oldContent = fs.readFileSync('MatchSchedule_old.tsx', 'utf8');
const currentContent = fs.readFileSync('packages/app/components/MatchSchedule.tsx', 'utf8');

// Extract the getSafeLogo block from currentContent
const blockStart = currentContent.indexOf('// --- BỘ LỌC FIX LỖI LOGO SOFASCORE 403 ---');
const blockEnd = currentContent.indexOf('// ----------------------------------------') + 44;
const safeLogoBlock = currentContent.substring(blockStart, blockEnd);

// Insert it into oldContent right before const blinkStyles =
oldContent = oldContent.replace('const blinkStyles =', safeLogoBlock + '\nconst blinkStyles =');

// Replace the fallback image logic in oldContent
oldContent = oldContent.replace(
  /<IMG src=\{league\.logo\} width=\{18\} height=\{18\}/g,
  `<IMG src={getSafeLogo(league.logo, 'tournament', league.name)} width={18} height={18}`
);

oldContent = oldContent.replace(
  /<IMG src=\{match\.homeTeam\.logo\} width=\{32\} height=\{32\} \/>/g,
  `<IMG src={getSafeLogo(match.homeTeam?.logo, 'team', match.homeTeam?.name)} width={32} height={32} />`
);

oldContent = oldContent.replace(
  /<IMG src=\{match\.awayTeam\.logo\} width=\{32\} height=\{32\} \/>/g,
  `<IMG src={getSafeLogo(match.awayTeam?.logo, 'team', match.awayTeam?.name)} width={32} height={32} />`
);

oldContent = oldContent.replace(
  /<IMG src=\{match\.homeTeam\.logo\} width=\{24\} height=\{24\}/g,
  `<IMG src={getSafeLogo(match.homeTeam?.logo, 'team', match.homeTeam?.name)} width={24} height={24}`
);

oldContent = oldContent.replace(
  /<IMG src=\{match\.awayTeam\.logo\} width=\{24\} height=\{24\}/g,
  `<IMG src={getSafeLogo(match.awayTeam?.logo, 'team', match.awayTeam?.name)} width={24} height={24}`
);

// We must also restore the `fetchMatches` logic. 
// In the old version, fetchMatches called `${API_BASE_URL}/matches/${selectedDate}`.
// Let's ensure the old version uses selectedDate. It should already do that because it's the `git show HEAD` version.

fs.writeFileSync('packages/app/components/MatchSchedule.tsx', oldContent);
console.log('Restored DatePicker and kept getSafeLogo fixes.');
