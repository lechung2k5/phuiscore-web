import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Layout, Typography, Spin, Row, Col, Space, Tag, ConfigProvider, theme, Tabs, message, Button } from 'antd';
import { WifiOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { socket } from '../socket/socket';

import MatchControl from '../components/control/MatchControl';
import LegacyScoreControl from '../components/control/LegacyScoreControl';
import ScoreControl from '../components/control/ScoreControl';
import LayerControl from '../components/control/LayerControl';
import EventControl from '../components/control/EventControl';
import LineupControl from '../components/control/LineupControl';
import PenaltyControl from '../components/control/PenaltyControl';
import SponsorControl from '../components/control/SponsorControl';
import MediaControl from '../components/control/MediaControl';
import VMixNativeControl from '../components/control/VMixNativeControl';
import CommentatorControl from '../components/control/CommentatorControl';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// ---- Design Tokens ----
const C = {
  bg: '#0d1117',
  surface: '#161b22',
  border: '#30363d',
  accent: '#177ddc',
  accentHover: '#1890ff',
  text: '#e6edf3',
  textMuted: '#8b949e',
  danger: '#f85149',
};

const sectionStyle = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '12px 16px',
};

const sectionTitle = (label, color = C.accent) => (
  <div style={{
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color,
    borderBottom: `1px solid ${C.border}`,
    paddingBottom: 8,
    marginBottom: 12,
  }}>
    {label}
  </div>
);

const ControlPage = () => {
  const { matchId } = useParams();
  const location = useLocation();
  const [matchState, setMatchState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const initializeMatch = async () => {
      const searchParams = new URLSearchParams(location.search);
      const dateParam = searchParams.get('date');
      
      try {
        const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
        const url = `${SERVER_URL}/api/matches/${matchId}/state${dateParam ? `?date=${dateParam}` : ''}`;
        const res = await axios.get(url);
        if (res.data) setMatchState(res.data);
      } catch (err) {
        console.error("Failed to fetch initial match state", err);
      }
    };

    initializeMatch().then(() => {
      socket.connect();
    });

    const onConnect = () => {
      setConnected(true);
      socket.emit('join-match', matchId);
    };
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) onConnect();

    const handleStateUpdate = (data) => setMatchState(data);
    socket.on('overlay:state', handleStateUpdate);

    const handleClockTick = (data) => {
      setMatchState(prev => prev ? {
        ...prev,
        matchInfo: { ...prev.matchInfo, time: data.time }
      } : prev);
    };
    socket.on('clock:tick', handleClockTick);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('overlay:state', handleStateUpdate);
      socket.off('clock:tick', handleClockTick);
      socket.disconnect();
    };
  }, [matchId, location.search]);

  // Dùng useCallback để các component con không bị re-render mỗi giây khi timer tick
  const updateMatch = useCallback((updates) => {
    socket.emit('update_state', { matchId, updates });
  }, [matchId]);

  const toggleLayer = useCallback((layerName, isVisible) => {
    socket.emit('update_state', {
      matchId,
      updates: { layers: { [layerName]: { visible: isVisible } } }
    });
  }, [matchId]);

  const triggerEvent = useCallback((eventData) => {
    socket.emit('trigger_event', { matchId, eventData });
  }, [matchId]);

  const handleReset = async () => {
    try {
      setResetting(true);
      const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
      await axios.post(`${SERVER_URL}/api/matches/${matchId}/reset`, {});
      message.success('Đã đồng bộ lại trạng thái từ server');
    } catch (err) {
      console.error("Failed to reset match state", err);
      message.error('Lỗi khi đồng bộ dữ liệu');
    } finally {
      setResetting(false);
    }
  };

  if (!matchState) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: C.bg, gap: 16 }}>
        <LoadingOutlined style={{ fontSize: 36, color: C.accent }} />
        <Text style={{ color: C.textMuted }}>Đang kết nối đến server...</Text>
      </div>
    );
  }

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorBgContainer: '#161b22', colorBgElevated: '#1c2128', colorBorder: '#30363d', colorText: '#e6edf3', colorTextSecondary: '#8b949e', colorPrimary: '#177ddc', borderRadius: 6 } }}>
    <Layout style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      {/* ===== HEADER ===== */}
      <Header style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        height: 52,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: C.accent, letterSpacing: 1, textTransform: 'uppercase' }}>
            ⚽ Phủi Score
          </span>
          <span style={{ color: C.border, margin: '0 12px' }}>|</span>
          <span style={{ color: C.textMuted, fontSize: 13 }}>VMIX Control Dashboard</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button size="small" onClick={handleReset} loading={resetting} type="text" style={{ color: C.textMuted }}>
            Reset
          </Button>
          <Tag color={connected ? 'success' : 'error'} style={{ margin: 0 }}>
            <WifiOutlined /> {connected ? 'CONNECTED' : 'OFFLINE'}
          </Tag>
          <Text style={{ color: C.textMuted, fontSize: 12 }}>Match: <span style={{ color: C.accent, fontWeight: 700 }}>{matchId}</span></Text>
        </div>
      </Header>

      <Content style={{ padding: '12px 16px', overflowY: 'auto', height: 'calc(100vh - 52px)' }}>
        <Tabs 
          defaultActiveKey="1" 
          items={[
            {
              key: '1',
              label: '🎛️ ĐIỀU KHIỂN OVERLAY',
              children: (
                <>
                  {/* ===== LAYER CONTROL - THANH NGANG TRÊN CÙNG ===== */}
                  <div style={{ ...sectionStyle, marginBottom: 12 }}>
                    {sectionTitle('🎛️  Điều Khiển Layer (Bật / Tắt)', '#e6edf3')}
                    <LayerControl matchState={matchState} toggleLayer={toggleLayer} horizontal />
                  </div>



                  {/* ===== 3 CỘT CHÍNH ===== */}
                  <Row gutter={[12, 12]} align="stretch">
                    {/* CỘT TRÁI - BẢNG TỶ SỐ */}
                    <Col xs={24} lg={8}>
                      <Space direction="vertical" size={12} style={{ display: 'flex' }}>
                        <div style={sectionStyle}>
                          {sectionTitle('📊  Bảng Tỷ Số', '#52c41a')}
                          <LegacyScoreControl matchState={matchState} updateMatch={updateMatch} triggerEvent={triggerEvent} />
                        </div>

                        <div style={sectionStyle}>
                          {sectionTitle('🖼️  Media & Tài Trợ', C.textMuted)}
                          <SponsorControl matchState={matchState} updateMatch={updateMatch} />
                          <div style={{ marginTop: 12 }}>
                            <MediaControl matchState={matchState} updateMatch={updateMatch} />
                          </div>
                        </div>
                      </Space>
                    </Col>

                    {/* CỘT GIỮA - CẤU HÌNH TRẬN */}
                    <Col xs={24} lg={8}>
                      <Space direction="vertical" size={12} style={{ display: 'flex' }}>
                        <div style={sectionStyle}>
                          {sectionTitle('⚙️  Cấu Hình Trận Đấu', C.accent)}
                          <MatchControl matchState={matchState} updateMatch={updateMatch} />
                        </div>

                        <Row gutter={12}>
                          <Col span={24}>
                            <div style={{...sectionStyle, marginBottom: 12}}>
                              {sectionTitle('👥  Đội Hình', C.textMuted)}
                              <LineupControl matchState={matchState} triggerEvent={triggerEvent} />
                            </div>
                          </Col>
                          <Col span={24}>
                            <div style={sectionStyle}>
                              {sectionTitle('🥅  Luân Lưu', '#faad14')}
                              <PenaltyControl matchState={matchState} updateMatch={updateMatch} />
                            </div>
                          </Col>
                        </Row>
                      </Space>
                    </Col>

                    {/* CỘT PHẢI - SỰ KIỆN */}
                    <Col xs={24} lg={8}>
                      <Space direction="vertical" size={12} style={{ display: 'flex', height: '100%' }}>
                        <div style={{ ...sectionStyle, flex: 1 }}>
                          {sectionTitle('⚡  Điều Khiển Sự Kiện', '#f5222d')}
                          <EventControl matchState={matchState} triggerEvent={triggerEvent} />
                        </div>
                        <div style={{ ...sectionStyle }}>
                          {sectionTitle('🎙️  Bình Luận Viên', '#1890ff')}
                          <CommentatorControl matchState={matchState} updateMatch={updateMatch} />
                        </div>
                      </Space>
                    </Col>
                  </Row>
                </>
              )
            },
            {
              key: '2',
              label: '🎥 ĐIỀU KHIỂN VMIX (CAMERA & REPLAY)',
              children: (
                <div style={{ marginTop: '-16px' }}>
                  <VMixNativeControl matchId={matchId} />
                </div>
              )
            }
          ]}
        />
      </Content>
    </Layout>
    </ConfigProvider>
  );
};

export default ControlPage;
