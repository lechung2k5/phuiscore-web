import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Layout, Typography, Input, Button, Card, Row, Col, Space } from 'antd';
import { PlayCircleOutlined, SettingOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const HomePage = () => {
  const [matchId, setMatchId] = useState('');
  const navigate = useNavigate();

  const handleJoin = (matchObjOrId) => {
    if (matchObjOrId && typeof matchObjOrId === 'object' && matchObjOrId.id) {
      navigate(`/control/${matchObjOrId.id}?date=${matchObjOrId.dateString}`);
    } else {
      const targetId = typeof matchObjOrId === 'string' ? matchObjOrId : matchId.trim();
      if (targetId) {
        navigate(`/control/${targetId}`);
      }
    }
  };

  const [tournamentId, setTournamentId] = useState('5ac6ac30-fd8c-44a4-af02-fd88dbafaac0');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchMatches(tournamentId);
    }
  }, []);

  const fetchMatches = async (tid) => {
    setLoading(true);
    try {
      // Gọi API đến server vMix (Backend độc lập)
      const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
      const res = await axios.get(`${SERVER_URL}/api/matches/tournament/${tid}`);
      if (res.data && res.data.data) {
        const now = new Date();
        const sorted = res.data.data.sort((a, b) => {
          // Ưu tiên trận đang đá lên đầu tiên
          if (a.status === 'inprogress' && b.status !== 'inprogress') return -1;
          if (a.status !== 'inprogress' && b.status === 'inprogress') return 1;
          
          // Sau đó sắp xếp theo thời gian gần với hiện tại nhất
          const dateA = new Date(a.dateString + 'T' + a.timeString);
          const dateB = new Date(b.dateString + 'T' + b.timeString);
          const diffA = Math.abs(dateA - now);
          const diffB = Math.abs(dateB - now);
          return diffA - diffB;
        });
        setMatches(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#141414' }}>
      <Header style={{ background: '#1f1f1f', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0, color: '#177ddc' }}>
          PHỦI SCORE - HỆ THỐNG ĐIỀU KHIỂN VMIX
        </Title>
      </Header>
      
      <Content style={{ padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 600 }}>
          <Card 
            title={<span style={{ color: '#fff', fontSize: '18px' }}>Tham gia điều khiển trận đấu</span>}
            style={{ background: '#1f1f1f', border: '1px solid #333' }}
            headStyle={{ borderBottom: '1px solid #333' }}
          >
            <Space.Compact style={{ width: '100%', marginBottom: 24 }}>
              <Input 
                size="large" 
                placeholder="Nhập mã trận đấu (Match ID)..." 
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                onPressEnter={() => handleJoin()}
                style={{ background: '#141414', color: '#fff', borderColor: '#333' }}
              />
              <Button type="primary" size="large" onClick={() => handleJoin()} icon={<SettingOutlined />}>
                Vào Control Panel
              </Button>
            </Space.Compact>

            <Title level={5} style={{ color: '#888', marginTop: 16 }}>Chọn trận đấu từ Giải đấu (ID: {tournamentId}):</Title>
            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Input 
                placeholder="ID Giải đấu (VD: 5ac6ac30-fd8c-44a4-af02-fd88dbafaac0)" 
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                onPressEnter={() => fetchMatches(tournamentId)}
                style={{ background: '#141414', color: '#fff', borderColor: '#333' }}
              />
              <Button type="default" onClick={() => fetchMatches(tournamentId)} loading={loading}>
                Tải danh sách trận
              </Button>
            </Space.Compact>

            <Row gutter={[16, 16]} style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
              {matches.length === 0 && !loading && (
                <Col span={24}>
                  <Text style={{ color: '#888' }}>Không có trận đấu nào. Hãy nhập đúng ID Giải đấu.</Text>
                </Col>
              )}
              {matches.map((match, index) => (
                <Col span={12} key={`${match.id}_${index}`}>
                  <Card 
                    hoverable 
                    onClick={() => handleJoin(match)}
                    style={{ background: '#262626', border: '1px solid #444', height: '100%' }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <Title level={5} style={{ color: '#177ddc', margin: 0, fontSize: '14px' }}>
                      {match.homeTeam?.name || 'TBA'} <br/> vs <br/> {match.awayTeam?.name || 'TBA'}
                    </Title>
                    <div style={{ marginTop: 8 }}>
                      <Text style={{ color: '#aaa', fontSize: 12, display: 'block' }}>ID: {match.id}</Text>
                      <Text style={{ color: '#aaa', fontSize: 12, display: 'block' }}>Ngày: {match.dateString} - {match.timeString}</Text>
                      <Text style={{ color: match.status === 'inprogress' ? '#52c41a' : '#888', fontSize: 12, fontWeight: 'bold' }}>
                        [{match.status === 'inprogress' ? 'Đang đá' : (match.status === 'finished' ? 'Kết thúc' : 'Sắp tới')}]
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Space>
      </Content>
    </Layout>
  );
};

export default HomePage;
