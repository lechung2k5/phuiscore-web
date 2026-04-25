const { CreateTableCommand } = require("@aws-sdk/client-dynamodb");
const docClient = require("./src/repositories/db.config");

const init = async () => {
    const userTable = {
        TableName: "Users",
        KeySchema: [{ AttributeName: "username", KeyType: "HASH" }], // Dùng username làm khóa chính để dễ tìm kiếm
        AttributeDefinitions: [{ AttributeName: "username", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    };

    try {
        await docClient.send(new CreateTableCommand(userTable));
        console.log("✅ Đã tạo bảng Users thành công!");
    } catch (err) {
        console.log("⚠️ Bảng đã tồn tại hoặc có lỗi:", err.message);
    }
};

init();