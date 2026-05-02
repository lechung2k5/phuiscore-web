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

        const updatePromises = matches.map(async (match) => {
            const pk = `DATE#${match.dateString}`;
            const sk = `MATCH#${match.id}`;
            
            // Chỉ lấy các trường có giá trị hợp lệ để tránh lỗi DynamoDB
            const updateFields = {};
            const potentialFields = {
                tournamentId: match.tournamentId,
                tournamentName: match.tournamentName,
                tournamentLogo: match.tournamentLogo,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                status: match.status,
                score: match.score,
                currentMinute: match.currentMinute,
                startTimestamp: match.startTimestamp,
                gsi1_pk: match.tournamentId ? `TOURNAMENT#${match.tournamentId}` : undefined,
                statistics: match.statistics,
                incidents: match.incidents,
                lineups: match.lineups,
                h2h: match.h2h,
                nextMatches: match.nextMatches,
                info: match.info,
                time: match.time,
                seasonId: match.seasonId,
                updatedAt: new Date().toISOString()
            };

            // Lọc bỏ các trường undefined hoặc null
            Object.keys(potentialFields).forEach(key => {
                if (potentialFields[key] !== undefined && potentialFields[key] !== null) {
                    updateFields[key] = potentialFields[key];
                }
            });

            if (Object.keys(updateFields).length === 0) return;

            let updateExp = "SET ";
            const attrNames = {};
            const attrValues = {};
            const keys = Object.keys(updateFields);

            keys.forEach((key, index) => {
                updateExp += `#field${index} = :val${index}${index < keys.length - 1 ? ", " : ""}`;
                attrNames[`#field${index}`] = key;
                attrValues[`:val${index}`] = updateFields[key];
            });

            try {
                await client.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { pk, sk },
                    UpdateExpression: updateExp,
                    ExpressionAttributeNames: attrNames,
                    ExpressionAttributeValues: attrValues
                }));
            } catch (err) {
                console.error(`[MatchRepo] ❌ Lỗi cập nhật trận ${match.id}:`, err.message);
            }
        });

        await Promise.all(updatePromises);
        console.log(`[MatchRepo] ✅ Đã cập nhật ${matches.length} trận đấu.`);
        return matches;
    },

    /**
     * 2. Lấy tất cả trận đấu của một ngày cụ thể (Dùng cho API chính)
     */
    getMatchesByDate: async (date) => {
        try {
            const command = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: "pk = :pk",
                ExpressionAttributeValues: {
                    ":pk": `DATE#${date}`
                }
            });
            const response = await docClient.send(command);
            const items = response.Items || [];
            
            return items.map(item => ({
                ...item,
                id: item.id || (item.sk ? item.sk.replace('MATCH#', '') : null)
            }));
        } catch (error) {
            console.error(`[MatchRepo] ❌ Lỗi khi lấy dữ liệu từ DynamoDB (Ngày: ${date}):`, error.message);
            throw error; // Ném lại lỗi để controller xử lý trả về 500
        }
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
            statistics, incidents, lineups, h2h, nextMatches, standings, info,
            liveStatus, streamUrl, streamKey
        } = data;

        // Lấy dữ liệu hiện tại để kiểm tra isManualControl
        const getCommand = new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `DATE#${date}`, sk: `MATCH#${matchId}` }
        });
        const currentMatch = await docClient.send(getCommand);
        const isManual = currentMatch.Item?.isManualControl === true;

        const exprAttrValues = {
            ":s": status || "inprogress",
            ":stats": statistics || null,
            ":inc": incidents || [],
            ":line": lineups || null,
            ":h2h": h2h || null,
            ":next": nextMatches || null,
            ":st": standings || null,
            ":info": info || null,
            ":ls": liveStatus || 'idle',
            ":su": streamUrl || null,
            ":sk_val": streamKey || null,
            ":u": new Date().toISOString(),
            ":false": false
        };

        let setClause = `
            #stat = :s, 
            statistics = :stats, 
            incidents = :inc, 
            lineups = :line, 
            h2h = :h2h,
            nextMatches = :next,
            standings = :st,
            info = :info,
            liveStatus = :ls,
            streamUrl = :su,
            streamKey = :sk_val,
            updatedAt = :u,
            isManualControl = if_not_exists(isManualControl, :false)
        `;

        // Chỉ cập nhật tỉ số và phút nếu KHÔNG ở chế độ thủ công
        if (!isManual) {
            setClause += `, score.home = :h, score.away = :a, currentMinute = :m`;
            exprAttrValues[":h"] = homeScore ?? 0;
            exprAttrValues[":a"] = awayScore ?? 0;
            exprAttrValues[":m"] = currentMinute || "";
        }

        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `DATE#${date}`, sk: `MATCH#${matchId}` },
            UpdateExpression: `SET ${setClause}`,
            ExpressionAttributeNames: { "#stat": "status" },
            ExpressionAttributeValues: exprAttrValues,
            ReturnValues: "ALL_NEW"
        });
        return await docClient.send(command);
    },

    /**
     * ⚡ CẬP NHẬT NHANH TỈ SỐ & PHÚT (Cho BLV)
     */
    updateMatchScoreboard: async (date, matchId, { homeScore, awayScore, currentMinute, liveStatus, statistics }) => {
        let updateExp = `
            SET score.home = :h, 
                score.away = :a, 
                currentMinute = :m,
                liveStatus = :ls,
                isManualControl = :true,
                updatedAt = :u
        `;
        const exprAttrValues = {
            ":h": homeScore,
            ":a": awayScore,
            ":m": currentMinute,
            ":ls": liveStatus || 'streaming',
            ":true": true,
            ":u": new Date().toISOString()
        };

        if (statistics) {
            updateExp += `, statistics = :stats`;
            exprAttrValues[":stats"] = statistics;
        }

        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `DATE#${date}`, sk: `MATCH#${matchId}` },
            UpdateExpression: updateExp,
            ExpressionAttributeValues: exprAttrValues,
            ReturnValues: "ALL_NEW"
        });
        const res = await docClient.send(command);
        
        // 📢 Phát tín hiệu Socket.io ngay lập tức
        if (global.io) {
            global.io.emit('scoreUpdate', { // Đổi thành scoreUpdate cho đồng bộ với FE
                matchId,
                homeScore,
                awayScore,
                currentMinute,
                liveStatus,
                statistics
            });
        }
        return res;
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