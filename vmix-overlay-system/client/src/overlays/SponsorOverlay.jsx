import React, { useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import './sponsorOverlay.css';

// Default imports
const sp1 = '/assets/nha_tai_tro/AKPRO.png';
const sp2 = '/assets/nha_tai_tro/HOANGNONG.png';
const sp3 = '/assets/nha_tai_tro/ligpro.png';

const SponsorOverlay = ({ zIndex, data }) => {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sponsors = useMemo(() => {
    if (data && data.length > 0) return data;
    return [sp1, sp2, sp3];
  }, [data]);

  useEffect(() => {
    if (sponsors.length <= 1) return;
    
    // Đảm bảo không bị out of bounds nếu data bị xóa
    if (currentIndex >= sponsors.length) {
      setCurrentIndex(0);
    }

    const interval = setInterval(() => {
      // Khôi phục hiệu ứng lật dọc (rotationX) giống bảng quảng cáo cơ học (Billboard)
      gsap.to(cardRef.current, { 
        rotationX: 90, 
        scale: 0.95,
        transformOrigin: "center center",
        duration: 0.5, 
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex((prev) => (prev + 1) % sponsors.length);
          
          gsap.set(cardRef.current, { rotationX: -90 });
          
          gsap.to(cardRef.current, { 
            rotationX: 0, 
            scale: 1,
            duration: 0.7, 
            ease: "back.out(1.7)" 
          });
          
          gsap.fromTo('.sponsor-shiny', 
            { left: '-100%' }, 
            { left: '100%', duration: 1.2, ease: "power1.inOut" }
          );
        }
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [sponsors.length, currentIndex]);

  useEffect(() => {
    // Animation khi bật layer
    gsap.fromTo(containerRef.current, 
      { autoAlpha: 0, y: 50 }, 
      { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );
  }, []);

  if (sponsors.length === 0) return null;

  return (
    <div ref={containerRef} className="sponsor-container" style={{ zIndex }}>
      <div className="sponsor-scene">
        <div className="sponsor-card" ref={cardRef}>
          {/* Nền tách riêng để dùng overflow: hidden cho tia sáng mà không chặn 3D của card */}
          <div className="sponsor-card-bg">
            <div className="sponsor-shiny"></div>
          </div>
          <div className="sponsor-label-inner top-right">NHÀ TÀI TRỢ</div>
          <img src={sponsors[currentIndex]} className="sponsor-logo" alt="sponsor" />
        </div>
      </div>
    </div>
  );
};

export default React.memo(SponsorOverlay);
