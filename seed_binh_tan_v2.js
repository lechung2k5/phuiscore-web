process.env.NODE_ENV = 'production';
require('dotenv').config({ path: './apps/server/.env' });
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require('./apps/server/src/config/db.config');

const TABLE_MATCHES = process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Matches` : "PhuiScore_Matches";
const TABLE_STANDINGS = process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Standings` : "PhuiScore_Standings";

async function seed() {
    console.log("🚀 Bắt đầu tạo dữ liệu Giải Phủi Bình Tân (15 trận: Vòng bảng + Knockout)...");

    const now = Date.now();
    const tournamentId = 9999; 
    const seasonId = 2026;

    // Danh sách 8 đội
    const teamsData = [
        { id: "bt1", name: "Bình Tân FC", short: "BTF", group: "A", logo: "https://api.dicebear.com/7.x/identicon/svg?seed=binhtanfc" },
        { id: "bt2", name: "Tân Tạo FC", short: "TTF", group: "A", logo: "https://api.dicebear.com/7.x/identicon/svg?seed=tantao" },
        { id: "bt3", name: "An Lạc Hội", short: "ALH", group: "A", logo: "https://api.dicebear.com/7.x/identicon/svg?seed=anlac" },
        { id: "bt4", name: "Tên Lửa United", short: "TLU", group: "A", logo: "https://api.dicebear.com/7.x/identicon/svg?seed=tenlua" },
        { id: "bt5", name: "Bình Trị Đông", short: "BTD", group: "B", logo: "https://api.dicebear.com/7.x/identicon/svg?seed=binhtridong" },
        { id: "bt6", name: "Vĩnh Lộc Boys", short: "VLB", group: "B", logo: "https://api.dicebear.com/7.x/identicon/svg?seed=vinhloc" },
        { id: "bt7", name: "Lê Minh Xuân FC", short: "LMX", group: "B", logo: "https://api.dicebear.com/7.x/identicon/svg?seed=leminhxuan" },
        { id: "bt8", name: "Tân Kiên City", short: "TKC", group: "B", logo: "https://api.dicebear.com/7.x/identicon/svg?seed=tankien" }
    ];

    const mapToStandingRow = (t, position, form) => ({
        team: { id: t.id, name: t.name, shortName: t.short, logo: t.logo },
        position: position,
        points: form === 'D' ? 1 : 0,
        matches: form ? 1 : 0,
        wins: 0,
        draws: form === 'D' ? 1 : 0,
        losses: 0,
        scoresFor: form === 'D' ? 1 : 0,
        scoresAgainst: form === 'D' ? 1 : 0,
        form: form || ""
    });

    const tournamentStandings = [
        {
            name: "Bảng A",
            rows: [
                mapToStandingRow(teamsData[0], 1, 'D'), 
                mapToStandingRow(teamsData[1], 2, 'D'), 
                mapToStandingRow(teamsData[2], 3, ''),
                mapToStandingRow(teamsData[3], 4, '')
            ]
        },
        {
            name: "Bảng B",
            rows: [
                mapToStandingRow(teamsData[4], 1, ''),
                mapToStandingRow(teamsData[5], 2, ''),
                mapToStandingRow(teamsData[6], 3, ''),
                mapToStandingRow(teamsData[7], 4, '')
            ]
        }
    ];

    // 1. Cập nhật giải đấu thành GroupKnockout
    const tournamentItem = {
        id: String(tournamentId),
        name: "Giải Phủi Bình Tân Mở Rộng 2026",
        region: "Bình Tân, TP.HCM",
        format: "GroupKnockout",
        status: "Ongoing",
        logo: "https://api.dicebear.com/7.x/identicon/svg?seed=btcup2026",
        createdAt: now,
        updatedAt: now,
        standings: tournamentStandings,
        teams: teamsData.map(t => ({ 
            id: t.id, 
            teamId: t.id,
            teamName: t.name, 
            shortName: t.short,
            logo: t.logo,
            managerName: "Trưởng đoàn " + t.name,
            managerPhone: "0909123456",
            jerseyColor: "#000000",
            status: "Approved",
            playerCount: 5,
            players: [
                { name: "Thủ môn", position: "Thủ môn", number: 1 },
                { name: "Hậu vệ", position: "Hậu vệ", number: 4 },
                { name: "Tiền vệ 1", position: "Tiền vệ", number: 8 },
                { name: "Tiền vệ 2", position: "Tiền vệ", number: 10 },
                { name: "Tiền đạo", position: "Tiền đạo", number: 9 }
            ],
            registeredAt: now
        }))
    };
    await docClient.send(new PutCommand({ TableName: "PhuiScore_Tournaments", Item: tournamentItem }));
    console.log(`✅ Đã cập nhật thể thức GroupKnockout.`);

    // 3. Tạo 15 trận đấu
    const todayObj = new Date();
    const today = todayObj.toISOString().split('T')[0];
    
    const tomorrowObj = new Date(todayObj);
    tomorrowObj.setDate(todayObj.getDate() + 1);
    const tomorrow = tomorrowObj.toISOString().split('T')[0];

    const dayAfterObj = new Date(todayObj);
    dayAfterObj.setDate(todayObj.getDate() + 2);
    const dayAfter = dayAfterObj.toISOString().split('T')[0];

    const finalDayObj = new Date(todayObj);
    finalDayObj.setDate(todayObj.getDate() + 4);
    const finalDay = finalDayObj.toISOString().split('T')[0];
    
    // Tạo lịch bảng A
    const groupA = [
        { id: "m1", home: teamsData[0], away: teamsData[1], date: today, time: "08:00", status: "finished", homeScore: 2, awayScore: 1, currentMinute: 90, round: "Vòng bảng", group: "A" },
        { id: "m2", home: teamsData[2], away: teamsData[3], date: today, time: "09:30", status: "finished", homeScore: 0, awayScore: 0, currentMinute: 90, round: "Vòng bảng", group: "A" },
        { id: "m3", home: teamsData[0], away: teamsData[2], date: tomorrow, time: "08:00", status: "notstarted", homeScore: 0, awayScore: 0, currentMinute: 0, round: "Vòng bảng", group: "A" },
        { id: "m4", home: teamsData[1], away: teamsData[3], date: tomorrow, time: "09:30", status: "notstarted", homeScore: 0, awayScore: 0, currentMinute: 0, round: "Vòng bảng", group: "A" },
        { id: "m5", home: teamsData[0], away: teamsData[3], date: dayAfter, time: "08:00", status: "notstarted", homeScore: 0, awayScore: 0, currentMinute: 0, round: "Vòng bảng", group: "A" },
        { id: "m6", home: teamsData[1], away: teamsData[2], date: dayAfter, time: "09:30", status: "notstarted", homeScore: 0, awayScore: 0, currentMinute: 0, round: "Vòng bảng", group: "A" }
    ];

    // Tạo lịch bảng B
    const groupB = [
        { id: "m7", home: teamsData[4], away: teamsData[5], date: today, time: "15:00", status: "inprogress", homeScore: 1, awayScore: 0, currentMinute: 25, round: "Vòng bảng", group: "B" },
        { id: "m8", home: teamsData[6], away: teamsData[7], date: today, time: "16:30", status: "notstarted", homeScore: 0, awayScore: 0, currentMinute: 0, round: "Vòng bảng", group: "B" },
        { id: "m9", home: teamsData[4], away: teamsData[6], date: tomorrow, time: "15:00", status: "notstarted", homeScore: 0, awayScore: 0, currentMinute: 0, round: "Vòng bảng", group: "B" },
        { id: "m10", home: teamsData[5], away: teamsData[7], date: tomorrow, time: "16:30", status: "notstarted", homeScore: 0, awayScore: 0, currentMinute: 0, round: "Vòng bảng", group: "B" },
        { id: "m11", home: teamsData[4], away: teamsData[7], date: dayAfter, time: "15:00", status: "notstarted", homeScore: 0, awayScore: 0, currentMinute: 0, round: "Vòng bảng", group: "B" },
        { id: "m12", home: teamsData[5], away: teamsData[6], date: dayAfter, time: "16:30", status: "notstarted", homeScore: 0, awayScore: 0, currentMinute: 0, round: "Vòng bảng", group: "B" }
    ];

    // Tạo Knockout
    const placeholderTeams = {
        nhatA: { id: "nhatA", name: "Nhất A", short: "1A", logo: "" },
        nhiA: { id: "nhiA", name: "Nhì A", short: "2A", logo: "" },
        nhatB: { id: "nhatB", name: "Nhất B", short: "1B", logo: "" },
        nhiB: { id: "nhiB", name: "Nhì B", short: "2B", logo: "" },
        thangBK1: { id: "thangBK1", name: "Thắng BK1", short: "WBK1", logo: "" },
        thangBK2: { id: "thangBK2", name: "Thắng BK2", short: "WBK2", logo: "" }
    };

    const knockout = [
        { id: "m13", home: placeholderTeams.nhatA, away: placeholderTeams.nhiB, date: finalDay, time: "08:00", status: "scheduled", homeScore: 0, awayScore: 0, currentMinute: 0, round: "Bán kết 1", group: "-" },
        { id: "m14", home: placeholderTeams.nhatB, away: placeholderTeams.nhiA, date: finalDay, time: "09:30", status: "scheduled", homeScore: 0, awayScore: 0, currentMinute: 0, round: "Bán kết 2", group: "-" },
        { id: "m15", home: placeholderTeams.thangBK1, away: placeholderTeams.thangBK2, date: finalDay, time: "15:00", status: "scheduled", homeScore: 0, awayScore: 0, currentMinute: 0, round: "Chung kết", group: "-" }
    ];

    const fixtures = [...groupA, ...groupB, ...knockout];

    for (const f of fixtures) {
        const getFakeLineup = (teamId) => {
            if(teamId.startsWith('bt')) {
                return [1,2,3,4,5].map(i => ({ id: `pl_${teamId}_${i}`, name: `Cầu thủ X`, number: i, isStarter: true }));
            }
            return [];
        };

        const matchItem = {
            pk: `DATE#${f.date}`,
            sk: `MATCH#${f.id}`,
            gsi1_pk: `TOURNAMENT#${tournamentId}`,
            id: f.id,
            dateString: f.date,
            timeString: f.time,
            tournamentId: String(tournamentId),
            tournamentName: tournamentItem.name,
            homeTeam: { name: f.home.name, shortName: f.home.short, logo: f.home.logo, id: f.home.id },
            awayTeam: { name: f.away.name, shortName: f.away.short, logo: f.away.logo, id: f.away.id },
            status: f.status,
            score: { home: f.homeScore, away: f.awayScore },
            homeScore: f.homeScore,
            awayScore: f.awayScore,
            currentMinute: f.currentMinute.toString(),
            liveStatus: f.status === "inprogress" ? "streaming" : "idle",
            isManualControl: true,
            round: f.round,
            group: f.group,
            lineups: {
                home: getFakeLineup(f.home.id),
                away: getFakeLineup(f.away.id)
            },
            incidents: f.status === "inprogress" ? [
                { type: "scoreboard_goal", team: "home", time: 10, player: "Cầu thủ X" },
                { type: "scoreboard_goal", team: "away", time: 35, player: "Cầu thủ Y" }
            ] : [],
            updatedAt: new Date().toISOString()
        };
        await docClient.send(new PutCommand({ TableName: TABLE_MATCHES, Item: matchItem }));
    }
    console.log(`✅ Đã ghi đè 15 trận đấu.`);

    const standingItem = {
        tournamentId: tournamentId,
        seasonId: seasonId,
        tournamentInfo: { name: tournamentItem.name, logo: tournamentItem.logo },
        standings: tournamentStandings,
        lastUpdated: Date.now()
    };
    await docClient.send(new PutCommand({ TableName: TABLE_STANDINGS, Item: standingItem }));
    console.log(`✅ Đã khởi tạo lại Bảng xếp hạng.`);
    
    console.log("✨ XONG TOÀN BỘ 15 TRẬN ĐẤU!");
}

seed().catch(console.error);
