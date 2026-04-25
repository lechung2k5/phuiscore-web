const {docClient} = require('../config/db.config'); 
const { 
    BatchWriteCommand, 
    QueryCommand, 
    UpdateCommand,
    GetCommand,
    DeleteCommand
} = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { client } = require('../config/db.config');

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Matches` : "PhuiScore_Matches";

async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`[DynamoDB] 📦 Tạo table ${TABLE_NAME}...`);
      await client.send(new CreateTableCommand({
        TableName: TABLE_NAME,
        KeySchema: [
          { AttributeName: 'pk', KeyType: 'HASH' },
          { AttributeName: 'sk', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'pk', AttributeType: 'S' },
          { AttributeName: 'sk', AttributeType: 'S' },
          { AttributeName: 'gsi1_pk', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'TournamentIndex',
            KeySchema: [
              { AttributeName: 'gsi1_pk', KeyType: 'HASH' },
              { AttributeName: 'sk', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' }
          }
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      console.log(`[DynamoDB] ✅ Table ${TABLE_NAME} đã được tạo thành công!`);
    }
  }
}

ensureTable();

const MatchRepo = {
    /**
     * 1. Lưu hàng loạt trận đấu (Sử dụng cho Crawler)
     * Đã fix: Bổ sung currentMinute và tournamentLogo
     */
    saveMatchesBatch: async (matches) => {
        if (!matches || matches.length === 0) return [];

        // Chia nhỏ mảng thành các nhóm 25 phần tử (giới hạn của BatchWrite)
        const chunks = [];
        for (let i = 0; i < matches.length; i += 25) {
            chunks.push(matches.slice(i, i + 25));
        }

        const results = [];
        for (const chunk of chunks) {
            const params = {
                RequestItems: {
                    [TABLE_NAME]: chunk.map(match => ({
                        PutRequest: {
                           Item: {
                                pk: `DATE#${match.dateString}`,
                                sk: `MATCH#${match.id}`,
                                gsi1_pk: `TOURNAMENT#${match.tournamentId}`,
                                tournamentId: match.tournamentId, 
                                tournamentName: match.tournamentName,
                                tournamentLogo: match.tournamentLogo,
                                homeTeam: match.homeTeam,
                                awayTeam: match.awayTeam,
                                status: match.status,
                                dateString: match.dateString,
                                stadium: match.stadium,
                                pitchNumber: match.pitchNumber,
                                timeString: match.timeString,
                                round: match.round,
                                score: match.score,
                                currentMinute: match.currentMinute,
                                startTimestamp: match.startTimestamp,
                                // 🔥 Thêm các trường chi tiết
                                statistics: match.statistics || null,
                                incidents: match.incidents || [],
                                lineups: match.lineups || null,
                                h2h: match.h2h || null,
                                nextMatches: match.nextMatches || null,
                                standings: match.standings || null,
                                info: match.info || null,
                                updatedAt: new Date().toISOString()
                            }
                        }
                    }))
                }
            };
            results.push(await docClient.send(new BatchWriteCommand(params)));
        }
        return results;
    },

    /**
     * 2. Lấy tất cả trận đấu của một ngày cụ thể (Dùng cho API chính)
     */
    getMatchesByDate: async (date) => {
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "pk = :pk",
            ExpressionAttributeValues: {
                ":pk": `DATE#${date}`
            }
        });
        const response = await docClient.send(command);
        return response.Items || [];
    },

    /**
     * 3. Lấy tất cả trận của một giải đấu (Sử dụng GSI)
     */
    getMatchesByTournament: async (tournamentId) => {
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "TournamentIndex",
            KeyConditionExpression: "gsi1_pk = :tId",
            ExpressionAttributeValues: {
                ":tId": `TOURNAMENT#${tournamentId}`
            }
        });
        const response = await docClient.send(command);
        return response.Items || [];
    },

    /**
     * Xóa toàn bộ các trận đấu của 1 giải (Khi tạo lại lịch)
     */
    deleteMatchesByTournament: async (tournamentId) => {
        // Gọi hàm của chính Object này thì gõ từ khóa `MatchRepo`
        const matches = await MatchRepo.getMatchesByTournament(tournamentId);
        if (!matches || matches.length === 0) return;

        const chunks = [];
        for (let i = 0; i < matches.length; i += 25) {
            chunks.push(matches.slice(i, i + 25));
        }

        for (const chunk of chunks) {
            const params = {
                RequestItems: {
                    [TABLE_NAME]: chunk.map(m => ({
                        DeleteRequest: {
                            Key: { pk: m.pk, sk: m.sk }
                        }
                    }))
                }
            };
            await docClient.send(new BatchWriteCommand(params));
        }
    },

    /**
     * 4. Cập nhật tỉ số và thông số chi tiết (Dùng cho trận LIVE)
     */
    updateMatchLive: async (date, matchId, data) => {
        const { 
            homeScore, awayScore, status, currentMinute, 
            statistics, incidents, lineups, h2h, nextMatches, standings, info 
        } = data;

        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                pk: `DATE#${date}`,
                sk: `MATCH#${matchId}`
            },
            UpdateExpression: `
                SET score.home = :h, 
                    score.away = :a, 
                    #stat = :s, 
                    currentMinute = :m, 
                    statistics = :stats, 
                    incidents = :inc, 
                    lineups = :line, 
                    h2h = :h2h,
                    nextMatches = :next,
                    standings = :st,
                    info = :info,
                    updatedAt = :u
            `,
            ExpressionAttributeNames: {
                "#stat": "status" 
            },
            ExpressionAttributeValues: {
                ":h": homeScore ?? 0,
                ":a": awayScore ?? 0,
                ":s": status,
                ":m": currentMinute || "",
                ":stats": statistics || null,
                ":inc": incidents || [],
                ":line": lineups || null,
                ":h2h": h2h || null,
                ":next": nextMatches || null,
                ":st": standings || null,
                ":info": info || null,
                ":u": new Date().toISOString()
            },
            ReturnValues: "ALL_NEW"
        });
        return await docClient.send(command);
    },

    /**
     * Lấy 1 trận đấu cụ thể
     */
    getMatch: async (date, matchId) => {
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `DATE#${date}`, sk: `MATCH#${matchId}` }
        });
        const res = await docClient.send(command);
        return res.Item;
    },

    /**
     * Xóa 1 trận đấu cụ thể
     */
    deleteMatch: async (date, matchId) => {
        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk: `DATE#${date}`, sk: `MATCH#${matchId}` }
        });
        return await docClient.send(command);
    }
};

module.exports = MatchRepo;