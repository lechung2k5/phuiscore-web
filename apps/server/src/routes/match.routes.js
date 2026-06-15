const express = require('express');
const router = express.Router();
const MatchRepo = require('../repositories/match.repo');
const { crawlByDate } = require('../utils/crawler');

const crawledDates = new Set();

// Cơ chế khóa để chống cào trùng lặp (Rate limiting requests)
const pendingDetailRequests = new Map();
const { cacheResponse, invalidateCache } = require('../middlewares/cacheMiddleware');
const { translateStats } = require('../utils/translator');
const ENABLE_MATCH_DETAIL_CRAWL = process.env.ENABLE_MATCH_DETAIL_CRAWL === 'true';

// Hàm gom nhóm giải đấu (giữ nguyên logic, có thêm tính ổn định logo)
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
        
        // Nếu trận đầu tiên không có logo nhưng trận sau có, cập nhật lại logo cho giải
        if (!acc[leagueId].logo && match.tournamentLogo) {
            acc[leagueId].logo = match.tournamentLogo;
        }

        acc[leagueId].matches.push(match);
        return acc;
    }, {});
    return Object.values(grouped);
};

// ⚡ CACHE 10 giây: Đảm bảo đồng bộ với polling 10s của Frontend
router.get('/:date', cacheResponse(10), async (req, res) => {
    try {
        const { date } = req.params;
        
        // 1. Kiểm tra trong Database trước
        let matches = [];
        if (date === 'all') {
            matches = await MatchRepo.getAllMatches();
        } else {
            // TỰ ĐỘNG CÀO SOFASCORE 1 LẦN MỖI KHI RESTART SERVER NẾU USER YÊU CẦU NGÀY NÀY
            if (!crawledDates.has(date)) {
                console.log(`[API] 🚨 Tự động cào SofaScore cho ngày ${date}...`);
                crawledDates.add(date); // Đánh dấu đã cào
                const { crawlByDate } = require('../utils/crawler');
                await crawlByDate(date);
            }
            
            matches = await MatchRepo.getMatchesByDate(date);
        }
        
        // 2. Chỉ hiển thị dữ liệu World Cup (16) hoặc các giải tự tạo (ID UUID dài hơn 10 ký tự) hoặc trận đấu thủ công
        if (matches) {
            matches = matches.filter(m => {
                const tIdStr = String(m.tournamentId || '');
                return tIdStr === '16' || tIdStr.length > 10 || m.isManualControl === true;
            });
        }

        // 3. Trả về dữ liệu (từ DB hoặc rỗng nếu SofaScore cũng không có)
        res.status(200).json({
            success: true,
            data: groupMatchesByLeague(matches || [])
        });
    } catch (error) {
        console.error(`[API Error] Lỗi lấy trận đấu ngày ${req.params.date}:`, error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy dữ liệu trận đấu" });
    }
});

// 🔥 Lấy chi tiết 1 trận đấu (H2H, BXH, Trận sắp tới)
// CACHE 60 giây: Dữ liệu chi tiết không cần cập nhật quá nhanh như tỉ số tổng quát
router.get('/detail/:matchId', cacheResponse(60), async (req, res) => {
    try {
        const { matchId } = req.params;
        let date = req.query.date;
        
        if (!date) {
            date = new Date().toISOString().split('T')[0];
        }
        
        let match = await MatchRepo.getMatch(date, matchId);
        
        // 1. Nếu không thấy trận đấu trong Database
        if (!match) {
            console.log(`[API] 🕵️ Không thấy trận ${matchId} ở ngày ${date}.`);
        }
        
        if (!match) {
            return res.status(404).json({ success: false, message: "Không tìm thấy trận đấu" });
        }

        // 2. Nếu thiếu thông số chi tiết (Stats, H2H, Lineups)
        const hasDetailedData = match.h2h && match.statistics && match.statistics.length > 0;
        const now = Date.now();
        const lastRequestTime = pendingDetailRequests.get(matchId) || 0;
        
        if (ENABLE_MATCH_DETAIL_CRAWL && (!hasDetailedData || req.query.refresh === 'true')) {
            // Phát lệnh cào gấp qua Socket
            if (now - lastRequestTime > 30000) {
                console.log(`[API] 📊 Thiếu thông số trận ${matchId}. Yêu cầu cào gấp...`);
                pendingDetailRequests.set(matchId, now);
                if (global.io) global.io.emit('requestDetail', { matchId, date });
            }

            // VÒNG LẶP KIỂM TRA DB (Đợi tối đa 2.5 giây để đảm bảo response < 3s)
            let attempts = 0;
            while (attempts < 12) {
                await new Promise(r => setTimeout(r, 200)); // Kiểm tra mỗi 200ms
                const updatedMatch = await MatchRepo.getMatch(date, matchId);
                
                // Nếu đã có dữ liệu Statistics hoặc H2H
                if (updatedMatch && updatedMatch.statistics && updatedMatch.statistics.length > 0) {
                    console.log(`[API] ⚡ Đã thấy dữ liệu trận ${matchId} sau ${attempts * 0.2}s!`);
                    match = updatedMatch;
                    invalidateCache(`/api/matches/detail/${matchId}`);
                    break; 
                }
                attempts++;
            }
        }

        res.status(200).json({ success: true, data: match });
    } catch (error) {
        console.error("Detail API Error:", error);
        res.status(500).json({ success: false, message: "Lỗi fetch chi tiết" });
    }
});

module.exports = router;
