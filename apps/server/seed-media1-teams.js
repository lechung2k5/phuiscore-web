require('dotenv').config();
const TeamRepo = require('./src/repositories/team.repo');

const TEAMS = [
    {
        name: "FC EOC",
        short_name: "EOC",
        leader: "Ngô Đức Tuấn",
        phone: "0901234567",
        area: "Hà Nội",
        logo_url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=150&h=150",
        primary_color: "#E32636", // Alizarin Crimson
        secondary_color: "#FFFFFF",
        founded_year: 2015,
        home_stadium_id: "Sân C500",
        slogan: "Nhiệt huyết - Cống hiến",
        description: "Đội bóng phủi hàng đầu Hà Nội, nhiều năm chinh chiến HPL.",
        status: "active"
    },
    {
        name: "Phoenix FC",
        short_name: "PHX",
        leader: "Trần Anh Tú",
        phone: "0912345678",
        area: "Hà Nội",
        logo_url: "https://images.unsplash.com/photo-1590509653066-51f7bb98b4c0?auto=format&fit=crop&q=80&w=150&h=150",
        primary_color: "#FF8C00", // Dark Orange
        secondary_color: "#000000",
        founded_year: 2018,
        home_stadium_id: "Sân Hoàng Mai",
        slogan: "Phượng hoàng lửa",
        description: "Sức mạnh từ tinh thần bất diệt.",
        status: "active"
    },
    {
        name: "FC Mobi",
        short_name: "MOB",
        leader: "Lê Minh Tuấn",
        phone: "0987654321",
        area: "Hà Nội",
        logo_url: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&q=80&w=150&h=150",
        primary_color: "#1E90FF", // Dodger Blue
        secondary_color: "#FFFFFF",
        founded_year: 2019,
        home_stadium_id: "Sân Thủy Lợi",
        slogan: "Kết nối đam mê",
        description: "Tập thể gắn kết, thi đấu kỷ luật.",
        status: "active"
    },
    {
        name: "Đại Từ FC",
        short_name: "DAT",
        leader: "Nguyễn Văn A",
        phone: "0909888777",
        area: "Thái Nguyên",
        logo_url: "https://images.unsplash.com/photo-1518605368461-1e1252281146?auto=format&fit=crop&q=80&w=150&h=150",
        primary_color: "#32CD32", // Lime Green
        secondary_color: "#FFFFFF",
        founded_year: 2020,
        home_stadium_id: "Sân Đại Từ",
        slogan: "Khát vọng vươn xa",
        description: "Đại diện ưu tú của bóng đá phủi Thái Nguyên.",
        status: "active"
    },
    {
        name: "Tùng Ân Hoa Lư",
        short_name: "THL",
        leader: "Phạm Tùng",
        phone: "0933444555",
        area: "Vĩnh Phúc",
        logo_url: "https://images.unsplash.com/photo-1508344928928-7157b6de31bb?auto=format&fit=crop&q=80&w=150&h=150",
        primary_color: "#800080", // Purple
        secondary_color: "#FFD700", // Gold
        founded_year: 2017,
        home_stadium_id: "Sân Phúc Yên",
        slogan: "Tự hào Hoa Lư",
        description: "Tinh thần chiến binh Vĩnh Phúc.",
        status: "active"
    },
    {
        name: "Gia Việt",
        short_name: "GVI",
        leader: "Nguyễn Việt",
        phone: "0977666555",
        area: "Hà Nội",
        logo_url: "https://images.unsplash.com/photo-1600250395356-02e20b332b6e?auto=format&fit=crop&q=80&w=150&h=150",
        primary_color: "#FFFF00", // Yellow
        secondary_color: "#0000FF", // Blue
        founded_year: 2014,
        home_stadium_id: "Sân Bộ Công An",
        slogan: "Gia đình Việt",
        description: "Đội bóng cựu trào với lối chơi kỹ thuật.",
        status: "active"
    },
    {
        name: "Tuấn Sơn FC",
        short_name: "TSO",
        leader: "Đặng Tuấn",
        phone: "0966555444",
        area: "Hà Giang",
        logo_url: "https://images.unsplash.com/photo-1551280857-239cb271d47a?auto=format&fit=crop&q=80&w=150&h=150",
        primary_color: "#008080", // Teal
        secondary_color: "#FFFFFF",
        founded_year: 2016,
        home_stadium_id: "Sân Hà Giang",
        slogan: "Bản sắc vùng cao",
        description: "Đội bóng mang đậm chất lính và kỷ luật.",
        status: "active"
    },
    {
        name: "FC Du Lịch",
        short_name: "DUL",
        leader: "Lào Cai Admin",
        phone: "0911222333",
        area: "Lào Cai",
        logo_url: "https://images.unsplash.com/photo-1521665487693-017fb794c483?auto=format&fit=crop&q=80&w=150&h=150",
        primary_color: "#00FFFF", // Cyan
        secondary_color: "#000000",
        founded_year: 2015,
        home_stadium_id: "Sân Lào Cai",
        slogan: "Du lịch - Kết nối",
        description: "Tập thể mạnh với nhiều cá nhân xuất sắc.",
        status: "active"
    }
];

async function seedTeams() {
    try {
        const managerId = "media1"; // Lấy managerId là media1
        let createdCount = 0;
        
        console.log(`Bắt đầu seed 8 đội bóng cho managerId: ${managerId}...`);
        
        for (const teamData of TEAMS) {
            const result = await TeamRepo.create(teamData, managerId);
            console.log(`✅ Đã tạo đội bóng: ${result.name} (ID: ${result.id})`);
            createdCount++;
        }
        
        console.log(`🎉 Seed thành công ${createdCount} đội bóng!`);
        process.exit(0);
    } catch (error) {
        console.error("Lỗi khi seed data:", error);
        process.exit(1);
    }
}

// Chờ 2s để đảm bảo DB kết nối xong (do module DynamoDB khởi tạo)
setTimeout(seedTeams, 2000);
