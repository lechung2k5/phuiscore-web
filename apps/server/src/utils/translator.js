const STATS_TRANSLATION = {
    "ball possession": "Tỷ lệ kiểm soát bóng",
    "expected goals (xg)": "Bàn thắng kỳ vọng (xG)",
    "total shots": "Tổng cú sút",
    "shots on target": "Sút trúng đích",
    "shots off target": "Sút ra ngoài",
    "blocked shots": "Sút bị chặn",
    "corner kicks": "Phạt góc",
    "offsides": "Việt vị",
    "fouls": "Phạm lỗi",
    "yellow cards": "Thẻ vàng",
    "red cards": "Thẻ đỏ",
    "free kicks": "Quả đá phạt",
    "throw-ins": "Ném biên",
    "goal kicks": "Phát bóng gôn",
    "goalkeeper saves": "Cứu thua",
    "passes": "Đường chuyền",
    "accurate passes": "Chuyền chính xác",
    "long balls": "Bóng dài",
    "crosses": "Tạt bóng",
    "dribbles": "Rê bóng",
    "possession lost": "Lần mất bóng",
    "duels won": "Tranh chấp thắng",
    "aerials won": "Tranh chấp không chiến",
    "tackles": "Tắc bóng",
    "interceptions": "Cắt bóng",
    "clearances": "Phá bóng",
    "big chances": "Cơ hội rõ rệt",
    "big chances missed": "Cơ hội bỏ lỡ",
    "hit woodwork": "Sút trúng khung gỗ",
    "counter attacks": "Phản công",
    "shots inside box": "Sút trong vòng cấm",
    "shots outside box": "Sút ngoài vòng cấm",
    "final third entries": "Vào 1/3 sân đối phương",
    "final third phase": "Giai đoạn 1/3 sân",
    "ground duels": "Tranh chấp mặt đất",
    "aerial duels": "Tranh chấp trên không",
    "dispossessed": "Bị mất bóng",
    "duels": "Tranh chấp",
    "total dribbles": "Tổng số lần rê bóng",
    "successful dribbles": "Rê bóng thành công",
    "tackles won": "Tắc bóng thành công",
    "interceptions won": "Cắt bóng thành công",
    "recoveries": "Thu hồi bóng",
    "attacking": "Tấn công",
    "defense": "Phòng ngự",
    "general": "Chung",
    "distribution": "Phân phối bóng",
    "shots blocked": "Cú sút bị chặn",
    "big chances created": "Số cơ hội tạo ra",
    "accurate long balls": "Bóng dài chính xác",
    "accurate crosses": "Tạt bóng chính xác",
    "successful duels": "Tranh chấp thành công",
    "successful ground duels": "Tranh chấp mặt đất thành công",
    "successful aerial duels": "Tranh chấp trên không thành công"
};

const translateStatName = (name) => {
    if (!name) return name;
    const cleanName = name.toLowerCase().trim();
    return STATS_TRANSLATION[cleanName] || name;
};

const translateStats = (statistics) => {
    if (!statistics || !Array.isArray(statistics)) return statistics;
    
    // SofaScore structure: [ { period: 'ALL', groups: [ { name: '...', statisticsItems: [...] } ] } ]
    return statistics.map(periodObj => ({
        ...periodObj,
        groups: Array.isArray(periodObj.groups) 
            ? periodObj.groups.map(group => ({
                ...group,
                name: translateStatName(group.name),
                statisticsItems: Array.isArray(group.statisticsItems) 
                    ? group.statisticsItems.map(item => ({
                        ...item,
                        name: translateStatName(item.name)
                    }))
                    : []
            }))
            : []
    }));
};

module.exports = { translateStatName, translateStats };
