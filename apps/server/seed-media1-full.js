require('dotenv').config();
const TeamRepo = require('./src/repositories/team.repo');
const TeamMemberRepo = require('./src/repositories/teamMember.repo');
const { docClient } = require('./src/config/db.config');
const { DeleteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const TEAMS = [
    {
        name: "FC EOC",
        short_name: "EOC",
        leader: "Ngô Đức Tuấn",
        area: "Hà Nội",
        logo_url: "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png",
        primary_color: "#6CABDD",
        secondary_color: "#1C2C5B",
        description: "Đội bóng mạnh với lối chơi kiểm soát."
    },
    {
        name: "Phoenix FC",
        short_name: "PHX",
        leader: "Trần Anh Tú",
        area: "Hà Nội",
        logo_url: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/Chelsea_crest.svg/1200px-Chelsea_crest.svg.png",
        primary_color: "#034694",
        secondary_color: "#EE242C",
        description: "Tinh thần chiến binh bất diệt."
    },
    {
        name: "FC Mobi",
        short_name: "MOB",
        leader: "Lê Minh Tuấn",
        area: "Hà Nội",
        logo_url: "https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/1200px-Manchester_United_FC_crest.svg.png",
        primary_color: "#DA291C",
        secondary_color: "#FBE122",
        description: "Tập thể gắn kết, thi đấu kỷ luật."
    },
    {
        name: "Đại Từ FC",
        short_name: "DAT",
        leader: "Nguyễn Văn A",
        area: "Thái Nguyên",
        logo_url: "https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/1200px-Liverpool_FC.svg.png",
        primary_color: "#C8102E",
        secondary_color: "#F6EB61",
        description: "Đại diện ưu tú của bóng đá phủi Thái Nguyên."
    },
    {
        name: "Tùng Ân Hoa Lư",
        short_name: "THL",
        leader: "Phạm Tùng",
        area: "Vĩnh Phúc",
        logo_url: "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png",
        primary_color: "#EF0107",
        secondary_color: "#063672",
        description: "Tinh thần chiến binh Vĩnh Phúc."
    },
    {
        name: "Gia Việt",
        short_name: "GVI",
        leader: "Nguyễn Việt",
        area: "Hà Nội",
        logo_url: "https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png",
        primary_color: "#A50044",
        secondary_color: "#004D98",
        description: "Đội bóng cựu trào với lối chơi kỹ thuật."
    },
    {
        name: "Tuấn Sơn FC",
        short_name: "TSO",
        leader: "Đặng Tuấn",
        area: "Hà Giang",
        logo_url: "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png",
        primary_color: "#FFFFFF",
        secondary_color: "#FEBE10",
        description: "Đội bóng mang đậm chất lính và kỷ luật."
    },
    {
        name: "FC Du Lịch",
        short_name: "DUL",
        leader: "Lào Cai Admin",
        area: "Lào Cai",
        logo_url: "https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/1200px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png",
        primary_color: "#DC052D",
        secondary_color: "#FFFFFF",
        description: "Tập thể mạnh với nhiều cá nhân xuất sắc."
    }
];

const VIETNAMESE_NAMES = [
    "Nguyễn Văn Tuấn", "Trần Đình Trọng", "Lê Công Vinh", "Phạm Thành Lương", 
    "Hoàng Anh Tuấn", "Vũ Minh Tuấn", "Đoàn Văn Hậu", "Bùi Tiến Dũng", 
    "Nguyễn Quang Hải", "Đỗ Hùng Dũng", "Quế Ngọc Hải", "Nguyễn Tuấn Anh", 
    "Lương Xuân Trường", "Nguyễn Công Phượng", "Nguyễn Văn Toàn", "Phan Văn Đức",
    "Trần Minh Vương", "Hà Đức Chinh", "Nguyễn Tiến Linh", "Đặng Văn Lâm",
    "Nguyễn Filip", "Bùi Hoàng Việt Anh", "Nguyễn Thanh Bình", "Hồ Tấn Tài"
];

function getRandomName() {
    return VIETNAMESE_NAMES[Math.floor(Math.random() * VIETNAMESE_NAMES.length)];
}

const POSITIONS = ["GK", "CB", "LB", "RB", "CM", "LM", "RM", "CAM", "ST"];

async function cleanOldData(managerId) {
    console.log("Đang xóa các đội bóng cũ của manager:", managerId);
    // Lấy các team cũ
    const teams = await TeamRepo.getByManagerId(managerId);
    for (const t of teams) {
        // Lấy members
        const members = await TeamMemberRepo.getByTeamId(t.id);
        for (const m of members) {
            await docClient.send(new DeleteCommand({ TableName: "PhuiScore_TeamMembers", Key: { id: m.id } }));
        }
        await TeamRepo.delete(t.id);
    }
    console.log(`Đã xóa ${teams.length} đội bóng cũ.`);
}

async function seedTeams() {
    try {
        const managerId = "media1"; 
        
        await cleanOldData(managerId);

        console.log(`Bắt đầu seed 8 đội bóng và cầu thủ cho managerId: ${managerId}...`);
        
        for (const teamData of TEAMS) {
            teamData.status = "active";
            const team = await TeamRepo.create(teamData, managerId);
            console.log(`✅ Đã tạo đội: ${team.name}`);
            
            // Generate 15 players
            let shirtNumbers = Array.from({length: 30}, (_, i) => i + 1).sort(() => 0.5 - Math.random());
            
            for (let i = 0; i < 15; i++) {
                const pos = i === 0 ? "GK" : POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
                const imgId = Math.floor(Math.random() * 70) + 1; // 1-70
                const playerInfo = {
                    name: getRandomName(),
                    shirtNumber: shirtNumbers[i],
                    position: pos,
                    avatar: `https://i.pravatar.cc/300?img=${imgId}`,
                    role: i === 1 ? 'captain' : 'player',
                    status: 'active'
                };
                
                await TeamMemberRepo.create(playerInfo, team.id);
            }
            console.log(`   -> Đã tạo 15 cầu thủ cho ${team.name}`);
        }
        
        console.log(`🎉 Seed thành công hoàn toàn!`);
        process.exit(0);
    } catch (error) {
        console.error("Lỗi khi seed data:", error);
        process.exit(1);
    }
}

setTimeout(seedTeams, 2000);
