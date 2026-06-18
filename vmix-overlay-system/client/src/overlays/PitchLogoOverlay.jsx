import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './PitchLogoOverlay.css';

const defaultLogo = '/assets/logo_giai.png';

const PitchLogoOverlay = ({ zIndex, visible, tournamentLogo, data }) => {
  const containerRef = useRef(null);
  const logoRef = useRef(null);

  // Mặc định lùi xuống 250px và scale 0.9 giống thông số CSS cũ
  const offsetX = data?.offsetX ?? 0;
  const offsetY = data?.offsetY ?? 250; 
  const scale = data?.scale ?? 0.9;

  useEffect(() => {
    if (visible) {
      gsap.to(containerRef.current, { autoAlpha: 1, duration: 1, ease: 'power2.inOut' });
      // Thêm một chút hiệu ứng "thở" cho logo hoặc xuất hiện từ dưới lên
      gsap.fromTo(logoRef.current, 
        { scale: 0.9, opacity: 0 }, 
        { scale: 1, opacity: 0.85, duration: 1.5, ease: 'power3.out' }
      );
    } else {
      gsap.to(containerRef.current, { autoAlpha: 0, duration: 1, ease: 'power2.inOut' });
    }
  }, [visible]);

  return (
    <div 
      ref={containerRef} 
      className="pitch-logo-container" 
      style={{ zIndex, visibility: 'hidden' }}
    >
      <div 
        className="pitch-logo-inner"
        style={{
          transform: `perspective(1000px) rotateX(75deg) scale(${scale})`,
          marginLeft: `${offsetX}px`,
          marginTop: `${offsetY}px`
        }}
      >
        <img 
          ref={logoRef}
          src={tournamentLogo || defaultLogo} 
          className="pitch-logo-img" 
          alt="Tournament Logo 3D" 
        />
        
        {/* Lớp mặt nạ hình logo để chứa vệt sáng */}
        <div 
          className="pitch-logo-mask" 
          style={{
            maskImage: `url(${tournamentLogo || defaultLogo})`,
            WebkitMaskImage: `url(${tournamentLogo || defaultLogo})`
          }}
        >
          <div className="pitch-logo-shine" />
        </div>
      </div>
    </div>
  );
};

export default React.memo(PitchLogoOverlay);
