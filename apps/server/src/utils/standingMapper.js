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

module.exports = { mapSofaStandingToPhuiScore };