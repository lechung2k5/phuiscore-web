import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './scoreboard.css';

import heroAsset from '../assets/hero.png';
import leagueLogo from '../assets/logo_giai.png';

import teamHomeBg from '../assets/bangtiso/team_home-B1nEwJKM.png';
import teamAwayBg from '../assets/bangtiso/team_away-CRjDKtHD.png';
import scoreTimeBg from '../assets/bangtiso/score_time-DR0GiOXL.png';
import periodBgAsset from '../assets/bangtiso/score_time-DR0GiOXL.png';

function formatClock(timeStr) {
  return timeStr || "00:00";
}

const ScoreboardTop = ({ zIndex, visible, match, event }) => {
  if (!match) return null;

  const { teamA, teamB, clock, period, status, extraTime } = match;

  const [displayHomeScore, setDisplayHomeScore] = useState(teamA.score);
  const [displayAwayScore, setDisplayAwayScore] = useState(teamB.score);

  const rootRef = useRef(null);
  const logoRef = useRef(null);
  const goalRef = useRef(null);
  const trailRef = useRef(null);
  const wipeRef = useRef(null);
  const panelRef = useRef(null);
  const runnerRef = useRef(null);
  const homeLabelRef = useRef(null);
  const awayLabelRef = useRef(null);
  const sparkRefs = useRef([]);
  const homeScoreRef = useRef(null);
  const awayScoreRef = useRef(null);
  const periodRef = useRef(null);
  const mainBoardRef = useRef(null);
  const netRef = useRef(null);
  const ballRef = useRef(null);

  const centerBgRef = useRef(null);
  const homeBgRef = useRef(null);
  const awayBgRef = useRef(null);
  const periodBgRef = useRef(null);

  const hasAnimatedIn = useRef(false);
  const introTl = useRef(null);

  // Khởi tạo ban đầu để giấu hiệu ứng Goal
  useEffect(() => {
    gsap.set([goalRef.current, trailRef.current, wipeRef.current, panelRef.current], { autoAlpha: 0 });
  }, []);

  useEffect(() => {
    if (!rootRef.current) return;
    const q = gsap.utils.selector(rootRef);

    const centerBgs = q('.center-frame, .league-logo');
    const leftBg = q('.home-frame');
    const rightBg = q('.away-frame');
    const textElements = q('.period-wrapper, .clock-value, .home-score, .away-score');
    const homeLabel = q('.home-label');
    const awayLabel = q('.away-label');

    if (visible && !hasAnimatedIn.current) {
      if (introTl.current) introTl.current.kill();
      introTl.current = gsap.timeline();

      gsap.set(rootRef.current, { autoAlpha: 1, y: 0 });
      gsap.set(centerBgs, { scale: 0, autoAlpha: 0 });
      gsap.set(leftBg, { x: 200, autoAlpha: 0 });
      gsap.set(rightBg, { x: -200, autoAlpha: 0 });
      gsap.set(textElements, { autoAlpha: 0 });
      gsap.set(homeLabel, { x: -50, autoAlpha: 0 }); // Trượt từ góc trái vào
      gsap.set(awayLabel, { x: 50, autoAlpha: 0 }); // Trượt từ góc phải vào

      introTl.current
        .to(centerBgs, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "back.out(1.2)", stagger: 0.05 })
        .to(leftBg, { x: 0, autoAlpha: 1, duration: 0.25, ease: "power3.out" }, "-=0.15")
        .to(rightBg, { x: 0, autoAlpha: 1, duration: 0.25, ease: "power3.out" }, "-=0.25")
        .to([textElements, homeLabel, awayLabel], { autoAlpha: 1, duration: 0.25, ease: "power2.out" }, "<")
        .to(homeLabel, { x: 0, duration: 0.3, ease: "back.out(1.5)" }, "<")
        .to(awayLabel, { x: 0, duration: 0.3, ease: "back.out(1.5)" }, "<");

      hasAnimatedIn.current = true;
    } else if (!visible && hasAnimatedIn.current) {
      if (introTl.current) introTl.current.kill();
      introTl.current = gsap.timeline({
        onComplete: () => {
          gsap.set(rootRef.current, { autoAlpha: 0 });
        }
      });

      introTl.current
        .to([textElements, homeLabel, awayLabel], { autoAlpha: 0, duration: 0.15, ease: "power2.in" })
        .to(homeLabel, { x: -50, duration: 0.15, ease: "power2.in" }, "<")
        .to(awayLabel, { x: 50, duration: 0.15, ease: "power2.in" }, "<")
        .to(leftBg, { x: 200, autoAlpha: 0, duration: 0.25, ease: "power3.in" }, "-=0.05")
        .to(rightBg, { x: -200, autoAlpha: 0, duration: 0.25, ease: "power3.in" }, "-=0.25")
        .to(centerBgs, { scale: 0, autoAlpha: 0, duration: 0.25, ease: "back.in(1.2)", stagger: -0.05 }, "-=0.15");

      hasAnimatedIn.current = false;
    } else if (!visible && !hasAnimatedIn.current) {
      if (!introTl.current || !introTl.current.isActive()) {
        gsap.set(rootRef.current, { autoAlpha: 0 });
      }
    }
  }, [visible]);

  const eventId = event?.id;
  const eventName = event?.name;
  const eventSide = event?.side;

  const lastEventId = useRef(eventId);

  useEffect(() => {
    // If a goal event was just triggered
    if (eventName === "goal" && eventId !== lastEventId.current) {
      console.log("Playing goal animation for", eventSide);
      lastEventId.current = eventId;
      
      playGoal(eventSide, {
        logo: logoRef.current,
        goal: goalRef.current,
        trail: trailRef.current,
        wipe: wipeRef.current,
        panel: panelRef.current,
        runner: runnerRef.current,
        score: eventSide === "home" ? homeScoreRef.current : awayScoreRef.current,
        mainBoard: mainBoardRef.current,
        sparks: sparkRefs.current,
        net: netRef.current,
        ball: ballRef.current,
        onHit: () => {
          if (eventSide === "home") setDisplayHomeScore(teamA.score);
          if (eventSide === "away") setDisplayAwayScore(teamB.score);
        }
      });
    } else if (eventId === lastEventId.current) {
      // It's just a normal score update without a new goal event
      setDisplayHomeScore(teamA.score);
      setDisplayAwayScore(teamB.score);
    }
  }, [eventId, eventName, eventSide, teamA.score, teamB.score]);

  const sideClass = eventSide === "away" ? "away-goal" : "home-goal";

  // Helper tính luma (độ sáng) để chọn màu chữ tương phản
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
  const homeColor = teamA.color || '#991b1b';
  const awayColor = teamB.color || '#1e3a8a';
  const homeTextColor = teamA.textColor || '#ffffff';
  const awayTextColor = teamB.textColor || '#ffffff';
  
  // Logic tạo shadow: 
  // - Nếu chữ màu sáng (vd: Trắng): Dùng bóng đen (tùy theo nền đậm hay nhạt)
  // - Nếu chữ màu tối (vd: Đen): Không dùng bóng nếu nền sáng (nhưng buff độ đậm bằng shadow mỏng cùng màu), hoặc dùng viền trắng nếu nền tối
  const getShadow = (bgColor, txtColor) => {
    if (isDark(txtColor)) {
      return isDark(bgColor) 
        ? '0 0 6px rgba(255,255,255,0.8)' 
        : `1px 0 0 ${txtColor}, -1px 0 0 ${txtColor}, 0 1px 0 ${txtColor}, 0 -1px 0 ${txtColor}`;
    }
    return isDark(bgColor) 
      ? '0 2px 4px rgba(0,0,0,0.72)' 
      : '0 2px 8px rgba(0,0,0,1), 0 0 6px rgba(0,0,0,0.8)';
  };
  
  const homeTextShadow = getShadow(homeColor, homeTextColor);
  const awayTextShadow = getShadow(awayColor, awayTextColor);

  return (
    <div style={{ zIndex, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <main className="broadcast">
        <section ref={rootRef} className={`scorebug ${sideClass}`}>
          <div ref={mainBoardRef} className="main-scoreboard">
            {scoreTimeBg ? <img ref={centerBgRef} className="asset center-frame" src={scoreTimeBg} alt="" /> : <div ref={centerBgRef} className="asset center-frame fallback-bg-center" />}
          
          {teamHomeBg ? (
            <div ref={homeBgRef} className="asset home-frame">
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: homeColor,
                WebkitMaskImage: `url(${teamHomeBg})`,
                maskImage: `url(${teamHomeBg})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat'
              }} />
              <img src={teamHomeBg} alt="" style={{ 
                width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, 
                objectFit: 'contain',
                filter: 'grayscale(100%) contrast(1.2)', mixBlendMode: 'overlay', opacity: 0.7 
              }} />
            </div>
          ) : <div ref={homeBgRef} className="asset home-frame fallback-bg-home" style={{ backgroundColor: homeColor }} />}
          
          {teamAwayBg ? (
            <div ref={awayBgRef} className="asset away-frame">
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: awayColor,
                WebkitMaskImage: `url(${teamAwayBg})`,
                maskImage: `url(${teamAwayBg})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat'
              }} />
              <img src={teamAwayBg} alt="" style={{ 
                width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, 
                objectFit: 'contain',
                filter: 'grayscale(100%) contrast(1.2)', mixBlendMode: 'overlay', opacity: 0.7 
              }} />
            </div>
          ) : <div ref={awayBgRef} className="asset away-frame fallback-bg-away" style={{ backgroundColor: awayColor }} />}
          
          <div className="period-wrapper">
            <div className="period-shape"></div>
            <div className="period-text">
              {status === 'HALF_TIME' ? 'NGHỈ' : period}
            </div>
            {extraTime > 0 && (
              <div className="extra-time-wrapper">
                <div className="extra-time-card">+{extraTime}</div>
              </div>
            )}
          </div>

          <div className="fx-rim" />
          <div ref={homeLabelRef} className="team-label home-label" style={{ color: homeTextColor, textShadow: homeTextShadow }}>{teamA.shortName || teamA.name}</div>
          <div ref={awayLabelRef} className="team-label away-label" style={{ color: awayTextColor, textShadow: awayTextShadow }}>{teamB.shortName || teamB.name}</div>
          <div ref={homeScoreRef} className="score-value home-score" style={{ color: homeTextColor, textShadow: homeTextShadow }}>{displayHomeScore}</div>
          <div ref={awayScoreRef} className="score-value away-score" style={{ color: awayTextColor, textShadow: awayTextShadow }}>{displayAwayScore}</div>
          <div className={`clock-value ${(period === 'HT' || period === 'FT') ? 'clock-finished' : ''}`}>
            {period === 'HT' ? 'HẾT HIỆP 1' : period === 'FT' ? 'HẾT GIỜ' : formatClock(clock)}
          </div>

          <div ref={logoRef} className="league-logo">
            <img src={leagueLogo} alt="" />
          </div>
          </div>

          <div ref={goalRef} className="goal-system">
            <div ref={ballRef} className="goal-ball">
              <svg width="130" height="160" viewBox="0 0 130 160" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="ballGrad" cx="38%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="#ffffff"/>
                    <stop offset="40%" stopColor="#f0f0f0"/>
                    <stop offset="100%" stopColor="#cccccc"/>
                  </radialGradient>
                  <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ff6600" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#ff0000" stopOpacity="0"/>
                  </radialGradient>
                  <filter id="fireBlur">
                    <feGaussianBlur stdDeviation="2.5" result="blur"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                  </filter>
                  <filter id="ballGlow">
                    <feGaussianBlur stdDeviation="4" result="glow"/>
                    <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>

                {/* ===== LỬA BÊN NGOÀI ===== */}
                {/* Ngọn lửa 1 - Trái */}
                <path className="flame flame-1" d="M 18,85 Q 8,65 15,50 Q 10,70 22,75 Q 12,55 25,35 Q 20,55 30,60 Q 25,40 38,28 Q 30,50 35,65 Q 28,75 18,85 Z" fill="url(#flameGrad1)" filter="url(#fireBlur)"/>
                {/* Ngọn lửa 2 - Phải */}
                <path className="flame flame-2" d="M 112,85 Q 122,65 115,50 Q 120,70 108,75 Q 118,55 105,35 Q 110,55 100,60 Q 105,40 92,28 Q 100,50 95,65 Q 102,75 112,85 Z" fill="url(#flameGrad2)" filter="url(#fireBlur)"/>
                {/* Ngọn lửa 3 - Trên */}
                <path className="flame flame-3" d="M 65,15 Q 50,8 45,20 Q 55,12 58,22 Q 48,15 50,30 Q 58,18 65,28 Q 72,18 80,30 Q 82,15 75,22 Q 78,12 88,20 Q 83,8 65,15 Z" fill="url(#flameGrad3)" filter="url(#fireBlur)"/>
                {/* Quầng lửa tổng */}
                <ellipse cx="65" cy="85" rx="52" ry="45" fill="url(#fireGlow)" className="fire-glow"/>

                <defs>
                  <linearGradient id="flameGrad1" x1="0%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" stopColor="#ff2200" stopOpacity="0.9"/>
                    <stop offset="50%" stopColor="#ff8800" stopOpacity="0.7"/>
                    <stop offset="100%" stopColor="#ffee00" stopOpacity="0.3"/>
                  </linearGradient>
                  <linearGradient id="flameGrad2" x1="100%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" stopColor="#ff2200" stopOpacity="0.9"/>
                    <stop offset="50%" stopColor="#ff8800" stopOpacity="0.7"/>
                    <stop offset="100%" stopColor="#ffee00" stopOpacity="0.3"/>
                  </linearGradient>
                  <linearGradient id="flameGrad3" x1="50%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" stopColor="#ff4400" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#ffcc00" stopOpacity="0.2"/>
                  </linearGradient>
                </defs>

                {/* ===== QUẢ BÓNG ===== */}
                <circle cx="65" cy="85" r="42" fill="url(#ballGrad)" stroke="#555" strokeWidth="1.5" filter="url(#ballGlow)"/>
                {/* Mảnh đen trung tâm (Ngũ giác) */}
                <path d="M 65 55 L 88 70 L 80 98 L 50 98 L 42 70 Z" fill="#1a1a1a"/>
                {/* Các mảnh đen xung quanh */}
                <path d="M 65 55 L 65 43" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
                <path d="M 88 70 L 100 62" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
                <path d="M 80 98 L 90 110" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
                <path d="M 50 98 L 40 110" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
                <path d="M 42 70 L 30 62" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
                {/* Phản sáng */}
                <ellipse cx="52" cy="68" rx="9" ry="6" fill="rgba(255,255,255,0.5)" transform="rotate(-30 52 68)"/>
              </svg>
            </div>
            
            <div ref={trailRef} className="goal-trail-hidden" />
            <div ref={wipeRef} className="goal-wipe" />
            <div ref={runnerRef} className="team-runner">
              {eventSide === "away" ? (teamB.shortName || teamB.name) : (teamA.shortName || teamA.name)}
            </div>
            <div ref={panelRef} className="goal-panel">
              {teamHomeBg && teamAwayBg ? (
                <img className="goal-plate-bg" src={eventSide === "away" ? teamAwayBg : teamHomeBg} alt="" />
              ) : (
                <div className="goal-plate-bg" style={{ background: eventSide === "away" ? '#1e3a8a' : '#991b1b', width: '100%', height: '100%', position: 'absolute' }} />
              )}
              
              {(() => {
                const getLogoFallback = (logoUrl) => {
                  if (!logoUrl || typeof logoUrl !== 'string' || logoUrl.trim() === '' || logoUrl === 'undefined' || logoUrl === 'null') {
                    return leagueLogo;
                  }
                  return logoUrl;
                };
                const activeLogo = getLogoFallback(eventSide === "away" ? teamB.logo : teamA.logo);

                return (
                  <>
                    <div 
                      className="goal-watermark-wrapper" 
                      style={{ 
                        overflow: 'hidden', 
                        WebkitMaskImage: (teamHomeBg && teamAwayBg) ? `url(${eventSide === "away" ? teamAwayBg : teamHomeBg})` : 'none',
                        WebkitMaskSize: '100% 100%',
                        WebkitMaskRepeat: 'no-repeat',
                        maskImage: (teamHomeBg && teamAwayBg) ? `url(${eventSide === "away" ? teamAwayBg : teamHomeBg})` : 'none',
                        maskSize: '100% 100%',
                        maskRepeat: 'no-repeat'
                      }}
                    >
                      <img 
                        className={`goal-watermark-logo ${eventSide === "away" ? "away-side" : "home-side"}`}
                        src={activeLogo} 
                        alt="" 
                        onError={(e) => { e.target.onerror = null; e.target.src = leagueLogo; }}
                      />
                    </div>

                    <div className="goal-text-wrapper">
                      <span className="goal-text" data-text="GOALLL!!!">GOALLL!!!</span>
                    </div>
                    
                    <div className={`goal-team-logo-container ${eventSide === "away" ? "away-side" : "home-side"}`}>
                      <img 
                        src={leagueLogo} 
                        alt="" 
                        className="goal-league-logo" 
                      />
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="goal-particles">
              {Array.from({ length: 24 }).map((_, index) => (
                <i
                  key={index}
                  ref={(node) => {
                    sparkRefs.current[index] = node;
                  }}
                  className={`spark spark-${index % 3}`}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

function playGoal(side, refs) {
  const isHome = side === "home";
  const originalColor = '#ffffff';

  gsap.killTweensOf([
    refs.logo,
    refs.goal,
    refs.trail,
    refs.wipe,
    refs.panel,
    refs.runner,
    refs.score,
    refs.mainBoard,
    refs.sparks,
    refs.net,
    refs.ball,
  ]);

  const tl = gsap.timeline({
    defaults: { ease: "expo.out" },
    onComplete: () => {
      gsap.set([refs.goal, refs.trail, refs.wipe, refs.panel, refs.net, refs.ball], { autoAlpha: 0, y: 0, scale: 1 });
      gsap.set(refs.runner, { autoAlpha: 0 });
      gsap.set(refs.mainBoard, { autoAlpha: 1, y: 0, scale: 1 });
      gsap.set(refs.score, { clearProps: "scale,color" });
    },
  });

  tl.set(refs.goal, { autoAlpha: 1 })
    .set([refs.trail, refs.wipe, refs.runner], { autoAlpha: 0 })
    .set(refs.panel, { autoAlpha: 0, scaleX: 0, scaleY: 1, transformOrigin: isHome ? "left center" : "right center" })
    .set(refs.sparks, { autoAlpha: 0, x: 0, y: 0, scale: 0.1 })
    
    // SÚT BÓNG VÀO TÂM BẢNG TỈ SỐ
    .set(refs.ball, { autoAlpha: 1, x: (isHome ? -1000 : 1000), y: 0, scale: 0.6, rotation: 0 }, 0)
    .to(refs.ball, { x: 0, rotation: (isHome ? 720 : -720), duration: 0.8, ease: "power2.inOut" }, 0)
    
    // VA CHẠM: BẢNG TỈ SỐ BIẾN MẤT, BÓNG VỠ
    .to(refs.mainBoard, { autoAlpha: 0, y: -20, scale: 0.95, duration: 0.3, ease: "power2.inOut" }, 0.8)
    .to(refs.ball, { autoAlpha: 0, scale: 1.5, duration: 0.1 }, 0.8)

    // PANEL GOAL MỞ RA (KÉO RA TỪ HƯỚNG BÓNG SÚT TỚI) VÀ CHẠM LÀ NHẢY SỐ
    .call(() => {
      if (refs.onHit) refs.onHit();
    }, null, 0.8)
    .to(refs.panel, { autoAlpha: 1, scaleX: 1, duration: 0.4, ease: "back.out(1.5)" }, 0.8)
    .to(refs.score, { scale: 1.6, color: "#ceff40", duration: 0.2 }, 0.8)
    .to(refs.score, { scale: 1, color: originalColor, duration: 0.6, ease: "elastic.out(1, 0.4)" }, 1.0)
    .to(refs.sparks, {
      autoAlpha: 1,
      x: (i) => (isHome ? 1 : -1) * (Math.random() * 350 - 150),
      y: () => (Math.random() - 0.5) * 250,
      scaleX: () => 0.5 + Math.random() * 0.8,
      scaleY: () => 0.8 + Math.random() * 1.5,
      rotation: () => Math.random() * 360,
      duration: 0.25,
      ease: "power4.out",
      stagger: 0.005,
    }, 0.8)
    .to(refs.sparks, { autoAlpha: 0, scaleY: 0, duration: 0.15, stagger: 0.005 }, 1.05)
    
    // THU HỒI
    .to(refs.panel, { autoAlpha: 0, scale: 1.1, duration: 0.4, ease: "power2.in" }, 4.4)
    .to(refs.mainBoard, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, 4.6)
    .to(refs.goal, { autoAlpha: 0, duration: 0.2 }, 4.9);
}

export default ScoreboardTop;
