import React, { useEffect, useState } from 'react';
import { Tabs, Button, Card, Switch, InputNumber, Input, Row, Col } from 'antd';
import { socket } from '../socket/socket';

const AdminPage = () => {
  const [matchId, setMatchId] = useState('match_001'); // Mặc định
  const [state, setState] = useState(null);

  useEffect(() => {
    socket.connect();
    socket.emit('join-match', matchId);

    const handleState = (s) => setState(s);
    socket.on('overlay:state', handleState);

    return () => {
      socket.off('overlay:state', handleState);
      socket.disconnect();
    };
  }, [matchId]);

  const updateMatch = (data) => {
    socket.emit('match:update', { matchId, matchData: data });
  };

  const toggleLayer = (layerName, visible) => {
    socket.emit('layer:toggle', { matchId, layerName, visible });
  };

  if (!state) return <div className="p-8">Đang kết nối tới server...</div>;

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">vMix Overlay Control Panel</h1>
      
      <div className="mb-4 flex items-center gap-4">
        <Input 
          addonBefore="Match ID" 
          value={matchId} 
          onChange={(e) => setMatchId(e.target.value)} 
          className="w-64"
        />
        <Button type="primary" onClick={() => socket.emit('join-match', matchId)}>Kết nối lại</Button>
      </div>

      <Tabs defaultActiveKey="1">
        {/* TAB SCORE */}
        <Tabs.TabPane tab="Score & Time" key="1">
          <Row gutter={16}>
            <Col span={12}>
              <Card title={`Đội A: ${state.match.teamA.name}`}>
                <div className="flex items-center gap-4 text-2xl font-bold mb-4">
                  <Button onClick={() => updateMatch({ teamA: { ...state.match.teamA, score: state.match.teamA.score - 1 } })}>-</Button>
                  <span>{state.match.teamA.score}</span>
                  <Button onClick={() => updateMatch({ teamA: { ...state.match.teamA, score: state.match.teamA.score + 1 } })}>+</Button>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={`Đội B: ${state.match.teamB.name}`}>
                <div className="flex items-center gap-4 text-2xl font-bold mb-4">
                  <Button onClick={() => updateMatch({ teamB: { ...state.match.teamB, score: state.match.teamB.score - 1 } })}>-</Button>
                  <span>{state.match.teamB.score}</span>
                  <Button onClick={() => updateMatch({ teamB: { ...state.match.teamB, score: state.match.teamB.score + 1 } })}>+</Button>
                </div>
              </Card>
            </Col>
          </Row>
          
          <Card title="Đồng hồ" className="mt-4">
             <div className="flex gap-4">
                <Input value={state.match.clock} onChange={e => updateMatch({ clock: e.target.value })} addonBefore="Thời gian" />
                <Input value={state.match.period} onChange={e => updateMatch({ period: e.target.value })} addonBefore="Hiệp đấu" />
                <InputNumber value={state.match.extraTime} onChange={v => updateMatch({ extraTime: v })} addonBefore="Bù giờ" />
             </div>
          </Card>
        </Tabs.TabPane>

        {/* TAB LAYERS */}
        <Tabs.TabPane tab="Layer Controls" key="2">
          <Card title="Bật/Tắt Overlay">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.keys(state.layers).map(layerKey => (
                <div key={layerKey} className="flex justify-between items-center bg-white p-3 border rounded shadow-sm">
                  <span className="font-semibold">{layerKey}</span>
                  <Switch 
                    checked={state.layers[layerKey].visible} 
                    onChange={(checked) => toggleLayer(layerKey, checked)} 
                  />
                </div>
              ))}
            </div>
          </Card>
        </Tabs.TabPane>

        {/* TAB MATCH INFO */}
        <Tabs.TabPane tab="Match Info" key="3">
          <Card title="Thông tin giải đấu">
             <Input className="mb-2" value={state.match.tournamentName} onChange={e => updateMatch({ tournamentName: e.target.value })} addonBefore="Tên giải" />
             <Input className="mb-2" value={state.match.roundName} onChange={e => updateMatch({ roundName: e.target.value })} addonBefore="Vòng đấu" />
             <Input className="mb-2" value={state.match.stadium} onChange={e => updateMatch({ stadium: e.target.value })} addonBefore="Sân vận động" />
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default AdminPage;
