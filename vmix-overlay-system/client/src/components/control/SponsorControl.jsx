import React, { useState, useEffect } from 'react';
import { Card, Typography, Upload, Button, message, List, Space } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';

const SERVER_URL = 'http://localhost:4000';

const SponsorControl = ({ matchState, updateMatch }) => {
  const [sponsors, setSponsors] = useState([]);

  // Khởi tạo từ state
  useEffect(() => {
    if (matchState?.layers?.sponsorOverlay?.data) {
      setSponsors(matchState.layers.sponsorOverlay.data);
    }
  }, [matchState?.layers?.sponsorOverlay?.data]);

  const handleUpdate = (newList) => {
    setSponsors(newList);
    updateMatch({
      layers: {
        sponsorOverlay: {
          visible: matchState?.layers?.sponsorOverlay?.visible,
          data: newList
        }
      }
    });
  };

  const uploadProps = {
    name: 'logo',
    action: `${SERVER_URL}/api/upload/sponsor`,
    accept: 'image/*',
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'done') {
        const url = `${SERVER_URL}${info.file.response.url}`;
        message.success(`${info.file.name} tải lên thành công`);
        handleUpdate([...sponsors, url]);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} tải lên thất bại.`);
      }
    },
  };

  const removeSponsor = (indexToRemove) => {
    const newList = sponsors.filter((_, index) => index !== indexToRemove);
    handleUpdate(newList);
  };

  return (
    <Card bordered={false} bodyStyle={{ padding: '16px' }} style={{ background: '#161b22', borderColor: '#30363d' }}>
      <Typography.Title level={5} style={{ color: '#e6edf3', marginBottom: 16 }}>Nhà Tài Trợ</Typography.Title>
      
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />} type="primary" block style={{ marginBottom: 16 }}>
          Thêm Logo (PNG không nền)
        </Button>
      </Upload>

      <List
        size="small"
        dataSource={sponsors}
        renderItem={(item, index) => (
          <List.Item
            actions={[
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeSponsor(index)} />
            ]}
            style={{ borderBottom: '1px solid #30363d' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: '#0d1117', borderRadius: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src={item} alt="sponsor" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ color: '#8b949e', fontSize: 12 }}>Logo {index + 1}</span>
            </div>
          </List.Item>
        )}
        locale={{ emptyText: 'Chưa có logo nào. Sẽ load 3 logo mặc định.' }}
      />
    </Card>
  );
};

export default React.memo(SponsorControl);
