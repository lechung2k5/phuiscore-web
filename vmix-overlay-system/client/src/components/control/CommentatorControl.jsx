import React, { useState } from 'react';
import { Card, Button, Input, Select, Space, Typography, Row, Col } from 'antd';
import { AudioOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const DEFAULT_COMMENTATORS = [
  { value: 'MINH NHẬT', label: 'MINH NHẬT' },
  { value: 'LÊ CHUNG', label: 'LÊ CHUNG' },
  { value: 'BẢO LALIGA', label: 'BẢO LALIGA' }
];

const CommentatorControl = ({ matchState, updateMatch }) => {
  const [selectedName, setSelectedName] = useState('MINH NHẬT');
  const [customName, setCustomName] = useState('');

  const isVisible = matchState?.layers?.commentatorOverlay?.visible || false;

  const toggleOverlay = (show) => {
    const finalName = customName.trim() || selectedName;
    updateMatch({
      layers: {
        commentatorOverlay: {
          visible: show,
          data: { name: finalName }
        }
      }
    });
  };

  return (
    <Card variant="borderless" styles={{ body: { padding: '0px' } }} style={{ background: 'transparent', border: 'none' }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24}>
          <Space.Compact style={{ width: '100%' }}>
            <Select
              style={{ width: '40%' }}
              value={selectedName}
              onChange={setSelectedName}
              options={DEFAULT_COMMENTATORS}
            />
            <Input
              style={{ width: '35%' }}
              placeholder="Hoặc nhập tên..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              allowClear
            />
            <Button
              type={isVisible ? "primary" : "default"}
              danger={isVisible}
              icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              style={{ width: '25%' }}
              onClick={() => toggleOverlay(!isVisible)}
            >
              {isVisible ? 'ẨN BLV' : 'HIỆN BLV'}
            </Button>
          </Space.Compact>
        </Col>
      </Row>
    </Card>
  );
};

export default CommentatorControl;
