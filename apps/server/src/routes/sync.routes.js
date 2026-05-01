const express = require('express');
const router = express.Router();
const MatchRepo = require('../repositories/match.repo');
const StandingRepo = require('../repositories/standing.repo');
const { invalidateCache } = require('../middlewares/cacheMiddleware');

// Middleware kiểm tra Token bảo mật (Tránh việc ai cũng có thể post dữ liệu lên server)
const validateSyncToken = (req, res, next) => {
    const { token } = req.body;
    const SERVER_SYNC_TOKEN = process.env.SYNC_TOKEN || 'phuiscore_secret_2026';

    if (!token || token !== SERVER_SYNC_TOKEN) {
        console.warn(`[Sync Auth] ⚠️ Token không hợp lệ từ IP: ${req.ip}`);
        return res.status(403).json({ success: false, message: 'Token invalid' });
    }
    next();
};

/**
 * @route   POST /api/sync/matches
 * @desc    Đồng bộ hàng loạt trận đấu từ Crawler
 */
router.post('/matches', validateSyncToken, async (req, res) => {
    try {
        const { matches } = req.body;
        if (!matches || !Array.isArray(matches)) {
            console.error(`[Sync] ❌ Dữ liệu không hợp lệ từ IP: ${req.ip}`);
            return res.status(400).json({ success: false, message: 'Invalid matches data' });
        }

        const payloadSize = req.headers['content-length'];
        console.log(`[Sync] 📥 Nhận ${matches.length} trận đấu. Dung lượng: ${(payloadSize / 1024).toFixed(2)} KB`);
        
        const results = await MatchRepo.saveMatchesBatch(matches);
        
        // Xóa Cache cho từng trận đấu vừa đồng bộ để Frontend thấy ngay dữ liệu mới
        matches.forEach(m => {
            if (m.id) {
                invalidateCache(`/api/matches/detail/${m.id}`);
                // Đồng thời xóa luôn cache của danh sách ngày đó
                if (m.dateString) invalidateCache(`/api/matches/${m.dateString}`);
                
                // 🔥 PHÁT TÍN HIỆU REAL-TIME ĐẾN WEB
                if (global.io) {
                    global.io.emit('matchUpdated', { matchId: m.id, date: m.dateString });
                }
            }
        });
        
        res.status(200).json({ 
            success: true, 
            message: `Synced ${matches.length} matches successfully`,
            chunks: results.length 
        });
    } catch (error) {
        console.error('[Sync Matches Error]', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

const { mapSofaStandingToPhuiScore, formatCupTree } = require('../utils/standingMapper');

/**
 * @route   POST /api/sync/standings
 * @desc    Đồng bộ bảng xếp hạng của một giải đấu
 */
router.post('/standings', validateSyncToken, async (req, res) => {
    try {
        const { tournamentId, seasonId, tournamentName, standings: rawStandings, cupTree: rawCupTree } = req.body;
        
        if (!tournamentId || !seasonId || (!rawStandings && !rawCupTree)) {
            return res.status(400).json({ success: false, message: 'Missing required standings/cupTree fields' });
        }

        console.log(`[Sync] 📊 Nhận dữ liệu giải ID: ${tournamentId}`);
        
        // 1. Tính toán Phong độ (Form)
        const formMap = {};
        
        // CÁCH A: Tính từ mảng events (ưu tiên vì chính xác và đầy đủ nhất)
        if (req.body.events && Array.isArray(req.body.events)) {
            req.body.events
                .filter(ev => ev.status?.type === 'finished')
                .sort((a, b) => b.startTimestamp - a.startTimestamp)
                .forEach(ev => {
                    const hId = ev.homeTeam?.id, aId = ev.awayTeam?.id;
                    const hS = ev.homeScore?.current, aS = ev.awayScore?.current;
                    if (hId && aId && hS !== undefined && aS !== undefined) {
                        if (!formMap[hId]) formMap[hId] = "";
                        if (formMap[hId].length < 5) {
                            formMap[hId] += (hS > aS ? "W" : (hS < aS ? "L" : "D"));
                        }
                        if (!formMap[aId]) formMap[aId] = "";
                        if (formMap[aId].length < 5) {
                            formMap[aId] += (aS > hS ? "W" : (aS < hS ? "L" : "D"));
                        }
                    }
                });
            console.log(`[Sync] 📈 Đã tự tính phong độ cho ${Object.keys(formMap).length} đội.`);
        } 
        // CÁCH B: Lấy từ rawStandings nếu không có events
        else if (Array.isArray(rawStandings)) {
            rawStandings.forEach(group => {
                if (Array.isArray(group.rows)) {
                    group.rows.forEach(row => {
                        if (row.team?.id && row.form) {
                            formMap[row.team.id] = row.form;
                        }
                    });
                }
            });
        }
        
        const mappedStandings = (rawStandings || [])
            .filter(s => s.type === 'total' || rawStandings.length === 1)
            .map(group => ({
                name: group.name || null,
                rows: mapSofaStandingToPhuiScore(group, formMap)
            }));

        // 2. Chuyển đổi định dạng cho Knockout (CupTree)
        let knockoutData = null;
        if (rawCupTree) {
            // Lấy lõi dữ liệu mảng (hỗ trợ cả array trực tiếp và object bọc ngoài)
            const cupArray = Array.isArray(rawCupTree) ? rawCupTree : (rawCupTree.cupTree || rawCupTree.cupTrees);
            
            if (cupArray && Array.isArray(cupArray)) {
                knockoutData = formatCupTree(cupArray);
                if (knockoutData) {
                    console.log(`[Sync] 🏆 Đã chuyển đổi Sơ đồ Knockout: ${knockoutData.length} vòng đấu.`);
                }
            }
        }
        
        if (!knockoutData) {
            console.log(`[Sync] ℹ️ Giải ${tournamentId} không có dữ liệu Knockout.`);
        }
        
        const finalData = {
            tournamentId, 
            seasonId,
            tournamentInfo: {
                name: tournamentName || "Giải đấu",
                logo: `https://api.sofascore.app/api/v1/unique-tournament/${tournamentId}/image`
            },
            standings: mappedStandings,
            knockoutData: knockoutData,
            lastUpdated: Date.now()
        };

        // 3. Lưu vào DB
        await StandingRepo.saveStandings(tournamentId, seasonId, finalData);

        // 4. Xóa cache
        invalidateCache(`/api/standings/${tournamentId}`);

        res.status(200).json({ success: true, message: `Synced standings/knockout for ${tournamentId}` });
    } catch (error) {
        console.error('[Sync Standings Error]', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
