'use client';

import React, { useEffect, useState } from 'react';
import { 
  Radio, Video, Trash2, PlayCircle, Eye, Activity, RefreshCw, X
} from 'lucide-react';
import { 
  LiveKitRoom, 
  VideoConference,
  RoomAudioRenderer
} from '@livekit/components-react';
import '@livekit/components-styles';

export default function LivestreamsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [ingresses, setIngresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Watch Modal
  const [watchRoom, setWatchRoom] = useState<string | null>(null);
  const [watchToken, setWatchToken] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [roomsRes, ingressesRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/livestreams/rooms', { headers }),
        fetch('http://localhost:5000/api/admin/livestreams/ingresses', { headers })
      ]);

      const [roomsJson, ingressesJson] = await Promise.all([
        roomsRes.json(), ingressesRes.json()
      ]);

      if (roomsJson.success) setRooms(roomsJson.data || []);
      if (ingressesJson.success) setIngresses(ingressesJson.data || []);
    } catch (e) {
      console.error('Lỗi lấy dữ liệu LiveKit:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteRoom = async (roomName: string) => {
    if(!confirm(`Bạn có chắc muốn ĐÓNG phòng [${roomName}]? Hành động này sẽ đá tất cả người xem và người phát ra khỏi phòng ngay lập tức!`)) return;
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/livestreams/rooms/${roomName}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if(data.success) {
        fetchData();
      } else {
        alert(data.message || 'Lỗi đóng phòng');
      }
    } catch (e) {
      alert('Lỗi kết nối');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteIngress = async (ingressId: string) => {
    if(!confirm(`Bạn có chắc muốn XÓA Ingress [${ingressId}]? Người dùng sẽ không thể phát luồng vào Ingress này nữa!`)) return;
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/livestreams/ingresses/${ingressId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if(data.success) {
        fetchData();
      } else {
        alert(data.message || 'Lỗi xóa Ingress');
      }
    } catch (e) {
      alert('Lỗi kết nối');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWatchStream = async (roomName: string) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/livestreams/token/${roomName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if(data.success) {
        setWatchToken(data.token);
        setServerUrl(data.serverUrl);
        setWatchRoom(roomName);
      } else {
        alert(data.message || 'Không lấy được Token');
      }
    } catch (e) {
      alert('Lỗi kết nối lấy token');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (ts: number) => {
    if (!ts) return '-';
    // LiveKit timestamp is in seconds, convert to ms
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN');
  };

  return (
    <div className="flex flex-col gap-6 font-body pb-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
            <h1 className="text-4xl font-heading font-black tracking-widest text-white uppercase leading-none">
              QUẢN LÝ LIVESTREAM
            </h1>
          </div>
          <p className="text-on-surface-variant font-medium text-sm mt-2 ml-6 opacity-70">
            Giám sát các luồng trực tiếp (Phủi Score Live), quản lý Ingress và đóng phòng vi phạm.
          </p>
        </div>
        
        <button 
          onClick={fetchData}
          disabled={loading || actionLoading}
          className="btn-primary h-12 px-6 bg-red-500 text-white font-heading font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(239,68,68,0.3)] flex items-center gap-2 rounded-2xl disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          LÀM MỚI DỮ LIỆU
        </button>
      </div>

      {loading && rooms.length === 0 && ingresses.length === 0 ? (
        <div className="flex items-center justify-center p-20">
          <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Active Rooms */}
          <div className="glass-panel rounded-[2rem] border border-white/10 bg-[#0A0A0A] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/5 flex items-center gap-3">
               <Radio size={20} className="text-red-500" />
               <h3 className="text-sm font-heading font-black uppercase tracking-widest text-white">Phòng Đang Hoạt Động (Rooms)</h3>
               <span className="ml-auto bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold">{rooms.length} phòng</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0A0A0A]/95">
                  <tr className="border-b border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    <th className="px-6 py-4">Tên Phòng</th>
                    <th className="px-6 py-4">Người xem</th>
                    <th className="px-6 py-4">Thời gian tạo</th>
                    <th className="px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rooms.map((room) => (
                    <tr key={room.name} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-white font-bold text-sm">{room.name}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className="text-white/60 text-sm font-medium">{room.numParticipants} người</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className="text-white/40 text-xs font-mono">{formatDate(room.creationTime)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            disabled={actionLoading}
                            onClick={() => handleWatchStream(room.name)} 
                            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl transition-colors disabled:opacity-50"
                            title="Xem Luồng"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            disabled={actionLoading}
                            onClick={() => handleDeleteRoom(room.name)} 
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors disabled:opacity-50"
                            title="Đóng Phòng"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rooms.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-white/40 font-bold uppercase tracking-widest text-xs">
                        Không có phòng nào đang Live
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ingresses */}
          <div className="glass-panel rounded-[2rem] border border-white/10 bg-[#0A0A0A] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/5 flex items-center gap-3">
               <Video size={20} className="text-blue-500" />
               <h3 className="text-sm font-heading font-black uppercase tracking-widest text-white">Điểm Nhận Luồng (Ingresses)</h3>
               <span className="ml-auto bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-xs font-bold">{ingresses.length} luồng</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0A0A0A]/95">
                  <tr className="border-b border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    <th className="px-6 py-4">Ingress ID / Tên Phòng</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ingresses.map((ingress) => {
                    // Trạng thái: 0=ENDPOINT_INACTIVE, 1=ENDPOINT_PUBLISHING, 2=ENDPOINT_ERROR
                    const isPublishing = ingress.state?.status === 1 || ingress.state?.status === 'ENDPOINT_PUBLISHING';
                    
                    return (
                    <tr key={ingress.ingressId} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                            <span className="text-white font-bold text-sm">{ingress.roomName || 'Chưa gắn phòng'}</span>
                            <span className="text-white/40 text-[10px] font-mono">{ingress.ingressId}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 py-1 text-[10px] font-black rounded border ${
                            isPublishing 
                              ? 'text-green-400 bg-green-400/10 border-green-400/20' 
                              : 'text-white/40 bg-white/5 border-white/10'
                         }`}>
                            {isPublishing ? 'ĐANG NHẬN VIDEO' : 'KHÔNG HOẠT ĐỘNG'}
                         </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button 
                            disabled={actionLoading}
                            onClick={() => handleDeleteIngress(ingress.ingressId)} 
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors disabled:opacity-50"
                            title="Xóa Ingress"
                          >
                            <Trash2 size={16} />
                          </button>
                      </td>
                    </tr>
                  )})}
                  {ingresses.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-10 text-white/40 font-bold uppercase tracking-widest text-xs">
                        Không có Ingress nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Watch Modal */}
      {watchRoom && watchToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 lg:p-10">
          <div className="w-full h-full max-w-6xl max-h-full bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-lg font-heading font-black text-white uppercase tracking-widest">
                  Đang xem: {watchRoom}
                </h2>
              </div>
              <button 
                onClick={() => { setWatchRoom(null); setWatchToken(''); }} 
                className="text-white/40 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 bg-black relative">
              <LiveKitRoom
                video={false}
                audio={false}
                token={watchToken}
                serverUrl={serverUrl}
                data-lk-theme="default"
                style={{ height: '100%' }}
              >
                <VideoConference />
                <RoomAudioRenderer />
              </LiveKitRoom>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-black flex justify-between items-center text-white/40 text-xs">
               <span>Chế độ ẩn danh (Chỉ xem, không thể can thiệp âm thanh/video)</span>
               <button 
                 onClick={() => { handleDeleteRoom(watchRoom); setWatchRoom(null); setWatchToken(''); }}
                 className="px-4 py-2 bg-red-500/20 text-red-500 font-bold rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors"
               >
                 ĐÓNG PHÒNG NÀY
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
