const {
  PutCommand, QueryCommand, ScanCommand, DeleteCommand
} = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { docClient, client } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

const TABLE = "PhuiScore_AuditLogs";

async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE }));
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      await client.send(new CreateTableCommand({
        TableName: TABLE,
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'N' },
          { AttributeName: 'entityId', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'EntityIndex',
            KeySchema: [
              { AttributeName: 'entityId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' }
          }
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }));
    }
  }
}
ensureTable();

const AuditLogRepo = {
  log: async ({ userId, action, entityType, entityId, oldValue, newValue, note }) => {
    const id = uuidv4();
    const timestamp = Date.now();
    const item = {
      id,
      timestamp,
      userId,
      action, // e.g., 'UPDATE_SCORE', 'CREATE_TOURNAMENT'
      entityType, // e.g., 'MATCH', 'TOURNAMENT'
      entityId,
      oldValue,
      newValue,
      note
    };
    try {
      await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
      return item;
    } catch (e) {
      console.error('[AuditLog Error]', e);
      return null;
    }
  },

  getByEntity: async (entityId) => {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE,
        IndexName: 'EntityIndex',
        KeyConditionExpression: 'entityId = :eid',
        ExpressionAttributeValues: { ':eid': String(entityId) },
        ScanIndexForward: false // Latest first
      }));
      return result.Items || [];
    } catch (e) {
      return [];
    }
  },

  getRecent: async (limit = 50) => {
    try {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLE,
        Limit: limit
      }));
      return (result.Items || []).sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      return [];
    }
  }
};

module.exports = AuditLogRepo;
