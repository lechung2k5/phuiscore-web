const {
  PutCommand, GetCommand, ScanCommand, DeleteCommand, UpdateCommand, QueryCommand
} = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { docClient, client } = require('../config/db.config');

const TABLE = "PhuiScore_ExternalNews";

// ─── Tự động tạo table với GSI nếu chưa tồn tại ────────────────────────────
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
          { AttributeName: 'slug', AttributeType: 'S' },
          { AttributeName: 'status', AttributeType: 'S' }, // For filtering published news
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'SlugIndex',
            KeySchema: [{ AttributeName: 'slug', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
          },
          {
            IndexName: 'StatusIndex', // Để query tin tức theo status và sort
            KeySchema: [
              { AttributeName: 'status', KeyType: 'HASH' },
              { AttributeName: 'id', KeyType: 'RANGE' } // Dùng id làm range key tạm hoặc timestamp
            ],
            Projection: { ProjectionType: 'ALL' },
          }
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      console.log(`[DynamoDB] ✅ Table ${TABLE} đã được tạo thành công!`);
    }
  }
}

ensureTable();

const NewsRepo = {
  /**
   * Lưu hoặc cập nhật tin tức (dựa vào ID từ WP)
   */
  upsert: async (item) => {
    const now = Date.now();
    const data = {
      ...item,
      status: 'published', // uniform status for indexing
      updatedAt: now,
      createdAt: item.createdAt || now
    };
    await docClient.send(new PutCommand({ TableName: TABLE, Item: data }));
    return data;
  },

  /**
   * Lấy chi tiết bằng Slug qua GSI
   */
  getBySlug: async (slug) => {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'SlugIndex',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: { ':slug': slug },
      Limit: 1
    }));
    return result.Items?.[0] || null;
  },

  /**
   * Lấy danh sách tin tức (có phân trang)
   * Lưu ý: DynamoDB Scan pagination khá đắt, nhưng với tin tức có limit thì tạm ổn
   * Tối ưu: Dùng GSI StatusIndex để query và sort theo ID (ID sinh từ timestamp giảm dần)
   */
  getList: async ({ page = 1, limit = 10 } = {}) => {
    // Để tối ưu lấy tin mới nhất, ta nên Scan toàn bộ rồi sort trong app (nếu DB nhỏ)
    // Thực tế với DynamoDB: dùng StatusIndex
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE,
    }));
    
    let items = result.Items || [];
    
    // Sort theo thời gian xuất bản giảm dần (mới nhất lên đầu)
    items.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    
    const total = items.length;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);
    
    return { data: paginatedItems, total };
  },

  /**
   * Tính năng mở rộng: get related news
   */
  getRelated: async (slug, limit = 4) => {
    const all = await NewsRepo.getList({ page: 1, limit: limit + 5 });
    const related = all.data.filter(i => i.slug !== slug).slice(0, limit);
    return related;
  }
};

module.exports = NewsRepo;
