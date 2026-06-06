const TournamentRepo = require('../repositories/tournament.repo');
const UserRepo = require('../repositories/user.repo');
const MatchRepo = require('../repositories/match.repo');
const NotificationRepo = require('../repositories/notification.repo');
const { generateStructure, allocateGreedy } = require('../utils/scheduler');
const { v4: uuidv4 } = require('uuid');
const { auditLog } = require('../utils/auditLogger');

const normalizeStatus = (status = '') => String(status).toLowerCase();
const isPlayedStatus = (status) => ['finished', 'ongoing', 'inprogress', 'live'].includes(normalizeStatus(status));
const isFinishedStatus = (status) => ['finished', 'ended', 'fulltime', 'ft'].includes(normalizeStatus(status));
const isScheduledStatus = (status) => ['scheduled', 'notstarted', 'pending'].includes(normalizeStatus(status));

const getScoreValue = (match, side) => {
  const direct = side === 'home' ? match.homeScore : match.awayScore;
  const score = match.score?.[side];
  const value = direct ?? (typeof score === 'object' ? score?.current : score);
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getTeamId = (team) => String(team?.id || team?.teamId || team?.name || 'unknown');
const getTeamName = (team) => team?.name || team?.teamName || team?.shortName || 'TBA';
const getTeamLogo = (team) => team?.logo || team?.photo || team?.logo_url || '';

const eventTypeOf = (event) => String(event.type || event.incidentType || event.eventType || '').toLowerCase();
const eventPlayerOf = (event) => event.playerName || event.player?.name || event.player || event.name || 'Chưa rõ cầu thủ';

const eventTeamInfo = (event, match) => {
  const raw = String(event.team || event.incidentClass || event.side || '').toLowerCase();
  if (raw.includes('away')) return match.awayTeam;
  if (raw.includes('home')) return match.homeTeam;
  const teamId = event.teamId || event.team?.id;
  if (teamId && String(teamId) === getTeamId(match.awayTeam)) return match.awayTeam;
  return match.homeTeam;
};

const addPlayerStat = (map, key, patch) => {
  const current = map.get(key) || {
    playerName: patch.playerName,
    teamName: patch.teamName,
    teamLogo: patch.teamLogo,
    goals: 0,
    yellowCards: 0,
    redCards: 0,
  };
  map.set(key, {
    ...current,
    goals: current.goals + (patch.goals || 0),
    yellowCards: current.yellowCards + (patch.yellowCards || 0),
    redCards: current.redCards + (patch.redCards || 0),
  });
};

const buildTournamentStats = (tournament, matches = []) => {
  const teams = new Map();
  const ensureTeam = (team) => {
    const id = getTeamId(team);
    if (!teams.has(id)) {
      teams.set(id, {
        teamId: id,
        teamName: getTeamName(team),
        teamLogo: getTeamLogo(team),
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        cleanSheets: 0,
        yellowCards: 0,
        redCards: 0,
        fairPlayPoints: 0,
        form: '',
      });
    }
    return teams.get(id);
  };

  (tournament.teams || []).forEach((team) => ensureTeam({
    id: team.teamId || team.id,
    name: team.teamName || team.name,
    logo: team.logo,
  }));

  (tournament.standings || []).forEach((group) => {
    (group.rows || []).forEach((row) => ensureTeam(row.team || {
      id: row.teamId || row.id,
      name: row.teamName || row.name,
      logo: row.teamLogo || row.logo,
    }));
  });

  const playerStats = new Map();
  const playedMatches = matches.filter((match) => isPlayedStatus(match.status));
  const finishedMatches = matches.filter((match) => isFinishedStatus(match.status));
  const scheduledMatches = matches.filter((match) => isScheduledStatus(match.status));
  const liveMatches = matches.filter((match) => ['ongoing', 'inprogress', 'live'].includes(normalizeStatus(match.status)));
  let totalGoals = 0;
  let totalYellowCards = 0;
  let totalRedCards = 0;

  const highlights = {
    highestScoring: null,
    biggestWin: null,
    mostCards: null,
    latestFinished: null,
  };

  for (const match of playedMatches) {
    const home = ensureTeam(match.homeTeam);
    const away = ensureTeam(match.awayTeam);
    const homeScore = getScoreValue(match, 'home');
    const awayScore = getScoreValue(match, 'away');
    const goals = homeScore + awayScore;
    const cardCountForMatch = { total: 0 };
    totalGoals += goals;

    if (isFinishedStatus(match.status)) {
      home.played += 1;
      away.played += 1;
      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;
      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;
      if (awayScore === 0) home.cleanSheets += 1;
      if (homeScore === 0) away.cleanSheets += 1;

      if (homeScore > awayScore) {
        home.wins += 1; away.losses += 1; home.form += 'W'; away.form += 'L';
      } else if (homeScore < awayScore) {
        away.wins += 1; home.losses += 1; away.form += 'W'; home.form += 'L';
      } else {
        home.draws += 1; away.draws += 1; home.form += 'D'; away.form += 'D';
      }
    }

    for (const event of match.incidents || match.events || []) {
      const type = eventTypeOf(event);
      const team = eventTeamInfo(event, match);
      const teamStat = ensureTeam(team);
      const playerName = eventPlayerOf(event);
      const playerKey = `${getTeamId(team)}::${playerName}`;

      if (type.includes('goal') && !type.includes('own')) {
        addPlayerStat(playerStats, playerKey, {
          playerName,
          teamName: getTeamName(team),
          teamLogo: getTeamLogo(team),
          goals: 1,
        });
      }

      if (type.includes('yellow')) {
        totalYellowCards += 1;
        cardCountForMatch.total += 1;
        teamStat.yellowCards += 1;
        addPlayerStat(playerStats, playerKey, {
          playerName,
          teamName: getTeamName(team),
          teamLogo: getTeamLogo(team),
          yellowCards: 1,
        });
      }

      if (type.includes('red')) {
        totalRedCards += 1;
        cardCountForMatch.total += 1;
        teamStat.redCards += 1;
        addPlayerStat(playerStats, playerKey, {
          playerName,
          teamName: getTeamName(team),
          teamLogo: getTeamLogo(team),
          redCards: 1,
        });
      }
    }

    const matchSummary = {
      id: match.id,
      dateString: match.dateString,
      timeString: match.timeString,
      status: match.status,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore,
      awayScore,
      totalGoals: goals,
      goalMargin: Math.abs(homeScore - awayScore),
      totalCards: cardCountForMatch.total,
    };

    if (!highlights.highestScoring || goals > highlights.highestScoring.totalGoals) highlights.highestScoring = matchSummary;
    if (!highlights.biggestWin || matchSummary.goalMargin > highlights.biggestWin.goalMargin) highlights.biggestWin = matchSummary;
    if (!highlights.mostCards || cardCountForMatch.total > highlights.mostCards.totalCards) highlights.mostCards = matchSummary;
    if (isFinishedStatus(match.status) && (!highlights.latestFinished || Number(match.startTimestamp || 0) > Number(highlights.latestFinished.startTimestamp || 0))) {
      highlights.latestFinished = { ...matchSummary, startTimestamp: match.startTimestamp };
    }
  }

  const fallbackTopScorers = tournament.stats?.topScorers || [];
  const fallbackCards = tournament.stats?.cards || [];
  for (const player of fallbackTopScorers) {
    const key = `${player.teamName || ''}::${player.playerName}`;
    if (!playerStats.has(key)) addPlayerStat(playerStats, key, player);
  }
  for (const player of fallbackCards) {
    const key = `${player.teamName || ''}::${player.playerName}`;
    if (!playerStats.has(key)) addPlayerStat(playerStats, key, player);
  }

  const teamStats = Array.from(teams.values()).map((team) => ({
    ...team,
    goalDifference: team.goalsFor - team.goalsAgainst,
    points: team.wins * 3 + team.draws,
    fairPlayPoints: team.yellowCards + team.redCards * 3,
    form: team.form.slice(-5),
  }));

  const players = Array.from(playerStats.values());
  const topScorers = players.filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 20);
  const cards = players
    .filter((p) => p.yellowCards || p.redCards)
    .sort((a, b) => (b.yellowCards + b.redCards * 3) - (a.yellowCards + a.redCards * 3))
    .slice(0, 20);

  return {
    summary: {
      totalMatches: matches.length,
      playedMatches: playedMatches.length,
      finishedMatches: finishedMatches.length,
      scheduledMatches: scheduledMatches.length,
      liveMatches: liveMatches.length,
      totalGoals,
      goalsPerMatch: finishedMatches.length ? Number((totalGoals / finishedMatches.length).toFixed(2)) : 0,
      totalYellowCards,
      totalRedCards,
      cardsPerMatch: playedMatches.length ? Number(((totalYellowCards + totalRedCards) / playedMatches.length).toFixed(2)) : 0,
    },
    teamStats,
    topScorers,
    cards,
    highlights,
    updatedAt: new Date().toISOString(),
  };
};

const buildTournamentStandings = (tournament, matches = []) => {
  const groups = new Map();
  const addTeam = (team, groupName = 'Bảng xếp hạng') => {
    const id = getTeamId(team);
    if (!groups.has(groupName)) groups.set(groupName, new Map());
    const rows = groups.get(groupName);
    if (!rows.has(id)) {
      rows.set(id, {
        team: { id, name: getTeamName(team), shortName: getTeamName(team), logo: getTeamLogo(team) },
        teamId: id,
        teamName: getTeamName(team),
        teamLogo: getTeamLogo(team),
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        scoresFor: 0,
        scoresAgainst: 0,
        points: 0,
        form: [],
      });
    }
    return rows.get(id);
  };

  for (const registration of tournament.teams || []) {
    addTeam({
      id: registration.id || registration.teamId,
      name: registration.teamName || registration.name,
      logo: registration.logo,
    });
  }

  for (const match of matches.filter((m) => isFinishedStatus(m.status) || normalizeStatus(m.status) === 'ongoing')) {
    const groupName = match.group ? `Bảng ${match.group}` : 'Bảng xếp hạng';
    const home = addTeam(match.homeTeam, groupName);
    const away = addTeam(match.awayTeam, groupName);
    const homeScore = getScoreValue(match, 'home');
    const awayScore = getScoreValue(match, 'away');

    home.played += 1;
    away.played += 1;
    home.scoresFor += homeScore;
    home.scoresAgainst += awayScore;
    away.scoresFor += awayScore;
    away.scoresAgainst += homeScore;

    if (homeScore > awayScore) {
      home.wins += 1; away.losses += 1; home.points += 3; home.form.push('W'); away.form.push('L');
    } else if (homeScore < awayScore) {
      away.wins += 1; home.losses += 1; away.points += 3; away.form.push('W'); home.form.push('L');
    } else {
      home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; home.form.push('D'); away.form.push('D');
    }
  }

  return Array.from(groups.entries()).map(([name, rowMap]) => ({
    name,
    rows: Array.from(rowMap.values())
      .map((row) => ({
        ...row,
        goalDifference: row.scoresFor - row.scoresAgainst,
        rank: 0,
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
      .map((row, index) => ({ ...row, rank: index + 1 })),
  }));
};

const refreshTournamentStandings = async (tournamentId) => {
  const tournament = await TournamentRepo.getById(tournamentId);
  if (!tournament) return;
  const matches = await MatchRepo.getMatchesByTournament(tournamentId);
  const standings = buildTournamentStandings(tournament, matches || []);
  await TournamentRepo.update(tournamentId, { standings });
};

const tournamentController = {
  /**
   * GET /api/tournaments — Danh sách giải đấu (public, có filter)
   */
  getList: async (req, res) => {
    try {
      const { status, region, search } = req.query;
      const items = await TournamentRepo.getAll({ status, region, search });
      res.json({ success: true, data: items, total: items.length });
    } catch (error) {
      console.error('[Tournament] ❌ getList:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/tournaments/:id — Chi tiết 1 giải (public)
   */
  getDetail: async (req, res) => {
    try {
      const item = await TournamentRepo.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy giải đấu' });
      res.json({ success: true, data: item });
    } catch (error) {
      console.error('[Tournament] ❌ getDetail:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/tournaments — Tạo giải mới (yêu cầu login)
   */
  getStats: async (req, res) => {
    try {
      const item = await TournamentRepo.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Khong tim thay giai dau' });
      const matches = await MatchRepo.getMatchesByTournament(req.params.id);
      res.json({ success: true, data: buildTournamentStats(item, matches || []) });
    } catch (error) {
      console.error('[Tournament] getStats:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { name, region, stadium, format, maxTeams, pitchType, entryFee,
              expectedStartDate, expectedEndDate, matchDuration, deadline,
              rankingCriteria, banner, regulationsUrl, phone } = req.body;

      if (!name || !region || !format) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (tên, khu vực, thể thức)' });
      }

      // Lấy thông tin người tạo (nếu đã login)
      let organizerId = 'anonymous';
      let organizerName = 'Ẩn danh';
      if (req.user) {
        try {
          const user = await UserRepo.findUserByUsername(req.user.username);
          if (user) {
            // Kiểm tra giới hạn lượt tạo giải cho user đã login
            if (user.usage?.leaguesCreated >= user.usage?.limitLeagues) {
              return res.status(403).json({
                success: false,
                message: `Bạn đã dùng hết ${user.usage.limitLeagues} lượt tạo giải. Nâng cấp Pro để tạo không giới hạn!`
              });
            }
            organizerId = req.user.username;
            organizerName = user.fullName || user.username;
            // Tăng số lượt đã dùng
            await UserRepo.incrementUsage(req.user.username, 'leaguesCreated').catch(() => {});
          }
        } catch (_) { /* nếu không load được user, vẫn cho tạo giải */ }
      }

      const tournament = await TournamentRepo.create({
        name, region, stadium, format, phone: phone || '',
        maxTeams: maxTeams || 16,
        pitchType: pitchType || 'Sân 7',
        entryFee: Number(entryFee) || 0,
        expectedStartDate: expectedStartDate || null,
        expectedEndDate: expectedEndDate || null,
        deadline: deadline || null,
        config: { matchDuration: matchDuration || 70, maxPlayers: 20 },
        rankingCriteria: rankingCriteria || ['Points', 'HeadToHead', 'GoalDifference'],
        banner: banner || null,
        regulationsUrl: regulationsUrl || null,
        organizerId,
        organizerName,
        status: 'Registration',
      });

      res.status(201).json({ success: true, data: tournament, message: 'Tạo giải đấu thành công! 🏆' });
    } catch (error) {
      console.error('[Tournament] ❌ create:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * PUT /api/tournaments/:id — Cập nhật giải (owner hoặc admin)
   */
  update: async (req, res) => {
    try {
      const tournament = await TournamentRepo.getById(req.params.id);
      if (!tournament) return res.status(404).json({ success: false, message: 'Không tìm thấy giải đấu' });

      // Chỉ owner hoặc admin được sửa
      const user = await UserRepo.findUserByUsername(req.user.username);
      if (tournament.organizerId !== req.user.username && user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa giải đấu này' });
      }

      const updated = await TournamentRepo.update(req.params.id, req.body);
      
      // Ghi Audit Log
      await auditLog(req, {
        action: 'UPDATE_TOURNAMENT',
        entityType: 'TOURNAMENT',
        entityId: req.params.id,
        oldValue: tournament,
        newValue: updated,
        note: `Cập nhật thông tin giải đấu: ${tournament.name}`
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('[Tournament] ❌ update:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * DELETE /api/tournaments/:id — Xóa giải (admin only)
   */
  remove: async (req, res) => {
    try {
      const tournament = await TournamentRepo.getById(req.params.id);
      await TournamentRepo.delete(req.params.id);
      
      // Ghi Audit Log
      await auditLog(req, {
        action: 'DELETE_TOURNAMENT',
        entityType: 'TOURNAMENT',
        entityId: req.params.id,
        oldValue: tournament,
        newValue: null,
        note: `Xóa giải đấu: ${tournament?.name || req.params.id}`
      });

      res.json({ success: true, message: 'Đã xóa giải đấu' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/tournaments/:id/register — Đăng ký đội vào giải
   */
  registerTeam: async (req, res) => {
    try {
      const {
        // Thông tin đội
        teamName, logo, jerseyColor, jerseyColorAlt,
        // Trưởng đoàn / Quản lý
        managerName, managerPhone, managerEmail, managerIdCard,
        // HLV (tùy chọn)
        coachName, coachPhone,
        // Danh sách cầu thủ + thông tin khác
        players, playerCount, note,
        // teamId (nếu chọn từ danh sách)
        teamId,
        // backward compat
        contactPhone,
      } = req.body;

      if (!teamName?.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đội' });
      }
      if (!managerName?.trim() || !(managerPhone || contactPhone)?.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên và số điện thoại trưởng đoàn' });
      }

      const updated = await TournamentRepo.registerTeam(req.params.id, {
        teamName, logo, jerseyColor, jerseyColorAlt,
        managerName, managerPhone: managerPhone || contactPhone,
        managerEmail, managerIdCard,
        coachName, coachPhone,
        players: Array.isArray(players) ? players : [],
        playerCount: Array.isArray(players) ? players.filter(p => p.name).length : (Number(playerCount) || 0),
        note,
        userId: req.user?.username || null,
        teamId: teamId || null,
      });

      // 💥 Tự động bắn Notification (Nếu user đã login và có username)
      if (req.user && req.user.username) {
         try {
           const tournament = await TournamentRepo.getById(req.params.id);
           await NotificationRepo.createNotification({
              userId: req.user.username,
              title: "Đăng ký thành công",
              message: `Đội bóng "${teamName}" đã đăng ký tham gia giải "${tournament ? tournament.name : 'giải đấu'}". Chờ BTC xét duyệt!`,
              type: "TOURNAMENT",
              link: `/giai-dau/${req.params.id}`
           });

           // Gửi thông báo cho BTC (người tổ chức giải)
           if (tournament && tournament.organizerId && tournament.organizerId !== 'anonymous') {
             await NotificationRepo.createNotification({
               userId: tournament.organizerId,
               title: "Có đội mới đăng ký giải",
               message: `Đội "${teamName}" vừa đăng ký tham gia giải "${tournament.name}". Vui lòng kiểm duyệt!`,
               type: "TOURNAMENT",
               link: `/giai-dau/${req.params.id}`
             });
           }
         } catch(e) {
           console.error("Lỗi tạo notification khi registerTeam: ", e.message);
         }
      }

      res.json({ success: true, data: updated, message: 'Đăng ký thành công! BTC sẽ liên hệ xác nhận.' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/tournaments/my-stats — Thống kê cho user đang login
   */
  getMyStats: async (req, res) => {
    try {
      const user = await UserRepo.findUserByUsername(req.user.username);
      res.json({ success: true, data: { username: user.username, role: user.role, usage: user.usage } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * PATCH /api/tournaments/:id/publish — Publish giải (đổi Pending → Registration)
   */
  publish: async (req, res) => {
    try {
      const tournament = await TournamentRepo.getById(req.params.id);
      if (!tournament) return res.status(404).json({ success: false, message: 'Không tìm thấy giải đấu' });
      const updated = await TournamentRepo.publish(req.params.id);
      res.json({ success: true, data: updated, message: 'Giải đấu đã được mở đăng ký!' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * PATCH /api/tournaments/:id/teams/:teamId/status — BTC duyệt đội
   * body: { status: 'Approved'|'RequireUpdate'|'Rejected'|'Confirmed', btcNote }
   */
  updateTeamStatus: async (req, res) => {
    try {
      const { id, teamId } = req.params;
      const { status, btcNote } = req.body;
      const VALID = ['Approved', 'RequireUpdate', 'Rejected', 'Confirmed'];
      if (!VALID.includes(status)) {
        return res.status(400).json({ success: false, message: `Trạng thái không hợp lệ. Dùng: ${VALID.join(', ')}` });
      }
      const updated = await TournamentRepo.updateTeamStatus(id, teamId, status, btcNote || '');

      // Ghi Audit Log
      await auditLog(req, {
        action: 'UPDATE_TEAM_STATUS',
        entityType: 'TOURNAMENT',
        entityId: id,
        oldValue: { teamId, status: 'previous' },
        newValue: { teamId, status, btcNote },
        note: `Cập nhật trạng thái đội trong giải: ${status}`
      });

      // 💥 Gửi thông báo cho người đăng ký đội bóng (sử dụng dữ liệu 'updated' vừa lưu)
      try {
        if (updated && updated.teams) {
          const team = updated.teams.find(t => t.id === teamId);
          if (team && team.userId) {
            const statusLabels = {
              'Approved': 'Đã duyệt ✅',
              'Rejected': 'Bị từ chối ❌',
              'RequireUpdate': 'Cần bổ sung hồ sơ 📝',
              'Confirmed': 'Xác nhận tham gia ⚽'
            };
            const title = `Cập nhật hồ sơ: ${statusLabels[status] || status}`;
            const message = status === 'RequireUpdate' 
              ? `BTC yêu cầu bạn bổ sung thông tin cho đội "${team.teamName}" tại giải "${updated.name}". Ghi chú: ${btcNote || 'Vui lòng kiểm tra lại hồ sơ.'}`
              : `Hồ sơ đội "${team.teamName}" tại giải "${updated.name || 'giải đấu'}" đã được BTC cập nhật thành: ${statusLabels[status] || status}.${btcNote ? ` Ghi chú: ${btcNote}` : ''}`;

            await NotificationRepo.createNotification({
              userId: team.userId,
              title,
              message,
              type: "TOURNAMENT",
              link: `/giai-dau/${id}?tab=teams&edit=${teamId}`
            });
          }
        }
      } catch (e) {
        console.error("Lỗi gửi thông báo cập nhật trạng thái đội:", e.message);
      }

      res.json({ success: true, data: updated, message: `Đội đã được cập nhật: ${status}` });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * DELETE /api/tournaments/:id/teams/:teamId - BTC xóa đội bị từ chối khỏi giải
   */
  removeTeam: async (req, res) => {
    try {
      const { id, teamId } = req.params;
      await TournamentRepo.removeTeam(id, teamId);
      res.json({ success: true, message: 'Đã xóa đội khỏi giải đấu' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * Người dùng cập nhật hồ sơ đội bóng của chính mình (sau khi BTC yêu cầu bổ sung)
   * PATCH /api/tournaments/:id/teams/:teamId
   */
  updateTeamRegistration: async (req, res) => {
    try {
      const { id, teamId } = req.params;
      const updates = req.body; 
      const username = req.user.username;

      const tournament = await TournamentRepo.getById(id);
      if (!tournament) return res.status(404).json({ success: false, message: 'Giải đấu không tồn tại' });

      const team = tournament.teams?.find(t => t.id === teamId);
      if (!team) return res.status(404).json({ success: false, message: 'Hồ sơ đội không tồn tại' });

      // Kiểm tra quyền: chỉ người đăng ký mới được sửa
      if (team.userId !== username) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa hồ sơ này' });
      }

      // Cập nhật dữ liệu đội
      const updatedTeams = tournament.teams.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            ...updates,
            updatedAt: Date.now(),
            // Nếu đang là RequireUpdate, tự động về Pending để BTC duyệt lại
            status: t.status === 'RequireUpdate' ? 'Pending' : t.status
          };
        }
        return t;
      });

      const updatedTournament = await TournamentRepo.update(id, { teams: updatedTeams });

      // Thông báo cho BTC là đội đã cập nhật hồ sơ
      try {
        if (updatedTournament.organizerId) {
          await NotificationRepo.createNotification({
            userId: updatedTournament.organizerId,
            title: `Hồ sơ cập nhật: ${team.teamName}`,
            message: `Đội "${team.teamName}" đã cập nhật lại hồ sơ theo yêu cầu của bạn tại giải "${updatedTournament.name}".`,
            type: "TOURNAMENT",
            link: `/giai-dau/${id}?tab=btc`
          });
        }
      } catch (e) {
        console.error("Lỗi gửi thông báo cho BTC sau khi cập nhật hồ sơ:", e.message);
      }

      res.json({ success: true, data: updatedTournament });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * PATCH /api/tournaments/:id/close-registration — Đóng đăng ký
   */
  closeRegistration: async (req, res) => {
    try {
      const tournament = await TournamentRepo.getById(req.params.id);
      if (!tournament) return res.status(404).json({ success: false, message: 'Không tìm thấy giải đấu' });
      
      const user = await UserRepo.findUserByUsername(req.user.username);
      if (tournament.organizerId !== req.user.username && user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác' });
      }

      await TournamentRepo.update(req.params.id, { status: 'Opening' });
      res.json({ success: true, message: 'Đã khóa đăng ký! Giải đấu chuyển sang trạng thái chuẩn bị khai mạc.', status: 'Opening' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * PATCH /api/tournaments/:id/activate — Khai mạc giải
   */
  activateTournament: async (req, res) => {
    try {
      const tournament = await TournamentRepo.getById(req.params.id);
      if (!tournament) return res.status(404).json({ success: false, message: 'Không tìm thấy giải đấu' });

      // Cần code kiểm tra quyền (owner/admin) ở đây
      const user = await UserRepo.findUserByUsername(req.user.username);
      if (tournament.organizerId !== req.user.username && user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác' });
      }

      await TournamentRepo.update(req.params.id, { status: 'Ongoing' });
      res.json({ success: true, message: 'Giải đấu chính thức bắt đầu khởi tranh!', status: 'Ongoing' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/tournaments/:id/auto-schedule — Tự động xếp lịch thi đấu (League)
   */
  autoScheduleLeague: async (req, res) => {
    try {
      const { slotsConfig } = req.body;
      const tournament = await TournamentRepo.getById(req.params.id);

      if (!tournament) return res.status(404).json({ success: false, message: 'Không tìm thấy giải đấu' });

      // 1. Chỉ lấy danh sách đội có trạng thái Xác nhận
      const confirmedTeams = (tournament.teams || []).filter(t => t.status === 'Confirmed');

      if (confirmedTeams.length < 2) {
        return res.status(400).json({ success: false, message: 'Giải cần ít nhất 2 đội "Xác nhận" (Confirmed) để xếp lịch!' });
      }

      if (!slotsConfig || slotsConfig.length === 0) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp danh sách cấu hình ngày/giờ (slots) thi đấu hợp lệ.' });
      }

      // 2. Sinh cấu trúc (Vòng bảng, Knockout...)
      const allMatchesUnscheduled = generateStructure(confirmedTeams, tournament.format || 'League');
      console.log(`[DEBUG] generateStructure trả về ${allMatchesUnscheduled.length} trận (Format: ${tournament.format || 'League'})`);

      // 3. Greedy Phân bổ ngày/giờ/sân
      const finalSchedule = allocateGreedy(allMatchesUnscheduled, slotsConfig);
      console.log(`[DEBUG] allocateGreedy trả về ${finalSchedule.length} trận đã xếp lạch`);

      // 4. Xóa lịch cũ khỏi DynamoDB (nếu có)
      await MatchRepo.deleteMatchesByTournament(req.params.id);

      // 5. Chuyển đổi định dạng để lưu qua saveMatchesBatch
      const matchesToSave = finalSchedule.map(m => {
        const _id = uuidv4();
        return {
          id: _id,
          tournamentId: req.params.id,
          tournamentName: tournament.name,
          tournamentLogo: tournament.banner || '',
          dateString: m.matchDate,
          timeString: m.startTime,
          stadium: m.stadium || '',
          pitchNumber: m.pitchNumber,
          round: m.matchLabel || 'Vòng Bảng',
          // Convert m.teamA and m.teamB properly (if 'Bye' team)
          homeTeam: {
            id: m.teamA.id || m.teamA.teamId, // Handle both id structure
            name: m.teamA.teamName || m.teamA.name,
            logo: m.teamA.logo
          },
          awayTeam: {
            id: m.teamB.id || m.teamB.teamId,
            name: m.teamB.teamName || m.teamB.name,
            logo: m.teamB.logo
          },
          score: { home: 0, away: 0 },
          status: 'Scheduled',
          currentMinute: 0,
          startTimestamp: new Date(`${m.matchDate}T${m.startTime}`).getTime()
        };
      });

      // 6. Bulk Insert
      await MatchRepo.saveMatchesBatch(matchesToSave);

      res.json({
        success: true,
        message: `Đã xếp lịch thành công ${matchesToSave.length} trận đấu!`,
        totalMatches: matchesToSave.length
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/tournaments/:id/matches — Lấy danh sách trận đấu của giải
   */
  getMatches: async (req, res) => {
    try {
      const { id } = req.params;
      const matches = await MatchRepo.getMatchesByTournament(id);
      res.json({ success: true, data: matches || [] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/tournaments/:id/matches — Thêm 1 trận đấu khủ công
   */
  createMatch: async (req, res) => {
    try {
      const t = await TournamentRepo.getById(req.params.id);
      if (!t) return res.status(404).json({ success: false, message: 'Tournament not found' });
      const m = req.body;
      const homeScore = Number(m.homeScore ?? m.score?.home ?? 0);
      const awayScore = Number(m.awayScore ?? m.score?.away ?? 0);
      const status = m.status || 'Scheduled';
      const newMatch = {
        id: uuidv4(),
        tournamentId: t.id,
        tournamentName: t.name,
        tournamentLogo: t.banner || '',
        dateString: m.dateString,
        timeString: m.timeString || '00:00',
        homeTeam: m.homeTeam || { id: null, name: 'TBA', logo: '' },
        awayTeam: m.awayTeam || { id: null, name: 'TBA', logo: '' },
        stadium: m.stadium || '',
        pitchNumber: m.pitchNumber || '',
        round: m.round || 'Vòng Bảng',
        group: m.group || null,
        score: { home: homeScore, away: awayScore },
        homeScore,
        awayScore,
        status,
        currentMinute: Number(m.currentMinute || 0),
        incidents: Array.isArray(m.incidents) ? m.incidents : [],
        isManualControl: true,
        liveStatus: status === 'Ongoing' ? 'streaming' : 'idle',
        startTimestamp: new Date(`${m.dateString}T${m.timeString || '00:00'}`).getTime()
      };
      await MatchRepo.saveMatchesBatch([newMatch]);
      await refreshTournamentStandings(req.params.id);
      invalidateCache(`/api/tournaments/${req.params.id}/matches`);
      invalidateCache(`/api/tournaments/${req.params.id}/stats`);
      invalidateCache(`/api/tournaments/${req.params.id}`);
      res.json({ success: true, data: newMatch });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * PUT /api/tournaments/:id/matches/:matchId — Cập nhật 1 trận đấu thủ công
   */
  updateMatch: async (req, res) => {
    try {
      const { oldDate, updates } = req.body;
      const match = await MatchRepo.getMatch(oldDate, req.params.matchId);
      if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
      
      const newMatch = { ...match, ...updates };
      if (updates.homeScore !== undefined || updates.awayScore !== undefined || updates.score) {
        const homeScore = Number(updates.homeScore ?? updates.score?.home ?? match.homeScore ?? match.score?.home ?? 0);
        const awayScore = Number(updates.awayScore ?? updates.score?.away ?? match.awayScore ?? match.score?.away ?? 0);
        newMatch.homeScore = homeScore;
        newMatch.awayScore = awayScore;
        newMatch.score = { home: homeScore, away: awayScore };
      }
      if (updates.currentMinute !== undefined) newMatch.currentMinute = Number(updates.currentMinute || 0);
      if (updates.incidents !== undefined) newMatch.incidents = Array.isArray(updates.incidents) ? updates.incidents : [];
      newMatch.isManualControl = true;
      newMatch.liveStatus = newMatch.status === 'Ongoing' ? 'streaming' : 'idle';
      if (updates.dateString || updates.timeString) {
        const d = updates.dateString || match.dateString;
        const t = updates.timeString || match.timeString;
        newMatch.startTimestamp = new Date(`${d}T${t}`).getTime();
      }
      
      if (oldDate !== newMatch.dateString) {
        await MatchRepo.deleteMatch(oldDate, match.id);
      }
      await MatchRepo.saveMatchesBatch([newMatch]);
      await refreshTournamentStandings(req.params.id);
      invalidateCache(`/api/tournaments/${req.params.id}/matches`);
      invalidateCache(`/api/tournaments/${req.params.id}/stats`);
      invalidateCache(`/api/tournaments/${req.params.id}`);

      // Ghi Audit Log
      await auditLog(req, {
        action: 'UPDATE_MATCH',
        entityType: 'MATCH',
        entityId: req.params.matchId,
        oldValue: match,
        newValue: newMatch,
        note: `Cập nhật trận đấu: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`
      });

      res.json({ success: true, data: newMatch });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * PATCH /api/tournaments/:id/matches/swap — Kéo thả hoán đổi 2 trận
   */
  swapMatchSlots: async (req, res) => {
    try {
      const { m1, m2 } = req.body; // m1: { id, date }, m2: { id, date }
      const match1 = await MatchRepo.getMatch(m1.date, m1.id);
      const match2 = await MatchRepo.getMatch(m2.date, m2.id);
      
      if (!match1 || !match2) return res.status(404).json({ success: false, message: 'Matches not found' });
      
      // Swap slot details
      const tempSlot = {
        dateString: match1.dateString,
        timeString: match1.timeString,
        stadium: match1.stadium,
        pitchNumber: match1.pitchNumber,
        startTimestamp: match1.startTimestamp
      };
      
      match1.dateString = match2.dateString;
      match1.timeString = match2.timeString;
      match1.stadium = match2.stadium;
      match1.pitchNumber = match2.pitchNumber;
      match1.startTimestamp = match2.startTimestamp;
      
      match2.dateString = tempSlot.dateString;
      match2.timeString = tempSlot.timeString;
      match2.stadium = tempSlot.stadium;
      match2.pitchNumber = tempSlot.pitchNumber;
      match2.startTimestamp = tempSlot.startTimestamp;
      
      // Delete old positions conditionally
      if (m1.date !== match1.dateString) await MatchRepo.deleteMatch(m1.date, m1.id);
      if (m2.date !== match2.dateString) await MatchRepo.deleteMatch(m2.date, m2.id);
      
      await MatchRepo.saveMatchesBatch([match1, match2]);
      res.json({ success: true, message: 'Swapped successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = tournamentController;
