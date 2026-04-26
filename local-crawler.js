const axios = require('axios');

// Cấu hình
const SERVER_URL = 'https://phuiscore-web.onrender.com/api/sync/matches'; // Link Render của bạn
const SYNC_TOKEN = 'phuiscore_secret_2026'; // Mật mã phải khớp với server

const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.sofascore.com/',
};

const calculateMinute = (match) => {
    const status = match.status;
    const time = match.time;
    if (status.type !== 'inprogress') return status.description || "";
    if (status.code === 31) return "HT";
    if (!time || !time.currentPeriodStartTimestamp) return "Live";
    const now = Math.floor(Date.now() / 1000);
    const elapsedSeconds = (now - time.currentPeriodStartTimestamp) + (time.initial || 0);
    const minutes = Math.floor(elapsedSeconds / 60);
    if (status.code === 6 && minutes > 45) return "45+";
    if (status.code === 7 && minutes > 90) return "90+";
    return minutes > 0 ? `${minutes}'` : "1'";
};

async function crawlAndSync(date) {
    const url = `https://www.sofascore.com/api/v1/sport/football/scheduled-events/${date}`;
    console.log(`\n[Local Crawler] ⚽ Đang lấy dữ liệu ngày: ${date}...`);
    
    try {
        const response = await axios.get(url, { headers });
        const rawEvents = response.data.events || [];
        
        if (rawEvents.length === 0) {
            console.log(`[Local Crawler] ℹ Không có trận đấu nào.`);
            return;
        }

        const matches = rawEvents.map(m => ({
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
            currentMinute: calculateMinute(m),
            startTimestamp: m.startTimestamp,
            time: m.time,
            info: {
                round: m.roundInfo?.round || "",
                venue: m.venue?.name || "",
                referee: m.referee?.name || ""
            }
        }));

        console.log(`[Local Crawler] 🚀 Đang gửi ${matches.length} trận lên Render...`);
        
        const syncRes = await axios.post(SERVER_URL, {
            token: SYNC_TOKEN,
            matches: matches
        });

        if (syncRes.data.success) {
            console.log(`[Local Crawler] ✅ ĐỒNG BỘ THÀNH CÔNG! Server đã nhận ${syncRes.data.count} trận.`);
        }
    } catch (err) {
        console.error(`[Local Crawler Error] ❌ Lỗi:`, err.message);
        if (err.response) {
            console.error('Response Error:', err.response.data);
        }
    }
}

// Chạy cào cho hôm nay, hôm qua và ngày mai
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

async function start() {
    await crawlAndSync(yesterday);
    await crawlAndSync(today);
    await crawlAndSync(tomorrow);
    console.log('\n[Local Crawler] Done! Nhấn Ctrl+C để thoát.');
}

start();
