require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Import Utils & Services
const { crawlByDate } = require('./utils/crawler'); 
const setupCron = require('./services/cron.service');
const { cacheResponse } = require('./middlewares/cacheMiddleware');
const { uploadBase64ToS3 } = require('./utils/s3.utils');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const tournamentRoutes = require('./routes/tournament.routes');
const matchRoutes = require('./routes/match.routes'); 
const standingRoutes = require('./routes/standing.routes'); 
const teamRoutes = require('./routes/team.routes');
const teamMemberRoutes = require('./routes/teamMember.routes');
const notificationRoutes = require('./routes/notification.routes');
const syncRoutes = require('./routes/sync.routes'); // Cầu nối Crawler & Server

const app = express();
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOrigin = (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
};

// Khởi tạo Socket.io với CORS
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

// Tích hợp Redis Adapter cho Socket.io
try {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const redisConn = require('./config/redis.config');
    const subClient = redisConn.duplicate();
    io.adapter(createAdapter(redisConn, subClient));
    console.log('[Socket] ⚡ Đã gắn Redis Adapter thành công');
} catch (e) {
    console.log('[Socket] ⚠️ Lỗi gắn Redis Adapter (Khởi chạy bằng bộ nhớ trong):', e.message);
}

// Gán io vào global để các service khác có thể truy cập
global.io = io;

io.on('connection', (socket) => {
    // console.log(`[Socket] 🔌 Người dùng kết nối: ${socket.id}`);
    
    // Tham gia phòng Live
    socket.on('join_live_room', (matchId) => {
        const roomName = `live_${matchId}`;
        socket.join(roomName);
        // console.log(`[Socket] 👤 ${socket.id} joined room: ${roomName}`);
    });

    // Gửi tin nhắn
    socket.on('send_chat_message', async (data) => {
        try {
            const { matchId, token, message } = data;
            if (!matchId || !token || !message) return;

            // Xác thực Token
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'PHUI_SCORE_SECRET');
            
            // Lưu vào DynamoDB
            const LiveChatRepo = require('./repositories/liveChat.repo');
            const savedMessage = await LiveChatRepo.saveMessage({
                matchId,
                userId: decoded.id || decoded.username,
                username: decoded.fullName || decoded.username,
                avatar: decoded.avatar || null,
                role: decoded.role || 'user',
                message
            });

            // Phát sự kiện tới tất cả người dùng trong phòng
            io.to(`live_${matchId}`).emit('new_chat_message', savedMessage);
        } catch (error) {
            console.error('[Socket] Lỗi xử lý tin nhắn chat:', error);
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                socket.emit('chat_error', { message: 'Xác thực thất bại, vui lòng đăng nhập lại!' });
            } else {
                socket.emit('chat_error', { message: 'Lỗi hệ thống khi gửi tin nhắn, vui lòng thử lại!' });
            }
        }
    });

    socket.on('disconnect', () => {
        // console.log(`[Socket] 🔌 Người dùng ngắt kết nối: ${socket.id}`);
    });
});

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

// 3. CORS: Phải đặt TRƯỚC rate limiter để response 429 vẫn có CORS header
app.use(cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// 4. Rate Limiting — Chống DDoS/spam
//    Toàn cục: 500 request / 1 phút / mỗi IP (đủ rộng cho dev)
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 200 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Quá nhiều yêu cầu! Vui lòng đợi 1 phút rồi thử lại.' },
    skip: (req) => {
        // Bỏ qua giới hạn cho localhost (dùng cho Crawler tự động hoặc lúc Dev)
        const ip = req.ip || req.connection.remoteAddress;
        return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    }
});
app.use(globalLimiter);

// Rate limit riêng cho Auth (chống brute-force): 20 request / 15 phút
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng đợi 15 phút.' }
});

// Body parser — Tăng giới hạn để nhận dữ liệu cào lớn (JSON + Lineups + Stats)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser — Cần thiết để đọc HttpOnly refreshToken cookie
app.use(cookieParser());

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

// Media routes
const mediaRoutes = require('./routes/media.routes');
app.use('/api/media', mediaRoutes);

// Sync routes (Crawler)
app.use('/api/sync', syncRoutes);

// Admin routes
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);


// ========================================
// 📁 UPLOAD FILE (Base64)
// ========================================

const uploadsDir = path.join(__dirname, '..', 'uploads', 'tournaments');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.post('/api/upload/tournament-file', async (req, res) => {
    try {
        const { base64, filename, mimeType, folder = 'tournaments' } = req.body;
        if (!base64 || !filename) return res.status(400).json({ success: false, message: 'Thiếu dữ liệu file' });

        // Upload trực tiếp lên S3
        const url = await uploadBase64ToS3(base64, filename, folder);
        
        console.log(`[S3 Upload Success] 🚀 File: ${filename} -> ${url}`);
        res.json({ success: true, url });
    } catch (err) {
        console.error('[Upload Error]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});


// ========================================
// 🤖 HỆ THỐNG TỰ ĐỘNG (CRON JOBS & WORKERS)
// ========================================

// Khởi chạy crawler worker chỉ khi cần cào detail/live qua queue.
// Mặc định tắt để hệ thống chỉ giữ lịch thi đấu và BXH.
if (process.env.ENABLE_CRAWLER_WORKER === 'true') {
    require('./workers/crawler.worker');
} else {
    console.log('[Crawler Worker] Disabled.');
}

setupCron();

// Đồng bộ tin tức startup chỉ khi bật rõ ràng.
if (process.env.ENABLE_NEWS_SYNC === 'true') {
    const { syncExternalNews } = require('./services/newsFetcher.service');
    syncExternalNews().catch(err => console.error('[Startup] ❌ Lỗi đồng bộ tin tức:', err.message));
}

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

// Job: Tự gọi chính mình mỗi 10 phút để tránh bị Render tắt server (Sleep)
// Điều này cực kỳ quan trọng để đảm bảo tốc độ phản hồi luôn < 3s
cron.schedule('*/10 * * * *', () => {
    const serverUrl = process.env.SERVER_URL || `http://localhost:${PORT}`;
    console.log('[Keep-Alive] 🛡️ Đang tự đánh thức server để tránh bị Sleep...');
    axios.get(serverUrl).catch(() => {});
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

server.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`⚡ Middleware: compression + helmet + rate-limit`);
    console.log(`💾 Cache: in-memory (node-cache)`);
    console.log(`✅ CORS: ${allowedOrigins.join(', ')}`);
    console.log(`==============================================\n`);
});
