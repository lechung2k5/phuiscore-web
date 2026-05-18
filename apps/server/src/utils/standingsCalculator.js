/**
 * Utility to calculate tournament standings from match results
 */

const calculateStandings = (matches, teams) => {
    // 1. Initialize stats for each team
    const standings = teams.map(team => ({
        teamId: String(team.id || team.teamId),
        teamName: team.teamName || team.name,
        logo: team.logo,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0, // Goals For
        ga: 0, // Goals Against
        gd: 0, // Goal Difference
        points: 0,
    }));

    const teamMap = {};
    standings.forEach(s => { teamMap[s.teamId] = s; });

    // 2. Process finished matches
    const finishedMatches = matches.filter(m => 
        String(m.status).toLowerCase() === 'finished' || 
        String(m.status).toLowerCase() === 'ended'
    );

    finishedMatches.forEach(match => {
        const homeId = String(match.homeTeam?.id);
        const awayId = String(match.awayTeam?.id);
        const homeScore = Number(match.score?.home ?? match.homeScore ?? 0);
        const awayScore = Number(match.score?.away ?? match.awayScore ?? 0);

        if (teamMap[homeId] && teamMap[awayId]) {
            const home = teamMap[homeId];
            const away = teamMap[awayId];

            home.played++;
            away.played++;
            home.gf += homeScore;
            home.ga += awayScore;
            away.gf += awayScore;
            away.ga += homeScore;

            if (homeScore > awayScore) {
                home.won++;
                home.points += 3;
                away.lost++;
            } else if (homeScore < awayScore) {
                away.won++;
                away.points += 3;
                home.lost++;
            } else {
                home.drawn++;
                home.points += 1;
                away.drawn++;
                away.points += 1;
            }
        }
    });

    // 3. Final calculations (GD)
    standings.forEach(s => {
        s.gd = s.gf - s.ga;
    });

    // 4. Sort with H2H logic
    standings.sort((a, b) => {
        // First criteria: Points
        if (b.points !== a.points) return b.points - a.points;

        // Second criteria: Head-to-Head (H2H)
        const h2hMatch = finishedMatches.find(m => 
            (String(m.homeTeam?.id) === a.teamId && String(m.awayTeam?.id) === b.teamId) ||
            (String(m.homeTeam?.id) === b.teamId && String(m.awayTeam?.id) === a.teamId)
        );

        if (h2hMatch) {
            const isHomeA = String(h2hMatch.homeTeam?.id) === a.teamId;
            const scoreA = isHomeA ? (h2hMatch.score?.home ?? h2hMatch.homeScore ?? 0) : (h2hMatch.score?.away ?? h2hMatch.awayScore ?? 0);
            const scoreB = isHomeA ? (h2hMatch.score?.away ?? h2hMatch.awayScore ?? 0) : (h2hMatch.score?.home ?? h2hMatch.homeScore ?? 0);
            
            if (scoreA !== scoreB) return scoreB - scoreA; // Better H2H result stays higher
        }

        // Third criteria: Goal Difference
        if (b.gd !== a.gd) return b.gd - a.gd;

        // Fourth criteria: Goals For
        return b.gf - a.gf;
    });

    // Add rank
    return standings.map((s, idx) => ({ ...s, rank: idx + 1 }));
};

module.exports = { calculateStandings };
