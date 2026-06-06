const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const UserRepo = require('../repositories/user.repo');
const redis = require('../config/redis.config');
const { sendVerificationOtp, sendPasswordResetOtp } = require('../utils/email.utils');
const { uploadBase64ToS3 } = require('../utils/s3.utils');

// ============================================================
// ⚙️ CONSTANTS & HELPERS
// ============================================================

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'PHUI_SCORE_SECRET';
const JWT_REFRESH_SECRET = (process.env.JWT_SECRET || 'PHUI_SCORE_SECRET') + '_REFRESH';

// Access Token: 7 ngày (tăng lên để Admin không bị văng liên tục)
const ACCESS_TOKEN_EXPIRES = '7d';
// Refresh Token: 30 ngày
const REFRESH_TOKEN_EXPIRES = '30d';
// Session Redis TTL: 30 ngày tính theo giây
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
// OTP Redis TTL: 5 phút
const OTP_TTL_SECONDS = 5 * 60;

/**
 * Kiểm tra mật khẩu mạnh (Part 7):
 * - Tối thiểu 8 ký tự
 * - Ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
 */
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const issueTokens = (payload) => {
    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
    return { accessToken, refreshToken };
};

const getRefreshTokenCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: '/api/auth',
});

const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
};

const safeRedisGet = async (key) => {
    try {
        return await redis.get(key);
    } catch (err) {
        console.warn(`[Redis] Bỏ qua lỗi đọc ${key}:`, err.message);
        return null;
    }
};

const safeRedisSetex = async (key, ttl, value) => {
    try {
        await redis.setex(key, ttl, value);
        return true;
    } catch (err) {
        console.warn(`[Redis] Bỏ qua lỗi ghi ${key}:`, err.message);
        return false;
    }
};

const safeRedisDel = async (key) => {
    try {
        await redis.del(key);
    } catch (err) {
        console.warn(`[Redis] Bỏ qua lỗi xóa ${key}:`, err.message);
    }
};

const safeRedisExpire = async (key, ttl) => {
    try {
        await redis.expire(key, ttl);
    } catch (err) {
        console.warn(`[Redis] Bỏ qua lỗi gia hạn ${key}:`, err.message);
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

const saveOtp = async (username, type, otp) => {
    const key = `user:otp:${type}:${username}`;
    const expiresAt = Date.now() + OTP_TTL_SECONDS * 1000;
    await safeRedisSetex(key, OTP_TTL_SECONDS, otp);
    await UserRepo.upsertOtp(username, type, otp, expiresAt);
};

const getStoredOtp = async (username, type) => {
    const key = `user:otp:${type}:${username}`;
    const redisOtp = await safeRedisGet(key);
    if (redisOtp) return redisOtp;

    const user = await UserRepo.findUserByUsername(username);
    if (!user?.otpData || user.otpData.type !== type) return null;
    if (Number(user.otpData.expiresAt) < Date.now()) {
        await UserRepo.clearOtp(username);
        return null;
    }
    return user.otpData.code;
};

const clearOtp = async (username, type) => {
    await safeRedisDel(`user:otp:${type}:${username}`);
    await UserRepo.clearOtp(username);
};

const buildSessionData = (sessionId, status, role) => JSON.stringify({ sessionId, status, role });

const ROLE_META = {
    user: {
        label: 'Cầu thủ',
        primaryAction: 'Mời vào đội',
        coverPreset: 'player',
    },
    manager: {
        label: 'Đội trưởng',
        primaryAction: 'Quản lý đội',
        coverPreset: 'manager',
    },
    creator: {
        label: 'Biên tập viên',
        primaryAction: 'Viết bài mới',
        coverPreset: 'creator',
    },
    media: {
        label: 'Media',
        primaryAction: 'Vào live control',
        coverPreset: 'media',
    },
    coordinator: {
        label: 'Điều phối viên',
        primaryAction: 'Xem việc cần xử lý',
        coverPreset: 'coordinator',
    },
    admin: {
        label: 'Admin',
        primaryAction: 'Admin dashboard',
        coverPreset: 'admin',
    },
    super_admin: {
        label: 'Super Admin',
        primaryAction: 'Quản trị hệ thống',
        coverPreset: 'super_admin',
    },
};

const PUBLIC_PROFILE_FIELDS = [
    'username',
    'fullName',
    'role',
    'plan',
    'usage',
    'status',
    'createdAt',
    'updatedAt',
    'avatarUrl',
    'coverUrl',
    'bio',
    'area',
    'position',
    'strongFoot',
    'jerseyNumber',
    'heightCm',
    'weightKg',
    'favoriteTeam',
    'currentTeam',
    'photos',
    'badges',
    'achievements',
    'socialLinks',
    'privacy',
];

const PROFILE_UPDATE_FIELDS = {
    fullName: { type: 'string', max: 80 },
    phoneNumber: { type: 'string', max: 20 },
    avatarUrl: { type: 'url', max: 500 },
    coverUrl: { type: 'url', max: 500 },
    bio: { type: 'string', max: 280 },
    area: { type: 'string', max: 80 },
    position: { type: 'enum', values: ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST', 'Coach', 'Media', 'Organizer'] },
    strongFoot: { type: 'enum', values: ['left', 'right', 'both', 'unknown'] },
    jerseyNumber: { type: 'number', min: 0, max: 99 },
    heightCm: { type: 'number', min: 100, max: 230 },
    weightKg: { type: 'number', min: 35, max: 180 },
    favoriteTeam: { type: 'string', max: 80 },
    currentTeam: { type: 'string', max: 120 },
    photos: { type: 'urlArray', maxItems: 12, max: 500 },
    socialLinks: { type: 'object', keys: ['facebook', 'instagram', 'tiktok', 'youtube'], max: 500 },
    privacy: { type: 'object', keys: ['showEmail', 'showPhone', 'showArea'], booleanOnly: true },
};

const numberOrNull = (value) => {
    if (value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeUrl = (value, max = 500) => {
    if (value === null || value === '') return null;
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > max) return undefined;

    try {
        const parsed = new URL(trimmed);
        if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
        return trimmed;
    } catch {
        if (trimmed.startsWith('/uploads/')) return trimmed;
        return undefined;
    }
};

const normalizeString = (value, max) => {
    if (value === null) return null;
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (trimmed.length > max) return undefined;
    return trimmed;
};

const sanitizeProfileUpdate = (body) => {
    const sanitized = {};
    const errors = [];

    Object.entries(PROFILE_UPDATE_FIELDS).forEach(([field, rule]) => {
        if (!Object.prototype.hasOwnProperty.call(body, field)) return;
        const value = body[field];

        if (rule.type === 'string') {
            const clean = normalizeString(value, rule.max);
            if (clean === undefined) errors.push(`${field} không hợp lệ hoặc quá dài`);
            else sanitized[field] = clean;
            return;
        }

        if (rule.type === 'url') {
            const clean = normalizeUrl(value, rule.max);
            if (clean === undefined) errors.push(`${field} phải là URL hợp lệ`);
            else sanitized[field] = clean;
            return;
        }

        if (rule.type === 'enum') {
            if (value === null || value === '') {
                sanitized[field] = null;
            } else if (typeof value === 'string' && rule.values.includes(value)) {
                sanitized[field] = value;
            } else {
                errors.push(`${field} không nằm trong danh sách cho phép`);
            }
            return;
        }

        if (rule.type === 'number') {
            const parsed = numberOrNull(value);
            if (parsed === null) sanitized[field] = null;
            else if (parsed === undefined || parsed < rule.min || parsed > rule.max) errors.push(`${field} không hợp lệ`);
            else sanitized[field] = parsed;
            return;
        }

        if (rule.type === 'urlArray') {
            if (!Array.isArray(value)) {
                errors.push(`${field} phải là danh sách URL`);
                return;
            }
            const urls = value.slice(0, rule.maxItems).map((item) => normalizeUrl(item, rule.max)).filter(Boolean);
            sanitized[field] = urls;
            return;
        }

        if (rule.type === 'object') {
            if (value === null) {
                sanitized[field] = {};
                return;
            }
            if (!value || typeof value !== 'object' || Array.isArray(value)) {
                errors.push(`${field} phải là object`);
                return;
            }
            const cleanObject = {};
            rule.keys.forEach((key) => {
                if (!Object.prototype.hasOwnProperty.call(value, key)) return;
                if (rule.booleanOnly) {
                    cleanObject[key] = Boolean(value[key]);
                    return;
                }
                const cleanValue = normalizeUrl(value[key], rule.max);
                if (cleanValue !== undefined) cleanObject[key] = cleanValue;
            });
            sanitized[field] = cleanObject;
        }
    });

    return { sanitized, errors };
};

const pick = (source, fields) => fields.reduce((acc, field) => {
    if (source[field] !== undefined) acc[field] = source[field];
    return acc;
}, {});

const buildProfileCompletion = (user) => {
    const fields = ['avatarUrl', 'coverUrl', 'bio', 'area', 'position', 'strongFoot', 'jerseyNumber'];
    const completed = fields.filter((field) => user[field] !== undefined && user[field] !== null && user[field] !== '').length;
    return {
        completed,
        total: fields.length,
        percent: Math.round((completed / fields.length) * 100),
        missing: fields.filter((field) => user[field] === undefined || user[field] === null || user[field] === ''),
    };
};

const buildRoleActions = (role = 'user') => {
    const actions = {
        user: ['Xem lịch thi đấu cá nhân', 'Tìm giải đấu gần khu vực', 'Cập nhật hồ sơ cầu thủ'],
        manager: ['Quản lý đội bóng', 'Duyệt thành viên', 'Đăng ký giải đấu'],
        creator: ['Viết bài mới', 'Quản lý bài đã đăng', 'Theo dõi hiệu suất tin'],
        media: ['Vào live control', 'Cập nhật diễn biến trận', 'Tải ảnh highlight'],
        coordinator: ['Xếp lịch trận', 'Duyệt đội tham gia', 'Xác nhận kết quả'],
        admin: ['Quản lý người dùng', 'Kiểm tra giải/trận', 'Duyệt nội dung'],
        super_admin: ['Phân quyền hệ thống', 'Xem audit log', 'Kiểm tra bảo mật'],
    };
    return actions[role] || actions.user;
};

const buildProfileStats = (user) => ({
    usage: user.usage || { matchesCreated: 0, leaguesCreated: 0, limitMatches: 5, limitLeagues: 2 },
    football: {
        matchesPlayed: user.stats?.matchesPlayed || 0,
        goals: user.stats?.goals || 0,
        assists: user.stats?.assists || 0,
        trophies: user.stats?.trophies || 0,
    },
});

const serializePublicProfile = (user, viewer = null) => {
    const role = (user.role || 'user').toLowerCase();
    const privacy = user.privacy || {};
    const profile = pick(user, PUBLIC_PROFILE_FIELDS);
    const isOwner = viewer?.username === user.username;
    const isAdminViewer = ['admin', 'super_admin'].includes((viewer?.role || '').toLowerCase());
    const canSeePrivateContact = isOwner || isAdminViewer;

    profile.role = role;
    profile.roleMeta = ROLE_META[role] || ROLE_META.user;
    profile.profileCompletion = buildProfileCompletion(user);
    profile.roleActions = buildRoleActions(role);
    profile.profileStats = buildProfileStats(user);
    profile.photos = Array.isArray(user.photos) ? user.photos : [];
    profile.badges = Array.isArray(user.badges) ? user.badges : [];
    profile.achievements = Array.isArray(user.achievements) ? user.achievements : [];
    profile.socialLinks = user.socialLinks || {};
    profile.isOwner = isOwner;

    if (canSeePrivateContact || privacy.showEmail) profile.email = user.email;
    if (canSeePrivateContact || privacy.showPhone) profile.phoneNumber = user.phoneNumber;
    if (privacy.showArea === false && !canSeePrivateContact) delete profile.area;

    return profile;
};

const serializePrivateProfile = (user) => {
    const { password, otpData, currentSessionId, ...safeUser } = user;
    return {
        ...safeUser,
        role: (safeUser.role || 'user').toLowerCase(),
        roleMeta: ROLE_META[(safeUser.role || 'user').toLowerCase()] || ROLE_META.user,
        profileCompletion: buildProfileCompletion(user),
        roleActions: buildRoleActions((safeUser.role || 'user').toLowerCase()),
        profileStats: buildProfileStats(user),
    };
};

const PROFILE_IMAGE_TYPES = ['avatar', 'cover', 'photo'];

const sanitizeImageFilename = (filename = 'profile.png') => {
    const clean = String(filename).replace(/[^\w.\-]/g, '_');
    return clean || 'profile.png';
};

// ============================================================
// 📋 PART 7 + PART 5: ĐĂNG KÝ (với xác thực mật khẩu & OTP Email)
// ============================================================
const register = async (req, res) => {
    try {
        const { fullName, email, phoneNumber, username, password, role } = req.body;

        if (!fullName || !email || !phoneNumber || !username || !password) {
            return res.status(400).json({ message: "Đại ca điền thiếu thông tin rồi!" });
        }

        // Part 7: Kiểm tra độ mạnh mật khẩu
        if (!STRONG_PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message: "Mật khẩu phải dài ít nhất 8 ký tự và bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%...)."
            });
        }

        const existingUser = await UserRepo.findUserByUsername(username);
        if (existingUser) return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });

        const existingEmail = await UserRepo.findUserByEmail(email);
        if (existingEmail) return res.status(400).json({ message: "Email này đã được sử dụng cho tài khoản khác!" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Part 5: Tạo user với trạng thái PENDING_VERIFY
        const newUser = {
            username, fullName, email, phoneNumber,
            password: hashedPassword,
            role: role?.toLowerCase() || 'user',
            plan: 'FREE',
            usage: { matchesCreated: 0, leaguesCreated: 0, limitMatches: 5, limitLeagues: 2 },
            status: 'PENDING_VERIFY',   // <<< Phải xác minh Email trước
            createdAt: new Date().toISOString()
        };
        await UserRepo.createUser(newUser);

        // Part 5: Tạo OTP 6 số, lưu Redis và backup DynamoDB để chịu lỗi Redis
        const otp = generateOtp();
        await saveOtp(username, 'verify', otp);

        // Gửi OTP qua Email — tách riêng try/catch để SMTP lỗi không block cả request
        let emailSent = true;
        try {
            await sendVerificationOtp(email, otp, fullName);
        } catch (emailErr) {
            emailSent = false;
            // In OTP ra console để debug khi SMTP lỗi (chỉ dùng lúc dev)
            console.error('[Register] ⚠️ Gửi email thất bại:', emailErr.message);
            console.log(`[Register] 🔑 OTP debug cho ${username}: ${otp}`);
        }

        res.status(201).json({
            message: emailSent
                ? "Đăng ký thành công! Vui lòng kiểm tra email và nhập mã OTP để kích hoạt tài khoản."
                : "Đăng ký thành công! Hệ thống gặp sự cố gửi email. Vui lòng liên hệ hỗ trợ hoặc thử lại sau.",
            username,
            emailSent
        });
    } catch (error) {
        console.error('[Register Error]', error);
        res.status(500).json({ message: "Lỗi server khi đăng ký!" });
    }
};

// ============================================================
// 📋 PART 5: XÁC MINH EMAIL (Kích hoạt tài khoản)
// ============================================================
const verifyEmail = async (req, res) => {
    try {
        const { username, otp } = req.body;
        if (!username || !otp) return res.status(400).json({ message: "Thiếu username hoặc OTP!" });

        const storedOtp = await getStoredOtp(username, 'verify');
        if (!storedOtp) return res.status(400).json({ message: "Mã OTP đã hết hạn. Vui lòng đăng ký lại hoặc yêu cầu gửi lại OTP." });
        if (storedOtp !== otp) return res.status(400).json({ message: "Mã OTP không chính xác!" });

        // Kích hoạt tài khoản
        await UserRepo.updateUserStatus(username, 'ACTIVE');
        // Xóa OTP đã dùng
        await clearOtp(username, 'verify');

        res.json({ message: "🎉 Tài khoản đã được kích hoạt thành công! Bạn có thể đăng nhập ngay bây giờ." });
    } catch (error) {
        console.error('[VerifyEmail Error]', error);
        res.status(500).json({ message: "Lỗi server khi xác minh email!" });
    }
};

// ============================================================
// 📋 PART 1, 2, 4: ĐĂNG NHẬP (Access + Refresh Token, Redis Session)
// ============================================================
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await UserRepo.findUserByUsername(username);
        if (!user) return res.status(400).json({ message: "Tài khoản không tồn tại!" });

        // Part 2: Kiểm tra trạng thái tài khoản
        if (user.status === 'PENDING_VERIFY') {
            return res.status(403).json({ message: "Tài khoản chưa được xác minh email! Vui lòng kiểm tra hộp thư và nhập mã OTP." });
        }
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ message: `Tài khoản của đại ca đã bị ${user.status === 'BANNED' ? 'khóa vĩnh viễn' : 'tạm ngưng'}. Vui lòng liên hệ hỗ trợ.` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Mật khẩu sai!" });

        // Part 4: Tạo session ID mới
        const sessionId = uuidv4();

        // Part 4: Lưu session vào Redis với TTL 30 ngày
        const sessionData = buildSessionData(sessionId, user.status, user.role);
        await safeRedisSetex(`user:session:${username}`, SESSION_TTL_SECONDS, sessionData);

        // Backup session ID vào DynamoDB
        await UserRepo.updateUserSession(user.username, sessionId);

        // Part 1: Tạo Access Token (15 phút) và Refresh Token (30 ngày)
        const tokenPayload = { username: user.username, role: user.role, sessionId };
        const { accessToken, refreshToken } = issueTokens(tokenPayload);

        // Đặt Refresh Token vào HttpOnly Cookie
        setRefreshTokenCookie(res, refreshToken);

        res.json({
            accessToken,
            expiresIn: 15 * 60, // giây
            user: {
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                plan: user.plan,
                usage: user.usage,
                avatarUrl: user.avatarUrl,
                coverUrl: user.coverUrl,
                bio: user.bio,
                area: user.area,
                position: user.position,
                strongFoot: user.strongFoot,
                jerseyNumber: user.jerseyNumber,
            }
        });
    } catch (error) {
        console.error('[Login Error]', error);
        res.status(500).json({ message: "Lỗi đăng nhập!" });
    }
};

// ============================================================
// 📋 PART 1: LÀM MỚI ACCESS TOKEN (Silent Refresh)
// ============================================================
const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) return res.status(401).json({ message: "Không tìm thấy Refresh Token! Vui lòng đăng nhập lại." });

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Refresh Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại." });
        }

        const sessionKey = `user:session:${decoded.username}`;
        let session = null;

        // Part 4: Kiểm tra session trong Redis, fallback DynamoDB khi cache lỗi/miss
        const sessionRaw = await safeRedisGet(sessionKey);
        if (sessionRaw) {
            session = parseSession(sessionRaw, sessionKey);
            if (!session) {
                return res.status(401).json({ message: "Phiên đăng nhập lỗi, vui lòng đăng nhập lại." });
            }
        } else {
            const user = await UserRepo.findUserByUsername(decoded.username);
            if (!user) return res.status(401).json({ message: "Tài khoản không tồn tại!" });
            session = {
                sessionId: user.currentSessionId,
                status: user.status,
                role: user.role,
            };
            await safeRedisSetex(sessionKey, SESSION_TTL_SECONDS, buildSessionData(session.sessionId, session.status, session.role));
        }

        if (session.sessionId !== decoded.sessionId) {
            return res.status(401).json({ message: "Tài khoản vừa đăng nhập trên thiết bị khác! Vui lòng đăng nhập lại." });
        }
        if (session.status !== 'ACTIVE') {
            return res.status(403).json({ message: "Tài khoản đã bị khóa." });
        }

        // Gia hạn session Redis thêm 30 ngày (sliding window)
        await safeRedisExpire(sessionKey, SESSION_TTL_SECONDS);

        // Cấp Access Token mới
        const newAccessToken = jwt.sign(
            { username: decoded.username, role: decoded.role, sessionId: decoded.sessionId },
            JWT_ACCESS_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRES }
        );

        res.json({ accessToken: newAccessToken, expiresIn: 15 * 60 });
    } catch (error) {
        console.error('[RefreshToken Error]', error);
        res.status(500).json({ message: "Lỗi server khi làm mới Token!" });
    }
};

// ============================================================
// 📋 LẤY THÔNG TIN PROFILE
// ============================================================
const getProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserRepo.findUserByUsername(id);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng này!" });
        }

        res.json(serializePublicProfile(user, req.user));
    } catch (error) {
        console.error('[GetProfile Error]', error);
        res.status(500).json({ message: "Lỗi hệ thống khi lấy hồ sơ!" });
    }
};

// ============================================================
// 📋 LẤY PROFILE RIÊNG TƯ CỦA TÀI KHOẢN ĐANG ĐĂNG NHẬP
// ============================================================
const getMyProfile = async (req, res) => {
    try {
        const username = req.user?.username;
        const user = await UserRepo.findUserByUsername(username);
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại!" });
        }

        res.json(serializePrivateProfile(user));
    } catch (error) {
        console.error('[GetMyProfile Error]', error);
        res.status(500).json({ message: "Lỗi hệ thống khi lấy hồ sơ cá nhân!" });
    }
};

// ============================================================
// 📋 CẬP NHẬT PROFILE SOCIAL/FOOTBALL CỦA CHÍNH CHỦ
// ============================================================
const updateMyProfile = async (req, res) => {
    try {
        const username = req.user?.username;
        const { sanitized, errors } = sanitizeProfileUpdate(req.body || {});

        if (errors.length > 0) {
            return res.status(400).json({
                message: "Dữ liệu hồ sơ không hợp lệ.",
                errors,
            });
        }

        if (Object.keys(sanitized).length === 0) {
            return res.status(400).json({ message: "Không có thông tin hợp lệ để cập nhật." });
        }

        const result = await UserRepo.updateUserProfile(username, sanitized);
        const updatedUser = result.Attributes || await UserRepo.findUserByUsername(username);

        res.json({
            message: "Cập nhật hồ sơ thành công!",
            user: serializePrivateProfile(updatedUser),
            publicProfile: serializePublicProfile(updatedUser, req.user),
        });
    } catch (error) {
        console.error('[UpdateMyProfile Error]', error);
        res.status(500).json({ message: "Lỗi hệ thống khi cập nhật hồ sơ!" });
    }
};

// ============================================================
// 📋 UPLOAD ẢNH PROFILE: avatar, cover, photo gallery
// ============================================================
const uploadProfileImage = async (req, res) => {
    try {
        const username = req.user?.username;
        const { base64, filename, type = 'photo' } = req.body || {};

        if (!base64 || typeof base64 !== 'string') {
            return res.status(400).json({ message: "Thiếu dữ liệu ảnh base64." });
        }

        if (!PROFILE_IMAGE_TYPES.includes(type)) {
            return res.status(400).json({ message: "Loại ảnh không hợp lệ. Chỉ hỗ trợ avatar, cover hoặc photo." });
        }

        const folder = `profiles/${username}/${type}`;
        const url = await uploadBase64ToS3(base64, sanitizeImageFilename(filename), folder);
        const currentUser = await UserRepo.findUserByUsername(username);

        let profilePatch = {};
        if (type === 'avatar') {
            profilePatch = { avatarUrl: url };
        } else if (type === 'cover') {
            profilePatch = { coverUrl: url };
        } else {
            const photos = Array.isArray(currentUser?.photos) ? currentUser.photos : [];
            profilePatch = { photos: [url, ...photos].slice(0, 12) };
        }

        const result = await UserRepo.updateUserProfile(username, profilePatch);
        const updatedUser = result.Attributes || await UserRepo.findUserByUsername(username);

        res.json({
            message: "Upload ảnh hồ sơ thành công!",
            type,
            url,
            user: serializePrivateProfile(updatedUser),
            publicProfile: serializePublicProfile(updatedUser, req.user),
        });
    } catch (error) {
        console.error('[UploadProfileImage Error]', error);
        res.status(500).json({ message: "Lỗi hệ thống khi upload ảnh hồ sơ!" });
    }
};

// ============================================================
// 📋 PART 3a: QUÊN MẬT KHẨU (Gửi OTP khôi phục)
// ============================================================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Vui lòng nhập địa chỉ email!" });

        const user = await UserRepo.findUserByEmail(email);
        // Luôn trả về thành công để tránh lộ thông tin tài khoản (timing attack)
        if (!user) {
            return res.json({ message: "Nếu email này tồn tại trong hệ thống, chúng tôi đã gửi mã OTP đến đó." });
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ message: "Tài khoản của bạn không thể thực hiện thao tác này." });
        }

        const otp = generateOtp();
        await saveOtp(user.username, 'reset', otp);
        await sendPasswordResetOtp(email, otp, user.fullName);

        res.json({ message: "Nếu email này tồn tại trong hệ thống, chúng tôi đã gửi mã OTP đến đó.", username: user.username });
    } catch (error) {
        console.error('[ForgotPassword Error]', error);
        res.status(500).json({ message: "Lỗi server!" });
    }
};

// ============================================================
// 📋 PART 3b: ĐẶT LẠI MẬT KHẨU (Xác thực OTP và reset)
// ============================================================
const resetPassword = async (req, res) => {
    try {
        const { username, otp, newPassword } = req.body;
        if (!username || !otp || !newPassword) {
            return res.status(400).json({ message: "Thiếu thông tin (username, otp, newPassword)!" });
        }

        // Part 7: Kiểm tra mật khẩu mới
        if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
            return res.status(400).json({
                message: "Mật khẩu mới phải dài ít nhất 8 ký tự và bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
            });
        }

        const storedOtp = await getStoredOtp(username, 'reset');
        if (!storedOtp) return res.status(400).json({ message: "Mã OTP đã hết hạn (5 phút). Vui lòng yêu cầu gửi lại." });
        if (storedOtp !== otp) return res.status(400).json({ message: "Mã OTP không chính xác!" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await UserRepo.updateUserPassword(username, hashedPassword);

        // Xóa OTP đã dùng
        await clearOtp(username, 'reset');

        // Vô hiệu hóa tất cả session cũ (buộc đăng nhập lại trên tất cả thiết bị)
        await safeRedisDel(`user:session:${username}`);
        await UserRepo.updateUserSession(username, uuidv4());

        res.json({ message: "🎉 Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới." });
    } catch (error) {
        console.error('[ResetPassword Error]', error);
        res.status(500).json({ message: "Lỗi server!" });
    }
};

// ============================================================
// 📋 PART 3c: ĐỔI MẬT KHẨU (Khi đã đăng nhập)
// ============================================================
const changePassword = async (req, res) => {
    try {
        const { username } = req.user;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Vui lòng nhập mật khẩu cũ và mật khẩu mới!" });
        }

        // Part 7: Kiểm tra mật khẩu mới
        if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
            return res.status(400).json({
                message: "Mật khẩu mới phải dài ít nhất 8 ký tự và bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
            });
        }

        const user = await UserRepo.findUserByUsername(username);
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại!" });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Mật khẩu cũ không chính xác!" });

        if (oldPassword === newPassword) {
            return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu cũ!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await UserRepo.updateUserPassword(username, hashedPassword);

        // Vô hiệu hóa session trên các thiết bị khác, chỉ giữ lại session hiện tại
        const newSessionId = uuidv4();
        const sessionData = buildSessionData(newSessionId, 'ACTIVE', user.role);
        await safeRedisSetex(`user:session:${username}`, SESSION_TTL_SECONDS, sessionData);
        await UserRepo.updateUserSession(username, newSessionId);

        // Cấp lại token mới
        const tokenPayload = { username, role: user.role, sessionId: newSessionId };
        const { accessToken, refreshToken } = issueTokens(tokenPayload);
        setRefreshTokenCookie(res, refreshToken);

        res.json({ message: "✅ Đổi mật khẩu thành công!", accessToken, expiresIn: 15 * 60 });
    } catch (error) {
        console.error('[ChangePassword Error]', error);
        res.status(500).json({ message: "Lỗi server!" });
    }
};

// ============================================================
// 📋 ĐĂNG XUẤT (Xóa session và cookie)
// ============================================================
const logout = async (req, res) => {
    try {
        const { username } = req.user;
        // Xóa session khỏi Redis
        await safeRedisDel(`user:session:${username}`);
        // Đổi session DB để token cũ không sống lại khi Redis đang lỗi/miss
        await UserRepo.updateUserSession(username, uuidv4());
        // Xóa RefreshToken cookie
        const { maxAge, ...clearCookieOptions } = getRefreshTokenCookieOptions();
        res.clearCookie('refreshToken', clearCookieOptions);
        res.json({ message: "Đăng xuất thành công!" });
    } catch (error) {
        console.error('[Logout Error]', error);
        res.status(500).json({ message: "Lỗi server!" });
    }
};

module.exports = {
    register,
    verifyEmail,
    login,
    refreshToken,
    getProfile,
    getMyProfile,
    updateMyProfile,
    uploadProfileImage,
    forgotPassword,
    resetPassword,
    changePassword,
    logout,
};
