const express = require('express');
const router = express.Router();
const axios = require('axios');
const { verifyToken, isAdmin, verifyTokenOptional } = require('../middlewares/auth.middleware');
const { cacheResponse, invalidateCache } = require('../middlewares/cacheMiddleware');

const tc = require('../controllers/tournament.controller');

// API Tìm kiếm giải đấu trực tiếp từ Sofascore
router.get('/search-sofa', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const headers = { 
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'accept': '*/*',
            'referer': 'https://www.sofascore.com/',
            'origin': 'https://www.sofascore.com'
        };
        const response = await axios.get(`https://www.sofascore.com/api/v1/search/unique-tournaments?q=${encodeURIComponent(q)}&filter=football`, { headers });
        
        const results = (response.data?.results || []).map(item => ({
            id: item.id,
            name: item.name,
            region: item.category?.name,
            logo: `https://api.sofascore.app/api/v1/unique-tournament/${item.id}/image`,
            isExternal: true
        }));

        res.json(results);
    } catch (err) {
        console.error('[Search Sofa Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── PUBLIC (có cache) ──────────────────────────────────────────
// ⚡ Cache 30s: Danh sách giải đấu ít thay đổi, giảm DynamoDB Scan
router.get('/list', cacheResponse(30), tc.getList);

// ⚡ Cache 60s: Chi tiết giải (Tắt cache tạm thời để BTC thấy update realtime)
router.get('/:id', tc.getDetail);

// ⚡ Cache 30s: Danh sách trận đấu của giải (Tắt cache để xếp lịch hiển thị ngay)
router.get('/:id/matches', tc.getMatches);

// ── PROTECTED (cần login) ─────────────────────────────────────
// Thống kê cá nhân (không cache vì mỗi user khác nhau)
router.get('/me/stats', verifyToken, tc.getMyStats);

// Tạo giải mới (không bắt buộc login — anonymous OK)
router.post('/create', verifyTokenOptional, tc.create);

// Đăng ký đội vào giải (có thể anonymous hoặc login)
router.post('/:id/register', verifyTokenOptional, tc.registerTeam);

// ── OWNER / ADMIN ──────────────────────────────────────────────
router.patch('/:id/publish', verifyTokenOptional, tc.publish);
router.put('/:id', verifyTokenOptional, tc.update);
router.patch('/:id/close-registration', verifyTokenOptional, tc.closeRegistration);
router.patch('/:id/activate', verifyTokenOptional, tc.activateTournament);
router.post('/:id/auto-schedule', verifyTokenOptional, tc.autoScheduleLeague);
router.patch('/:id/teams/:teamId', verifyToken, tc.updateTeamRegistration);
router.patch('/:id/teams/:teamId/status', verifyTokenOptional, tc.updateTeamStatus);
router.delete('/:id/teams/:teamId', verifyTokenOptional, tc.removeTeam);

// Quản lý lịch thi đấu thủ công (CRUD Match)
router.post('/:id/matches', verifyTokenOptional, tc.createMatch);
router.put('/:id/matches/:matchId', verifyTokenOptional, tc.updateMatch);
router.patch('/:id/matches/drag-swap', verifyTokenOptional, tc.swapMatchSlots);

// Xóa giải (chỉ admin)
router.delete('/:id', verifyToken, isAdmin, tc.remove);

module.exports = router;
