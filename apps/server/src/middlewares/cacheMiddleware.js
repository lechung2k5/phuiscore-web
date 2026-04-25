const NodeCache = require('node-cache');

// Cache chính: stdTTL = mặc định 30s, checkperiod = 60s dọn dẹp
const apiCache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

/**
 * Middleware cache HTTP response.
 * @param {number} duration - Thời gian cache (giây)
 */
const cacheResponse = (duration) => {
    return (req, res, next) => {
        // Chỉ cache GET requests
        if (req.method !== 'GET') return next();

        const key = `__express__${req.originalUrl || req.url}`;
        const cachedResponse = apiCache.get(key);

        if (cachedResponse) {
            // Cache hit — trả về ngay lập tức
            return res.json(cachedResponse);
        }

        // Cache miss — override res.json để bắt response
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            // Chỉ cache response thành công
            if (res.statusCode >= 200 && res.statusCode < 300) {
                apiCache.set(key, body, duration);
            }
            return originalJson(body);
        };

        next();
    };
};

/**
 * Xóa cache theo pattern (Dùng khi mutate data)
 * @param {string} pattern - Prefix của key cần xóa
 */
const invalidateCache = (pattern) => {
    const keys = apiCache.keys();
    const matchingKeys = keys.filter(k => k.includes(pattern));
    if (matchingKeys.length > 0) {
        apiCache.del(matchingKeys);
    }
};

module.exports = { cacheResponse, invalidateCache, apiCache };
