const {
  PutCommand, GetCommand, ScanCommand, DeleteCommand, UpdateCommand, QueryCommand
} = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { docClient, client } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

const TABLE = "PhuiScore_TeamMembers";

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
          { AttributeName: 'teamId', AttributeType: 'S' },
          { AttributeName: 'shirtNumber', AttributeType: 'N' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'TeamIndex',
            KeySchema: [
              { AttributeName: 'teamId', KeyType: 'HASH' },
              { AttributeName: 'shirtNumber', KeyType: 'RANGE' }
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

const TeamMemberRepo = {
  create: async (data, teamId) => {
    const id = `member_${uuidv4()}`;
    const now = Date.now();
    const item = {
      id,
      teamId,
      playerId: data.playerId || null, // ID tài khoản User thật (nếu link)
      
      // Basic info (denormalized if playerId exists, or pure manual if not)
      name: data.name,
      avatar: data.avatar || null,
      birthYear: data.birthYear || null,
      height: data.height || null,
      weight: data.weight || null,
      hometown: data.hometown || null,
      phone: data.phone || null,
      // idCard: data.idCard || null,
      
      // Team specific info
      shirtNumber: data.shirtNumber || data.number || null, // map old field "number"
      position: data.position || null,
      role: data.role || 'player', // player, captain, vice_captain, coach
      status: data.status || 'active', // active, suspended, injured
      joinDate: data.joinDate || now,
      leaveDate: data.leaveDate || null,

      createdAt: now,
      updatedAt: now,
    };
    
    // Clean nulls for DynamoDB
    Object.keys(item).forEach(key => item[key] === null && delete item[key]);

    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  },

  getByTeamId: async (teamId) => {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'TeamIndex',
      KeyConditionExpression: 'teamId = :teamId',
      ExpressionAttributeValues: { ':teamId': teamId },
      ScanIndexForward: true // Sắp xếp tăng dần theo shirtNumber (Sort Key)
    }));
    return result.Items || [];
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
      // Bỏ qua field hệ thống
      if (key === 'id' || key === 'createdAt' || key === 'teamId') continue;
      if (val === undefined) continue;

      let processedVal = val;

      // Parse shirtNumber và birthYear thành number (DynamoDB GSI sort key kiểu N)
      if (key === 'shirtNumber' || key === 'birthYear') {
        if (val === '' || val === null) continue; // Bỏ qua nếu rỗng
        const parsed = Number(val);
        if (!isNaN(parsed)) processedVal = parsed;
        else continue; // Bỏ qua nếu không parse được
      }

      // Bỏ qua empty string (DynamoDB không cho phép empty string trên index)
      if (processedVal === '') continue;

      expAttrNames[`#${key}`] = key;
      expAttrValues[`:${key}`] = processedVal;
      updateExps.push(`#${key} = :${key}`);
    }

    if (updateExps.length === 0) return null;

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

module.exports = TeamMemberRepo;
