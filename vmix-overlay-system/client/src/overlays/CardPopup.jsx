import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './cardPopup.css';

const CardPopup = ({ zIndex, data, match, visible }) => {
  const containerRef = useRef(null);
  const bannerRef = useRef(null);
  const avatarRef = useRef(null);
  const cardRef = useRef(null);
  const contentRef = useRef(null);
  const tl = useRef(null);

  // Lưu lại data nội bộ để khi tắt, popup vẫn có data render trong lúc chạy animation Out
  const [localData, setLocalData] = useState(null);

  useEffect(() => {
    if (data && data.id !== localData?.id) {
      setLocalData(data);
    }
  }, [data, localData?.id]);

  useEffect(() => {
    if (!localData) {
      gsap.set(containerRef.current, { autoAlpha: 0 });
      return;
    }

    if (tl.current) tl.current.kill();
    tl.current = gsap.timeline();

    if (visible) {
      // In animation (Xịn hơn)
      gsap.set(containerRef.current, { autoAlpha: 1 });
      gsap.set(bannerRef.current, { x: -600, autoAlpha: 0 });
      gsap.set(contentRef.current, { x: -600, autoAlpha: 0 });
      gsap.set(avatarRef.current, { scale: 0, rotation: -180, autoAlpha: 0 });
      gsap.set(cardRef.current, { y: 100, rotation: 45, autoAlpha: 0 });

      tl.current.to(avatarRef.current, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.5)" })
        .to([bannerRef.current, contentRef.current], { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.3")
        .to(cardRef.current, { y: 0, rotation: 15, autoAlpha: 1, duration: 0.5, ease: "back.out(2)" }, "-=0.2");
    } else {
      // Out animation (Trơn tru)
      tl.current.to(cardRef.current, { y: 100, rotation: 45, autoAlpha: 0, duration: 0.3, ease: "power2.in" })
        .to([contentRef.current, bannerRef.current], { x: -600, autoAlpha: 0, duration: 0.4, ease: "power3.in" }, "-=0.1")
        .to(avatarRef.current, { scale: 0, rotation: 180, autoAlpha: 0, duration: 0.5, ease: "back.in(1.5)" }, "-=0.2")
        .set(containerRef.current, { autoAlpha: 0 });
    }

    return () => {
      if (tl.current) tl.current.kill();
    };
  }, [visible, localData]);

  if (!localData || !match) return null;

  const isRedCard = localData.type === 'red_card';
  const teamColor = localData.team === 'home' ? match.teamA.color : match.teamB.color;
  const textColor = localData.team === 'home' ? match.teamA.textColor : match.teamB.textColor;
  const teamLogo = localData.team === 'home' ? match.teamA.logo : match.teamB.logo;
  
  const titleText = isRedCard ? 'THẺ ĐỎ' : 'THẺ VÀNG';
  const playerName = localData.playerName || '';
  const playerAvatar = localData.playerAvatar || '';

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

  return (
    <div className="card-popup-container" style={{ zIndex }} ref={containerRef}>
      
      {/* Thẻ Vàng / Thẻ Đỏ (Nằm sau khung Avatar) được vẽ bằng CSS */}
      <div 
        ref={cardRef}
        className={`card-popup-graphic ${isRedCard ? 'red-card' : ''}`} 
      ></div>

      {/* Dải băng màu chéo */}
      <div 
        ref={bannerRef}
        className="card-popup-banner-wrapper"
        style={{ 
          background: `linear-gradient(90deg, #111 0%, ${teamColor} 100%)`,
          borderColor: teamColor
        }}
      >
        <div className="card-popup-banner-bg"></div>
      </div>

      {/* Chữ trên dải băng */}
      <div ref={contentRef} className="card-popup-content">
        <div className={`card-popup-title ${isRedCard ? 'red-title' : ''}`}>
          {titleText}
        </div>
        <div className="card-popup-player" style={{ color: textColor || '#ffffff', textShadow: getShadow(teamColor, textColor || '#ffffff') }}>
          {playerName}
        </div>
      </div>

      {/* Khung ảnh đại diện (Nổi bần bật trên cùng) */}
      <div 
        ref={avatarRef}
        className="card-popup-avatar-wrapper"
        style={{ borderColor: teamColor }}
      >
        <div className="card-popup-avatar">
          <img 
            src={playerAvatar || teamLogo} 
            onError={(e) => { e.target.onerror = null; e.target.src = teamLogo; }}
            className="card-avatar-img" 
            alt={playerName}
          />
        </div>
      </div>

    </div>
  );
};

export default React.memo(CardPopup);
