import React, { useState } from 'react';
import { Row, Col, Modal } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import PitchLogoControl from './PitchLogoControl';

const LAYERS = [
  { key: 'scoreboardTop',   title: 'TỶ SỐ TRÊN',    icon: '📺', color: '#177ddc' },
  { key: 'scoreboardBottom',title: 'TỶ SỐ DƯỚI',    icon: '📊', color: '#177ddc' },
  { key: 'prematchBanner',  title: 'BANNER INTRO',   icon: '🎬', color: '#9c27b0' },
  { key: 'penaltyBoard',    title: 'LUÂN LƯU',       icon: '🥅', color: '#faad14' },
  { key: 'eventTicker',     title: 'TIN CHẠY',       icon: '📡', color: '#13c2c2' },
  { key: 'sponsorOverlay',  title: 'NHÀ TÀI TRỢ',   icon: '💼', color: '#eb2f96' },
  { key: 'mediaLogo',       title: 'LOGO ĐÀI',       icon: '📷', color: '#fa8c16' },
  { key: 'highlightOverlay',title: 'HIGHLIGHTS',     icon: '🔥', color: '#ff4500' },
  { key: 'pitchLogo',       title: 'LOGO SÂN 3D',    icon: '🎯', color: '#52c41a', hasSettings: true },
];

const LayerControl = ({ matchState, toggleLayer, horizontal, updateMatch }) => {
  const [settingsModal, setSettingsModal] = useState(null);

  // horizontal: render tất cả nút trong 1 hàng ngang (dùng trong thanh top)
  const colSpan = horizontal ? { xs: 12, sm: 6, md: 4, lg: 3 } : { span: 12 };

  return (
    <>
      <Row gutter={[8, 8]}>
        {LAYERS.map(item => {
          const isActive = matchState.layers[item.key]?.visible;
        return (
          <Col {...colSpan} key={item.key}>
            <div
              onClick={() => toggleLayer(item.key, !isActive)}
              title={item.title}
              style={{
                background: isActive ? `${item.color}22` : '#1c2128',
                color: isActive ? item.color : '#6e7681',
                border: `1.5px solid ${isActive ? item.color : '#30363d'}`,
                borderRadius: 6,
                height: horizontal ? 42 : 54,
                display: 'flex',
                flexDirection: horizontal ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: 0.5,
                cursor: 'pointer',
                boxShadow: isActive ? `0 0 8px ${item.color}55` : 'none',
                transition: 'all 0.15s ease',
                userSelect: 'none',
                textAlign: 'center',
                padding: '0 6px',
                whiteSpace: 'nowrap',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: horizontal ? 16 : 20 }}>{item.icon}</span>
              <span style={{ fontSize: 12, marginLeft: horizontal ? 5 : 0, fontWeight: 800 }}>{item.title}</span>

              {item.hasSettings && isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    padding: '2px',
                    borderRadius: 4,
                    color: item.color,
                    fontSize: 14,
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn sự kiện click của div bao ngoài
                    setSettingsModal(item.key);
                  }}
                >
                  <SettingOutlined />
                </div>
              )}
            </div>
          </Col>
        );
      })}
      </Row>

      <Modal
        title="Căn chỉnh Logo Sân 3D"
        open={settingsModal === 'pitchLogo'}
        onCancel={() => setSettingsModal(null)}
        footer={null}
        styles={{ body: { padding: '20px 0' } }}
      >
        <PitchLogoControl matchState={matchState} updateMatch={updateMatch} />
      </Modal>
    </>
  );
};

export default React.memo(LayerControl);
