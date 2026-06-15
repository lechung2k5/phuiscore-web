const fs = require('fs');

const path = 'packages/app/components/MatchSchedule.tsx';
let content = fs.readFileSync(path, 'utf8');

// Helper to use in replacement
const fallbackLeague = `!league.logo ? "https://www.sofascore.com/static/images/placeholders/tournament.png" : (league.logo.startsWith('http') ? league.logo : \`\${API_BASE_URL}\${league.logo}\`)`;

const fallbackHomeTeam = `!match.homeTeam?.logo ? "https://www.sofascore.com/static/images/placeholders/team.png" : (match.homeTeam.logo.startsWith('http') ? match.homeTeam.logo : \`\${API_BASE_URL}\${match.homeTeam.logo}\`)`;

const fallbackAwayTeam = `!match.awayTeam?.logo ? "https://www.sofascore.com/static/images/placeholders/team.png" : (match.awayTeam.logo.startsWith('http') ? match.awayTeam.logo : \`\${API_BASE_URL}\${match.awayTeam.logo}\`)`;

// Replace league logo
content = content.replace(
  /<IMG src=\{league\.logo\} width=\{18\} height=\{18\}/g,
  `<IMG src={${fallbackLeague}} width={18} height={18}`
);

// Replace homeTeam logo size 32
content = content.replace(
  /<IMG src=\{match\.homeTeam\.logo\} width=\{32\} height=\{32\} \/>/g,
  `<IMG src={${fallbackHomeTeam}} width={32} height={32} />`
);

// Replace awayTeam logo size 32
content = content.replace(
  /<IMG src=\{match\.awayTeam\.logo\} width=\{32\} height=\{32\} \/>/g,
  `<IMG src={${fallbackAwayTeam}} width={32} height={32} />`
);

// Replace homeTeam logo size 24
content = content.replace(
  /<IMG src=\{match\.homeTeam\.logo\} width=\{24\} height=\{24\}/g,
  `<IMG src={${fallbackHomeTeam}} width={24} height={24}`
);

// Replace awayTeam logo size 24
content = content.replace(
  /<IMG src=\{match\.awayTeam\.logo\} width=\{24\} height=\{24\}/g,
  `<IMG src={${fallbackAwayTeam}} width={24} height={24}`
);

fs.writeFileSync(path, content);
console.log('Update logo fallbacks complete!');
