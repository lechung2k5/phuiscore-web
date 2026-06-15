const fs = require('fs');

const path = 'packages/app/components/MatchSchedule.tsx';
let content = fs.readFileSync(path, 'utf8');

const helperCode = `
// --- BỘ LỌC FIX LỖI LOGO SOFASCORE 403 ---
const WORLD_CUP_LOGO = 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/2026_FIFA_World_Cup_logo.svg/1200px-2026_FIFA_World_Cup_logo.svg.png';

const COUNTRY_MAP: any = {
  'Qatar': 'qa', 'Switzerland': 'ch', 'Brazil': 'br', 'Morocco': 'ma',
  'Haiti': 'ht', 'Scotland': 'gb-sct', 'Australia': 'au', 'Türkiye': 'tr',
  'Germany': 'de', 'Curaçao': 'cw', 'Argentina': 'ar', 'France': 'fr',
  'England': 'gb-eng', 'Spain': 'es', 'Portugal': 'pt', 'Netherlands': 'nl',
  'Italy': 'it', 'Croatia': 'hr', 'Uruguay': 'uy', 'Belgium': 'be',
  'Colombia': 'co', 'Senegal': 'sn', 'USA': 'us', 'Mexico': 'mx', 'Japan': 'jp',
  'Korea Republic': 'kr', 'Saudi Arabia': 'sa', 'Iran': 'ir', 'Canada': 'ca',
  'Ecuador': 'ec', 'Chile': 'cl', 'Peru': 'pe', 'Wales': 'gb-wls', 'Poland': 'pl',
  'Serbia': 'rs', 'Denmark': 'dk', 'Sweden': 'se', 'Nigeria': 'ng', 'Cameroon': 'cm',
  'Ghana': 'gh', 'Ivory Coast': 'ci', 'Algeria': 'dz', 'Egypt': 'eg', 'Vietnam': 'vn'
};

const getSafeLogo = (originalUrl: string, type: 'team' | 'tournament' = 'team', name: string = '') => {
  if (!originalUrl) {
    return type === 'tournament' 
      ? "https://www.sofascore.com/static/images/placeholders/tournament.png" 
      : "https://www.sofascore.com/static/images/placeholders/team.png";
  }

  // Nếu là ảnh tải lên nội bộ
  if (!originalUrl.startsWith('http')) {
    return \`\${API_BASE_URL}\${originalUrl}\`;
  }

  // Bị Cloudflare SofaScore block (403)
  if (originalUrl.includes('api.sofascore.app') || originalUrl.includes('sofascore.com')) {
    if (type === 'tournament' && (name.toLowerCase().includes('world cup') || originalUrl.includes('/16/'))) {
      return WORLD_CUP_LOGO;
    }
    
    if (type === 'team' && name) {
      const countryCode = COUNTRY_MAP[name];
      if (countryCode) {
        return \`https://flagcdn.com/w80/\${countryCode}.png\`;
      }
    }
    
    // Nếu không tìm thấy cờ, trả về Avatar chữ cái đầu (UI Avatars)
    return \`https://ui-avatars.com/api/?name=\${encodeURIComponent(name)}&background=random&color=fff&bold=true\`;
  }

  return originalUrl;
};
// ----------------------------------------
`;

content = content.replace(/const blinkStyles =/g, helperCode + '\nconst blinkStyles =');

content = content.replace(
  /<IMG src=\{league\.logo\} width=\{18\} height=\{18\}/g,
  `<IMG src={getSafeLogo(league.logo, 'tournament', league.name)} width={18} height={18}`
);

content = content.replace(
  /<IMG src=\{match\.homeTeam\.logo\} width=\{32\} height=\{32\} \/>/g,
  `<IMG src={getSafeLogo(match.homeTeam?.logo, 'team', match.homeTeam?.name)} width={32} height={32} />`
);

content = content.replace(
  /<IMG src=\{match\.awayTeam\.logo\} width=\{32\} height=\{32\} \/>/g,
  `<IMG src={getSafeLogo(match.awayTeam?.logo, 'team', match.awayTeam?.name)} width={32} height={32} />`
);

content = content.replace(
  /<IMG src=\{match\.homeTeam\.logo\} width=\{24\} height=\{24\}/g,
  `<IMG src={getSafeLogo(match.homeTeam?.logo, 'team', match.homeTeam?.name)} width={24} height={24}`
);

content = content.replace(
  /<IMG src=\{match\.awayTeam\.logo\} width=\{24\} height=\{24\}/g,
  `<IMG src={getSafeLogo(match.awayTeam?.logo, 'team', match.awayTeam?.name)} width={24} height={24}`
);

fs.writeFileSync(path, content);
console.log('Update getSafeLogo injected successfully to original file.');
