const {
  PutCommand, GetCommand, QueryCommand, ScanCommand, DeleteCommand, UpdateCommand
} = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const { docClient, client } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

const TABLE = "PhuiScore_Tournaments";

// ─── Tự động tạo table nếu chưa tồn tại ────────────────────────────
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
      console.log(`[DynamoDB] ✅ Table ${TABLE} đã được tạo thành công!`);
    }
  }
}

ensureTable();

const TournamentRepo = {
  create: async (data) => {
    const id = uuidv4();
    const now = Date.now();
    const item = {
      id,
      ...data,
      status: data.status || 'Registration',
      teams: [],
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  },

  getAll: async ({ status, region, search } = {}) => {
    const params = { TableName: TABLE };
    const result = await docClient.send(new ScanCommand(params));
    let items = result.Items || [];

    if (status && status !== 'all') items = items.filter(i => i.status === status);
    if (region && region !== 'all') items = items.filter(i => i.region === region);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => i.name?.toLowerCase().includes(q) || i.region?.toLowerCase().includes(q));
    }
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return items;
  },

  getById: async (id) => {
    const result = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    if (!result.Item) return null;

    const item = result.Item;
    // GIẢI MÃ DYNAMODB JSON: Nếu standings chứa các Map { M: ... }
    if (item.standings && Array.isArray(item.standings) && item.standings.length > 0 && item.standings[0].M) {
      try {
        const cleanStandings = item.standings.map(s => unmarshall(s));
        return { ...item, standings: cleanStandings };
      } catch (e) {
        console.error('[Unmarshall Error]', e);
        return item;
      }
    }
    return item;
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
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
      ReturnValues: 'ALL_NEW',
    };
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  },

  delete: async (id) => {
    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
    return true;
  },

  registerTeam: async (tournamentId, teamData) => {
    const tournament = await TournamentRepo.getById(tournamentId);
    if (!tournament) throw new Error('Giải đấu không tồn tại');
    const teams = [...(tournament.teams || []), { ...teamData, id: `team_${Date.now()}`, appliedAt: Date.now(), status: 'Pending' }];
    return TournamentRepo.update(tournamentId, { teams });
  },

  updateStandings: async (tournamentId, standings, extra = {}) => {
    const tournamentIdStr = String(tournamentId);
    const existing = await TournamentRepo.getById(tournamentIdStr);
    const item = {
      id: tournamentIdStr,
      name: extra.name || (existing ? existing.name : `Giải đấu ${tournamentIdStr}`),
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
