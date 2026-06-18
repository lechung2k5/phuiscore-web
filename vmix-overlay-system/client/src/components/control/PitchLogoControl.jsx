import React from 'react';
import { Slider, Typography, Row, Col, Card } from 'antd';

const { Text } = Typography;

const PitchLogoControl = ({ matchState, updateMatch }) => {
  const pitchLayer = matchState.layers?.pitchLogo || {};

  const offsetX = pitchLayer.data?.offsetX ?? 0;
  const offsetY = pitchLayer.data?.offsetY ?? 250;
  const scale = pitchLayer.data?.scale ?? 0.9;

  const handleChange = (key, value) => {
    updateMatch({
      layers: {
        pitchLogo: {
          data: {
            ...pitchLayer.data,
            [key]: value
          }
        }
      }
    });
  };

  return (
    <div style={{ padding: '0 16px' }}>
      <Row gutter={[16, 16]} align="middle">
        <Col span={24}>
          <Text style={{ color: '#8b949e', fontSize: 14 }}>Ngang (X): {offsetX}px</Text>
          <Slider min={-1000} max={1000} value={offsetX} onChange={(v) => handleChange('offsetX', v)} />
        </Col>
        <Col span={24}>
          <Text style={{ color: '#8b949e', fontSize: 14 }}>Dọc (Y): {offsetY}px</Text>
          <Slider min={-1000} max={1000} value={offsetY} onChange={(v) => handleChange('offsetY', v)} />
        </Col>
        <Col span={24}>
          <Text style={{ color: '#8b949e', fontSize: 14 }}>Scale: {scale}</Text>
          <Slider min={0.1} max={3} step={0.1} value={scale} onChange={(v) => handleChange('scale', v)} />
        </Col>
      </Row>
    </div>
  );
};

export default PitchLogoControl;
