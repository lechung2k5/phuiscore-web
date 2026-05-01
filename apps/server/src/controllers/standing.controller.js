const { client, getHeaders } = require('../utils/httpClient');
const StandingRepo = require('../repositories/standing.repo');
const { mapSofaStandingToPhuiScore, formatCupTree } = require('../utils/standingMapper');

// 🔒 KHÓA ĐỒNG BỘ: Ngăn việc nhiều user cùng kích hoạt cào BXH của cùng 1 giải đấu
const standingLocks = new Map();

/**
 * Cào dữ liệu knockout của giải đấu trong MÙA HIỆN TẠI.
 */
async function fetchKnockoutData(tournamentId, seasonId) {
    try {
        const cuptreeUrl = `https://www.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/cuptree`;
        const cupRes = await client.get(cuptreeUrl, { headers: getHeaders() }).json().catch(() => null);

        if (cupRes?.cupTree && cupRes.cupTree.length > 0) {
            const koData = formatCupTree(cupRes.cupTree);
            if (koData && koData.length > 0) return koData;
        }
    } catch (e) {
        console.log(`[KO] ⚠️ CupTree thất bại: ${e.message}`);
    }

    return null;
}

const getStandings = async (req, res) => {
    const tournamentId = parseInt(req.params.tournamentId);
    
    if (isNaN(tournamentId)) {
        return res.status(400).json({ success: false, message: 'Invalid tournamentId' });
    }
    const forceRefresh = req.query.refresh === 'true';
    const lockKey = `${tournamentId}`;

    // 🛡️ KIỂM TRA KHÓA: Nếu giải này đang được cào BXH, hãy đợi kết quả
    if (standingLocks.has(lockKey)) {
        console.log(`[Standing] ⏳ Giải ${tournamentId} đang được cào bởi một yêu cầu khác. Đang đợi...`);
        try {
            const data = await standingLocks.get(lockKey);
            return res.status(200).json({ success: true, source: 'locked_wait', data });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Lỗi khi đợi dữ liệu BXH' });
        }
    }

    const standingPromise = (async () => {
        try {
            // 1. Thử lấy Season ID mùa hiện tại
            const seasonUrl = `https://www.sofascore.com/api/v1/unique-tournament/${tournamentId}/seasons`;
            const seasonRes = await client.get(seasonUrl, { headers: getHeaders() }).json().catch(() => null);
            const latestSeason = seasonRes?.seasons?.[0];
            const seasonId = latestSeason?.id;

            // 2. Check Database trước (Nếu có seasonId)
            let cache = null;
            if (seasonId) {
                cache = await StandingRepo.getStandings(tournamentId, seasonId);
            } else {
                cache = await StandingRepo.getLatestStandings(tournamentId);
            }

            if (cache && Array.isArray(cache.standings) && !forceRefresh) {
                // 🧠 Smart TTL: Nếu có trận đang đá (inprogress), chỉ cache 1 phút. Nếu không thì 5 phút.
                const hasLiveMatches = cache.knockoutData?.some(round => 
                    round.matches?.some(m => m.status === 'inprogress')
                ) || cache.standings?.[0]?.rows?.some(r => r.isLive);

                const CACHE_TTL = hasLiveMatches ? (1 * 60 * 1000) : (5 * 60 * 1000);
                const isStale = !cache.lastUpdated || (Date.now() - cache.lastUpdated > CACHE_TTL);
                
                // Kiểm tra Phong độ
                const hasForm = cache.standings[0]?.rows?.some(r => r.form && r.form.length > 0);
                
                if (!isStale && (hasForm || cache.knockoutData)) {
                    console.log(`[Standing] ✅ Giải ${tournamentId} (${hasLiveMatches ? 'LIVE' : 'Stable'}): Dữ liệu vẫn còn mới.`);
                    return cache;
                }
                
                const reason = isStale ? "hết hạn" : "cần cập nhật";
                console.log(`[Standing] ⚠️ Giải ${tournamentId} bị ${reason}. Đang yêu cầu cập nhật gấp...`);
            }

            // 3. Nếu thiếu, cũ hoặc không có Phong độ -> Phát lệnh cào qua Socket
            const initialLastUpdated = cache?.lastUpdated || 0;
            console.log(`[Standing] 📊 Yêu cầu Crawler làm mới BXH giải ${tournamentId}...`);
            if (global.io) {
                global.io.emit('requestStandings', { tournamentId, seasonId });
            }

            // 4. VÒNG LẶP ĐỢI DỮ LIỆU MỚI (Đợi tối đa 20 giây)
            let attempts = 0;
            while (attempts < 40) {
                await new Promise(r => setTimeout(r, 500));
                
                const updated = await StandingRepo.getLatestStandings(tournamentId);
                
                // ĐIỀU KIỆN: Chỉ cần thấy bản ghi mới hơn là trả về luôn
                if (updated && updated.lastUpdated > initialLastUpdated) {
                    console.log(`[Standing] ⚡ Đã nhận được bản cập nhật mới cho giải ${tournamentId}!`);
                    return updated;
                }
                attempts++;
            }

            return cache || { success: false, message: "Đang cào dữ liệu, vui lòng quay lại sau" };

        } catch (error) {
            console.error('[Standing] ❌ Lỗi lấy BXH:', error.message);
            throw error;
        } finally {
            standingLocks.delete(lockKey);
        }
    })();

    // Lưu promise vào khóa và trả về kết quả cho user
    standingLocks.set(lockKey, standingPromise);

    try {
        const data = await standingPromise;
        if (data) {
            console.log(`[API] 📤 Trả về BXH giải ${tournamentId}: ${data.standings?.length || 0} bảng, Knockout: ${data.knockoutData ? 'CÓ' : 'KHÔNG'}`);
        }
        res.status(200).json({ success: true, source: 'live_api', data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getStandings };