import React, { useState, useEffect, useRef } from 'react'
import { 
  LiveKitRoom, 
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { getImageUrl } from '../../utils/image'

// Component phụ để hiển thị Video Grid mà không bị lỗi TS
function Monitor() {
  // Lấy chỉ duy nhất track Camera từ OBS (Tránh hiện 2 ô khi OBS gửi cả ScreenShare)
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false }
  ]).filter(t => t.participant.identity.includes('obs_'));

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      {tracks.length > 0 ? (
        <GridLayout tracks={tracks} style={{ height: '100%' }}>
          <ParticipantTile />
        </GridLayout>
      ) : (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a6a5e', fontSize: 14 }}>
           Đang chờ tín hiệu từ OBS...
        </div>
      )}
      <RoomAudioRenderer />
    </div>
  );
}

// Định nghĩa kiểu cho IVS Player (để tránh lỗi TS khi dùng window.IVSPlayer)
declare global {
  interface Window {
    IVSPlayer: any;
  }
}

interface LiveControlProps {
  API: string;
  showToast: (m: string) => void;
}

const USE_MOCK_STREAM = process.env.NEXT_PUBLIC_USE_MOCK_STREAM === 'true' || true;
const MOCK_PLAYBACK_URL = "https://www.facebook.com/bongdasomedia.blvnhattocvang/videos/1268866832063949";

export function LiveControl({ API, showToast }: LiveControlProps) {
  const [matches, setMatches] = useState<any[]>([])
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // LiveKit States
  const [lkToken, setLkToken] = useState<string>("");
  const LK_SERVER_URL = "wss://phuiscore-lhf9kjp2.livekit.cloud";

  // Stream States
  const [streamData, setStreamData] = useState<any>(null)
  const [isLive, setIsLive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [streamHealth, setStreamHealth] = useState({ bitrate: 0, latency: 0, fps: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)

  // 1. Tải SDK Amazon IVS (Dành cho VOD/Replay sau này)
  useEffect(() => {
    const script = document.createElement('script')
    script.src = "https://player.live-video.net/1.24.0/amazon-ivs-player.min.js"
    script.async = true
    script.onload = () => console.log("IVS Player SDK Loaded")
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  // 2. Lọc danh sách trận đấu
  const filteredMatches = matches.filter(m => {
    const query = searchQuery.toLowerCase();
    return (
      m.id?.toString().includes(query) ||
      m.homeTeam?.name?.toLowerCase().includes(query) ||
      m.awayTeam?.name?.toLowerCase().includes(query) ||
      m.tournamentName?.toLowerCase().includes(query)
    );
  });

  // 2. Khởi tạo Player khi chọn trận có luồng phát
  useEffect(() => {
    const url = selectedMatch?.playbackUrl || (USE_MOCK_STREAM && selectedMatch ? MOCK_PLAYBACK_URL : null);
    
    if (url && window.IVSPlayer) {
      if (playerRef.current) playerRef.current.delete()
      
      const PlayerFactory = window.IVSPlayer;
      if (!PlayerFactory.isPlayerSupported) {
        showToast("Trình duyệt không hỗ trợ IVS Player")
        return
      }

      const player = PlayerFactory.create();
      player.attachHTMLVideoElement(videoRef.current);
      player.load(url);
      player.play();
      
      player.addEventListener(PlayerFactory.PlayerEventType.STATE_CHANGED, (state: any) => {
        if (state === PlayerFactory.PlayerState.PLAYING) setIsLive(true)
      });

      // Lắng nghe sức khỏe luồng
      const healthInterval = setInterval(() => {
        const stats = player.getQuality();
        if (stats) {
          setStreamHealth({
            bitrate: Math.round(player.getLiveLatency() * 1000), // Demo: Latency
            latency: Math.round(player.getLiveLatency() * 1000),
            fps: 60
          })
        }
      }, 3000);

      playerRef.current = player;
      return () => {
        clearInterval(healthInterval)
        player.delete()
      }
    }
  }, [selectedMatch?.playbackUrl])

  const fetchLiveMatches = async () => {
    setLoading(true)
    try {
      const now = new Date();
      const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const today = vnTime.toISOString().split('T')[0];
      
      const res = await fetch(`${API}/matches/${today}`)
      const json = await res.json()
      
      if (json.success && Array.isArray(json.data)) {
        const allMatches = json.data.flatMap((league: any) => league.matches || [])
        const live = allMatches.filter((m: any) => {
          const status = m.status?.type || m.status;
          return status === 'inprogress' || status === 'live' || status === 'notstarted'
        })
        setMatches(live)
      }
    } catch (e) {
      showToast("Lỗi tải danh sách trận!")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveMatches()

    // 🚀 SOCKET: Lắng nghe cập nhật tỉ số real-time
    const { io } = require('socket.io-client');
    const socket = io(API.replace('/api', '')); // Kết nối tới domain server

    socket.on('scoreUpdate', (data: any) => {
      // Cập nhật danh sách matches
      setMatches(prev => prev.map(m => m.id === data.matchId ? { ...m, ...data } : m));
      // Nếu đang chọn trận này thì cập nhật selectedMatch
      if (selectedMatch?.id === data.matchId) {
        setSelectedMatch((prev: any) => ({ ...prev, ...data }));
      }
    });

    return () => { socket.disconnect(); }
  }, [selectedMatch?.id])

  const handleStartStream = async () => {
    if (!selectedMatch) return
    try {
      showToast("Đang khởi tạo luồng Preview...");
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/media/livekit-token?room=${selectedMatch.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.success) {
        setLkToken(json.token)
        if (json.ingress) {
            setStreamData(json.ingress); 
            showToast("Đã lấy Stream Key cho OBS! 🚀");
        } else if (json.ingressError) {
            console.error("Ingress Error from Server:", json.ingressError);
            showToast(`Cảnh báo: Không thể tạo Ingress (${json.ingressError}). Hãy kiểm tra LiveKit Cloud.`);
        }
      }
    } catch (e) {
      console.error("Start Stream Error:", e);
      showToast("Lỗi khi khởi tạo Preview!");
    }
  }

  const handleGoLive = async () => {
    if (!selectedMatch) return;
    try {
      const token = localStorage.getItem('token');
      const now = new Date();
      const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const today = vnTime.toISOString().split('T')[0];

      // Lấy ngày chuẩn từ pk của trận đấu (ví dụ: DATE#2024-04-30 -> 2024-04-30)
      const matchDate = selectedMatch.pk ? selectedMatch.pk.replace('DATE#', '') : today;

      console.log("[Broadcaster] 🚀 Gửi lệnh phát live:", {
        date: matchDate,
        matchId: selectedMatch.id,
        sk: selectedMatch.sk,
        scores: { h: selectedMatch.score?.home, a: selectedMatch.score?.away }
      });

      showToast("Đang phát sóng trực tiếp...");
      
      const matchId = selectedMatch.id || (selectedMatch.sk ? selectedMatch.sk.replace('MATCH#', '') : null);

      const res = await fetch(`${API}/media/update-score`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          date: matchDate,
          matchId: matchId,
          homeScore: selectedMatch.score?.home ?? selectedMatch.homeScore ?? 0,
          awayScore: selectedMatch.score?.away ?? selectedMatch.awayScore ?? 0,
          currentMinute: "1'",
          liveStatus: 'inprogress'
        })
      });

      if (res.ok) {
        setIsLive(true);
        showToast("TRẬN ĐẤU ĐÃ LÊN SÓNG! 🔴");
        fetchLiveMatches();
      }
    } catch (e) {
      showToast("Lỗi khi phát sóng!");
    }
  }

  const handleEndStream = async () => {
    if (!selectedMatch) return;
    
    const isConfirmed = window.confirm("Bạn có chắc chắn muốn kết thúc trận đấu và dừng phát sóng?");
    if (!isConfirmed) return;

    try {
      showToast("Đang xử lý kết thúc luồng...");
      const token = localStorage.getItem('token');
      
      // Lấy ngày hiện tại (VN) để tìm đúng Record trong DynamoDB
      const now = new Date();
      const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const today = vnTime.toISOString().split('T')[0];

      // Gửi yêu cầu cập nhật trạng thái 'finished'
      const res = await fetch(`${API}/media/update-score`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          date: today,
          matchId: selectedMatch.id,
          homeScore: selectedMatch.score?.home ?? selectedMatch.homeScore ?? 0,
          awayScore: selectedMatch.score?.away ?? selectedMatch.awayScore ?? 0,
          currentMinute: "FT",
          liveStatus: 'finished'
        })
      });
      
      if (res.ok) {
        setLkToken("");
        setStreamData(null);
        showToast("Đã kết thúc Livestream thành công! ✅");
        fetchLiveMatches();
        setSelectedMatch(null);
      } else {
        const error = await res.json();
        console.error("End stream error:", error);
        
        // Nếu lỗi do ngày không khớp hoặc record không tồn tại, vẫn cho phép kết thúc ở UI
        if (confirm(`Lỗi từ Server: ${error.message || "Không thể cập nhật trạng thái"}. Bạn có muốn buộc kết thúc trên giao diện không?`)) {
            setLkToken("");
            setStreamData(null);
            setSelectedMatch(null);
            showToast("Đã buộc kết thúc trên giao diện! ⚠️");
        }
      }
    } catch (e) {
      console.error("End stream catch:", e);
      showToast("Lỗi kết nối khi kết thúc luồng!");
    }
  }

  const handleStartIVS = async () => {
    if (!selectedMatch) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/media/start-stream`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ matchId: selectedMatch.id, matchName: `${selectedMatch.homeTeam.name} vs ${selectedMatch.awayTeam.name}` })
      })
      const json = await res.json()
      if (json.success) {
        setStreamData(json)
        setSelectedMatch({ ...selectedMatch, playbackUrl: json.playbackUrl })
        showToast("Đã khởi tạo luồng IVS thành công!")
      }
    } catch (e) {
      showToast("Lỗi khi khởi tạo luồng!")
    }
  }

  const updateScore = async (h: number, a: number, min: string) => {
    if (!selectedMatch) return
    try {
      const token = localStorage.getItem('token')
      const now = new Date();
      const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const today = vnTime.toISOString().split('T')[0];

      const matchDate = selectedMatch.pk ? selectedMatch.pk.replace('DATE#', '') : today;

      const matchId = selectedMatch.id || (selectedMatch.sk ? selectedMatch.sk.replace('MATCH#', '') : null);

      const res = await fetch(`${API}/media/update-score`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          date: matchDate,
          matchId: matchId,
          homeScore: h,
          awayScore: a,
          currentMinute: min,
          liveStatus: 'inprogress'
        })
      })
      if (res.ok) {
        showToast("Đã cập nhật tỉ số!")
        setSelectedMatch({ ...selectedMatch, score: { home: h, away: a }, currentMinute: min })
        
        // Gửi Metadata vào luồng (nếu đang live)
        if (selectedMatch.playbackUrl) {
            fetch(`${API}/media/send-metadata`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelArn: streamData?.channelArn,
                    metadata: { type: 'score', home: h, away: a, minute: min }
                })
            }).catch(() => {});
        }
      }
    } catch (e) {
      showToast("Lỗi khi cập nhật!")
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      {!selectedMatch ? (
        /* Match List View - Grid of Premium Cards */
        <div className="md-card animate-fade-in" style={{ padding: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <div>
              <h3 className="md-section-title" style={{ fontSize: 28, margin: 0 }}>TRUNG TÂM ĐIỀU PHỐI TRẬN ĐẤU</h3>
              <p style={{ color: '#5a6a5e', fontSize: 14, marginTop: 5 }}>Hệ thống quản lý tỉ số và livestream thời gian thực</p>
            </div>
            <div style={{ width: 450 }}>
                <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Tìm theo ID, đội bóng hoặc tên giải đấu..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: 15, padding: '14px 25px', borderRadius: 16, background: 'rgba(255,255,255,0.03)' }}
                />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 25 }}>
            {filteredMatches.map(m => (
              <div 
                key={m.id} 
                className="md-match-card-premium"
                onClick={() => setSelectedMatch(m)}
              >
                <div className="card-header">
                   <span className="tournament-tag">{m.tournamentName || 'GIẢI ĐẤU TỰ DO'}</span>
                   <span className={`status-tag ${m.status?.type || m.status}`}>
                      {m.status?.type === 'inprogress' || m.status === 'inprogress' ? '● LIVE' : 'SẮP ĐÁ'}
                   </span>
                </div>
                
                <div className="card-body">
                  <div className="team">
                    <img src={getImageUrl(m.homeTeam?.logo, 'logo', m.homeTeam?.id)} alt="Home" />
                    <span>{m.homeTeam?.name}</span>
                  </div>
                  
                  <div className="score-area">
                    <div className="score">{(m.score?.home ?? m.homeScore) || 0} - {(m.score?.away ?? m.awayScore) || 0}</div>
                    <div className="time">{m.currentMinute || "00'"}</div>
                  </div>

                  <div className="team">
                    <img src={getImageUrl(m.awayTeam?.logo, 'logo', m.awayTeam?.id)} alt="Away" />
                    <span>{m.awayTeam?.name}</span>
                  </div>
                </div>

                <div className="card-footer">
                  <span>ID: #{m.id}</span>
                  <button className="select-btn">ĐIỀU KHIỂN</button>
                </div>
              </div>
            ))}
          </div>

          {filteredMatches.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '120px 0', opacity: 0.3 }}>
                <div style={{ fontSize: 60, marginBottom: 20 }}>🏟️</div>
                <div style={{ fontWeight: 900, fontSize: 20 }}>KHÔNG TÌM THẤY TRẬN ĐẤU</div>
                <p style={{ marginTop: 10 }}>Vui lòng thử lại với từ khóa khác</p>
            </div>
          )}

          <button className="md-btn md-btn-outline" style={{ width: '100%', marginTop: 40, padding: 15 }} onClick={fetchLiveMatches}>
            LÀM MỚI DANH SÁCH TRẬN ĐẤU
          </button>
        </div>
      ) : (
        /* Focused Broadcast Mode */
        <div className="md-card animate-fade-in" style={{ padding: 40, minHeight: '80vh' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <div>
              <button 
                onClick={() => {
                   if (lkToken && !confirm("Livestream đang diễn ra, bạn có chắc chắn muốn quay lại danh sách?")) return;
                   setSelectedMatch(null);
                }}
                style={{ 
                   background: 'rgba(255,255,255,0.05)', border: 'none', color: '#7a8c7e', 
                   padding: '10px 20px', borderRadius: 12, cursor: 'pointer', marginBottom: 20,
                   fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10,
                   transition: 'all 0.2s'
                }}
              >
                ← QUAY LẠI DANH SÁCH
              </button>
              <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1.5, color: '#fff' }}>BẢNG ĐIỀU KHIỂN SẢN XUẤT</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 15px #22c55e' }} />
                  <div style={{ color: '#22c55e', fontWeight: 900, fontSize: 18, textTransform: 'uppercase' }}>
                     {selectedMatch.homeTeam?.name || '...'} <span style={{ color: '#fff', opacity: 0.3, margin: '0 10px' }}>VS</span> {selectedMatch.awayTeam?.name || '...'}
                  </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 15 }}>
              <button className="md-btn md-btn-outline" onClick={handleStartStream} style={{ padding: '18px 30px', fontSize: 14 }}>
                {lkToken ? "XEM LẠI STREAM KEY" : "BƯỚC 1: CHUẨN BỊ LUỒNG & LẤY KEY"}
              </button>

              {lkToken && (
                <>
                  {!isLive && (
                    <button className="md-btn" style={{ background: 'linear-gradient(45deg, #ef4444, #b91c1c)', padding: '18px 40px', fontSize: 16, animation: 'pulse 1s infinite' }} onClick={handleGoLive}>
                        BƯỚC 2: PHÁT TRỰC TIẾP (CHO KHÁN GIẢ)
                    </button>
                  )}
                  <button className="md-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#5a6a5e', padding: '18px 40px', fontSize: 16 }} onClick={handleEndStream}>DỪNG / HỦY</button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40 }}>
            {/* Monitor Section */}
            <div style={{ background: '#000', borderRadius: 32, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.05)', aspectRatio: '16/9' }}>
                {lkToken && lkToken !== "mock_token_active" ? (
                    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                        <LiveKitRoom
                            video={false}
                            audio={false}
                            connect={true}
                            token={lkToken}
                            serverUrl={LK_SERVER_URL}
                            onDisconnected={() => setLkToken("")}
                            style={{ height: '100%' }}
                        >
                            {/* Component con để có thể dùng hook của LiveKit */}
                            <Monitor />
                        </LiveKitRoom>
                        {!isLive && (
                            <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(234,179,8,0.9)', color: '#000', padding: '8px 15px', borderRadius: 10, fontSize: 12, fontWeight: 900, zIndex: 100 }}>
                                CHẾ ĐỘ PREVIEW: CHỈ MÌNH BẠN THẤY
                            </div>
                        )}
                    </div>
                ) : lkToken === "mock_token_active" ? (
                    <div style={{ aspectRatio: '16/9', width: '100%' }}>
                        <iframe 
                            src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(MOCK_PLAYBACK_URL)}&show_text=0&width=800`} 
                            style={{ width: '100%', height: '100%', border: 'none' }} 
                            allowFullScreen={true}
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        />
                    </div>
                ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 25, background: 'radial-gradient(circle at center, #1a1a1a, #0a0a0a)' }}>
                         <div className="pulse-icon">
                            <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5"><path d="M15.66 15c1.11 0 2.01-.9 2.01-2.01V6.01C17.67 4.9 16.77 4 15.66 4H4c-1.11 0-2.01.9-2.01 2.01v6.98C1.99 14.1 2.89 15 4 15h11.66zM17.67 8.5l4.34-3.5v14l-4.34-3.5v-7z"/></svg>
                         </div>
                         <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#fff', fontWeight: 900, fontSize: 24, letterSpacing: -1 }}>HỆ THỐNG SẴN SÀNG</div>
                            <div style={{ color: '#5a6a5e', fontSize: 16, marginTop: 8 }}>Nhấn Bước 1 để lấy thông tin cấu hình OBS</div>
                         </div>
                         {USE_MOCK_STREAM && (
                            <button className="md-btn md-btn-outline" onClick={() => setLkToken("mock_token_active")}>CHẾ ĐỘ DEMO (FACEBOOK)</button>
                         )}
                    </div>
                )}
            </div>

            {/* Controls Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
                {/* Real-time Scoreboard */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 32, padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#5a6a5e', marginBottom: 30, letterSpacing: 3 }}>LIVE SCOREBOARD</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
                        <div>
                            <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', marginBottom: 20 }}>{selectedMatch.score?.home ?? selectedMatch.homeScore ?? 0}</div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="score-btn" onClick={() => updateScore((selectedMatch.score?.home ?? selectedMatch.homeScore ?? 0) + 1, selectedMatch.score?.away ?? selectedMatch.awayScore ?? 0, selectedMatch.currentMinute)}>+</button>
                                <button className="score-btn minus" onClick={() => updateScore(Math.max(0, (selectedMatch.score?.home ?? selectedMatch.homeScore ?? 0) - 1), selectedMatch.score?.away ?? selectedMatch.awayScore ?? 0, selectedMatch.currentMinute)}>-</button>
                            </div>
                        </div>
                        <div style={{ fontSize: 40, fontWeight: 900, color: '#22c55e', opacity: 0.3 }}>:</div>
                        <div>
                            <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', marginBottom: 20 }}>{selectedMatch.score?.away ?? selectedMatch.awayScore ?? 0}</div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="score-btn" onClick={() => updateScore(selectedMatch.score?.home ?? selectedMatch.homeScore ?? 0, (selectedMatch.score?.away ?? selectedMatch.awayScore ?? 0) + 1, selectedMatch.currentMinute)}>+</button>
                                <button className="score-btn minus" onClick={() => updateScore(selectedMatch.score?.home ?? selectedMatch.homeScore ?? 0, Math.max(0, (selectedMatch.score?.away ?? selectedMatch.awayScore ?? 0) - 1), selectedMatch.currentMinute)}>-</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Match Clock */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 32, padding: 35 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#5a6a5e', marginBottom: 25, letterSpacing: 3 }}>MATCH CLOCK</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 25 }}>
                        <div style={{ fontSize: 48, fontWeight: 900, color: '#22c55e', minWidth: 100, fontVariantNumeric: 'tabular-nums' }}>{selectedMatch.currentMinute || "1'"}</div>
                        <div style={{ flex: 1, display: 'flex', gap: 15 }}>
                             <input 
                                type="text" 
                                className="form-input" 
                                style={{ borderRadius: 16, textAlign: 'center', fontSize: 18, fontWeight: 800 }} 
                                placeholder="Min" 
                                value={selectedMatch.currentMinute || ''}
                                onChange={(e) => setSelectedMatch({...selectedMatch, currentMinute: e.target.value})}
                             />
                             <button className="md-btn" style={{ padding: '0 30px' }} onClick={() => updateScore(selectedMatch.score?.home ?? selectedMatch.homeScore ?? 0, selectedMatch.score?.away ?? selectedMatch.awayScore ?? 0, selectedMatch.currentMinute)}>CẬP NHẬT</button>
                        </div>
                    </div>
                </div>

                {/* Ingress Settings Modal */}
                {streamData && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <div className="md-card" style={{ width: 600, padding: 40, border: '2px solid #22c55e', position: 'relative' }}>
                            <button 
                                onClick={() => setStreamData(null)}
                                style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#5a6a5e', cursor: 'pointer', fontSize: 24 }}
                            >✕</button>
                            
                            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                                <div style={{ width: 70, height: 70, background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
                                </div>
                                <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: '#fff' }}>CẤU HÌNH OBS PHÁT SÓNG</h3>
                                <p style={{ color: '#5a6a5e', marginTop: 10 }}>Sao chép các thông số dưới đây vào phần cài đặt Stream của OBS</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <div className="form-label">SERVER URL (RTMP)</div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <input readOnly value={streamData.url} className="form-input" style={{ background: 'rgba(0,0,0,0.3)', color: '#22c55e', fontWeight: 700 }} />
                                        <button className="md-btn" onClick={() => { navigator.clipboard.writeText(streamData.url); showToast("Đã copy URL!"); }}>COPY</button>
                                    </div>
                                </div>
                                <div>
                                    <div className="form-label">STREAM KEY</div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <input readOnly value={streamData.streamKey} type="password" id="sk-input" className="form-input" style={{ background: 'rgba(0,0,0,0.3)', color: '#22c55e', fontWeight: 700 }} />
                                        <button className="md-btn" onClick={() => { 
                                            const el = document.getElementById('sk-input') as HTMLInputElement;
                                            el.type = el.type === 'password' ? 'text' : 'password';
                                        }}>XEM</button>
                                        <button className="md-btn" onClick={() => { navigator.clipboard.writeText(streamData.streamKey); showToast("Đã copy Stream Key!"); }}>COPY</button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 40, background: 'rgba(234,179,8,0.05)', padding: 20, borderRadius: 16, border: '1px solid rgba(234,179,8,0.2)' }}>
                                <div style={{ color: '#eab308', fontWeight: 900, fontSize: 11, marginBottom: 5 }}>HƯỚNG DẪN TÁC NGHIỆP:</div>
                                <p style={{ color: '#7a8c7e', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                                    1. Dán URL và Key vào OBS.<br/>
                                    2. Nhấn <b>Start Streaming</b> trong OBS.<br/>
                                    3. Chờ khoảng 10 giây để video hiện lên màn hình Monitor phía sau.<br/>
                                    4. Sau khi thấy video, nhấn nút <b>BƯỚC 2: PHÁT TRỰC TIẾP</b> để công khai luồng cho khán giả.
                                </p>
                            </div>

                            <button 
                                className="md-btn" 
                                style={{ width: '100%', marginTop: 30, padding: 18, fontSize: 15, background: '#22c55e', color: '#000' }}
                                onClick={() => setStreamData(null)}
                            >
                                TÔI ĐÃ HIỂU, ĐÓNG CỬA SỔ NÀY
                            </button>
                        </div>
                    </div>
                )}

                {/* Broadcasting Tip */}
                {lkToken && !isLive && (
                    <div style={{ marginTop: 10, padding: 20, background: 'rgba(234,179,8,0.05)', border: '1px dashed rgba(234,179,8,0.3)', borderRadius: 20 }}>
                        <div style={{ color: '#eab308', fontSize: 12, fontWeight: 900, marginBottom: 5 }}>💡 MẸO TÁC NGHIỆP:</div>
                        <p style={{ color: '#7a8c7e', fontSize: 11, lineHeight: 1.5 }}>
                            Sau khi ấn "Start Streaming" trên OBS, có thể mất khoảng <b>5-10 giây</b> để video đồng bộ lên Monitor. 
                            Nếu quá lâu không thấy gì, hãy thử nhấn nút "Làm mới Monitor" bên dưới.
                        </p>
                        <button 
                            onClick={() => { const t = lkToken; setLkToken(""); setTimeout(() => setLkToken(t), 100); }}
                            style={{ background: 'none', border: 'none', color: '#eab308', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginTop: 10, padding: 0, textDecoration: 'underline' }}
                        >
                            LÀM MỚI MONITOR
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
