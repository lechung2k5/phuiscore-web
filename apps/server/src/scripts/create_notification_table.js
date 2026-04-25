const { CreateTableCommand } = require("@aws-sdk/client-dynamodb");
const { client } = require("../config/db.config");

const createNotificationTable = async () => {
    const params = {
        TableName: "Notifications",
        KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },  // Partition key
            { AttributeName: "id", KeyType: "RANGE" },    // Sort key
        ],
        AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
            { AttributeName: "userId", AttributeType: "S" },
            { AttributeName: "createdAt", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "userId-createdAt-index",
                KeySchema: [
                    { AttributeName: "userId", KeyType: "HASH" },
                    { AttributeName: "createdAt", KeyType: "RANGE" },
                ],
                Projection: {
                    ProjectionType: "ALL",
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    };

    try {
        const command = new CreateTableCommand(params);
        const data = await client.send(command);
        console.log("✅ Tạo bảng Notifications thành công:", data.TableDescription.TableName);
    } catch (err) {
        if (err.name === 'ResourceInUseException') {
            console.log("⚠️ Bảng Notifications đã tồn tại.");
        } else {
            console.error("❌ Lỗi khi tạo bảng Notifications:", err);
        }
    }
};

createNotificationTable();
