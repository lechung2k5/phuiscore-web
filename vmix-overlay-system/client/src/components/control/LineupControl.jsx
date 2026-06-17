import React, { useState } from 'react';
import { Card, Typography, Select, Button, Space, message, Checkbox, Tag, Input } from 'antd';

const { Option } = Select;

// Dữ liệu MOCK SQUAD cho ĐỘI NHÀ
const HOME_SQUAD = [
  { id: 1, name: "Thủ môn Nhà", position: "GK", avatar: "https://i.pravatar.cc/150?img=11" },
  { id: 4, name: "Hậu vệ Nhà 1", position: "DF", avatar: "https://i.pravatar.cc/150?img=12" },
  { id: 5, name: "Hậu vệ Nhà 2", position: "DF", avatar: "https://i.pravatar.cc/150?img=13" },
  { id: 2, name: "Hậu vệ Nhà 3", position: "DF", avatar: "https://i.pravatar.cc/150?img=14" },
  { id: 8, name: "Tiền vệ Nhà 1", position: "MF", avatar: "https://i.pravatar.cc/150?img=15" },
  { id: 10, name: "Tiền vệ Nhà 2", position: "MF", avatar: "https://i.pravatar.cc/150?img=16" },
  { id: 9, name: "Tiền đạo Nhà", position: "FW", avatar: "https://i.pravatar.cc/150?img=17" },
  { id: 12, name: "Dự bị Nhà 1", position: "GK" },
  { id: 13, name: "Dự bị Nhà 2", position: "DF" },
  { id: 14, name: "Dự bị Nhà 3", position: "DF" },
  { id: 15, name: "Dự bị Nhà 4", position: "MF" },
  { id: 16, name: "Dự bị Nhà 5", position: "MF" },
  { id: 17, name: "Dự bị Nhà 6", position: "FW" },
  { id: 18, name: "Dự bị Nhà 7", position: "FW" },
  { id: 20, name: "Dự bị Nhà 8", position: "DF" },
  { id: 21, name: "Dự bị Nhà 9", position: "MF" },
  { id: 22, name: "Dự bị Nhà 10", position: "FW" },
  { id: 23, name: "Dự bị Nhà 11", position: "MF" },
  { id: 24, name: "Dự bị Nhà 12", position: "DF" },
  { id: 99, name: "Dự bị Nhà 13", position: "GK" },
];

const HOME_COACH = "HLV. Park Hang Seo";

// Dữ liệu MOCK SQUAD cho ĐỘI KHÁCH
const AWAY_SQUAD = [
  { id: 1, name: "Thủ môn Khách", position: "GK", avatar: "https://i.pravatar.cc/150?img=50" },
  { id: 3, name: "Hậu vệ Khách 1", position: "DF", avatar: "https://i.pravatar.cc/150?img=51" },
  { id: 6, name: "Hậu vệ Khách 2", position: "DF", avatar: "https://i.pravatar.cc/150?img=52" },
  { id: 12, name: "Hậu vệ Khách 3", position: "DF", avatar: "https://i.pravatar.cc/150?img=53" },
  { id: 7, name: "Tiền vệ Khách 1", position: "MF", avatar: "https://i.pravatar.cc/150?img=54" },
  { id: 11, name: "Tiền vệ Khách 2", position: "MF", avatar: "https://i.pravatar.cc/150?img=55" },
  { id: 19, name: "Tiền đạo Khách", position: "FW", avatar: "https://i.pravatar.cc/150?img=56" },
  { id: 2, name: "Dự bị Khách 1", position: "GK" },
  { id: 4, name: "Dự bị Khách 2", position: "DF" },
  { id: 5, name: "Dự bị Khách 3", position: "DF" },
  { id: 8, name: "Dự bị Khách 4", position: "MF" },
  { id: 9, name: "Dự bị Khách 5", position: "MF" },
  { id: 10, name: "Dự bị Khách 6", position: "FW" },
  { id: 13, name: "Dự bị Khách 7", position: "FW" },
  { id: 14, name: "Dự bị Khách 8", position: "DF" },
  { id: 15, name: "Dự bị Khách 9", position: "MF" },
  { id: 16, name: "Dự bị Khách 10", position: "FW" },
  { id: 17, name: "Dự bị Khách 11", position: "MF" },
  { id: 18, name: "Dự bị Khách 12", position: "DF" },
  { id: 20, name: "Dự bị Khách 13", position: "GK" },
];

const AWAY_COACH = "HLV. Philippe Troussier";

const LineupControl = ({ matchState, triggerEvent }) => {
  const [tournamentTeams, setTournamentTeams] = useState(null);

  React.useEffect(() => {
    const fetchTournament = async () => {
      const tId = matchState?.dbData?.tournamentId || (matchState?.dbData?.gsi1_pk ? matchState.dbData.gsi1_pk.replace('TOURNAMENT#', '') : null);
      if (tId && tId.length > 10) {
        try {
          const res = await fetch(`http://localhost:5000/api/tournaments/${tId}`);
          const json = await res.json();
          if (json.success && json.data && json.data.teams) {
             setTournamentTeams(json.data.teams);
          }
        } catch(e) {}
      }
    };
    fetchTournament();
  }, [matchState?.dbData?.tournamentId, matchState?.dbData?.gsi1_pk]);

  // Hàm lấy danh sách cầu thủ từ API (nếu có) hoặc dùng MOCK
  const getPlayers = (teamKey) => {
    const apiLineups = matchState?.dbData?.lineups;
    // Lấy từ SofaScore format (lineups.home.players) hoặc Generic format
    let playersRaw = apiLineups?.[teamKey]?.players || matchState?.dbData?.[teamKey === 'home' ? 'homeTeam' : 'awayTeam']?.players;
    
    // Lấy từ danh sách đăng ký giải nếu trận đấu chưa có lineups
    if ((!playersRaw || playersRaw.length === 0) && tournamentTeams) {
        const teamData = matchState?.dbData?.[teamKey === 'home' ? 'homeTeam' : 'awayTeam'];
        const teamId = teamData?.id || teamData?.teamId;
        const teamName = teamData?.name;
        
        const matchedTeam = tournamentTeams.find(t => t.id === teamId || t.teamId === teamId || t.teamName === teamName || t.name === teamName);
        if (matchedTeam && matchedTeam.players) {
            playersRaw = matchedTeam.players;
        }
    }
    
    if (playersRaw && playersRaw.length > 0) {
      return playersRaw.map((p, index) => {
        let avatarUrl = p.player?.avatar || p.avatar || p.player?.photo || p.photo || "";
        if (avatarUrl && avatarUrl.startsWith('/uploads')) {
            avatarUrl = `http://localhost:5000${avatarUrl}`;
        }
        return {
          id: p.player?.id || p.id || index,
          name: p.player?.name || p.name || "Cầu thủ",
          position: p.position || "Unknown",
          avatar: avatarUrl,
          jerseyNumber: p.jerseyNumber || p.number || p.player?.jerseyNumber || ''
        };
      });
    }
    return teamKey === 'home' ? HOME_SQUAD : AWAY_SQUAD;
  };

  const getCoachData = (teamKey) => {
    const apiLineups = matchState?.dbData?.lineups;
    const dbTeam = matchState?.dbData?.[teamKey === 'home' ? 'homeTeam' : 'awayTeam'];
    
    let coachName = "";
    if (apiLineups?.[teamKey]?.coach) coachName = apiLineups[teamKey].coach.name || apiLineups[teamKey].coach;
    else if (dbTeam?.coach) coachName = dbTeam.coach.name || dbTeam.coach;
    else if (dbTeam?.manager) coachName = dbTeam.manager.name || dbTeam.manager;
    
    if (typeof coachName === 'string' && coachName.trim() !== '') {
      return coachName.toLowerCase().includes('hlv') ? coachName : `HLV. ${coachName}`;
    }
    return teamKey === 'home' ? HOME_COACH : AWAY_COACH;
  };

  const homeSquadDynamic = getPlayers('home');
  const awaySquadDynamic = getPlayers('away');

  const [homeCoach, setHomeCoach] = useState('');
  const [awayCoach, setAwayCoach] = useState('');

  React.useEffect(() => {
    setHomeCoach(getCoachData('home'));
    setAwayCoach(getCoachData('away'));
  }, [matchState?.dbData]);

  const [homeStarters, setHomeStarters] = useState([]);
  const [awayStarters, setAwayStarters] = useState([]);
  
  const [homeCaptain, setHomeCaptain] = useState(null);
  const [homeGK, setHomeGK] = useState(1);
  const [awayCaptain, setAwayCaptain] = useState(null);
  const [awayGK, setAwayGK] = useState(1);

  const isLineupVisible = matchState?.layers?.lineup?.visible;
  const currentLineupTeam = matchState?.layers?.lineup?.data?.teamType;
  const isHomeShowing = isLineupVisible && currentLineupTeam === 'home';
  const isAwayShowing = isLineupVisible && currentLineupTeam === 'away';

  const handleTrigger = (teamSelect) => {
    if (!matchState) {
      message.error("Lỗi dữ liệu trận đấu!");
      return;
    }

    const isHome = teamSelect === 'home';
    
    // Nếu đang bật đúng đội này thì Tắt
    if ((isHome && isHomeShowing) || (!isHome && isAwayShowing)) {
      triggerEvent({ type: 'toggle_overlay', target: 'lineup' });
      message.success(`Đã TẮT Đội Hình ${isHome ? 'Nhà' : 'Khách'}`);
      return;
    }
    const currentStarters = isHome ? homeStarters : awayStarters;
    const currentSquad = isHome ? homeSquadDynamic : awaySquadDynamic;

    if (currentStarters.length < 7 || currentStarters.length > 11) {
      message.error(`Vui lòng chọn từ 7 đến 11 cầu thủ đá chính cho đội ${isHome ? 'nhà' : 'khách'}!`);
      return;
    }

    const teamData = isHome ? matchState.homeTeam : matchState.awayTeam;
    
    const mapPlayerWithRole = (p) => ({
      ...p,
      isCaptain: isHome ? homeCaptain === p.id : awayCaptain === p.id,
      isGK: isHome ? homeGK === p.id : awayGK === p.id
    });

    const startingXI = currentSquad.filter(p => currentStarters.includes(p.id)).map(mapPlayerWithRole);
    const substitutes = currentSquad.filter(p => !currentStarters.includes(p.id)).map(mapPlayerWithRole);

    triggerEvent({
      type: 'lineup',
      teamType: teamSelect,
      teamName: teamData.name,
      teamLogo: teamData.logo,
      teamColor: teamData.color || (isHome ? '#ff0000' : '#0000ff'),
      startingXI: startingXI,
      substitutes: substitutes,
      coach: isHome ? homeCoach : awayCoach
    });

    message.success(`Đã hiển thị Đội Hình ${teamData.name}`);
  };

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      
      {/* CỘT ĐỘI NHÀ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Typography.Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
          🏠 {matchState?.homeTeam?.name || 'Đội Nhà'}
        </Typography.Text>
        
        <div style={{ maxHeight: 250, overflowY: 'auto', background: '#1c2128', padding: 12, borderRadius: 6, border: '1px solid #30363d' }}>
          <Checkbox.Group value={homeStarters} onChange={setHomeStarters} style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {homeSquadDynamic.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Checkbox value={p.id}>
                    {p.name}
                  </Checkbox>
                  <div>
                    <Tag.CheckableTag 
                      checked={homeCaptain === p.id} 
                      onChange={() => setHomeCaptain(homeCaptain === p.id ? null : p.id)}
                      style={{ border: '1px solid #d4b106', color: homeCaptain === p.id ? '#fff' : '#d4b106', background: homeCaptain === p.id ? '#d4b106' : 'transparent', marginRight: 4 }}
                    >
                      (C)
                    </Tag.CheckableTag>
                    <Tag.CheckableTag 
                      checked={homeGK === p.id} 
                      onChange={() => setHomeGK(homeGK === p.id ? null : p.id)}
                      style={{ border: '1px solid #1890ff', color: homeGK === p.id ? '#fff' : '#1890ff', background: homeGK === p.id ? '#1890ff' : 'transparent' }}
                    >
                      (GK)
                    </Tag.CheckableTag>
                  </div>
                </div>
              ))}
            </div>
          </Checkbox.Group>
        </div>



        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: (homeStarters.length >= 7 && homeStarters.length <= 11) ? '#52c41a' : '#f85149' }}>
            Đã chọn: {homeStarters.length} / (Tối đa 11)
          </div>
          <Button 
            type="primary" 
            onClick={() => handleTrigger('home')} 
            disabled={!isHomeShowing && (homeStarters.length < 7 || homeStarters.length > 11)}
            style={{ 
              backgroundColor: isHomeShowing ? '#ff4d4f' : ((homeStarters.length >= 7 && homeStarters.length <= 11) ? '#1890ff' : '#30363d'), 
              color: (isHomeShowing || (homeStarters.length >= 7 && homeStarters.length <= 11)) ? '#fff' : '#8b949e', 
              fontWeight: 'bold',
              border: isHomeShowing ? '2px solid #fff' : 'none'
            }}
            danger={isHomeShowing}
          >
            {isHomeShowing ? "🔴 ĐANG PHÁT - ẤN ĐỂ TẮT" : "Phát Đội Nhà"}
          </Button>
        </div>

        {/* Box Phát HLV */}
        <Card type="inner" title="👔 HUẤN LUYỆN VIÊN TRƯỞNG" style={{ background: '#262626', marginTop: 16 }} headStyle={{ color: '#fff' }}>
          <div style={{ marginBottom: 12 }}>
            <Input 
              value={homeCoach} 
              onChange={e => setHomeCoach(e.target.value)} 
              placeholder="Nhập tên HLV đội nhà"
              style={{ background: '#1c2128', color: '#fff', borderColor: '#30363d' }} 
            />
          </div>
          <Button 
            type="primary" 
            block
            onClick={() => {
              triggerEvent({
                type: 'coach',
                id: Date.now(),
                teamType: 'home',
                coachName: homeCoach,
                teamColor: matchState?.homeTeam?.color || '#ff0000',
                textColor: matchState?.homeTeam?.textColor || '#ffffff',
                teamLogo: matchState?.homeTeam?.logo
              });
              message.success("Đã phát Overlay HLV Đội Nhà (Tự ẩn sau 8s)");
            }}
            style={{ fontWeight: 'bold', backgroundColor: '#d4b106', color: '#fff' }}
          >
            PHÁT HLV (ĐỘI NHÀ)
          </Button>
        </Card>
      </div>

      {/* CỘT ĐỘI KHÁCH */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Typography.Text strong style={{ color: '#1890ff', fontSize: 16 }}>
          ✈️ {matchState?.awayTeam?.name || 'Đội Khách'}
        </Typography.Text>
        
        <div style={{ maxHeight: 250, overflowY: 'auto', background: '#1c2128', padding: 12, borderRadius: 6, border: '1px solid #30363d' }}>
          <Checkbox.Group value={awayStarters} onChange={setAwayStarters} style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {awaySquadDynamic.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Checkbox value={p.id}>
                    {p.name}
                  </Checkbox>
                  <div>
                    <Tag.CheckableTag 
                      checked={awayCaptain === p.id} 
                      onChange={() => setAwayCaptain(awayCaptain === p.id ? null : p.id)}
                      style={{ border: '1px solid #d4b106', color: awayCaptain === p.id ? '#fff' : '#d4b106', background: awayCaptain === p.id ? '#d4b106' : 'transparent', marginRight: 4 }}
                    >
                      (C)
                    </Tag.CheckableTag>
                    <Tag.CheckableTag 
                      checked={awayGK === p.id} 
                      onChange={() => setAwayGK(awayGK === p.id ? null : p.id)}
                      style={{ border: '1px solid #1890ff', color: awayGK === p.id ? '#fff' : '#1890ff', background: awayGK === p.id ? '#1890ff' : 'transparent' }}
                    >
                      (GK)
                    </Tag.CheckableTag>
                  </div>
                </div>
              ))}
            </div>
          </Checkbox.Group>
        </div>



        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: (awayStarters.length >= 7 && awayStarters.length <= 11) ? '#52c41a' : '#f85149' }}>
            Đã chọn: {awayStarters.length} / (Tối đa 11)
          </div>
          <Button 
            type="primary" 
            onClick={() => handleTrigger('away')} 
            disabled={!isAwayShowing && (awayStarters.length < 7 || awayStarters.length > 11)}
            style={{ 
              backgroundColor: isAwayShowing ? '#ff4d4f' : ((awayStarters.length >= 7 && awayStarters.length <= 11) ? '#1890ff' : '#30363d'), 
              color: (isAwayShowing || (awayStarters.length >= 7 && awayStarters.length <= 11)) ? '#fff' : '#8b949e', 
              fontWeight: 'bold',
              border: isAwayShowing ? '2px solid #fff' : 'none'
            }}
            danger={isAwayShowing}
          >
            {isAwayShowing ? "🔴 ĐANG PHÁT - ẤN ĐỂ TẮT" : "Phát Đội Khách"}
          </Button>
        </div>

        {/* Box Phát HLV */}
        <Card type="inner" title="👔 HUẤN LUYỆN VIÊN TRƯỞNG" style={{ background: '#262626', marginTop: 16 }} headStyle={{ color: '#fff' }}>
          <div style={{ marginBottom: 12 }}>
            <Input 
              value={awayCoach} 
              onChange={e => setAwayCoach(e.target.value)} 
              placeholder="Nhập tên HLV đội khách"
              style={{ background: '#1c2128', color: '#fff', borderColor: '#30363d' }} 
            />
          </div>
          <Button 
            type="primary" 
            block
            onClick={() => {
              triggerEvent({
                type: 'coach',
                id: Date.now(),
                teamType: 'away',
                coachName: awayCoach,
                teamColor: matchState?.awayTeam?.color || '#0000ff',
                textColor: matchState?.awayTeam?.textColor || '#ffffff',
                teamLogo: matchState?.awayTeam?.logo
              });
              message.success("Đã phát Overlay HLV Đội Khách (Tự ẩn sau 8s)");
            }}
            style={{ fontWeight: 'bold', backgroundColor: '#d4b106', color: '#fff' }}
          >
            PHÁT HLV (ĐỘI KHÁCH)
          </Button>
        </Card>
      </div>

    </div>
  );
};

export default React.memo(LineupControl);
