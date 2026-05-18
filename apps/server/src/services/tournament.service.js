const MatchRepo = require('../repositories/match.repo');
const TournamentRepo = require('../repositories/tournament.repo');
const { calculateStandings } = require('../utils/standingsCalculator');

const TournamentService = {
    /**
     * Recalculate standings for a specific tournament
     */
    refreshStandings: async (tournamentId) => {
        try {
            console.log(`[StandingsService] 🏆 Đang tính toán lại BXH cho giải: ${tournamentId}`);
            
            // 1. Lấy thông tin giải đấu
            const tournament = await TournamentRepo.getById(tournamentId);
            if (!tournament) throw new Error('Không tìm thấy giải đấu');

            // 2. Lấy tất cả trận đấu của giải
            const matches = await MatchRepo.getMatchesByTournament(tournamentId);
            
            // 3. Lấy danh sách đội bóng (chỉ lấy đội Confirmed)
            const confirmedTeams = (tournament.teams || []).filter(t => t.status === 'Confirmed');
            
            if (confirmedTeams.length === 0) {
                console.warn(`[StandingsService] ⚠️ Không có đội nào trạng thái 'Confirmed' trong giải ${tournamentId}`);
                return;
            }

            // 4. Tính toán
            const newStandings = calculateStandings(matches, confirmedTeams);

            // 5. Cập nhật lại vào Tournament (DynamoDB)
            await TournamentRepo.update(tournamentId, { standings: newStandings });
            
            console.log(`[StandingsService] ✅ Cập nhật BXH thành công cho giải: ${tournament.name}`);
            
            // 6. Broadcast qua Socket để FE cập nhật ngay
            if (global.io) {
                global.io.emit('standingsUpdate', { tournamentId, standings: newStandings });
            }

            return newStandings;
        } catch (error) {
            console.error('[StandingsService] ❌ Lỗi:', error.message);
            throw error;
        }
    }
};

module.exports = TournamentService;
