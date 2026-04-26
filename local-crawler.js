const axios = require('axios');

// Cấu hình
const SERVER_URL = 'https://phuiscore-web.onrender.com/api/sync/matches'; 
const SYNC_TOKEN = 'phuiscore_secret_2026'; 
const REFRESH_INTERVAL = 30 * 1000; // 30 giây chạy lại một lần

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
    console.log(`[Local Crawler] ⚽ Đang lấy dữ liệu ngày: ${date}...`);
    
    try {
        const response = await axios.get(url, { headers });
        const rawEvents = response.data.events || [];
        
        if (rawEvents.length === 0) return;

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
                // Đổi link logo sang định dạng static để tránh bị chặn
                logo: `https://www.sofascore.com/api/v1/team/${m.homeTeam.id}/image`
            },
            awayTeam: {
                id: m.awayTeam.id,
                name: m.awayTeam.name,
                logo: `https://www.sofascore.com/api/v1/team/${m.awayTeam.id}/image`
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

        const syncRes = await axios.post(SERVER_URL, {
            token: SYNC_TOKEN,
            matches: matches
        });

        if (syncRes.data.success) {
            console.log(`[Local Crawler] ✅ ĐỒNG BỘ THÀNH CÔNG cho ngày ${date}!`);
        }
    } catch (err) {
        console.error(`[Local Crawler Error] ❌ Lỗi:`, err.message);
    }
}

async function start() {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 BẮT ĐẦU CHU KỲ CẬP NHẬT: ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(50));

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    await crawlAndSync(yesterday);
    await crawlAndSync(today);
    await crawlAndSync(tomorrow);
    
    console.log(`\n💤 Đã xong chu kỳ. Sẽ chạy lại sau 5 phút...`);
    console.log('Nhấn Ctrl+C nếu muốn dừng lại.');
}

// Chạy lần đầu tiên
start().then(() => {
    // Nếu chạy trên GitHub Actions (CI), thì thoát luôn sau khi xong
    if (process.env.GITHUB_ACTIONS) {
        console.log('\n[Local Crawler] Chạy xong trên GitHub. Thoát.');
        process.exit(0);
    } else {
        // Nếu chạy ở máy nhà, thì lặp lại sau mỗi 5 phút
        console.log(`\n💤 Đã xong chu kỳ. Sẽ chạy lại sau 5 phút...`);
        setInterval(start, REFRESH_INTERVAL);
    }
});
