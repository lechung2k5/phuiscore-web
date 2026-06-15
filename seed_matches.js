process.env.NODE_ENV = 'production';
require('dotenv').config({ path: './apps/server/.env' });
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require('./apps/server/src/config/db.config');

const TABLE_MATCHES = process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Matches` : "PhuiScore_Matches";

async function seed() {
    console.log("🚀 Bắt đầu tạo trận đấu mẫu...");
    
    const today = new Date().toISOString().split('T')[0];
    const matchId = "mobi_vs_eoc_01";

    const item = {
        pk: `DATE#${today}`,
        sk: `MATCH#${matchId}`,
        gsi1_pk: `TOURNAMENT#hpl-s11`,
        id: matchId,
        dateString: today,
        tournamentId: "hpl-s11",
        tournamentName: "HPL-S11: Giải bóng đá 7 người vô địch quốc gia",
        homeTeam: {
            name: "Mobi FC",
            shortName: "MOBI",
            logo: "https://api.dicebear.com/7.x/identicon/svg?seed=mobi"
        },
        awayTeam: {
            name: "EOC FC",
            shortName: "EOC",
            logo: "https://api.dicebear.com/7.x/identicon/svg?seed=eoc"
        },
        status: "inprogress",
        score: { home: 0, away: 0 },
        currentMinute: "15",
        liveStatus: "streaming",
        isManualControl: true,
        updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({ TableName: TABLE_MATCHES, Item: item }));
    console.log(`✅ Đã tạo trận đấu mẫu. Bạn có thể test vMix với matchId: ${matchId}`);
}

seed().catch(console.error);
