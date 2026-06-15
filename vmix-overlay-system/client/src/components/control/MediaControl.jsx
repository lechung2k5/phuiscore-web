import React, { useState, useEffect } from 'react';
import { Card, Typography, Upload, Button, message, List, Space, Divider } from 'antd';
import { UploadOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';

const SERVER_URL = 'http://localhost:4000';

const MediaControl = ({ matchState, updateMatch }) => {
  const [tournamentLogo, setTournamentLogo] = useState('');
  const [mediaLogos, setMediaLogos] = useState([]);

  // Khởi tạo từ state
  useEffect(() => {
    if (matchState?.layers?.mediaLogo) {
      setTournamentLogo(matchState.layers.mediaLogo.tournamentLogo || '');
      setMediaLogos(matchState.layers.mediaLogo.data || []);
    }
  }, [matchState?.layers?.mediaLogo]);

  const handleUpdate = (newTournamentLogo, newMediaLogos) => {
    setTournamentLogo(newTournamentLogo);
    setMediaLogos(newMediaLogos);
    updateMatch({
      layers: {
        mediaLogo: {
          visible: matchState?.layers?.mediaLogo?.visible,
          tournamentLogo: newTournamentLogo,
          data: newMediaLogos
        }
      }
    });
  };

  const uploadTournamentProps = {
    name: 'logo_media',
    action: `${SERVER_URL}/api/upload/media`,
    accept: 'image/*',
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'done') {
        const url = `${SERVER_URL}${info.file.response.url}`;
        message.success(`Tải lên logo giải đấu thành công`);
        handleUpdate(url, mediaLogos);
      } else if (info.file.status === 'error') {
        message.error(`Tải lên thất bại.`);
      }
    },
  };

  const uploadMediaProps = {
    name: 'logo_media',
    action: `${SERVER_URL}/api/upload/media`,
    accept: 'image/*',
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'done') {
        const url = `${SERVER_URL}${info.file.response.url}`;
        message.success(`Tải lên logo đài thành công`);
        handleUpdate(tournamentLogo, [...mediaLogos, url]);
      } else if (info.file.status === 'error') {
        message.error(`Tải lên thất bại.`);
      }
    },
  };

  const removeMediaLogo = (indexToRemove) => {
    const newList = mediaLogos.filter((_, index) => index !== indexToRemove);
    handleUpdate(tournamentLogo, newList);
  };

  const removeTournamentLogo = () => {
    handleUpdate('', mediaLogos);
  };

  return (
    <Card variant="borderless" styles={{ body: { padding: '16px' } }} style={{ background: '#161b22', borderColor: '#30363d' }}>
      <Typography.Title level={5} style={{ color: '#e6edf3', marginBottom: 16 }}>Logo Đài Phát (Góc trên trái)</Typography.Title>
      
      {/* Cài đặt Logo Giải đấu */}
      <div style={{ marginBottom: 20 }}>
        <Typography.Text style={{ color: '#8b949e', display: 'block', marginBottom: 8, fontSize: 12 }}>
          LOGO GIẢI ĐẤU (Luôn hiển thị)
        </Typography.Text>
        {tournamentLogo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px', background: '#0d1117', borderRadius: 6, border: '1px solid #30363d' }}>
            <div style={{ width: 60, height: 60, background: '#161b22', borderRadius: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src={tournamentLogo} alt="tournament" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <Button type="text" danger icon={<DeleteOutlined />} onClick={removeTournamentLogo}>Xóa Logo Giải</Button>
          </div>
        ) : (
          <Upload {...uploadTournamentProps}>
            <Button icon={<PictureOutlined />} style={{ background: '#238636', color: 'white', border: 'none' }}>
              Upload Logo Giải Đấu
            </Button>
          </Upload>
        )}
      </div>

      <Divider style={{ borderColor: '#30363d', margin: '16px 0' }} />

      {/* Cài đặt Logo Truyền thông */}
      <div>
        <Typography.Text style={{ color: '#8b949e', display: 'block', marginBottom: 8, fontSize: 12 }}>
          LOGO ĐƠN VỊ TRUYỀN THÔNG (Chạy vòng lặp)
        </Typography.Text>
        <Upload {...uploadMediaProps}>
          <Button icon={<UploadOutlined />} type="primary" block style={{ marginBottom: 16 }}>
            Thêm Logo Truyền Thông
          </Button>
        </Upload>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.isArray(mediaLogos) && mediaLogos.length > 0 ? (
            mediaLogos.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #30363d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: '#0d1117', borderRadius: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img src={item} alt="media" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <span style={{ color: '#8b949e', fontSize: 12 }}>Logo {index + 1}</span>
                </div>
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeMediaLogo(index)} />
              </div>
            ))
          ) : (
            <div style={{ color: '#8b949e', textAlign: 'center', padding: '16px 0', fontSize: 12 }}>
              Chưa có logo nào. Sẽ load các logo đài mặc định.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default React.memo(MediaControl);
