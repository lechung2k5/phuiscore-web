import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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

declare var require: any;

// Component phụ để hiển thị Video Grid mà không bị lỗi TS
function Monitor() {
  const [volume, setVolume] = useState(1);
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false }
  ]).filter(t => t.participant.identity.includes('encoder_') || t.participant.identity.includes('host_') || t.participant.identity.includes('obs_'));

  const Tile = ParticipantTile as any;
  const Grid = GridLayout as any;
  const Audio = RoomAudioRenderer as any;

  // Cập nhật âm lượng cho các thẻ audio/video trong monitor
  useEffect(() => {
    const mediaElements = document.querySelectorAll('.monitor-container video, .monitor-container audio');
    mediaElements.forEach((el: any) => {
      el.volume = volume;
    });
  }, [volume, tracks.length]);

  return (
    <div style={{ height: '100%', position: 'relative' }} className="monitor-container">
      {tracks.length > 0 ? (
        <>
          <Grid tracks={tracks} style={{ height: '100%' }}>
            <Tile />
          </Grid>
          {/* Volume Control Overlay */}
          <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(0,0,0,0.7)', padding: '10px 15px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 10, zIndex: 100 }}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
             <input 
               type="range" min="0" max="1" step="0.1" 
               value={volume} 
               onChange={(e) => setVolume(parseFloat(e.target.value))}
               style={{ width: 80, accentColor: '#1ed760', cursor: 'pointer' }}
             />
             <span style={{ fontSize: 10, fontWeight: 800, minWidth: 30, textAlign: 'right' }}>{Math.round(volume * 100)}%</span>
          </div>
        </>
      ) : (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#b3b3b3', gap: 15 }}>
           <div className="spinner-spotify" />
           <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.5 }}>ĐANG CHỜ TÍN HIỆU LUỒNG PHÁT...</span>
        </div>
      )}
      <Audio />
    </div>
  );
}

declare global {
  interface Window {
    IVSPlayer: any;
  }
}

export interface LiveControlProps {
  API: string;
  showToast: (m: string) => void;
  matchId?: string;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
  
  .lc-root {
    font-family: 'Inter', sans-serif;
    background-color: #121212;
    min-height: 100vh;
    color: #ffffff;
    padding: 32px;
  }

  .lc-container {
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Spotify-style Typography */
  h2, h3 { font-weight: 800; letter-spacing: 0.5px; }
  .text-secondary { color: #b3b3b3; font-size: 14px; font-weight: 500; }

  /* Pill Geometry */
  .pill-btn {
    border-radius: 500px;
    border: none;
    font-weight: 700;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    padding: 12px 32px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.3, 0, 0, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .pill-btn-primary { background-color: #1ed760; color: #000; }
  .pill-btn-primary:hover { transform: scale(1.04); background-color: #1fdf64; }
  
  .pill-btn-secondary { background-color: #1f1f1f; color: #fff; border: 1px solid #4d4d4d; }
  .pill-btn-secondary:hover { border-color: #fff; background-color: #2a2a2a; }

  /* Cards */
  .spotify-card {
    background-color: #181818;
    border-radius: 12px;
    padding: 24px;
    box-shadow: rgba(0,0,0,0.5) 0px 8px 24px;
    transition: background-color 0.3s;
  }
  .spotify-card:hover { background-color: #282828; }

  /* Search Input Pill */
  .search-pill {
    background-color: #242424;
    border: none;
    border-radius: 500px;
    padding: 10px 24px;
    color: white;
    width: 100%;
    font-size: 14px;
    font-weight: 500;
    box-shadow: rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset;
  }
  .search-pill:focus { outline: 2px solid #fff; outline-offset: 2px; }

  /* Match Card Premium */
  .m-card {
    background: #181818;
    border-radius: 8px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .m-card:hover { background: #282828; transform: translateY(-4px); }
  
  .m-status-live { 
    color: #1ed760; 
    font-size: 11px; 
    font-weight: 800; 
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #1ed760; animation: pulse 1.5s infinite; }

  /* Controls */
  .control-group {
    background: #1f1f1f;
    border-radius: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .score-display {
    font-size: 84px;
    font-weight: 900;
    letter-spacing: -4px;
    color: #fff;
    line-height: 1;
  }

  .circle-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 1px solid #4d4d4d;
    background: transparent;
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .circle-btn:hover { border-color: #fff; transform: scale(1.1); }
  
  @keyframes pulse {
    0% { opacity: 1; box-shadow: 0 0 0 0 rgba(30, 215, 96, 0.4); }
    70% { opacity: 0.5; box-shadow: 0 0 0 10px rgba(30, 215, 96, 0); }
    100% { opacity: 1; box-shadow: 0 0 0 0 rgba(30, 215, 96, 0); }
  }

  .spinner-spotify {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255,255,255,0.1);
    border-top-color: #1ed760;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Chat UI */
  .lc-chat-area { background: #181818; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; height: 400px; box-shadow: rgba(0,0,0,0.5) 0px 8px 24px; border: 1px solid rgba(255,255,255,0.05); }
  .lc-chat-header { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 10px; }
  .lc-chat-header h3 { margin: 0; font-size: 14px; font-weight: 900; text-transform: uppercase; color: #fff; letter-spacing: 0.5px; }
  .lc-chat-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }
  
  .lc-chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; scrollbar-width: thin; scrollbar-color: #22c55e transparent; }
  .chat-msg-wrapper { display: flex; gap: 10px; margin-bottom: 16px; }
  .chat-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background: #252a29; border: 1px solid rgba(255,255,255,0.1); }
  .chat-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .chat-header { display: flex; align-items: baseline; gap: 6px; }
  .chat-username { font-size: 13px; font-weight: 800; color: #fff; }
  .chat-badge { font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .chat-badge.admin { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); }
  .chat-badge.media { background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.4); }
  .chat-time { font-size: 10px; color: #5a6a5e; margin-left: auto; }
  .chat-text { font-size: 13px; color: #ddd; line-height: 1.4; word-break: break-word; }
  .chat-text.highlight { color: #fff; font-weight: 500; }
  
  .lc-chat-input-wrap { padding: 16px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 10px; }
  .lc-chat-input { flex: 1; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 16px; color: #fff; font-size: 13px; transition: border-color 0.2s; }
  .lc-chat-input:focus { outline: none; border-color: #22c55e; }
  .lc-chat-input:disabled { opacity: 0.5; cursor: not-allowed; }
  .lc-chat-send { background: #22c55e; color: #000; border: none; width: 40px; height: 40px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
  .lc-chat-send:disabled { background: #5a6a5e; cursor: not-allowed; }
  .lc-chat-send:hover:not(:disabled) { background: #2df070; }
`;

const USE_MOCK_STREAM = process.env.NEXT_PUBLIC_USE_MOCK_STREAM === 'true' || true;
const MOCK_PLAYBACK_URL = "https://www.facebook.com/bongdasomedia.blvnhattocvang/videos/1268866832063949";

export function LiveControl({ API, showToast, matchId }: LiveControlProps) {
  const router = useRouter()

  const [matches, setMatches] = useState<any[]>([])
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const [lkToken, setLkToken] = useState<string>("");
  const LK_SERVER_URL = "wss://phuiscore-lhf9kjp2.livekit.cloud";

  const [streamData, setStreamData] = useState<any>(null)
  const [isLive, setIsLive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)

  // FB Live State
  const [fbLiveUrlInput, setFbLiveUrlInput] = useState("")

  // Chat states
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Fetch User Info
  useEffect(() => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
          try { setCurrentUser(JSON.parse(userStr)); } catch(e) {}
      }
  }, []);

  // Scroll to bottom
  useEffect(() => {
      if (chatEndRef.current && chatEndRef.current.parentElement) {
          const parent = chatEndRef.current.parentElement;
          parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
      }
  }, [messages]);

  // Setup Socket for Chat
  useEffect(() => {
      if (!selectedMatch?.id) return;
      const { socket } = require('../../utils/socket');
      socketRef.current = socket;
      
      socket.connect();
      socket.emit('join_live_room', selectedMatch.id);

      const handleNewMessage = (msg: any) => {
          setMessages(prev => [...prev, msg]);
      };
      socket.on('new_chat_message', handleNewMessage);
      socket.on('chat_error', (err: any) => showToast(err.message));

      const fetchChatHistory = async () => {
          try {
              const res = await fetch(`${API}/media/live-chats/${selectedMatch.id}`);
              const json = await res.json();
              if (json.success && json.data) setMessages(json.data);
          } catch(e) {}
      };
      fetchChatHistory();

      return () => {
          socket.off('new_chat_message', handleNewMessage);
          socket.off('chat_error');
          socket.disconnect();
          setMessages([]);
      };
  }, [selectedMatch?.id, API]);

  const handleSendMessage = () => {
      if (!messageInput.trim() || !selectedMatch?.id) return;
      if (!currentUser) return showToast('Bạn cần đăng nhập để bình luận!');
      
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      socketRef.current.emit('send_chat_message', {
          matchId: selectedMatch.id,
          token,
          message: messageInput.trim()
      });
      setMessageInput("");
  };

  // Tự động chọn trận đấu nếu có matchId từ Props (URL)
  useEffect(() => {
    if (matchId && matches.length > 0) {
      const match = matches.find(m => String(m.id) === String(matchId));
      if (match) {
        setSelectedMatch(match);
        setFbLiveUrlInput(match.facebookLiveUrl || "");
      }
    } else if (!matchId) {
        setSelectedMatch(null);
    }
  }, [matchId, matches]);

  // Hàm chọn trận đấu và cập nhật URL
  const handleSelectMatch = (match: any) => {
    setSelectedMatch(match);
    setFbLiveUrlInput(match.facebookLiveUrl || "");
    router.push(`/media/live/${match.id}`);
  }

  // Hàm quay lại và cập nhật URL
  const handleBack = () => {
    setSelectedMatch(null);
    setLkToken("");
    setStreamData(null);
    router.push('/media/live');
  }

  // Fetch matches
  const fetchLiveMatches = async (isSilent: boolean = false) => {
    if (!isSilent) setLoading(true)
    try {
      const now = new Date();
      const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const today = vnTime.toISOString().split('T')[0];
      const res = await fetch(`${API}/matches/${today}?t=${Date.now()}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        const formatted = json.data.flatMap((league: any) => {
          const matchesInLeague = league.matches || [];
          return matchesInLeague.map((m: any) => {
            const rawId = m.sk || m._id || m.id || "";
            const cleanId = rawId.includes('#') ? rawId.split('#')[1] : rawId;
            const d = m.startTimestamp ? new Date(m.startTimestamp * 1000) : new Date();
            const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            return {
              ...m,
              id: cleanId,
              time: (typeof m.time === 'string' ? m.time : (m.time && typeof m.time === 'object' ? (m.time.display || m.time.current || timeStr) : timeStr)),
              homeTeam: m.homeTeam || { name: m.homeTeamName || 'Đội Nhà' },
              awayTeam: m.awayTeam || { name: m.awayTeamName || 'Đội Khách' },
              tournamentName: (typeof m.tournamentName === 'string' ? m.tournamentName : (typeof league.tournamentName === 'string' ? league.tournamentName : 'Giải đấu'))
            };
          });
        });
        const nowTimestamp = Math.floor(Date.now() / 1000);
        const filtered = formatted.filter((m: any) => {
          const status = String(m.status || "").toLowerCase();
          
          // 1. Loại bỏ các trận đã kết thúc rõ ràng
          if (['finished', 'closed', 'ended'].includes(status)) return false;
          
          // 2. Safety Check: Nếu bắt đầu quá 180 phút (3 tiếng) -> Ẩn khỏi bảng điều khiển Live
          if (m.startTimestamp && (nowTimestamp - m.startTimestamp > 180 * 60)) return false;
          
          return true;
        });
        setMatches(filtered);
      }
    } catch (e) {
      showToast("Lỗi tải danh sách trận!")
    } finally {
      setLoading(false)
    }
  }

  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedMatch?.id || null;
  }, [selectedMatch?.id]);

  useEffect(() => {
    fetchLiveMatches()
    const { io } = require('socket.io-client');
    const socket = io(API.replace('/api', ''));
    
    socket.on('scoreUpdate', (data: any) => {
      const incomingId = String(data.matchId || data.id || "").includes('#') 
        ? String(data.matchId || data.id).split('#')[1] 
        : String(data.matchId || data.id);

      setMatches(prev => prev.map(m => m.id === incomingId ? { ...m, ...data, id: incomingId } : m));
      
      // Sử dụng Ref để kiểm tra trận đang chọn mà không bị closure stale
      if (selectedIdRef.current === incomingId) {
        setSelectedMatch((prev: any) => ({ ...prev, ...data, id: incomingId }));
      }
    });

    const interval = setInterval(() => {
      // Chỉ fetch ngầm, không set loading(true) để tránh nháy màn hình
      const fetchSilent = async () => {
        try {
          const now = new Date();
          const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
          const today = vnTime.toISOString().split('T')[0];
          const res = await fetch(`${API}/matches/${today}?t=${Date.now()}`)
          const json = await res.json()
          if (json.success && Array.isArray(json.data)) {
             // Logic format tương tự fetchLiveMatches nhưng không setLoading
             // (Để đơn giản có thể tách fetch thành hàm dùng chung có tham số silent)
             fetchLiveMatches(true);
          }
        } catch (e) {}
      }
      fetchSilent();
    }, 60000);

    return () => { 
      socket.disconnect(); 
      clearInterval(interval);
    };
  }, [])

  const handlePrepareStream = async () => {
    if (!selectedMatch) return
    try {
      showToast("Đang khởi tạo cấu hình kết nối...");
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/media/livekit-token?room=${selectedMatch.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.success) {
        setLkToken(json.token)
        if (json.ingress) setStreamData(json.ingress);
        showToast("Đã có cấu hình! Hãy kết nối OBS để xem trước.");
      } else {
        showToast(json.message || "Lỗi khi khởi tạo luồng!");
      }
    } catch (e) {
      showToast("Lỗi khi khởi tạo!");
    }
  }

  // Tự động khôi phục kết nối luồng nếu trận đấu đang diễn ra mà bị mất token (do F5)
  useEffect(() => {
    if (selectedMatch && !lkToken) {
      if (selectedMatch.liveStatus === 'inprogress' || selectedMatch.liveStatus === 'live') {
        handlePrepareStream();
      }
    }
  }, [selectedMatch?.id, selectedMatch?.liveStatus]);

  const handleGoLive = async () => {
    if (!selectedMatch) return
    try {
      showToast("Đang kích hoạt trạng thái trực tiếp...");
      await updateScore(
        getScore(selectedMatch.score?.home ?? selectedMatch.homeScore),
        getScore(selectedMatch.score?.away ?? selectedMatch.awayScore),
        selectedMatch.currentMinute || '0'
      );
      showToast("🚀 ĐÃ LÊN SÓNG! Người xem hiện đã có thể thấy video.");
    } catch (e) {
      showToast("Lỗi khi phát trực tiếp!");
    }
  }

  const updateScore = async (h: number, a: number, min: string, stats?: any, fbUrl?: string) => {
    if (!selectedMatch) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/media/update-score`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedMatch.pk?.replace('DATE#', '') || new Date().toISOString().split('T')[0],
          matchId: selectedMatch.id,
          homeScore: h,
          awayScore: a,
          currentMinute: min,
          liveStatus: 'inprogress',
          statistics: stats || selectedMatch.statistics,
          facebookLiveUrl: fbUrl !== undefined ? fbUrl : selectedMatch.facebookLiveUrl
        })
      })
      if (res.ok) {
        showToast("Đã cập nhật Real-time!");
        setSelectedMatch({ ...selectedMatch, score: { home: h, away: a }, currentMinute: min, statistics: stats || selectedMatch.statistics, facebookLiveUrl: fbUrl !== undefined ? fbUrl : selectedMatch.facebookLiveUrl })
      }
    } catch (e) { showToast("Lỗi cập nhật!"); }
  }

  const handleSaveFbUrl = () => {
      updateScore(
        getScore(selectedMatch.score?.home ?? selectedMatch.homeScore),
        getScore(selectedMatch.score?.away ?? selectedMatch.awayScore),
        selectedMatch.currentMinute || '0',
        undefined,
        fbLiveUrlInput
      );
  };

  const Room = LiveKitRoom as any;

  const updateStat = (type: string, team: 'home' | 'away', delta: number) => {
    const currentStats = selectedMatch.statistics || [
      { type: 'Corner', home: 0, away: 0 },
      { type: 'Foul', home: 0, away: 0 },
      { type: 'Yellow Card', home: 0, away: 0 },
      { type: 'Red Card', home: 0, away: 0 }
    ];

    const newStats = currentStats.map((s: any) => {
      if (s.type === type) {
        return { ...s, [team]: Math.max(0, (s[team] || 0) + delta) };
      }
      return s;
    });

    if (!newStats.find((s: any) => s.type === type)) {
      newStats.push({ type, home: team === 'home' ? delta : 0, away: team === 'away' ? delta : 0 });
    }

    updateScore(
      getScore(selectedMatch.score?.home ?? selectedMatch.homeScore),
      getScore(selectedMatch.score?.away ?? selectedMatch.awayScore),
      selectedMatch.currentMinute,
      newStats
    );
  };

  const handleEndLive = async () => {
    if (!selectedMatch) return;
    if (!window.confirm("Bạn có chắc chắn muốn kết thúc trận đấu này? Trạng thái sẽ chuyển thành FINISHED.")) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/media/update-score`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedMatch.pk?.replace('DATE#', '') || new Date().toISOString().split('T')[0],
          matchId: selectedMatch.id,
          homeScore: getScore(selectedMatch.score?.home ?? selectedMatch.homeScore),
          awayScore: getScore(selectedMatch.score?.away ?? selectedMatch.awayScore),
          currentMinute: selectedMatch.currentMinute,
          liveStatus: 'finished'
        })
      });
      if (res.ok) {
        showToast("Đã kết thúc trận đấu!");
        setSelectedMatch(null);
        fetchLiveMatches();
      }
    } catch (e) {
      showToast("Lỗi khi kết thúc!");
    }
  };

  const getStatValue = (type: string, team: 'home' | 'away') => {
    const stat = (selectedMatch.statistics || []).find((s: any) => s.type === type);
    if (!stat) return 0;
    const val = stat[team];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return val;
    const result = val?.current ?? val?.display ?? val;
    return (typeof result === 'object' && result !== null) ? 0 : (result || 0);
  };

  const getScore = (v: any) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') {
      const res = v.current ?? v.display ?? 0;
      return (typeof res === 'object' && res !== null) ? 0 : res;
    }
    return 0;
  };

  const filteredMatches = matches
    .filter(m => {
      const q = searchQuery.toLowerCase();
      const homeName = typeof m.homeTeam?.name === 'string' ? m.homeTeam.name : '';
      const awayName = typeof m.awayTeam?.name === 'string' ? m.awayTeam.name : '';
      return homeName.toLowerCase().includes(q) || awayName.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const now = Math.floor(Date.now() / 1000);
      const isALive = (a.status === 'live' || a.status === 'inprogress' || a.status === 'in_progress');
      const isBLive = (b.status === 'live' || b.status === 'inprogress' || b.status === 'in_progress');
      
      const aStartsIn = (a.startTimestamp || 0) - now;
      const bStartsIn = (b.startTimestamp || 0) - now;
      
      const isANear = !isALive && aStartsIn > 0 && aStartsIn <= 3600;
      const isBNear = !isBLive && bStartsIn > 0 && bStartsIn <= 3600;
      
      // 1. Ưu tiên các trận sắp đá trong < 1 tiếng
      if (isANear && !isBNear) return -1;
      if (!isANear && isBNear) return 1;
      
      // 2. Tiếp theo là các trận đang diễn ra
      if (isALive && !isBLive) return -1;
      if (!isALive && isBLive) return 1;
      
      // 3. Cuối cùng sắp xếp theo thời gian bắt đầu tăng dần
      return (a.startTimestamp || 0) - (b.startTimestamp || 0);
    });

  return (
    <div className="lc-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="lc-container">
        
        {!selectedMatch ? (
          <div className="lc-view-list animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 48, gap: 40, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: 42, margin: 0 }}>Giao Diện Điều Phối</h2>
                <p className="text-secondary" style={{ marginTop: 8 }}>Quản lý luồng trực tiếp và dữ liệu trận đấu thời gian thực</p>
              </div>
              <div style={{ width: 280 }}>
                <input 
                  className="search-pill" 
                  placeholder="Tìm trận đấu hoặc đội bóng..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {filteredMatches.map(m => (
                <div key={m.id} className="m-card" onClick={() => handleSelectMatch(m)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#b3b3b3' }}>{typeof m.tournamentName === 'string' ? m.tournamentName : 'GIẢI ĐẤU PHỦI'}</span>
                    <div className="m-status-live">
                       {(m.status === 'live' || m.status === 'inprogress' || m.status === 'in_progress') ? (
                         <><div className="live-dot" /> LIVE</>
                       ) : (
                         <span style={{ color: '#b3b3b3' }}>SẮP ĐÁ</span>
                       )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                    <img src={getImageUrl(m.homeTeam?.logo, 'logo', m.homeTeam?.id)} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{typeof m.homeTeam?.name === 'string' ? m.homeTeam.name : 'Đội Nhà'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <img src={getImageUrl(m.awayTeam?.logo, 'logo', m.awayTeam?.id)} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{typeof m.awayTeam?.name === 'string' ? m.awayTeam.name : 'Đội Khách'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #282828' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 24, fontWeight: 900 }}>
                        {getScore(m.score?.home ?? m.homeScore)} - {getScore(m.score?.away ?? m.awayScore)}
                      </span>
                      {(m.status === 'live' || m.status === 'inprogress' || m.status === 'in_progress') && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1ed760' }}>
                          {typeof m.currentMinute === 'number' || (typeof m.currentMinute === 'string' && !isNaN(parseInt(m.currentMinute))) 
                            ? `${m.currentMinute}'` 
                            : 'Live'}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                       <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{typeof m.time === 'string' ? m.time : '00:00'}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#535353' }}>ID: #{String(m.id)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="lc-view-focus animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <button className="pill-btn pill-btn-secondary" onClick={handleBack}>
                ← QUAY LẠI
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                 {selectedMatch.status === 'finished' ? (
                   <button className="pill-btn" style={{ background: '#222', color: '#555', cursor: 'not-allowed', fontWeight: 800 }}>
                     🏁 ĐÃ KẾT THÚC
                   </button>
                 ) : (
                   <>
                     {!lkToken ? (
                        <button 
                          className="pill-btn pill-btn-primary" 
                          style={{ fontWeight: 800, minWidth: 160 }}
                          onClick={handlePrepareStream}
                        >
                          📡 CHUẨN BỊ LUỒNG
                        </button>
                     ) : (
                        <>
                          <button 
                            className={(selectedMatch.liveStatus === 'inprogress' || selectedMatch.liveStatus === 'live') ? 'pill-btn pill-btn-danger' : 'pill-btn pill-btn-primary'} 
                            style={{ 
                              fontWeight: 800, 
                              minWidth: 160, 
                              boxShadow: (selectedMatch.liveStatus === 'inprogress' || selectedMatch.liveStatus === 'live') ? '0 0 20px rgba(239,68,68,0.4)' : 'none',
                              animation: (selectedMatch.liveStatus === 'inprogress' || selectedMatch.liveStatus === 'live') ? 'none' : 'blinker 1.5s infinite'
                            }}
                            onClick={handleGoLive}
                          >
                            {(selectedMatch.liveStatus === 'inprogress' || selectedMatch.liveStatus === 'live') ? '🔴 ĐANG TRỰC TIẾP' : '🚀 PHÁT TRỰC TIẾP'}
                          </button>
                          
                          <button 
                            className="pill-btn" 
                            style={{ background: '#333', color: '#fff', fontWeight: 800 }}
                            onClick={handleEndLive}
                          >
                            🏁 KẾT THÚC TRẬN
                          </button>
                        </>
                     )}
                   </>
                 )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: 32, margin: 0 }}>BẢNG ĐIỀU KHIỂN SẢN XUẤT</h3>
                <span style={{ color: '#1ed760', fontWeight: 700 }}>
                  {typeof selectedMatch.homeTeam?.name === 'string' ? selectedMatch.homeTeam.name : 'Đội Nhà'} VS {typeof selectedMatch.awayTeam?.name === 'string' ? selectedMatch.awayTeam.name : 'Đội Khách'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
              {/* Left Column (Monitor & Chat) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Monitor Section */}
                <div style={{ background: '#000', borderRadius: 24, overflow: 'hidden', aspectRatio: '16/9', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
                  {lkToken ? (
                    <Room video={false} audio={false} connect={true} token={lkToken} serverUrl={LK_SERVER_URL} style={{ height: '100%' }}>
                      <Monitor />
                    </Room>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#090909' }}>
                       <button className="pill-btn pill-btn-primary" onClick={handlePrepareStream}>
                          KHỞI TẠO LUỒNG PHÁT
                       </button>
                       <p className="text-secondary" style={{ marginTop: 16 }}>Nhấn để lấy cấu hình kết nối ứng dụng phát sóng (LiveKit)</p>
                    </div>
                  )}
              </div>
              
              {/* Nguồn phát thay thế: Facebook */}
              <div style={{ background: '#1f1f1f', padding: 20, borderRadius: 16 }}>
                 <h4 style={{ margin: '0 0 10px 0', fontSize: 14 }}>HOẶC PHÁT BẰNG FACEBOOK LIVE</h4>
                 <div style={{ display: 'flex', gap: 10 }}>
                    <input 
                      type="text"
                      className="search-pill" 
                      style={{ borderRadius: 8 }}
                      placeholder="Nhập link luồng Facebook (VD: https://www.facebook.com/bongdasomedia/videos/123456)" 
                      value={fbLiveUrlInput}
                      onChange={e => setFbLiveUrlInput(e.target.value)}
                    />
                    <button className="pill-btn pill-btn-secondary" style={{ borderRadius: 8 }} onClick={handleSaveFbUrl}>
                        LƯU LINK FB
                    </button>
                 </div>
                 {selectedMatch.facebookLiveUrl && (
                     <p style={{ color: '#1ed760', fontSize: 12, marginTop: 10, fontWeight: 600 }}>✓ Hiện đang dùng luồng Facebook: {selectedMatch.facebookLiveUrl}</p>
                 )}
              </div>
              
              {/* Chat Box below Monitor */}
              <div className="lc-chat-area">
                  <div className="lc-chat-header">
                      <div className="lc-chat-dot" />
                      <h3>Trò chuyện trực tiếp</h3>
                  </div>
                  <div className="lc-chat-messages">
                      <div className="chat-msg-wrapper" style={{ opacity: 0.7 }}>
                          <div className="chat-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#22c55e' }}>
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="#000"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                          <div className="chat-content">
                              <div className="chat-header">
                                  <span className="chat-username" style={{ color: '#22c55e' }}>Hệ thống</span>
                                  <span className="chat-time">Vừa xong</span>
                              </div>
                              <span className="chat-text">Đây là khu vực hiển thị tin nhắn của khán giả. Bạn có thể trò chuyện trực tiếp tại đây!</span>
                          </div>
                      </div>
                      
                      {messages.map((msg, idx) => {
                          const isSpecial = ['admin', 'super_admin'].includes(msg.role);
                          const isMedia = msg.role === 'media';
                          return (
                              <div key={msg.id || idx} className="chat-msg-wrapper">
                                  <img src={msg.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} className="chat-avatar" />
                                  <div className="chat-content">
                                      <div className="chat-header">
                                          <span className="chat-username" style={{ color: isSpecial ? '#ef4444' : isMedia ? '#3b82f6' : '#fff' }}>
                                              {msg.username}
                                          </span>
                                          {isSpecial && <span className="chat-badge admin">Quản trị viên</span>}
                                          {isMedia && <span className="chat-badge media">Truyền thông</span>}
                                          <span className="chat-time">{new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      <span className={`chat-text ${isSpecial || isMedia ? 'highlight' : ''}`}>{msg.message}</span>
                                  </div>
                              </div>
                          )
                      })}
                      <div ref={chatEndRef} />
                  </div>
                  <div className="lc-chat-input-wrap">
                      <input 
                          type="text" 
                          className="lc-chat-input" 
                          placeholder={!currentUser ? "Đăng nhập để bình luận..." : !lkToken ? "Đang chờ luồng Video..." : "Nhập tin nhắn..."} 
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          disabled={!currentUser || !lkToken}
                      />
                      <button 
                          className="lc-chat-send" 
                          onClick={handleSendMessage}
                          disabled={!currentUser || !lkToken || !messageInput.trim()}
                      >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                      </button>
                  </div>
              </div>
            </div>

              {/* Control Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="spotify-card" style={{ textAlign: 'center' }}>
                  <span className="text-secondary" style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}>Live Scoreboard</span>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, margin: '24px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                       <span className="score-display">{getScore(selectedMatch.score?.home ?? selectedMatch.homeScore)}</span>
                       <div style={{ display: 'flex', gap: 8 }}>
                          <button className="circle-btn" onClick={() => updateScore(getScore(selectedMatch.score?.home ?? selectedMatch.homeScore) + 1, getScore(selectedMatch.score?.away ?? selectedMatch.awayScore), selectedMatch.currentMinute)}>+</button>
                          <button className="circle-btn" onClick={() => updateScore(Math.max(0, getScore(selectedMatch.score?.home ?? selectedMatch.homeScore) - 1), getScore(selectedMatch.score?.away ?? selectedMatch.awayScore), selectedMatch.currentMinute)}>-</button>
                       </div>
                    </div>
                    <span style={{ fontSize: 40, fontWeight: 900, color: '#4d4d4d' }}>:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                       <span className="score-display">{getScore(selectedMatch.score?.away ?? selectedMatch.awayScore)}</span>
                       <div style={{ display: 'flex', gap: 8 }}>
                          <button className="circle-btn" onClick={() => updateScore(getScore(selectedMatch.score?.home ?? selectedMatch.homeScore), getScore(selectedMatch.score?.away ?? selectedMatch.awayScore) + 1, selectedMatch.currentMinute)}>+</button>
                          <button className="circle-btn" onClick={() => updateScore(getScore(selectedMatch.score?.home ?? selectedMatch.homeScore), Math.max(0, getScore(selectedMatch.score?.away ?? selectedMatch.awayScore) - 1), selectedMatch.currentMinute)}>-</button>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="spotify-card">
                   <span className="text-secondary" style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}>Thời gian trận đấu</span>
                   <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                      <input 
                        className="search-pill" 
                        style={{ flex: 1, textAlign: 'center', fontSize: 24, fontWeight: 900, background: '#121212' }}
                        value={String(selectedMatch.currentMinute || '')}
                        onChange={e => setSelectedMatch({...selectedMatch, currentMinute: e.target.value})}
                      />
                      <button className="pill-btn pill-btn-primary" onClick={() => updateScore(selectedMatch.score?.home ?? selectedMatch.homeScore ?? 0, selectedMatch.score?.away ?? selectedMatch.awayScore ?? 0, selectedMatch.currentMinute)}>
                         CẬP NHẬT
                      </button>
                   </div>
                </div>

                <div className="spotify-card">
                   <span className="text-secondary" style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}>Chỉ số trận đấu (Statistics)</span>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
                      {[
                        { label: 'PHẠT GÓC', type: 'Corner', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12zm0 0v7"/></svg>, color: '#1ed760' },
                        { label: 'THẺ VÀNG', type: 'Yellow Card', icon: <div style={{ width: 10, height: 14, background: '#fbbf24', borderRadius: 2 }} />, color: '#fbbf24' },
                        { label: 'THẺ ĐỎ', type: 'Red Card', icon: <div style={{ width: 10, height: 14, background: '#ef4444', borderRadius: 2 }} />, color: '#ef4444' },
                        { label: 'PHẠM LỖI', type: 'Foul', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, color: '#b3b3b3' }
                      ].map(stat => (
                        <div key={stat.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#242424', padding: '10px 16px', borderRadius: 12, borderLeft: `4px solid ${stat.color}` }}>
                           <div style={{ display: 'flex', gap: 8 }}>
                              <button className="circle-btn" style={{ width: 30, height: 30, fontSize: 12 }} onClick={() => updateStat(stat.type, 'home', 1)}>+</button>
                              <button className="circle-btn" style={{ width: 30, height: 30, fontSize: 12 }} onClick={() => updateStat(stat.type, 'home', -1)}>-</button>
                           </div>
                           
                           <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: stat.color }}>
                                 {stat.icon}
                                 <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1 }}>{stat.label}</span>
                              </div>
                              <div style={{ fontSize: 20, fontWeight: 900 }}>
                                 {getStatValue(stat.type, 'home')} <span style={{ color: '#4d4d4d', margin: '0 8px' }}>—</span> {getStatValue(stat.type, 'away')}
                              </div>
                           </div>

                           <div style={{ display: 'flex', gap: 8 }}>
                              <button className="circle-btn" style={{ width: 30, height: 30, fontSize: 12 }} onClick={() => updateStat(stat.type, 'away', 1)}>+</button>
                              <button className="circle-btn" style={{ width: 30, height: 30, fontSize: 12 }} onClick={() => updateStat(stat.type, 'away', -1)}>-</button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {streamData && (
                  <div className="spotify-card" style={{ border: '1px solid #1ed760' }}>
                     <h4 style={{ margin: '0 0 16px' }}>CẤU HÌNH KẾT NỐI</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <label className="text-secondary" style={{ fontSize: 10 }}>SERVER URL</label>
                           <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                              <input readOnly value={String(streamData.url || '')} className="search-pill" style={{ background: '#121212', fontSize: 12, flex: 1 }} />
                              <button className="pill-btn" style={{ fontSize: 10, minWidth: 60 }} onClick={() => { navigator.clipboard.writeText(streamData.url); showToast("Đã chép URL!"); }}>COPY</button>
                           </div>
                        </div>
                        <div>
                          <label className="text-secondary" style={{ fontSize: 10 }}>STREAM KEY</label>
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}> <input readOnly value={String(streamData.streamKey || '')} type="text" style={{ background: '#121212', fontSize: 12, flex: 1, color: '#1ed760', fontWeight: 700 }} className="search-pill" /> <button className="pill-btn" style={{ fontSize: 10, minWidth: 60 }} onClick={() => { navigator.clipboard.writeText(streamData.streamKey); showToast("Đã chép Key!"); }}>COPY</button> </div>
                        </div>
                        <p style={{ fontSize: 12, color: '#1ed760', marginTop: 8 }}>💡 Dán thông tin này vào ứng dụng phát sóng của bạn để bắt đầu.</p>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
