const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepo = require('../repositories/user.repo');

// --- HÀM ĐĂNG KÝ (GIỮ NGUYÊN) ---
const register = async (req, res) => {
    try {
        const { fullName, email, phoneNumber, username, password, role } = req.body;
        if (!fullName || !email || !phoneNumber || !username || !password) {
            return res.status(400).json({ message: "Đại ca điền thiếu thông tin rồi!" });
        }
        const existingUser = await UserRepo.findUserByUsername(username);
        if (existingUser) return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            username, fullName, email, phoneNumber,
            password: hashedPassword,
            role: role || 'USER',
            plan: 'FREE',
            usage: { matchesCreated: 0, leaguesCreated: 0, limitMatches: 5, limitLeagues: 2 },
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
        };
        await UserRepo.createUser(newUser);
        res.status(201).json({ message: "Đăng ký thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server!" });
    }
};

// --- HÀM ĐĂNG NHẬP (GIỮ NGUYÊN) ---
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await UserRepo.findUserByUsername(username);
        if (!user) return res.status(400).json({ message: "Tài khoản không tồn tại!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Mật khẩu sai!" });

        const secret = process.env.JWT_SECRET || 'PHUI_SCORE_SECRET';
        const token = jwt.sign({ username: user.username, role: user.role }, secret, { expiresIn: '24h' });

        res.json({
            token,
            user: { username: user.username, fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber, role: user.role, usage: user.usage }
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi đăng nhập!" });
    }
};

// --- HÀM MỚI: LẤY THÔNG TIN PROFILE ---
const getProfile = async (req, res) => {
    try {
        const { id } = req.params; // Lấy username từ URL (ví dụ: /profile/nva_phui)
        const user = await UserRepo.findUserByUsername(id);
        
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy cầu thủ này đại ca ơi!" });
        }

        // Loại bỏ password trước khi gửi về cho Frontend cho an toàn
        const { password, ...profileData } = user;
        res.json(profileData);
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi lấy hồ sơ!" });
    }
};

// NHỚ EXPORT THÊM getProfile RA NHÉ ĐẠI CA
module.exports = { register, login, getProfile };