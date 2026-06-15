import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './substitutionOverlay.css';

const defaultLogo = 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png';

const AutoFitText = ({ text }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;
    
    // Đặt lại cỡ chữ mặc định để tính toán
    textRef.current.style.fontSize = '28px';
    
    const containerWidth = containerRef.current.clientWidth;
    const textWidth = textRef.current.scrollWidth;

    if (textWidth > containerWidth) {
      const scale = containerWidth / textWidth;
      const newSize = Math.max(14, Math.floor(28 * scale)); // Tối thiểu 14px
      textRef.current.style.fontSize = `${newSize}px`;
    }
  }, [text]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' }}>
      <span ref={textRef} style={{ whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  );
};

const SubstitutionOverlay = ({ zIndex, data, match, visible }) => {
  const containerRef = useRef(null);
  const logoBoxRef = useRef(null);
  const rowOutRef = useRef(null);
  const rowInRef = useRef(null);
  const tl = useRef(null);

  const [localData, setLocalData] = useState(null);

  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const inName = localData?.playerInName;
  const outName = localData?.playerOutName;

  useEffect(() => {
    if (!localData) {
      gsap.set(containerRef.current, { autoAlpha: 0 });
      return;
    }

    if (tl.current) tl.current.kill();
    tl.current = gsap.timeline();

    if (visible) {
      // Đặt vị trí ban đầu ẩn ngoài lề trái
      gsap.set(containerRef.current, { autoAlpha: 1 });
      gsap.set(logoBoxRef.current, { x: -300, autoAlpha: 0 });
      gsap.set(rowOutRef.current, { x: -600, autoAlpha: 0 });
      gsap.set(rowInRef.current, { x: -600, autoAlpha: 0 });

      // In Animation
      tl.current.to(logoBoxRef.current, { x: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.2)" })
        .to(rowOutRef.current, { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.3")
        .to(rowInRef.current, { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.3");
    } else {
      // Out Animation
      tl.current.to(rowInRef.current, { x: -600, autoAlpha: 0, duration: 0.4, ease: "power3.in" })
        .to(rowOutRef.current, { x: -600, autoAlpha: 0, duration: 0.4, ease: "power3.in" }, "-=0.2")
        .to(logoBoxRef.current, { x: -300, autoAlpha: 0, duration: 0.5, ease: "back.in(1.2)" }, "-=0.2")
        .set(containerRef.current, { autoAlpha: 0 });
    }

    return () => {
      if (tl.current) tl.current.kill();
    };
  }, [visible, inName, outName]);

  if (!localData || !match) return null;

  const isHome = localData.team === 'home';
  const teamColor = localData.team === 'home' ? match?.teamA?.color : match?.teamB?.color;
  const textColor = localData.team === 'home' ? match?.teamA?.textColor : match?.teamB?.textColor;
  
  const getLogo = (logoUrl) => {
    if (!logoUrl || logoUrl.trim() === '' || logoUrl === 'undefined' || logoUrl === 'null') {
      return defaultLogo;
    }
    return logoUrl;
  };
  const teamLogo = getLogo(isHome ? match.teamA.logo : match.teamB.logo);

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
    <div className="sub-overlay-container" style={{ zIndex }} ref={containerRef}>
      
      {/* Khối Logo Bên Trái */}
      <div 
        ref={logoBoxRef}
        className="sub-logo-box"
        style={{ 
          background: `linear-gradient(135deg, #111 0%, ${teamColor} 100%)`,
          borderColor: teamColor
        }}
      >
        <img src={teamLogo} alt="Team Logo" className="sub-logo-img" />
      </div>

      {/* Khối 2 dòng OUT / IN Bên Phải */}
      <div className="sub-players-box">
        
        {/* Row OUT (Đỏ) */}
        <div ref={rowOutRef} className="sub-row out-row" style={{ borderColor: teamColor }}>
          <div className="sub-label out">OUT ▼</div>
          <div className="sub-player-name" style={{ color: textColor || '#ffffff', textShadow: getShadow(teamColor, textColor || '#ffffff') }}>
            <AutoFitText text={localData.playerOutName} />
          </div>
          <div className="sub-avatar-box" style={{ borderLeftColor: teamColor }}>
            <img 
              src={localData.playerOutAvatar || teamLogo} 
              onError={(e) => { e.target.onerror = null; e.target.src = teamLogo; }}
              className="sub-avatar-img" 
              alt="OUT" 
            />
          </div>
        </div>

        {/* Row IN (Xanh) */}
        <div ref={rowInRef} className="sub-row in-row" style={{ borderColor: teamColor }}>
          <div className="sub-label in">IN ▲</div>
          <div className="sub-player-name" style={{ color: textColor || '#ffffff', textShadow: getShadow(teamColor, textColor || '#ffffff') }}>
            <AutoFitText text={localData.playerInName} />
          </div>
          <div className="sub-avatar-box" style={{ borderLeftColor: teamColor }}>
            <img 
              src={localData.playerInAvatar || teamLogo} 
              onError={(e) => { e.target.onerror = null; e.target.src = teamLogo; }}
              className="sub-avatar-img" 
              alt="IN" 
            />
          </div>
        </div>

      </div>

    </div>
  );
};

export default React.memo(SubstitutionOverlay);
