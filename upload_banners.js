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

const imageMapping = {
    'danh_nhi': 'danhnhi.png',
    'hoa_den': 'hoaden.png',
    'khang_nguyen': 'khangnguyen.png',
    'mtv': 'locnuoc-mtv.png',
    'ngoc_giau': 'ngocgiau.png',
    'nhi_phong': 'nhiphong.png',
    'van_tuyen': 'vantuyen.png',
    'hai_dang': 'haidangvivaco.png'
};

const CAUTHU_DIR = path.join(__dirname, 'vmix-overlay-system', 'client', 'public', 'assets', 'cauthu');

async function run() {
    console.log('Fetching tournaments from DynamoDB...');
    const scanRes = await docClient.send(new ScanCommand({TableName: 'PhuiScore_Tournaments'}));
    
    for (const t of scanRes.Items) {
        if (!t.teams) continue;
        
        let updated = false;
        for (const team of t.teams) {
            let imageName = imageMapping[team.id];
            
            // Try to match by team name if ID isn't mapped
            if (!imageName) {
                if (team.teamName.includes('Danh Nhi')) imageName = 'danhnhi.png';
                else if (team.teamName.includes('Hòa Đen')) imageName = 'hoaden.png';
                else if (team.teamName.includes('Khang Nguyễn')) imageName = 'khangnguyen.png';
                else if (team.teamName.includes('Mặt Trời Việt')) imageName = 'locnuoc-mtv.png';
                else if (team.teamName.includes('Ngọc Giàu')) imageName = 'ngocgiau.png';
                else if (team.teamName.includes('Nhi Phong')) imageName = 'nhiphong.png';
                else if (team.teamName.includes('Vân Tuyền')) imageName = 'vantuyen.png';
                else if (team.teamName.includes('Hải Đăng')) imageName = 'haidangvivaco.png';
            }
            
            if (imageName) {
                const imgPath = path.join(CAUTHU_DIR, imageName);
                if (fs.existsSync(imgPath)) {
                    console.log(`Uploading ${imageName} to S3 for team ${team.teamName}...`);
                    const fileBuffer = fs.readFileSync(imgPath);
                    const s3Key = `tournaments/banners/${Date.now()}_${imageName}`;
                    
                    await s3.send(new PutObjectCommand({
                        Bucket: BUCKET,
                        Key: s3Key,
                        Body: fileBuffer,
                        ContentType: 'image/png'
                    }));
                    
                    const s3Url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
                    team.playerBannerUrl = s3Url;
                    updated = true;
                    console.log(` -> Updated team ${team.teamName} banner to S3 URL: ${s3Url}`);
                }
            }
        }
        
        if (updated) {
            console.log(`Updating Tournament ${t.id} with new team banners...`);
            await docClient.send(new UpdateCommand({
                TableName: 'PhuiScore_Tournaments',
                Key: { id: t.id },
                UpdateExpression: 'SET teams = :teams',
                ExpressionAttributeValues: { ':teams': t.teams }
            }));
            console.log(`Tournament ${t.id} successfully updated!`);
        }
    }
}

run().catch(console.error);
