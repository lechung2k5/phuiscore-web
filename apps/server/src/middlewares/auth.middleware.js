const jwt = require('jsonwebtoken');
const UserRepo = require('../repositories/user.repo');

const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Đại ca chưa đăng nhập (Thiếu Token)!" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'PHUI_SCORE_SECRET');
        
        // --- MỚI: Kiểm tra Session ID để ngăn đăng nhập đồng thời ---
        if (verified.sessionId) {
            const user = await UserRepo.findUserByUsername(verified.username);
            // Nếu Session ID trong Token không khớp với Session ID mới nhất trong DB
            if (!user || user.currentSessionId !== verified.sessionId) {
                return res.status(401).json({ 
                    message: "Tài khoản của đại ca vừa đăng nhập ở máy khác! Vui lòng đăng nhập lại để tiếp tục." 
                });
            }
        }

        req.user = verified;
        next();
    } catch (err) {
        console.error("JWT Verify Error:", err.message);
        res.status(401).json({ message: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại!" });
    }
};

const isAdmin = (req, res, next) => {
    const role = req.user?.role?.toLowerCase();
    if (role !== 'manager' && role !== 'admin') {
        return res.status(403).json({ message: "Quyền hạn không đủ! Chỉ Chủ sân/Admin mới được làm lệnh này." });
    }
    next();
};

const isMedia = (req, res, next) => {
    const role = req.user?.role?.toLowerCase();
    if (role !== 'media' && role !== 'admin') {
        return res.status(403).json({ message: "Đại ca cần quyền Media hoặc Admin để vào khu vực này!" });
    }
    next();
};

// Optional: gắn req.user nếu có token hợp lệ, không block nếu không có
const verifyTokenOptional = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (token) {
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET || 'PHUI_SCORE_SECRET');
        } catch (err) {
            req.user = null; // token lỗi → bỏ qua, không block
        }
    } else {
        req.user = null;
    }
    next();
};

module.exports = { verifyToken, isAdmin, isMedia, verifyTokenOptional };
