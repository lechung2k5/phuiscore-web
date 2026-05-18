const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, isSuperAdmin } = require('../middlewares/auth.middleware');
const MatchRepo = require('../repositories/match.repo');
const TournamentRepo = require('../repositories/tournament.repo');
const UserRepo = require('../repositories/user.repo');
const AuditLogRepo = require('../repositories/auditLog.repo');
const NewsRepo = require('../repositories/news.repo');
const TeamRepo = require('../repositories/team.repo');

const { crawlerQueue } = require('../queues/crawler.queue');
const redisConn = require('../config/redis.config');
const { docClient } = require('../config/db.config');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { apiCache } = require('../middlewares/cacheMiddleware');

// Thống kê tổng quát cho Admin Dashboard
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        let matchesCount = 0;
        let liveMatchesCount = 0;
        let tournamentsCount = 0;
        let newsCount = 0;
        let recentLogs = [];

        // 1. Lấy tất cả trận đấu — dùng 1 Scan duy nhất cho cả tổng lẫn live
        try {
            const { ScanCommand: SC } = require('@aws-sdk/lib-dynamodb');
            const allMatchesResult = await docClient.send(new SC({ TableName: MatchRepo.TABLE_NAME || 'PhuiScore_Matches' }));
            const allMatches = allMatchesResult.Items || [];
            matchesCount = allMatches.length;

            const nowSec = Math.floor(Date.now() / 1000);
            liveMatchesCount = allMatches.filter(m => {
                const status = String(m.status || '').toLowerCase();
                if (['finished', 'canceled', 'postponed', 'ended', 'closed'].includes(status)) return false;
                if (['inprogress', 'live', 'in_progress'].includes(status)) return true;
                if (m.startTimestamp) {
                    const elapsed = nowSec - m.startTimestamp;
                    return elapsed >= -30 * 60 && elapsed <= 130 * 60;
                }
                return false;
            }).length;
        } catch (e) {
            console.warn('[AdminStats] Lỗi khi đếm trận đấu:', e.message);
        }

        // 2. Lấy tất cả giải đấu
        try {
            const allTournaments = await TournamentRepo.getAll();
            tournamentsCount = allTournaments.length;
        } catch (e) {
            console.warn('[AdminStats] Lỗi khi đếm giải đấu:', e.message);
        }

        // 3. Lấy tin tức
        try {
            const totalNews = await NewsRepo.getAll();
            newsCount = totalNews.length;
        } catch (e) {
            console.warn('[AdminStats] Lỗi khi đếm tin tức:', e.message);
        }

        // 4. Lấy nhật ký gần đây
        try {
            recentLogs = await AuditLogRepo.getRecent(10);
        } catch (e) {
            console.warn('[AdminStats] Lỗi khi lấy nhật ký:', e.message);
        }

        const stats = {
            matchesCount,
            liveMatchesCount,
            tournamentsCount,
            newsCount,
            recentLogs
        };

        res.json({ success: true, data: stats });
    } catch (e) {
        console.error('[AdminStats Global Error]', e);
        res.status(500).json({ success: false, message: "Lỗi xử lý dữ liệu hệ thống" });
    }
});

// Giám sát sức khỏe hệ thống (Health Check)
router.get('/health', verifyToken, isAdmin, async (req, res) => {
    // 1. Queue (Redis) — fallback an toàn nếu Redis không chạy
    let queueStats = { waiting: 0, active: 0, failed: 0, completed: 0 };
    let redisStatus = 'unknown';
    try {
        if (crawlerQueue) {
            const [waiting, active, failed, completed] = await Promise.all([
                crawlerQueue.getWaitingCount().catch(() => 0),
                crawlerQueue.getActiveCount().catch(() => 0),
                crawlerQueue.getFailedCount().catch(() => 0),
                crawlerQueue.getCompletedCount().catch(() => 0),
            ]);
            queueStats = { waiting, active, failed, completed };
        }
        redisStatus = redisConn?.status || 'unknown';
    } catch (e) {
        console.warn('[Health] Redis/Queue không khả dụng:', e.message);
        redisStatus = 'offline';
    }

    // 2. Database — thử ping nhẹ
    let dbStatus = 'unknown';
    try {
        await docClient.send(new ScanCommand({
            TableName: TournamentRepo.TABLE_NAME || TournamentRepo.TABLE || 'PhuiScore_Tournaments',
            Limit: 1
        }));
        dbStatus = 'online';
    } catch (e) {
        console.warn('[Health] DynamoDB lỗi:', e.message);
        dbStatus = 'error';
    }

    // 3. Memory — luôn an toàn
    const memory = process.memoryUsage();

    res.json({
        success: true,
        data: {
            redis: redisStatus,
            database: dbStatus,
            queue: queueStats,
            system: {
                uptime: Math.round(process.uptime()),
                memory: {
                    rss: Math.round(memory.rss / 1024 / 1024) + 'MB',
                    heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
                    heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
                },
                nodeVersion: process.version,
                platform: process.platform,
            },
            timestamp: Date.now(),
        }
    });
});

// ==========================================
// LIVESTREAM MANAGEMENT (LIVEKIT)
// ==========================================

const getLiveKitClients = () => {
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) {
        throw new Error("Thiếu cấu hình LiveKit (API_KEY/SECRET/URL)");
    }
    const { RoomServiceClient, IngressClient } = require('livekit-server-sdk');
    const host = process.env.LIVEKIT_URL.replace('wss://', 'https://');
    const roomClient = new RoomServiceClient(host, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
    const ingressClient = new IngressClient(host, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
    return { roomClient, ingressClient };
};

router.get('/livestreams/rooms', verifyToken, isAdmin, async (req, res) => {
    try {
        const { roomClient } = getLiveKitClients();
        const rooms = await roomClient.listRooms();
        res.json({ success: true, data: rooms });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/livestreams/ingresses', verifyToken, isAdmin, async (req, res) => {
    try {
        const { ingressClient } = getLiveKitClients();
        const ingresses = await ingressClient.listIngress();
        res.json({ success: true, data: ingresses });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/livestreams/rooms/:room', verifyToken, isAdmin, async (req, res) => {
    try {
        const { room } = req.params;
        const { roomClient } = getLiveKitClients();
        await roomClient.deleteRoom(room);
        
        await AuditLogRepo.log({
            userId: req.user.username,
            action: 'DELETE_LIVESTREAM_ROOM',
            entityType: 'LIVESTREAM',
            entityId: room,
            note: `Xóa phòng LiveKit: ${room}`
        });
        
        res.json({ success: true, message: 'Đã xóa phòng' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/livestreams/ingresses/:ingressId', verifyToken, isAdmin, async (req, res) => {
    try {
        const { ingressId } = req.params;
        const { ingressClient } = getLiveKitClients();
        await ingressClient.deleteIngress(ingressId);
        
        await AuditLogRepo.log({
            userId: req.user.username,
            action: 'DELETE_INGRESS',
            entityType: 'LIVESTREAM',
            entityId: ingressId,
            note: `Xóa Ingress: ${ingressId}`
        });
        
        res.json({ success: true, message: 'Đã xóa Ingress' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/livestreams/token/:room', verifyToken, isAdmin, async (req, res) => {
    try {
        const { room } = req.params;
        const { AccessToken } = require('livekit-server-sdk');
        
        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY, 
            process.env.LIVEKIT_API_SECRET, 
            { identity: `admin_watcher_${req.user.username}`, name: `Admin ${req.user.username}` }
        );
        
        at.addGrant({ 
            roomJoin: true, 
            room: room, 
            canPublish: false, 
            canSubscribe: true 
        });

        const token = await at.toJwt();
        
        res.json({ success: true, token, serverUrl: process.env.LIVEKIT_URL });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Lấy toàn bộ Audit Logs (Chỉ Admin)
router.get('/audit-logs', verifyToken, isAdmin, async (req, res) => {
    try {
        const logs = await AuditLogRepo.getRecent(100);
        res.json({ success: true, data: logs });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Xóa toàn bộ bộ nhớ đệm hệ thống (Cache)
router.post('/cache/clear', verifyToken, isAdmin, (req, res) => {
    try {
        apiCache.flushAll();
        
        // Log hành động xóa cache
        AuditLogRepo.log({
            userId: req.user.username,
            action: 'CLEAR_CACHE',
            entityType: 'SYSTEM',
            entityId: 'ALL',
            note: 'Dọn dẹp toàn bộ bộ nhớ đệm API'
        });
        
        res.json({ success: true, message: 'Đã xóa toàn bộ bộ nhớ đệm thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
// ==========================================
// MATCH CRUD FOR ADMIN
// ==========================================

// 1. Lấy danh sách trận đấu theo ngày
router.get('/matches/:date', verifyToken, isAdmin, async (req, res) => {
    try {
        const { date } = req.params;
        const matches = await MatchRepo.getMatchesByDate(date);
        res.json({ success: true, data: matches });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// 2. Xóa một trận đấu
router.delete('/matches/:date/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { date, id } = req.params;
        await MatchRepo.deleteMatch(date, id);
        
        // Audit log
        await AuditLogRepo.log({
            userId: req.user.username,
            action: 'DELETE_MATCH',
            entityType: 'MATCH',
            entityId: id,
            note: `Deleted match on ${date}`
        });
        
        res.json({ success: true, message: 'Đã xóa trận đấu' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// 3. Thêm một trận đấu thủ công (Custom Match)
router.post('/matches', verifyToken, isAdmin, async (req, res) => {
    try {
        const matchData = req.body;
        // Đảm bảo cờ isManualControl = true để Crawler không ghi đè
        const newMatch = {
            ...matchData,
            id: matchData.id || require('crypto').randomBytes(4).toString('hex'), // Tạo ID ngẫu nhiên nếu không có
            isManualControl: true,
            isCustom: true // Đánh dấu trận tự tạo
        };

        // Lưu qua hàm saveMatchesBatch
        await MatchRepo.saveMatchesBatch([newMatch]);

        await AuditLogRepo.log({
            userId: req.user.username,
            action: 'CREATE_MATCH',
            entityType: 'MATCH',
            entityId: newMatch.id,
            note: `Created match in ${newMatch.tournamentName}`
        });

        res.json({ success: true, data: newMatch });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// 4. Cập nhật thông tin trận đấu (Full Update)
router.put('/matches/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { dateString, ...updateData } = req.body;
        
        if (!dateString) {
            return res.status(400).json({ success: false, message: 'Thiếu dateString' });
        }

        // Đảm bảo lấy pk, sk đúng
        const pk = `DATE#${dateString}`;
        const sk = `MATCH#${id}`;
        
        const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
        const { client } = require('../config/db.config');
        
        let updateExp = "SET updatedAt = :u";
        const attrNames = {};
        const attrValues = { ":u": new Date().toISOString() };
        
        // Nếu cập nhật thủ công từ form admin, tự động bật isManualControl = true
        updateExp += ", isManualControl = :manual";
        attrValues[":manual"] = true;

        const fields = ['homeTeam', 'awayTeam', 'score', 'status', 'currentMinute', 'startTimestamp', 'tournamentName', 'league'];
        
        fields.forEach(field => {
            if (updateData[field] !== undefined) {
                updateExp += `, #${field} = :${field}`;
                attrNames[`#${field}`] = field;
                attrValues[`:${field}`] = updateData[field];
            }
        });

        // Chỉ gửi lệnh update nếu có field cần update (ngoài isManual và updatedAt)
        if (Object.keys(attrNames).length > 0) {
             const command = new UpdateCommand({
                TableName: MatchRepo.TABLE_NAME || 'PhuiScore_Matches',
                Key: { pk, sk },
                UpdateExpression: updateExp,
                ExpressionAttributeNames: attrNames,
                ExpressionAttributeValues: attrValues,
                ReturnValues: "ALL_NEW"
            });
            const updated = await client.send(command);

            await AuditLogRepo.log({
                userId: req.user.username,
                action: 'UPDATE_MATCH',
                entityType: 'MATCH',
                entityId: id
            });

            res.json({ success: true, data: updated.Attributes });
        } else {
             res.json({ success: true, message: 'Không có dữ liệu thay đổi' });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// =========================================================
// QUẢN LÝ ĐỘI BÓNG (TEAMS CRUD)
// =========================================================

// Lấy tất cả đội bóng (không lọc status)
router.get('/teams', verifyToken, isAdmin, async (req, res) => {
    try {
        const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
        const { client } = require('../config/db.config');
        const params = { TableName: 'PhuiScore_Teams' };
        const result = await client.send(new ScanCommand(params));
        
        let items = result.Items || [];
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        res.json({ success: true, data: items });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Thêm đội bóng mới
router.post('/teams', verifyToken, isAdmin, async (req, res) => {
    try {
        if (!req.body.name || !req.body.leader) {
            return res.status(400).json({ success: false, message: 'Tên đội và Đội trưởng là bắt buộc' });
        }
        const newTeam = await TeamRepo.create(req.body, req.user.username);
        
        await AuditLogRepo.log({
            userId: req.user.username,
            action: 'CREATE_TEAM',
            entityType: 'TEAM',
            entityId: newTeam.id,
            note: `Created team ${newTeam.name}`
        });
        
        res.json({ success: true, data: newTeam });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Sửa đội bóng
router.put('/teams/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await TeamRepo.update(id, req.body);
        
        await AuditLogRepo.log({
            userId: req.user.username,
            action: 'UPDATE_TEAM',
            entityType: 'TEAM',
            entityId: id
        });
        
        res.json({ success: true, data: updated });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Xóa đội bóng
router.delete('/teams/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await TeamRepo.delete(id);
        
        await AuditLogRepo.log({
            userId: req.user.username,
            action: 'DELETE_TEAM',
            entityType: 'TEAM',
            entityId: id
        });
        
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// =========================================================
// QUẢN LÝ TIN TỨC (NEWS CRUD)
// =========================================================

// Lấy tất cả tin tức (không phân trang cho admin)
router.get('/news', verifyToken, isAdmin, async (req, res) => {
    try {
        const items = await NewsRepo.getAll();
        items.sort((a, b) => new Date(b.published_at || b.createdAt || 0).getTime() - new Date(a.published_at || a.createdAt || 0).getTime());
        res.json({ success: true, data: items });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Thêm tin tức mới
router.post('/news', verifyToken, isAdmin, async (req, res) => {
    try {
        if (!req.body.title) {
            return res.status(400).json({ success: false, message: 'Tiêu đề là bắt buộc' });
        }
        const newNews = await NewsRepo.create(req.body);
        
        await AuditLogRepo.log({
            userId: req.user.username,
            action: 'CREATE_NEWS',
            entityType: 'NEWS',
            entityId: newNews.id,
            note: `Created news ${newNews.title}`
        });
        
        res.json({ success: true, data: newNews });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Sửa tin tức
router.put('/news/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await NewsRepo.update(id, req.body);
        
        await AuditLogRepo.log({
            userId: req.user.username,
            action: 'UPDATE_NEWS',
            entityType: 'NEWS',
            entityId: id
        });
        
        res.json({ success: true, data: updated });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Xóa tin tức
router.delete('/news/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await NewsRepo.delete(id);
        
        await AuditLogRepo.log({
            userId: req.user.username,
            action: 'DELETE_NEWS',
            entityType: 'NEWS',
            entityId: id
        });
        
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Endpoint chẩn đoán cho Admin (Debug)
router.get('/debug', verifyToken, isAdmin, async (req, res) => {
    res.json({
        env: {
            NODE_ENV: process.env.NODE_ENV,
            DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME,
            MATCH_TABLE: MatchRepo.TABLE_NAME || 'PhuiScore_Matches'
        },
        user: req.user
    });
});

module.exports = router;
