const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Đại ca chưa đăng nhập (Thiếu Token)!" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'PHUI_SCORE_SECRET');
        req.user = verified;
        next();
    } catch (err) {
        console.error("JWT Verify Error:", err.message);
        res.status(401).json({ message: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại!" });
    }
};

const isAdmin = (req, res, next) => {
    // Kiểm tra role từ token (đã giải mã ở verifyToken)
    if (req.user.role !== 'MANAGER' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Quyền hạn không đủ! Chỉ Chủ sân/Admin mới được làm lệnh này." });
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

module.exports = { verifyToken, isAdmin, verifyTokenOptional };
