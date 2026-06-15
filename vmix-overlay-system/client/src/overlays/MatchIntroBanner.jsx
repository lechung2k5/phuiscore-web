import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './matchIntroBanner.css';

// Tải Assets
const bgTrai = '/assets/banner_gioithieu/bg_trai.png';
const bgPhai = '/assets/banner_gioithieu/bg_phai.png';
const cauThuPhai = '/assets/banner_gioithieu/cau thu phai.png';
const logoGiai = '/assets/banner_gioithieu/logo_giai.png';
const logoAmBan = '/assets/banner_gioithieu/logo_amban.png';
const vsImg = '/assets/banner_gioithieu/vs.png';
const asset1Trai = '/assets/banner_gioithieu/asset1_trai.png';
const asset2Trai = '/assets/banner_gioithieu/asset2_trai.png';
const asset1Phai = '/assets/banner_gioithieu/asset1_phai.png';
const asset2Phai = '/assets/banner_gioithieu/asset2_phai.png';
const boxTrai = '/assets/banner_gioithieu/logo_doi_trai.png';
const boxPhai = '/assets/banner_gioithieu/logo_doi-phai.png';
const defaultLogo = '/assets/logo_giai.png';

const MatchIntroBanner = ({ zIndex, visible, match }) => {
  const rootRef = useRef(null);
  const leftGroupRef = useRef(null);
  const rightGroupRef = useRef(null);
  const centerGroupRef = useRef(null);
  const vsRef = useRef(null);
  const leftPlayerRef = useRef(null);
  const rightPlayerRef = useRef(null);
  const tl = useRef(null);

  // State cục bộ để tự động loop Intro/Outro mỗi 10s
  const [localVisible, setLocalVisible] = useState(false);

  useEffect(() => {
    let hideTimer, loopTimer;

    const SHOW_DURATION = 10000;  // Hiển thị 10s
    const HIDE_DURATION = 10000;  // Tắt (nghỉ) 10s

    const startLoop = () => {
      // Bật lên
      setLocalVisible(true);

      // Sau 10s hiển thị thì tắt đi
      hideTimer = setTimeout(() => {
        setLocalVisible(false);

        // Sau 10s nghỉ thì lặp lại vòng lặp
        loopTimer = setTimeout(startLoop, HIDE_DURATION);
      }, SHOW_DURATION);
    };

    if (visible) {
      startLoop();
    } else {
      setLocalVisible(false);
    }

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(loopTimer);
    };
  }, [visible]);

  useEffect(() => {
    // Khởi tạo ẩn
    if (!localVisible) {
      gsap.set(rootRef.current, { autoAlpha: 0 });
      gsap.set(leftGroupRef.current, { x: -800, autoAlpha: 0 });
      gsap.set(rightGroupRef.current, { x: 800, autoAlpha: 0 });
      gsap.set(centerGroupRef.current, { scale: 0, autoAlpha: 0 });
      gsap.set(vsRef.current, { scale: 3, autoAlpha: 0 });
      gsap.set(leftPlayerRef.current, { autoAlpha: 0, y: 200 });
      gsap.set(rightPlayerRef.current, { autoAlpha: 0, y: 200 });
    } else {
      gsap.set(rootRef.current, { autoAlpha: 1 });
      gsap.set(leftGroupRef.current, { x: 0, autoAlpha: 1 });
      gsap.set(rightGroupRef.current, { x: 0, autoAlpha: 1 });
      gsap.set(centerGroupRef.current, { scale: 1, autoAlpha: 1 });
      gsap.set(vsRef.current, { scale: 1, autoAlpha: 1 });
      gsap.set(leftPlayerRef.current, { autoAlpha: 1, y: 0 });
      gsap.set(rightPlayerRef.current, { autoAlpha: 1, y: 0 });
    }
  }, []);

  useEffect(() => {
    if (tl.current) tl.current.kill();
    tl.current = gsap.timeline();

    if (localVisible) {
      gsap.set(rootRef.current, { autoAlpha: 1 });
      tl.current.fromTo(leftGroupRef.current, { x: -800, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, ease: "power4.out" })
                .fromTo(rightGroupRef.current, { x: 800, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, ease: "power4.out" }, "<")
                .fromTo([leftPlayerRef.current, rightPlayerRef.current], { autoAlpha: 0, y: 150 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "back.out(1.2)" }, "-=0.2")
                .fromTo(vsRef.current, { scale: 5, autoAlpha: 0, rotation: -20 }, { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.5, ease: "back.out(1.5)" }, "-=0.2")
                .fromTo(centerGroupRef.current, { scale: 0.5, autoAlpha: 0, y: 50 }, { scale: 1, autoAlpha: 1, y: 0, duration: 0.5, ease: "back.out(1.2)", stagger: 0.1 }, "-=0.2");
    } else {
      tl.current.to([leftPlayerRef.current, rightPlayerRef.current], { autoAlpha: 0, y: 100, duration: 0.3, ease: "power2.in" })
                .to(centerGroupRef.current, { scale: 0.8, autoAlpha: 0, duration: 0.3, ease: "power2.in" }, "<")
                .to(vsRef.current, { scale: 0, autoAlpha: 0, rotation: 20, duration: 0.3, ease: "back.in(1.5)" }, "<")
                .to(leftGroupRef.current, { x: -800, autoAlpha: 0, duration: 0.5, ease: "power3.in" }, "-=0.1")
                .to(rightGroupRef.current, { x: 800, autoAlpha: 0, duration: 0.5, ease: "power3.in" }, "<")
                .set(rootRef.current, { autoAlpha: 0 });
    }

    return () => {
      if (tl.current) tl.current.kill();
    };
  }, [localVisible]);

  if (!match) return null;
  const { teamA, teamB } = match;

  const getLogo = (logoUrl) => {
    if (!logoUrl || typeof logoUrl !== 'string' || logoUrl.trim() === '' || logoUrl === 'undefined' || logoUrl === 'null') {
      return defaultLogo;
    }
    return logoUrl;
  };

  const RecoloredAsset = ({ src, className, alt, color }) => (
    <div className={className} style={{ display: 'flex' }}>
      <img src={src} alt={alt} style={{ height: '100%', width: 'auto', filter: 'grayscale(100%) contrast(1.1)' }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: color,
        mixBlendMode: 'color',
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat'
      }} />
    </div>
  );


  return (
    <div ref={rootRef} className="intro-banner-container" style={{ zIndex }}>
      
      {/* NHÓM BÊN TRÁI */}
      <div ref={leftGroupRef} style={{ width: '100%', height: '100%', position: 'absolute' }}>
        <RecoloredAsset src={bgTrai} className="intro-asset intro-bg-left" alt="bg left" color={teamA.color} />
        <img ref={leftPlayerRef} src={cauThuPhai} className="intro-asset intro-player-left" alt="player left" style={{ transform: 'scaleX(-1)' }} />
        <RecoloredAsset src={asset1Trai} className="intro-asset intro-shard1-left" alt="shard" color={teamA.color} />
        <img src={asset2Trai} className="intro-asset intro-shard2-left" alt="shard" />
        
        <div className="intro-asset intro-team-box-left">
          <img src={getLogo(teamA.logo)} className="intro-team-logo-inner" alt="team A logo" />
        </div>
      </div>

      {/* NHÓM BÊN PHẢI */}
      <div ref={rightGroupRef} style={{ width: '100%', height: '100%', position: 'absolute' }}>
        <RecoloredAsset src={bgPhai} className="intro-asset intro-bg-right" alt="bg right" color={teamB.color} />
        <img ref={rightPlayerRef} src={cauThuPhai} className="intro-asset intro-player-right" alt="player right" />
        <RecoloredAsset src={asset1Phai} className="intro-asset intro-shard1-right" alt="shard" color={teamB.color} />
        <img src={asset2Phai} className="intro-asset intro-shard2-right" alt="shard" />
        
        <div className="intro-asset intro-team-box-right">
          <img src={getLogo(teamB.logo)} className="intro-team-logo-inner" alt="team B logo" />
        </div>
      </div>

      {/* NHÓM TRUNG TÂM */}
      <div ref={centerGroupRef} style={{ width: '100%', height: '100%', position: 'absolute' }}>
        <img src={logoGiai} className="intro-asset intro-league" alt="league" />
        <img src={logoAmBan} className="intro-asset intro-media" alt="media" />
      </div>
      
      {/* VS RIÊNG LẺ ĐỂ HIỆU ỨNG MẠNH HƠN */}
      <img ref={vsRef} src={vsImg} className="intro-asset intro-vs" alt="vs" />

    </div>
  );
};

export default React.memo(MatchIntroBanner);
