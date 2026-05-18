const { docClient, client } = require('../config/db.config');
const { PutCommand, GetCommand, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
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

    // Tìm user theo email (Scan vì email không phải partition key)
    findUserByEmail: async (email) => {
        const command = new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email },
            Limit: 1,
        });
        const response = await docClient.send(command);
        return response.Items?.[0] || null;
    },

    // Cập nhật trạng thái tài khoản (ACTIVE, PENDING_VERIFY, BANNED, SUSPENDED)
    updateUserStatus: async (username, status) => {
        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { username },
            UpdateExpression: 'SET #st = :status',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: { ':status': status },
        });
        return await docClient.send(command);
    },

    // Cập nhật mật khẩu đã hash
    updateUserPassword: async (username, hashedPassword) => {
        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { username },
            UpdateExpression: 'SET #pw = :password',
            ExpressionAttributeNames: { '#pw': 'password' },
            ExpressionAttributeValues: { ':password': hashedPassword },
        });
        return await docClient.send(command);
    },

    // Lưu OTP vào DB (kèm thời gian hết hạn - dùng làm backup)
    upsertOtp: async (username, otpType, otp, expiresAt) => {
        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { username },
            UpdateExpression: 'SET otpData = :otpData',
            ExpressionAttributeValues: {
                ':otpData': { type: otpType, code: otp, expiresAt }
            },
        });
        return await docClient.send(command);
    },

    // Xóa OTP sau khi đã dùng
    clearOtp: async (username) => {
        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { username },
            UpdateExpression: 'REMOVE otpData',
        });
        return await docClient.send(command);
    },

    // Tăng số lần sử dụng tính năng của user
    incrementUsage: async (username, field) => {
        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { username },
            UpdateExpression: `SET usage.#f = if_not_exists(usage.#f, :zero) + :val`,
            ExpressionAttributeNames: {
                "#f": field
            },
            ExpressionAttributeValues: {
                ":val": 1,
                ":zero": 0
            },
            ReturnValues: "UPDATED_NEW"
        });
        return await docClient.send(command);
    },

    // Lưu Session ID vào DB (backup bên cạnh Redis)
    updateUserSession: async (username, sessionId) => {
        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { username },
            UpdateExpression: "SET currentSessionId = :sid",
            ExpressionAttributeValues: {
                ":sid": sessionId
            }
        });
        return await docClient.send(command);
    },

    updateUserProfile: async (username, profileData) => {
        const entries = Object.entries(profileData).filter(([, value]) => value !== undefined);
        if (entries.length === 0) {
            return { Attributes: {} };
        }

        const ExpressionAttributeNames = {};
        const ExpressionAttributeValues = {};
        const setExpressions = [];

        entries.forEach(([field, value], index) => {
            const nameKey = `#f${index}`;
            const valueKey = `:v${index}`;
            ExpressionAttributeNames[nameKey] = field;
            ExpressionAttributeValues[valueKey] = value;
            setExpressions.push(`${nameKey} = ${valueKey}`);
        });

        ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
        ExpressionAttributeValues[':updatedAt'] = new Date().toISOString();
        setExpressions.push('#updatedAt = :updatedAt');

        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { username },
            UpdateExpression: `SET ${setExpressions.join(', ')}`,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        });
        return await docClient.send(command);
    }
};

module.exports = UserRepo;
