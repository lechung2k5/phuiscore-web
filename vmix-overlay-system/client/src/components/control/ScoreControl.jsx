import React from 'react';
import { Row, Col, Button, Card, Typography, InputNumber, Divider, Select } from 'antd';
import { PlusOutlined, MinusOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const ScoreControl = ({ matchState, updateMatch, triggerEvent }) => {
  const { homeTeam, awayTeam, matchInfo } = matchState;

  const changeScore = (team, amount) => {
    if (team === 'home') {
      const newScore = Math.max(0, homeTeam.score + amount);
      updateMatch({ homeTeam: { ...homeTeam, score: newScore } });
      if (amount > 0 && triggerEvent) {
        triggerEvent({ type: 'scoreboard_goal', team: 'home', id: Date.now() });
      }
    } else {
      const newScore = Math.max(0, awayTeam.score + amount);
      updateMatch({ awayTeam: { ...awayTeam, score: newScore } });
      if (amount > 0 && triggerEvent) {
        triggerEvent({ type: 'scoreboard_goal', team: 'away', id: Date.now() });
      }
    }
  };

  const toggleTimer = () => {
    updateMatch({ matchInfo: { ...matchInfo, isRunning: !matchInfo.isRunning } });
  };

  return (
    <Card bordered={false}>
      <Row gutter={32} align="middle">
        {/* Đội Nhà */}
        <Col span={8} style={{ textAlign: 'center' }}>
          <Title level={3}>{homeTeam.name}</Title>
          <div style={{ fontSize: 72, fontWeight: 'bold', color: '#1890ff', margin: '20px 0' }}>
            {homeTeam.score}
          </div>
          <Button.Group size="large">
            <Button icon={<MinusOutlined />} onClick={() => changeScore('home', -1)} />
            <Button icon={<PlusOutlined />} onClick={() => changeScore('home', 1)} type="primary" />
          </Button.Group>
        </Col>

        {/* Thời gian */}
        <Col span={8} style={{ textAlign: 'center' }}>
          <Card type="inner" style={{ background: '#f5f5f5' }}>
            <Select 
              value={matchInfo.status || 'PRE_MATCH'} 
              onChange={(val) => updateMatch({ matchInfo: { ...matchInfo, status: val } })}
              style={{ width: '100%', marginBottom: 16, fontWeight: 'bold' }}
            >
              <Option value="PRE_MATCH">Chưa bắt đầu</Option>
              <Option value="FIRST_HALF">Hiệp 1</Option>
              <Option value="HALF_TIME">Nghỉ giữa hiệp</Option>
              <Option value="SECOND_HALF">Hiệp 2</Option>
              <Option value="EXTRA_TIME">Hiệp phụ</Option>
              <Option value="PENALTY">Luân lưu</Option>
              <Option value="FINISHED">Kết thúc</Option>
            </Select>
            <Text type="secondary" style={{ fontSize: 16 }}>Thời gian thi đấu</Text>
            <div style={{ fontSize: 48, fontWeight: 'bold', fontFamily: 'monospace', margin: '10px 0' }}>
              {Math.floor(matchInfo.time / 60).toString().padStart(2, '0')}:
              {(matchInfo.time % 60).toString().padStart(2, '0')}
            </div>
            
            <Button 
              type={matchInfo.isRunning ? "default" : "primary"}
              danger={matchInfo.isRunning}
              icon={matchInfo.isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={toggleTimer}
              size="large"
              style={{ width: '100%', marginBottom: 16 }}
            >
              {matchInfo.isRunning ? 'Tạm dừng' : 'Bắt đầu'}
            </Button>

            <Divider style={{ margin: '12px 0' }} />
            
            <Text>Phút (Set tay): </Text>
            <InputNumber 
              min={0} 
              max={120} 
              value={Math.floor(matchInfo.time / 60)} 
              onChange={(val) => updateMatch({ matchInfo: { ...matchInfo, time: val * 60 + (matchInfo.time % 60) } })}
            />
          </Card>
        </Col>

        {/* Đội Khách */}
        <Col span={8} style={{ textAlign: 'center' }}>
          <Title level={3}>{awayTeam.name}</Title>
          <div style={{ fontSize: 72, fontWeight: 'bold', color: '#ff4d4f', margin: '20px 0' }}>
            {awayTeam.score}
          </div>
          <Button.Group size="large">
            <Button icon={<MinusOutlined />} onClick={() => changeScore('away', -1)} />
            <Button icon={<PlusOutlined />} onClick={() => changeScore('away', 1)} type="primary" danger />
          </Button.Group>
        </Col>
      </Row>
    </Card>
  );
};

export default ScoreControl;
