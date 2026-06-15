import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './highlightOverlay.css';
const leagueLogoFallback = '/assets/logo_giai.png';

const HighlightOverlay = ({ zIndex, visible, tournamentLogo }) => {
  const containerRef = useRef(null);
  const avatarBoxRef = useRef(null);
  const topRowRef = useRef(null);
  const tl = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const avatarBox = avatarBoxRef.current;
    const topRow = topRowRef.current;
    if (!container) return;

    if (tl.current) tl.current.kill();

    tl.current = gsap.timeline();

    if (visible) {
      gsap.set(container, { autoAlpha: 1 });
      gsap.set(avatarBox, { scale: 0, rotation: -90, autoAlpha: 0 });
      gsap.set(topRow, { x: -600, autoAlpha: 0 });

      tl.current
        .to(avatarBox, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.5)" })
        .to(topRow, { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, "-=0.2");
    } else {
      tl.current
        .to(topRow, { x: -600, autoAlpha: 0, duration: 0.4, ease: "power3.in" })
        .to(avatarBox, { scale: 0, rotation: 90, autoAlpha: 0, duration: 0.5, ease: "back.in(1.5)" }, "-=0.2")
        .set(container, { autoAlpha: 0 });
    }

    return () => {
      if (tl.current) tl.current.kill();
    };
  }, [visible]);

  return (
    <div className="highlight-overlay-container" style={{ zIndex }} ref={containerRef}>
      <div ref={avatarBoxRef} className="highlight-avatar-box">
        <img 
          src={tournamentLogo || leagueLogoFallback} 
          onError={(e) => { e.target.onerror = null; e.target.src = leagueLogoFallback; }}
          className="highlight-avatar-img" 
          alt="League Logo"
        />
      </div>
      <div className="highlight-info-box">
        <div ref={topRowRef} className="highlight-row">
          <div className="highlight-title">HIGHLIGHTS</div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HighlightOverlay);
