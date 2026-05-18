require('dotenv').config();
const { ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { client, docClient } = require('./src/config/db.config');

async function diagnose() {
    console.log('🔍 Đang kiểm tra kết nối AWS DynamoDB...');
    try {
        const listTables = await client.send(new ListTablesCommand({}));
        console.log('📂 Các bảng đang có trên AWS:', listTables.TableNames);

        for (const tableName of listTables.TableNames) {
            console.log(`\n--- Kiểm tra bảng: ${tableName} ---`);
            const sample = await docClient.send(new ScanCommand({ 
                TableName: tableName,
                Limit: 1
            }));
            if (sample.Items && sample.Items.length > 0) {
                console.log('✅ Có dữ liệu! Bản ghi mẫu:', JSON.stringify(sample.Items[0], null, 2));
            } else {
                console.log('❌ Bảng này đang trống.');
            }
        }
    } catch (e) {
        console.error('❌ Lỗi kết nối AWS:', e.message);
    }
}

diagnose();
