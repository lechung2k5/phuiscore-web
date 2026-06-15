require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const docClient = DynamoDBDocumentClient.from(client);

async function run() {
    const q = new QueryCommand({
        TableName: 'PhuiScore',
        IndexName: "GSI1",
        KeyConditionExpression: "gsi1_pk = :tid",
        ExpressionAttributeValues: { ":tid": "TOURNAMENT#9999" }
    });
    const res = await docClient.send(q);
    console.log(`Found ${res.Items.length} matches`);
    
    for (let item of res.Items) {
        let changed = false;
        if (item.homeTeam && item.homeTeam.logo && item.homeTeam.logo.includes('dicebear.com')) {
            item.homeTeam.logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.homeTeam.shortName)}&background=0D8ABC&color=fff&size=200`;
            changed = true;
        }
        if (item.awayTeam && item.awayTeam.logo && item.awayTeam.logo.includes('dicebear.com')) {
            item.awayTeam.logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.awayTeam.shortName)}&background=ff4500&color=fff&size=200`;
            changed = true;
        }
        if (changed) {
            await docClient.send(new PutCommand({
                TableName: 'PhuiScore',
                Item: item
            }));
            console.log(`Updated logos for match ${item.id}`);
        }
    }
    console.log("Done");
}
run();
