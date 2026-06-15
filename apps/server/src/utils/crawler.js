const { client, getHeaders } = require('./httpClient');
const MatchRepo = require('../repositories/match.repo');

const { translateStatName } = require('./translator');

// 🔒 KHÓA ĐỒNG BỘ: Ngăn việc nhiều user cùng kích hoạt cào 1 ngày cùng lúc
const crawlingLocks = new Map();

/**
 * Hàm tính phút thực tế dựa trên dữ liệu từ SofaScore
 */
const calculateMinute = (match) => {
    const status = match.status;
    const time = match.time;

    // 1. Trận chưa đá hoặc đã xong -> Hiện trạng thái mô tả (Ví dụ: FT, Postponed)
    if (status.type !== 'inprogress') return status.description || "";
    
    // 2. Nghỉ giữa hiệp
    if (status.code === 31) return "HT";

    // 3. Nếu đang đá nhưng thiếu timestamp để tính toán -> Hiện "Live"
    if (!time || !time.currentPeriodStartTimestamp) {
        return "Live";
    }

    // 4. Công thức tính: (Hiện tại - Lúc bắt đầu hiệp) + số giây đã đá hiệp trước
    const now = Math.floor(Date.now() / 1000);
    const elapsedSeconds = (now - time.currentPeriodStartTimestamp) + (time.initial || 0);
    const minutes = Math.floor(elapsedSeconds / 60);

    // 5. Xử lý bù giờ
    if (status.code === 6 && minutes > 45) return "45+";
    if (status.code === 7 && minutes > 90) return "90+";

    return minutes > 0 ? `${minutes}'` : "1'";
};

// Sử dụng client và headers từ httpClient.js dùng chung

const fetchDetailedData = async (m) => {
    const matchId = m.id;
    const homeId = m.homeTeam?.id || m.homeId;
    const awayId = m.awayTeam?.id || m.awayId;
    let tId = m.tournamentId;
    let sId = m.seasonId;
    const baseUrl = `https://www.sofascore.com/api/v1/event/${matchId}`;

    // Nếu thiếu ID giải hoặc mùa, phải lấy thông tin event gốc trước
    if (!tId || !sId) {
        try {
            const eventRes = await client.get(baseUrl, { headers: getHeaders() }).json();
            tId = eventRes.event?.tournament?.uniqueTournament?.id || eventRes.event?.tournament?.id;
            sId = eventRes.event?.season?.id;
            console.log(`[Detail] 🔄 IDs recovery: tId=${tId}, sId=${sId}`);
        } catch (e) {
            console.error(`[Detail] ❌ IDs recovery failed for ${matchId}`);
        }
    }

    console.log(`[Crawler] 📊 Detailed data for: ${matchId}`);
    
    // 🚀 PHÁT TRIỂN SONG SONG: Lấy tất cả dữ liệu cùng lúc thay vì đợi tuần tự
    const [
        statsRes, incidentsRes, lineupsRes, h2hRes, h2hEventsRes, 
        homeNextRes, awayNextRes
    ] = await Promise.all([
        client.get(`${baseUrl}/statistics`, { headers: getHeaders() }).json().catch(() => null),
        client.get(`${baseUrl}/incidents`, { headers: getHeaders() }).json().catch(() => null),
        client.get(`${baseUrl}/lineups`, { headers: getHeaders() }).json().catch(() => null),
        client.get(`${baseUrl}/h2h`, { headers: getHeaders() }).json().catch(() => null),
        client.get(`${baseUrl}/h2h/events`, { headers: getHeaders() }).json().catch(() => null),
        homeId ? client.get(`https://www.sofascore.com/api/v1/team/${homeId}/events/next/0`, { headers: getHeaders() }).json().catch(() => null) : Promise.resolve(null),
        awayId ? client.get(`https://www.sofascore.com/api/v1/team/${awayId}/events/next/0`, { headers: getHeaders() }).json().catch(() => null) : Promise.resolve(null)
    ]);

    // Lấy standings (vẫn để sau vì cần tId/sId từ bước trên nếu có recovery)
    let standingsData = null;
    if (tId && sId) {
        standingsData = await client.get(`https://www.sofascore.com/api/v1/unique-tournament/${tId}/season/${sId}/standings/total`, { headers: getHeaders() }).json().catch(() => null);
        if (!standingsData) {
            standingsData = await client.get(`${baseUrl}/standings`, { headers: getHeaders() }).json().catch(() => null);
        }
    }

    // Map H2H data
    const h2hSummary = h2hRes?.teamDuel;
    const h2hEvents = h2hEventsRes?.events || [];
    const h2hMapped = h2hSummary ? {
        teamWins: {
            home: h2hSummary.homeWins || 0,
            away: h2hSummary.awayWins || 0
        },
        draws: h2hSummary.draws || 0,
        matches: h2hEvents
    } : null;

    const { translateStats } = require('./translator');
    const rawStats = statsRes?.statistics;
    const translatedStats = rawStats ? translateStats(rawStats) : [];

    return {
        statistics: translatedStats,
        incidents: incidentsRes?.incidents || [],
        lineups: lineupsRes || null,
        h2h: h2hMapped,
        standings: standingsData || null,
        nextMatches: {
            home: homeNextRes?.events || [],
            away: awayNextRes?.events || []
        }
    };
};

const crawlByDate = async (date) => {
    // 🛡️ KIỂM TRA KHÓA: Nếu ngày này đang được cào, hãy đợi thay vì cào mới
    if (crawlingLocks.has(date)) {
        console.log(`[Crawler] ⏳ Ngày ${date} đang được cào bởi một yêu cầu khác. Đang đợi...`);
        return crawlingLocks.get(date);
    }

    const crawlPromise = (async () => {
        const url = `https://www.sofascore.com/api/v1/sport/football/scheduled-events/${date}`;
        const isToday = date === new Date().toISOString().split('T')[0];
        const logPrefix = isToday ? "[Crawler]" : "[GẤP]";

        try {
            console.log(`${logPrefix} ⚽ Đang cào dữ liệu cho ngày: ${date}`);
            const response = await client.get(url, { headers: getHeaders() }).json();

        const rawEvents = response.events || [];
        if (rawEvents.length === 0) {
            console.log(`${logPrefix} ℹ️ Ngày ${date} rỗng. Response từ SofaScore:`, JSON.stringify(response).substring(0, 200));
            return [];
        }

        const cleanMatches = [];
        
        for (const m of rawEvents) {
            // CHỈ CÀO GIẢI FIFA WORLD CUP (ID: 16)
            if (m.tournament.uniqueTournament?.id !== 16) {
                continue;
            }

            const currentMin = calculateMinute(m);
            
            const matchData = {
                id: m.id,
                dateString: date,
                tournamentId: m.tournament.uniqueTournament?.id || m.tournament?.id || 0,
                tournamentName: m.tournament.uniqueTournament?.name || m.tournament?.name || "Giải đấu khác",
                tournamentLogo: (m.tournament.uniqueTournament?.id || m.tournament?.id)
                    ? `https://api.sofascore.app/api/v1/${m.tournament.uniqueTournament?.id ? 'unique-tournament' : 'tournament'}/${m.tournament.uniqueTournament?.id || m.tournament?.id}/image`
                    : "https://www.sofascore.com/static/images/placeholders/tournament.png",
                homeTeam: {
                    id: m.homeTeam.id,
                    name: m.homeTeam.name,
                    logo: `https://api.sofascore.app/api/v1/team/${m.homeTeam.id}/image`
                },
                awayTeam: {
                    id: m.awayTeam.id,
                    name: m.awayTeam.name,
                    logo: `https://api.sofascore.app/api/v1/team/${m.awayTeam.id}/image`
                },
                score: {
                    home: m.homeScore?.current ?? 0,
                    away: m.awayScore?.current ?? 0
                },
                status: m.status.type,
                currentMinute: currentMin,
                startTimestamp: m.startTimestamp,
                time: m.time,
                info: {
                    round: m.roundInfo?.round || "",
                    roundName: m.roundInfo?.name || "",
                    venue: m.venue?.name || "",
                    referee: m.referee?.name || ""
                },
                seasonId: m.season?.id || 0
            };

            // 🔥 TỐI ƯU SIÊU TỐC: Bỏ qua fetchDetailedData ở đây.
            // Chi tiết trận đấu (Stats/Lineups) sẽ được cào khi user click vào từng trận.
            cleanMatches.push(matchData);
        }

        // Ghi vào DynamoDB
        await MatchRepo.saveMatchesBatch(cleanMatches);

        // 🔥 PHÁT SỰ KIỆN REAL-TIME QUA SOCKET.IO
        if (global.io) {
            global.io.emit('matchUpdate', { matches: cleanMatches });
        }

        console.log(`${logPrefix} ✅ Đã cập nhật ${cleanMatches.length} trận vào DB.`);
        console.log(`${logPrefix} 🏁 Hoàn tất xử lý ngày: ${date}`);
        
        return cleanMatches;
    } catch (error) {
            console.error(`[Crawler Error] ❌ Lỗi ngày ${date}:`, error.message);
            return [];
        } finally {
            // Giải phóng khóa sau khi xong (hoặc lỗi)
            crawlingLocks.delete(date);
        }
    })();

    // Lưu promise vào khóa
    crawlingLocks.set(date, crawlPromise);
    return crawlPromise;
};

module.exports = { crawlByDate, fetchDetailedData };