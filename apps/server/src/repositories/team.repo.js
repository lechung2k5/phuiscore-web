const {
  PutCommand, GetCommand, ScanCommand, DeleteCommand, UpdateCommand, QueryCommand
} = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { docClient, client } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

const TABLE = "PhuiScore_Teams";

async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE }));
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`[DynamoDB] 📦 Tạo table ${TABLE}...`);
      await client.send(new CreateTableCommand({
        TableName: TABLE,
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'managerId', AttributeType: 'S' },
          { AttributeName: 'createdAt', AttributeType: 'N' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'ManagerIndex',
            KeySchema: [
              { AttributeName: 'managerId', KeyType: 'HASH' },
              { AttributeName: 'createdAt', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' }
          }
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      console.log(`[DynamoDB] ✅ Table ${TABLE} đã được tạo với GSI!`);
    }
  }
}

ensureTable();

const TeamRepo = {
  create: async (data, managerId) => {
    const id = `team_${uuidv4()}`;
    const now = Date.now();
    const item = {
      id,
      name: data.name,
      short_name: data.short_name || data.name.substring(0, 3).toUpperCase(),
      leader: data.leader,
      phone: data.phone || null,
      area: data.area || null,
      logo_url: data.logo_url || data.logo || null,
      primary_color: data.primary_color || data.kitColor || null,
      secondary_color: data.secondary_color || null,
      founded_year: data.founded_year || data.established || null,
      home_stadium_id: data.home_stadium_id || data.stadiumName || null,
      slogan: data.slogan || null,
      description: data.description || null,
      status: data.status || 'active', // active, inactive, banned
      managerId, // ID từ user header (auth)
      createdAt: now,
      updatedAt: now,
    };
    
    // Clean nulls for DynamoDB
    Object.keys(item).forEach(key => item[key] === null && delete item[key]);

    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  },

  getAll: async (searchQuery = '') => {
    const params = { TableName: TABLE };
    const result = await docClient.send(new ScanCommand(params));
    let items = result.Items || [];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => 
        i.name?.toLowerCase().includes(q) || 
        i.short_name?.toLowerCase().includes(q) ||
        i.area?.toLowerCase().includes(q)
      );
    }
    
    // Default filter active teams
    items = items.filter(i => i.status !== 'banned');
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return items;
  },

  getById: async (id) => {
    const result = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    return result.Item || null;
  },

  getByManagerId: async (managerId) => {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'ManagerIndex',
      KeyConditionExpression: 'managerId = :managerId',
      ExpressionAttributeValues: { ':managerId': managerId },
      ScanIndexForward: false // Sắp xếp giảm dần theo createdAt (Sort Key)
    }));
    return result.Items || [];
  },

  update: async (id, updates) => {
    const expAttrNames = {};
    const expAttrValues = {};
    const updateExps = [];

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id' || key === 'createdAt' || key === 'managerId' || key === 'updatedAt') continue;
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

module.exports = TeamRepo;
