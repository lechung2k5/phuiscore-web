const jwt = require('jsonwebtoken');
const UserRepo = require('../repositories/user.repo');
const redis = require('../config/redis.config');

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'PHUI_SCORE_SECRET';
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

const safeRedisGet = async (key) => {
    try {
        return await redis.get(key);
    } catch (err) {
        console.warn(`[Redis] Bỏ qua lỗi đọc cache ${key}:`, err.message);
        return null;
    }
};

const safeRedisSetex = async (key, ttl, value) => {
    try {
        await redis.setex(key, ttl, value);
    } catch (err) {
        console.warn(`[Redis] Bỏ qua lỗi ghi cache ${key}:`, err.message);
    }
};

const parseSession = (sessionRaw, key) => {
    try {
        return JSON.parse(sessionRaw);
    } catch (err) {
        console.warn(`[Redis] Cache session lỗi định dạng ${key}:`, err.message);
        return null;
    }
};

// ============================================================
// 🛡️ verifyToken - Xác thực Access Token
// Part 2: Kiểm tra status tài khoản
// Part 4: Ưu tiên Redis, fallback DynamoDB để tối ưu hiệu năng
// ============================================================
const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Đại ca chưa đăng nhập (Thiếu Token)!" });

    try {
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

        const sessionKey = `user:session:${decoded.username}`;
        // Part 4: Kiểm tra session trong Redis TRƯỚC (cực nhanh ~1ms)
        const sessionRaw = await safeRedisGet(sessionKey);

        const cachedSession = sessionRaw ? parseSession(sessionRaw, sessionKey) : null;
        if (cachedSession) {
            // Part 2: Kiểm tra trạng thái tài khoản từ Redis cache
            if (cachedSession.status !== 'ACTIVE') {
                return res.status(403).json({
                    message: "Tài khoản của đại ca đã bị khóa hoặc tạm ngưng. Vui lòng liên hệ hỗ trợ."
                });
            }

            // Part 4: Kiểm tra Session ID để chặn đăng nhập đồng thời
            if (cachedSession.sessionId !== decoded.sessionId) {
                return res.status(401).json({
                    message: "Tài khoản vừa đăng nhập ở thiết bị khác! Vui lòng đăng nhập lại để tiếp tục."
                });
            }
        } else {
            // Cache miss: truy vấn DynamoDB và cập nhật lại Redis cache
            const user = await UserRepo.findUserByUsername(decoded.username);

            if (!user) {
                return res.status(401).json({ message: "Tài khoản không tồn tại!" });
            }

            // Part 2: Kiểm tra trạng thái tài khoản từ DynamoDB
            if (user.status !== 'ACTIVE') {
                return res.status(403).json({
                    message: "Tài khoản của đại ca đã bị khóa hoặc tạm ngưng. Vui lòng liên hệ hỗ trợ."
                });
            }

            // Part 4: Kiểm tra Session ID từ DB
            if (user.currentSessionId && user.currentSessionId !== decoded.sessionId) {
                return res.status(401).json({
                    message: "Tài khoản vừa đăng nhập ở thiết bị khác! Vui lòng đăng nhập lại để tiếp tục."
                });
            }

            // Làm ấm lại Redis cache (TTL 30 ngày) để request sau nhanh hơn
            const sessionData = JSON.stringify({
                sessionId: decoded.sessionId,
                status: user.status,
                role: user.role,
            });
            await safeRedisSetex(sessionKey, SESSION_TTL_SECONDS, sessionData);
        }

        req.user = decoded;
        next();
    } catch (err) {
        console.error('[JWT VerifyToken Error]', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Access Token đã hết hạn! Vui lòng làm mới Token." });
        }
        res.status(401).json({ message: "Token không hợp lệ, vui lòng đăng nhập lại!" });
    }
};

// ============================================================
// 🛡️ isAdmin - Yêu cầu quyền Admin
// ============================================================
const isAdmin = (req, res, next) => {
    const role = req.user?.role?.toLowerCase();
    const adminRoles = ['admin', 'super_admin', 'manager'];
    if (!adminRoles.includes(role)) {
        return res.status(403).json({ message: "Quyền hạn không đủ! Cần quyền Quản trị viên." });
    }
    next();
};

// ============================================================
// 🛡️ isSuperAdmin - Chỉ SuperAdmin
// ============================================================
const isSuperAdmin = (req, res, next) => {
    const role = req.user?.role?.toLowerCase();
    if (role !== 'super_admin' && role !== 'admin') {
        return res.status(403).json({ message: "Khu vực tối mật! Chỉ SuperAdmin mới được truy cập." });
    }
    next();
};

// ============================================================
// 🛡️ isCoordinator - Điều phối viên & Media
// ============================================================
const isCoordinator = (req, res, next) => {
    const role = req.user?.role?.toLowerCase();
    const allowedRoles = ['coordinator', 'media', 'admin', 'super_admin'];
    if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Cần quyền Điều phối viên (Coordinator/Media) để thực hiện thao tác này." });
    }
    next();
};

// ============================================================
// 🛡️ isCreator - Biên tập viên
// ============================================================
const isCreator = (req, res, next) => {
    const role = req.user?.role?.toLowerCase();
    const allowedRoles = ['creator', 'admin', 'super_admin'];
    if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Cần quyền Biên tập viên (Creator) để đăng nội dung." });
    }
    next();
};

// ============================================================
// 🛡️ verifyTokenOptional - Gắn req.user nếu có token hợp lệ, không block
// ============================================================
const verifyTokenOptional = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (token) {
        try {
            req.user = jwt.verify(token, JWT_ACCESS_SECRET);
        } catch (err) {
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
};

module.exports = { verifyToken, isAdmin, isSuperAdmin, isCoordinator, isCreator, verifyTokenOptional };
