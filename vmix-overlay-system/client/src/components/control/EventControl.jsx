import React, { useState } from 'react';
import { Card, Button, Row, Col, Typography, Select, message, Space, Avatar } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

// MOCK DATA CẦU THỦ
const mockPlayersTeamA = [
  { id: 'a1', name: 'Nguyễn Văn Toàn', number: 9, avatar: 'https://i.pravatar.cc/150?u=a1' },
  { id: 'a2', name: 'Nguyễn Quang Hải', number: 19, avatar: 'https://i.pravatar.cc/150?u=a2' },
  { id: 'a3', name: 'Quế Ngọc Hải', number: 3, avatar: 'https://i.pravatar.cc/150?u=a3' },
  { id: 'a4', name: 'Đoàn Văn Hậu', number: 5, avatar: 'https://i.pravatar.cc/150?u=a4' },
];

const mockPlayersTeamB = [
  { id: 'b1', name: 'Lê Công Vinh', number: 9, avatar: 'https://i.pravatar.cc/150?u=b1' },
  { id: 'b2', name: 'Phạm Thành Lương', number: 11, avatar: 'https://i.pravatar.cc/150?u=b2' },
  { id: 'b3', name: 'Bùi Tiến Dũng', number: 4, avatar: 'https://i.pravatar.cc/150?u=b3' },
  { id: 'b4', name: 'Nguyễn Tiến Linh', number: 22, avatar: 'https://i.pravatar.cc/150?u=b4' },
];

const EventControl = ({ matchState, triggerEvent }) => {
  // Hàm lấy danh sách cầu thủ từ API (nếu có) hoặc dùng MOCK
  const getPlayers = (teamKey) => {
    const apiLineups = matchState?.dbData?.lineups;
    const playersRaw = apiLineups?.[teamKey]?.players || matchState?.dbData?.[teamKey === 'home' ? 'homeTeam' : 'awayTeam']?.players;
    
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
          number: p.shirtNumber || p.number,
          avatar: avatarUrl
        };
      });
    }
    return teamKey === 'home' ? mockPlayersTeamA : mockPlayersTeamB;
  };

  const homeSquadDynamic = getPlayers('home');
  const awaySquadDynamic = getPlayers('away');

  const homeGoals = matchState?.homeTeam?.goals || [];
  const awayGoals = matchState?.awayTeam?.goals || [];
  const homeCards = matchState?.homeTeam?.cards || [];
  const awayCards = matchState?.awayTeam?.cards || [];
  const homeSubs = matchState?.homeTeam?.subs || [];
  const awaySubs = matchState?.awayTeam?.subs || [];

  // State cho Đội Nhà (Team A)
  const [homeGoalPlayer, setHomeGoalPlayer] = useState(homeSquadDynamic[0]?.id);
  const [homeCardPlayer, setHomeCardPlayer] = useState(homeSquadDynamic[0]?.id);
  const [homeCardType, setHomeCardType] = useState('yellow_card');
  const [homeSubOutPlayer, setHomeSubOutPlayer] = useState(homeSquadDynamic[0]?.id);
  const [homeSubInPlayer, setHomeSubInPlayer] = useState(homeSquadDynamic[1]?.id || homeSquadDynamic[0]?.id);

  // State cho Đội Khách (Team B)
  const [awayGoalPlayer, setAwayGoalPlayer] = useState(awaySquadDynamic[0]?.id);
  const [awayCardPlayer, setAwayCardPlayer] = useState(awaySquadDynamic[0]?.id);
  const [awayCardType, setAwayCardType] = useState('yellow_card');
  const [awaySubOutPlayer, setAwaySubOutPlayer] = useState(awaySquadDynamic[0]?.id);
  const [awaySubInPlayer, setAwaySubInPlayer] = useState(awaySquadDynamic[1]?.id || awaySquadDynamic[0]?.id);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTrigger = (type, team, playerId, playersList, extraData = {}) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 8000);

    const player = playersList.find(p => p.id === playerId);
    
    let minuteStr = '';
    let minuteNumber = null;
    if (matchState?.matchInfo?.time !== undefined) {
      const halfLength = Number(matchState.matchInfo.halfLength) || 45;
      const currentStatus = matchState.matchInfo.status || 'FIRST_HALF';
      
      minuteNumber = Math.floor(matchState.matchInfo.time / 60) + 1;
      
      if (currentStatus === 'FIRST_HALF' && minuteNumber > halfLength) {
        const added = minuteNumber - halfLength;
        minuteStr = `${halfLength}+${added}'`;
      } else if (currentStatus === 'SECOND_HALF' && minuteNumber > halfLength * 2) {
        const added = minuteNumber - (halfLength * 2);
        minuteStr = `${halfLength * 2}+${added}'`;
      } else {
        minuteStr = `${minuteNumber}'`;
      }
    }

    const eventPayload = {
      id: Date.now(),
      type: type, // 'goal', 'yellow_card', 'red_card' (Dành cho vMix)
      incidentType: type === 'goal' ? 'goal' : 'card', // Dành cho NextJS Web
      color: type === 'yellow_card' ? 'yellow' : (type === 'red_card' ? 'red' : undefined),
      team: team, // 'home' hoặc 'away'
      playerInfo: player.name,
      playerName: player.name,
      playerAvatar: player.avatar,
      player: { name: player.name, id: player.id }, // Dành cho NextJS Web
      minute: minuteStr,
      minuteNumber: minuteNumber,
      time: minuteStr ? minuteStr.replace("'", "") : '', // Dành cho NextJS Web
      ...extraData
    };

    triggerEvent(eventPayload);
    message.success(`Đã phát sự kiện ${type === 'goal' ? 'Bàn thắng' : 'Thẻ phạt'} cho ${player.name}!`);
  };

  const handleSubTrigger = (team, playerOutId, playerInId, playersList) => {
    if (isSubmitting) return;

    if (playerOutId === playerInId) {
      message.error("Cầu thủ ra sân và vào sân không được trùng nhau!");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 8000);

    const playerOut = playersList.find(p => p.id === playerOutId);
    const playerIn = playersList.find(p => p.id === playerInId);
    
    let minuteStr = '';
    let minuteNumber = null;
    if (matchState?.matchInfo?.time !== undefined) {
      const halfLength = Number(matchState.matchInfo.halfLength) || 45;
      const currentStatus = matchState.matchInfo.status || 'FIRST_HALF';
      
      minuteNumber = Math.floor(matchState.matchInfo.time / 60) + 1;
      
      if (currentStatus === 'FIRST_HALF' && minuteNumber > halfLength) {
        const added = minuteNumber - halfLength;
        minuteStr = `${halfLength}+${added}'`;
      } else if (currentStatus === 'SECOND_HALF' && minuteNumber > halfLength * 2) {
        const added = minuteNumber - (halfLength * 2);
        minuteStr = `${halfLength * 2}+${added}'`;
      } else {
        minuteStr = `${minuteNumber}'`;
      }
    }

    const eventPayload = {
      id: Date.now(),
      type: 'sub', // vMix
      incidentType: 'substitution', // NextJS
      team: team,
      playerOutName: playerOut.name,
      playerOutAvatar: playerOut.avatar,
      playerInName: playerIn.name,
      playerInAvatar: playerIn.avatar,
      player: { name: playerOut.name, id: playerOut.id }, // NextJS
      playerIn: { name: playerIn.name, id: playerIn.id }, // NextJS
      minute: minuteStr,
      minuteNumber: minuteNumber,
      time: minuteStr ? minuteStr.replace("'", "") : '' // NextJS
    };

    triggerEvent(eventPayload);
    message.success(`Đã phát sự kiện Thay người cho đội ${team === 'home' ? 'Nhà' : 'Khách'}!`);
  };

  const renderPlayerOptions = (players) => {
    return players.map(p => (
      <Option key={p.id} value={p.id}>
        <Space>
          <Avatar size="small" src={p.avatar} />
          <span>{p.name}</span>
        </Space>
      </Option>
    ));
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        
        {/* CỘT TRÁI - ĐỘI NHÀ */}
        <Col xs={24} lg={12}>
          <div style={{ background: '#0d1117', borderRadius: 8, border: '1px solid #21262d', padding: 12, borderTop: '3px solid #177ddc' }}>
            <Title level={4} style={{ color: '#fff', textAlign: 'center', marginBottom: '24px' }}>
              ĐỘI NHÀ: {matchState?.homeTeam?.name || 'Home'}
            </Title>
            
            {/* Box Bàn Thắng */}
            <Card type="inner" title="⚽ BÀN THẮNG" style={{ marginBottom: '16px', background: '#262626' }} headStyle={{ color: '#52c41a' }}>
              <div style={{ marginBottom: 16 }}>
                <Text style={{ display: 'block', marginBottom: 8, color: '#ccc' }}>Chọn Cầu thủ ghi bàn:</Text>
                <Select value={homeGoalPlayer} style={{ width: '100%' }} onChange={setHomeGoalPlayer} showSearch optionFilterProp="children">
                  {renderPlayerOptions(homeSquadDynamic)}
                </Select>
              </div>
              <Button type="primary" block disabled={isSubmitting} onClick={() => handleTrigger('goal', 'home', homeGoalPlayer, homeSquadDynamic)} style={{ background: isSubmitting ? '#555' : '#52c41a', borderColor: isSubmitting ? '#555' : '#52c41a', fontWeight: 'bold' }}>
                PHÁT BÀN THẮNG (HOME)
              </Button>
              
              <div style={{ marginTop: '16px', borderTop: '1px solid #434343', paddingTop: '12px' }}>
                <Text style={{ display: 'block', marginBottom: 8, color: '#aaa', fontSize: '12px' }}>DANH SÁCH ĐANG HIỂN THỊ TRÊN BẢNG:</Text>
                {homeGoals.length === 0 ? (
                  <Text type="secondary" italic style={{ fontSize: '12px' }}>Chưa có bàn thắng nào</Text>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {homeGoals.map(g => (
                      <li key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', background: '#141414', padding: '4px 8px', borderRadius: '4px', border: '1px solid #303030' }}>
                        <span style={{ color: '#fff', fontSize: '13px' }}>{g.playerName} <span style={{ color: '#faad14', fontWeight: 'bold' }}>{g.minute}</span></span>
                        <Button size="small" type="text" danger onClick={() => { triggerEvent({ type: 'delete_goal', team: 'home', id: g.id }); message.success(`Đã xóa bàn thắng của ${g.playerName}!`); }}>
                          Xóa
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* Box Thẻ Phạt */}
            <Card type="inner" title="🟨/🟥 THẺ PHẠT" style={{ background: '#262626' }} headStyle={{ color: '#faad14' }}>
              <div style={{ marginBottom: 16 }}>
                <Text style={{ display: 'block', marginBottom: 8, color: '#ccc' }}>Chọn Cầu thủ nhận thẻ:</Text>
                <Select value={homeCardPlayer} style={{ width: '100%' }} onChange={setHomeCardPlayer} showSearch optionFilterProp="children">
                  {renderPlayerOptions(homeSquadDynamic)}
                </Select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text style={{ display: 'block', marginBottom: 8, color: '#ccc' }}>Loại thẻ:</Text>
                <Select value={homeCardType} style={{ width: '100%' }} onChange={setHomeCardType}>
                  <Option value="yellow_card">🟨 Thẻ Vàng</Option>
                  <Option value="red_card">🟥 Thẻ Đỏ</Option>
                </Select>
              </div>
              <Button type="primary" block disabled={isSubmitting} onClick={() => handleTrigger(homeCardType, 'home', homeCardPlayer, homeSquadDynamic)} style={{ background: isSubmitting ? '#555' : (homeCardType === 'red_card' ? '#ff4d4f' : '#faad14'), borderColor: isSubmitting ? '#555' : (homeCardType === 'red_card' ? '#ff4d4f' : '#faad14'), color: (isSubmitting || homeCardType === 'yellow_card') ? '#000' : '#fff', fontWeight: 'bold' }}>
                PHÁT THẺ (HOME)
              </Button>
              <div style={{ marginTop: '16px', borderTop: '1px solid #434343', paddingTop: '12px' }}>
                <Text style={{ display: 'block', marginBottom: 8, color: '#aaa', fontSize: '12px' }}>DANH SÁCH THẺ PHẠT:</Text>
                {homeCards.length === 0 ? (
                  <Text type="secondary" italic style={{ fontSize: '12px' }}>Chưa có thẻ phạt nào</Text>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {homeCards.map(c => (
                      <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', background: '#141414', padding: '4px 8px', borderRadius: '4px', border: '1px solid #303030' }}>
                        <span style={{ color: '#fff', fontSize: '13px' }}>
                          {c.type === 'yellow_card' ? '🟨' : '🟥'} {c.playerName} <span style={{ color: '#faad14', fontWeight: 'bold' }}>{c.minute}</span>
                        </span>
                        <Button size="small" type="text" danger onClick={() => { triggerEvent({ type: 'delete_card', team: 'home', id: c.id }); message.success(`Đã xóa thẻ của ${c.playerName}!`); }}>
                          Xóa
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* Box Thay Người */}
            <Card type="inner" title="🔄 THAY NGƯỜI" style={{ background: '#262626' }} headStyle={{ color: '#13c2c2' }}>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24} style={{ marginBottom: 12 }}>
                  <Text style={{ display: 'block', marginBottom: 8, color: '#ff4d4f' }}>OUT ▼ (Ra sân):</Text>
                  <Select value={homeSubOutPlayer} style={{ width: '100%' }} onChange={setHomeSubOutPlayer} showSearch optionFilterProp="children">
                    {renderPlayerOptions(homeSquadDynamic)}
                  </Select>
                </Col>
                <Col span={24}>
                  <Text style={{ display: 'block', marginBottom: 8, color: '#52c41a' }}>IN ▲ (Vào sân):</Text>
                  <Select value={homeSubInPlayer} style={{ width: '100%' }} onChange={setHomeSubInPlayer} showSearch optionFilterProp="children">
                    {renderPlayerOptions(homeSquadDynamic)}
                  </Select>
                </Col>
              </Row>
              <Button type="primary" block disabled={isSubmitting} onClick={() => handleSubTrigger('home', homeSubOutPlayer, homeSubInPlayer, homeSquadDynamic)} style={{ background: isSubmitting ? '#555' : '#13c2c2', borderColor: isSubmitting ? '#555' : '#13c2c2', fontWeight: 'bold' }}>
                PHÁT THAY NGƯỜI (HOME)
              </Button>
              <div style={{ marginTop: '16px', borderTop: '1px solid #434343', paddingTop: '12px' }}>
                <Text style={{ display: 'block', marginBottom: 8, color: '#aaa', fontSize: '12px' }}>DANH SÁCH THAY NGƯỜI:</Text>
                {homeSubs.length === 0 ? (
                  <Text type="secondary" italic style={{ fontSize: '12px' }}>Chưa có thay người nào</Text>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {homeSubs.map(s => (
                      <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', background: '#141414', padding: '4px 8px', borderRadius: '4px', border: '1px solid #303030' }}>
                        <span style={{ color: '#fff', fontSize: '13px' }}>
                          <span style={{ color: '#ff4d4f' }}>▼ {s.playerOutName}</span> | <span style={{ color: '#52c41a' }}>▲ {s.playerInName}</span> <span style={{ color: '#faad14', fontWeight: 'bold' }}>{s.minute}</span>
                        </span>
                        <Button size="small" type="text" danger onClick={() => { triggerEvent({ type: 'delete_sub', team: 'home', id: s.id }); message.success(`Đã xóa thay người này!`); }}>
                          Xóa
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
        </Col>

        {/* CỘT PHẢI - ĐỘI KHÁCH */}
        <Col xs={24} lg={12}>
          <div style={{ background: '#0d1117', borderRadius: 8, border: '1px solid #21262d', padding: 12, borderTop: '3px solid #f5222d' }}>
            <Title level={4} style={{ color: '#fff', textAlign: 'center', marginBottom: '24px' }}>
              ĐỘI KHÁCH: {matchState?.awayTeam?.name || 'Away'}
            </Title>
            
            {/* Box Bàn Thắng */}
            <Card type="inner" title="⚽ BÀN THẮNG" style={{ marginBottom: '16px', background: '#262626' }} headStyle={{ color: '#52c41a' }}>
              <div style={{ marginBottom: 16 }}>
                <Text style={{ display: 'block', marginBottom: 8, color: '#ccc' }}>Chọn Cầu thủ ghi bàn:</Text>
                <Select value={awayGoalPlayer} style={{ width: '100%' }} onChange={setAwayGoalPlayer} showSearch optionFilterProp="children">
                  {renderPlayerOptions(awaySquadDynamic)}
                </Select>
              </div>
              <Button type="primary" block disabled={isSubmitting} onClick={() => handleTrigger('goal', 'away', awayGoalPlayer, awaySquadDynamic)} style={{ background: isSubmitting ? '#555' : '#52c41a', borderColor: isSubmitting ? '#555' : '#52c41a', fontWeight: 'bold' }}>
                PHÁT BÀN THẮNG (AWAY)
              </Button>

              <div style={{ marginTop: '16px', borderTop: '1px solid #434343', paddingTop: '12px' }}>
                <Text style={{ display: 'block', marginBottom: 8, color: '#aaa', fontSize: '12px' }}>DANH SÁCH ĐANG HIỂN THỊ TRÊN BẢNG:</Text>
                {awayGoals.length === 0 ? (
                  <Text type="secondary" italic style={{ fontSize: '12px' }}>Chưa có bàn thắng nào</Text>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {awayGoals.map(g => (
                      <li key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', background: '#141414', padding: '4px 8px', borderRadius: '4px', border: '1px solid #303030' }}>
                        <span style={{ color: '#fff', fontSize: '13px' }}>{g.playerName} <span style={{ color: '#faad14', fontWeight: 'bold' }}>{g.minute}</span></span>
                        <Button size="small" type="text" danger onClick={() => { triggerEvent({ type: 'delete_goal', team: 'away', id: g.id }); message.success(`Đã xóa bàn thắng của ${g.playerName}!`); }}>
                          Xóa
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* Box Thẻ Phạt */}
            <Card type="inner" title="🟨/🟥 THẺ PHẠT" style={{ background: '#262626' }} headStyle={{ color: '#faad14' }}>
              <div style={{ marginBottom: 16 }}>
                <Text style={{ display: 'block', marginBottom: 8, color: '#ccc' }}>Chọn Cầu thủ nhận thẻ:</Text>
                <Select value={awayCardPlayer} style={{ width: '100%' }} onChange={setAwayCardPlayer} showSearch optionFilterProp="children">
                  {renderPlayerOptions(awaySquadDynamic)}
                </Select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text style={{ display: 'block', marginBottom: 8, color: '#ccc' }}>Loại thẻ:</Text>
                <Select value={awayCardType} style={{ width: '100%' }} onChange={setAwayCardType}>
                  <Option value="yellow_card">🟨 Thẻ Vàng</Option>
                  <Option value="red_card">🟥 Thẻ Đỏ</Option>
                </Select>
              </div>
              <Button type="primary" block disabled={isSubmitting} onClick={() => handleTrigger(awayCardType, 'away', awayCardPlayer, awaySquadDynamic)} style={{ background: isSubmitting ? '#555' : (awayCardType === 'red_card' ? '#ff4d4f' : '#faad14'), borderColor: isSubmitting ? '#555' : (awayCardType === 'red_card' ? '#ff4d4f' : '#faad14'), color: (isSubmitting || awayCardType === 'yellow_card') ? '#000' : '#fff', fontWeight: 'bold' }}>
                PHÁT THẺ (AWAY)
              </Button>
              <div style={{ marginTop: '16px', borderTop: '1px solid #434343', paddingTop: '12px' }}>
                <Text style={{ display: 'block', marginBottom: 8, color: '#aaa', fontSize: '12px' }}>DANH SÁCH THẺ PHẠT:</Text>
                {awayCards.length === 0 ? (
                  <Text type="secondary" italic style={{ fontSize: '12px' }}>Chưa có thẻ phạt nào</Text>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {awayCards.map(c => (
                      <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', background: '#141414', padding: '4px 8px', borderRadius: '4px', border: '1px solid #303030' }}>
                        <span style={{ color: '#fff', fontSize: '13px' }}>
                          {c.type === 'yellow_card' ? '🟨' : '🟥'} {c.playerName} <span style={{ color: '#faad14', fontWeight: 'bold' }}>{c.minute}</span>
                        </span>
                        <Button size="small" type="text" danger onClick={() => { triggerEvent({ type: 'delete_card', team: 'away', id: c.id }); message.success(`Đã xóa thẻ của ${c.playerName}!`); }}>
                          Xóa
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* Box Thay Người */}
            <Card type="inner" title="🔄 THAY NGƯỜI" style={{ background: '#262626' }} headStyle={{ color: '#13c2c2' }}>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24} style={{ marginBottom: 12 }}>
                  <Text style={{ display: 'block', marginBottom: 8, color: '#ff4d4f' }}>OUT ▼ (Ra sân):</Text>
                  <Select value={awaySubOutPlayer} style={{ width: '100%' }} onChange={setAwaySubOutPlayer} showSearch optionFilterProp="children">
                    {renderPlayerOptions(awaySquadDynamic)}
                  </Select>
                </Col>
                <Col span={24}>
                  <Text style={{ display: 'block', marginBottom: 8, color: '#52c41a' }}>IN ▲ (Vào sân):</Text>
                  <Select value={awaySubInPlayer} style={{ width: '100%' }} onChange={setAwaySubInPlayer} showSearch optionFilterProp="children">
                    {renderPlayerOptions(awaySquadDynamic)}
                  </Select>
                </Col>
              </Row>
              <Button type="primary" block disabled={isSubmitting} onClick={() => handleSubTrigger('away', awaySubOutPlayer, awaySubInPlayer, awaySquadDynamic)} style={{ background: isSubmitting ? '#555' : '#13c2c2', borderColor: isSubmitting ? '#555' : '#13c2c2', fontWeight: 'bold' }}>
                PHÁT THAY NGƯỜI (AWAY)
              </Button>
              <div style={{ marginTop: '16px', borderTop: '1px solid #434343', paddingTop: '12px' }}>
                <Text style={{ display: 'block', marginBottom: 8, color: '#aaa', fontSize: '12px' }}>DANH SÁCH THAY NGƯỜI:</Text>
                {awaySubs.length === 0 ? (
                  <Text type="secondary" italic style={{ fontSize: '12px' }}>Chưa có thay người nào</Text>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {awaySubs.map(s => (
                      <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', background: '#141414', padding: '4px 8px', borderRadius: '4px', border: '1px solid #303030' }}>
                        <span style={{ color: '#fff', fontSize: '13px' }}>
                          <span style={{ color: '#ff4d4f' }}>▼ {s.playerOutName}</span> | <span style={{ color: '#52c41a' }}>▲ {s.playerInName}</span> <span style={{ color: '#faad14', fontWeight: 'bold' }}>{s.minute}</span>
                        </span>
                        <Button size="small" type="text" danger onClick={() => { triggerEvent({ type: 'delete_sub', team: 'away', id: s.id }); message.success(`Đã xóa thay người này!`); }}>
                          Xóa
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
        </Col>

      </Row>
    </div>
  );
};

export default React.memo(EventControl);
