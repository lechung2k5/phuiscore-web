process.env.NODE_ENV = 'production';
require('dotenv').config({ path: './apps/server/.env' });
const { PutCommand, ScanCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require('./apps/server/src/config/db.config');

const TABLE_TOURNAMENTS = "PhuiScore_Tournaments";
const TABLE_TEAMS = "PhuiScore_Teams";

const tournaments = [
    { id: "hpl-s11", name: "HPL-S11: Giải bóng đá 7 người vô địch quốc gia - Miền Bắc", region: "Hà Nội", status: "Ongoing", image: "https://i.pinimg.com/736x/cb/28/ef/cb28ef1a46afd815e5874abab2323209.jpg" },
    { id: "spl-s6", name: "SPL-S6: Giải bóng đá 7 người vô địch quốc gia - Miền Nam", region: "TP.HCM", status: "Ongoing", image: "https://i.pinimg.com/736x/56/9e/37/569e37ad9fbe097fa5d41eded93975ee.jpg" },
    { id: "vpl-s5", name: "VPL-S5: Vòng chung kết bóng đá 7 người toàn quốc", region: "Toàn quốc", status: "Registration", image: "https://i.pinimg.com/1200x/52/16/5f/52165f15fac900aa94603c543c44236e.jpg" },
    { id: "saigon-cup", name: "Giải bóng đá Cup Bia Saigon 2026", region: "Đà Nẵng", status: "Ongoing", image: "https://i.pinimg.com/736x/d8/c4/dd/d8c4dded83b711772e12a368b72714e5.jpg" },
    { id: "hanoi-d1", name: "Hanoi Premier League - Division 1", region: "Hà Nội", status: "Registration", image: "https://i.pinimg.com/736x/90/ca/d4/90cad41b39f71331c9c77c7c8ce4a7e5.jpg" },
    { id: "nghe-an-hn", name: "Giải bóng đá các CLB Nghệ An tại Hà Nội", region: "Hà Nội", status: "Ongoing", image: "https://i.pinimg.com/1200x/fa/d9/59/fad9596d8bd239c767b324b0dc975379.jpg" },
    { id: "hai-phong-s7", name: "Cup bóng đá sân 7 Hải Phòng", region: "Hải Phòng", status: "Registration", image: "https://i.pinimg.com/736x/f8/fc/14/f8fc1442994678a69076ed45de0f6539.jpg" },
    { id: "can-tho-s7", name: "Giải vô địch sân 7 Cần Thơ", region: "Cần Thơ", status: "Ongoing", image: "https://i.pinimg.com/736x/63/51/e4/6351e41a65ca93971cead6b4b8408f3f.jpg" },
    { id: "mien-trung-phui", name: "Đại hội bóng đá Phủi miền Trung", region: "Quảng Nam", status: "Registration", image: "https://i.pinimg.com/1200x/ab/67/93/ab6793f014fac7487b6d6f4d27aa79e2.jpg" },
    { id: "thien-long-cup", name: "Cup Thiên Long: Giải bóng đá lão tướng", region: "TP.HCM", status: "Ongoing", image: "https://i.pinimg.com/736x/cb/28/ef/cb28ef1a46afd815e5874abab2323209.jpg" }
];

const teams = [
    { id: "team-mobi", name: "Mobi FC", short_name: "MOBI", area: "Hà Nội", logo: "https://api.dicebear.com/7.x/identicon/svg?seed=mobi" },
    { id: "team-eoc", name: "EOC FC", short_name: "EOC", area: "Hà Nội", logo: "https://api.dicebear.com/7.x/identicon/svg?seed=eoc" },
    { id: "team-daitu", name: "Đại Từ FC", short_name: "DTU", area: "Thái Nguyên", logo: "https://api.dicebear.com/7.x/identicon/svg?seed=daitu" },
    { id: "team-anbien", name: "An Biên FC", short_name: "ABI", area: "TP.HCM", logo: "https://api.dicebear.com/7.x/identicon/svg?seed=anbien" }
];

async function clearTable(tableName) {
    const result = await docClient.send(new ScanCommand({ TableName: tableName }));
    const items = result.Items || [];
    for (const item of items) {
        await docClient.send(new DeleteCommand({ TableName: tableName, Key: { id: item.id } }));
    }
    console.log(`🗑️ Đã dọn sạch bảng: ${tableName}`);
}

async function seed() {
    console.log("🚀 Bắt đầu dọn dẹp và Seed lại dữ liệu...");
    
    await clearTable(TABLE_TOURNAMENTS);
    await clearTable(TABLE_TEAMS);

    for (const t of tournaments) {
        const now = Date.now();
        const item = {
            id: t.id,
            name: t.name,
            region: t.region,
            status: t.status,
            logo: t.image,
            banner: t.image,
            createdAt: now,
            updatedAt: now,
            teams: []
        };
        await docClient.send(new PutCommand({ TableName: TABLE_TOURNAMENTS, Item: item }));
        console.log(`✅ Đã tạo giải đấu: ${t.name}`);
    }

    for (const team of teams) {
        const now = Date.now();
        const item = {
            id: team.id,
            name: team.name,
            short_name: team.short_name,
            area: team.area,
            logo_url: team.logo,
            status: "active",
            managerId: "admin_seed",
            createdAt: now,
            updatedAt: now
        };
        await docClient.send(new PutCommand({ TableName: TABLE_TEAMS, Item: item }));
        console.log(`✅ Đã tạo đội bóng: ${team.name}`);
    }
    console.log("✨ Hoàn tất! Hãy F5 lại trang web.");
}

seed().catch(console.error);
