const {
  PutCommand, GetCommand, ScanCommand, DeleteCommand, UpdateCommand
} = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { docClient, client } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

const TABLE = "PhuiScore_TeamStats";

async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE }));
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`[DynamoDB] 📦 Tạo table ${TABLE}...`);
      await client.send(new CreateTableCommand({
        TableName: TABLE,
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      console.log(`[DynamoDB] ✅ Table ${TABLE} đã được tạo!`);
    }
  }
}

ensureTable();

const TeamStatsRepo = {
  initializeStats: async (tournamentId, teamId) => {
    const id = `ts_${tournamentId}_${teamId}`;
    const now = Date.now();
    const item = {
      id,
      tournamentId,
      teamId,
      played: 0,
      win: 0,
      draw: 0,
      loss: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      yellowCards: 0,
      redCards: 0,
      last5Form: '',
      updatedAt: now,
    };
    
    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  },

  getStatsByTournament: async (tournamentId) => {
    // Scan cho MVP
    const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    const items = result.Items || [];
    return items.filter(i => i.tournamentId === tournamentId).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
  },

  getStatsByTeam: async (tournamentId, teamId) => {
    const id = `ts_${tournamentId}_${teamId}`;
    const result = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    return result.Item || null;
  },

  updateStats: async (tournamentId, teamId, updates) => {
    const id = `ts_${tournamentId}_${teamId}`;
    const expAttrNames = {};
    const expAttrValues = {};
    const updateExps = [];

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id' || key === 'tournamentId' || key === 'teamId') continue;
      expAttrNames[`#${key}`] = key;
      expAttrValues[`:${key}`] = val;
      updateExps.push(`#${key} = :${key}`);
    }

    expAttrNames['#updatedAt'] = 'updatedAt';
    expAttrValues[':updatedAt'] = Date.now();
    updateExps.push('#updatedAt = :updatedAt');

    const params = {
      TableName: TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExps.join(', ')}`,
      ExpressionAttributeNames: expAttrNames,
      ExpressionAttributeValues: expAttrValues,
      ReturnValues: 'ALL_NEW',
    };
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  }
};

module.exports = TeamStatsRepo;
