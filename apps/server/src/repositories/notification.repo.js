const { docClient } = require('../config/db.config');
const { PutCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { client } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = "Notifications";

/**
 * Đảm bảo bảng Notifications tồn tại với đúng thiết kế:
 *   PK: userId (String)
 *   SK: id     (String / UUID)
 */
async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log('[DynamoDB] 📦 Tạo bảng Notifications...');
      await client.send(new CreateTableCommand({
        TableName: TABLE_NAME,
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'id', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'id', AttributeType: 'S' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      console.log('[DynamoDB] ✅ Bảng Notifications đã được tạo!');
    }
  }
}

ensureTable();

const NotificationRepo = {
  /**
   * Tạo thông báo mới
   * @param {Object} data { userId, title, message, type, link }
   */
  createNotification: async (data) => {
    if (!data.userId) {
      console.warn('[Notification] ⚠️  Bỏ qua thông báo không có userId');
      return null;
    }
    const item = {
      userId: data.userId,          // PK
      id: uuidv4(),                 // SK
      title: data.title,
      message: data.message,
      type: data.type || 'SYSTEM',
      isRead: false,
      link: data.link || '',
      createdAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return item;
  },

  /**
   * Lấy danh sách thông báo của 1 user (mới nhất lên đầu)
   * Query theo PK = userId, SortKey = id (sắp xếp theo createdAt qua ScanIndexForward=false)
   */
  getNotificationsByUser: async (userId, limit = 50) => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false,  // Mới nhất lên đầu (SK=id/UUID thường tăng dần theo thời gian)
      Limit: limit
    });

    try {
      const response = await docClient.send(command);
      // Sắp xếp lại theo createdAt giảm dần (chắc chắn đúng thứ tự)
      const items = response.Items || [];
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return items;
    } catch (error) {
      console.error('[DynamoDB Notification] ❌ getNotificationsByUser:', error.message);
      return [];
    }
  },

  /**
   * Đánh dấu 1 thông báo là đã đọc
   * Cần cả PK (userId) và SK (id) để update đúng item
   */
  markAsRead: async (userId, notificationId) => {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,           // PK
        id: notificationId  // SK
      },
      UpdateExpression: 'SET isRead = :val',
      ExpressionAttributeValues: { ':val': true },
      ReturnValues: 'ALL_NEW'
    });
    try {
      const res = await docClient.send(command);
      return res.Attributes;
    } catch (error) {
      console.error('[DynamoDB Notification] ❌ markAsRead:', error.message);
      return null;
    }
  },

  /**
   * Lấy số lượng thông báo chưa đọc của user
   */
  getUnreadCount: async (userId) => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :uid',
      FilterExpression: 'isRead = :falseVal',
      ExpressionAttributeValues: {
        ':uid': userId,
        ':falseVal': false
      },
      Select: 'COUNT'
    });
    try {
      const response = await docClient.send(command);
      return response.Count || 0;
    } catch (error) {
      console.error('[DynamoDB Notification] ❌ getUnreadCount:', error.message);
      return 0;
    }
  }
};

module.exports = NotificationRepo;
