require('dotenv').config({ path: './apps/server/.env' });
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
});
const docClient = DynamoDBDocumentClient.from(client);

async function run() {
    console.log('Fetching tournaments...');
    const tRes = await docClient.send(new ScanCommand({TableName: 'PhuiScore_Tournaments'}));
    const teamsMap = {};
    for (const t of tRes.Items) {
        if (!t.teams) continue;
        for (const team of t.teams) {
            // Use either teamId or fallback to exact name matching
            if (team.id) teamsMap[team.id] = team.playerBannerUrl;
            teamsMap[team.teamName] = team.playerBannerUrl; 
        }
    }

    console.log('Fetching matches...');
    const mRes = await docClient.send(new ScanCommand({TableName: 'PhuiScore_Matches'}));
    for (const m of mRes.Items) {
        let updated = false;
        
        // Update home team banner
        if (m.homeTeam && m.homeTeam.name) {
            const newBanner = teamsMap[m.homeTeam.id] || teamsMap[m.homeTeam.name];
            if (newBanner && m.homeTeam.playerBannerUrl !== newBanner) {
                m.homeTeam.playerBannerUrl = newBanner;
                updated = true;
            }
        }
        
        // Update away team banner
        if (m.awayTeam && m.awayTeam.name) {
            const newBanner = teamsMap[m.awayTeam.id] || teamsMap[m.awayTeam.name];
            if (newBanner && m.awayTeam.playerBannerUrl !== newBanner) {
                m.awayTeam.playerBannerUrl = newBanner;
                updated = true;
            }
        }

        if (updated) {
            console.log(`Updating Match ${m.id} (${m.homeTeam?.name} vs ${m.awayTeam?.name}) with new banner URLs...`);
            await docClient.send(new UpdateCommand({
                TableName: 'PhuiScore_Matches',
                Key: { pk: m.pk, sk: m.sk },
                UpdateExpression: 'SET homeTeam = :ht, awayTeam = :at',
                ExpressionAttributeValues: { ':ht': m.homeTeam, ':at': m.awayTeam }
            }));
            console.log(`Match ${m.id} successfully updated!`);
        }
    }
    console.log('Done syncing matches.');
}

run().catch(console.error);
