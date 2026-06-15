require('dotenv').config({ path: './apps/server/.env' });
const TeamRepo = require('./apps/server/src/repositories/team.repo');
const TeamMemberRepo = require('./apps/server/src/repositories/teamMember.repo');
const fs = require('fs');
const path = require('path');

const MANAGER_ID = "media1";
const TEAMS_DIR = path.join(__dirname, 'apps/server/uploads/teams');
const PUBLIC_BASE_URL = "/uploads/teams";

const TEAMS_INFO = [
    { key: "danhnhi", name: "Danh Nhi FC", short_name: "DNI" },
    { key: "locnuoc", name: "Lọc Nước - Mặt Trời Việt FC", short_name: "LNU" },
    { key: "haidang", name: "Hải Đăng Vivaco FC", short_name: "HDA" },
    { key: "vantuyen", name: "Vân Tuyền FC", short_name: "VTU" },
    { key: "ngocgiau", name: "Ngọc Giàu FC", short_name: "NGI" },
    { key: "nhiphong", name: "Nhi Phong FC", short_name: "NPH" },
    { key: "hoaden", name: "Hòa Đen FC", short_name: "HDE" },
    { key: "khangnguyen", name: "Khang Nguyễn FC", short_name: "KNG" }
];

// Helper to get random Vietnamese name
const FIRST_NAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
const MIDDLE_NAMES = ["Văn", "Hữu", "Thanh", "Công", "Đức", "Minh", "Quang", "Tiến", "Bảo", "Tuấn", "Hoài", "Quốc", "Gia", "Đình", "Thành"];
const LAST_NAMES = ["Anh", "Tuấn", "Minh", "Bảo", "Phúc", "Thịnh", "Đạt", "Hùng", "Sơn", "Long", "Cường", "Tài", "Lộc", "Phát", "Thắng", "Khánh", "Luân", "Hoài", "Ý"];

function getRandomName() {
    return `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${MIDDLE_NAMES[Math.floor(Math.random() * MIDDLE_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
}

async function getImagesForTeam(teamKey) {
    const dirPath = path.join(TEAMS_DIR, teamKey);
    if (!fs.existsSync(dirPath)) return [];
    const files = fs.readdirSync(dirPath);
    // Filter out danhsach.jpg
    return files.filter(f => f.match(/\.(jpg|jpeg|png)$/i) && !f.includes('danhsach')).map(f => `${PUBLIC_BASE_URL}/${teamKey}/${f}`);
}

async function getLogoForTeam(teamKey) {
    const logoDir = path.join(TEAMS_DIR, 'Logo_doi');
    if (!fs.existsSync(logoDir)) return null;
    const files = fs.readdirSync(logoDir);
    const logoFile = files.find(f => f.toLowerCase().includes(teamKey.replace('-', '')) || f.toLowerCase().includes(teamKey.split('-')[0]));
    return logoFile ? `${PUBLIC_BASE_URL}/Logo_doi/${logoFile}` : null;
}

// Real data for Danh Nhi
const DANH_NHI_PLAYERS = [
    { number: 1, name: "Dự Cua" }, { number: 2, name: "Quốc Khánh" }, { number: 3, name: "Phúc Luân" },
    { number: 4, name: "Thanh Hoài" }, { number: 5, name: "Hữu Ý" }, { number: 6, name: "Vĩnh Lộc" },
    { number: 7, name: "Văn Thắng" }, { number: 8, name: "Đăng Bình Điền" }, { number: 9, name: "Khánh Du" },
    { number: 10, name: "Minh Dũng" }, { number: 11, name: "Thanh Toàn" }, { number: 12, name: "Quốc Lâm" },
    { number: 13, name: "Ngọn Trường" }, { number: 14, name: "Chí Tâm" }, { number: 15, name: "Lý Nghĩa" },
    { number: 16, name: "Thanh Lợi" }, { number: 17, name: "Phan Thành Giang" }, { number: 18, name: "Vĩ Zico" },
    { number: 19, name: "Thành Được" }, { number: 20, name: "Hoài Thanh" }
];
const DANH_NHI_STAFF = [
    { name: "Khanh Sport", role: "coach" }, { name: "Hiếu Xavi", role: "coach" }, 
    { name: "Hoàn Võ", role: "coach" }, { name: "Hoàng Em", role: "coach" }, { name: "Thái Châu Phi", role: "coach" }
];

async function seed() {
    console.log(`Bắt đầu seed 8 đội bóng cho user: ${MANAGER_ID}`);
    let totalPlayers = 0;

    for (const info of TEAMS_INFO) {
        console.log(`\n================= Đang xử lý đội: ${info.name} =================`);
        
        // 1. Lấy Logo
        const logoUrl = await getLogoForTeam(info.key);
        console.log(`[Logo] ${logoUrl || 'Không tìm thấy logo'}`);

        // 2. Tạo Đội Bóng
        const teamData = {
            name: info.name,
            short_name: info.short_name,
            leader: `Trưởng đoàn ${info.name}`,
            logo_url: logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${info.key}`,
            primary_color: "#000000",
            status: "active"
        };

        const team = await TeamRepo.create(teamData, MANAGER_ID);
        console.log(`✅ Đã tạo Team: ${team.name} (ID: ${team.id})`);

        // 3. Lấy ảnh cầu thủ
        const playerImages = await getImagesForTeam(info.key);
        console.log(`[Ảnh cầu thủ] Tìm thấy ${playerImages.length} ảnh trong thư mục ${info.key}`);

        // 4. Tạo danh sách cầu thủ & BHL
        let playersToCreate = [];
        let staffToCreate = [];

        if (info.key === 'danhnhi') {
            playersToCreate = [...DANH_NHI_PLAYERS];
            staffToCreate = [...DANH_NHI_STAFF];
        } else {
            // Random khoảng 20 cầu thủ và 4 staff
            for (let i = 1; i <= 20; i++) {
                playersToCreate.push({ number: i, name: getRandomName() });
            }
            for (let i = 1; i <= 4; i++) {
                staffToCreate.push({ name: getRandomName() + " (BHL)", role: "coach" });
            }
        }

        // 5. Gán ảnh và lưu vào DB
        let imageIndex = 0;
        
        // Cầu thủ
        for (const p of playersToCreate) {
            const avatar = imageIndex < playerImages.length ? playerImages[imageIndex] : null;
            imageIndex++;
            
            const memberData = {
                name: p.name,
                shirtNumber: p.number,
                position: "Cầu thủ",
                role: "player",
                avatar: avatar
            };
            await TeamMemberRepo.create(memberData, team.id);
            totalPlayers++;
        }
        
        // BHL
        for (const s of staffToCreate) {
             const avatar = imageIndex < playerImages.length ? playerImages[imageIndex] : null;
             imageIndex++;
             
             const memberData = {
                 name: s.name,
                 shirtNumber: null,
                 position: "Ban huấn luyện",
                 role: s.role,
                 avatar: avatar
             };
             await TeamMemberRepo.create(memberData, team.id);
             totalPlayers++;
        }

        console.log(`✅ Đã thêm ${playersToCreate.length} cầu thủ và ${staffToCreate.length} BHL vào đội.`);
    }

    console.log(`\n🎉 SEED THÀNH CÔNG! Đã tạo 8 đội và tổng cộng ${totalPlayers} thành viên cho ${MANAGER_ID}.`);
    process.exit(0);
}

seed().catch(console.error);
