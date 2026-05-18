const {
  PutCommand, GetCommand, ScanCommand, DeleteCommand, UpdateCommand, QueryCommand
} = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { docClient, client } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

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
  },

  getAll: async () => {
    try {
      const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
      return result.Items || [];
    } catch (e) {
      console.error('[NewsRepo GetAll Error]', e);
      return [];
    }
  },

  create: async (data) => {
    const id = `news_${uuidv4()}`;
    const now = Date.now();
    
    // Create simple slug if not provided
    let slug = data.slug;
    if (!slug && data.title) {
        slug = data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        slug = `${slug}-${Math.floor(Math.random() * 10000)}`;
    }

    const item = {
      id,
      title: data.title,
      slug: slug,
      summary: data.summary || '',
      content: data.content || '',
      thumbnail: data.thumbnail || '',
      author: data.author || 'Admin',
      status: data.status || 'published',
      published_at: data.published_at || new Date().toISOString(),
      createdAt: now,
      updatedAt: now,
      isCustom: true
    };
    
    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  },

  update: async (id, updates) => {
    const expAttrNames = {};
    const expAttrValues = {};
    const updateExps = [];

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
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

module.exports = NewsRepo;
