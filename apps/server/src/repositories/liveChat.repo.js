const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = "PhuiScore_LiveChats";

const LiveChatRepo = {
    /**
     * Lưu tin nhắn mới vào DB
     */
    async saveMessage({ matchId, userId, username, avatar, role, message }) {
        const id = uuidv4();
        const timestamp = Date.now();
        // Tính năng TTL: tự động xóa sau 7 ngày (7 * 24 * 60 * 60 giây)
        const expiresAt = Math.floor(timestamp / 1000) + (7 * 24 * 60 * 60);

        const chatItem = {
            id,
            matchId,
            timestamp,
            userId,
            username,
            avatar,
            role,
            message,
            expiresAt // Cần bật TTL trên AWS Console cho field này
        };

        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: chatItem
        });

        await docClient.send(command);
        return chatItem;
    },

    /**
     * Lấy danh sách tin nhắn gần nhất của phòng
     */
    async getRecentMessages(matchId, limit = 50) {
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "matchId = :matchId",
            ExpressionAttributeValues: {
                ":matchId": matchId
            },
            ScanIndexForward: false, // Sắp xếp giảm dần (mới nhất lên đầu)
            Limit: limit
        });

        const response = await docClient.send(command);
        // Trả về mảng đảo ngược để tin cũ nằm trên, tin mới nằm dưới (theo chuẩn UI chat)
        return (response.Items || []).reverse();
    }
};

module.exports = LiveChatRepo;
