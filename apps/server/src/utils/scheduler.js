const { v4: uuidv4 } = require('uuid');

/**
 * Thuật toán tạo cặp đấu vòng tròn (Round Robin)
 */
const generateRoundRobin = (teams) => {
    let pool = [...teams];
    if (pool.length % 2 !== 0) {
        pool.push(null); // Bye
    }

    const rounds = [];
    const numTeams = pool.length;
    const numRounds = numTeams - 1;

    for (let r = 0; r < numRounds; r++) {
        const matches = [];
        for (let i = 0; i < numTeams / 2; i++) {
            const teamA = pool[i];
            const teamB = pool[numTeams - 1 - i];

            if (teamA !== null && teamB !== null) {
                matches.push({ teamA, teamB, roundIndex: r + 1 });
            }
        }
        if (matches.length > 0) rounds.push({ round: r + 1, matches });

        // Rotate
        pool.splice(1, 0, pool.pop());
    }
    return rounds;
};

/**
 * Sinh danh sách trận dẹt (Flatten List) dựa trên số lượng đội và Thể thức
 */
const generateStructure = (teams, format) => {
    let allMatches = [];

    if (format === 'League') {
        const rr = generateRoundRobin(teams);
        rr.forEach(r => r.matches.forEach(m => allMatches.push({ ...m, round: `Vòng ${r.round}`, group: null })));
    } 
    else if (format === 'GroupKnockout') {
        // Trộn và chia đều đội thành các bảng (Ví dụ bảng A, B, C, D)
        const shuffled = [...teams].sort(() => 0.5 - Math.random());
        // Giả sử mạc định 4 đội 1 bảng
        const numGroups = Math.max(2, Math.ceil(teams.length / 4));
        const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const groups = {};
        
        for (let i = 0; i < teams.length; i++) {
            const gName = groupNames[i % numGroups];
            if (!groups[gName]) groups[gName] = [];
            groups[gName].push(shuffled[i]);
        }

        // Lịch thi đấu vòng bảng
        Object.keys(groups).forEach(g => {
            if (groups[g].length > 1) {
                const rr = generateRoundRobin(groups[g]);
                rr.forEach(r => r.matches.forEach(m => allMatches.push({ ...m, round: `Vòng bảng`, group: `Bảng ${g}` })));
            }
        });

        // Knockout phase placeholders (Based on group count)
        if (numGroups === 2 || numGroups === 3) {
            allMatches.push({ teamA: { name: 'Nhất A' }, teamB: { name: 'Nhì B' }, round: 'Bán kết', group: null });
            allMatches.push({ teamA: { name: 'Nhất B' }, teamB: { name: 'Nhì A' }, round: 'Bán kết', group: null });
            allMatches.push({ teamA: { name: 'Thắng BK1' }, teamB: { name: 'Thắng BK2' }, round: 'Chung kết', group: null });
            allMatches.push({ teamA: { name: 'Thua BK1' }, teamB: { name: 'Thua BK2' }, round: 'Tranh Hạng 3', group: null });
        } else if (numGroups >= 4) {
            allMatches.push({ teamA: { name: 'Nhất A' }, teamB: { name: 'Nhì B' }, round: 'Tứ kết', group: null });
            allMatches.push({ teamA: { name: 'Nhất C' }, teamB: { name: 'Nhì D' }, round: 'Tứ kết', group: null });
            allMatches.push({ teamA: { name: 'Nhất B' }, teamB: { name: 'Nhì A' }, round: 'Tứ kết', group: null });
            allMatches.push({ teamA: { name: 'Nhất D' }, teamB: { name: 'Nhì C' }, round: 'Tứ kết', group: null });
            allMatches.push({ teamA: { name: 'Thắng TK1' }, teamB: { name: 'Thắng TK2' }, round: 'Bán kết', group: null });
            allMatches.push({ teamA: { name: 'Thắng TK3' }, teamB: { name: 'Thắng TK4' }, round: 'Bán kết', group: null });
            allMatches.push({ teamA: { name: 'Thắng BK1' }, teamB: { name: 'Thắng BK2' }, round: 'Chung kết', group: null });
        }
    } 
    else if (format === 'Knockout') {
        // Random pairs for basic knockout tree mapping
        let currentRound = [...teams].sort(() => 0.5 - Math.random());
        let roundCounter = 1;
        while (currentRound.length > 1) {
            let nextRoundNum = Math.ceil(currentRound.length / 2);
            let roundName = nextRoundNum === 1 ? 'Chung kết' : nextRoundNum === 2 ? 'Bán kết' : nextRoundNum === 4 ? 'Tứ kết' : `Vòng Loại ${roundCounter}`;
            let nextRoundPlaceholders = [];

            for (let i = 0; i < currentRound.length; i += 2) {
                const teamA = currentRound[i];
                const teamB = currentRound[i + 1] || null; // Bye if odd
                
                if (teamA && teamB) {
                    allMatches.push({ teamA, teamB, round: roundName, group: null });
                    nextRoundPlaceholders.push({ name: `Thắng Trận ${allMatches.length}` });
                } else if (teamA) {
                    // Bye - auto advance
                    nextRoundPlaceholders.push(teamA);
                }
            }
            currentRound = nextRoundPlaceholders;
            roundCounter++;
        }
    } else {
        // Fallback for DoubleElimination or random formats
        return generateStructure(teams, 'Knockout');
    }

    return allMatches;
};

/**
 * Hàm phân bổ Greedy - Thuật toán ngấu nghiến gán trận đấu vào Slot trống
 * slotsConfig format from UI:
 * [
 *    { date: 'YYYY-MM-DD', slots: [ { time: '18:00', pitchesCount: 2 }, { time: '19:00', pitchesCount: 2 } ] }
 * ]
 */
const allocateGreedy = (matches, slotsConfig) => {
    // 1. Sinh toàn bộ ma trận Slot hợp lệ (chưa bị chiếm dụng)
    const flatSlots = [];
    slotsConfig.forEach(day => {
        // Format of slots is array, sort them by time
        const sortedSlots = [...day.slots].sort((a,b) => a.time.localeCompare(b.time));
        sortedSlots.forEach(s => {
            for (let p = 1; p <= Number(s.pitchesCount); p++) {
                flatSlots.push({
                    date: day.date,
                    time: s.time,
                    pitchNumber: p,
                    usedByMatch: null
                });
            }
        });
    });

    const scheduledMatches = [];
    const teamActivityMap = {}; // Tracks: { "YYYY-MM-DD_18:00": ["teamId1", "teamId2"] } to avoid clash

    // 2. Greedy Allocation
    matches.forEach((match, index) => {
        const tA = match.teamA?.id || match.teamA?.teamId || match.teamA?.name || 'TBA1';
        const tB = match.teamB?.id || match.teamB?.teamId || match.teamB?.name || 'TBA2';

        // Tìm slot trống hợp lệ đầu tiên
        const validSlot = flatSlots.find(slot => {
            if (slot.usedByMatch !== null) return false; // Sân đã có người đá

            const dateTimeKey = `${slot.date}_${slot.time}`;
            const activeTeamsInSlot = teamActivityMap[dateTimeKey] || [];
            
            // Validate: Không được đá 2 trận cùng 1 thời điểm (cùng giờ, cùng ngày)
            if (activeTeamsInSlot.includes(tA) || activeTeamsInSlot.includes(tB)) {
                return false; 
            }

            return true;
        });

        if (validSlot) {
            validSlot.usedByMatch = index;
            const dateTimeKey = `${validSlot.date}_${validSlot.time}`;
            if (!teamActivityMap[dateTimeKey]) teamActivityMap[dateTimeKey] = [];
            teamActivityMap[dateTimeKey].push(tA, tB);

            scheduledMatches.push({
                ...match,
                matchDate: validSlot.date,
                startTime: validSlot.time,
                pitchNumber: `Sân ${validSlot.pitchNumber}`,
                matchLabel: match.round || `Trận`
            });
        } else {
            // Out of capacity
            throw new Error(`Kho slot phân bổ đã cạn kiệt! Không thể tìm thấy suất đá hợp lệ cho: [${match.teamA?.teamName || match.teamA?.name || 'Đội 1'} vs ${match.teamB?.teamName || match.teamB?.name || 'Đội 2'}]. Vui lòng cấp thêm Ngày/Giờ thi đấu!`);
        }
    });

    return scheduledMatches;
};

module.exports = {
    generateRoundRobin,
    generateStructure,
    allocateGreedy
};
