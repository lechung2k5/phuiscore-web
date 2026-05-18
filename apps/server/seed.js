const MatchRepo = require('./src/repositories/match.repo');
const TournamentRepo = require('./src/repositories/tournament.repo');
const NewsRepo = require('./src/repositories/news.repo');

async function seed() {
    console.log('🚀 Đang bắt đầu nạp dữ liệu mẫu...');

    try {
        // 1. Seed Tournaments
        const t1 = await TournamentRepo.create({
            name: 'Giải bóng đá Phủi Hà Nội 2026',
            region: 'Hà Nội',
            maxTeams: 16,
            organizerName: 'BTC Phủi Hà Nội',
            status: 'Ongoing'
        });
        const t2 = await TournamentRepo.create({
            name: 'Cúp Vô Địch Miền Nam - Season 5',
            region: 'TP.HCM',
            maxTeams: 32,
            organizerName: 'Saigon Football',
            status: 'Registration'
        });

        // 2. Seed Matches for Today
        const today = new Date().toISOString().split('T')[0];
        const dummyMatches = [
            {
                id: 'match_001',
                dateString: today,
                tournamentId: t1.id,
                tournamentName: t1.name,
                homeTeam: { name: 'Thành Đồng FC', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=td' },
                awayTeam: { name: 'Cường Quốc FC', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=cq' },
                status: 'live',
                score: { home: 2, away: 1 },
                currentMinute: '45'
            },
            {
                id: 'match_002',
                dateString: today,
                tournamentId: t1.id,
                tournamentName: t1.name,
                homeTeam: { name: 'EOC FC', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=eoc' },
                awayTeam: { name: 'Dương Nội FC', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=dn' },
                status: 'inprogress',
                score: { home: 0, away: 0 },
                currentMinute: '15'
            }
        ];
        await MatchRepo.saveMatchesBatch(dummyMatches);

        console.log('✅ Đã nạp dữ liệu thành công!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Lỗi nạp dữ liệu:', e.message);
        process.exit(1);
    }
}

seed();
