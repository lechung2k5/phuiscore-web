const MatchRepo = require('../repositories/match.repo');
const axios = require('axios');

const stateMap = new Map();

// Helper to map DB Match to vMix format
const mapDbToOverlay = (dbMatch) => {
    const baseLayers = {
        scoreboardTop: { visible: false, zIndex: 50 },
        scoreboardBottom: { visible: false, zIndex: 40 },
        goalPopup: { visible: false, zIndex: 80, data: null },
        substitution: { visible: false, zIndex: 80, data: null },
        cardPopup: { visible: false, zIndex: 80, data: null },
        coachPopup: { visible: false, zIndex: 82, data: null },
        lineup: { visible: false, zIndex: 70, data: null },
        penaltyBoard: { visible: false, zIndex: 75 },
        sponsorOverlay: { visible: false, zIndex: 60, data: null },
        mediaLogo: { visible: false, zIndex: 30, data: { logo: "", name: "" } },
        prematchBanner: { visible: false, zIndex: 90 },
        eventTicker: { visible: false, zIndex: 65, data: [] }
    };

    return {
        matchInfo: {
            tournamentName: dbMatch.tournamentName || "Giải đấu",
            round: dbMatch.round || "",
            period: dbMatch.status || "PRE_MATCH",
            venue: dbMatch.stadium || "",
            status: dbMatch.status || "PRE_MATCH",
            time: (dbMatch.currentMinute && !isNaN(parseInt(dbMatch.currentMinute))) ? parseInt(dbMatch.currentMinute) * 60 : 0,
            isRunning: dbMatch.liveStatus === 'streaming',
            date: dbMatch.dateString,
            facebookLiveUrl: dbMatch.facebookLiveUrl || ''
        },
        homeTeam: {
            name: dbMatch.homeTeam?.name || "Đội Nhà",
            shortName: dbMatch.homeTeam?.name?.substring(0,3).toUpperCase() || "HOME",
            logo: dbMatch.homeTeam?.logo || "https://via.placeholder.com/150",
            score: dbMatch.score?.home || 0,
            penalties: ['pending', 'pending', 'pending', 'pending', 'pending'],
            goals: (dbMatch.incidents || []).filter(i => i.team === 'home' && i.type === 'goal').map(i => ({ id: i.id, playerName: i.playerName, minute: i.minute })),
            cards: (dbMatch.incidents || []).filter(i => i.team === 'home' && (i.type === 'yellow_card' || i.type === 'red_card')).map(i => ({ id: i.id, type: i.type, playerName: i.playerName, minute: i.minute })),
            subs: (dbMatch.incidents || []).filter(i => i.team === 'home' && i.type === 'sub').map(i => ({ id: i.id, playerOutName: i.playerOutName, playerInName: i.playerInName, minute: i.minute }))
        },
        awayTeam: {
            name: dbMatch.awayTeam?.name || "Đội Khách",
            shortName: dbMatch.awayTeam?.name?.substring(0,3).toUpperCase() || "AWAY",
            logo: dbMatch.awayTeam?.logo || "https://via.placeholder.com/150",
            score: dbMatch.score?.away || 0,
            penalties: ['pending', 'pending', 'pending', 'pending', 'pending'],
            goals: (dbMatch.incidents || []).filter(i => i.team === 'away' && i.type === 'goal').map(i => ({ id: i.id, playerName: i.playerName, minute: i.minute })),
            cards: (dbMatch.incidents || []).filter(i => i.team === 'away' && (i.type === 'yellow_card' || i.type === 'red_card')).map(i => ({ id: i.id, type: i.type, playerName: i.playerName, minute: i.minute })),
            subs: (dbMatch.incidents || []).filter(i => i.team === 'away' && i.type === 'sub').map(i => ({ id: i.id, playerOutName: i.playerOutName, playerInName: i.playerInName, minute: i.minute }))
        },
        incidents: dbMatch.incidents || [],
        lineups: dbMatch.lineups || null,
        layers: baseLayers,
        dbData: dbMatch
    };
};

const initMatchState = async (date, matchId) => {
    const dbMatch = await MatchRepo.getMatch(date, matchId);
    if (dbMatch) {
        const state = mapDbToOverlay(dbMatch);
        stateMap.set(matchId, state);
        return state;
    }
    
    // Nếu không tìm thấy trong DB, fallback tạo rỗng
    const fallbackState = mapDbToOverlay({ 
        id: matchId, 
        dateString: date,
        score: { home: 0, away: 0 }
    });
    stateMap.set(matchId, fallbackState);
    return fallbackState;
};

const getOverlayState = (matchId) => {
    return stateMap.get(matchId);
};

const lastSyncedDataMap = new Map();

// Bất đồng bộ lưu vào DB
const syncToDynamoDBAsync = async (matchId, state) => {
    try {
        const date = state.matchInfo.date;
        if (!date) return;

        let currentMinuteStr = Math.floor((state.matchInfo.time || 0) / 60).toString();
        const statusStr = state.matchInfo.status || 'FIRST_HALF';
        if (statusStr === 'HALF_TIME') currentMinuteStr = 'HT';
        if (statusStr === 'FINISHED') currentMinuteStr = 'FT';

        const updateData = {
            homeScore: state.homeTeam.score,
            awayScore: state.awayTeam.score,
            currentMinute: currentMinuteStr,
            liveStatus: state.matchInfo.isRunning ? 'streaming' : 'idle',
            incidents: state.incidents || [],
            status: statusStr,
            lineups: state.lineups || null,
            facebookLiveUrl: state.matchInfo.facebookLiveUrl,
            isDraft: false
        };

        const currentHash = JSON.stringify(updateData);
        if (lastSyncedDataMap.get(matchId) === currentHash) return;
        lastSyncedDataMap.set(matchId, currentHash);

        // Lưu DynamoDB
        await MatchRepo.updateMatchScoreboard(date, matchId, updateData);
        
        // Gọi Webhook
        const MAIN_SERVER_URL = process.env.MAIN_SERVER_URL || 'http://localhost:5000';
        const SYNC_TOKEN = process.env.SYNC_TOKEN || 'phuiscore_secret_2026';
        
        axios.post(`${MAIN_SERVER_URL}/api/sync/vmix-webhook`, {
            token: SYNC_TOKEN,
            matchId: matchId,
            date: date,
            homeScore: updateData.homeScore,
            awayScore: updateData.awayScore,
            currentMinute: updateData.currentMinute,
            liveStatus: updateData.liveStatus,
            status: updateData.status,
            incidents: updateData.incidents,
            lineups: updateData.lineups,
            facebookLiveUrl: updateData.facebookLiveUrl,
            tournamentId: state.dbData?.tournamentId || state.dbData?.info?.tournamentId || (state.dbData?.gsi1_pk ? state.dbData.gsi1_pk.replace('TOURNAMENT#', '') : null)
        }).catch(e => {
            // Ẩn log lỗi Webhook nếu server chính (Main Server) đang tắt 
            // để tránh bị spam console khi chạy hoàn toàn độc lập.
            if (e.code !== 'ECONNREFUSED' && e.code !== 'ERR_NETWORK') {
                console.error(`[Webhook Error] Không thể gọi tới main server: ${e.message}`);
            }
        });

    } catch (err) {
        console.error(`[DB Sync Error] ${err.message}`);
    }
};

// Optimistic Update
const updateOverlayState = (matchId, newState) => {
    const currentState = getOverlayState(matchId);
    if (!currentState) return null;

    const updatedLayers = { ...currentState.layers };
    if (newState.layers) {
        Object.keys(newState.layers).forEach(layerKey => {
            updatedLayers[layerKey] = { ...updatedLayers[layerKey], ...newState.layers[layerKey] };
        });
    }

    const updatedState = {
        ...currentState,
        ...newState,
        matchInfo: { ...currentState.matchInfo, ...(newState.matchInfo || {}) },
        homeTeam: { ...currentState.homeTeam, ...(newState.homeTeam || {}) },
        awayTeam: { ...currentState.awayTeam, ...(newState.awayTeam || {}) },
        layers: updatedLayers
    };
    
    // Cập nhật memory ngay lập tức
    stateMap.set(matchId, updatedState);

    // Kích hoạt tiến trình chạy ngầm lưu DB (Throttled update có thể áp dụng ở controller, hoặc lưu thẳng)
    if (newState.matchInfo || newState.homeTeam || newState.awayTeam) {
        // Chỉ lưu khi có thay đổi dữ liệu (bỏ qua nếu chỉ cập nhật layer)
        syncToDynamoDBAsync(matchId, updatedState);
    }

    return updatedState;
};

const resetOverlayState = async (matchId) => {
    const state = getOverlayState(matchId);
    if(state && state.matchInfo.date) {
        return await initMatchState(state.matchInfo.date, matchId);
    }
    return null;
};

const getAllMatchIds = () => {
    return Array.from(stateMap.keys());
};

module.exports = {
    initMatchState,
    getOverlayState,
    updateOverlayState,
    resetOverlayState,
    getAllMatchIds
};
