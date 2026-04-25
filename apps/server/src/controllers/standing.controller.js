const axios = require('axios');
const StandingRepo = require('../repositories/standing.repo');
const { mapSofaStandingToPhuiScore } = require('../utils/standingMapper');

const SOFA_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Origin': 'https://www.sofascore.com',
    'Referer': 'https://www.sofascore.com/'
};

/**
 * Cào dữ liệu knockout của giải đấu trong MÙA HIỆN TẠI.
 * Luồng: CupTree API → nếu thất bại → fallback từ events API (cùng mùa).
 */
async function fetchKnockoutData(tournamentId, seasonId) {
    // Bước 1: Thử cuptree endpoint
    try {
        const cuptreeUrl = `https://api.sofascore.app/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/cuptree`;
        console.log(`[KO] 🔍 CupTree: ${cuptreeUrl}`);
        const cupRes = await axios.get(cuptreeUrl, { headers: SOFA_HEADERS });

        const rawTree = cupRes.data?.cupTree;
        console.log(`[KO] CupTree keys: ${Object.keys(cupRes.data || {}).join(', ')}, cupTree length: ${rawTree?.length ?? 'null'}`);

        if (rawTree && rawTree.length > 0) {
            const koData = formatCupTree(rawTree);
            console.log(`[KO] ✅ CupTree OK: ${koData.length} vòng có trận`);
            if (koData.length > 0) return koData;
        }

        console.log(`[KO] ⚠️ CupTree trả về rỗng, thử events fallback...`);
    } catch (e) {
        console.log(`[KO] ⚠️ CupTree thất bại HTTP ${e.response?.status}: ${e.message}`);
    }

    // Bước 2: Fallback — lấy events của CÙNG MÙA và tìm roundInfo.name
    try {
        const eventsUrl = `https://api.sofascore.app/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/events/last/0`;
        console.log(`[KO] 🔍 Events fallback: ${eventsUrl}`);
        const eventsRes = await axios.get(eventsUrl, { headers: SOFA_HEADERS });
        const events = eventsRes.data?.events || [];

        const knockoutMatches = events.filter(ev => ev.roundInfo?.name);
        console.log(`[KO] Events: ${events.length} tổng, ${knockoutMatches.length} có roundInfo.name`);

        if (knockoutMatches.length > 0) {
            const grouped = knockoutMatches.reduce((acc, ev) => {
                const rName = ev.roundInfo.name;
                if (!acc[rName]) acc[rName] = { roundName: rName, matches: [] };
                acc[rName].matches.push(formatMatchData(ev));
                return acc;
            }, {});
            const koData = Object.values(grouped);
            console.log(`[KO] ✅ Fallback events OK: ${koData.length} vòng`);
            return koData;
        }
    } catch (e2) {
        console.error(`[KO] ❌ Events fallback thất bại: ${e2.message}`);
    }

    return null;
}


const getStandings = async (req, res) => {
    try {
        const tournamentId = parseInt(req.params.tournamentId);
        const forceRefresh = req.query.refresh === 'true';

        // 1. Lấy Season ID mùa hiện tại
        const seasonUrl = `https://api.sofascore.app/api/v1/unique-tournament/${tournamentId}/seasons`;
        const seasonRes = await axios.get(seasonUrl, { headers: SOFA_HEADERS });
        const latestSeason = seasonRes.data?.seasons?.[0];
        const seasonId = latestSeason.id;

        // 2. Check Cache — ⚡ Thêm TTL 30 phút để tránh serve data quá cũ
        if (!forceRefresh) {
            const cache = await StandingRepo.getStandings(tournamentId, seasonId);
            const hasValidStandings = cache && Array.isArray(cache.standings);
            const hasValidKnockout = cache && Array.isArray(cache.knockoutData);
            const CACHE_TTL_MS = 30 * 60 * 1000; // 30 phút
            const isFresh = cache?.lastUpdated && (Date.now() - cache.lastUpdated < CACHE_TTL_MS);
            const isValidCache = hasValidStandings && hasValidKnockout && isFresh;
            if (isValidCache) {
                console.log(`[Standing] ✅ Cache hit (còn fresh) cho giải ${tournamentId}`);
                return res.status(200).json({ success: true, source: 'cache', data: cache });
            }
            if (cache && hasValidStandings && !isFresh) {
                console.log(`[Standing] ⏰ Cache hết hạn (>30 phút), fetch lại...`);
            }
        }

        // 3. Cào BXH (Standings) — bắt lỗi riêng để không chặn cào knockout
        let mappedStandings = [];
        try {
            const standingUrl = `https://api.sofascore.app/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/standings/total`;
            const standingRes = await axios.get(standingUrl, { headers: SOFA_HEADERS });
            const rawStandings = standingRes.data?.standings || [];

            // Tạo map teamId -> form string từ raw data (SofaScore đôi khi có)
            const formMap = {};
            for (const group of rawStandings) {
                for (const row of (group.rows || [])) {
                    if (row.team?.id && row.form) {
                        formMap[row.team.id] = row.form;
                    }
                }
            }

            // Nếu không có form trong standings, thử fetch từ event results (last 5 per team)
            const hasFormData = Object.values(formMap).some(f => f && f.length > 0);
            if (!hasFormData) {
                try {
                    const eventsUrl = `https://api.sofascore.app/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/events/last/0`;
                    const evRes = await axios.get(eventsUrl, { headers: SOFA_HEADERS });
                    const events = (evRes.data?.events || []).filter(e => e.status?.type === 'finished');
                    // Build form per team from last 5 finished matches
                    const teamLogs = {};
                    for (const ev of events) {
                        const hId = ev.homeTeam?.id;
                        const aId = ev.awayTeam?.id;
                        const hScore = ev.homeScore?.display ?? 0;
                        const aScore = ev.awayScore?.display ?? 0;
                        if (hId) {
                            if (!teamLogs[hId]) teamLogs[hId] = [];
                            if (teamLogs[hId].length < 5) {
                                teamLogs[hId].unshift(hScore > aScore ? 'W' : hScore < aScore ? 'L' : 'D');
                            }
                        }
                        if (aId) {
                            if (!teamLogs[aId]) teamLogs[aId] = [];
                            if (teamLogs[aId].length < 5) {
                                teamLogs[aId].unshift(aScore > hScore ? 'W' : aScore < hScore ? 'L' : 'D');
                            }
                        }
                    }
                    for (const [id, logs] of Object.entries(teamLogs)) {
                        formMap[id] = logs.join('');
                    }
                    console.log(`[Standing] 📈 Tính form từ events: ${Object.keys(formMap).length} đội`);
                } catch (fe) {
                    console.log('[Standing] ⚠️ Không fetch được form từ events:', fe.message);
                }
            }

            mappedStandings = rawStandings
                .filter(s => s.type === 'total' || rawStandings.length === 1)
                .map(group => ({
                    name: group.name || null,
                    rows: mapSofaStandingToPhuiScore(group, formMap)
                }));
            console.log(`[Standing] 📊 Cào BXH xong: ${mappedStandings.length} nhóm`);
        } catch (e) {
            console.log(`[Standing] ⚠️ Giải ${tournamentId} không có BXH (có thể là giải cup thuần): ${e.message}`);
        }


        // 4. CÀO VÒNG KNOCKOUT của mùa hiện tại
        const knockoutData = await fetchKnockoutData(tournamentId, seasonId);
        console.log(`[Standing] 📦 kết quả: standings=${mappedStandings.length} nhóm, knockoutData=${knockoutData?.length ?? 'null'} vòng`);

        const finalData = {
            tournamentId, seasonId,
            tournamentInfo: {
                name: latestSeason.name || "Giải đấu",
                season: latestSeason.year,
                logo: `https://api.sofascore.app/api/v1/unique-tournament/${tournamentId}/image`
            },
            standings: mappedStandings,
            knockoutData,
            lastUpdated: Date.now()
        };

        await StandingRepo.saveStandings(tournamentId, seasonId, finalData);
        res.status(200).json({ success: true, source: 'live_api', data: finalData });

    } catch (error) {
        console.error('[Standing] ❌ Lỗi getStandings:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper: format một trận đấu
function formatMatchData(m) {
    return {
        homeTeam: { name: m.homeTeam?.name, logo: `https://api.sofascore.app/api/v1/team/${m.homeTeam?.id}/image` },
        awayTeam: { name: m.awayTeam?.name, logo: `https://api.sofascore.app/api/v1/team/${m.awayTeam?.id}/image` },
        homeScore: m.homeScore?.display ?? (m.status?.type === 'finished' ? '0' : '-'),
        awayScore: m.awayScore?.display ?? (m.status?.type === 'finished' ? '0' : '-'),
        homePenalty: m.homeScore?.period1 || null,
        awayPenalty: m.awayScore?.period1 || null
    };
}

// Helper: format cupTree từ SofaScore (lọc bỏ round không có matches)
function formatCupTree(tree) {
    return tree
        .filter(round => Array.isArray(round.matches) && round.matches.length > 0)
        .map(round => ({
            roundName: round.name,
            matches: round.matches.map(formatMatchData)
        }))
        .reverse();
}

module.exports = { getStandings };