const { docClient, client } = require('../config/db.config');
const { PutCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Users` : "PhuiScore_Users";

async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`[DynamoDB] 📦 Tạo table ${TABLE_NAME}...`);
      await client.send(new CreateTableCommand({
        TableName: TABLE_NAME,
        KeySchema: [
          { AttributeName: 'username', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'username', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      console.log(`[DynamoDB] ✅ Table ${TABLE_NAME} đã được tạo thành công!`);
    }
  }
}

ensureTable();

const UserRepo = {
    createUser: async (userData) => {
        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                role: 'user', // Default fallback
                ...userData
            },
        });
        return await docClient.send(command);
    },

    findUserByUsername: async (username) => {
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: { username },
        });
        const response = await docClient.send(command);
        return response.Item;
    },

    // --- CẢI TIẾN: Tăng sử dụng an toàn ---
    incrementUsage: async (username, field) => {
        const command = new UpdateCommand({
            TableName: "Users",
            Key: { username },
            // Sử dụng if_not_exists để tránh lỗi nếu trường đó chưa có giá trị khởi tạo
            UpdateExpression: `SET usage.#f = if_not_exists(usage.#f, :zero) + :val`,
            ExpressionAttributeNames: {
                "#f": field // field ở đây là 'matchesCreated' hoặc 'leaguesCreated'
            },
            ExpressionAttributeValues: {
                ":val": 1,
                ":zero": 0
            },
            ReturnValues: "UPDATED_NEW"
        });
        return await docClient.send(command);
    }
};

module.exports = UserRepo;