require('dotenv').config({ path: './apps/server/.env' });
const TeamRepo = require('./apps/server/src/repositories/team.repo');
const TeamMemberRepo = require('./apps/server/src/repositories/teamMember.repo');

const MANAGER_ID = "media1";
const PUBLIC_BASE_URL = "http://localhost:8080/uploads/teams";

const TEAMS_REAL_DATA = [
    {
        key: "danhnhi", name: "Danh Nhi FC", short_name: "DNI",
        logoFile: "danh-nhi.png",
        players: [
            { number: 1, name: "Dự Cua" }, { number: 2, name: "Quốc Khánh" }, { number: 3, name: "Phúc Luân" },
            { number: 4, name: "Thanh Hoài" }, { number: 5, name: "Hữu Ý" }, { number: 6, name: "Vĩnh Lộc" },
            { number: 7, name: "Văn Thắng" }, { number: 8, name: "Đăng Bình Điền" }, { number: 9, name: "Khánh Du" },
            { number: 10, name: "Minh Dũng" }, { number: 11, name: "Thanh Toàn" }, { number: 12, name: "Quốc Lâm" },
            { number: 13, name: "Ngọn Trường" }, { number: 14, name: "Chí Tâm" }, { number: 15, name: "Lý Nghĩa" },
            { number: 16, name: "Thanh Lợi" }, { number: 17, name: "Phan Thành Giang" }, { number: 18, name: "Vĩ Zico" },
            { number: 19, name: "Thành Được" }, { number: 20, name: "Hoài Thanh" }
        ],
        staff: [
            { role: "Trưởng đoàn", name: "Khanh Sport" }, { role: "Huấn luyện viên", name: "Hiếu Xavi" },
            { role: "Ban huấn luyện", name: "Hoàn Võ" }, { role: "Ban huấn luyện", name: "Hoàng Em" },
            { role: "Ban huấn luyện", name: "Thái Châu Phi" }
        ]
    },
    {
        key: "vantuyen", name: "Vân Tuyền FC", short_name: "VTU",
        logoFile: "van-tuyen.jpg",
        players: [
            { number: 1, name: "Keo Sarath" }, { number: 2, name: "Khoa Kalu" }, { number: 3, name: "Đức Liêm" },
            { number: 4, name: "Đức Valverde" }, { number: 5, name: "Hoàng Minh" }, { number: 6, name: "Nguyễn Minh Triều" },
            { number: 7, name: "Lực Neymar" }, { number: 8, name: "Tài Max" }, { number: 9, name: "Hoà M3P" },
            { number: 10, name: "Phát Chuông" }, { number: 11, name: "Huỳnh Ramos" }, { number: 12, name: "Thanh Haza" },
            { number: 13, name: "Tủn Macelo" }, { number: 14, name: "Vinb Lukaku" }, { number: 15, name: "Ny CR" },
            { number: 16, name: "Công Võ Tòng" }, { number: 17, name: "Duy Doremon" }, { number: 18, name: "Viễn Kepa" },
            { number: 19, name: "Hậu Kevin" }, { number: 20, name: "Bin" }
        ],
        staff: [
            { role: "Trưởng đoàn", name: "Khúc Ngọc Dũng" }, { role: "Huấn luyện viên", name: "Công Võ Tòng" },
            { role: "Ban huấn luyện", name: "Chảy Alves" }, { role: "Ban huấn luyện", name: "Hậu Kevin" }
        ]
    },
    {
        key: "haidang", name: "Hải Đăng Vivaco FC", short_name: "HDA",
        logoFile: "hai-dang.png",
        players: [
            { number: 1, name: "Sơn Heung Min" }, { number: 2, name: "Vũ Foden" }, { number: 3, name: "Phonng Công Tử" },
            { number: 4, name: "Nhật Cao" }, { number: 5, name: "Sy JR" }, { number: 6, name: "Tùng 38" },
            { number: 7, name: "Nam Bình Điền" }, { number: 8, name: "Ken Du" }, { number: 9, name: "Toni Đam" },
            { number: 10, name: "Hào Kaka" }, { number: 11, name: "Y Sắc" }, { number: 12, name: "Mắt Kính" },
            { number: 13, name: "Vũ Messi" }, { number: 14, name: "Tuấn Vũ" }, { number: 15, name: "Minh Hưng" },
            { number: 16, name: "Văn Hùng" }, { number: 17, name: "Chung Ji Sung" }, { number: 18, name: "Tuấn Ku" },
            { number: 19, name: "Tuấn Tường" }, { number: 20, name: "Tây Alaba" }
        ],
        staff: [
            { role: "Trưởng đoàn", name: "Toni Toàn" }, { role: "Huấn luyện viên", name: "Quân Eto" },
            { role: "Ban huấn luyện", name: "Dương Sugar" }, { role: "Ban huấn luyện", name: "Cường Đặng" },
            { role: "Ban huấn luyện", name: "Capdevila" }
        ]
    },
    {
        key: "hoaden", name: "Hòa Đen FC", short_name: "HDE",
        logoFile: "hoa-den.png",
        players: [
            { number: 1, name: "Hòa Đen" }, { number: 2, name: "Phong Mane" }, { number: 3, name: "Văn Nghi" },
            { number: 4, name: "Tuấn Tài" }, { number: 5, name: "Hữu Bằng" }, { number: 6, name: "Hải Đăng" },
            { number: 7, name: "Phát Nhỏ" }, { number: 8, name: "Bảo An" }, { number: 9, name: "Hoàng Chu" },
            { number: 10, name: "Đạt Bi" }, { number: 11, name: "Lương Văn" }, { number: 12, name: "Đình Trường" },
            { number: 13, name: "Thịnh Ben" }, { number: 14, name: "Thành Công" }, { number: 15, name: "Onuora JR" },
            { number: 16, name: "Trung Trực" }, { number: 17, name: "Minh Lee" }, { number: 18, name: "Hoàng Long" },
            { number: 19, name: "Quốc Thông" }, { number: 20, name: "Tú La" }
        ],
        staff: [
            { role: "Chủ tịch", name: "Hoà Đen" }, { role: "Huấn luyện viên", name: "Phúc Trần" },
            { role: "Ban huấn luyện", name: "Phong Phú" }, { role: "Ban huấn luyện", name: "Trọng Nghĩa" }
        ]
    },
    {
        key: "ngocgiau", name: "Ngọc Giàu FC", short_name: "NGI",
        logoFile: "ngoc-giau.jpg",
        players: [
            { number: 1, name: "Huy Lắc" }, { number: 2, name: "Cấp Cao" }, { number: 3, name: "Văn Hậu" },
            { number: 4, name: "Kha Min" }, { number: 5, name: "Trọng Nghĩa" }, { number: 6, name: "Huy Hoàng" },
            { number: 7, name: "Bình Thầy Giáo" }, { number: 8, name: "Minh Hảo" }, { number: 9, name: "Quốc Huy" },
            { number: 10, name: "Ngọc Lễ" }, { number: 11, name: "Đức Huy" }, { number: 12, name: "Anh Vũ JR" },
            { number: 13, name: "Tuấn Sĩ" }, { number: 14, name: "Thái Nguyên" }, { number: 15, name: "Khả Duy" },
            { number: 16, name: "Toàn Max" }, { number: 17, name: "Phúc Thịnh" }, { number: 18, name: "Sang Bê" },
            { number: 19, name: "Dũng Bò" }, { number: 20, name: "Thái Malouda" }
        ],
        staff: [
            { role: "Trưởng đoàn", name: "Minh Nhân" }, { role: "Huấn luyện viên", name: "Trọng Nguyễn" },
            { role: "Ban huấn luyện", name: "Đạt Boy" }, { role: "Ban huấn luyện", name: "Bá Thiên" },
            { role: "Ban huấn luyện", name: "Bảo Khang" }
        ]
    },
    {
        key: "nhiphong", name: "Nhi Phong FC", short_name: "NPH",
        logoFile: "nhi-phong.png",
        players: [
            { number: 1, name: "Trung Hội" }, { number: 2, name: "Dương Linh" }, { number: 3, name: "Lâm Khiêu" },
            { number: 4, name: "Gia Huy" }, { number: 5, name: "Nghị Phan" }, { number: 6, name: "Hoà Nunez" },
            { number: 7, name: "Ku Hên" }, { number: 8, name: "Tâm Nguyễn" }, { number: 9, name: "Kiệt Đen" },
            { number: 10, name: "Trần Cảnh" }, { number: 11, name: "Chou Sìn" }, { number: 12, name: "Nguyễn Ry" },
            { number: 13, name: "Tấn Đạt" }, { number: 14, name: "Gia Khánh" }, { number: 15, name: "Thịnh Con" },
            { number: 16, name: "Phú Nhỏ" }, { number: 17, name: "Hoài Thương" }, { number: 18, name: "Cảnh Degea" },
            { number: 19, name: "Huy Doremon" }, { number: 20, name: "Văn Bình" }
        ],
        staff: [
            { role: "Chủ tịch", name: "Nghị Trần" }, { role: "Huấn luyện viên", name: "Lý Bảo Đức" },
            { role: "Trợ lý HLV", name: "Phương Trần" }, { role: "Ban huấn luyện", name: "Thắm Nguyễn" },
            { role: "Ban huấn luyện", name: "Duy Tân" }
        ]
    },
    {
        key: "locnuoc", name: "Lọc Nước - Mặt Trời Việt FC", short_name: "LNU",
        logoFile: "loc-nuoc.jpg",
        players: [
            { number: 1, name: "Tề Thiên" }, { number: 2, name: "Sơn Dybala" }, { number: 3, name: "Đăng Vinh" },
            { number: 4, name: "Quốc Mãng" }, { number: 5, name: "Đức Tiến" }, { number: 6, name: "Minh Thuận" },
            { number: 7, name: "Thành Nhân" }, { number: 8, name: "Linh Mizuno" }, { number: 9, name: "Quốc Thạnh" },
            { number: 10, name: "Quốc Huy" }, { number: 11, name: "Đại Vệ" }, { number: 12, name: "Sang Chíp" },
            { number: 13, name: "Khởi Ka" }, { number: 14, name: "Long Messi" }, { number: 15, name: "Linh Boppy" },
            { number: 16, name: "Ronachum" }, { number: 17, name: "Quang Hải" }, { number: 18, name: "Nụ Ninô" },
            { number: 19, name: "Phát La" }, { number: 20, name: "Trần Lâm Khánh Duy" }
        ],
        staff: [
            { role: "Trưởng đoàn", name: "Vỹ Hakimi" }, { role: "Huấn luyện viên", name: "Lộc Sado" },
            { role: "Ban huấn luyện", name: "Văn Khang" }, { role: "Ban huấn luyện", name: "Sư Thầy" }
        ]
    },
    {
        key: "khangnguyen", name: "Khang Nguyễn FC", short_name: "KNG",
        logoFile: "khang-nguyen.jpg",
        players: [
            { number: 1, name: "Khang Huy" }, { number: 2, name: "Hoàng Vũ" }, { number: 3, name: "Thanh Vinh" },
            { number: 4, name: "Thanh Minh" }, { number: 5, name: "Đức Cường" }, { number: 6, name: "Thanh Điền" },
            { number: 7, name: "Minh Hường" }, { number: 8, name: "Minh Hùng" }, { number: 9, name: "Văn Lệ" },
            { number: 10, name: "Công Sơn" }, { number: 11, name: "Nhuyên Kiệt" }, { number: 12, name: "Thượng Quang" },
            { number: 13, name: "Phương Huy" }, { number: 14, name: "Đặng Tuấn" }, { number: 15, name: "Huy Trương" },
            { number: 16, name: "Thương CR" }, { number: 17, name: "Hậu Nhỏ" }, { number: 18, name: "Tấn Nghĩa" },
            { number: 19, name: "Thành Phát" }, { number: 20, name: "Nguyễn Flo" }
        ],
        staff: [
            { role: "Chủ tịch", name: "Khang Nguyễn" }, { role: "HLV", name: "Trần Bửu Ngọc" },
            { role: "SSV", name: "Trần Nhật Tuân" }
        ]
    }
];

async function seedRealData() {
    console.log(`[1] Đang xóa dữ liệu cũ của ${MANAGER_ID}...`);
    try {
        const oldTeams = await TeamRepo.getByManagerId(MANAGER_ID);
        for (const t of oldTeams) {
            // Delete members
            const members = await TeamMemberRepo.getByTeamId(t.id);
            for (const m of members) {
                await TeamMemberRepo.delete(m.id);
            }
            // Delete team
            await TeamRepo.delete(t.id);
        }
        console.log(`Đã xóa ${oldTeams.length} đội cũ.`);
    } catch (e) {
        console.log("Lỗi xóa đội cũ:", e.message);
    }

    console.log(`[2] Bắt đầu seed dữ liệu CHÍNH XÁC 8 ĐỘI KÈM LOGO...`);
    let totalPlayers = 0;

    for (const info of TEAMS_REAL_DATA) {
        console.log(`\n================= ${info.name} =================`);
        
        const logoUrl = `${PUBLIC_BASE_URL}/Logo_doi/${info.logoFile}`;
        
        const teamData = {
            name: info.name,
            short_name: info.short_name,
            leader: info.staff[0] ? info.staff[0].name : "Manager",
            logo_url: logoUrl,
            status: "active"
        };

        const team = await TeamRepo.create(teamData, MANAGER_ID);
        console.log(`✅ Đã tạo Team: ${team.name} với logo: ${logoUrl}`);

        for (const p of info.players) {
            const memberData = {
                name: p.name,
                shirtNumber: p.number,
                position: "Cầu thủ",
                role: "player"
            };
            await TeamMemberRepo.create(memberData, team.id);
            totalPlayers++;
        }
        
        let staffIndex = 1;
        for (const s of info.staff) {
             const memberData = {
                 name: s.name,
                 shirtNumber: 990 + staffIndex, // DB require number to be indexed
                 position: s.role,
                 role: "coach"
             };
             await TeamMemberRepo.create(memberData, team.id);
             staffIndex++;
             totalPlayers++;
        }
    }

    console.log(`\n🎉 XONG! Đã seed lại chính xác 8 đội với ${totalPlayers} thành viên (đã có LOGO ĐỘI) cho media1.`);
    process.exit(0);
}

seedRealData().catch(console.error);
