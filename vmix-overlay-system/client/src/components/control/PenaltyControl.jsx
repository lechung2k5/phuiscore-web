import React from 'react';
import { Typography, Button, Space, Row, Col, Switch } from 'antd';

const { Text } = Typography;

const PenaltyControl = ({ matchState, updateMatch }) => {
  const { homeTeam, awayTeam, layers } = matchState;
  const isVisible = layers?.penaltyBoard?.visible || false;

  const togglePenaltyBoard = (checked) => {
    updateMatch({ layers: { penaltyBoard: { visible: checked } } });
  };

  const handlePenaltyClick = (team, index) => {
    const currentTeam = team === 'home' ? homeTeam : awayTeam;
    const penalties = [...(currentTeam.penalties || ['pending', 'pending', 'pending', 'pending', 'pending'])];
    
    // Cycle: pending -> scored -> missed -> pending
    if (penalties[index] === 'pending') penalties[index] = 'scored';
    else if (penalties[index] === 'scored') penalties[index] = 'missed';
    else penalties[index] = 'pending';

    updateMatch({ [team === 'home' ? 'homeTeam' : 'awayTeam']: { ...currentTeam, penalties } });
  };

  const addPenaltyRound = () => {
    const newHomePen = [...(homeTeam.penalties || [])];
    const newAwayPen = [...(awayTeam.penalties || [])];
    newHomePen.push('pending');
    newAwayPen.push('pending');
    updateMatch({
      homeTeam: { ...homeTeam, penalties: newHomePen },
      awayTeam: { ...awayTeam, penalties: newAwayPen }
    });
  };

  const removePenaltyRound = () => {
    const newHomePen = [...(homeTeam.penalties || [])];
    const newAwayPen = [...(awayTeam.penalties || [])];
    if (newHomePen.length > 5) {
      newHomePen.pop();
      newAwayPen.pop();
      updateMatch({
        homeTeam: { ...homeTeam, penalties: newHomePen },
        awayTeam: { ...awayTeam, penalties: newAwayPen }
      });
    }
  };

  const handleScoreEvent = (team, isScored) => {
    const currentTeam = team === 'home' ? homeTeam : awayTeam;
    const penalties = [...(currentTeam.penalties || ['pending', 'pending', 'pending', 'pending', 'pending'])];
    let score = currentTeam.score || 0;
    
    // Find the first 'pending'
    const nextIndex = penalties.findIndex(status => status === 'pending');
    if (nextIndex !== -1) {
      penalties[nextIndex] = isScored ? 'scored' : 'missed';
      if (isScored) {
        score += 1;
      }
      updateMatch({ [team === 'home' ? 'homeTeam' : 'awayTeam']: { ...currentTeam, penalties, score } });
    }
  };

  const handleReset = () => {
    updateMatch({
      homeTeam: { ...homeTeam, score: 0, penalties: ['pending', 'pending', 'pending', 'pending', 'pending'] },
      awayTeam: { ...awayTeam, score: 0, penalties: ['pending', 'pending', 'pending', 'pending', 'pending'] }
    });
  };

  const handleClearCircles = () => {
    updateMatch({
      homeTeam: { ...homeTeam, penalties: ['pending', 'pending', 'pending', 'pending', 'pending'] },
      awayTeam: { ...awayTeam, penalties: ['pending', 'pending', 'pending', 'pending', 'pending'] }
    });
  };

  const renderButtons = (team) => {
    const currentTeam = team === 'home' ? homeTeam : awayTeam;
    const penalties = currentTeam.penalties || [];

    return (
      <Space wrap style={{ marginTop: 8 }}>
        {penalties.map((status, index) => {
          let btnType = 'default';
          let btnDanger = false;
          let label = '-';
          let bg = 'transparent';
          let color = '#fff';

          if (status === 'scored') {
            btnType = 'primary';
            label = 'O';
            bg = '#52c41a';
          } else if (status === 'missed') {
            btnType = 'primary';
            btnDanger = true;
            label = 'X';
            bg = '#f5222d';
          }

          return (
            <Button 
              key={index} 
              type={btnType} 
              danger={btnDanger} 
              onClick={() => handlePenaltyClick(team, index)}
              style={{ width: 40, height: 40, fontWeight: 'bold', background: btnType === 'primary' ? bg : '#30363d', borderColor: '#30363d', color }}
            >
              {label}
            </Button>
          );
        })}
      </Space>
    );
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Text strong>Hiển thị bảng Penalty</Text>
        <Switch checked={isVisible} onChange={togglePenaltyBoard} />
      </Row>
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Row justify="space-between" align="middle">
            <Text strong style={{ color: '#ff4d4f' }}>🏠 Đội Nhà</Text>
            <Space>
              <Button type="primary" style={{ background: '#52c41a' }} onClick={() => handleScoreEvent('home', true)}>Vào (+1)</Button>
              <Button type="primary" danger onClick={() => handleScoreEvent('home', false)}>Không vào</Button>
            </Space>
          </Row>
          <div style={{ background: '#1c2128', padding: 8, borderRadius: 6, border: '1px solid #30363d', marginTop: 4 }}>
            {renderButtons('home')}
          </div>
        </Col>
        <Col span={24}>
          <Row justify="space-between" align="middle">
            <Text strong style={{ color: '#1890ff' }}>✈️ Đội Khách</Text>
            <Space>
              <Button type="primary" style={{ background: '#52c41a' }} onClick={() => handleScoreEvent('away', true)}>Vào (+1)</Button>
              <Button type="primary" danger onClick={() => handleScoreEvent('away', false)}>Không vào</Button>
            </Space>
          </Row>
          <div style={{ background: '#1c2128', padding: 8, borderRadius: 6, border: '1px solid #30363d', marginTop: 4 }}>
            {renderButtons('away')}
          </div>
        </Col>
      </Row>

      <Row justify="center" align="middle" style={{ marginTop: 16 }} gutter={12}>
        <Col span={16}>
          <Button onClick={handleClearCircles} size="large" style={{ fontWeight: 'bold', background: '#faad14', color: '#fff', border: 'none', width: '100%' }}>
            🧹 LÀM MỚI 5 LƯỢT SÚT (GIỮ TỈ SỐ)
          </Button>
        </Col>
        <Col span={8}>
          <Button danger onClick={handleReset} size="large" style={{ fontWeight: 'bold', width: '100%' }}>
            🔄 RESET (VỀ 0-0)
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(PenaltyControl);
