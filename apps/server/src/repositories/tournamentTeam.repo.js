const {
  PutCommand, GetCommand, ScanCommand, DeleteCommand, UpdateCommand
} = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { docClient, client } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

const TABLE = "PhuiScore_TournamentTeams";

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

const TournamentTeamRepo = {
  registerTeam: async (data) => {
    const id = `tt_${uuidv4()}`;
    const now = Date.now();
    const item = {
      id,
      tournamentId: data.tournamentId,
      teamId: data.teamId,
      groupId: data.groupId || null,
      seedNumber: data.seedNumber || null,
      status: data.status || 'registered', // registered, qualified, eliminated, champion
      registeredAt: now,
      updatedAt: now,
    };
    
    Object.keys(item).forEach(key => item[key] === null && delete item[key]);

    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  },

  getByTournament: async (tournamentId) => {
    // Scan cho MVP
    const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    const items = result.Items || [];
    return items.filter(i => i.tournamentId === tournamentId);
  },

  getByTeam: async (teamId) => {
    const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    const items = result.Items || [];
    return items.filter(i => i.teamId === teamId);
  },

  updateStatus: async (id, status) => {
    const params = {
      TableName: TABLE,
      Key: { id },
      UpdateExpression: `SET #status = :status, updatedAt = :updatedAt`,
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { 
        ':status': status,
        ':updatedAt': Date.now()
      },
      ReturnValues: 'ALL_NEW',
    };
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  },

  removeRegistration: async (id) => {
    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
    return true;
  }
};

module.exports = TournamentTeamRepo;
