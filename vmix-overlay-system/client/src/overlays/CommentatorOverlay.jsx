import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './commentatorOverlay.css';
const leagueLogoFallback = '/assets/logo_giai.png';
const micPng = '/assets/microphone.png';

const CommentatorOverlay = ({ zIndex, data, visible, tournamentLogo }) => {
  const containerRef = useRef(null);
  const bannerRef = useRef(null);
  const avatarRef = useRef(null);
  const micRef = useRef(null);
  const contentRef = useRef(null);
  const tl = useRef(null);

  const [localData, setLocalData] = useState(null);

  useEffect(() => {
    if (data && data.name !== localData?.name) {
      setLocalData(data);
    }
  }, [data, localData?.name]);

  useEffect(() => {
    if (!localData) {
      gsap.set(containerRef.current, { autoAlpha: 0 });
      return;
    }

    if (tl.current) tl.current.kill();
    tl.current = gsap.timeline();

    if (visible) {
      // In animation 
      gsap.set(containerRef.current, { autoAlpha: 1 });
      gsap.set(bannerRef.current, { x: -600, autoAlpha: 0 });
      gsap.set(contentRef.current, { x: -600, autoAlpha: 0 });
      gsap.set(avatarRef.current, { scale: 0, rotation: -180, autoAlpha: 0 });
      gsap.set(micRef.current, { y: 100, rotation: 45, autoAlpha: 0 });

      tl.current.to(avatarRef.current, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.5)" })
        .to([bannerRef.current, contentRef.current], { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.3")
        .to(micRef.current, { y: 0, rotation: 15, autoAlpha: 1, duration: 0.5, ease: "back.out(2)" }, "-=0.2");
    } else {
      // Out animation 
      tl.current.to(micRef.current, { y: 100, rotation: 45, autoAlpha: 0, duration: 0.3, ease: "power2.in" })
        .to([contentRef.current, bannerRef.current], { x: -600, autoAlpha: 0, duration: 0.4, ease: "power3.in" }, "-=0.1")
        .to(avatarRef.current, { scale: 0, rotation: 180, autoAlpha: 0, duration: 0.5, ease: "back.in(1.5)" }, "-=0.2")
        .set(containerRef.current, { autoAlpha: 0 });
    }

    return () => {
      if (tl.current) tl.current.kill();
    };
  }, [visible, localData]);

  const displayData = localData || {};
  const commentatorName = displayData.name || '';
  const avatarUrl = displayData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(commentatorName)}&background=random&color=fff&size=150`;
  const teamColor = '#1890ff';

  return (
    <div className="commentator-overlay-container" style={{ zIndex }} ref={containerRef}>
      
      {/* Cái Micro (Nằm sau khung Avatar giống vị trí Thẻ Vàng) */}
      <img 
        ref={micRef}
        src={micPng}
        className="commentator-mic-graphic" 
        alt="Mic"
      />

      {/* Dải băng màu chéo */}
      <div 
        ref={bannerRef}
        className="commentator-banner-wrapper"
        style={{ 
          background: `linear-gradient(90deg, #111 0%, ${teamColor} 100%)`,
          borderColor: teamColor
        }}
      >
        <div className="commentator-banner-bg"></div>
      </div>

      {/* Chữ trên dải băng */}
      <div ref={contentRef} className="commentator-content">
        <div className="commentator-title-text">
          BÌNH LUẬN VIÊN
        </div>
        <div className="commentator-player-name">
          {commentatorName}
        </div>
      </div>

      {/* Khung ảnh đại diện BLV (Tròn nổi bần bật trên cùng) */}
      <div 
        ref={avatarRef}
        className="commentator-avatar-wrapper"
        style={{ borderColor: teamColor }}
      >
        <div className="commentator-avatar-inner">
          <img 
            src={avatarUrl} 
            onError={(e) => { e.target.onerror = null; e.target.src = leagueLogoFallback; }}
            className="commentator-avatar-img" 
            alt={commentatorName}
          />
        </div>
      </div>

    </div>
  );
};

export default React.memo(CommentatorOverlay);
