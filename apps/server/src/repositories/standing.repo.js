const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { docClient, client } = require('../config/db.config'); 

const TABLE_NAME = "PhuiScore_Standings";

async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`[DynamoDB] 📦 Tạo table ${TABLE_NAME}...`);
      await client.send(new CreateTableCommand({
        TableName: TABLE_NAME,
        KeySchema: [
          { AttributeName: 'tournamentId', KeyType: 'HASH' },
          { AttributeName: 'seasonId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'tournamentId', AttributeType: 'N' },
          { AttributeName: 'seasonId', AttributeType: 'N' }
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      console.log(`[DynamoDB] ✅ Table ${TABLE_NAME} đã được tạo thành công!`);
    }
  }
}

ensureTable();

const StandingRepo = {
    /**
     * Lưu bảng xếp hạng — lưu toàn bộ finalData trực tiếp vào DynamoDB
     * (pk: tournamentId + seasonId, còn lại là fields của finalData)
     */
    saveStandings: async (tournamentId, seasonId, finalData) => {
        // Đảm bảo không bị ghi đè bởi string trong finalData
        const { tournamentId: _tid, seasonId: _sid, ...cleanData } = finalData;

        const params = {
            TableName: TABLE_NAME,
            Item: {
                // Khoá chính (Bắt buộc là Number theo Schema)
                tournamentId: Number(tournamentId) || 0,
                seasonId: Number(seasonId) || 0,
                // Dữ liệu còn lại
                ...cleanData,
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
                tournamentId: Number(tournamentId) || 0,
                seasonId: Number(seasonId) || 0
            }
        };
        try {
            const result = await docClient.send(new GetCommand(params));
            return result.Item || null;
        } catch (error) {
            console.error("❌ Lỗi Get Standing Repo:", error);
            throw error;
        }
    },

    /**
     * Lấy bảng xếp hạng MỚI NHẤT của một giải đấu (Khi không biết seasonId)
     */
    getLatestStandings: async (tournamentId) => {
        const { QueryCommand } = require("@aws-sdk/lib-dynamodb");
        const params = {
            TableName: "PhuiScore_Standings",
            KeyConditionExpression: "tournamentId = :tid",
            ExpressionAttributeValues: {
                ":tid": Number(tournamentId) || 0
            },
            ScanIndexForward: false, // Lấy cái mới nhất lên đầu (seasonId lớn nhất)
            Limit: 1
        };
        try {
            const data = await docClient.send(new QueryCommand(params));
            return data.Items?.[0] || null;
        } catch (error) {
            console.error("❌ Lỗi Get Latest Standing Repo:", error);
            return null;
        }
    }
};

module.exports = StandingRepo;