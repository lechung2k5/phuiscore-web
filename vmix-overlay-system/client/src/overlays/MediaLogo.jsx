import React, { useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import './mediaLogo.css';

// Default imports
const defaultTournament = '/assets/logo_dai/logo_giai.png';
const media1 = '/assets/logo_dai/bee.png';
const media2 = '/assets/logo_dai/bongdaso.png';
const media3 = '/assets/logo_dai/phuiscore.png';

const MediaLogo = ({ zIndex, data, tournamentLogo }) => {
  const containerRef = useRef(null);
  const mediaRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback data
  const tLogo = tournamentLogo || defaultTournament;
  const medias = useMemo(() => {
    if (data && data.length > 0) return data;
    return [media1, media2, media3];
  }, [data]);

  useEffect(() => {
    console.log("[MediaLogo] useEffect setup", { currentIndex, mediasLen: medias.length });
    if (medias.length <= 1) return;
    
    let isActive = true;

    const currentLogo = medias[currentIndex];
    const isBongDaSo = typeof currentLogo === 'string' && currentLogo.includes('bongdaso');
    const displayTime = isBongDaSo ? 14000 : 7000;

    console.log(`[MediaLogo] Starting timer for ${displayTime}ms. currentLogo:`, currentLogo);

    const timerId = setTimeout(() => {
      console.log("[MediaLogo] Timer fired! Starting flip out...");
      gsap.to(mediaRef.current, { 
        rotationX: 90, 
        scale: 0.95,
        transformOrigin: "center center",
        duration: 0.5, 
        ease: "power2.in",
        onComplete: () => {
          console.log("[MediaLogo] Flip out complete. isActive:", isActive);
          if (!isActive) return;

          setCurrentIndex((prev) => {
            const next = (prev + 1) % medias.length;
            console.log("[MediaLogo] Updating index to:", next);
            return next;
          });
          
          gsap.set(mediaRef.current, { rotationX: -90 });
          
          gsap.to(mediaRef.current, { 
            rotationX: 0, 
            scale: 1,
            duration: 0.7, 
            ease: "back.out(1.7)",
            onComplete: () => console.log("[MediaLogo] Flip in complete.")
          });
        }
      });
    }, displayTime);

    return () => {
      console.log("[MediaLogo] useEffect cleanup. Clearing timer:", timerId);
      isActive = false;
      clearTimeout(timerId);
    };
  }, [medias.length, currentIndex]);

  // Tia sáng quét ngang liên tục lặp đi lặp lại
  useEffect(() => {
    const sweepTl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });
    sweepTl.fromTo('.media-shiny', 
      { left: '-150%' }, 
      { left: '150%', duration: 1.2, ease: "power1.inOut" }
    );
    
    return () => sweepTl.kill();
  }, []);

  // Cảnh Entry mượt mà
  useEffect(() => {
    gsap.fromTo(containerRef.current, 
      { autoAlpha: 0, x: -50 }, 
      { autoAlpha: 1, x: 0, duration: 1, ease: "power3.out" }
    );
  }, []);

  return (
    <div ref={containerRef} className="media-logo-container" style={{ zIndex }}>
      {/* Logo giải cố định bên trái */}
      <div className="media-logo-static">
        <img src={tLogo} alt="Tournament" />
      </div>
      
      {/* Vạch phân cách để layout nhìn chuyên nghiệp hơn */}
      <div className="media-divider"></div>

      {/* Logo truyền thông quay loop 3D bên phải */}
      <div className="media-logo-dynamic">
        <div ref={mediaRef} className="media-spin-wrapper">
          <img src={medias[currentIndex]} alt="Media" />
          
          {/* Lớp chứa tia sáng, đứng yên và đóng vai trò làm khuôn cắt (mask) */}
          <div 
            className="media-shiny-container"
            style={{ 
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              WebkitMaskImage: `url(${medias[currentIndex]})`,
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              zIndex: 10
            }}
          >
            {/* Tia sáng di chuyển bên trong khuôn */}
            <div className="media-shiny"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MediaLogo);
