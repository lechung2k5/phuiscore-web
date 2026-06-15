const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MatchRepo = require('../src/repositories/match.repo');
const TournamentRepo = require('../src/repositories/tournament.repo');

const TOURNAMENT_ID = process.env.TIGER_SPORT_TOURNAMENT_ID || 'e691a46c-1a5e-469c-b363-139c007ac4c4';

const DISPLAY_NAMES = {
  'Nhi Phong FC': 'Nhi Phong FC',
  'Ngọc Giàu FC': 'Ngọc Giàu FC',
  'Khang Nguyễn FC': 'Khang Nguyễn FC',
  'Hòa Đen FC': 'Hòa Đen FC',
  'Danh Nhi FC': 'Danh Nhi FC',
  'Lọc Nước MTV FC': 'Lọc Nước MTV FC',
  'Vân Tuyền FC': 'Vân Tuyền FC',
  'Hải Đăng Vivaco FC': 'Hải Đăng Vivaco FC',
};

const normalize = (value = '') => String(value)
  .normalize('NFC')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .replace(/\s*-\s*/g, ' ')
  .replace(/fc$/i, '')
  .replace(/mặt trời việt|mat troi viet/g, 'mtv')
  .trim();

const aliases = {
  [normalize('Nhi Phong')]: 'Nhi Phong FC',
  [normalize('Ngọc Giàu')]: 'Ngọc Giàu FC',
  [normalize('Khang Nguyễn')]: 'Khang Nguyễn FC',
  [normalize('Hòa Đen')]: 'Hòa Đen FC',
  [normalize('Danh Nhi')]: 'Danh Nhi FC',
  [normalize('Lọc Nước MTV')]: 'Lọc Nước MTV FC',
  [normalize('Lọc Nước Mặt Trời Việt')]: 'Lọc Nước MTV FC',
  [normalize('Vân Tuyền')]: 'Vân Tuyền FC',
  [normalize('Hải Đăng Vivaco')]: 'Hải Đăng Vivaco FC',
};

const groupA = ['Nhi Phong FC', 'Ngọc Giàu FC', 'Khang Nguyễn FC', 'Hòa Đen FC'];
const groupB = ['Danh Nhi FC', 'Lọc Nước MTV FC', 'Vân Tuyền FC', 'Hải Đăng Vivaco FC'];

const schedule = [
  ['Vòng bảng', '2026-06-20', '18:00', 'Nhi Phong FC', 'Khang Nguyễn FC', 'A', 'Sân 1'],
  ['Vòng bảng', '2026-06-20', '18:00', 'Lọc Nước MTV FC', 'Hải Đăng Vivaco FC', 'B', 'Sân 2'],
  ['Vòng bảng', '2026-06-20', '19:30', 'Danh Nhi FC', 'Vân Tuyền FC', 'B', 'Sân 1'],
  ['Vòng bảng', '2026-06-20', '19:30', 'Ngọc Giàu FC', 'Hòa Đen FC', 'A', 'Sân 2'],
  ['Vòng bảng', '2026-06-21', '18:00', 'Lọc Nước MTV FC', 'Vân Tuyền FC', 'B', 'Sân 1'],
  ['Vòng bảng', '2026-06-21', '18:00', 'Nhi Phong FC', 'Hòa Đen FC', 'A', 'Sân 2'],
  ['Vòng bảng', '2026-06-21', '19:30', 'Ngọc Giàu FC', 'Khang Nguyễn FC', 'A', 'Sân 1'],
  ['Vòng bảng', '2026-06-21', '19:30', 'Danh Nhi FC', 'Hải Đăng Vivaco FC', 'B', 'Sân 2'],
  ['Vòng bảng', '2026-06-27', '18:00', 'Nhi Phong FC', 'Ngọc Giàu FC', 'A', 'Sân 1'],
  ['Vòng bảng', '2026-06-27', '18:00', 'Khang Nguyễn FC', 'Hòa Đen FC', 'A', 'Sân 2'],
  ['Vòng bảng', '2026-06-27', '19:30', 'Danh Nhi FC', 'Lọc Nước MTV FC', 'B', 'Sân 1'],
  ['Vòng bảng', '2026-06-27', '19:30', 'Vân Tuyền FC', 'Hải Đăng Vivaco FC', 'B', 'Sân 2'],
  ['Bán kết 1', '2026-06-28', '18:00', 'Nhất A', 'Nhì B', '-', 'Sân 1'],
  ['Bán kết 2', '2026-06-28', '19:30', 'Nhất B', 'Nhì A', '-', 'Sân 1'],
  ['Tranh Hạng 3', '2026-07-05', '17:30', 'Thua BK1', 'Thua BK2', '-', 'Sân 1'],
  ['Chung kết', '2026-07-05', '19:30', 'Thắng BK1', 'Thắng BK2', '-', 'Sân 1'],
];

const timestamp = (date, time) => new Date(`${date}T${time}:00+07:00`).getTime();

const main = async () => {
  const tournament = await TournamentRepo.getById(TOURNAMENT_ID);
  if (!tournament) throw new Error(`Tournament not found: ${TOURNAMENT_ID}`);

  const byDisplayName = new Map();
  const updatedTeams = (tournament.teams || []).map((team) => {
    const rawName = team.teamName || team.name || '';
    const displayName = aliases[normalize(rawName)] || rawName.replace(/\s+/g, ' ').trim();
    const patched = { ...team, teamName: displayName, name: team.name || displayName };
    byDisplayName.set(displayName, patched);
    return patched;
  });

  const teamOf = (name) => {
    const registration = byDisplayName.get(name);
    if (!registration) return { id: null, name, logo: '' };
    return {
      id: registration.teamId || registration.id || null,
      name: DISPLAY_NAMES[name] || name,
      logo: registration.logo || registration.teamLogo || '',
    };
  };

  const matches = schedule.map(([round, dateString, timeString, homeName, awayName, group, pitchNumber], index) => ({
    id: `tiger-sport-cup-2026-${String(index + 1).padStart(2, '0')}`,
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    tournamentLogo: tournament.banner || tournament.logo || '',
    dateString,
    timeString,
    stadium: tournament.stadium || 'Sân Tiger Sport',
    pitchNumber,
    round,
    group,
    homeTeam: teamOf(homeName),
    awayTeam: teamOf(awayName),
    score: { home: 0, away: 0 },
    homeScore: 0,
    awayScore: 0,
    status: 'Scheduled',
    currentMinute: 0,
    incidents: [],
    isManualControl: true,
    liveStatus: 'idle',
    startTimestamp: timestamp(dateString, timeString),
  }));

  const standingGroups = [
    { name: 'Bảng A', rows: groupA.map((name, index) => ({ rank: index + 1, team: teamOf(name), teamId: teamOf(name).id, teamName: name, teamLogo: teamOf(name).logo, played: 0, wins: 0, draws: 0, losses: 0, scoresFor: 0, scoresAgainst: 0, goalDifference: 0, points: 0, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: '' })) },
    { name: 'Bảng B', rows: groupB.map((name, index) => ({ rank: index + 1, team: teamOf(name), teamId: teamOf(name).id, teamName: name, teamLogo: teamOf(name).logo, played: 0, wins: 0, draws: 0, losses: 0, scoresFor: 0, scoresAgainst: 0, goalDifference: 0, points: 0, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: '' })) },
  ];

  const deleted = (await MatchRepo.getMatchesByTournament(TOURNAMENT_ID)).length;
  await MatchRepo.deleteMatchesByTournament(TOURNAMENT_ID);
  await MatchRepo.saveMatchesBatch(matches);
  await TournamentRepo.update(TOURNAMENT_ID, {
    format: 'GroupKnockout',
    teams: updatedTeams,
    standings: standingGroups,
    expectedStartDate: '2026-06-20',
    expectedEndDate: '2026-07-05',
  });

  console.log(`[TigerSport] Deleted ${deleted} old matches.`);
  console.log(`[TigerSport] Saved ${matches.length} matches for ${tournament.name}.`);
};

main().catch((error) => {
  console.error('[TigerSport] Failed:', error);
  process.exitCode = 1;
});
