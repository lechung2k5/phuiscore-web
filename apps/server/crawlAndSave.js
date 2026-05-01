const { gotScraping } = require('got-scraping');
const MatchRepo = require('./src/repositories/match.repo');

const client = gotScraping.extend({
    retry: { limit: 2 },
    timeout: { request: 10000 },
    headers: {
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.sofascore.com/',
        'Cookie': 'YOUR_FRESH_COOKIE_HERE'
    }
});

async function startCrawl(date) {
    const url = `https://www.sofascore.com/api/v1/sport/football/scheduled-events/${date}`;
    
    try {
        console.log(`Đang cào dữ liệu ngày ${date}...`);
        const response = await client.get(url).json();

        const rawEvents = response.events;

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