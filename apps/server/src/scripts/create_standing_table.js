const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");

// Cấu hình Client khớp hoàn toàn với môi trường Local Docker của đại ca
const client = new DynamoDBClient({ 
    region: "local", 
    endpoint: "http://localhost:8000", 
    credentials: {
        accessKeyId: "fakeMyKeyId",
        secretAccessKey: "fakeSecretAccessKey"
    }
});

const createStandingTable = async () => {
    const params = {
        TableName: "PhuiScore_Standings",
        // Định nghĩa các thuộc tính dùng làm Key
        AttributeDefinitions: [
            { AttributeName: "tournamentId", AttributeType: "N" }, // ID Giải đấu (Number)
            { AttributeName: "seasonId", AttributeType: "N" }     // ID Mùa giải (Number)
        ],
        // Cấu trúc Key chính
        KeySchema: [
            { AttributeName: "tournamentId", KeyType: "HASH" }, // Partition Key
            { AttributeName: "seasonId", KeyType: "RANGE" }     // Sort Key
        ],
        ProvisionedThroughput: { 
            ReadCapacityUnits: 5, 
            WriteCapacityUnits: 5 
        }
    };

    try {
        const data = await client.send(new CreateTableCommand(params));
        console.log("--- CHÚC MỪNG CHUNG ĐẠI CA ---");
        console.log("Bảng PhuiScore_Standings đã được tạo thành công:", data.TableDescription.TableStatus);
    } catch (err) {
        if (err.name === 'ResourceInUseException') {
            console.log("⚠️ Bảng PhuiScore_Standings này có rồi nhé đại ca!");
        } else {
            console.error("❌ Lỗi tạo bảng rồi đại ca ơi:", err);
        }
    }
};

createStandingTable();