/**
 * Script chuyển đổi bảng Notifications sang thiết kế đúng
 * PK: userId, SK: id (UUID)
 * 
 * Cách chạy: node apps/server/migrate_notifications.js
 */
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, DeleteTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb')

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' }
})
const docClient = DynamoDBDocumentClient.from(client)

const TABLE = 'Notifications'
const TABLE_BACKUP = 'Notifications_backup'

async function tableExists(name) {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }))
    return true
  } catch (e) {
    return false
  }
}

async function createTable(name) {
  await client.send(new CreateTableCommand({
    TableName: name,
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'id', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'id', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  }))
  console.log(`✅ Đã tạo bảng: ${name}`)
  // Đợi bảng active
  await new Promise(res => setTimeout(res, 2000))
}

async function run() {
  // 1. Kiểm tra bảng cũ
  const exists = await tableExists(TABLE)
  let oldItems = []

  if (exists) {
    console.log(`📦 Bảng ${TABLE} tồn tại, đang quét dữ liệu cũ...`)
    const scan = await docClient.send(new ScanCommand({ TableName: TABLE }))
    oldItems = scan.Items || []
    console.log(`📋 Tìm thấy ${oldItems.length} thông báo cũ`)

    // Backup
    const backupExists = await tableExists(TABLE_BACKUP)
    if (!backupExists) await createTable(TABLE_BACKUP)
    for (const item of oldItems) {
      if (!item.userId) item.userId = 'unknown'
      await docClient.send(new PutCommand({ TableName: TABLE_BACKUP, Item: item }))
    }
    console.log(`✅ Đã backup ${oldItems.length} item vào ${TABLE_BACKUP}`)

    // Xóa bảng cũ
    await client.send(new DeleteTableCommand({ TableName: TABLE }))
    console.log(`🗑️ Đã xóa bảng cũ ${TABLE}`)
    await new Promise(res => setTimeout(res, 3000))
  }

  // 2. Tạo bảng mới với thiết kế đúng
  console.log(`🏗️ Đang tạo bảng ${TABLE} với thiết kế mới (PK: userId, SK: id)...`)
  await createTable(TABLE)

  // 3. Migrate data cũ
  if (oldItems.length > 0) {
    console.log(`🔄 Đang migrate ${oldItems.length} item sang bảng mới...`)
    for (const item of oldItems) {
      if (!item.userId) {
        console.log(`⚠️  Bỏ qua item không có userId: ${item.id}`)
        continue
      }
      await docClient.send(new PutCommand({ TableName: TABLE, Item: item }))
    }
    console.log(`✅ Migrate hoàn tất!`)
  }

  console.log(`
🎉 XONG! Bảng ${TABLE} đã được cập nhật với thiết kế mới:
   - PK: userId (String)
   - SK: id (String / UUID)
   - Data cũ đã được migrate an toàn
  `)
}

run().catch(err => {
  console.error('❌ Lỗi:', err.message)
  process.exit(1)
})
