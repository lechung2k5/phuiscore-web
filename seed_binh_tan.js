process.env.NODE_ENV = 'production';
require('dotenv').config({ path: './apps/server/.env' });
const { PutCommand, ScanCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require('./apps/server/src/config/db.config');

const TABLE_MATCHES = process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Matches` : "PhuiScore_Matches";

const TABLES_TO_CLEAR = [
    "PhuiScore_Tournaments",
    "PhuiScore_Teams",
    "PhuiScore_TeamMembers",
    TABLE_MATCHES,
    "PhuiScore_Standings"
];

async function clearTable(tableName) {
    try {
        const result = await docClient.send(new ScanCommand({ TableName: tableName }));
        const items = result.Items || [];
        for (const item of items) {
            let key = null;
            // Xử lý riêng cho bảng Matches (dùng pk và sk làm khoá chính)
            if (tableName.includes('Matches') || tableName.includes('Standings')) {
                if (item.pk && item.sk) key = { pk: item.pk, sk: item.sk };
            } else {
                if (item.id) key = { id: item.id };
            }

            if (key) {
                await docClient.send(new DeleteCommand({ TableName: tableName, Key: key }));
            }
        }
        console.log(`🗑️ Đã dọn sạch bảng: ${tableName}`);
    } catch (e) {
        console.log(`⚠️ Bảng ${tableName} trống hoặc có lỗi: ${e.message}`);
    }
}

async function seed() {
    console.log("🚀 Bắt đầu xóa dữ liệu rác và tái tạo Giải Phủi Bình Tân...");

    for (const table of TABLES_TO_CLEAR) {
        await clearTable(table);
    }

    const now = Date.now();
    const tournamentId = "binh-tan-cup";
    const team1Id = "bt-fc";
    const team2Id = "tt-fc";

    // 1. Tạo giải đấu
    const tournamentItem = {
        id: tournamentId,
        name: "Giải Phủi Bình Tân S1",
        region: "Bình Tân, TP.HCM",
        status: "Ongoing",
        logo: "https://api.dicebear.com/7.x/identicon/svg?seed=binhtan",
        createdAt: now,
        updatedAt: now,
        teams: [
            { id: team1Id, name: "Bình Tân FC", status: "Approved" },
            { id: team2Id, name: "Tân Tạo FC", status: "Approved" }
        ]
    };
    await docClient.send(new PutCommand({ TableName: "PhuiScore_Tournaments", Item: tournamentItem }));
    console.log(`✅ Đã tạo giải đấu: ${tournamentItem.name}`);

    // 2. Tạo 2 đội bóng
    const team1 = { id: team1Id, name: "Bình Tân FC", short_name: "BTFC", area: "Bình Tân", logo_url: "https://api.dicebear.com/7.x/identicon/svg?seed=btfc" };
    const team2 = { id: team2Id, name: "Tân Tạo FC", short_name: "TTFC", area: "Bình Tân", logo_url: "https://api.dicebear.com/7.x/identicon/svg?seed=ttfc" };
    await docClient.send(new PutCommand({ TableName: "PhuiScore_Teams", Item: team1 }));
    await docClient.send(new PutCommand({ TableName: "PhuiScore_Teams", Item: team2 }));
    console.log(`✅ Đã tạo 2 đội bóng Bình Tân FC và Tân Tạo FC.`);

    // 3. Tạo cầu thủ
    const players = [
        { id: "p1", teamId: team1Id, name: "Nguyễn Văn Tèo", position: "Tiền đạo", number: 9 },
        { id: "p2", teamId: team1Id, name: "Trần Văn Tý", position: "Thủ môn", number: 1 },
        { id: "p3", teamId: team2Id, name: "Lê Văn Bin", position: "Tiền vệ", number: 10 },
        { id: "p4", teamId: team2Id, name: "Phạm Văn Bo", position: "Hậu vệ", number: 4 }
    ];

    for (const p of players) {
        await docClient.send(new PutCommand({ 
            TableName: "PhuiScore_TeamMembers", 
            Item: { 
                id: p.id, teamId: p.teamId, name: p.name, role: "Player", position: p.position, shirtNumber: p.number, status: "Active" 
            } 
        }));
    }
    console.log(`✅ Đã tạo danh sách cầu thủ cho 2 đội.`);

    // 4. Tạo trận đấu đang đá
    const today = new Date().toISOString().split('T')[0];
    const matchId = "match_binhtan_01";
    
    const matchItem = {
        pk: `DATE#${today}`,
        sk: `MATCH#${matchId}`,
        gsi1_pk: `TOURNAMENT#${tournamentId}`,
        id: matchId,
        dateString: today,
        tournamentId: tournamentId,
        tournamentName: tournamentItem.name,
        homeTeam: { name: team1.name, shortName: team1.short_name, logo: team1.logo_url },
        awayTeam: { name: team2.name, shortName: team2.short_name, logo: team2.logo_url },
        status: "inprogress",
        score: { home: 1, away: 0 },
        currentMinute: "25",
        liveStatus: "streaming",
        isManualControl: true,
        lineups: {
            home: [{ id: "p1", name: "Nguyễn Văn Tèo", number: 9, isStarter: true }, { id: "p2", name: "Trần Văn Tý", number: 1, isStarter: true }],
            away: [{ id: "p3", name: "Lê Văn Bin", number: 10, isStarter: true }, { id: "p4", name: "Phạm Văn Bo", number: 4, isStarter: true }]
        },
        incidents: [
            { type: "scoreboard_goal", team: "home", time: 15, player: "Nguyễn Văn Tèo" }
        ],
        updatedAt: new Date().toISOString()
    };
    await docClient.send(new PutCommand({ TableName: TABLE_MATCHES, Item: matchItem }));
    console.log(`✅ Đã tạo lịch thi đấu (Trạng thái: Đang đá). Match ID: ${matchId}`);
    
    console.log("✨ Hoàn tất! Bạn có thể test vMix với trận đấu ID: " + matchId);
}

seed().catch(console.error);
