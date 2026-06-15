import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './goalPopup.css';

const AutoFitText = ({ text }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;
    textRef.current.style.fontSize = '32px';
    const containerWidth = containerRef.current.clientWidth;
    const textWidth = textRef.current.scrollWidth;
    if (textWidth > containerWidth) {
      const scale = containerWidth / textWidth;
      const newSize = Math.max(16, Math.floor(32 * scale));
      textRef.current.style.fontSize = `${newSize}px`;
    }
  }, [text]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden' }}>
      <span ref={textRef} style={{ whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  );
};

const GoalPopup = ({ zIndex, data, match, visible }) => {
  const containerRef = useRef(null);
  const avatarBoxRef = useRef(null);
  const topRowRef = useRef(null);
  const bottomRowRef = useRef(null);
  const tl = useRef(null);

  // Lưu data vào localData để giữ lại khi visible=false (data có thể bị null)
  const [localData, setLocalData] = useState(null);

  // Chỉ cập nhật localData khi có SỰ KIỆN MỚI (id khác)
  // Nếu chỉ so sánh object reference thì mỗi giây timer tick sẽ tạo object mới và trigger lại animation!
  useEffect(() => {
    if (data && data.id !== localData?.id) {
      setLocalData(data);
    }
  }, [data, localData?.id]);

  useEffect(() => {
    const container = containerRef.current;
    const avatarBox = avatarBoxRef.current;
    const topRow = topRowRef.current;
    const bottomRow = bottomRowRef.current;
    if (!container) return;

    if (tl.current) tl.current.kill();

    if (!localData) {
      // Chưa có data lần nào, ẩn lặng lẽ
      gsap.set(container, { autoAlpha: 0 });
      return;
    }

    tl.current = gsap.timeline();

    if (visible) {
      // Reset về trạng thái sẵn sàng
      gsap.set(container, { autoAlpha: 1 });
      gsap.set(avatarBox, { scale: 0, rotation: -90, autoAlpha: 0 });
      gsap.set(topRow, { x: -600, autoAlpha: 0 });
      gsap.set(bottomRow, { x: -600, autoAlpha: 0 });

      tl.current
        .to(avatarBox, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.5)" })
        .to(topRow, { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.2")
        .to(bottomRow, { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.3");
    } else {
      // Out animation
      tl.current
        .to(bottomRow, { x: -600, autoAlpha: 0, duration: 0.4, ease: "power3.in" })
        .to(topRow, { x: -600, autoAlpha: 0, duration: 0.4, ease: "power3.in" }, "-=0.2")
        .to(avatarBox, { scale: 0, rotation: 90, autoAlpha: 0, duration: 0.5, ease: "back.in(1.5)" }, "-=0.2")
        .set(container, { autoAlpha: 0 });
    }

    return () => {
      if (tl.current) tl.current.kill();
    };
  }, [visible, localData]);

  // Lấy data để hiển thị (dùng localData để giữ nội dung khi đang out)
  const displayData = localData || {};
  const isHome = displayData.team === 'home';
  const teamColor = match ? (isHome ? match.teamA?.color : match.teamB?.color) : '#00ff88';
  const textColor = match ? (isHome ? match.teamA?.textColor : match.teamB?.textColor) : '#ffffff';
  const teamLogo = match ? (isHome ? match.teamA?.logo : match.teamB?.logo) : '';
  const playerName = displayData.playerName || '';
  const playerAvatar = displayData.playerAvatar || '';
  const minute = displayData.minute || '';
  const displayName = playerName;

  const getLuma = (hex) => {
    if (!hex) return 0;
    const c = hex.replace('#', '');
    const rgb = parseInt(c.length === 3 ? c[0]+c[0]+c[1]+c[1]+c[2]+c[2] : c, 16);
    return 0.2126 * ((rgb >> 16) & 0xff) + 0.7152 * ((rgb >> 8) & 0xff) + 0.0722 * (rgb & 0xff);
  };
  const isDark = (hex) => getLuma(hex) < 128;
  const getShadow = (bgColor, txtColor) => {
    if (isDark(txtColor)) return isDark(bgColor) ? '0 0 4px rgba(255,255,255,0.8)' : `1px 0 0 ${txtColor}, -1px 0 0 ${txtColor}, 0 1px 0 ${txtColor}, 0 -1px 0 ${txtColor}`;
    return '0 2px 4px rgba(0,0,0,0.8)';
  };

  // LUÔN render DOM (không return null) - để GSAP có ref để điều khiển
  return (
    <div className="goal-popup-container" style={{ zIndex }} ref={containerRef}>
      
      {/* Khối Ảnh Đại Diện (Trái) */}
      <div ref={avatarBoxRef} className="goal-avatar-box" style={{ borderColor: teamColor || '#00ff88' }}>
        <img 
          src={playerAvatar || teamLogo} 
          onError={(e) => { e.target.onerror = null; e.target.src = teamLogo; }}
          className="goal-avatar-img" 
          alt={playerName}
        />
      </div>

      {/* Khối Thông tin (Phải) */}
      <div className="goal-info-box">
        
        {/* Dòng trên: Chữ GOALLL */}
        <div ref={topRowRef} className="goal-row top-row" style={{ borderColor: teamColor || '#00ff88' }}>
          <div className="goal-title">GOALLL!!!</div>
        </div>

        {/* Dòng dưới: Tên cầu thủ + Phút */}
        <div ref={bottomRowRef} className="goal-row bottom-row" style={{ background: teamColor || '#00aa55', borderColor: teamColor || '#00ff88', color: textColor || '#ffffff' }}>
          <div className="goal-player-name" style={{ textShadow: getShadow(teamColor || '#00aa55', textColor || '#ffffff') }}>
            <AutoFitText text={displayName} />
          </div>
          {minute && (
            <div className="goal-minute" style={{ color: textColor || '#ffffff', textShadow: getShadow(teamColor || '#00aa55', textColor || '#ffffff') }}>{minute}</div>
          )}
        </div>

      </div>

    </div>
  );
};

export default React.memo(GoalPopup);
