import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import './lineupOverlay.css';

const LineupOverlay = ({ visible, data, zIndex, tournamentLogo }) => {
  const containerRef = useRef(null);
  const tl = useRef(null);
  
  const [localData, setLocalData] = useState(null);

  // Keep local copy so it can animate out smoothly when visible becomes false
  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  // Primitive dependencies to prevent loop glitches
  const teamName = localData?.teamName;

  useEffect(() => {
    if (!containerRef.current) return;

    if (!localData) {
      gsap.set(containerRef.current, { scale: 0.8, autoAlpha: 0 });
      return;
    }

    if (tl.current) tl.current.kill();
    tl.current = gsap.timeline();
    const q = gsap.utils.selector(containerRef);

    if (visible) {
      // Thiết lập vị trí ban đầu ẩn
      gsap.set(containerRef.current, { scale: 0.8, autoAlpha: 1 });
      gsap.set(q('.lineup-header'), { y: -50, autoAlpha: 0 });
      gsap.set(q('.lineup-starting-col'), { x: -50, autoAlpha: 0 });
      gsap.set(q('.lineup-subs-col'), { x: 50, autoAlpha: 0 });
      gsap.set(q('.lineup-player-row'), { x: -100, autoAlpha: 0 });
      gsap.set(q('.lineup-sub-item'), { scale: 0.5, autoAlpha: 0 });

      // IN Animation
      tl.current.to(containerRef.current, { scale: 1, duration: 0.7, ease: "back.out(1.2)" })
        .to(q('.lineup-header'), { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.3")
        .to(q('.lineup-starting-col'), { x: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out" }, "-=0.3")
        .to(q('.lineup-subs-col'), { x: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out" }, "-=0.4")
        .to(q('.lineup-player-row'), { 
          x: 0, 
          autoAlpha: 1, 
          duration: 0.4, 
          stagger: 0.08, 
          ease: "back.out(1.1)" 
        }, "-=0.2")
        .to(q('.lineup-sub-item'), { 
          scale: 1, 
          autoAlpha: 1, 
          duration: 0.3, 
          stagger: 0.04, 
          ease: "back.out(1.5)" 
        }, "-=0.5");
        
    } else {
      // OUT Animation
      tl.current.to(q('.lineup-sub-item'), { scale: 0.5, autoAlpha: 0, duration: 0.2, stagger: -0.02, ease: "power3.in" })
        .to(q('.lineup-player-row'), { x: -100, autoAlpha: 0, duration: 0.2, stagger: -0.04, ease: "power3.in" }, "-=0.1")
        .to(q('.lineup-subs-col'), { x: 50, autoAlpha: 0, duration: 0.3, ease: "power3.in" }, "-=0.2")
        .to(q('.lineup-starting-col'), { x: -50, autoAlpha: 0, duration: 0.3, ease: "power3.in" }, "-=0.3")
        .to(q('.lineup-header'), { y: -50, autoAlpha: 0, duration: 0.3, ease: "power3.in" }, "-=0.2")
        .to(containerRef.current, { scale: 0.8, autoAlpha: 0, duration: 0.4, ease: "power3.in" }, "-=0.1");
    }

    return () => {
      if (tl.current) tl.current.kill();
    };
  }, [visible, teamName, localData]);

  // Render container with hidden state by default
  return (
    <div 
      className="lineup-overlay-container" 
      ref={containerRef} 
      style={{ 
        '--team-color': localData?.teamColor || '#1a4299',
        zIndex: zIndex || 70,
        opacity: 0,
        transform: 'scale(0.8)'
      }}
    >
      
      {/* ---------------- HEADER ---------------- */}
      <div className="lineup-header">
        <div className="lineup-header-left">
          {tournamentLogo && <img src={tournamentLogo} alt="Giải đấu" className="lineup-tournament-logo" />}
        </div>
        
        <div className="lineup-title-wrapper-center">
          <div className="lineup-title">Đội Hình Ra Sân</div>
          <div className="lineup-team-name">{localData?.teamName || "N/A"}</div>
        </div>

        <div className="lineup-header-right">
          {localData?.teamLogo && <img src={localData.teamLogo} alt="Logo Đội" className="lineup-team-logo" />}
        </div>
      </div>

      {/* ---------------- BODY ---------------- */}
      <div className="lineup-body">
        
        {/* CỘT TRÁI: ĐÁ CHÍNH */}
        <div className="lineup-starting-col">
          {localData?.startingXI && localData.startingXI.map((player, index) => (
            <div className="lineup-player-row" key={`starter-${index}`}>
              <div className="lineup-player-name">
                {player.name}
                <span className="lineup-tags">
                  {player.isCaptain && <span className="lineup-tag tag-c">C</span>}
                  {player.isGK && <span className="lineup-tag tag-gk">GK</span>}
                </span>
              </div>
              <div className="lineup-player-avatar">
                <img 
                  src={player.avatar || localData?.teamLogo} 
                  onError={(e) => { e.target.onerror = null; e.target.src = localData?.teamLogo; }}
                  className="lineup-player-img" 
                  alt={player.name}
                />
              </div>
            </div>
          ))}
        </div>

        {/* CỘT PHẢI: HLV & DỰ BỊ */}
        <div className="lineup-subs-col">
          
          <div className="lineup-coach-wrapper">
            <div className="lineup-coach-label">HLV Trưởng:</div>
            <div className="lineup-coach-name">{localData?.coach || "N/A"}</div>
          </div>

          <div className="lineup-subs-title">Danh Sách Dự Bị</div>
          <div className="lineup-subs-grid">
            {localData?.substitutes && localData.substitutes.map((sub, idx) => (
              <div className="lineup-sub-item" key={`sub-${idx}`}>
                <div className="lineup-sub-name">
                  {sub.name}
                  <span className="lineup-tags sub">
                    {sub.isCaptain && <span className="lineup-tag tag-c">C</span>}
                    {sub.isGK && <span className="lineup-tag tag-gk">GK</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
        </div>

      </div>

    </div>
  );
};

export default React.memo(LineupOverlay);
