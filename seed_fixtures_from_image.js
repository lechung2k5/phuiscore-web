require('dotenv').config({ path: './apps/server/.env' });
const { v4: uuidv4 } = require('uuid');
const TournamentRepo = require('./apps/server/src/repositories/tournament.repo');
const MatchRepo = require('./apps/server/src/repositories/match.repo');

const TOURNAMENT_ID = '5ac6ac30-fd8c-44a4-af02-fd88dbafaac0';

const GROUPS = {
    A: ['Nhi Phong FC', 'Ngọc Giàu FC', 'Khang Nguyễn FC', 'Hòa Đen FC'],
    B: ['Danh Nhi FC', 'Lọc Nước - Mặt Trời Việt FC', 'Vân Tuyền FC', 'Hải Đăng Vivaco FC']
};

const RAW_MATCHES = [
    // Vòng Bảng
    ['20/06/2026', '18:00', 'Nhi Phong FC', 'Khang Nguyễn FC', 'A', 'Sân 1', 'VÒNG BẢNG'],
    ['20/06/2026', '18:00', 'Lọc Nước - Mặt Trời Việt FC', 'Hải Đăng Vivaco FC', 'B', 'Sân 2', 'VÒNG BẢNG'],
    ['20/06/2026', '19:30', 'Danh Nhi FC', 'Vân Tuyền FC', 'B', 'Sân 1', 'VÒNG BẢNG'],
    ['20/06/2026', '19:30', 'Ngọc Giàu FC', 'Hòa Đen FC', 'A', 'Sân 2', 'VÒNG BẢNG'],
    
    ['21/06/2026', '18:00', 'Lọc Nước - Mặt Trời Việt FC', 'Vân Tuyền FC', 'B', 'Sân 1', 'VÒNG BẢNG'],
    ['21/06/2026', '18:00', 'Nhi Phong FC', 'Hòa Đen FC', 'A', 'Sân 2', 'VÒNG BẢNG'],
    ['21/06/2026', '19:30', 'Ngọc Giàu FC', 'Khang Nguyễn FC', 'A', 'Sân 1', 'VÒNG BẢNG'],
    ['21/06/2026', '19:30', 'Danh Nhi FC', 'Hải Đăng Vivaco FC', 'B', 'Sân 2', 'VÒNG BẢNG'],
    
    ['27/06/2026', '18:00', 'Nhi Phong FC', 'Ngọc Giàu FC', 'A', 'Sân 1', 'VÒNG BẢNG'],
    ['27/06/2026', '18:00', 'Khang Nguyễn FC', 'Hòa Đen FC', 'A', 'Sân 2', 'VÒNG BẢNG'],
    ['27/06/2026', '19:30', 'Danh Nhi FC', 'Lọc Nước - Mặt Trời Việt FC', 'B', 'Sân 1', 'VÒNG BẢNG'],
    ['27/06/2026', '19:30', 'Vân Tuyền FC', 'Hải Đăng Vivaco FC', 'B', 'Sân 2', 'VÒNG BẢNG'],

    // Bán Kết
    ['28/06/2026', '18:00', 'Nhất A', 'Nhì B', null, 'Sân 1', 'BÁN KẾT 1'],
    ['28/06/2026', '19:30', 'Nhất B', 'Nhì A', null, 'Sân 1', 'BÁN KẾT 2'],
    
    // Tranh Hạng 3 & Chung Kết
    ['05/07/2026', '17:30', 'Thua BK1', 'Thua BK2', null, 'Sân 1', 'TRANH HẠNG 3'],
    ['05/07/2026', '19:30', 'Thắng BK1', 'Thắng BK2', null, 'Sân 1', 'CHUNG KẾT'],
];

async function seed() {
    try {
        const tournament = await TournamentRepo.getById(TOURNAMENT_ID);
        if (!tournament) {
            console.error('Không tìm thấy giải đấu:', TOURNAMENT_ID);
            return;
        }

        // Tạo map team_name -> team object để lấy logo/id
        const teamMap = new Map();
        if (tournament.teams) {
            for (const t of tournament.teams) {
                teamMap.set(t.teamName, {
                    id: t.id,
                    name: t.teamName,
                    logo: t.logo,
                    players: t.players || []
                });
            }
        }

        // Cấu trúc nhóm
        const groupsConfig = {};
        for (const [groupName, teamNames] of Object.entries(GROUPS)) {
            groupsConfig[groupName] = {
                id: `group_${groupName}`,
                name: `Bảng ${groupName}`,
                teams: teamNames.map(name => {
                    const t = teamMap.get(name);
                    return {
                        id: t ? t.id : uuidv4(),
                        name: name,
                        logo: t ? t.logo : ''
                    };
                })
            };
        }

        console.log('🔄 Đang xóa lịch thi đấu cũ...');
        await MatchRepo.deleteMatchesByTournament(TOURNAMENT_ID);

        console.log('⚽ Đang tạo lịch thi đấu mới...');
        const matchesToSave = [];

        for (const row of RAW_MATCHES) {
            const [dateStr, timeStr, homeName, awayName, group, stadium, round] = row;
            
            // Format YYYY-MM-DD
            const [dd, mm, yyyy] = dateStr.split('/');
            const dateString = `${yyyy}-${mm}-${dd}`;

            // Parse datetime to timestamp
            const dt = new Date(`${yyyy}-${mm}-${dd}T${timeStr}:00+07:00`);
            const startTimestamp = dt.getTime();

            const homeObj = teamMap.get(homeName) || { id: `placeholder_${homeName}`, name: homeName, logo: '' };
            const awayObj = teamMap.get(awayName) || { id: `placeholder_${awayName}`, name: awayName, logo: '' };

            const match = {
                id: uuidv4(),
                tournamentId: TOURNAMENT_ID,
                tournamentName: tournament.name,
                tournamentLogo: tournament.logo,
                dateString: dateString,
                timeString: timeStr,
                startTimestamp: startTimestamp,
                stadium: stadium,
                pitchNumber: stadium,
                round: round,
                group: group ? `Bảng ${group}` : null,
                homeTeam: homeObj,
                awayTeam: awayObj,
                status: 'scheduled',
                score: { home: 0, away: 0 },
                homeScore: 0,
                awayScore: 0,
                currentMinute: ''
            };
            matchesToSave.push(match);
        }

        await MatchRepo.saveMatchesBatch(matchesToSave);

        // Update groups on Tournament
        await TournamentRepo.update(TOURNAMENT_ID, {
            groups: groupsConfig
        });

        console.log('✅ Đã seed lịch thi đấu thành công!');

    } catch (err) {
        console.error('Lỗi seed:', err);
    }
}

seed();
