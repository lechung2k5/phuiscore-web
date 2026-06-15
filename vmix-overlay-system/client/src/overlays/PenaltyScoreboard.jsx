import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './penaltyScoreboard.css';

const leagueLogo = '/assets/logo_giai.png';

const bgTrai = '/assets/penalty/khung_trai.png';
const bgPhai = '/assets/penalty/khung_phai.png';

const PenaltyScoreboard = ({ zIndex, visible, match, tournamentLogo }) => {
  const containerRef = useRef(null);
  const tl = useRef(null);
  const hasAnimatedIn = useRef(false);
  
  const [localMatch, setLocalMatch] = useState(null);

  // Keep a local copy of match data to allow smooth exit animations
  useEffect(() => {
    if (match) {
      setLocalMatch(match);
    }
  }, [match]);

  useEffect(() => {
    if (!containerRef.current || !localMatch) return;

    const q = gsap.utils.selector(containerRef);

    if (visible && !hasAnimatedIn.current) {
      if (tl.current) tl.current.kill();
      tl.current = gsap.timeline();

      gsap.set(containerRef.current, { autoAlpha: 1 });
      gsap.set(q('.penalty-center'), { scale: 0, autoAlpha: 0 });
      gsap.set(q('.penalty-wing.left'), { x: 200, autoAlpha: 0 });
      gsap.set(q('.penalty-wing.right'), { x: -200, autoAlpha: 0 });
      gsap.set(q('.penalty-circle'), { scale: 0, autoAlpha: 0 });
      gsap.set(q('.penalty-bottom-label'), { y: -20, autoAlpha: 0 });
      gsap.set(q('.penalty-tournament-logo'), { scale: 0, autoAlpha: 0 });

      tl.current
        .to(q('.penalty-tournament-logo'), { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(1.5)" })
        .to(q('.penalty-center'), { scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(1.5)" }, "-=0.2")
        .to(q('.penalty-bottom-label'), { y: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out" }, "-=0.2")
        .to(q('.penalty-wing.left'), { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.3")
        .to(q('.penalty-wing.right'), { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.5")
        .to(q('.penalty-circle'), { scale: 1, autoAlpha: 1, duration: 0.3, stagger: 0.05, ease: "back.out(1.5)" }, "-=0.2");
        
      hasAnimatedIn.current = true;
    } else if (!visible && hasAnimatedIn.current) {
      if (tl.current) tl.current.kill();
      tl.current = gsap.timeline({
        onComplete: () => {
          gsap.set(containerRef.current, { autoAlpha: 0 });
        }
      });

      tl.current
        .to(q('.penalty-circle'), { scale: 0, autoAlpha: 0, duration: 0.2, stagger: -0.02, ease: "power2.in" })
        .to(q('.penalty-wing.left'), { x: 200, autoAlpha: 0, duration: 0.4, ease: "power3.in" }, "-=0.1")
        .to(q('.penalty-wing.right'), { x: -200, autoAlpha: 0, duration: 0.4, ease: "power3.in" }, "-=0.4")
        .to(q('.penalty-bottom-label'), { y: -20, autoAlpha: 0, duration: 0.2, ease: "power2.in" }, "-=0.2")
        .to(q('.penalty-center'), { scale: 0, autoAlpha: 0, duration: 0.4, ease: "back.in(1.5)" }, "-=0.2")
        .to(q('.penalty-tournament-logo'), { scale: 0, autoAlpha: 0, duration: 0.3, ease: "power2.in" }, "-=0.2");
        
      hasAnimatedIn.current = false;
    } else if (!visible && !hasAnimatedIn.current) {
      if (!tl.current || !tl.current.isActive()) {
        gsap.set(containerRef.current, { autoAlpha: 0 });
      }
    }

    return () => {
      // Cleanup handled by kill on next run or unmount, no need to kill here 
      // unless component unmounts, but we don't have unmount specific logic here
    }
  }, [visible, localMatch]);

  if (!localMatch) return null;

  const { teamA, teamB } = localMatch;
  const homePenalties = teamA.penalties || ['pending', 'pending', 'pending', 'pending', 'pending'];
  const awayPenalties = teamB.penalties || ['pending', 'pending', 'pending', 'pending', 'pending'];

  const renderCircle = (status, idx, isHome) => {
    let circleClass = 'penalty-circle';
    if (status === 'scored') circleClass += ' scored';
    if (status === 'missed') circleClass += ' missed';
    
    return (
      <div key={`pen-${isHome ? 'home' : 'away'}-${idx}`} className={circleClass}>
        {status === 'missed' && <div className="cross"></div>}
      </div>
    );
  };

  return (
    <div className="penalty-scoreboard-wrapper" style={{ zIndex }} ref={containerRef}>
      
      {/* Top tournament logo */}
      <div className="penalty-tournament-logo">
        <img src={tournamentLogo || leagueLogo} alt="Logo" />
      </div>

      <div className="penalty-main-row">
        
        {/* Left Wing (Home) */}
        <div className="penalty-wing left">
          <div className="penalty-wing-bg" style={{ width: '100%', height: '100%', position: 'absolute', top: '0', left: 0, zIndex: -1 }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: teamA.color || '#991b1b',
              WebkitMaskImage: `url(${bgTrai})`, maskImage: `url(${bgTrai})`,
              WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat'
            }} />
            <img src={bgTrai} alt="" style={{ 
              width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, 
              filter: 'grayscale(100%) contrast(1.2)', mixBlendMode: 'overlay', opacity: 0.7 
            }} />
          </div>
          
          <div className="penalty-team-logo-box left">
            <img 
              src={teamA.logo} 
              alt={teamA.name} 
              onError={(e) => { e.target.onerror = null; e.target.src = leagueLogo; }} 
            />
          </div>
          <div className="penalty-circles-container left">
            {homePenalties.map((status, i) => renderCircle(status, i, true))}
          </div>
        </div>

        {/* Center */}
        <div className="penalty-center">
          <div className="penalty-score-box">
            <span className="p-score home">{teamA.score}</span>
            <span className="p-divider"></span>
            <span className="p-score away">{teamB.score}</span>
          </div>
          <div className="penalty-bottom-label">PENALTY</div>
        </div>

        {/* Right Wing (Away) */}
        <div className="penalty-wing right">
          <div className="penalty-wing-bg" style={{ width: '100%', height: '100%', position: 'absolute', top: '0', right: 0, zIndex: -1 }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: teamB.color || '#1e3a8a',
              WebkitMaskImage: `url(${bgPhai})`, maskImage: `url(${bgPhai})`,
              WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat'
            }} />
            <img src={bgPhai} alt="" style={{ 
              width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, 
              filter: 'grayscale(100%) contrast(1.2)', mixBlendMode: 'overlay', opacity: 0.7 
            }} />
          </div>

          <div className="penalty-circles-container right">
            {awayPenalties.map((status, i) => renderCircle(status, i, false))}
          </div>
          <div className="penalty-team-logo-box right">
            <img 
              src={teamB.logo} 
              alt={teamB.name} 
              onError={(e) => { e.target.onerror = null; e.target.src = leagueLogo; }} 
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default React.memo(PenaltyScoreboard);
