require('dotenv').config();

const { PutCommand, QueryCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../src/config/db.config');

const TOURNAMENT_ID = process.env.SEED_TOURNAMENT_ID || 'seed-8-team-ongoing-2026';
const STANDING_TOURNAMENT_ID = Number(process.env.SEED_STANDING_TOURNAMENT_ID || 900001);
const SEASON_ID = Number(process.env.SEED_SEASON_ID || 2026);

const TABLES = {
  tournaments: 'PhuiScore_Tournaments',
  teams: 'PhuiScore_Teams',
  teamMembers: 'PhuiScore_TeamMembers',
  matches: process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Matches` : 'PhuiScore_Matches',
  standings: process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Standings` : 'PhuiScore_Standings',
  auditLogs: 'PhuiScore_AuditLogs',
};

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;
const dateString = (offset) => new Date(now + offset * dayMs).toISOString().split('T')[0];
const timestamp = (date, time) => new Date(`${date}T${time}:00+07:00`).getTime();

const colors = ['#16a34a', '#2563eb', '#dc2626', '#f59e0b', '#7c3aed', '#0f766e', '#be123c', '#4b5563'];

const teams = [
  ['seed-team-01', 'Phui Score FC', 'PSF', 'Quan 1'],
  ['seed-team-02', 'Binh Thanh United', 'BTU', 'Binh Thanh'],
  ['seed-team-03', 'Sai Gon Warriors', 'SGW', 'Quan 3'],
  ['seed-team-04', 'Thu Duc Stars', 'TDS', 'Thu Duc'],
  ['seed-team-05', 'Tan Binh Eagles', 'TBE', 'Tan Binh'],
  ['seed-team-06', 'Go Vap Lions', 'GVL', 'Go Vap'],
  ['seed-team-07', 'District 7 Storm', 'D7S', 'Quan 7'],
  ['seed-team-08', 'Hoc Mon Rangers', 'HMR', 'Hoc Mon'],
].map(([id, name, shortName, area], index) => ({
  id,
  name,
  short_name: shortName,
  area,
  logo_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(shortName)}&backgroundColor=${colors[index].replace('#', '')}`,
  primary_color: colors[index],
  secondary_color: '#111827',
  managerId: 'seed_admin',
  leader: `${name} Manager`,
  phone: `09000000${index + 1}`,
  status: 'active',
  createdAt: now - 14 * dayMs,
  updatedAt: now,
}));

const playerNames = [
  ['Nguyễn Văn Quyết', 'Phạm Tuấn Hải', 'Đỗ Duy Mạnh', 'Nguyễn Thành Chung', 'Bùi Hoàng Việt Anh'],
  ['Nguyễn Quang Hải', 'Đoàn Văn Hậu', 'Hồ Tấn Tài', 'Vũ Văn Thanh', 'Nguyễn Tiến Linh'],
  ['Nguyễn Tuấn Anh', 'Nguyễn Phong Hồng Duy', 'Vũ Minh Tuấn', 'Nguyễn Hoàng Đức', 'Bùi Tiến Dũng'],
  ['Đặng Văn Lâm', 'Quế Ngọc Hải', 'Bùi Tiến Dụng', 'Hà Đức Chinh', 'Phan Văn Đức'],
  ['Nguyễn Văn Toàn', 'Nguyễn Công Phượng', 'Lương Xuân Trường', 'Trần Đình Trọng', 'Trần Minh Vương'],
  ['Nguyễn Trọng Hoàng', 'Phạm Đức Huy', 'Nguyễn Anh Đức', 'Lê Công Vinh', 'Phạm Thành Lương'],
  ['Nguyễn Phi Hoàng', 'Đinh Thanh Trung', 'Nguyễn Xuân Sơn', 'Nguyễn Hải Huy', 'Mạc Hồng Quân'],
  ['Nguyễn Filip', 'Patrik Lê Giang', 'Đỗ Hùng Dũng', 'Nguyễn Thái Sơn', 'Khuất Văn Khang'],
];

const teamRegistrations = teams.map((team, index) => ({
  id: `seed-reg-${String(index + 1).padStart(2, '0')}`,
  teamId: team.id,
  teamName: team.name,
  logo: team.logo_url,
  jerseyColor: team.primary_color,
  jerseyColorAlt: team.secondary_color,
  managerName: team.leader,
  managerPhone: team.phone,
  managerEmail: `${team.short_name.toLowerCase()}@phuiscore.test`,
  coachName: `${team.short_name} Coach`,
  coachPhone: `09110000${index + 1}`,
  playerCount: 5,
  players: playerNames[index].map((name, playerIndex) => ({
    id: `seed-player-${index + 1}-${playerIndex + 1}`,
    name,
    number: playerIndex + 7,
    position: ['GK', 'DF', 'MF', 'FW', 'FW'][playerIndex],
  })),
  note: 'Seed demo: ho so da duoc xac nhan de test giai dang dien ra.',
  status: 'Confirmed',
  btcNote: 'Da xac nhan ho so.',
  userId: `seed_manager_${index + 1}`,
  registeredAt: now - (12 - index) * dayMs,
  updatedAt: now - 2 * dayMs,
}));

const matchDefs = [
  [-3, '18:00', 'A', 1, 2, 'Finished', 2, 1],
  [-3, '19:15', 'A', 3, 4, 'Finished', 1, 1],
  [-2, '18:00', 'B', 5, 6, 'Finished', 3, 0],
  [-2, '19:15', 'B', 7, 8, 'Finished', 0, 2],
  [0, '18:00', 'A', 1, 3, 'Ongoing', 1, 0, 54],
  [0, '19:15', 'A', 2, 4, 'Scheduled', 0, 0],
  [1, '18:00', 'B', 5, 7, 'Scheduled', 0, 0],
  [1, '19:15', 'B', 6, 8, 'Scheduled', 0, 0],
  [3, '18:00', 'A', 1, 4, 'Scheduled', 0, 0],
  [3, '19:15', 'A', 2, 3, 'Scheduled', 0, 0],
  [4, '18:00', 'B', 5, 8, 'Scheduled', 0, 0],
  [4, '19:15', 'B', 6, 7, 'Scheduled', 0, 0],
];

const buildIncidents = ({ homeNo, awayNo, homeScore, awayScore, status, index }) => {
  if (status === 'Scheduled') return [];
  const incidents = [];
  const homePlayers = playerNames[homeNo - 1];
  const awayPlayers = playerNames[awayNo - 1];

  for (let i = 0; i < homeScore; i += 1) {
    incidents.push({
      minute: 10 + i * 14,
      type: 'goal',
      team: 'home',
      player: homePlayers[(i + index) % homePlayers.length],
    });
  }

  for (let i = 0; i < awayScore; i += 1) {
    incidents.push({
      minute: 18 + i * 13,
      type: 'goal',
      team: 'away',
      player: awayPlayers[(i + index + 1) % awayPlayers.length],
    });
  }

  incidents.push({
    minute: 31,
    type: 'yellowCard',
    team: index % 2 === 0 ? 'home' : 'away',
    player: (index % 2 === 0 ? homePlayers : awayPlayers)[2],
  });

  if (index % 3 === 0) {
    incidents.push({
      minute: 44,
      type: 'yellowCard',
      team: 'away',
      player: awayPlayers[3],
    });
  }

  if (index % 5 === 0) {
    incidents.push({
      minute: 56,
      type: 'redCard',
      team: 'home',
      player: homePlayers[4],
    });
  }

  return incidents.sort((a, b) => a.minute - b.minute);
};

const makeMatch = ([offset, time, group, homeNo, awayNo, status, homeScore, awayScore, minute], index) => {
  const date = dateString(offset);
  const home = teams[homeNo - 1];
  const away = teams[awayNo - 1];
  return {
    pk: `DATE#${date}`,
    sk: `MATCH#seed-match-${String(index + 1).padStart(2, '0')}`,
    id: `seed-match-${String(index + 1).padStart(2, '0')}`,
    tournamentId: TOURNAMENT_ID,
    tournamentName: 'PhuiScore Seed Cup 2026',
    tournamentLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=PhuiScoreSeedCup',
    gsi1_pk: `TOURNAMENT#${TOURNAMENT_ID}`,
    dateString: date,
    timeString: time,
    stadium: 'San bong PhuiScore Arena',
    pitchNumber: group === 'A' ? 'San A' : 'San B',
    round: `Vong bang ${group}`,
    group,
    homeTeam: { id: home.id, name: home.name, logo: home.logo_url },
    awayTeam: { id: away.id, name: away.name, logo: away.logo_url },
    score: { home: homeScore, away: awayScore },
    homeScore,
    awayScore,
    status,
    currentMinute: status === 'Ongoing' ? minute || 1 : 0,
    startTimestamp: timestamp(date, time),
    seasonId: SEASON_ID,
    isManualControl: status === 'Ongoing',
    liveStatus: status === 'Ongoing' ? 'streaming' : 'idle',
    incidents: buildIncidents({ homeNo, awayNo, homeScore, awayScore, status, index }),
    statistics: status === 'Scheduled' ? [] : [
      { groupName: 'Tong quan', statisticsItems: [
        { name: 'Shots on target', home: String(4 + homeScore), away: String(3 + awayScore) },
        { name: 'Possession', home: '54%', away: '46%' },
      ] },
    ],
    updatedAt: new Date().toISOString(),
  };
};

const matches = matchDefs.map(makeMatch);

const buildRows = (groupTeams, groupName) => {
  const rows = groupTeams.map((team) => ({
    team: { id: team.id, name: team.name, shortName: team.short_name, logo: team.logo_url },
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    scoresFor: 0,
    scoresAgainst: 0,
    points: 0,
    form: [],
  }));

  for (const match of matches.filter((m) => m.group === groupName && ['Finished', 'Ongoing'].includes(m.status))) {
    const home = rows.find((row) => row.team.id === match.homeTeam.id);
    const away = rows.find((row) => row.team.id === match.awayTeam.id);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.scoresFor += match.homeScore;
    home.scoresAgainst += match.awayScore;
    away.scoresFor += match.awayScore;
    away.scoresAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.wins += 1; home.points += 3; home.form.push('W');
      away.losses += 1; away.form.push('L');
    } else if (match.homeScore < match.awayScore) {
      away.wins += 1; away.points += 3; away.form.push('W');
      home.losses += 1; home.form.push('L');
    } else {
      home.draws += 1; away.draws += 1;
      home.points += 1; away.points += 1;
      home.form.push('D'); away.form.push('D');
    }
  }

  return rows
    .map((row) => ({
      ...row,
      goalDifference: row.scoresFor - row.scoresAgainst,
      mp: row.played,
      w: row.wins,
      d: row.draws,
      l: row.losses,
      gf: row.scoresFor,
      ga: row.scoresAgainst,
      gd: row.scoresFor - row.scoresAgainst,
      pts: row.points,
      form: row.form.slice(-5).join(''),
    }))
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.scoresFor - a.scoresFor)
    .map((row, index) => ({ ...row, rank: index + 1 }));
};

const standings = [
  { name: 'Bang A', rows: buildRows(teams.slice(0, 4), 'A') },
  { name: 'Bang B', rows: buildRows(teams.slice(4, 8), 'B') },
];

const statPlayers = teamRegistrations.flatMap((team, teamIndex) =>
  team.players.map((player, playerIndex) => ({
    playerName: player.name,
    teamName: team.teamName,
    teamLogo: team.logo,
    seedScore: 10 - playerIndex + (teamIndex % 3),
    yellowCards: playerIndex % 3,
    redCards: playerIndex === 4 && teamIndex % 2 === 0 ? 1 : 0,
  }))
);

const tournamentStats = {
  topScorers: statPlayers
    .map((player, index) => ({
      ...player,
      goals: Math.max(1, player.seedScore - Math.floor(index / 8)),
    }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10),
  cards: statPlayers
    .filter((player) => player.yellowCards || player.redCards)
    .sort((a, b) => (b.yellowCards + b.redCards * 2) - (a.yellowCards + a.redCards * 2))
    .slice(0, 10),
};

const chunk = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

const batchDelete = async (tableName, keys) => {
  for (const group of chunk(keys, 25)) {
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [tableName]: group.map((Key) => ({ DeleteRequest: { Key } })),
      },
    }));
  }
};

const deleteExistingSeedMatches = async () => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.matches,
      IndexName: 'TournamentIndex',
      KeyConditionExpression: 'gsi1_pk = :gsi',
      ExpressionAttributeValues: { ':gsi': `TOURNAMENT#${TOURNAMENT_ID}` },
    }));
    const keys = (result.Items || []).map((item) => ({ pk: item.pk, sk: item.sk }));
    if (keys.length > 0) await batchDelete(TABLES.matches, keys);
    return keys.length;
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') return 0;
    throw err;
  }
};

const put = (TableName, Item) => docClient.send(new PutCommand({ TableName, Item }));

const seed = async () => {
  console.log(`[Seed] Seeding 8-team ongoing tournament: ${TOURNAMENT_ID}`);
  const deletedMatches = await deleteExistingSeedMatches();
  if (deletedMatches) console.log(`[Seed] Removed ${deletedMatches} old seed matches.`);

  for (const team of teams) {
    await put(TABLES.teams, team);
  }

  for (const [teamIndex, team] of teams.entries()) {
    for (const [playerIndex, player] of playerNames[teamIndex].entries()) {
      await put(TABLES.teamMembers, {
        id: `seed-member-${teamIndex + 1}-${playerIndex + 1}`,
        teamId: team.id,
        name: player,
        shirtNumber: playerIndex + 7,
        position: ['GK', 'DF', 'MF', 'FW', 'FW'][playerIndex],
        role: playerIndex === 0 ? 'captain' : 'player',
        status: 'active',
        avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(player)}`,
        createdAt: now - 10 * dayMs,
        updatedAt: now,
      });
    }
  }

  const tournament = {
    id: TOURNAMENT_ID,
    name: 'PhuiScore Seed Cup 2026',
    region: 'TP.HCM',
    stadium: 'San bong PhuiScore Arena',
    format: 'GroupKnockout',
    maxTeams: 8,
    pitchType: 'San 7',
    entryFee: 1500000,
    phone: '0909999999',
    organizerId: 'seed_admin',
    organizerName: 'BTC Seed Demo',
    status: 'Ongoing',
    expectedStartDate: dateString(-3),
    expectedEndDate: dateString(10),
    deadline: dateString(-12),
    banner: 'https://api.dicebear.com/7.x/shapes/svg?seed=PhuiScoreSeedCupBanner',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=PhuiScoreSeedCup',
    config: { matchDuration: 50, maxPlayers: 14 },
    rankingCriteria: ['Points', 'GoalDifference', 'GoalsFor', 'HeadToHead'],
    teams: teamRegistrations,
    standings,
    stats: tournamentStats,
    demoStandingTournamentId: STANDING_TOURNAMENT_ID,
    createdAt: now - 20 * dayMs,
    updatedAt: now,
  };

  await put(TABLES.tournaments, tournament);

  for (const match of matches) {
    await put(TABLES.matches, match);
  }

  await put(TABLES.standings, {
    tournamentId: STANDING_TOURNAMENT_ID,
    seasonId: SEASON_ID,
    tournamentInfo: {
      id: STANDING_TOURNAMENT_ID,
      name: 'PhuiScore Seed Cup 2026',
      logo: tournament.logo,
    },
    standings,
    lastUpdated: now,
  });

  await put(TABLES.auditLogs, {
    id: `seed-audit-${now}`,
    timestamp: now,
    userId: 'seed_admin',
    action: 'SEED_TOURNAMENT_WORKFLOW',
    entityType: 'TOURNAMENT',
    entityId: TOURNAMENT_ID,
    note: 'Seeded 8-team ongoing tournament workflow for testing.',
  }).catch((err) => console.warn(`[Seed] Audit log skipped: ${err.message}`));

  console.log('[Seed] Done.');
  console.log(`Tournament URL: /giai-dau/${TOURNAMENT_ID}`);
  console.log(`Admin URL: /admin/tournaments/${TOURNAMENT_ID}`);
  console.log(`Standings demo numeric ID: ${STANDING_TOURNAMENT_ID}`);
  console.log(`Matches seeded: ${matches.length}, teams seeded: ${teams.length}, members seeded: ${teams.length * 5}`);
};

seed().catch((err) => {
  console.error('[Seed failed]', err);
  process.exitCode = 1;
});
