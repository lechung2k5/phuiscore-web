require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

// Import Utils & Services
const { crawlByDate } = require('./utils/crawler'); 
const setupCron = require('./services/cron.service');
const { cacheResponse } = require('./middlewares/cacheMiddleware');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const tournamentRoutes = require('./routes/tournament.routes');
const matchRoutes = require('./routes/match.routes'); 
const standingRoutes = require('./routes/standing.routes'); 
const teamRoutes = require('./routes/team.routes');
const teamMemberRoutes = require('./routes/teamMember.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// ========================================
// ⚡ MIDDLEWARE HIỆU NĂNG (MỚI)
// ========================================

// 1. Compression (gzip) — Giảm 70-80% bandwidth cho JSON response
//    10,000 users nhận response nén → giảm đáng kể tải server & network
app.use(compression({
    level: 6,              // Cân bằng giữa tốc độ nén và tỷ lệ nén
    threshold: 1024,       // Chỉ nén response > 1KB (response nhỏ không cần)
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));

// 2. Helmet — Bảo mật HTTP headers (chống XSS, clickjacking, sniffing...)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Cho phép load ảnh/file từ domain khác
    contentSecurityPolicy: false, // Tắt CSP vì frontend ở domain khác
}));

// 3. Rate Limiting — Chống DDoS/spam
//    Toàn cục: 200 request / 1 phút / mỗi IP
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Quá nhiều yêu cầu! Vui lòng đợi 1 phút rồi thử lại.' }
});
app.use(globalLimiter);

// Rate limit riêng cho Auth (chống brute-force): 20 request / 15 phút
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng đợi 15 phút.' }
});

// ========================================
// ⚙️ CẤU HÌNH MIDDLEWARE CHUNG
// ========================================

// CORS: Cho phép Frontend truy cập
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// Body parser — Giảm limit từ 15MB → 5MB (đủ cho JSON thông thường + base64 ảnh nhỏ)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


// ========================================
// 📂 API LEAGUES — CACHE VÀO MEMORY
// ========================================

// PRE-LOAD: Đọc file 1 lần khi server start, lưu vào RAM
// Trước kia: đọc fs.readFileSync 256KB MỖI request → block event loop
let cachedLeagues = null;

function loadLeagues() {
    try {
        const filePath = path.join(__dirname, 'leagues_list.txt');
        if (!fs.existsSync(filePath)) {
            console.warn('[Leagues] ⚠️ File leagues_list.txt không tồn tại');
            cachedLeagues = [];
            return;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const leagues = [];
        const regex = /\[ID: (\d+)\] - ([^\(]+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            leagues.push({ id: parseInt(match[1]), name: match[2].trim() });
        }
        cachedLeagues = leagues;
        console.log(`[Leagues] ✅ Đã load ${leagues.length} giải đấu vào memory`);
    } catch (error) {
        console.error('[Leagues] ❌ Lỗi load file:', error);
        cachedLeagues = [];
    }
}

loadLeagues(); // Load 1 lần khi startup

app.get('/api/leagues', (req, res) => {
    // Trả từ memory — 0ms, không đọc file
    if (!cachedLeagues) {
        return res.status(503).json({ success: false, message: 'Dữ liệu đang được khởi tạo...' });
    }
    res.json(cachedLeagues);
});


// ========================================
// 🛣️ ĐĂNG KÝ CÁC ROUTES CHÍNH
// ========================================

// Auth routes — Rate limit riêng chống brute-force
app.use('/api/auth', authLimiter, authRoutes);

// Tournament routes — Cache GET /list 30s
app.use('/api/tournaments', tournamentRoutes);

// Match routes — Cache được áp dụng trong file route
app.use('/api/matches', matchRoutes);

// Standing routes — Cache 5 phút (dữ liệu cào ngoài, ít thay đổi)
app.use('/api/standings', standingRoutes);

// Teams & Players routes
app.use('/api/teams', teamRoutes);
app.use('/api/team-members', teamMemberRoutes);

// Notifications routes
app.use('/api/notifications', notificationRoutes);

// News routes
const newsRoutes = require('./routes/news.routes');
app.use('/api/news', newsRoutes);


// ========================================
// 📁 UPLOAD FILE (Base64)
// ========================================

const uploadsDir = path.join(__dirname, '..', 'uploads', 'tournaments');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.post('/api/upload/tournament-file', (req, res) => {
    try {
        const { base64, filename, mimeType } = req.body;
        if (!base64 || !filename) return res.status(400).json({ success: false, message: 'Thiếu dữ liệu file' });

        const ext = filename.split('.').pop();
        const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const filePath = path.join(uploadsDir, safeName);
        const data = base64.replace(/^data:[^;]+;base64,/, '');
        fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

        const baseUrl = process.env.PUBLIC_URL || 'http://localhost:5000';
        const url = `${baseUrl}/uploads/tournaments/${safeName}`;
        res.json({ success: true, url });
    } catch (err) {
        console.error('[Upload]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});


// ========================================
// 🤖 HỆ THỐNG TỰ ĐỘNG (CRON JOBS)
// ========================================

setupCron();

// Đồng bộ tin tức ngay khi khởi động
const { syncExternalNews } = require('./services/newsFetcher.service');
syncExternalNews().catch(err => console.error('[Startup] ❌ Lỗi đồng bộ tin tức:', err.message));

// Job: 00:05 sáng mỗi ngày, cào trước lịch cho 7 ngày tới
cron.schedule('5 0 * * *', async () => {
    console.log('[Cron] 📅 Đang cào lịch thi đấu cho tuần tới...');
    for (let i = 1; i <= 7; i++) {
        const futureDate = moment().add(i, 'days').format('YYYY-MM-DD');
        try {
            await crawlByDate(futureDate);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
            console.error(`Lỗi cào ngày ${futureDate}:`, err.message);
        }
    }
    console.log('[Cron] ✅ Đã chuẩn bị xong lịch 7 ngày tới.');
});

// Job: 04:00 sáng mỗi ngày, cập nhật BXH cho các giải "Hot"
cron.schedule('0 4 * * *', async () => {
    console.log('[Cron] 🏆 Đang cập nhật Bảng xếp hạng các giải tiêu biểu...');
    const hotLeagues = [17, 8, 23, 35, 34, 626];
    // Logic cập nhật cache BXH tại đây nếu cần
});


// ========================================
// 🛡️ GLOBAL ERROR HANDLER (MỚI)
// ========================================

// Middleware bắt lỗi tập trung — tránh crash server
app.use((err, req, res, next) => {
    console.error('[Server Error]', err.stack || err.message);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Lỗi hệ thống, vui lòng thử lại sau!' 
            : err.message
    });
});

// Bắt unhandled errors — ghi log nhưng KHÔNG crash server
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason);
});


// ========================================
// 🚀 KHỞI CHẠY SERVER
// ========================================

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('⚽ PHUISCORE API Server is Running — Optimized for 10K Users ⚡');
});

// API đồng bộ dữ liệu từ local crawler
app.post('/api/sync/matches', async (req, res) => {
    const { token, matches } = req.body;
    const SYNC_TOKEN = process.env.SYNC_TOKEN || 'phuiscore_secret_2026';

    if (token !== SYNC_TOKEN) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (!Array.isArray(matches)) {
        return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    try {
        const MatchRepo = require('./repositories/match.repo');
        await MatchRepo.saveMatchesBatch(matches);
        console.log(`[Sync] ✅ Đã nhận và cập nhật ${matches.length} trận từ Local Crawler.`);
        res.json({ success: true, count: matches.length });
    } catch (err) {
        console.error('[Sync Error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// API đồng bộ bảng xếp hạng
app.post('/api/sync/standings', async (req, res) => {
    const { token, tournamentId, tournamentName, tournamentLogo, standings } = req.body;
    const SYNC_TOKEN = process.env.SYNC_TOKEN || 'phuiscore_secret_2026';

    if (token !== SYNC_TOKEN) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const TournamentRepo = require('./repositories/tournament.repo');
        await TournamentRepo.updateStandings(tournamentId, standings, { name: tournamentName, logo: tournamentLogo });
        console.log(`[Sync Standings] ✅ Đã cập nhật BXH cho giải: ${tournamentName}`);
        res.json({ success: true });
    } catch (err) {
        console.error('[Sync Standings Error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// API lấy danh sách các giải đấu có BXH
app.get('/api/leagues', async (req, res) => {
    try {
        const TournamentRepo = require('./repositories/tournament.repo');
        const tournaments = await TournamentRepo.getAll();
        // Chỉ lấy các giải có dữ liệu standings
        const leagues = tournaments
            .filter(t => t.standings)
            .map(t => ({
                id: t.id,
                name: t.name,
                logo: t.logo || `https://api.sofascore.app/api/v1/unique-tournament/${t.id}/image`
            }));
        res.json(leagues);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API lấy chi tiết BXH của 1 giải
app.get('/api/standings/:id', async (req, res) => {
    try {
        const TournamentRepo = require('./repositories/tournament.repo');
        // Ép kiểu ID về String để khớp với Key trong DynamoDB
        const tournamentId = String(req.params.id);
        const tournament = await TournamentRepo.getById(tournamentId);
        
        if (!tournament || !tournament.standings) {
            console.log(`[API] ❌ Không tìm thấy BXH cho ID: ${tournamentId}`);
            return res.status(404).json({ message: 'Not found', id: tournamentId });
        }
        
        res.json({
            data: {
                tournamentInfo: {
                    name: tournament.name || 'Giải đấu',
                    logo: tournament.logo || `https://api.sofascore.app/api/v1/unique-tournament/${tournament.id}/image`,
                    season: tournament.updatedAt ? `Cập nhật: ${new Date(tournament.updatedAt).toLocaleTimeString()}` : ''
                },
                standings: tournament.standings
            }
        });
    } catch (err) {
        console.error('[API Standings Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`⚡ Middleware: compression + helmet + rate-limit`);
    console.log(`💾 Cache: in-memory (node-cache)`);
    console.log(`✅ CORS: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    console.log(`==============================================\n`);
});