const {
  PutCommand, GetCommand, ScanCommand, DeleteCommand, UpdateCommand
} = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { docClient, client } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

const TABLE = "PhuiScore_Players";

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

const PlayerRepo = {
  create: async (data, teamId) => {
    const id = `player_${uuidv4()}`;
    const now = Date.now();
    const item = {
      id,
      teamId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  },

  getByTeamId: async (teamId) => {
    // Scan cho MVP
    const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    const items = result.Items || [];
    return items.filter(i => i.teamId === teamId).sort((a, b) => (a.number || 0) - (b.number || 0));
  },

  getById: async (id) => {
    const result = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    return result.Item || null;
  },

  update: async (id, updates) => {
    const expAttrNames = {};
    const expAttrValues = {};
    const updateExps = [];

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id') continue;
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
  },

  delete: async (id) => {
    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
    return true;
  }
};

module.exports = PlayerRepo;
