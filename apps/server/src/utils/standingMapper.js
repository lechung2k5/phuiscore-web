/**
 * Chuyển đổi dữ liệu SofaScore sang định dạng Phui Score
 * @param {object} rawData - group standings raw từ SofaScore
 * @param {object} formMap - map teamId -> formString (vd: {123: 'WDLWW'})
 */
const mapSofaStandingToPhuiScore = (rawData, formMap = {}) => {
    return rawData.rows.map(row => {
        // form: lấy từ formMap (tính từ events) hoặc từ row.form (SofaScore trả trực tiếp)
        const formRaw = formMap[row.team?.id] || row.form || '';
        const form = formRaw ? String(formRaw).split('').filter(Boolean).slice(0, 5) : [];

        return {
            rank: row.position,
            team: {
                id: row.team.id,
                name: row.team.name,
                logo: `https://api.sofascore.app/api/v1/team/${row.team.id}/image`
            },
            mp: row.matches,
            w: row.wins,
            d: row.draws,
            l: row.losses,
            gf: row.scoresFor,
            ga: row.scoresAgainst,
            // Tính hiệu số (GD) - UI yêu cầu cái này
            gd: row.scoresFor - row.scoresAgainst,
            pts: row.points,
            form,
            // Lưu thông tin khu vực (C1, Xuống hạng) để vẽ vạch màu
            promotion: row.promotion?.text || null
        };
    });
};

// Helper: format một trận đấu cho Knockout
function formatMatchData(m) {
    return {
        homeTeam: { 
            name: m.homeTeam?.name, 
            logo: `https://api.sofascore.app/api/v1/team/${m.homeTeam?.id}/image` 
        },
        awayTeam: { 
            name: m.awayTeam?.name, 
            logo: `https://api.sofascore.app/api/v1/team/${m.awayTeam?.id}/image` 
        },
        homeScore: m.homeScore?.display ?? m.homeScore?.current ?? (m.status?.type === 'finished' ? '0' : '-'),
        awayScore: m.awayScore?.display ?? m.awayScore?.current ?? (m.status?.type === 'finished' ? '0' : '-'),
        homePenalty: m.homeScore?.period1 || null,
        awayPenalty: m.awayScore?.period1 || null
    };
}

/**
 * Chuyển đổi dữ liệu cupTree từ SofaScore sang định dạng Phui Score
 */
const formatCupTree = (tree) => {
    if (!Array.isArray(tree)) return null;
    return tree
        .filter(round => Array.isArray(round.matches) && round.matches.length > 0)
        .map(round => ({
            roundName: round.name,
            matches: round.matches.map(formatMatchData)
        }));
};

module.exports = { mapSofaStandingToPhuiScore, formatCupTree, formatMatchData };