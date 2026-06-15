import React from 'react';
import { Form, Input, Button, Row, Col, Divider, message, ColorPicker, InputNumber } from 'antd';

// Dark theme tokens
const D = {
  bg: '#0d1117',
  surface: '#161b22',
  border: '#30363d',
  text: '#e6edf3',
  textMuted: '#8b949e',
  inputBg: '#1c2128',
  accent: '#177ddc',
};

const inputStyle = {
  background: D.inputBg,
  borderColor: D.border,
  color: D.text,
};

const labelStyle = {
  color: D.textMuted,
  fontSize: 12,
};

const teamCardStyle = (borderColor) => ({
  background: D.surface,
  border: `1px solid ${D.border}`,
  borderTop: `3px solid ${borderColor}`,
  borderRadius: 8,
  padding: 12,
});

const MatchControl = ({ matchState, updateMatch }) => {
  const [form] = Form.useForm();
  const [isInitialLoaded, setIsInitialLoaded] = React.useState(false);

  React.useEffect(() => {
    if (matchState && !isInitialLoaded) {
      form.setFieldsValue({
        tournamentName: matchState.matchInfo.tournamentName,
        round: matchState.matchInfo.round,
        venue: matchState.matchInfo.venue,
        halfLength: matchState.matchInfo.halfLength || 45,
        homeTeam: matchState.homeTeam.name,
        homeTeamShort: matchState.homeTeam.shortName || matchState.homeTeam.name,
        awayTeam: matchState.awayTeam.name,
        awayTeamShort: matchState.awayTeam.shortName || matchState.awayTeam.name,
        homeLogo: matchState.homeTeam.logo,
        awayLogo: matchState.awayTeam.logo,
        homeColor: matchState.homeTeam.color || '#991b1b',
        awayColor: matchState.awayTeam.color || '#1e3a8a',
        homeTextColor: matchState.homeTeam.textColor || '#ffffff',
        awayTextColor: matchState.awayTeam.textColor || '#ffffff',
      });
      setIsInitialLoaded(true);
    }
  }, [matchState, form, isInitialLoaded]);

  const onFinish = (values) => {
    updateMatch({
      matchInfo: {
        ...matchState.matchInfo,
        tournamentName: values.tournamentName,
        round: values.round,
        venue: values.venue,
        halfLength: values.halfLength,
      },
      homeTeam: {
        ...matchState.homeTeam,
        name: values.homeTeam,
        shortName: values.homeTeamShort,
        logo: values.homeLogo,
        color: typeof values.homeColor === 'string' ? values.homeColor : values.homeColor?.toHexString?.() || '#991b1b',
        textColor: typeof values.homeTextColor === 'string' ? values.homeTextColor : values.homeTextColor?.toHexString?.() || '#ffffff',
      },
      awayTeam: {
        ...matchState.awayTeam,
        name: values.awayTeam,
        shortName: values.awayTeamShort,
        logo: values.awayLogo,
        color: typeof values.awayColor === 'string' ? values.awayColor : values.awayColor?.toHexString?.() || '#1e3a8a',
        textColor: typeof values.awayTextColor === 'string' ? values.awayTextColor : values.awayTextColor?.toHexString?.() || '#ffffff',
      }
    });
    message.success('Đã cập nhật thông tin trận đấu!');
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      {/* Thông tin chung */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: D.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
          Thông tin chung
        </div>
        <Row gutter={10}>
          <Col span={6}>
            <Form.Item name="tournamentName" label={<span style={labelStyle}>Tên Giải Đấu</span>} style={{ marginBottom: 8 }}>
              <Input placeholder="Phủi Score Cup 2026" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="round" label={<span style={labelStyle}>Vòng đấu</span>} style={{ marginBottom: 8 }}>
              <Input placeholder="VD: Chung kết" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="venue" label={<span style={labelStyle}>Sân thi đấu</span>} style={{ marginBottom: 8 }}>
              <Input placeholder="VD: Sân Chảo Lửa" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="halfLength" label={<span style={labelStyle}>Thời gian/Hiệp</span>} style={{ marginBottom: 8 }}>
              <InputNumber min={5} max={60} style={{ ...inputStyle, width: '100%' }} placeholder="VD: 30" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Thông tin đội */}
      <Row gutter={10}>
        <Col span={12}>
          <div style={teamCardStyle('#177ddc')}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#177ddc', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              🏠 Đội Nhà
            </div>
            <Form.Item name="homeTeam" label={<span style={labelStyle}>Tên đầy đủ</span>} style={{ marginBottom: 8 }}>
              <Input placeholder="Lọc Nước - Mặt Trời Việt" style={inputStyle} />
            </Form.Item>
            <Form.Item name="homeTeamShort" label={<span style={labelStyle}>Tên ngắn gọn</span>} style={{ marginBottom: 8 }}>
              <Input placeholder="MTV" style={inputStyle} />
            </Form.Item>
            <Form.Item name="homeLogo" label={<span style={labelStyle}>URL Logo</span>} style={{ marginBottom: 8 }}>
              <Input placeholder="https://..." style={inputStyle} />
            </Form.Item>
            <Form.Item name="homeColor" label={<span style={labelStyle}>Màu áo</span>} style={{ marginBottom: 8 }}>
              <ColorPicker showText />
            </Form.Item>
            <Form.Item name="homeTextColor" label={<span style={labelStyle}>Màu chữ</span>} style={{ marginBottom: 0 }}>
              <ColorPicker showText />
            </Form.Item>
          </div>
        </Col>
        <Col span={12}>
          <div style={teamCardStyle('#f5222d')}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f5222d', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              ✈️ Đội Khách
            </div>
            <Form.Item name="awayTeam" label={<span style={labelStyle}>Tên đầy đủ</span>} style={{ marginBottom: 8 }}>
              <Input placeholder="Hải Đăng Vivaco" style={inputStyle} />
            </Form.Item>
            <Form.Item name="awayTeamShort" label={<span style={labelStyle}>Tên ngắn gọn</span>} style={{ marginBottom: 8 }}>
              <Input placeholder="HĐV" style={inputStyle} />
            </Form.Item>
            <Form.Item name="awayLogo" label={<span style={labelStyle}>URL Logo</span>} style={{ marginBottom: 8 }}>
              <Input placeholder="https://..." style={inputStyle} />
            </Form.Item>
            <Form.Item name="awayColor" label={<span style={labelStyle}>Màu áo</span>} style={{ marginBottom: 8 }}>
              <ColorPicker showText />
            </Form.Item>
            <Form.Item name="awayTextColor" label={<span style={labelStyle}>Màu chữ</span>} style={{ marginBottom: 0 }}>
              <ColorPicker showText />
            </Form.Item>
          </div>
        </Col>
      </Row>

      <Form.Item style={{ marginTop: 14, marginBottom: 0, textAlign: 'right' }}>
        <Button type="primary" htmlType="submit" style={{ minWidth: 160 }}>
          💾 Lưu cập nhật
        </Button>
      </Form.Item>
    </Form>
  );
};

export default React.memo(MatchControl);
