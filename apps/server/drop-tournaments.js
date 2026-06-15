require('dotenv').config();
const { DynamoDBClient, ScanCommand, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");

const isLocal = process.env.NODE_ENV !== 'production';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-southeast-1",
    endpoint: isLocal ? (process.env.DYNAMODB_ENDPOINT || "http://localhost:8000") : undefined,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local"
    }
});

const TABLES = [
    "PhuiScore_Tournaments",
    "PhuiScore_Matches",
    "PhuiScore_Teams",
    "PhuiScore_Standings"
];

async function dropTournamentsData() {
    try {
        for (const tableName of TABLES) {
            console.log(`Scanning table ${tableName}...`);
            let hasMore = true;
            let exclusiveStartKey = undefined;
            let deletedCount = 0;

            while (hasMore) {
                const scanCommand = new ScanCommand({
                    TableName: tableName,
                    ExclusiveStartKey: exclusiveStartKey
                });
                
                const response = await client.send(scanCommand).catch(err => {
                    console.log(`Table ${tableName} might not exist: ${err.message}`);
                    return { Items: [] };
                });
                
                const items = response.Items || [];
                
                for (const item of items) {
                    const pk = item.pk ? item.pk.S : item.id ? item.id.S : undefined;
                    const sk = item.sk ? item.sk.S : undefined;
                    
                    if (!pk) continue;

                    const deleteParams = {
                        TableName: tableName,
                        Key: {
                            ...(item.pk ? { pk: { S: pk } } : { id: { S: pk } })
                        }
                    };
                    
                    if (sk) {
                        deleteParams.Key.sk = { S: sk };
                    }
                    
                    await client.send(new DeleteItemCommand(deleteParams));
                    deletedCount++;
                }
                
                exclusiveStartKey = response.LastEvaluatedKey;
                if (!exclusiveStartKey) hasMore = false;
            }
            console.log(`✅ Successfully deleted ${deletedCount} items from ${tableName}.`);
        }
    } catch (error) {
        console.error("Error dropping data:", error);
    }
}

dropTournamentsData();
