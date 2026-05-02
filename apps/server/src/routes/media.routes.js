const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Upload } = require("@aws-sdk/lib-storage");
const { s3Client, BUCKET_NAME } = require('../config/s3.config');
const { IvsClient, CreateChannelCommand, GetStreamKeyCommand, PutMetadataCommand, StopStreamCommand } = require("@aws-sdk/client-ivs");
const { AccessToken } = require('livekit-server-sdk');
const ivsClient = new IvsClient({
    region: process.env.AWS_REGION || "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const { verifyToken, isMedia } = require('../middlewares/auth.middleware');
const NewsRepo = require('../repositories/news.repo');
const slugify = require('slugify');

// Configure multer to store files in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

/**
 * 🚀 API: Upload Image to S3 with Prefixing
 */
router.post('/upload', verifyToken, isMedia, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Đại ca chưa chọn ảnh để upload!" });
        }

        const type = req.body.type || 'others'; // 'news', 'matches', 'teams'
        const prefix = type === 'news' ? 'news/articles/' : (type === 'matches' ? 'matches/thumbnails/' : 'others/');
        const fileName = `${prefix}${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;

        const parallelUploads3 = new Upload({
            client: s3Client,
            params: {
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                ACL: 'public-read' // Assumes bucket allows public read
            },
        });

        await parallelUploads3.done();

        const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
        res.json({ success: true, url: imageUrl });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: "Lỗi khi tải ảnh lên S3!" });
    }
});

const MatchRepo = require('../repositories/match.repo');

/**
 * ⚽ API: Update Scoreboard (For Commentators)
 */
router.post('/update-score', verifyToken, isMedia, async (req, res) => {
    try {
        const { date, matchId, homeScore, awayScore, currentMinute, liveStatus, statistics } = req.body;
        
        console.log("[UpdateScore] 📥 Payload received:", { date, matchId, homeScore, awayScore, currentMinute, liveStatus, statistics });

        if (!date || !matchId) {
            console.error("[UpdateScore] ❌ Missing required fields:", { date, matchId });
            return res.status(400).json({ message: "Thiếu thông tin trận đấu (Date hoặc MatchID)!" });
        }

        await MatchRepo.updateMatchScoreboard(date, matchId, { 
            homeScore, awayScore, currentMinute, liveStatus, statistics 
        });

        // 🚀 SOCKET: Phát tín hiệu real-time cho toàn bộ người xem
        if (global.io) {
            global.io.emit('scoreUpdate', { 
                matchId, homeScore, awayScore, currentMinute, liveStatus 
            });
        }

        res.json({ success: true, message: "Cập nhật tỉ số thành công!" });
    } catch (error) {
        console.error("Score Update Error:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật tỉ số!" });
    }
});

/**
 * 📰 API: Create News Article
 */
router.post('/create-news', verifyToken, isMedia, async (req, res) => {
    try {
        const { id: existingId, title, content, thumbnail, category, excerpt, author } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: "Thiếu Tiêu đề hoặc Nội dung bài viết!" });
        }

        // Nếu có existingId thì dùng nó (đây là lệnh sửa), nếu không thì tạo mới
        const id = existingId || `local_${Date.now()}`;
        
        // Slug: Chỉ tạo mới slug nếu là bài viết mới, bài cũ giữ nguyên slug để tránh hỏng link SEO
        // (Hoặc có thể tạo lại nếu bạn muốn URL đổi theo tiêu đề mới)
        let slug = req.body.slug;
        if (!slug) {
            slug = slugify(title, { lower: true, strict: true, locale: 'vi' }) + `-${Math.floor(Math.random() * 1000)}`;
        }
        
        const newsItem = {
            id,
            slug,
            title,
            content,
            thumbnail,
            category: category || 'General',
            excerpt: excerpt || '',
            published_at: req.body.published_at || new Date().toISOString(),
            author: author || req.user.fullName || 'Admin', // Tên hiển thị
            createdBy: req.user.username, // Chủ sở hữu thực sự (username)
            source: 'PhuiScore Media',
            viewCount: req.body.viewCount || 0
        };

        await NewsRepo.upsert(newsItem);

        res.json({ success: true, message: existingId ? "Cập nhật thành công!" : "Đã đăng bài viết thành công!", slug });
    } catch (error) {
        console.error("Create News Error:", error);
        res.status(500).json({ message: "Lỗi khi đăng bài viết!" });
    }
});

/**
 * 📰 API: Get My News Articles
 */
router.get('/my-news', verifyToken, isMedia, async (req, res) => {
    try {
        const allNews = await NewsRepo.getList({ limit: 100 });
        // Lọc chính xác theo username của người đang đăng nhập
        const myNews = allNews.data.filter(n => n.createdBy === req.user.username);
        
        res.json({ success: true, data: myNews });
    } catch (error) {
        console.error("Get My News Error:", error);
        res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách bài viết" });
    }
});

/**
 * 📰 API: Delete News
 */
router.delete('/news/:id', verifyToken, isMedia, async (req, res) => {
    try {
        const { id } = req.params;
        const { DeleteCommand } = require("@aws-sdk/lib-dynamodb");
        const { docClient } = require('../config/db.config');
        
        await docClient.send(new DeleteCommand({
            TableName: "PhuiScore_ExternalNews",
            Key: { id }
        }));

        res.json({ success: true, message: "Đã xóa bài viết!" });
    } catch (error) {
        console.error("Delete News Error:", error);
        res.status(500).json({ success: false, message: "Lỗi khi xóa bài viết" });
    }
});

/**
 * 📡 API: Start Livestream (Amazon IVS)
 */
router.post('/start-stream', verifyToken, isMedia, async (req, res) => {
    try {
        const { matchId, matchName } = req.body;
        
        // 1. Tạo/Lấy Channel IVS cho trận đấu
        // Ở thực tế, bạn có thể tạo 1 channel cố định cho BLV hoặc tạo động
        const createCmd = new CreateChannelCommand({
            name: `PhuiScore-Match-${matchId}`,
            latencyMode: "LOW",
            type: "STANDARD"
        });
        
        const channelData = await ivsClient.send(createCmd);
        
        // 2. Lấy Stream Key
        const keyCmd = new GetStreamKeyCommand({
            arn: channelData.streamKey.arn
        });
        const keyData = await ivsClient.send(keyCmd);

        res.json({
            success: true,
            ingestEndpoint: channelData.channel.ingestEndpoint,
            streamKey: keyData.streamKey.value,
            playbackUrl: channelData.channel.playbackUrl
        });
    } catch (error) {
        console.error("Start Stream Error:", error);
        res.status(500).json({ message: "Lỗi khi khởi tạo luồng IVS!" });
    }
});

/**
 * 📝 API: Send Timed Metadata (IVS)
 */
router.post('/send-metadata', verifyToken, isMedia, async (req, res) => {
    try {
        const { channelArn, metadata } = req.body;
        const cmd = new PutMetadataCommand({
            channelArn,
            metadata: JSON.stringify(metadata)
        });
        await ivsClient.send(cmd);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Lỗi gửi metadata!" });
    }
});

/**
 * 🎫 API: Get LiveKit Token & Create Ingress (for OBS)
 */
router.get('/livekit-token', verifyToken, isMedia, async (req, res) => {
    try {
        const { room } = req.query;
        if (!room) return res.status(400).json({ message: "Thiếu tên phòng (Room)!" });

        const participantName = req.user.fullName || `Admin_${req.user.username}`;

        if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) {
            throw new Error("Thiếu cấu hình LiveKit trên Server (API_KEY/SECRET/URL). Hãy kiểm tra Environment Variables trên Render!");
        }

        // 1. Tạo Token cho người dùng (để vào xem/điều khiển)
        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY, 
            process.env.LIVEKIT_API_SECRET, 
            { identity: participantName }
        );
        
        at.addGrant({ 
            roomJoin: true, 
            room: room, 
            canPublish: true, 
            canSubscribe: true 
        });

        const token = await at.toJwt();

        // 2. Tạo Ingress (cho OBS) - Tự động hóa việc lấy Stream Key
        let ingressData = null;
        let ingressErrorMsg = null;
        try {
            const { IngressClient, IngressInput } = require('livekit-server-sdk');
            const host = process.env.LIVEKIT_URL.replace('wss://', 'https://');
            
            const ingressClient = new IngressClient(
                host, 
                process.env.LIVEKIT_API_KEY, 
                process.env.LIVEKIT_API_SECRET
            );

            // Cố gắng tạo Ingress
            const ingress = await ingressClient.createIngress(IngressInput.RTMP_VIDEO, {
                name: `match-${room}`,
                roomName: room,
                participantIdentity: `obs_${room}`,
                participantName: 'OBS Streamer'
            });

            ingressData = {
                url: ingress.url,
                streamKey: ingress.streamKey
            };
        } catch (err) {
            console.error("Ingress Error:", err.message);
            ingressErrorMsg = err.message;
        }

        res.json({ 
            success: true, 
            token, 
            ingress: ingressData,
            ingressError: ingressErrorMsg 
        });
    } catch (error) {
        console.error("LiveKit Token Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Tạo Token công khai cho khán giả (Public Viewer)
router.get('/public-token', async (req, res) => {
    try {
        const { room } = req.query;
        if (!room) return res.status(400).json({ success: false, message: "Thiếu ID phòng" });

        const { AccessToken } = require('livekit-server-sdk');
        
        // Tạo định danh ngẫu nhiên cho khán giả
        const viewerId = `viewer_${Math.random().toString(36).substring(7)}`;
        
        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            {
                identity: viewerId,
                name: 'Khán giả',
                ttl: '2h'
            }
        );

        at.addGrant({ 
            roomJoin: true, 
            room: room, 
            canPublish: false, // Khán giả không được phát video
            canSubscribe: true // Khán giả chỉ được xem
        });

        const token = await at.toJwt();
        res.json({ success: true, token });
    } catch (error) {
        console.error("Public Token Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
