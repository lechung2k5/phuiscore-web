import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './scoreboardBottom.css';

// Assets imported from src/assets
import khungTrai from '../assets/bts_duoi/khung_trai.png';
import khungGiua from '../assets/bts_duoi/khung_giua.png';
import khungPhai from '../assets/bts_duoi/khung_phai.png';
import defaultLogo from '../assets/logo_giai.png';

function formatClock(timeStr) {
  return timeStr || "00:00";
}

const ScoreboardBottom = ({ zIndex, visible, match }) => {
  const rootRef = useRef(null);
  const hasAnimatedIn = useRef(false);
  const introTl = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const q = gsap.utils.selector(rootRef);

    const centerBox = q('.sb-center');
    const leftBg = q('.sb-left');
    const rightBg = q('.sb-right');
    const textAndLogos = q('.sb-score-container, .sb-time');
    const homeLabel = q('.sb-left-text, .sb-left-logo');
    const awayLabel = q('.sb-right-text, .sb-right-logo');
    const goalsList = q('.sb-goals-list-container');

    if (visible && !hasAnimatedIn.current) {
      if (introTl.current) introTl.current.kill();
      introTl.current = gsap.timeline();

      gsap.set(rootRef.current, { autoAlpha: 1, y: 0, xPercent: -50, x: 0 });
      gsap.set(centerBox, { scale: 0, autoAlpha: 0 });
      gsap.set(leftBg, { x: 200, autoAlpha: 0 });
      gsap.set(rightBg, { x: -200, autoAlpha: 0 });
      gsap.set(textAndLogos, { autoAlpha: 0 });
      gsap.set(homeLabel, { x: -50, autoAlpha: 0 });
      gsap.set(awayLabel, { x: 50, autoAlpha: 0 });
      if (goalsList.length) gsap.set(goalsList, { xPercent: -50, y: 50, autoAlpha: 0 });

      introTl.current
        .to(centerBox, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "back.out(1.2)" })
        .to(leftBg, { x: 0, autoAlpha: 1, duration: 0.25, ease: "power3.out" }, "-=0.15")
        .to(rightBg, { x: 0, autoAlpha: 1, duration: 0.25, ease: "power3.out" }, "-=0.25")
        .to([textAndLogos, homeLabel, awayLabel], { autoAlpha: 1, duration: 0.25, ease: "power2.out" }, "<")
        .to(homeLabel, { x: 0, duration: 0.3, ease: "back.out(1.5)" }, "<")
        .to(awayLabel, { x: 0, duration: 0.3, ease: "back.out(1.5)" }, "<");

      if (goalsList.length) {
        introTl.current.to(goalsList, { y: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out" }, "-=0.1");
      }

      hasAnimatedIn.current = true;
    } else if (!visible && hasAnimatedIn.current) {
      if (introTl.current) introTl.current.kill();
      introTl.current = gsap.timeline({
        onComplete: () => {
          gsap.set(rootRef.current, { autoAlpha: 0 });
        }
      });

      if (goalsList.length) {
         introTl.current.to(goalsList, { y: 50, autoAlpha: 0, duration: 0.3, ease: "power2.in" });
      }

      introTl.current
        .to([textAndLogos, homeLabel, awayLabel], { autoAlpha: 0, duration: 0.15, ease: "power2.in" }, goalsList.length ? "-=0.1" : 0)
        .to(homeLabel, { x: -50, duration: 0.15, ease: "power2.in" }, "<")
        .to(awayLabel, { x: 50, duration: 0.15, ease: "power2.in" }, "<")
        .to(leftBg, { x: 200, autoAlpha: 0, duration: 0.25, ease: "power3.in" }, "-=0.05")
        .to(rightBg, { x: -200, autoAlpha: 0, duration: 0.25, ease: "power3.in" }, "-=0.25")
        .to(centerBox, { scale: 0, autoAlpha: 0, duration: 0.25, ease: "back.in(1.2)" }, "-=0.15");

      hasAnimatedIn.current = false;
    } else if (!visible && !hasAnimatedIn.current) {
      if (!introTl.current || !introTl.current.isActive()) {
        gsap.set(rootRef.current, { autoAlpha: 0 });
      }
    }
  }, [visible]);

  // Effect để hiển thị khung bàn thắng ngay lập tức nếu có bàn thắng mới được thêm vào
  // trong khi Bảng tỉ số dưới ĐANG HIỂN THỊ
  const goalsHomeCount = match?.teamA?.goals?.length || 0;
  const goalsAwayCount = match?.teamB?.goals?.length || 0;

  useEffect(() => {
    if (visible && hasAnimatedIn.current && rootRef.current) {
      const q = gsap.utils.selector(rootRef);
      const goalsList = q('.sb-goals-list-container');
      if (goalsList.length) {
        gsap.to(goalsList, { y: 0, autoAlpha: 1, duration: 0.4, ease: "back.out(1.2)" });
      }
    }
  }, [goalsHomeCount, goalsAwayCount, visible]);

  if (!match) return null;

  const { teamA, teamB, clock, period } = match;

  // Lấy Subname từ shortName hoặc mặc định
  const getSubName = (team) => {
    if (team.shortName && team.shortName.length > 0) return team.shortName;
    return "TEAM";
  };

  // Helper tính luma (độ sáng)
  const getLuma = (hex) => {
    if (!hex) return 0;
    const c = hex.replace('#', '');
    const rgb = parseInt(c.length === 3 ? c[0]+c[0]+c[1]+c[1]+c[2]+c[2] : c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >>  8) & 0xff;
    const b = (rgb >>  0) & 0xff;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const isDark = (hex) => getLuma(hex) < 128;
  const getShadow = (bgColor, txtColor) => {
    if (isDark(txtColor)) {
      return isDark(bgColor) ? '0 0 6px rgba(255,255,255,0.8)' : `1px 0 0 ${txtColor}, -1px 0 0 ${txtColor}, 0 1px 0 ${txtColor}, 0 -1px 0 ${txtColor}`;
    }
    return '0 2px 4px rgba(0,0,0,0.8)'; // Default dark shadow
  };

  const getLogo = (logoUrl) => {
    if (!logoUrl || typeof logoUrl !== 'string' || logoUrl.trim() === '' || logoUrl === 'undefined' || logoUrl === 'null') {
      return defaultLogo;
    }
    return logoUrl;
  };

  return (
    <div style={{ zIndex, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <main className="broadcast">
        <div ref={rootRef} className="scorebug-bottom">

          {/* DANH SÁCH BÀN THẮNG */}
          {(teamA.goals?.length > 0 || teamB.goals?.length > 0) && (
            <div className="sb-goals-list-container">
              <div className="sb-goals-column sb-goals-home">
                {teamA.goals?.map((g, index) => (
                  <span key={g.id} className="sb-goal-item-inline">
                    <span className="sb-goal-player">{g.playerName}</span>
                    {g.minute && <span className="sb-goal-min">{g.minute}</span>}
                    {index < teamA.goals.length - 1 && <span className="sb-goal-separator">, </span>}
                  </span>
                ))}
              </div>
              <div className="sb-goals-column sb-goals-away">
                {teamB.goals?.map((g, index) => (
                  <span key={g.id} className="sb-goal-item-inline">
                    <span className="sb-goal-player">{g.playerName}</span>
                    {g.minute && <span className="sb-goal-min">{g.minute}</span>}
                    {index < teamB.goals.length - 1 && <span className="sb-goal-separator">, </span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* KHUNG TRÁI - ĐỘI NHÀ */}
          <div className="sb-frame sb-left">
            <img src={khungTrai} className="sb-frame-img" alt="bg-left" style={{ opacity: 0 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: teamA.color,
                WebkitMaskImage: `url(${khungTrai})`,
                maskImage: `url(${khungTrai})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat'
              }} />
              <img src={khungTrai} alt="bg-left" style={{ 
                width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, 
                objectFit: 'contain',
                filter: 'grayscale(100%) contrast(1.2)', mixBlendMode: 'overlay', opacity: 0.7 
              }} />
            </div>
            <div className="sb-left-logo">
              <img src={getLogo(teamA.logo)} alt="Team A Logo" onError={(e) => { e.target.src = defaultLogo; }} />
            </div>
            <div className="sb-left-text">
              <div className="sb-team-name" style={{ 
                color: teamA.textColor || '#ffffff',
                textShadow: getShadow(teamA.color || '#991b1b', teamA.textColor || '#ffffff') 
              }}>{teamA.name}</div>
            </div>
          </div>

          {/* KHUNG GIỮA - TỈ SỐ & THỜI GIAN */}
          <div className="sb-frame sb-center">
            <img src={khungGiua} className="sb-frame-img" alt="bg-center" />
            <div className="sb-score-container">
              <div className="sb-score sb-score-home">{teamA.score}</div>
              <div className="sb-score sb-score-away">{teamB.score}</div>
            </div>
            <div className={`sb-time ${(period === 'HT' || period === 'FT') ? 'sb-time-finished' : ''}`}>
              {period === 'HT' ? 'HẾT HIỆP 1' : period === 'FT' ? 'HẾT GIỜ' : formatClock(clock)}
            </div>
          </div>

          {/* KHUNG PHẢI - ĐỘI KHÁCH */}
          <div className="sb-frame sb-right">
            <img src={khungPhai} className="sb-frame-img" alt="bg-right" style={{ opacity: 0 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: teamB.color,
                WebkitMaskImage: `url(${khungPhai})`,
                maskImage: `url(${khungPhai})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat'
              }} />
              <img src={khungPhai} alt="bg-right" style={{ 
                width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, 
                objectFit: 'contain',
                filter: 'grayscale(100%) contrast(1.2)', mixBlendMode: 'overlay', opacity: 0.7 
              }} />
            </div>
            <div className="sb-right-text">
              <div className="sb-team-name" style={{ 
                color: teamB.textColor || '#ffffff',
                textShadow: getShadow(teamB.color || '#1e3a8a', teamB.textColor || '#ffffff') 
              }}>{teamB.name}</div>
            </div>
            <div className="sb-right-logo">
              <img src={getLogo(teamB.logo)} alt="Team B Logo" onError={(e) => { e.target.src = defaultLogo; }} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ScoreboardBottom;
