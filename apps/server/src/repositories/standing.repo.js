const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const {docClient} = require('../config/db.config'); 

const StandingRepo = {
    /**
     * Lưu bảng xếp hạng — lưu toàn bộ finalData trực tiếp vào DynamoDB
     * (pk: tournamentId + seasonId, còn lại là fields của finalData)
     */
    saveStandings: async (tournamentId, seasonId, finalData) => {
        const params = {
            TableName: "PhuiScore_Standings",
            Item: {
                // Khoá chính
                tournamentId: Number(tournamentId),
                seasonId: Number(seasonId),
                // Toàn bộ dữ liệu đã format từ controller (có standings, knockoutData, tournamentInfo...)
                ...finalData,
                lastUpdated: Date.now()
            }
        };
        try {
            await docClient.send(new PutCommand(params));
            return true;
        } catch (error) {
            console.error("❌ Lỗi Save Standing Repo:", error);
            throw error;
        }
    },

    /**
     * Lấy bảng xếp hạng từ DB — trả về item với đầy đủ standings, knockoutData...
     */
    getStandings: async (tournamentId, seasonId) => {
        const params = {
            TableName: "PhuiScore_Standings",
            Key: {
                tournamentId: Number(tournamentId),
                seasonId: Number(seasonId)
            }
        };
        try {
            const result = await docClient.send(new GetCommand(params));
            return result.Item || null;
        } catch (error) {
            console.error("❌ Lỗi Get Standing Repo:", error);
            throw error;
        }
    }
};

module.exports = StandingRepo;