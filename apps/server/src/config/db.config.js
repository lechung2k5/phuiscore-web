const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const isLocal = process.env.NODE_ENV !== 'production';

const client = new DynamoDBClient({
    // Lưu ý: region chuẩn của Singapore thường là ap-southeast-1 nhé Chung
    region: "ap-southeast-1", 
    endpoint: isLocal ? "http://localhost:8000" : undefined,
    credentials: isLocal ? { accessKeyId: "local", secretAccessKey: "local" } : undefined
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Export cả hai để dùng cho cả tạo bảng và thao tác dữ liệu
module.exports = { client, docClient };