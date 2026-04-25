const express = require('express');
const router = express.Router();
const MatchRepo = require('../repositories/match.repo');
const { crawlByDate } = require('../utils/crawler');
const { cacheResponse, invalidateCache } = require('../middlewares/cacheMiddleware');
const { translateStats } = require('../utils/translator');

// Hàm gom nhóm giải đấu (giữ nguyên logic)
const groupMatchesByLeague = (matches) => {
    const grouped = matches.reduce((acc, match) => {
        const leagueId = match.tournamentId || match.gsi1_pk?.replace('TOURNAMENT#', '') || 'other';
        
        if (!acc[leagueId]) {
            acc[leagueId] = {
                id: leagueId,
                name: match.tournamentName || "Giải đấu khác",
                logo: match.tournamentLogo || "",
                matches: []
            };
        }
        acc[leagueId].matches.push(match);
        return acc;
    }, {});
    return Object.values(grouped);
};

// ⚡ CACHE 10 giây: Đảm bảo đồng bộ với polling 10s của Frontend để có data mới nhất
router.get('/:date', cacheResponse(10), async (req, res) => {
    try {
        const { date } = req.params;
        const matches = await MatchRepo.getMatchesByDate(date);

        if (!matches || matches.length === 0) {
            const freshMatches = await crawlByDate(date);
            return res.status(200).json({
                success: true,
                data: groupMatchesByLeague(freshMatches)
            });
        }

        res.status(200).json({
            success: true,
            data: groupMatchesByLeague(matches)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi rồi đại ca!" });
    }
});

// 🔥 Lấy chi tiết 1 trận đấu (H2H, BXH, Trận sắp tới)
router.get('/detail/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        const date = req.query.date || new Date().toISOString().split('T')[0];
        
        let match = await MatchRepo.getMatch(date, matchId);
        
        if (!match) {
            // Nếu không tìm thấy trong DB, thử cào "nóng" từ SofaScore nếu có thể
            // (Tuy nhiên cào từ ID cần thêm thông tin team, nên tạm thời 404 là đúng nếu chưa bao giờ cào ngày này)
            // NHƯNG, ta có thể thử crawlByDate cho ngày đó
            console.log(`[API] 🕵️ Không thấy trận ${matchId} trong DB, thử cào lại ngày ${date}`);
            const { crawlByDate } = require('../utils/crawler');
            const dailyMatches = await crawlByDate(date);
            match = dailyMatches.find(m => String(m.id) === String(matchId));
            
            if (!match) {
                return res.status(404).json({ success: false, message: "Không tìm thấy trận đấu" });
            }
        }

        // Nếu chưa có data chi tiết (h2h, statistics, standings) hoặc force refresh, thì fetch thêm
        const hasDetailedData = match.h2h && 
                               match.statistics && 
                               match.statistics.length > 0 && 
                               match.standings;
        
        if (!hasDetailedData || req.query.refresh === 'true') {
            const { fetchDetailedData } = require('../utils/crawler');
            const detailed = await fetchDetailedData({
                id: matchId,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                tournamentId: match.tournamentId,
                seasonId: match.seasonId
            });

            if (detailed) {
                await MatchRepo.updateMatchLive(date, matchId, {
                    ...match,
                    ...detailed,
                    homeScore: match.score.home,
                    awayScore: match.score.away,
                    status: match.status
                });
                match = { ...match, ...detailed };
            }
        }

        res.status(200).json({ 
            success: true, 
            data: {
                ...match,
                statistics: translateStats(match.statistics)
            } 
        });
    } catch (error) {
        console.error("Detail error:", error);
        res.status(500).json({ success: false, message: "Lỗi fetch chi tiết" });
    }
});

module.exports = router;