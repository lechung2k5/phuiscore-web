import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Typography, message, Space, Spin, Slider, Select } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  StepBackwardOutlined,
  StepForwardOutlined,
  VideoCameraOutlined,
  SyncOutlined,
  ZoomInOutlined,
  RobotOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { socket } from '../../socket/socket';

const { Title, Text } = Typography;

// Domain of your Node.js server. Usually it runs on same port as window or 4000
const API_BASE = 'http://localhost:4000/api/vmix';

const VMixNativeControl = ({ matchId }) => {
  const [vmixState, setVmixState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // VAR Automation State
  const [varInput, setVarInput] = useState(null);
  const [cameraInput, setCameraInput] = useState(null);
  const [replayLayer, setReplayLayer] = useState(1);
  const [cameraLayer, setCameraLayer] = useState(2);
  const [outputMethod, setOutputMethod] = useState('OverlayInput1In');
  const [varReason, setVarReason] = useState('KIỂM TRA LỖI');

  const fetchState = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/state`);
      setVmixState(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch vMix state:', err);
      setError('Không thể kết nối vMix qua Proxy Server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    // Tự động làm mới trạng thái mỗi 5 giây
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  const sendCommand = async (funcName, input = '', value = '') => {
    try {
      await axios.post(`${API_BASE}/command`, {
        Function: funcName,
        Input: input,
        Value: value
      });
      // Refresh state ngay sau khi gửi lệnh
      setTimeout(fetchState, 500);
    } catch (err) {
      message.error(`Lỗi gửi lệnh ${funcName}`);
    }
  };

  if (error) {
    return (
      <Card style={{ background: '#1c2128', borderColor: '#f85149' }}>
        <Text type="danger">{error}</Text>
        <Button size="small" style={{ marginLeft: 10 }} onClick={fetchState}><SyncOutlined /> Thử lại</Button>
      </Card>
    );
  }

  if (!vmixState) {
    return <Spin tip="Đang tải dữ liệu vMix..." />;
  }

  // Lọc danh sách các input để phục vụ Macro
  const allInputs = vmixState?.inputs || [];
  const replayInputs = allInputs.filter(inp => inp.type?.toLowerCase().includes('replay'));

  // Lọc ra các inputs là Camera
  const videoInputs = allInputs.filter(i => {
    const type = i.type?.toLowerCase() || '';
    const title = i.title?.toLowerCase() || '';
    
    // Loại bỏ các overlay tĩnh hoặc âm thanh/replay
    const isOverlay = type.includes('title') || 
                      type.includes('gt') || 
                      type.includes('xaml') || 
                      type.includes('audio') || 
                      type.includes('replay') || 
                      type === 'image' || 
                      type === 'solid' ||
                      type === 'colour';

    // Nhận diện Camera: Loại là capture/ndi/video/stream HOẶC tên có chữ cam/camera
    const isCamera = type === 'capture' || 
                     type === 'ndi' || 
                     type === 'video' || 
                     type === 'stream' || 
                     type === 'desktopcapture' ||
                     title.includes('cam');

    return isCamera && !isOverlay;
  });

  const executeVarMacro = async () => {
    if (!varInput || !cameraInput || replayInputs.length === 0) {
      message.error("Vui lòng chọn Lớp Overlay VAR, Camera và đảm bảo vMix có Replay!");
      return;
    }
    try {
      const replayNumber = replayInputs[0].number;
      // 1. Nhét Replay vào Layer tương ứng
      await axios.post(`${API_BASE}/command`, { Function: 'SetMultiViewOverlay', Input: varInput, Value: `${replayLayer},${replayNumber}` });
      // 2. Nhét Camera vào Layer tương ứng
      await axios.post(`${API_BASE}/command`, { Function: 'SetMultiViewOverlay', Input: varInput, Value: `${cameraLayer},${cameraInput}` });
      
      // 3. Xuất hình
      if (outputMethod === 'ActiveInput') {
        await axios.post(`${API_BASE}/command`, { Function: 'ActiveInput', Input: varInput });
      } else {
        // Output method là OverlayInputXIn
        await axios.post(`${API_BASE}/command`, { Function: outputMethod, Input: varInput });
      }
      
      // 4. Bật Graphic Overlay trên Web (hiển thị Lý do)
      if (matchId) {
        socket.emit('update_state', { 
          matchId, 
          updates: { layers: { varOverlay: { visible: true, data: { reason: varReason } } } } 
        });
      }

      message.success("Đã kích hoạt VAR Macro thành công!");
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi chạy Macro VAR");
    }
  };

  const turnOffVarMacro = async () => {
    try {
      if (outputMethod.includes('OverlayInput')) {
        try {
          // Dùng lệnh Toggle (Ví dụ: OverlayInput1) kèm đúng Input đã chọn để tắt nó đi
          const toggleCommand = outputMethod.replace('In', '');
          await axios.post(`${API_BASE}/command`, { Function: toggleCommand, Input: varInput });
          message.success(`Đã tắt lớp overlay VAR trên vMix`);
        } catch (vmixErr) {
          console.warn("vMix có thể đã tắt Overlay từ trước:", vmixErr);
          // Không throw lỗi ra ngoài để web vẫn tắt được Graphic
        }
      } else {
        message.info("Bạn đang dùng chế độ Cắt thẳng. Vui lòng bấm chọn Camera bất kỳ trên vMix để thoát VAR.");
      }

      // LUÔN LUÔN Tắt Graphic Overlay trên Web (thẻ Lý do)
      if (matchId) {
        socket.emit('update_state', { 
          matchId, 
          updates: { layers: { varOverlay: { visible: false } } } 
        });
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi xử lý lệnh Tắt VAR");
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* ======================= VAR AUTOMATION MACRO ======================= */}
      <Card 
        style={{ background: '#1c2128', borderColor: '#ff4d4f', marginBottom: 16 }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={18}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={8}>
                <Text style={{ color: '#c9d1d9', display: 'block', marginBottom: 4 }}>1. Chọn Camera:</Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn Camera Input"
                  value={cameraInput}
                  onChange={setCameraInput}
                  options={allInputs.filter(i => i.type !== 'Audio').map(i => ({ value: i.number, label: `${i.number}: ${i.title}` }))}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Text style={{ color: '#c9d1d9', display: 'block', marginBottom: 4 }}>2. Chọn Lớp Overlay VAR:</Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn VAR Input"
                  value={varInput}
                  onChange={setVarInput}
                  options={allInputs.map(i => ({ value: i.number, label: `${i.number}: ${i.title}` }))}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Text style={{ color: '#c9d1d9', display: 'block', marginBottom: 4 }}>3. Lý do Check VAR:</Text>
                <Select
                  style={{ width: '100%' }}
                  value={varReason}
                  onChange={setVarReason}
                  options={[
                    { value: 'KIỂM TRA BÀN THẮNG', label: 'KIỂM TRA BÀN THẮNG' },
                    { value: 'KIỂM TRA PHẠT ĐỀN', label: 'KIỂM TRA PHẠT ĐỀN' },
                    { value: 'KIỂM TRA THẺ ĐỎ', label: 'KIỂM TRA THẺ ĐỎ' },
                    { value: 'KIỂM TRA LỖI', label: 'KIỂM TRA LỖI' },
                    { value: 'VAR CHECK', label: 'VAR CHECK (CHUNG)' }
                  ]}
                />
              </Col>

              {/* Tùy chỉnh Layer Nâng Cao */}
              <Col xs={24}>
                <Row gutter={16} align="middle">
                  <Col span={10}>
                    <Text style={{ color: '#8b949e', fontSize: 12 }}>Nhét Replay/Cam vào Layer số:</Text>
                    <Select size="small" style={{ width: 50, marginLeft: 8 }} value={replayLayer} onChange={setReplayLayer} options={[1,2,3,4,5,6,7,8].map(n => ({ value: n, label: n }))} />
                    <Select size="small" style={{ width: 50, marginLeft: 4 }} value={cameraLayer} onChange={setCameraLayer} options={[1,2,3,4,5,6,7,8].map(n => ({ value: n, label: n }))} />
                  </Col>
                  <Col span={14} style={{ textAlign: 'right' }}>
                    <Text style={{ color: '#8b949e', fontSize: 12, marginRight: 8 }}>Hành động xuất hình:</Text>
                    <Select
                      size="small"
                      style={{ width: 160 }}
                      value={outputMethod}
                      onChange={setOutputMethod}
                      options={[
                        { value: 'ActiveInput', label: 'Cắt thẳng (ActiveInput)' },
                        { value: 'OverlayInput1In', label: 'Bật đè Overlay 1' },
                        { value: 'OverlayInput2In', label: 'Bật đè Overlay 2' },
                        { value: 'OverlayInput3In', label: 'Bật đè Overlay 3' },
                        { value: 'OverlayInput4In', label: 'Bật đè Overlay 4' }
                      ]}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Col>
          <Col xs={24} md={6}>
            <Row gutter={[8, 8]}>
              <Col span={24}>
                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  style={{ height: '54px', background: 'linear-gradient(90deg, #177ddc, #18e6ff)', borderColor: 'transparent', fontWeight: 900, fontSize: '16px', letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={executeVarMacro}
                >
                  <RobotOutlined style={{ fontSize: 20, marginRight: 8 }} />
                  BẬT VAR
                </Button>
              </Col>
              <Col span={24}>
                <Button 
                  type="primary" 
                  danger
                  size="large" 
                  block 
                  style={{ height: '40px', fontWeight: 900, fontSize: '14px', letterSpacing: 1 }}
                  onClick={turnOffVarMacro}
                >
                  TẮT VAR
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* --- REPLAY CONTROLS (FULL WIDTH) --- */}
        <Col xs={24} lg={24}>
          <Card 
            title="⏱️ Replay Controls" 
            size="small" 
            style={{ background: '#161b22', borderColor: '#30363d', height: '100%' }}
            headStyle={{ color: '#faad14', borderBottom: '1px solid #30363d' }}
          >
            {replayInputs.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Text style={{ color: '#e6edf3' }}>Live Input: {replayInputs[0].title}</Text>
                
                {/* --- 1. Dò Khung Hình (Jog & Shuttle) --- */}
                <div style={{ background: '#1c2128', padding: '16px 20px', borderRadius: 8, border: '1px solid #30363d' }}>
                  <Row justify="space-between" align="middle" gutter={[8, 16]}>
                    {/* Nút Prev Event (Bên Trái) */}
                    <Col xs={12} md={4}>
                      <Button block size="large" icon={<StepBackwardOutlined />} style={{ background: '#21262d', color: '#c9d1d9', borderColor: '#30363d', height: '50px' }} onClick={() => sendCommand('ReplayPlayPreviousEvent', replayInputs[0].number)}>
                        Prev
                      </Button>
                    </Col>
                    
                    {/* Bảng Điều Khiển Tua (Ở Giữa) */}
                    <Col xs={24} md={16}>
                      <Row gutter={[8, 8]} justify="center" align="middle">
                        <Col><Button size="large" style={{ height: '50px' }} onClick={() => sendCommand('ReplayJumpFrames', replayInputs[0].number, '-300')}>-5s</Button></Col>
                        <Col><Button size="large" style={{ height: '50px' }} onClick={() => sendCommand('ReplayJumpFrames', replayInputs[0].number, '-60')}>-1s</Button></Col>
                        <Col>
                          <Button type="primary" size="large" danger style={{ fontWeight: 'bold', height: '50px' }} onClick={() => sendCommand('ReplayJumpFrames', replayInputs[0].number, '-1')}>
                            &lt; Khung Hình Lùi
                          </Button>
                        </Col>
                        
                        <Col>
                          <Button 
                            type="primary" 
                            size="large" 
                            style={{ background: '#d29922', color: '#000', fontWeight: 'bold', height: '50px', padding: '0 30px', fontSize: '16px' }} 
                            onClick={() => sendCommand('ReplayPlayPause', replayInputs[0].number)}
                          >
                            <PlayCircleOutlined /> PLAY / PAUSE <PauseCircleOutlined />
                          </Button>
                        </Col>
                        
                        <Col>
                          <Button type="primary" size="large" style={{ background: '#3fb950', fontWeight: 'bold', height: '50px' }} onClick={() => sendCommand('ReplayJumpFrames', replayInputs[0].number, '1')}>
                            Khung Hình Tới &gt;
                          </Button>
                        </Col>
                        <Col><Button size="large" style={{ height: '50px' }} onClick={() => sendCommand('ReplayJumpFrames', replayInputs[0].number, '60')}>+1s</Button></Col>
                        <Col><Button size="large" style={{ height: '50px' }} onClick={() => sendCommand('ReplayJumpFrames', replayInputs[0].number, '300')}>+5s</Button></Col>
                      </Row>
                    </Col>

                    {/* Nút Next Event (Bên Phải) */}
                    <Col xs={12} md={4}>
                      <Button block size="large" icon={<StepForwardOutlined />} style={{ background: '#21262d', color: '#c9d1d9', borderColor: '#30363d', height: '50px' }} onClick={() => sendCommand('ReplayPlayNextEvent', replayInputs[0].number)}>
                        Next
                      </Button>
                    </Col>
                  </Row>
                </div>

                <Row gutter={[16, 16]}>
                  {/* --- 2. Tốc độ (Speed) --- */}
                  <Col xs={24} lg={8}>
                    <div style={{ background: '#1c2128', padding: '16px 20px', borderRadius: 8, border: '1px solid #30363d', height: '100%' }}>
                      <Text style={{ color: '#177ddc', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Tốc Độ Phát (Speed)</Text>
                      <Row gutter={[8, 8]}>
                        <Col span={12}><Button block size="large" onClick={() => sendCommand('SetRateSlowMotion', replayInputs[0].number, '0.1')}>10%</Button></Col>
                        <Col span={12}><Button block size="large" onClick={() => sendCommand('SetRateSlowMotion', replayInputs[0].number, '0.25')}>25%</Button></Col>
                        <Col span={12}><Button block size="large" onClick={() => sendCommand('SetRateSlowMotion', replayInputs[0].number, '0.5')}>50%</Button></Col>
                        <Col span={12}><Button block size="large" onClick={() => sendCommand('SetRateSlowMotion', replayInputs[0].number, '0.75')}>75%</Button></Col>
                        <Col span={24}>
                          <Button block type="primary" size="large" onClick={() => sendCommand('SetRateSlowMotion', replayInputs[0].number, '1')}>
                            100% (Bình thường)
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </Col>

                  {/* --- 3. Góc Máy (Angles) --- */}
                  <Col xs={24} lg={8}>
                    <div style={{ background: '#1c2128', padding: '16px 20px', borderRadius: 8, border: '1px solid #30363d', height: '100%' }}>
                      <Text style={{ color: '#177ddc', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Góc Máy Trọng Tài</Text>
                      <Row gutter={[8, 8]}>
                        {[1, 2, 3, 4].map(cam => (
                          <Col span={12} key={cam}>
                            <Button block size="large" style={{ height: '55px' }} onClick={() => sendCommand(`ReplayACamera${cam}`, replayInputs[0].number)}>
                              Góc {cam}
                            </Button>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </Col>

                  {/* --- MỚI: 4. Kính Lúp VAR (Zoom & Pan) --- */}
                  <Col xs={24} lg={8}>
                    <div style={{ background: '#1c2128', padding: '16px 20px', borderRadius: 8, border: '1px solid #30363d', height: '100%' }}>
                      <Text style={{ color: '#177ddc', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
                        <ZoomInOutlined /> Kính Lúp VAR (Focus)
                      </Text>
                      <div style={{ padding: '0 8px' }}>
                        <Text style={{ color: '#8b949e', fontSize: 12 }}>Zoom (Thu phóng):</Text>
                        <Slider 
                          min={1} max={10} step={0.1} defaultValue={1} 
                          onAfterChange={(val) => sendCommand('SetZoom', replayInputs[0].number, val.toString())} 
                        />
                        
                        <Text style={{ color: '#8b949e', fontSize: 12 }}>Pan X (Trái / Phải):</Text>
                        <Slider 
                          min={-5} max={5} step={0.1} defaultValue={0} 
                          onAfterChange={(val) => sendCommand('SetPanX', replayInputs[0].number, val.toString())} 
                        />

                        <Text style={{ color: '#8b949e', fontSize: 12 }}>Pan Y (Lên / Xuống):</Text>
                        <Slider 
                          min={-5} max={5} step={0.1} defaultValue={0} 
                          onAfterChange={(val) => sendCommand('SetPanY', replayInputs[0].number, val.toString())} 
                        />
                        
                        <Button 
                          block 
                          size="small" 
                          type="dashed" 
                          style={{ marginTop: 10 }}
                          onClick={() => {
                            sendCommand('SetZoom', replayInputs[0].number, '1');
                            sendCommand('SetPanX', replayInputs[0].number, '0');
                            sendCommand('SetPanY', replayInputs[0].number, '0');
                          }}
                        >
                          Reset Khung Hình (100%)
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  {/* --- 5. Marking --- */}
                  <Col xs={24} lg={12}>
                    <div style={{ background: '#1c2128', padding: '16px 20px', borderRadius: 8, border: '1px solid #30363d', height: '100%' }}>
                      <Text style={{ color: '#177ddc', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Ghi Nhớ Tình Huống</Text>
                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <Button block size="large" type="primary" style={{ background: '#3fb950', height: '55px', padding: 0 }} onClick={() => sendCommand('ReplayMarkIn', replayInputs[0].number)}>
                            Mark In
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button block size="large" type="primary" danger style={{ height: '55px', padding: 0 }} onClick={() => sendCommand('ReplayMarkOut', replayInputs[0].number)}>
                            Mark Out
                          </Button>
                        </Col>
                        <Col span={24}>
                          <Button block size="large" type="primary" style={{ background: '#d29922', color: '#000', fontWeight: 'bold' }} onClick={() => sendCommand('ReplayMarkInOut', replayInputs[0].number, '10')}>
                            Lưu Nhanh 10 Giây
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </Col>

                  {/* --- 6. Phát Lên Stream --- */}
                  <Col xs={24} lg={12}>
                    <div style={{ background: '#1c2128', padding: '16px 20px', borderRadius: 8, border: '1px solid #30363d', height: '100%' }}>
                      <Text style={{ color: '#177ddc', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Phát Sóng</Text>
                      <Row gutter={[8, 8]}>
                        <Col span={24}>
                          <Button block size="large" type="primary" style={{ background: '#f85149', height: '55px', fontWeight: 'bold' }} onClick={() => sendCommand('ReplayLive', replayInputs[0].number)}>
                            VỀ TRỰC TIẾP (LIVE)
                          </Button>
                        </Col>
                        <Col span={24}>
                          <Button block size="large" type="dashed" style={{ height: '40px', whiteSpace: 'normal', lineHeight: '1.2' }} onClick={() => sendCommand('ReplayPlayLastEventToOutput', replayInputs[0].number)}>
                            Phát Tình Huống Cuối Lên Luồng
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </Col>
                </Row>

              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Text type="secondary">Chưa có vMix Replay Input</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default VMixNativeControl;
