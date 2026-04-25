const axios = require('axios');
const MatchRepo = require('./src/repositories/match.repo');

async function startCrawl(date) {
    const url = `https://www.sofascore.com/api/v1/sport/football/scheduled-events/${date}`;
    
    try {
        console.log(`Đang cào dữ liệu ngày ${date}...`);
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0...' } // Header đại ca đã test thành công ở Postman
        });

        const rawEvents = response.data.events;

        // BỘ LỌC "THẦN THÁNH"
        const cleanMatches = rawEvents.map(m => ({
            id: m.id,
            dateString: date,
            tournamentId: m.tournament.uniqueTournament?.id || 0,
            tournamentName: m.tournament.uniqueTournament?.name || "Giải đấu khác",
            homeTeam: {
                name: m.homeTeam.name,
                logo: `https://api.sofascore.app/api/v1/team/${m.homeTeam.id}/image`
            },
            awayTeam: {
                name: m.awayTeam.name,
                logo: `https://api.sofascore.app/api/v1/team/${m.awayTeam.id}/image`
            },
            score: {
                home: m.homeScore?.current || 0,
                away: m.awayScore?.current || 0
            },
            status: m.status.type,
            startTimestamp: m.startTimestamp
        }));

        await MatchRepo.saveMatchesBatch(cleanMatches);

    } catch (error) {
        console.error("Cào thất bại:", error.message);
    }
}

startCrawl('2026-02-14');