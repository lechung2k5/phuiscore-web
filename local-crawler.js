require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const io = require('socket.io-client');

puppeteer.use(StealthPlugin());

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const SYNC_TOKEN = process.env.SYNC_TOKEN || 'phuiscore_secret_2026';

const socket = io(SERVER_URL);

// 🚀 GLOBAL BROWSER INSTANCE FOR SPEED
let sharedBrowser = null;
async function getBrowser() {
    try {
        if (sharedBrowser && sharedBrowser.isConnected()) return sharedBrowser;
        
        if (sharedBrowser) {
            console.log('[Puppeteer] 🔄 Trình duyệt cũ bị ngắt kết nối, đang khởi động lại...');
            await sharedBrowser.close().catch(() => {});
        }

        sharedBrowser = await puppeteer.launch({ 
            headless: "new", 
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process'
            ] 
        });
        
        sharedBrowser.on('disconnected', () => {
            console.warn('[Puppeteer] ⚠️ Trình duyệt đã bị đóng/ngắt kết nối!');
            sharedBrowser = null;
        });

        return sharedBrowser;
    } catch (err) {
        console.error('[Puppeteer Error] ❌ Không thể khởi động trình duyệt:', err.message);
        sharedBrowser = null;
        throw err;
    }
}

// 🚀 OPTIMIZED PAGE CREATION (Block assets)
async function createFastPage(browser) {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
            req.abort();
        } else {
            req.continue();
        }
    });
    return page;
}

socket.on('connect', () => {
    console.log('[Socket] 🔌 Đã kết nối. Sẵn sàng cào dữ liệu tốc độ cao!');
});

// 🔔 LẮNG NGHE LỆNH 1: Cào danh sách trận đấu
socket.on('requestMatches', async (data) => {
    console.log(`[Socket] ⚽ Yêu cầu cào ngày: ${data.date}`);
    await crawlAndSync(data.date);
});

// 🔔 LẮNG NGHE LỆNH 2: Cào chi tiết trận đấu (BXH thu nhỏ)
socket.on('requestDetail', async (data) => {
    const { matchId, date } = data;
    console.log(`[Socket] 📊 Yêu cầu chi tiết trận: ${matchId}`);
    await crawlAndSyncDetail(matchId, date);
});

// 🔔 LẮNG NGHE LỆNH 3: Cào Bảng xếp hạng của một giải đấu
socket.on('requestStandings', async (data) => {
    const { tournamentId, seasonId } = data;
    console.log(`[Socket] 🏆 Yêu cầu BXH giải: ${tournamentId}, Mùa: ${seasonId}`);
    await crawlAndSyncStandings(tournamentId, seasonId);
});

/**
 * Hàm tính phút thực tế dựa trên dữ liệu từ SofaScore
 */
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

/**
 * HELPER: Lấy JSON từ SofaScore bằng Page có sẵn
 */
async function fetchSofaJson(url, page) {
    try {
        console.log(`[Puppeteer] 🔍 Đang truy cập: ${url}`);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'x-sofascore-client': 'web',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
        });
        // Rút ngắn thời gian chờ xuống domcontentloaded thay vì networkidle2
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!response) throw new Error("Không nhận được phản hồi");
        
        // Đợi một chút để JSON kịp render nếu cần (thường JSON API là tức thì)
        const content = await page.evaluate(() => document.body.innerText);
        return JSON.parse(content);
    } catch (err) {
        console.error(`[Puppeteer Error] ❌ Lỗi ${url}: ${err.message}`);
        return null;
    }
}

async function crawlAndSync(date) {
    const browser = await getBrowser();
    const page = await createFastPage(browser);
    try {
        const url = `https://www.sofascore.com/api/v1/sport/football/scheduled-events/${date}`;
        const data = await fetchSofaJson(url, page);
        if (!data) return;

        const matches = (data.events || []).map(m => ({
            id: m.id,
            dateString: date,
            tournamentId: m.tournament?.uniqueTournament?.id || m.tournament?.id,
            tournamentName: m.tournament?.uniqueTournament?.name || m.tournament?.name,
            tournamentLogo: (m.tournament?.uniqueTournament?.id || m.tournament?.id)
                ? `https://api.sofascore.app/api/v1/${m.tournament?.uniqueTournament?.id ? 'unique-tournament' : 'tournament'}/${m.tournament?.uniqueTournament?.id || m.tournament?.id}/image`
                : null,
            homeTeam: { 
                id: m.homeTeam?.id, 
                name: m.homeTeam?.name,
                logo: `https://api.sofascore.app/api/v1/team/${m.homeTeam?.id}/image`
            },
            awayTeam: { 
                id: m.awayTeam?.id, 
                name: m.awayTeam?.name,
                logo: `https://api.sofascore.app/api/v1/team/${m.awayTeam?.id}/image`
            },
            score: { 
                home: m.homeScore?.current ?? 0, 
                away: m.awayScore?.current ?? 0,
                period1: m.homeScore?.period1 !== undefined ? { home: m.homeScore.period1, away: m.awayScore.period1 } : null,
                period2: m.homeScore?.period2 !== undefined ? { home: m.homeScore.period2, away: m.awayScore.period2 } : null
            },
            status: m.status?.type,
            currentMinute: calculateMinute(m),
            startTimestamp: m.startTimestamp,
            time: m.time,
            info: {
                round: m.roundInfo?.round || "",
                roundName: m.roundInfo?.name || "",
                venue: m.venue?.name || "",
                referee: m.referee?.name || ""
            },
            seasonId: m.season?.id || 0
        }));

        await axios.post(`${SERVER_URL}/api/sync/matches`, { token: SYNC_TOKEN, matches });
        console.log(`[Local Crawler] ✅ Đã đồng bộ ${matches.length} trận ngày ${date}`);
    } catch (err) { console.error(`[Error Sync] ${err.message}`); }
    finally { await page.close(); }
}

async function crawlLive() {
    console.log("[Local Crawler] 🔴 Đang cào các trận LIVE...");
    const browser = await getBrowser();
    const page = await createFastPage(browser);
    try {
        const url = `https://www.sofascore.com/api/v1/sport/football/events/live`;
        const data = await fetchSofaJson(url, page);
        if (!data || !data.events) return;

        const date = new Date().toISOString().split('T')[0];
        const matches = data.events.map(m => ({
            id: m.id,
            dateString: date,
            tournamentId: m.tournament?.uniqueTournament?.id || m.tournament?.id,
            tournamentName: m.tournament?.uniqueTournament?.name || m.tournament?.name,
            tournamentLogo: (m.tournament?.uniqueTournament?.id || m.tournament?.id)
                ? `https://api.sofascore.app/api/v1/${m.tournament?.uniqueTournament?.id ? 'unique-tournament' : 'tournament'}/${m.tournament?.uniqueTournament?.id || m.tournament?.id}/image`
                : null,
            homeTeam: { 
                id: m.homeTeam?.id, 
                name: m.homeTeam?.name,
                logo: `https://api.sofascore.app/api/v1/team/${m.homeTeam?.id}/image`
            },
            awayTeam: { 
                id: m.awayTeam?.id, 
                name: m.awayTeam?.name,
                logo: `https://api.sofascore.app/api/v1/team/${m.awayTeam?.id}/image`
            },
            score: { 
                home: m.homeScore?.current ?? 0, 
                away: m.awayScore?.current ?? 0,
                period1: m.homeScore?.period1 !== undefined ? { home: m.homeScore.period1, away: m.awayScore.period1 } : null,
                period2: m.homeScore?.period2 !== undefined ? { home: m.homeScore.period2, away: m.awayScore.period2 } : null
            },
            status: m.status?.type,
            currentMinute: calculateMinute(m),
            startTimestamp: m.startTimestamp,
            time: m.time,
            info: {
                round: m.roundInfo?.round || "",
                roundName: m.roundInfo?.name || "",
                venue: m.venue?.name || "",
                referee: m.referee?.name || ""
            },
            seasonId: m.season?.id || 0
        }));

        await axios.post(`${SERVER_URL}/api/sync/matches`, { token: SYNC_TOKEN, matches });
        console.log(`[Local Crawler] ⚡ Đã cập nhật ${matches.length} trận LIVE.`);
    } catch (err) { console.error(`[Error Live Sync] ${err.message}`); }
    finally { await page.close(); }
}

async function crawlAndSyncDetail(matchId, date) {
    const browser = await getBrowser();
    const page = await createFastPage(browser);
    try {
        const baseUrl = `https://www.sofascore.com/api/v1/event/${matchId}`;
        console.log(`[Local Crawler] 🚀 Turbo-fetching chi tiết trận ${matchId}...`);
        
        // Truy cập page gốc trước để lấy context
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // ⚡ TURBO MODE: Chạy fetch trực tiếp trong browser context
        const allData = await page.evaluate(async (matchId) => {
            const fetchJson = (url) => fetch(url).then(r => r.json()).catch(() => null);
            const base = `https://www.sofascore.com/api/v1/event/${matchId}`;
            
            // Lấy basic info trước
            const eventData = await fetchJson(base);
            if (!eventData?.event) return null;

            const homeId = eventData.event.homeTeam?.id;
            const awayId = eventData.event.awayTeam?.id;

            // Fetch tất cả các phần còn lại song song
            const [stats, incs, lines, h2hS, h2hE, homeN, awayN] = await Promise.all([
                fetchJson(`${base}/statistics`),
                fetchJson(`${base}/incidents`),
                fetchJson(`${base}/lineups`),
                fetchJson(`${base}/h2h`),
                fetchJson(`${base}/h2h/events`),
                homeId ? fetchJson(`https://www.sofascore.com/api/v1/team/${homeId}/events/next/0`) : Promise.resolve(null),
                awayId ? fetchJson(`https://www.sofascore.com/api/v1/team/${awayId}/events/next/0`) : Promise.resolve(null)
            ]);

            return { eventData, stats, incs, lines, h2hS, h2hE, homeN, awayN };
        }, matchId);

        if (!allData) return;

        const { eventData, stats, incs, lines, h2hS, h2hE, homeN, awayN } = allData;

        // Map H2H data to PhuiScore format
        const h2hDuel = h2hS?.teamDuel;
        const h2hMapped = h2hDuel ? {
            teamWins: { home: h2hDuel.homeWins || 0, away: h2hDuel.awayWins || 0 },
            draws: h2hDuel.draws || 0,
            matches: h2hE?.events || []
        } : null;

        await axios.post(`${SERVER_URL}/api/sync/matches`, {
            token: SYNC_TOKEN,
            matches: [{
                ...eventData.event,
                id: matchId,
                dateString: date,
                statistics: stats?.statistics || [],
                incidents: incs?.incidents || [],
                lineups: lines || null,
                h2h: h2hMapped,
                nextMatches: {
                    home: homeN?.events || [],
                    away: awayN?.events || []
                },
                score: {
                    home: eventData.event.homeScore?.current ?? 0,
                    away: eventData.event.awayScore?.current ?? 0
                }
            }]
        });

        const tournamentId = eventData.event.tournament?.uniqueTournament?.id || eventData.event.tournament?.id;
        const seasonId = eventData.event.season?.id;
        if (tournamentId && seasonId) {
            await crawlAndSyncStandings(tournamentId, seasonId);
        }
        console.log(`[Local Crawler] ⚡ Hoàn tất Turbo-fetch trận ${matchId}`);
    } catch (err) { console.error(`[Error Turbo Detail] ${err.message}`); }
    finally { await page.close(); }
}

async function crawlAndSyncStandings(tournamentId, seasonId) {
    const browser = await getBrowser();
    try {
        const page = await createFastPage(browser);
        let finalSeasonId = seasonId;
        
        if (!finalSeasonId) {
            console.log(`[Local Crawler] 🔍 Tìm Season ID cho giải ${tournamentId}...`);
            const seasonUrl = `https://www.sofascore.com/api/v1/unique-tournament/${tournamentId}/seasons`;
            const sData = await fetchSofaJson(seasonUrl, page);
            finalSeasonId = sData?.seasons?.[0]?.id;
        }

        if (!finalSeasonId) throw new Error("Không thể tìm thấy Season ID");

        console.log(`[Local Crawler] 🚀 Đang cào BXH & Knockout giải ${tournamentId}...`);
        const standingsUrl = `https://www.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${finalSeasonId}/standings/total`;
        const cuptreesUrl = `https://www.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${finalSeasonId}/cuptrees`;
        const eventsUrl = `https://www.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${finalSeasonId}/events/last/0`;

        const pTasks = [createFastPage(browser), createFastPage(browser), createFastPage(browser)];
        const [p1, p2, p3] = await Promise.all(pTasks);
        const [stdData, rawCupData, evData] = await Promise.all([
            fetchSofaJson(standingsUrl, p1),
            fetchSofaJson(cuptreesUrl, p2),
            fetchSofaJson(eventsUrl, p3)
        ]);

        await Promise.all([p1.close(), p2.close(), p3.close()]);

        // 2. Xử lý Knockout (Trực tiếp từ /cuptrees hoặc /cuptree)
        let cupData = rawCupData;
        
        if (!cupData || (Array.isArray(cupData) && cupData.length === 0)) {
            console.log(`[Local Crawler] 🔄 Thử fallback /cuptree cho giải ${tournamentId}...`);
            const singleUrl = `https://www.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${finalSeasonId}/cuptree`;
            cupData = await fetchSofaJson(singleUrl, p2);
        }

        // AGGRESSIVE EXTRACTION
        let finalCupTree = null;
        let rawRounds = null;

        // 1. Tìm mảng Rounds (Hỗ trợ đa cấu trúc ngay từ root)
        if (Array.isArray(cupData)) {
            rawRounds = cupData[0]?.rounds || cupData[0]?.cupTree || cupData;
        } else if (cupData?.cupTrees && Array.isArray(cupData.cupTrees)) {
            rawRounds = cupData.cupTrees[0]?.rounds || cupData.cupTrees[0]?.cupTree || cupData.cupTrees;
        } else if (cupData?.cupTree) {
            rawRounds = Array.isArray(cupData.cupTree) ? cupData.cupTree : (cupData.cupTree.rounds || null);
        }

        if (Array.isArray(rawRounds)) {
            finalCupTree = rawRounds.map(round => {
                let allMatches = [];
                const findMatchesInObject = (obj) => {
                    if (!obj || typeof obj !== 'object') return;
                    if (Array.isArray(obj)) {
                        obj.forEach(item => findMatchesInObject(item));
                        return;
                    }

                    // Path 1: Định dạng trận đấu truyền thống (homeTeam/awayTeam)
                    if (obj.homeTeam && obj.awayTeam) {
                        allMatches.push({
                            homeTeam: { id: obj.homeTeam.id, name: obj.homeTeam.name },
                            awayTeam: { id: obj.awayTeam.id, name: obj.awayTeam.name },
                            homeScore: obj.homeScore,
                            awayScore: obj.awayScore,
                            status: obj.status
                        });
                    } 
                    // Path 2: Định dạng Blocks (Sử dụng participants)
                    else if (obj.participants && Array.isArray(obj.participants) && obj.participants.length >= 1) {
                        const p = obj.participants;
                        const hScore = obj.homeTeamScore || p[0]?.score || null;
                        const aScore = obj.awayTeamScore || p[1]?.score || null;
                        
                        allMatches.push({
                            homeTeam: { id: p[0]?.team?.id, name: p[0]?.team?.name },
                            awayTeam: { id: p[1]?.team?.id, name: p[1]?.team?.name },
                            homeScore: hScore !== null ? { current: parseInt(hScore), display: String(hScore) } : null,
                            awayScore: aScore !== null ? { current: parseInt(aScore), display: String(aScore) } : null,
                            // Nếu có tỉ số thì coi như đã bắt đầu (hoặc xong)
                            status: obj.finished ? { type: 'finished' } : (hScore || aScore ? { type: 'inprogress' } : { type: 'not_started' })
                        });
                    }
                    else {
                        Object.values(obj).forEach(val => findMatchesInObject(val));
                    }
                };
                findMatchesInObject(round);

                return {
                    name: round.name || round.description || "Vòng đấu",
                    matches: allMatches
                };
            }).filter(r => r.matches.length > 0);
        }

        await axios.post(`${SERVER_URL}/api/sync/standings`, {
            token: SYNC_TOKEN,
            tournamentId,
            seasonId: finalSeasonId,
            standings: stdData?.standings || [],
            cupTree: finalCupTree,
            events: evData?.events || []
        }).catch(e => console.error(`[Sync Error] ${e.message}`));

        console.log(`[Local Crawler] 🏆 Đã đồng bộ giải ${tournamentId} (Knockout: ${finalCupTree ? finalCupTree.length + ' vòng' : 'KHÔNG'})`);
    } catch (err) { console.error(`[Error Standings] ${err.message}`); }
    finally { /* page close handled in individual calls if needed, but here we used shared browser */ }
}

async function backgroundRoutine() {
    console.log("[Local Crawler] 🚀 Bắt đầu chu kỳ cào bù dữ liệu (Dải 7 ngày)...");
    
    const now = new Date();
    // Cào từ 3 ngày trước đến 3 ngày sau
    for (let i = -3; i <= 3; i++) {
        const d = new Date();
        d.setDate(now.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        console.log(`[Local Crawler] 📅 Đang cào bù ngày: ${dateStr}`);
        await crawlAndSync(dateStr);
        // Nghỉ một chút giữa các ngày để tránh bị rate limit
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log("[Local Crawler] ✅ Đã hoàn thành cào bù. Lần cào tiếp theo sau 10 phút.");
    setTimeout(backgroundRoutine, 10 * 60 * 1000);
}

async function liveSyncRoutine() {
    console.log("[Local Crawler] ⚽ Bắt đầu chu kỳ cập nhật LIVE (60s)...");
    await crawlLive();
    setTimeout(liveSyncRoutine, 60 * 1000); // 60 giây một lần
}

backgroundRoutine();
liveSyncRoutine();
