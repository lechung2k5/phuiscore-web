const fs = require('fs');
const { PutCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require('./apps/server/src/config/db.config');

const TOURNAMENT_TABLE = process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Tournaments` : "PhuiScore_Tournaments";

// Dữ liệu mẫu trích xuất từ Ảnh 2 (Đội Danh Nhị)
const teamDanhNhi = {
    teamId: "danh_nhi",
    teamName: "Danh Nhị",
    shortName: "DNI",
    logo: "https://api.dicebear.com/7.x/identicon/svg?seed=danhnhi",
    managerName: "Khanh Sport",
    managerPhone: "",
    jerseyColor: "#000000",
    status: "Approved",
    coachingStaff: [
        { role: "Ông bầu", name: "Khanh Sport" },
        { role: "Huấn Luyện Viên", name: "Hiếu Xavi" },
        { role: "Ban Huấn Luyện", name: "Hoàn Võ" },
        { role: "Ban Huấn Luyện", name: "Hoàng Em" },
        { role: "Ban Huấn Luyện", name: "Thái Châu Phi" }
    ],
    players: [
        { number: 1, name: "Dự Cua", position: "Cầu thủ" },
        { number: 2, name: "Quốc Khánh", position: "Cầu thủ" },
        { number: 3, name: "Phúc Luân", position: "Cầu thủ" },
        { number: 4, name: "Thanh Hoài", position: "Cầu thủ" },
        { number: 5, name: "Hữu Ý", position: "Cầu thủ" },
        { number: 6, name: "Vĩnh Lộc", position: "Cầu thủ" },
        { number: 7, name: "Văn Thắng", position: "Cầu thủ" },
        { number: 8, name: "Đăng Bình Điền", position: "Cầu thủ", photo: "https://example.com/minhdang.jpg" }, // Ảnh 1
        { number: 9, name: "Khánh Du", position: "Cầu thủ" },
        { number: 10, name: "Minh Dũng", position: "Cầu thủ" },
        { number: 11, name: "Thanh Toàn", position: "Cầu thủ" },
        { number: 12, name: "Quốc Lâm", position: "Cầu thủ" },
        { number: 13, name: "Ngọn Trường", position: "Cầu thủ" },
        { number: 14, name: "Chí Tâm", position: "Cầu thủ" },
        { number: 15, name: "Lý Nghĩa", position: "Cầu thủ" },
        { number: 16, name: "Thanh Lợi", position: "Cầu thủ" },
        { number: 17, name: "Phan Thành Giang", position: "Cầu thủ" },
        { number: 18, name: "Vĩ Zico", position: "Cầu thủ" },
        { number: 19, name: "Thành Được", position: "Cầu thủ" },
        { number: 20, name: "Hoài Thanh", position: "Cầu thủ" }
    ]
};

async function seedRealPlayers(tournamentId, teamsData) {
    try {
        console.log(`Đang lấy thông tin giải đấu ID: ${tournamentId}...`);
        
        // 1. Lấy giải đấu hiện tại
        const getCmd = new GetCommand({
            TableName: TOURNAMENT_TABLE,
            Key: { id: String(tournamentId) }
        });
        
        const res = await docClient.send(getCmd);
        if (!res.Item) {
            console.error("Không tìm thấy giải đấu!");
            return;
        }

        const tournament = res.Item;
        
        // 2. Cập nhật mảng teams (ví dụ: thay thế đội Bình Tân FC bằng Danh Nhị hoặc thêm mới)
        // Nếu muốn cập nhật danh sách cầu thủ cho đội đang có:
        const updatedTeams = tournament.teams.map(t => {
            // Tìm data mới trùng với teamId (hoặc thay đổi tuỳ logic)
            const newTeamData = teamsData.find(dt => dt.teamId === t.id);
            if (newTeamData) {
                return {
                    ...t,
                    players: newTeamData.players,
                    coachingStaff: newTeamData.coachingStaff,
                    playerCount: newTeamData.players.length
                };
            }
            return t;
        });

        // 3. Cập nhật lại giải đấu
        const updateCmd = new UpdateCommand({
            TableName: TOURNAMENT_TABLE,
            Key: { id: String(tournamentId) },
            UpdateExpression: "SET teams = :teams, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
                ":teams": updatedTeams,
                ":updatedAt": Date.now()
            }
        });

        await docClient.send(updateCmd);
        console.log("✅ Đã cập nhật thành công dữ liệu cầu thủ thực tế vào giải đấu!");

    } catch (error) {
        console.error("Lỗi khi seed:", error);
    }
}

// Chạy thử với teamDanhNhi (giả sử cập nhật vào đội có id bt1)
teamDanhNhi.teamId = "bt1"; // Map với Bình Tân FC trong dữ liệu mẫu
// seedRealPlayers(9999, [teamDanhNhi]);
