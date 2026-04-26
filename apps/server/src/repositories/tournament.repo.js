const {
  PutCommand, GetCommand, QueryCommand, ScanCommand, DeleteCommand, UpdateCommand
} = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { docClient, client } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

// Thêm try-catch khi require để tránh lỗi nếu thư viện chưa kịp cài
let unmarshall = (data) => data; 
try {
  const util = require("@aws-sdk/util-dynamodb");
  unmarshall = util.unmarshall;
} catch (e) {
  console.error('[Warning] @aws-sdk/util-dynamodb not found');
}

const TABLE = "PhuiScore_Tournaments";

async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE }));
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      await client.send(new CreateTableCommand({
        TableName: TABLE,
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
      }));
    }
  }
}
ensureTable();

const TournamentRepo = {
  create: async (data) => {
    const id = uuidv4();
    const now = Date.now();
    const item = { id, ...data, status: data.status || 'Registration', teams: [], createdAt: now, updatedAt: now };
    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  },

  getAll: async ({ status, region, search } = {}) => {
    try {
      const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
      let items = result.Items || [];
      if (status && status !== 'all') items = items.filter(i => i.status === status);
      if (region && region !== 'all') items = items.filter(i => i.region === region);
      if (search) {
        const q = search.toLowerCase();
        items = items.filter(i => i.name?.toLowerCase().includes(q) || i.region?.toLowerCase().includes(q));
      }
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return items;
    } catch (e) { return []; }
  },

  getById: async (id) => {
    try {
      const result = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id: String(id) } }));
      if (!result.Item) return null;

      const item = result.Item;
      // LOGIC GIẢI MÃ AN TOÀN
      if (item.standings && Array.isArray(item.standings)) {
        const cleanStandings = item.standings.map(s => {
          if (s && s.M) {
            try { return unmarshall(s); } catch (e) { return s; }
          }
          return s;
        });
        return { ...item, standings: cleanStandings };
      }
      return item;
    } catch (err) {
      console.error('[TournamentRepo getById Error]', err.message);
      return null; // Trả về null thay vì văng lỗi 500
    }
  },

  update: async (id, updates) => {
    const updateExpressions = [];
    const attrNames = {};
    const attrValues = {};
    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id') continue;
      updateExpressions.push(`#${key} = :${key}`);
      attrNames[`#${key}`] = key;
      attrValues[`:${key}`] = val;
    }
    attrNames['#updatedAt'] = 'updatedAt';
    attrValues[':updatedAt'] = Date.now();
    updateExpressions.push('#updatedAt = :updatedAt');

    const params = {
      TableName: TABLE,
      Key: { id: String(id) },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
      ReturnValues: 'ALL_NEW',
    };
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  },

  delete: async (id) => {
    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { id: String(id) } }));
    return true;
  },

  updateStandings: async (tournamentId, standings, extra = {}) => {
    const id = String(tournamentId);
    const existing = await TournamentRepo.getById(id);
    const item = {
      id,
      name: extra.name || (existing ? existing.name : `Giải đấu ${id}`),
      logo: extra.logo || (existing ? existing.logo : null),
      status: 'Ongoing',
      standings: standings,
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  },
};

module.exports = TournamentRepo;
