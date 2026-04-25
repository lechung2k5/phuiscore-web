const axios = require('axios');
const MatchRepo = require('../repositories/match.repo');

const { translateStatName } = require('./translator');

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

const fetchDetailedData = async (m) => {
    const matchId = m.id;
    const homeId = m.homeTeam.id;
    const awayId = m.awayTeam.id;
    const tournamentId = m.tournamentId;
    const seasonId = m.seasonId;
    const baseUrl = `https://www.sofascore.com/api/v1/event/${matchId}`;
    const headers = { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.sofascore.com/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    };

    try {
        console.log(`[Crawler] 📊 Lấy thông số chi tiết cho trận: ${matchId}`);
        
        const [statsRes, incidentsRes, lineupsRes, h2hRes, h2hEventsRes, homeNextRes, awayNextRes] = await Promise.all([
            axios.get(`${baseUrl}/statistics`, { headers }).catch(() => null),
            axios.get(`${baseUrl}/incidents`, { headers }).catch(() => null),
            axios.get(`${baseUrl}/lineups`, { headers }).catch(() => null),
            axios.get(`${baseUrl}/h2h`, { headers }).catch(() => null),
            axios.get(`${baseUrl}/h2h/events`, { headers }).catch(() => null),
            axios.get(`https://www.sofascore.com/api/v1/team/${homeId}/events/next/0`, { headers }).catch(() => null),
            axios.get(`https://www.sofascore.com/api/v1/team/${awayId}/events/next/0`, { headers }).catch(() => null)
        ]);

        // Map H2H data
        const h2hSummary = h2hRes?.data?.teamDuel;
        const h2hEvents = h2hEventsRes?.data?.events || [];
        const h2hMapped = h2hSummary ? {
            teamWins: {
                home: h2hSummary.homeWins || 0,
                away: h2hSummary.awayWins || 0
            },
            draws: h2hSummary.draws || 0,
            matches: h2hEvents
        } : null;

        // Standings fetch with fallback
        let standingsData = null;
        try {
            const standingsFull = await axios.get(`${baseUrl}/standings/full`, { headers });
            standingsData = standingsFull.data;
        } catch (e) {
            try {
                const standingsBasic = await axios.get(`${baseUrl}/standings`, { headers });
                standingsData = standingsBasic.data;
            } catch (e2) {
                // Try tournament-based if we have the IDs, or fetch them if missing
                let tId = tournamentId;
                let sId = seasonId;

                if (!tId || !sId) {
                    try {
                        const eventRes = await axios.get(baseUrl, { headers });
                        tId = eventRes.data?.event?.tournament?.uniqueTournament?.id;
                        sId = eventRes.data?.event?.season?.id;
                    } catch (err) { }
                }

                if (tId && sId) {
                    try {
                        const tournamentStandings = await axios.get(`https://www.sofascore.com/api/v1/unique-tournament/${tId}/season/${sId}/standings/total`, { headers });
                        standingsData = tournamentStandings.data;
                    } catch (e3) {
                        console.log(`[Crawler] ❌ Không thể lấy BXH cho tournament ${tId} season ${sId}`);
                    }
                }
            }
        }

        const { translateStats } = require('./translator');
        const translatedStats = translateStats(statsRes?.data?.statistics);

        return {
            statistics: translatedStats || [],
            incidents: incidentsRes?.data?.incidents || [],
            lineups: lineupsRes?.data || null,
            h2h: h2hMapped,
            standings: standingsData || null,
            nextMatches: {
                home: homeNextRes?.data?.events || [],
                away: awayNextRes?.data?.events || []
            }
        };
    } catch (err) {
        console.error(`[Crawler Detail Error] ${matchId}:`, err.message);
        return null;
    }
};

const crawlByDate = async (date) => {
    const url = `https://www.sofascore.com/api/v1/sport/football/scheduled-events/${date}`;
    try {
        console.log(`[Crawler] ⚽ Đang cào dữ liệu cho ngày: ${date}`);
        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.sofascore.com/',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        const rawEvents = response.data.events || [];
        if (rawEvents.length === 0) return [];

        const cleanMatches = [];
        
        for (const m of rawEvents) {
            const currentMin = calculateMinute(m);
            const isLive = m.status.type === 'inprogress';
            
            const matchData = {
                id: m.id,
                dateString: date,
                tournamentId: m.tournament.uniqueTournament?.id || 0,
                tournamentName: m.tournament.uniqueTournament?.name || "Giải đấu khác",
                tournamentLogo: m.tournament.uniqueTournament?.id 
                    ? `https://api.sofascore.app/api/v1/unique-tournament/${m.tournament.uniqueTournament.id}/image`
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
                time: m.time, // Save raw SofaScore timing data for frontend clock
                // Info tab fields
                info: {
                    round: m.roundInfo?.round || "",
                    roundName: m.roundInfo?.name || "",
                    cupRoundType: m.roundInfo?.cupRoundType || null,
                    venue: m.venue?.name || "",
                    referee: m.referee?.name || ""
                },
                seasonId: m.season?.id || 0
            };

            // Không tự động cào chi tiết cho tất cả các trận để tiết kiệm dữ liệu
            // Dữ liệu chi tiết sẽ được cào "on-demand" khi người dùng nhấn vào xem trận đấu
            if (isLive) {
                const detailed = await fetchDetailedData(m);
                if (detailed) {
                    Object.assign(matchData, detailed);
                }
                await new Promise(r => setTimeout(r, 500));
            }

            cleanMatches.push(matchData);
        }

        // Ghi vào DynamoDB
        await MatchRepo.saveMatchesBatch(cleanMatches);
        console.log(`[Crawler] ✅ Đã cập nhật ${cleanMatches.length} trận vào DB.`);
        
        return cleanMatches;
    } catch (error) {
        console.error(`[Crawler Error] ❌ Lỗi ngày ${date}:`, error.message);
        return [];
    }
};

module.exports = { crawlByDate, fetchDetailedData };