const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");

// Cấu hình Client "Vjp Pro"
const client = new DynamoDBClient({ 
    region: "local", // Đổi thành local cho chắc
    endpoint: "http://localhost:8000", // BẮT BUỘC phải có dòng này
    credentials: {
        accessKeyId: "fakeMyKeyId",
        secretAccessKey: "fakeSecretAccessKey"
    }
});

const createTable = async () => {
    const params = {
        TableName: "PhuiScore_Matches",
        // Định nghĩa các thuộc tính dùng làm Key
        AttributeDefinitions: [
            { AttributeName: "pk", AttributeType: "S" }, // DATE#2026-02-14
            { AttributeName: "sk", AttributeType: "S" }, // MATCH#13981670
            { AttributeName: "gsi1_pk", AttributeType: "S" }, // TOURNAMENT#23
            { AttributeName: "startTimestamp", AttributeType: "N" } // Để sort theo thời gian
        ],
        // Cấu trúc Key chính
        KeySchema: [
            { AttributeName: "pk", KeyType: "HASH" }, // Partition Key
            { AttributeName: "sk", KeyType: "RANGE" } // Sort Key
        ],
        // Cấu trúc Index phụ (GSI) để tìm theo Giải đấu
        GlobalSecondaryIndexes: [
            {
                IndexName: "TournamentIndex",
                KeySchema: [
                    { AttributeName: "gsi1_pk", KeyType: "HASH" },
                    { AttributeName: "startTimestamp", KeyType: "RANGE" }
                ],
                Projection: { ProjectionType: "ALL" },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
            }
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    };

    try {
        const data = await client.send(new CreateTableCommand(params));
        console.log("--- CHÚC MỪNG ĐẠI CA ---");
        console.log("Bảng PhuiScore_Matches đã được tạo thành công:", data.TableDescription.TableStatus);
    } catch (err) {
        console.error("Lỗi tạo bảng rồi đại ca ơi:", err);
    }
};

createTable();