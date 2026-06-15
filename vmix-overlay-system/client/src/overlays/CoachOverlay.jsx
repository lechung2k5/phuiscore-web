import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './coachOverlay.css';
const fallbackAvatar = `https://ui-avatars.com/api/?name=HLV&background=random&color=fff&size=150`;

const CoachOverlay = ({ zIndex, data, visible }) => {
  const containerRef = useRef(null);
  const bannerRef = useRef(null);
  const avatarRef = useRef(null);
  const contentRef = useRef(null);
  const tl = useRef(null);

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
      gsap.set(containerRef.current, { autoAlpha: 1 });
      gsap.set(bannerRef.current, { x: -600, autoAlpha: 0 });
      gsap.set(contentRef.current, { x: -600, autoAlpha: 0 });
      gsap.set(avatarRef.current, { scale: 0, rotation: -180, autoAlpha: 0 });

      tl.current.to(avatarRef.current, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.5)" })
        .to([bannerRef.current, contentRef.current], { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.3");
    } else {
      tl.current.to([contentRef.current, bannerRef.current], { x: -600, autoAlpha: 0, duration: 0.4, ease: "power3.in" })
        .to(avatarRef.current, { scale: 0, rotation: 180, autoAlpha: 0, duration: 0.5, ease: "back.in(1.5)" }, "-=0.2")
        .set(containerRef.current, { autoAlpha: 0 });
    }

    return () => {
      if (tl.current) tl.current.kill();
    };
  }, [visible, localData]);

  const displayData = localData || {};
  const teamColor = displayData.teamColor || '#1890ff';
  const textColor = displayData.textColor || '#ffffff';
  const coachName = displayData.coachName || 'HUẤN LUYỆN VIÊN';
  const teamLogo = displayData.teamLogo || fallbackAvatar;

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
    <div className="coach-overlay-container" style={{ zIndex, '--team-color': teamColor, '--text-color': textColor }} ref={containerRef}>
      
      <div 
        ref={bannerRef}
        className="coach-banner-wrapper"
        style={{ 
          background: `linear-gradient(90deg, #111 0%, ${teamColor} 100%)`,
        }}
      >
        <div className="coach-banner-bg"></div>
      </div>

      <div ref={contentRef} className="coach-content">
        <div className="coach-title-text" style={{ color: '#fff', textShadow: getShadow('#111', '#fff') }}>
          HUẤN LUYỆN VIÊN TRƯỞNG
        </div>
        <div className="coach-player-name" style={{ textShadow: getShadow(teamColor, textColor) }}>
          {coachName}
        </div>
      </div>

      <div 
        ref={avatarRef}
        className="coach-avatar-wrapper"
      >
        <div className="coach-avatar-inner">
          <img 
            src={teamLogo} 
            onError={(e) => { e.target.onerror = null; e.target.src = fallbackAvatar; }}
            className="coach-avatar-img" 
            alt="Logo"
          />
        </div>
      </div>

    </div>
  );
};

export default React.memo(CoachOverlay);
