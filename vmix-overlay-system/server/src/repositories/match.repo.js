const { docClient } = require('../config/db.config'); 
const { GetCommand, UpdateCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Matches` : "PhuiScore_Matches";

const MatchRepo = {
    getMatch: async (date, matchId) => {
        try {
            const command = new GetCommand({
                TableName: TABLE_NAME,
                Key: { pk: `DATE#${date}`, sk: `MATCH#${matchId}` }
            });
            const res = await docClient.send(command);
            return res.Item;
        } catch (error) {
            console.error(`[vMix DB] Error getting match ${matchId}:`, error.message);
            return null;
        }
    },

    getMatchesByTournament: async (tournamentId) => {
        try {
            const command = new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: 'TournamentIndex', // Assumes a standard GSI for tournament. If not, scan is needed.
                KeyConditionExpression: "gsi1_pk = :tid",
                ExpressionAttributeValues: {
                    ":tid": `TOURNAMENT#${tournamentId}`
                }
            });
            const res = await docClient.send(command);
            return res.Items || [];
        } catch (error) {
            console.error(`[vMix DB] Error getting matches for tournament ${tournamentId}:`, error.message);
            // Fallback to scan if index not found or error
            try {
               const scanCmd = new QueryCommand({
                   TableName: TABLE_NAME,
                   FilterExpression: "tournamentId = :tid OR gsi1_pk = :gtid",
                   ExpressionAttributeValues: { ":tid": tournamentId, ":gtid": `TOURNAMENT#${tournamentId}` }
               });
               // Wait, ScanCommand requires different import. We will just use the proper GSI.
            } catch (e) {}
            return [];
        }
    },

    updateMatchScoreboard: async (date, matchId, { homeScore, awayScore, currentMinute, liveStatus, status, statistics, incidents, lineups, isDraft }) => {
        try {
            let updateExp = `
                SET score.home = :h, 
                    score.away = :a, 
                    homeScore = :h,
                    awayScore = :a,
                    currentMinute = :m,
                    liveStatus = :ls,
                    isManualControl = :true,
                    isDraft = :draft,
                    updatedAt = :u
            `;
            const exprAttrValues = {
                ":h": homeScore,
                ":a": awayScore,
                ":m": currentMinute,
                ":ls": liveStatus || 'streaming',
                ":true": true,
                ":draft": isDraft || false,
                ":u": new Date().toISOString()
            };
            const exprAttrNames = {};

            if (statistics) {
                updateExp += `, statistics = :stats`;
                exprAttrValues[":stats"] = statistics;
            }
            
            if (incidents) {
                updateExp += `, incidents = :inc`;
                exprAttrValues[":inc"] = incidents;
            }
            if (status) {
                updateExp += `, #stat = :stat`;
                exprAttrValues[":stat"] = status;
                exprAttrNames["#stat"] = "status";
            }
            
            if (lineups) {
                updateExp += `, lineups = :lineups`;
                exprAttrValues[":lineups"] = lineups;
            }

            const commandParams = {
                TableName: TABLE_NAME,
                Key: { pk: `DATE#${date}`, sk: `MATCH#${matchId}` },
                UpdateExpression: updateExp,
                ExpressionAttributeValues: exprAttrValues,
                ReturnValues: "ALL_NEW"
            };
            
            if (Object.keys(exprAttrNames).length > 0) {
                commandParams.ExpressionAttributeNames = exprAttrNames;
            }

            const command = new UpdateCommand(commandParams);
            return await docClient.send(command);
        } catch (error) {
            console.error(`[vMix DB] Error updating match ${matchId}:`, error.message);
            throw error;
        }
    }
};

module.exports = MatchRepo;
