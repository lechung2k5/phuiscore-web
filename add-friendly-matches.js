const axios = require('axios');
require('dotenv').config({ path: './apps/server/.env' });

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const SYNC_TOKEN = process.env.SYNC_TOKEN || 'phuiscore_secret_2026';

const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const dateString = `${year}-${month}-${day}`;

// 10 matches with premium world class clubs (Real SofaScore IDs for actual logos)
const pairs = [
  { home: { id: 35, name: 'Manchester United' }, away: { id: 17, name: 'Manchester City' }, hour: 13, min: 0 },
  { home: { id: 38, name: 'Chelsea' }, away: { id: 42, name: 'Arsenal' }, hour: 13, min: 10 },
  { home: { id: 44, name: 'Liverpool' }, away: { id: 2829, name: 'Real Madrid' }, hour: 13, min: 20 },
  { home: { id: 2817, name: 'Barcelona' }, away: { id: 2672, name: 'Bayern Munich' }, hour: 13, min: 30 },
  { home: { id: 1644, name: 'PSG' }, away: { id: 2687, name: 'Juventus' }, hour: 13, min: 40 },
  { home: { id: 2692, name: 'AC Milan' }, away: { id: 2697, name: 'Inter Milan' }, hour: 13, min: 50 },
  { home: { id: 2836, name: 'Atletico Madrid' }, away: { id: 33, name: 'Tottenham' }, hour: 14, min: 0 },
  { home: { id: 2673, name: 'Dortmund' }, away: { id: 2714, name: 'Napoli' }, hour: 14, min: 15 },
  { home: { id: 2713, name: 'Ajax' }, away: { id: 3002, name: 'Porto' }, hour: 14, min: 30 },
  { home: { id: 3006, name: 'Benfica' }, away: { id: 3001, name: 'Sporting CP' }, hour: 14, min: 45 },
];

const matches = pairs.map((pair, idx) => {
  const startLocal = new Date(`${dateString}T${String(pair.hour).padStart(2, '0')}:${String(pair.min).padStart(2, '0')}:00+07:00`);
  const startTimestamp = Math.floor(startLocal.getTime() / 1000);
  
  return {
    id: `friendly-match-${idx + 1}`,
    dateString: dateString,
    tournamentId: 9999,
    tournamentName: "Giao hữu",
    tournamentLogo: "https://api.sofascore.app/api/v1/unique-tournament/17/image", // Sofascore icon
    homeTeam: {
      id: pair.home.id,
      name: pair.home.name,
      logo: `https://api.sofascore.app/api/v1/team/${pair.home.id}/image`
    },
    awayTeam: {
      id: pair.away.id,
      name: pair.away.name,
      logo: `https://api.sofascore.app/api/v1/team/${pair.away.id}/image`
    },
    score: {
      home: 0,
      away: 0,
      period1: null,
      period2: null
    },
    status: 'not_started',
    currentMinute: '',
    startTimestamp: startTimestamp,
    time: {
      currentPeriodStartTimestamp: null
    },
    info: {
      round: "1",
      roundName: "Vòng Giao hữu",
      venue: "Sân vận động Hàng Đẫy",
      referee: "Trọng tài Elite FIFA"
    },
    seasonId: 2026
  };
});

async function main() {
  try {
    console.log(`[Script] Sending 10 friendly matches for date ${dateString} to ${SERVER_URL}...`);
    const res = await axios.post(`${SERVER_URL}/api/sync/matches`, {
      token: SYNC_TOKEN,
      matches: matches
    });
    console.log("[Script] Sync Response:", res.data);
    console.log(`\n[SUCCESS] Successfully populated 10 premium matches under 'Giao hữu'!`);
  } catch (err) {
    console.error("[ERROR] Failed to insert matches:", err.response ? err.response.data : err.message);
  }
}

main();
