require('dotenv').config({ path: './apps/server/.env' });
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
});

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
});
const docClient = DynamoDBDocumentClient.from(client);

const BUCKET = process.env.S3_BUCKET_NAME;

async function run() {
    const data = JSON.parse(fs.readFileSync('excel_updates_all.json', 'utf8'));
    const idMap = new Map();
    const nameMap = new Map();

    console.log(`Found ${data.length} records. Uploading images to S3...`);
    
    for (const m of data) {
        if (m.local_image && fs.existsSync(m.local_image)) {
            const filename = path.basename(m.local_image);
            const s3Key = `tournaments/avatars/${filename}`; // Or teams/avatars
            const fileBuffer = fs.readFileSync(m.local_image);
            
            await s3.send(new PutObjectCommand({
                Bucket: BUCKET,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: 'image/jpeg'
            }));
            
            const s3Url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
            m.avatar = s3Url;
            console.log(`Uploaded: ${m.name} -> ${s3Url}`);
        }
        
        if (m.avatar) idMap.set(m.member_id, m.avatar);
        if (m.name) nameMap.set(m.member_id, m.name);
    }
    
    console.log('Updating TeamMembers table...');
    for (const m of data) {
        const expr = [];
        const attrs = {};
        if (m.avatar) {
            expr.push('avatar = :avatar');
            attrs[':avatar'] = m.avatar;
        }
        if (m.name) {
            expr.push('#n = :name');
            attrs[':name'] = m.name;
        }
        
        if (expr.length > 0) {
            const params = {
                TableName: 'PhuiScore_TeamMembers',
                Key: { id: m.member_id },
                UpdateExpression: 'SET ' + expr.join(', '),
                ExpressionAttributeValues: attrs
            };
            if (m.name) {
                params.ExpressionAttributeNames = { '#n': 'name' };
            }
            try {
                await docClient.send(new UpdateCommand(params));
            } catch (e) {
                console.log(`Error updating TeamMembers ${m.member_id}: ${e.message}`);
            }
        }
    }

    console.log('Syncing to Tournaments table...');
    const scanRes = await docClient.send(new ScanCommand({TableName: 'PhuiScore_Tournaments'}));
    
    for (const t of scanRes.Items) {
        let updated = false;
        const oldNameToNewName = new Map();

        if (t.teams) {
            for (const team of t.teams) {
                if (team.players) {
                    for (const player of team.players) {
                        const newAvatar = idMap.get(player.id);
                        const newName = nameMap.get(player.id);
                        
                        if (newName && player.name !== newName) {
                            oldNameToNewName.set(player.name, newName);
                            player.name = newName;
                            if (player.playerName) player.playerName = newName;
                            updated = true;
                        }
                        if (newAvatar) {
                            player.avatar = newAvatar;
                            player.photo = newAvatar;
                            updated = true;
                        }
                    }
                }
            }
        }
        
        const updates = {};
        if (updated) updates.teams = t.teams;
        
        let statsUpdated = false;
        if (t.stats) {
            if (t.stats.topScorers) {
                for (const p of t.stats.topScorers) {
                    if (oldNameToNewName.has(p.playerName)) {
                        p.playerName = oldNameToNewName.get(p.playerName);
                        statsUpdated = true;
                    }
                    
                    let avatar = null;
                    if (t.teams) {
                        for(const team of t.teams) {
                            if(team.players) {
                                const found = team.players.find(x => x.name === p.playerName);
                                if (found && idMap.has(found.id)) {
                                    avatar = idMap.get(found.id);
                                    break;
                                }
                            }
                        }
                    }
                    if (avatar) {
                        p.playerPhoto = avatar;
                        statsUpdated = true;
                    }
                }
            }
            if (t.stats.cards) {
                for (const p of t.stats.cards) {
                    if (oldNameToNewName.has(p.playerName)) {
                        p.playerName = oldNameToNewName.get(p.playerName);
                        statsUpdated = true;
                    }

                    let avatar = null;
                    if (t.teams) {
                        for(const team of t.teams) {
                            if(team.players) {
                                const found = team.players.find(x => x.name === p.playerName);
                                if (found && idMap.has(found.id)) {
                                    avatar = idMap.get(found.id);
                                    break;
                                }
                            }
                        }
                    }
                    if (avatar) {
                        p.playerPhoto = avatar;
                        statsUpdated = true;
                    }
                }
            }
            if (statsUpdated) updates.stats = t.stats;
        }
        
        if (Object.keys(updates).length > 0) {
            const updateExpr = [];
            const exprVals = {};
            if (updates.teams) { updateExpr.push('teams = :teams'); exprVals[':teams'] = updates.teams; }
            if (updates.stats) { updateExpr.push('stats = :stats'); exprVals[':stats'] = updates.stats; }
            
            await docClient.send(new UpdateCommand({
                TableName: 'PhuiScore_Tournaments',
                Key: { id: t.id },
                UpdateExpression: 'SET ' + updateExpr.join(', '),
                ExpressionAttributeValues: exprVals
            }));
            console.log(`Updated tournament ${t.id} with avatars and new names.`);
        }
    }
    console.log('Done!');
}
run().catch(console.error);
