"use client"
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link } from 'solito/link'
import { generateMatchSlug } from '../../utils/slug'
import { getImageUrl } from '../../utils/image'
import { API_BASE } from '../../utils/api-config'
import { 
  LiveKitRoom, 
  useTracks,
  useParticipants,
  VideoTrack,
  RoomAudioRenderer
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

// Component con để lấy tracks cho khán giả
function Monitor({ setLkToken }: { setLkToken: (t: string) => void }) {
  const [started, setStarted] = useState(false);
  const [volume, setVolume] = useState(1);
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false }
  ]).filter(t => t.participant.identity.includes('obs_'));

  const participants = useParticipants();
  const obsTrack = tracks[0];

  // Cập nhật âm lượng cho video và audio
  useEffect(() => {
    const applyVolume = () => {
        // Tìm tất cả video và audio trong container của trình phát
        const mediaElements = document.querySelectorAll('#lmd-player-container video, #lmd-player-container audio, .lk-room-container audio');
        mediaElements.forEach((el: any) => {
            el.volume = volume;
            el.muted = volume === 0;
        });
    };

    applyVolume();
    // Thử lại sau một khoảng thời gian ngắn để đảm bảo bắt được các thẻ audio mới khởi tạo
    const timer = setTimeout(applyVolume, 1000);
    return () => clearTimeout(timer);
  }, [volume, obsTrack, started, participants.length]);

  console.log("[Viewer] 👥 Danh sách định danh trong phòng:", 
    participants.map(p => p.identity)
  );

  if (!started) {
    return (
      <div style={{ 
        height: '100%', width: '100%', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', background: '#000', gap: 20 
      }}>
         <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 30px rgba(34,197,94,0.3)' }} onClick={() => setStarted(true)}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#000"><path d="M8 5v14l11-7z"/></svg>
         </div>
         <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>BẮT ĐẦU XEM TRỰC TIẾP</span>
         <span style={{ color: '#5a6a5e', fontSize: 12 }}>Nhấn để kích hoạt âm thanh và video</span>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', background: '#000', overflow: 'hidden' }} id="lmd-player-container">
      {obsTrack ? (() => {
        const TrackComponent = VideoTrack as any;
        return (
          <div style={{ height: '100%', width: '100%' }}>
            <TrackComponent trackRef={obsTrack as any} style={{ height: '100%', width: '100%', objectFit: 'contain', maxWidth: '100vw' }} />
            
            {/* Custom Control Bar */}
            <div style={{ 
                position: 'absolute', bottom: 0, left: 0, right: 0, 
                background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', 
                padding: window.innerWidth < 768 ? '10px 12px' : '20px', 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                opacity: 1, transition: 'opacity 0.3s' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth < 768 ? 8 : 15 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.9)', padding: '3px 8px', borderRadius: 4 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
                        <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>LIVE</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth < 768 ? 10 : 20 }}>
                    {/* Bộ điều khiển Âm lượng */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 20 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                        <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={volume} 
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            style={{ width: window.innerWidth < 768 ? 50 : 80, accentColor: '#22c55e', cursor: 'pointer' }}
                        />
                    </div>
                    
                    {/* Nút Toàn màn hình */}
                    <button 
                        onClick={async () => {
                            const container = document.getElementById('lmd-player-container');
                            if (container) {
                                try {
                                    if (!document.fullscreenElement) {
                                        await container.requestFullscreen();
                                        // 🔄 Tự động xoay ngang trên Mobile nếu trình duyệt hỗ trợ
                                        if (window.screen && (window.screen as any).orientation && (window.screen as any).orientation.lock) {
                                            await (window.screen as any).orientation.lock('landscape').catch((e: any) => {
                                                console.log("Xoay màn hình không được hỗ trợ hoặc bị chặn:", e);
                                            });
                                        }
                                    } else {
                                        if (document.exitFullscreen) {
                                            await document.exitFullscreen();
                                            // 🔓 Trả lại quyền xoay tự do
                                            if (window.screen && (window.screen as any).orientation && (window.screen as any).orientation.unlock) {
                                                (window.screen as any).orientation.unlock();
                                            }
                                        }
                                    }
                                } catch (err) {
                                    console.error("Fullscreen error:", err);
                                }
                            }
                        }}
                        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                    </button>
                </div>
            </div>
          </div>
        );
      })() : (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#5a6a5e', fontSize: 14, gap: 12 }}>
           <div className="pulse-icon" style={{ marginBottom: 10 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15.66 15c1.11 0 2.01-.9 2.01-2.01V6.01C17.67 4.9 16.77 4 15.66 4H4c-1.11 0-2.01.9-2.01 2.01v6.98C1.99 14.1 2.89 15 4 15h11.66zM17.67 8.5l4.34-3.5v14l-4.34-3.5v-7z"/></svg>
           </div>
           <span>Đang chờ tín hiệu từ OBS...</span>
           <button 
              onClick={() => { setLkToken(""); setTimeout(() => window.location.reload(), 100); }}
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: '#22c55e', padding: '8px 16px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 800, marginTop: 10 }}
           >
              LÀM MỚI TRÌNH PHÁT
           </button>
        </div>
      )}
      <RoomAudioRenderer />
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .lmd-root * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important; box-sizing: border-box; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
  .lmd-root { background: #0c0f0e; min-height: 100vh; color: #fff; padding-bottom: 80px; }
   .lmd-container { max-width: 1250px; margin: 0 auto; padding: 20px 10px; width: 100%; overflow: hidden; }
   @media (max-width: 768px) { .lmd-container { padding: 12px 10px; } }
  
  /* Breadcrumbs */
  .lmd-breadcrumb { color: #5a6a5e; font-size: 13px; font-weight: 600; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  @media (max-width: 768px) { .lmd-breadcrumb { font-size: 11px; margin-bottom: 16px; } }
  .lmd-breadcrumb a { color: #5a6a5e; text-decoration: none; }
  .lmd-breadcrumb a:hover { color: #22c55e; }
  .lmd-breadcrumb span { color: #fff; }

  /* Stream Section */
   .lmd-stream-wrap { display: grid; grid-template-columns: 1fr 350px; gap: 20px; margin-bottom: 32px; min-height: 550px; }
   @media (max-width: 1024px) { 
     .lmd-stream-wrap { grid-template-columns: 1fr; min-height: auto; height: auto; gap: 12px; margin-bottom: 24px; } 
   }
  
  .lmd-video-area { background: #000; border-radius: 16px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; width: 100%; }
  @media (max-width: 768px) { 
    .lmd-video-area { border-radius: 0; border: none; margin: 0 -10px; width: calc(100% + 20px); } 
  }
  
  .lmd-video-player { width: 100%; background: #000; display: flex; align-items: center; justify-content: center; position: relative; aspect-ratio: 16/9; overflow: hidden; }
  @media (max-width: 768px) { .lmd-video-player { min-height: 210px; } }
  .lmd-video-placeholder { color: #5a6a5e; font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .lmd-video-play-btn { width: 64px; height: 64px; border-radius: 50%; background: #22c55e; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #000; box-shadow: 0 0 30px rgba(34,197,94,0.4); }
  @media (max-width: 768px) { .lmd-video-play-btn { width: 48px; height: 48px; } }
  
   .lmd-video-controls { background: #1a1e1d; padding: 12px 20px; display: flex; align-items: center; gap: 12px; border-top: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap; }
   @media (max-width: 768px) { .lmd-video-controls { padding: 10px; gap: 8px; flex-wrap: nowrap; overflow-x: auto; white-space: nowrap; scrollbar-width: none; } .lmd-video-controls::-webkit-scrollbar { display: none; } }
   
   .lmd-server-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #7a8c7e; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; }
  .lmd-server-btn.active { background: #22c55e; color: #000; border-color: #22c55e; }

  .lmd-chat-area { background: #1a1e1d; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; overflow: hidden; height: 100%; }
  @media (max-width: 1024px) { .lmd-chat-area { height: 400px; } }
  @media (max-width: 768px) { .lmd-chat-area { border-radius: 12px; } }
  
  .lmd-chat-header { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 10px; }
  .lmd-chat-header h3 { margin: 0; font-size: 14px; font-weight: 900; text-transform: uppercase; color: #fff; letter-spacing: 0.5px; }
  .lmd-chat-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }
  
  .lmd-chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; scrollbar-width: thin; scrollbar-color: #22c55e transparent; }
  .lmd-msg { display: flex; flex-direction: column; gap: 4px; }
  .lmd-msg-user { font-size: 12px; font-weight: 900; color: #22c55e; }
  .lmd-msg-text { font-size: 13px; color: #ddd; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 0 12px 12px 12px; max-width: 90%; }
  
  .lmd-chat-input-wrap { padding: 16px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 10px; }
  .lmd-chat-input { flex: 1; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 16px; color: #fff; font-size: 13px; }
  .lmd-chat-input:focus { outline: none; border-color: #22c55e; }
  .lmd-chat-send { background: #22c55e; color: #000; border: none; width: 40px; height: 40px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

  /* Match Header Card */
  .lmd-header-card { background: #1a1e1d; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 24px; display: flex; flex-direction: column; align-items: center; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
  @media (max-width: 768px) { .lmd-header-card { padding: 24px 16px; border-radius: 12px; } }
  
  .lmd-header-top { display: grid; grid-template-columns: 1fr auto 1fr; width: 100%; align-items: center; gap: 40px; margin-bottom: 32px; }
  @media (max-width: 768px) { .lmd-header-top { gap: 16px; margin-bottom: 24px; } }
  
  .lmd-header-team { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; }
  @media (max-width: 768px) { .lmd-header-team { gap: 10px; } }
  
  .lmd-header-logo { width: 80px; height: 80px; object-fit: contain; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4)); }
  @media (max-width: 768px) { .lmd-header-logo { width: 52px; height: 52px; } }
  
  .lmd-header-name { font-size: 24px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
  @media (max-width: 768px) { .lmd-header-name { font-size: 14px; line-height: 1.2; } }
  
  .lmd-header-score-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .lmd-header-score { font-size: 72px; font-weight: 900; color: #22c55e; letter-spacing: -4px; line-height: 1; text-shadow: 0 0 30px rgba(34,197,94,0.4); }
  @media (max-width: 768px) { .lmd-header-score { font-size: 36px; letter-spacing: -1px; } }
  
  .lmd-header-status { background: rgba(34,197,94,0.1); color: #22c55e; padding: 6px 16px; border-radius: 100px; font-size: 14px; font-weight: 800; text-transform: uppercase; border: 1px solid rgba(34,197,94,0.2); }
  @media (max-width: 768px) { .lmd-header-status { font-size: 11px; padding: 4px 10px; } }
  
  .lmd-header-scorers { display: grid; grid-template-columns: 1fr 1fr; width: 100%; gap: 80px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; }
  @media (max-width: 768px) { .lmd-header-scorers { gap: 20px; padding-top: 16px; } }
  
  .lmd-scorer-list { display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #7a8c7e; }
  @media (max-width: 768px) { .lmd-scorer-list { font-size: 11px; } }
  
  .lmd-scorer-item { display: flex; align-items: center; gap: 8px; font-weight: 500; }
  .lmd-scorer-item b { color: #fff; font-weight: 700; }

  /* Main Layout: Multi-column */
  .lmd-main-layout { display: grid; grid-template-columns: 320px 1fr; gap: 24px; align-items: flex-start; }
  @media(max-width: 1024px) { .lmd-main-layout { grid-template-columns: 1fr; } }
  
  /* Sidebar */
  .lmd-sidebar { display: flex; flex-direction: column; gap: 24px; }
  .lmd-side-card { background: #1a1e1d; border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
  @media (max-width: 768px) { .lmd-side-card { border-radius: 12px; padding: 16px; } }
  
  .lmd-side-title { color: #5a6a5e; font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; }
  .lmd-info-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.02); }
  .lmd-info-l { color: #7a8c7e; font-size: 13px; font-weight: 600; }
  .lmd-info-v { color: #fff; font-size: 13px; font-weight: 800; text-align: right; }

  /* Content Tabs Wrapper */
  .lmd-tabs-wrap { background: #1a1e1d; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
  @media (max-width: 768px) { .lmd-tabs-wrap { border-radius: 12px; } }
  
   .lmd-tab-list { display: flex; background: rgba(0,0,0,0.15); border-bottom: 1px solid rgba(255,255,255,0.05); overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
   @media (max-width: 768px) { 
      .lmd-tab-list { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: none; } 
   }
   .lmd-tab-list::-webkit-scrollbar { display: none; }
   
   .lmd-tab-btn { flex: 1; min-width: 100px; background: transparent; border: none; padding: 20px 10px; color: #5a6a5e; font-size: 13px; font-weight: 800; cursor: pointer; position: relative; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.05); }
   @media (max-width: 768px) { .lmd-tab-btn { padding: 12px 5px; font-size: 10px; min-width: 0; } }
  
  .lmd-tab-btn.active { color: #fff; background: rgba(255,255,255,0.02); }
  .lmd-tab-btn.active::after { content: ''; position: absolute; bottom: 0; left: 15%; right: 15%; height: 3px; background: #22c55e; border-radius: 3px 3px 0 0; }
  
  /* Tactical Pitch */
  .lmd-pitch-area { padding: 40px 24px; display: flex; flex-direction: column; align-items: center; }
  @media (max-width: 768px) { .lmd-pitch-area { padding: 24px 12px; } }
  
  .lmd-pitch { background: #0f2d19; border-radius: 16px; width: 100%; aspect-ratio: 0.72; max-width: 600px; position: relative; border: 4px solid rgba(255,255,255,0.1); box-shadow: inset 0 0 120px rgba(0,0,0,0.6); overflow: hidden; }
  @media (max-width: 768px) { .lmd-pitch { border-radius: 8px; border-width: 2px; } }
  
  .pitch-pattern { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 10% 10%; }
  .pitch-v-line { position: absolute; top: 50%; left: 0; right: 0; height: 3px; background: rgba(255,255,255,0.1); }
  .pitch-v-circle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140px; height: 140px; border: 3px solid rgba(255,255,255,0.1); border-radius: 50%; }
  @media (max-width: 768px) { .pitch-v-circle { width: 80px; height: 80px; } }
  
  .player-slot { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 5; }
  @media (max-width: 768px) { .player-slot { gap: 4px; } }
  
  .player-photo-wrap { position: relative; cursor: pointer; }
  .player-img { width: 52px; height: 52px; border-radius: 50%; background: #252a29; border: 2.5px solid #fff; object-fit: cover; box-shadow: 0 6px 16px rgba(0,0,0,0.6); transition: transform 0.2s; }
  @media (max-width: 768px) { .player-img { width: 32px; height: 32px; border-width: 1.5px; } }
  
  .player-photo-wrap:hover .player-img { transform: scale(1.15); border-color: #22c55e; }
  .player-rt { position: absolute; bottom: -4px; right: -8px; background: #22c55e; color: #000; font-size: 11px; font-weight: 900; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #1a1e1d; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
  @media (max-width: 768px) { .player-rt { width: 16px; height: 16px; font-size: 8px; bottom: -2px; right: -4px; border-width: 1px; } }
  
  .player-num { position: absolute; top: -5px; right: -5px; background: #fff; color: #000; font-size: 9px; font-weight: 900; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1.5px solid #000; }
  @media (max-width: 768px) { .player-num { width: 12px; height: 12px; font-size: 6px; top: -2px; right: -2px; border-width: 1px; } }
  
  .player-name-p { color: #fff; font-size: 11px; font-weight: 700; text-align: center; white-space: nowrap; text-shadow: 0 2px 6px rgba(0,0,0,0.9); background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 4px; }
  @media (max-width: 768px) { .player-name-p { font-size: 8px; padding: 1px 4px; } }

  /* Stats View */
  .lmd-stats-v { padding: 32px; display: flex; flex-direction: column; gap: 24px; }
  @media (max-width: 768px) { .lmd-stats-v { padding: 16px; gap: 16px; } }
  
  .lmd-st-row { display: flex; flex-direction: column; gap: 8px; }
  .lmd-st-head { display: flex; justify-content: space-between; align-items: center; padding: 0 8px; }
  .lmd-st-val { font-size: 15px; font-weight: 900; color: #fff; width: 45px; }
  .lmd-st-label { color: #7a8c7e; font-size: 12px; font-weight: 800; text-transform: uppercase; text-align: center; flex: 1; letter-spacing: 0.5px; }
  .lmd-st-bar-bg { height: 8px; background: rgba(255,255,255,0.03); border-radius: 100px; display: flex; overflow: hidden; }
  .lmd-st-bar { height: 100%; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
  
  /* Timeline v3 */
  .lmd-tl-container { padding: 48px; position: relative; }
  @media (max-width: 768px) { .lmd-tl-container { padding: 24px 12px; } }
  
  .lmd-tl-line { position: absolute; left: 50%; top: 48px; bottom: 48px; width: 2px; background: rgba(255,255,255,0.06); transform: translateX(-50%); }
  @media (max-width: 768px) { .lmd-tl-line { left: 22px; transform: none; top: 24px; bottom: 24px; } }
  
  .lmd-tl-row { display: flex; width: 100%; margin-bottom: 32px; position: relative; align-items: center; }
  @media (max-width: 768px) { .lmd-tl-row { margin-bottom: 20px; } }
  
  .lmd-tl-content { flex: 1; display: flex; }
  .lmd-tl-content.l { justify-content: flex-end; padding-right: 48px; }
  .lmd-tl-content.r { justify-content: flex-start; padding-left: 48px; }
  @media (max-width: 768px) { 
    .lmd-tl-content.l, .lmd-tl-content.r { justify-content: flex-start; padding: 0 0 0 44px; }
    .lmd-tl-content.l.hidden { display: none; }
    .lmd-tl-content.r.hidden { display: none; }
  }
  
  .lmd-tl-center { width: 44px; height: 44px; background: #0c0f0e; border: 2px solid #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; color: #22c55e; z-index: 2; box-shadow: 0 0 12px rgba(34,197,94,0.3); }
  @media (max-width: 768px) { .lmd-tl-center { width: 32px; height: 32px; font-size: 10px; } }
  
  .lmd-tl-card { background: #252a29; border: 1px solid rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 12px; display: flex; align-items: center; gap: 14px; min-width: 200px; box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
  @media (max-width: 768px) { .lmd-tl-card { padding: 8px 12px; min-width: 150px; gap: 10px; width: 100%; } }
  
  .lmd-tl-icon { font-size: 20px; }
  @media (max-width: 768px) { .lmd-tl-icon { font-size: 16px; } }
  
  .lmd-tl-pname { font-size: 14px; font-weight: 800; color: #fff; }
  @media (max-width: 768px) { .lmd-tl-pname { font-size: 12px; } }
  
  .lmd-tl-pinfo { font-size: 12px; color: #7a8c7e; font-weight: 500; }
  @media (max-width: 768px) { .lmd-tl-pinfo { font-size: 10px; } }
  
   .lmd-upcoming-link { text-decoration: none; color: inherit; display: block; }
   .lmd-upcoming-link:hover .lmd-upcoming-card { background: rgba(255,255,255,0.05) !important; border-color: rgba(34,197,94,0.3) !important; }

   .lmd-upcoming-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
   @media (max-width: 768px) { .lmd-upcoming-grid { grid-template-columns: 1fr; gap: 20px; } }

   /* Hide LiveKit Meeting UI elements */
   .lk-disconnect-button, .lk-chat-toggle { display: none !important; }
   .lk-control-bar { background: rgba(0,0,0,0.8) !important; border-top: 1px solid rgba(255,255,255,0.05) !important; }
`;

const TabBtn = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
  <button className={`lmd-tab-btn ${active ? 'active' : ''}`} onClick={onClick}>{label}</button>
)

const SectionSkeleton = ({ height = 200 }) => (
  <div className="skeleton-container" style={{ height, width: '100%', borderRadius: 16, overflow: 'hidden', position: 'relative', background: 'rgba(255,255,255,0.02)' }}>
    <div className="skeleton-shimmer" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 24 }}>
      <div style={{ height: 20, width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
      <div style={{ height: 40, width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
      <div style={{ height: 12, width: '80%', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
      <div style={{ height: 12, width: '60%', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
    </div>
    <style>{`
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .skeleton-shimmer {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
        animation: shimmer 1.5s infinite;
      }
    `}</style>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <div className="lmd-info-row">
    <span className="lmd-info-l">{label}</span>
    <span className="lmd-info-v">{value}</span>
  </div>
)

const PlayerSlot = ({ p, pos, teamColor }: any) => {
  const photoUrl = getImageUrl(null, 'avatar', p.player?.id);
  const rating = p.statistics?.rating || p.avgRating || null;
  return (
    <div className="player-slot" style={{ left: pos.x, top: pos.y }}>
       <div className="player-photo-wrap">
          <img src={photoUrl} className="player-img" style={{ borderColor: teamColor }} onError={(e: any) => e.target.src = 'https://www.sofascore.com/static/images/placeholders/player.png'} />
          {rating && (
            <div className="player-rt" style={{ background: rating >= 7 ? '#22c55e' : rating >= 6 ? '#eab308' : '#ef4444' }}>
              {rating}
            </div>
          )}
          <div className="player-num">{p.jerseyNumber}</div>
       </div>
       <span className="player-name-p">{p.player.shortName || p.player.name}</span>
    </div>
  )
}

// Sử dụng memo để đảm bảo StreamSection không bị render lại khi dữ liệu trận đấu (tỉ số, stats) cập nhật
const StreamSection: any = React.memo(({ matchId, API }: { matchId: string, API: string }): JSX.Element => {
    const [selectedServer, setSelectedServer] = useState(1);
    const [lkToken, setLkToken] = useState("");
    const LK_SERVER_URL = "wss://phuiscore-lhf9kjp2.livekit.cloud";

    useEffect(() => {
        const fetchPublicToken = async () => {
            console.log("[Viewer] 🔑 Đang lấy Token cho phòng:", matchId);
            try {
                const res = await fetch(`${API}/media/public-token?room=${matchId}`);
                const json = await res.json();
                if (json.success) {
                    setLkToken(json.token);
                }
            } catch (e) {
                console.error("Public Token Error:", e);
            }
        };
        fetchPublicToken();
    }, [matchId, API]);
    const Room = LiveKitRoom as any;

    return (
        <div className="lmd-stream-wrap">
            <div className="lmd-video-area">
                <div className="lmd-video-player" style={{ minHeight: 500 }}>
                    {lkToken ? (
                        <Room
                            video={false}
                            audio={false}
                            token={lkToken}
                            serverUrl={LK_SERVER_URL}
                            connect={true}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <Monitor setLkToken={setLkToken} />
                        </Room>
                    ) : (
                        <div className="lmd-video-placeholder">
                            <div className="lmd-video-play-btn">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                            <span>Đang chuẩn bị luồng trực tiếp...</span>
                        </div>
                    )}
                </div>
                <div className="lmd-video-controls">
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#5a6a5e' }}>SERVER:</span>
                    <button className="lmd-server-btn active">LIVEKIT PRO (TRỰC TIẾP)</button>
                    <button className="lmd-server-btn">SAO LƯU 1</button>
                </div>
            </div>

            <div className="lmd-chat-area">
                <div className="lmd-chat-header">
                    <div className="lmd-chat-dot" />
                    <h3>Trò chuyện trực tiếp</h3>
                </div>
                <div className="lmd-chat-messages">
                    <div className="lmd-msg">
                        <span className="lmd-msg-user">Hệ thống</span>
                        <span className="lmd-msg-text">Luồng video LiveKit đã sẵn sàng!</span>
                    </div>
                </div>
                <div className="lmd-chat-input-wrap">
                    <input type="text" className="lmd-chat-input" placeholder="Nhập tin nhắn..." />
                    <button className="lmd-chat-send">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </button>
                </div>
            </div>
        </div>
    )
}, (prevProps, nextProps) => prevProps.matchId === nextProps.matchId);

export default function LiveMatchDetailScreen({ matchId, overrideDate, initialData }: { matchId: string, overrideDate?: string, initialData?: any }) {
  const [match, setMatch] = useState<any>(initialData || null)
  const [activeTab, setActiveTab] = useState('lineup')
  const [liveMinute, setLiveMinute] = useState('')
  const [loadingStandings, setLoadingStandings] = useState(false)
  const searchParams = useSearchParams()
  const isLiveMode = (
    searchParams.get('type') === 'live' || 
    ['inprogress', 'live', 'streaming'].includes(match?.status?.type || match?.status) ||
    ['inprogress', 'live'].includes(match?.liveStatus)
  ) && match?.status !== 'finished' && match?.liveStatus !== 'finished';
  
  console.log("[Viewer] 🔴 Trạng thái Live:", { 
    isLiveMode, 
    status: match?.status, 
    liveStatus: match?.liveStatus,
    typeParam: searchParams.get('type') 
  });
  
  const API = API_BASE

  // 🔌 THIẾT LẬP SOCKET.IO
  useEffect(() => {
    const { socket } = require('../../utils/socket')
    
    socket.connect()
    console.log('[Socket] 📡 Đang kết nối...')

    socket.on('connect', () => {
        console.log('[Socket] ✅ Đã kết nối thành công!')
    })

    socket.on('scoreUpdate', (updatedData: any) => {
        // Chỉ cập nhật nếu trùng matchId đang xem
        if (String(updatedData.matchId) === String(matchId)) {
            console.log('[Socket] ⚽ Cập nhật tỉ số/trạng thái mới:', updatedData)
            setMatch((prev: any) => ({
                ...prev,
                ...updatedData,
                status: updatedData.liveStatus || updatedData.status || prev.status
            }))
        }
    })

    return () => {
        socket.off('matchUpdate')
        socket.disconnect()
    }
  }, [matchId])

  const fetchStandings = async () => {
    // Aggressive ID search
    const tid = match?.tournamentId || 
                match?.tournament?.uniqueTournament?.id || 
                match?.tournament?.id || 
                match?.info?.tournamentId || 
                match?.info?.tournament?.id ||
                (match?.gsi1_pk ? String(match.gsi1_pk).replace('TOURNAMENT#', '') : null);
    
    // Đảm bảo tid là số hợp lệ trước khi gọi API (tránh lỗi NaN trên server)
    const isValidTid = tid && !isNaN(Number(tid));
    
    if (!isValidTid || loadingStandings) {
      console.log('[Standings] ⚠️ Bỏ qua fetch vì ID không hợp lệ hoặc đang tải:', { tid, loadingStandings });
      return;
    }

    setLoadingStandings(true)
    try {
      console.log(`[Standings] 🔄 Đang lấy BXH cho giải ${tid}...`);
      const res = await fetch(`${API}/standings/${tid}?refresh=true`)
      const json = await res.json()
      if (json.success) {
        setMatch((prev: any) => ({ 
          ...prev, 
          standingsData: json.data,
          standings: json.data.standings || (Array.isArray(json.data) ? json.data : []),
          tournamentName: (json.data.tournamentInfo?.name && json.data.tournamentInfo.name !== 'Giải đấu') 
            ? json.data.tournamentInfo.name 
            : prev.tournamentName,
          tournamentLogo: getImageUrl(json.data.tournamentInfo?.logo || prev.tournamentLogo, 'logo', tid)
        }))
      }
    } catch (e) {
      console.error('Fetch standings error:', e)
    } finally {
      setLoadingStandings(false)
    }
  }

  // 🏆 TỰ ĐỘNG TẢI BXH KHI CHUYỂN TAB
  useEffect(() => {
    const tid = match?.tournamentId || 
                match?.tournament?.uniqueTournament?.id || 
                match?.tournament?.id || 
                match?.info?.tournamentId || 
                match?.info?.tournament?.id ||
                (match?.gsi1_pk ? String(match.gsi1_pk).replace('TOURNAMENT#', '') : null);
    if (activeTab === 'bxh' && (!match?.standingsData) && tid) {
      fetchStandings()
    }
  }, [activeTab, match?.tournamentId, match?.tournament?.id, match?.tournament?.uniqueTournament?.id])

  useEffect(() => {
    if (!match?.time?.currentPeriodStartTimestamp) {
        setLiveMinute(match?.currentMinute || 'Live')
        return
    }

    const updateClock = () => {
        const now = Math.floor(Date.now() / 1000)
        const elapsedSec = (now - match.time.currentPeriodStartTimestamp) + (match.time.initial || 0)
        const m = Math.floor(elapsedSec / 60) + 1
        
        if (m > 90) setLiveMinute('90+')
        else if (m > 45 && (match.time.initial || 0) < 2700) setLiveMinute('45+')
        else setLiveMinute(`${m}'`)
    }

    updateClock()
    const timer = setInterval(updateClock, 10000)
    return () => clearInterval(timer)
  }, [match?.time, match?.currentMinute])

  const matchDate = overrideDate || searchParams.get('date') || new Date().toISOString().split('T')[0]

  const fetchDetail = async () => {
    try {
      console.log(`[API] 🔄 Đang tải lại chi tiết trận ${matchId}...`);
      const res = await fetch(`${API}/matches/detail/${matchId}?date=${matchDate}`)
      const json = await res.json()
      if (json.success && json.data) {
        setMatch((prev: any) => {
          const newData = { ...json.data };
          // Nếu tên giải đấu mới là "Giải đấu" hoặc rỗng, hãy giữ lại tên cũ
          if (!newData.tournamentName || newData.tournamentName === 'Giải đấu') {
             newData.tournamentName = prev.tournamentName;
          }
          return { ...prev, ...newData };
        });
      }
    } catch (e) {}
  }

  useEffect(() => {
    // 🔌 Lắng nghe Socket để cập nhật Real-time
    const { socket } = require('../../utils/socket')
    const handleUpdate = (data: any) => {
        if (String(data.matchId) === String(matchId)) {
            console.log('[Socket] 🚀 Nhận tín hiệu đã cào xong! Đang làm mới dữ liệu...');
            fetchDetail();
        }
    }
    
    socket.on('matchUpdated', handleUpdate);

    // Chỉ fetch nếu chưa có dữ liệu chi tiết từ Server-side
    if (!initialData || !initialData.statistics) {
        fetchDetail()
    }

    const interval = setInterval(fetchDetail, 60000)
    return () => {
        clearInterval(interval);
        socket.off('matchUpdated', handleUpdate);
    }
  }, [matchId, matchDate, API, initialData])

  // Mặc định cho phép render khung layout trước, thông số load sau
  const stats = match?.statistics?.[0]?.groups?.flatMap((g: any) => g.statisticsItems) || []
  const incidents = [...(match?.incidents || [])].sort((a,b) => b.time - a.time)
  
  const homeScorers = incidents.filter(n => (n.team === 'home' || n.incidentClass === 'home') && (n.type === 'goal' || n.incidentType === 'goal'))
  const awayScorers = incidents.filter(n => (n.team === 'away' || n.incidentClass === 'away') && (n.type === 'goal' || n.incidentType === 'goal'))

  return (
    <div className="lmd-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="lmd-container">
        
        <div className="lmd-breadcrumb">
          <a href="/">Trang chủ</a> 
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          <a href="/live">Trực tiếp</a> 
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          <span>{match?.homeTeam?.name || '...'} vs {match?.awayTeam?.name || '...'}</span>
        </div>

        {isLiveMode && <StreamSection matchId={matchId} API={API} />}

        {/* Match Header Section */}
        <div className="lmd-header-card">
           <div className="lmd-header-top">
              <div className="lmd-header-team">
                 <img src={getImageUrl(match?.homeTeam?.logo, 'logo', match?.homeTeam?.id)} className="lmd-header-logo" />
                 <span className="lmd-header-name">{match?.homeTeam?.name || '...'}</span>
              </div>
              <div className="lmd-header-score-wrap">
                 <div className="lmd-header-score">{(() => {
                        const h = match?.score?.home ?? match?.homeScore;
                        const a = match?.score?.away ?? match?.awayScore;
                        const getVal = (v: any) => (typeof v === 'object' && v !== null) ? (v.current ?? v.display ?? 0) : (v ?? 0);
                        return `${getVal(h)} - ${getVal(a)}`;
                    })()}</div>
                 <div className="lmd-header-status">{liveMinute}</div>
              </div>
              <div className="lmd-header-team">
                 <img src={getImageUrl(match?.awayTeam?.logo, 'logo', match?.awayTeam?.id)} className="lmd-header-logo" />
                 <span className="lmd-header-name">{match?.awayTeam?.name || '...'}</span>
              </div>
           </div>

           <div className="lmd-header-scorers">
              <div className="lmd-scorer-list">
                 {homeScorers.map((s, i) => (
                    <div key={i} className="lmd-scorer-item">
                       <b>{s.player?.shortName || s.player?.name || s.player}</b>
                       <span>{s.time}' {s.isOwnGoal ? '(OG)' : ''}</span>
                    </div>
                 ))}
              </div>
              <div className="lmd-scorer-list" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                 {awayScorers.map((s, i) => (
                    <div key={i} className="lmd-scorer-item">
                       <span>{s.time}' {s.isOwnGoal ? '(OG)' : ''}</span>
                       <b>{s.player?.shortName || s.player?.name || s.player}</b>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="lmd-main-layout">
           
           {/* Left Sidebar */}
           <div className="lmd-sidebar">
              <div className="lmd-side-card">
                 <div className="lmd-side-title">THÔNG TIN TRẬN ĐẤU</div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <InfoRow label="Giải đấu" value={typeof match.tournamentName === 'string' ? match.tournamentName : 'Giải đấu'} />
                    <InfoRow label="Vòng đấu" value={match.info?.round || match.round || 'N/A'} />
                    <InfoRow label="Sân vận động" value={match.info?.venue || match.stadium || 'N/A'} />
                    <InfoRow label="Trọng tài" value={match.info?.referee || 'N/A'} />
                 </div>
              </div>
              
              <div className="lmd-side-card">
                 <div className="lmd-side-title">AI SẼ THẮNG?</div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                       <span>{typeof match.homeTeam?.name === 'string' ? match.homeTeam.name : 'Đội Nhà'}</span>
                       <span style={{ color: '#22c55e' }}>45%</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                       <div style={{ width: '45%', background: '#22c55e' }} />
                       <div style={{ width: '20%', background: '#5a6a5e' }} />
                       <div style={{ width: '35%', background: '#ef4444' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                       <span style={{ color: '#ef4444' }}>35%</span>
                       <span>{typeof match.awayTeam?.name === 'string' ? match.awayTeam.name : 'Đội Khách'}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Main Content Areas */}
           <div className="lmd-content-main">
              <div className="lmd-tabs-wrap">
                 <div className="lmd-tab-list">
                    <TabBtn active={activeTab === 'lineup'} label="Đội hình" onClick={() => setActiveTab('lineup')} />
                    <TabBtn active={activeTab === 'stats'} label="Thông số" onClick={() => setActiveTab('stats')} />
                    <TabBtn active={activeTab === 'summary'} label="Diễn biến" onClick={() => setActiveTab('summary')} />
                    <TabBtn active={activeTab === 'bxh'} label="BXH" onClick={() => setActiveTab('bxh')} />
                    <TabBtn active={activeTab === 'h2h'} label="Đối đầu" onClick={() => setActiveTab('h2h')} />
                    <TabBtn active={activeTab === 'upcoming'} label="Lịch đấu" onClick={() => setActiveTab('upcoming')} />
                  </div>

                 <div className="lmd-tab-content">
                    {activeTab === 'lineup' && (
                       <div className="lmd-pitch-area">
                          {match.lineups ? (
                             <>
                                <div className="lmd-pitch">
                                   <div className="pitch-pattern" />
                                   <div className="pitch-v-line" />
                                   <div className="pitch-v-circle" />
                                   
                                   {/* Home Players */}
                                   {(match.lineups.home?.players || []).filter((p: any) => !p.substitute).map((p: any, i: number) => {
                                      // Simple demo mapping for 4-3-3 if no coords
                                      const rows = [1, 4, 3, 3];
                                      let rowIdx = 0, colIdx = 0, count = 0;
                                      for(let r=0; r<rows.length; r++) {
                                         if(i < count + rows[r]) { rowIdx = r; colIdx = i - count; break; }
                                         count += rows[r];
                                      }
                                      const x = `${(colIdx + 1) * (100 / (rows[rowIdx] + 1))}%`;
                                      const y = `${90 - (rowIdx * 12)}%`;
                                      return <PlayerSlot key={`h-${i}`} p={p} pos={{x,y}} teamColor="#22c55e" />
                                   })}

                                   {/* Away Players */}
                                   {(match.lineups?.away?.players || []).filter((p: any) => !p.substitute).map((p: any, i: number) => {
                                      const rows = [1, 4, 3, 3];
                                      let rowIdx = 0, colIdx = 0, count = 0;
                                      for(let r=0; r<rows.length; r++) {
                                         if(i < count + rows[r]) { rowIdx = r; colIdx = i - count; break; }
                                         count += rows[r];
                                      }
                                      const x = `${(colIdx + 1) * (100 / (rows[rowIdx] + 1))}%`;
                                      const y = `${10 + (rowIdx * 12)}%`;
                                      return <PlayerSlot key={`a-${i}`} p={p} pos={{x,y}} teamColor="#ef4444" />
                                   })}
                                </div>
                                 {/* Substitutes List */}
                                 <div className="lmd-subs-grid" style={{ display: 'grid', gap: 32, marginTop: 48, width: '100%' }}>
                                     <style>{`
                                        .lmd-subs-grid { grid-template-columns: 1fr 1fr; }
                                        @media (max-width: 768px) { .lmd-subs-grid { grid-template-columns: 1fr; gap: 24px; } }
                                     `}</style>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                         <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 900, borderBottom: '2px solid #22c55e', paddingBottom: 8 }}>DỰ BỊ {match.homeTeam.name.toUpperCase()}</div>
                                         {match.lineups?.home?.players?.filter((p: any) => p.substitute).map((p: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                               <img src={`https://api.sofascore.app/api/v1/player/${p.player.id}/image`} style={{ width: 32, height: 32, borderRadius: '50%', background: '#252a29' }} />
                                               <span style={{ fontSize: 14 }}>{p.player.name}</span>
                                               <span style={{ marginLeft: 'auto', color: '#7a8c7e', fontSize: 12 }}>{p.jerseyNumber}</span>
                                            </div>
                                         ))}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                         <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 900, borderBottom: '2px solid #ef4444', paddingBottom: 8, textAlign: 'right' }}>DỰ BỊ {match.awayTeam.name.toUpperCase()}</div>
                                         {match.lineups?.away?.players?.filter((p: any) => p.substitute).map((p: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', flexDirection: 'row-reverse' }}>
                                               <img src={`https://api.sofascore.app/api/v1/player/${p.player.id}/image`} style={{ width: 32, height: 32, borderRadius: '50%', background: '#252a29' }} />
                                               <span style={{ fontSize: 14 }}>{p.player.name}</span>
                                               <span style={{ marginRight: 'auto', color: '#7a8c7e', fontSize: 12 }}>{p.jerseyNumber}</span>
                                            </div>
                                         ))}
                                      </div>
                                 </div>
                              </>
                           ) : (
                              <SectionSkeleton height={600} />
                           )}
                        </div>
                     )}

                     {activeTab === 'stats' && (
                        <div className="lmd-stats-v">
                           {stats.length > 0 ? stats.map((s: any, i: number) => {
                              const hStr = String(s.homeValue || '0');
                              const aStr = String(s.awayValue || '0');
                              
                              const h = parseFloat(hStr.replace('%', ''));
                              const a = parseFloat(aStr.replace('%', ''));
                              
                              const total = h + a || 1;
                              const hPct = (h / total) * 100;
                              const aPct = (a / total) * 100;
                              
                              // SofaScore specific: higher is usually better, but not always (e.g. fouls)
                              const isLowerBetter = s.name?.toLowerCase().includes('fouls') || s.name?.toLowerCase().includes('cards');
                              const isHomeBetter = isLowerBetter ? h < a : h > a;
                              const isAwayBetter = isLowerBetter ? a < h : a > h;

                              return (
                                 <div key={i} className="lmd-st-row" style={{ marginBottom: 12 }}>
                                    <div className="lmd-st-head" style={{ marginBottom: 6 }}>
                                       <span className="lmd-st-val" style={{ 
                                          color: isHomeBetter ? '#22c55e' : (isAwayBetter ? '#5a6a5e' : '#fff'),
                                          fontSize: 14,
                                          fontWeight: isHomeBetter ? '900' : '700'
                                       }}>{hStr}</span>
                                       
                                       <span className="lmd-st-label" style={{ 
                                          fontSize: 11, 
                                          color: '#888',
                                          letterSpacing: 0.5
                                       }}>{s.name}</span>
                                       
                                       <span className="lmd-st-val" style={{ 
                                          textAlign: 'right', 
                                          color: isAwayBetter ? '#22c55e' : (isHomeBetter ? '#5a6a5e' : '#fff'),
                                          fontSize: 14,
                                          fontWeight: isAwayBetter ? '900' : '700'
                                       }}>{aStr}</span>
                                    </div>
                                    <div style={{ height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 3 }}>
                                       <div style={{ 
                                          width: '50%', 
                                          display: 'flex', 
                                          flexDirection: 'row-reverse',
                                          height: '100%'
                                       }}>
                                          <div className="lmd-st-bar" style={{ 
                                             width: `${hPct}%`, 
                                             background: isHomeBetter ? '#22c55e' : '#5a6a5e',
                                             borderRadius: '3px 0 0 3px',
                                             opacity: isHomeBetter ? 1 : 0.4
                                          }} />
                                       </div>
                                       <div style={{ 
                                          width: '50%', 
                                          display: 'flex', 
                                          height: '100%'
                                       }}>
                                          <div className="lmd-st-bar" style={{ 
                                             width: `${aPct}%`, 
                                             background: isAwayBetter ? '#22c55e' : '#5a6a5e',
                                             borderRadius: '0 3px 3px 0',
                                             opacity: isAwayBetter ? 1 : 0.4
                                          }} />
                                       </div>
                                    </div>
                                 </div>
                              )
                           }) : (
                              <div style={{ padding: 80, textAlign: 'center', opacity: 0.3, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                 <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto' }}><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                                 <span>Chưa có thông số chi tiết cho trận đấu này</span>
                              </div>
                           )}
                        </div>
                     )}

                     {activeTab === 'summary' && (
                        <div className="lmd-tl-container">
                           <div className="lmd-tl-line" />
                           {incidents.map((n: any, i: number) => {
                              const isHome = n.team === 'home' || n.incidentClass === 'home';
                              const type = n.type || n.incidentType;
                              let icon = '⚽';
                              if (type === 'card') icon = n.color === 'red' ? '🟥' : '🟨';
                              if (type === 'substitution') icon = '🔄';
                              
                              return (
                                 <div key={i} className="lmd-tl-row">
                                    <div className={`lmd-tl-content l ${!isHome ? 'hidden' : ''}`}>
                                       {isHome && (
                                          <div className="lmd-tl-card">
                                             <span className="lmd-tl-icon">{icon}</span>
                                             <div>
                                                <div className="lmd-tl-pname">{n.player?.name || n.player}</div>
                                                <div className="lmd-tl-pinfo">
                                                   {type === 'substitution' ? `Vào: ${n.playerIn?.name}` : n.assist ? `Hỗ trợ: ${n.assist?.name}` : ''}
                                                </div>
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                   <div className="lmd-tl-center">{n.time}'</div>
                                    <div className={`lmd-tl-content r ${isHome ? 'hidden' : ''}`}>
                                       {!isHome && (
                                          <div className="lmd-tl-card">
                                             <span className="lmd-tl-icon">{icon}</span>
                                             <div>
                                                <div className="lmd-tl-pname">{n.player?.name || n.player}</div>
                                                <div className="lmd-tl-pinfo">
                                                   {type === 'substitution' ? `Vào: ${n.playerIn?.name}` : n.assist ? `Hỗ trợ: ${n.assist?.name}` : ''}
                                                </div>
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              )
                           })}
                        </div>
                     )}

                     {activeTab === 'bxh' && (
                        <div className="lmd-bxh-section" style={{ padding: '0 0 40px' }}>
                           <style>{`
                                @media (max-width: 768px) {
                                   .lmd-bxh-section { padding: 0 0 20px !important; }
                                   .lmd-bxh-card { border-radius: 0 !important; border-left: none !important; border-right: none !important; }
                                   .lmd-bxh-table th:nth-child(4), .lmd-bxh-table td:nth-child(4),
                                   .lmd-bxh-table th:nth-child(5), .lmd-bxh-table td:nth-child(5),
                                   .lmd-bxh-table th:nth-child(6), .lmd-bxh-table td:nth-child(6),
                                   .lmd-bxh-table th:nth-child(7), .lmd-bxh-table td:nth-child(7) { display: none; }
                                }
                            `}</style>
                            {(() => {
                               // Check for knockout stage
                               const roundName = match.info?.roundName?.toLowerCase() || '';
                               const isKnockoutMatch = match.info?.cupRoundType || 
                                  roundName.includes('final') || 
                                  roundName.includes('quarter') || 
                                  roundName.includes('semi') || 
                                  roundName.includes('round of') ||
                                  roundName.includes('knockout') ||
                                  roundName.includes('playoff') ||
                                  roundName.includes('1/8') ||
                                  roundName.includes('1/4') ||
                                  roundName.includes('1/2');

                               // Try to get standings list
                               let standingsList: any[] = [];
                               if (match.standingsData?.standings) standingsList = match.standingsData.standings;
                               else if (Array.isArray(match.standings)) standingsList = match.standings;
                               else if (match.standingsData && Array.isArray(match.standingsData)) standingsList = match.standingsData;

                               if (standingsList.length > 0 && standingsList[0].team && standingsList[0].rank) {
                                  standingsList = [{ name: 'Bảng xếp hạng', rows: standingsList }];
                               }

                               // Try to get knockout data
                               const knockoutData = match.standingsData?.knockoutData;

                               if (isKnockoutMatch && !standingsList.length && knockoutData) {
                                  // RENDER KNOCKOUT BRACKET (Simplified view)
                                  return (
                                     <div style={{ padding: 24 }}>
                                        <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 900, marginBottom: 20, borderBottom: '2px solid #22c55e', paddingBottom: 8 }}>SƠ ĐỒ THI ĐẤU (KNOCKOUT)</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                           {knockoutData.map((round: any, ri: number) => (
                                              <div key={ri}>
                                                 <div style={{ fontSize: 11, fontWeight: 900, color: '#5a6a5e', marginBottom: 12, textTransform: 'uppercase' }}>{round.roundName || round.name}</div>
                                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                    {round.matches?.slice(0, 4).map((m: any, mi: number) => (
                                                       <div key={mi} style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                             <span style={{ fontSize: 12, fontWeight: 600 }}>{m.homeTeam.name}</span>
                                                             <span style={{ fontWeight: 900, color: '#22c55e' }}>{m.homeScore}</span>
                                                          </div>
                                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                             <span style={{ fontSize: 12, fontWeight: 600 }}>{m.awayTeam.name}</span>
                                                             <span style={{ fontWeight: 900, color: '#22c55e' }}>{m.awayScore}</span>
                                                          </div>
                                                       </div>
                                                    ))}
                                                 </div>
                                              </div>
                                           ))}
                                        </div>
                                     </div>
                                  );
                               }

                               if (isKnockoutMatch && !standingsList.length && !knockoutData) {
                                  return (
                                     <div style={{ padding: 80, textAlign: 'center', opacity: 0.5, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto' }}><path d="M12 2v20M17 5v14M7 5v14"/></svg>
                                        <span>Trận đấu này thuộc vòng loại trực tiếp. Hiện chưa có dữ liệu sơ đồ thi đấu.</span>
                                        <button onClick={() => { fetchDetail(); fetchStandings(); }} style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid #22c55e', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Thử tải lại</button>
                                     </div>
                                  );
                               }

                               // Handle dynamic group selection
                               let sData: any = null;
                               for (const group of standingsList) {
                                  const groupRows = group.rows || [];
                                  const hasTeam = groupRows.some((row: any) => 
                                     String(row.team?.id) === String(match.homeTeam?.id) || 
                                     String(row.team?.id) === String(match.awayTeam?.id)
                                  );
                                  if (hasTeam) {
                                     sData = group;
                                     break;
                                  }
                               }
                               if (!sData && standingsList.length > 0) sData = standingsList[0];

                               const rows = sData?.rows || null;
                               
                               if (!rows) return (
                                  <div style={{ padding: 40 }}>
                                     {loadingStandings ? (
                                        <SectionSkeleton height={400} />
                                     ) : (
                                        <div style={{ textAlign: 'center', opacity: 0.5 }}>
                                           <p>Không tìm thấy dữ liệu bảng xếp hạng.</p>
                                           <button onClick={fetchStandings} style={{ marginTop: 12, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid #22c55e', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Tải lại BXH</button>
                                        </div>
                                     )}
                                  </div>
                               );
                               
                              const legendMap = new Map();
                              rows.forEach((row: any) => {
                                 if (row.description) {
                                    let color = '#f59e0b'; // default orange
                                    const desc = row.description.toLowerCase();
                                    if (desc.includes('champions league')) color = '#22c55e';
                                    else if (desc.includes('europa league') || desc.includes('cup')) color = '#3b82f6';
                                    else if (desc.includes('promotion')) color = '#14b8a6';
                                    else if (desc.includes('relegation')) color = '#ef4444';
                                    
                                    if (!legendMap.has(row.description)) legendMap.set(row.description, color);
                                 }
                              });
                              const legends = Array.from(legendMap.entries());

                              return (
                                 <div className="lmd-bxh-card" style={{ background: '#1a1e1d', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                     <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <div 
                                           style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'opacity 0.2s', opacity: loadingStandings ? 0.6 : 1 }}
                                           onClick={fetchStandings}
                                           title="Nhấn để cập nhật BXH"
                                        >
                                           <img src={getImageUrl(match.tournamentLogo, 'logo', match.tournamentId || match.tournament?.uniqueTournament?.id)} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                                           <span style={{ 
                                              fontSize: 13, 
                                              fontWeight: 900, 
                                              color: loadingStandings ? '#22c55e' : '#fff', 
                                              textTransform: 'uppercase', 
                                              letterSpacing: 0.5,
                                              borderBottom: '1px dashed rgba(255,255,255,0.2)'
                                           }}>
                                              {match.tournamentName}
                                              {loadingStandings ? ' (ĐANG TẢI...)' : ''}
                                           </span>
                                        </div>
                                        {(sData.name || sData.type) && <span style={{ fontSize: 11, fontWeight: 700, color: '#5a6a5e', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: 6 }}>{sData.name || sData.type}</span>}
                                     </div>

                                     <div style={{ overflowX: 'auto' }}>
                                        <table className="lmd-bxh-table" style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
                                           <thead>
                                              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                 <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 10, fontWeight: 900, color: '#5a6a5e', width: 40 }}>#</th>
                                                 <th style={{ padding: '12px 0', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#5a6a5e' }}>ĐỘI BÓNG</th>
                                                 <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: 10, fontWeight: 900, color: '#5a6a5e', width: 40 }}>P</th>
                                                 <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: 10, fontWeight: 900, color: '#5a6a5e', width: 40 }}>+/-</th>
                                                 <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 10, fontWeight: 900, color: '#22c55e', width: 50 }}>PTS</th>
                                              </tr>
                                           </thead>
                                           <tbody>
                                              {rows.map((row: any, i: number) => {
                                                 const isHome = String(row.team?.id) === String(match.homeTeam?.id);
                                                 const isAway = String(row.team?.id) === String(match.awayTeam?.id);
                                                 const isCurrent = isHome || isAway;
                                                 
                                                 // Position logic color
                                                 let posColor = '#7a8c7e';
                                                 let indicatorColor = 'transparent';

                                                 if (row.description) {
                                                    indicatorColor = legendMap.get(row.description) || '#f59e0b';
                                                 } else {
                                                    // Fallback basic rules
                                                    if (row.rank <= 4) posColor = '#22c55e';
                                                    else if (row.rank >= rows.length - 2) posColor = '#ef4444';
                                                 }

                                                 return (
                                                    <tr key={i} style={{ 
                                                       background: isCurrent ? 'rgba(34,197,94,0.08)' : 'transparent',
                                                       borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                       transition: 'background 0.2s'
                                                    }} className="lmd-bxh-row">
                                                       <td style={{ padding: '14px 0', textAlign: 'center', position: 'relative' }}>
                                                          {indicatorColor !== 'transparent' && (
                                                             <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: indicatorColor, borderRadius: '0 4px 4px 0' }} />
                                                          )}
                                                          <span style={{ fontSize: 13, fontWeight: 900, color: isCurrent ? '#fff' : posColor }}>{row.rank}</span>
                                                       </td>
                                                       <td style={{ padding: '14px 0' }}>
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                             <img src={getImageUrl(row.team.logo, 'logo', row.team.id)} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                                                             <span style={{ 
                                                                fontSize: 13, 
                                                                fontWeight: isCurrent ? 900 : 600, 
                                                                color: isCurrent ? '#22c55e' : (isHome || isAway ? '#fff' : '#ddd') 
                                                             }}>{row.team?.name}</span>
                                                          </div>
                                                       </td>
                                                       <td style={{ textAlign: 'center', fontSize: 13, color: '#7a8c7e' }}>{row.mp}</td>
                                                       <td style={{ textAlign: 'center', fontSize: 13, color: (row.gd || 0) > 0 ? '#22c55e' : ((row.gd || 0) < 0 ? '#ef4444' : '#7a8c7e') }}>
                                                          {(row.gd || 0) > 0 ? `+${row.gd}` : row.gd}
                                                       </td>
                                                       <td style={{ textAlign: 'center', fontSize: 14, fontWeight: 900, color: isCurrent ? '#22c55e' : '#fff' }}>{row.pts}</td>
                                                    </tr>
                                                 )
                                              })}
                                           </tbody>
                                        </table>
                                     </div>
                                     
                                     {legends.length > 0 && (
                                        <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.1)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                           {legends.map(([desc, color], idx) => (
                                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                 <div style={{ width: 8, height: 8, borderRadius: 2, background: color as string }} />
                                                 <span style={{ fontSize: 10, color: '#5a6a5e', fontWeight: 700, textTransform: 'uppercase' }}>{desc}</span>
                                              </div>
                                           ))}
                                        </div>
                                     )}
                                  </div>
                               );
                            })()}
                         </div>
                     )}

                     {activeTab === 'h2h' && (
                        <div style={{ padding: 32 }} className="lmd-h2h-section">
                           <style>{`
                               @media (max-width: 768px) {
                                  .lmd-h2h-section { padding: 16px !important; }
                                  .lmd-h2h-row { grid-template-columns: repeat(3, 1fr) !important; gap: 12px !important; padding: 12px !important; }
                                  .lmd-h2h-row > div:nth-child(1), .lmd-h2h-row > div:nth-child(2), .lmd-h2h-row > div:nth-child(3) { display: none !important; }
                               }
                            `}</style>
                           {match.h2h ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                 <div style={{ background: 'rgba(255,255,255,0.03)', padding: 24, borderRadius: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                       <span style={{ color: '#22c55e' }}>{match.homeTeam.name} ({match.h2h.teamWins?.home || 0})</span>
                                       <span style={{ color: '#7a8c7e' }}>{match.h2h.draws || 0} HÒA</span>
                                       <span style={{ color: '#ef4444' }}>({match.h2h.teamWins?.away || 0}) {match.awayTeam.name}</span>
                                    </div>
                                    <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.05)' }}>
                                       {(() => {
                                          const h = match.h2h.teamWins?.home || 0;
                                          const d = match.h2h.draws || 0;
                                          const a = match.h2h.teamWins?.away || 0;
                                          const total = h + d + a || 1;
                                          return (
                                             <>
                                                <div style={{ width: `${(h/total)*100}%`, background: '#22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.3)' }} />
                                                <div style={{ width: `${(d/total)*100}%`, background: '#7a8c7e' }} />
                                                <div style={{ width: `${(a/total)*100}%`, background: '#ef4444', boxShadow: '0 0 10px rgba(239,68,68,0.3)' }} />
                                             </>
                                          )
                                       })()}
                                    </div>
                                 </div>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                     {match.h2h.matches?.slice(0, 10).map((m: any, i: number) => {
                                        const hScore = m.homeScore?.display ?? 0;
                                        const aScore = m.awayScore?.display ?? 0;
                                        const isHomeActual = m.homeTeam?.id === match.homeTeam?.id;
                                        const isAwayActual = m.awayTeam?.id === match.homeTeam?.id;
                                        
                                        let result = 'D';
                                        let resColor = '#7a8c7e';
                                        if (hScore > aScore) {
                                           if (isHomeActual) { result = 'W'; resColor = '#22c55e'; }
                                           else if (isAwayActual) { result = 'L'; resColor = '#ef4444'; }
                                        } else if (aScore > hScore) {
                                           if (isHomeActual) { result = 'L'; resColor = '#ef4444'; }
                                           else if (isAwayActual) { result = 'W'; resColor = '#22c55e'; }
                                        }

                                        return (
                                           <div key={i} className="lmd-h2h-row" style={{ display: 'grid', gridTemplateColumns: '32px 80px 140px 1fr 30px 70px 30px 1fr', alignItems: 'center', padding: '14px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, gap: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
                                              <div style={{ width: 24, height: 24, borderRadius: 6, background: resColor, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, boxShadow: `0 0 8px ${resColor}44` }}>{result}</div>
                                              <div style={{ fontSize: 11, color: '#5a6a7e', fontWeight: 700 }}>{new Date(m.startTimestamp * 1000).toLocaleDateString('vi-VN')}</div>
                                              <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 800, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }} title={m.tournament?.name}>{m.tournament?.name}</div>
                                              <div style={{ textAlign: 'right', fontWeight: hScore > aScore ? '900' : '600', fontSize: 13, color: hScore > aScore ? '#fff' : '#7a8c7e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.homeTeam?.name}</div>
                                              <img src={getImageUrl(m.homeTeam?.logo, 'logo', m.homeTeam?.id)} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '4px 0', borderRadius: 6, fontWeight: '900', fontSize: 13, border: '1px solid rgba(255,255,255,0.05)' }}>{hScore} - {aScore}</div>
                                              <img src={getImageUrl(m.awayTeam?.logo, 'logo', m.awayTeam?.id)} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                              <div style={{ textAlign: 'left', fontWeight: aScore > hScore ? '900' : '600', fontSize: 13, color: aScore > hScore ? '#fff' : '#7a8c7e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.awayTeam?.name}</div>
                                           </div>
                                        )
                                     })}
                                 </div>
                              </div>
                            ) : (
                               <SectionSkeleton height={500} />
                            )}
                        </div>
                     )}

                     {activeTab === 'upcoming' && (
                        <div style={{ padding: 24 }}>
                           {!match.nextMatches ? (
                              <SectionSkeleton height={500} />
                           ) : (
                           <div className="lmd-upcoming-grid">
                              {/* Home Next */}
                              <div>
                                 <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 900, marginBottom: 16, borderBottom: '2px solid #22c55e', paddingBottom: 8 }}>LỊCH THI ĐẤU {match.homeTeam.name.toUpperCase()}</div>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {match.nextMatches?.home?.slice(0, 5).map((m: any, i: number) => (
                                       <Link key={i} href={`/truc-tiep/${generateMatchSlug(m.homeTeam.name, m.awayTeam.name, new Date(m.startTimestamp * 1000).toISOString().split('T')[0], m.id)}`} className="lmd-upcoming-link">
                                           <div className="lmd-upcoming-card" style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.2s' }}>
                                              <div style={{ fontSize: 11, color: '#5a6a5e', marginBottom: 8 }}>{new Date(m.startTimestamp * 1000).toLocaleString('vi-VN')} • {m.tournament.name}</div>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                                    <img src={getImageUrl(m.homeTeam?.logo, 'logo', m.homeTeam?.id)} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                                    <span style={{ fontWeight: 700, fontSize: 13 }}>{m.homeTeam.name}</span>
                                                 </div>
                                                 <span style={{ color: '#22c55e', fontWeight: 900, fontSize: 12, margin: '0 12px' }}>VS</span>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexDirection: 'row-reverse', textAlign: 'right' }}>
                                                    <img src={getImageUrl(m.awayTeam?.logo, 'logo', m.awayTeam?.id)} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                                    <span style={{ fontWeight: 700, fontSize: 13 }}>{m.awayTeam.name}</span>
                                                 </div>
                                              </div>
                                           </div>
                                        </Link>
                                    ))}
                                    {(!match.nextMatches?.home || match.nextMatches.home.length === 0) && <div style={{ opacity: 0.3, fontSize: 13 }}>Không có lịch thi đấu sắp tới</div>}
                                 </div>
                              </div>

                              {/* Away Next */}
                              <div>
                                 <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 900, marginBottom: 16, borderBottom: '2px solid #ef4444', paddingBottom: 8 }}>LỊCH THI ĐẤU {match.awayTeam.name.toUpperCase()}</div>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {match.nextMatches?.away?.slice(0, 5).map((m: any, i: number) => (
                                       <Link key={i} href={`/truc-tiep/${generateMatchSlug(m.homeTeam.name, m.awayTeam.name, new Date(m.startTimestamp * 1000).toISOString().split('T')[0], m.id)}`} className="lmd-upcoming-link">
                                           <div className="lmd-upcoming-card" style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.2s' }}>
                                              <div style={{ fontSize: 11, color: '#5a6a5e', marginBottom: 8 }}>{new Date(m.startTimestamp * 1000).toLocaleString('vi-VN')} • {m.tournament.name}</div>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                                    <img src={getImageUrl(m.homeTeam?.logo, 'logo', m.homeTeam?.id)} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                                    <span style={{ fontWeight: 700, fontSize: 13 }}>{m.homeTeam.name}</span>
                                                 </div>
                                                 <span style={{ color: '#22c55e', fontWeight: 900, fontSize: 12, margin: '0 12px' }}>VS</span>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexDirection: 'row-reverse', textAlign: 'right' }}>
                                                    <img src={getImageUrl(m.awayTeam?.logo, 'logo', m.awayTeam?.id)} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                                    <span style={{ fontWeight: 700, fontSize: 13 }}>{m.awayTeam.name}</span>
                                                 </div>
                                              </div>
                                           </div>
                                        </Link>
                                    ))}
                                    {(!match.nextMatches?.away || match.nextMatches.away.length === 0) && <div style={{ opacity: 0.3, fontSize: 13 }}>Không có lịch thi đấu sắp tới</div>}
                                 </div>
                              </div>
                           </div>
                           )}
                        </div>
                     )}
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  )
}
