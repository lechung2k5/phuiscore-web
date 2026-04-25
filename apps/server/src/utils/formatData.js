const groupMatchesByLeague = (matches) => {
    return matches.reduce((acc, match) => {
        const leagueId = match.gsi1_pk.replace('TOURNAMENT#', '');
        const leagueName = match.tournamentName || "Giải đấu khác";

        if (!acc[leagueId]) {
            acc[leagueId] = {
                id: leagueId,
                name: leagueName,
                logo: `https://api.sofascore.app/api/v1/unique-tournament/${leagueId}/image`,
                matches: []
            };
        }
        acc[leagueId].matches.push(match);
        return acc;
    }, {});
};