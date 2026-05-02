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
                // 🧠 Smart TTL: Live: 1p, Stable: 10p
                const hasLiveMatches = cache.knockoutData?.some(round => 
                    round.matches?.some(m => m.status === 'inprogress')
                ) || cache.standings?.[0]?.rows?.some(r => r.isLive);

                const CACHE_TTL = hasLiveMatches ? (1 * 60 * 1000) : (10 * 60 * 1000);
                const isStale = !cache.lastUpdated || (Date.now() - cache.lastUpdated > CACHE_TTL);
                
                // Trả về ngay nếu còn mới
                if (!isStale) {
                    console.log(`[Standing] ✅ Giải ${tournamentId}: Cache HIT.`);
                    return cache;
                }

                // 🚀 STALE-WHILE-REVALIDATE: 
                // Nếu cũ, trả về bản cũ NGAY LẬP TỨC và kích hoạt cào ngầm
                console.log(`[Standing] 🔄 Giải ${tournamentId} đã cũ. Trả về cache và cập nhật ngầm...`);
                if (global.io) {
                    global.io.emit('requestStandings', { tournamentId, seasonId });
                }
                return cache;
            }

            // 3. Trường hợp chưa bao giờ có dữ liệu
            console.log(`[Standing] 📊 Dữ liệu mới hoàn toàn cho giải ${tournamentId}. Kích hoạt cào...`);
            if (global.io) {
                global.io.emit('requestStandings', { tournamentId, seasonId });
            }

            // Đợi tối đa 2.5s cho lần đầu tiên (để đảm bảo < 3s)
            let attempts = 0;
            while (attempts < 5) {
                await new Promise(r => setTimeout(r, 500));
                const updated = await StandingRepo.getLatestStandings(tournamentId);
                if (updated) return updated;
                attempts++;
            }

            return { success: false, message: "Đang cào dữ liệu, vui lòng quay lại sau" };

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