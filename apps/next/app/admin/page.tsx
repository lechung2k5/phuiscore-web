'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { 
  Calendar, 
  Activity, 
  Trophy, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ChevronRight,
  Database,
  Cpu,
  Globe,
  Zap
} from 'lucide-react';

interface Stats {
  matchesCount: number;
  liveMatchesCount: number;
  tournamentsCount: number;
  newsCount: number;
  recentLogs: any[];
}

const DashboardPage = () => {
  const [stats, setStats] = useState<any>(() => {
    // Khôi phục cache ngay lập tức khi mount — tránh màn hình trống
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('admin_stats');
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
        sessionStorage.setItem('admin_stats', JSON.stringify(json.data)); // Lưu cache
      }
    } catch (e) {
      console.error('Lỗi lấy thống kê:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/health', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setHealth(json.data);
        sessionStorage.setItem('admin_health', JSON.stringify(json.data));
      }
    } catch (e) {
      console.warn('Sức khỏe hệ thống không khả dụng:', (e as Error).message);
      // Khôi phục từ cache một lần duy nhất — không gây re-render loop
      const cached = sessionStorage.getItem('admin_health');
      if (cached) {
        setHealth((prev: any) => prev ?? JSON.parse(cached));
      }
    }
  }, []); // ← KHÔNG đưa health vào deps: tránh vòng lặp vô tận

  useEffect(() => {
    // 1. Lấy dữ liệu ngay khi load
    fetchStats();
    fetchHealth();

    // 2. Kết nối Socket.io — lắng nghe sự kiện statsUpdate real-time
    const socket = io('http://localhost:5000', { transports: ['websocket'] });

    socket.on('statsUpdate', () => {
      console.log('[Dashboard] 🔴 Nhận statsUpdate — đang làm mới số liệu...');
      setIsUpdating(true);
      fetchStats().finally(() => setTimeout(() => setIsUpdating(false), 800));
    });

    socket.on('connect', () => console.log('[Dashboard] ✅ Socket kết nối thành công'));
    socket.on('disconnect', () => console.log('[Dashboard] ❌ Socket mất kết nối'));

    // 3. Polling dự phòng: Health mỗi 10s, Stats mỗi 30s
    const healthInterval = setInterval(fetchHealth, 10000);
    const statsInterval = setInterval(fetchStats, 30000);

    return () => {
      socket.disconnect();
      clearInterval(healthInterval);
      clearInterval(statsInterval);
    };
  }, [fetchStats, fetchHealth]);

  const statCards = [
    { 
        title: 'TỔNG SỐ TRẬN ĐẤU', 
        value: stats?.matchesCount || 0, 
        icon: Calendar, 
        trend: '+12%', 
        color: '#00FF66', // Green
        shadow: 'rgba(0, 255, 102, 0.2)'
    },
    { 
        title: 'ĐANG TRỰC TIẾP', 
        value: stats?.liveMatchesCount || 0, 
        icon: Activity, 
        trend: 'Đang diễn ra', 
        color: '#00D1FF', // Cyan
        shadow: 'rgba(0, 209, 255, 0.2)',
        isLive: true 
    },
    { 
        title: 'GIẢI ĐẤU HIỆN CÓ', 
        value: stats?.tournamentsCount || 0, 
        icon: Trophy, 
        trend: 'Ổn định', 
        color: '#FFB800', // Gold
        shadow: 'rgba(255, 184, 0, 0.2)'
    },
    { 
        title: 'TIN TỨC HỆ THỐNG', 
        value: stats?.newsCount || 0, 
        icon: TrendingUp, 
        trend: '+5 mới', 
        color: '#AD00FF', // Purple
        shadow: 'rgba(173, 0, 255, 0.2)'
    },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_20px_rgba(0,255,102,1)]" />
            </div>
        </div>
        <div className="flex flex-col items-center gap-1 font-body">
            <p className="text-white font-heading font-black uppercase tracking-[0.4em] text-sm text-center">Đang đồng bộ dữ liệu...</p>
            <p className="text-primary/60 font-bold text-[10px] uppercase tracking-widest mt-2">Hệ thống quản trị v2.4.0</p>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-12 font-body">
      {/* Page Heading */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(0,255,102,0.5)]" />
            <h1 className="text-6xl font-heading font-black tracking-[0.05em] text-white uppercase leading-none">TRUNG TÂM ĐIỀU HÀNH</h1>
        </div>
        <p className="text-on-surface-variant font-medium text-sm mt-4 ml-6 opacity-70">Tổng quan chiến lược và quản lý tài nguyên hệ thống</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card: any, idx: number) => (
          <div 
            key={idx} 
            className={`group glass-card p-8 relative overflow-hidden bg-[#0A0A0A] border hover:border-white/20 transition-all duration-500 ${
              isUpdating ? 'border-primary/50 shadow-[0_0_30px_rgba(0,255,102,0.1)]' : 'border-white/10'
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 transition-opacity opacity-20 group-hover:opacity-40" style={{ backgroundColor: card.color }} />
            
            <div className="flex flex-col gap-8 relative z-10">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-3">
                        <span className="text-white/60 text-[11px] font-heading font-black uppercase tracking-[0.2em]">{card.title}</span>
                        {card.isLive && (
                            <div className="px-3 py-1 text-black text-[10px] font-heading font-black uppercase tracking-widest rounded-md flex items-center gap-2" style={{ backgroundColor: card.color, boxShadow: `0 0 20px ${card.shadow}` }}>
                                <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                                Trực tiếp
                            </div>
                        )}
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all">
                        <card.icon size={22} style={{ color: card.color }} />
                    </div>
                </div>
                <div className="flex items-end justify-between">
                    <h2 className="text-6xl font-heading font-black text-white tracking-tight leading-none">{card.value}</h2>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5" style={{ color: card.color }}>
                            <span className="text-[12px] font-heading font-black uppercase tracking-wider">{card.trend}</span>
                            <ArrowUpRight size={16} />
                        </div>
                        <span className="text-[10px] font-medium text-white/40 mt-1.5 uppercase tracking-widest">Thời gian thực</span>
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Activity List */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="flex justify-between items-end px-2">
            <div className="flex flex-col gap-2">
                <h3 className="text-3xl font-heading font-black text-white uppercase tracking-[0.1em]">LUỒNG HOẠT ĐỘNG</h3>
                <p className="text-on-surface-variant text-sm font-medium opacity-60">Nhật ký thời gian thực các thao tác quản trị trên hệ thống</p>
            </div>
            <button className="h-10 px-6 border border-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/5 transition-all flex items-center gap-2">
                Xem chi tiết <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="glass-panel rounded-[2rem] overflow-hidden border border-white/10 bg-[#0A0A0A]">
            <div className="grid grid-cols-12 p-7 bg-white/[0.03] border-b border-white/10">
              <span className="col-span-5 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em]">ACTIVITY</span>
              <span className="col-span-4 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em]">CATEGORY</span>
              <span className="col-span-3 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em] text-right">TIME</span>
            </div>

            <div className="divide-y divide-white/5">
                {(stats?.recentLogs || []).map((log: any, idx: number) => (
                <div 
                    key={idx} 
                    className="grid grid-cols-12 p-7 hover:bg-white/[0.02] transition-colors items-center group cursor-default"
                >
                    <div className="col-span-5 flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-all">
                            <Zap size={16} className="text-primary" />
                        </div>
                        <span className="text-white font-bold text-base group-hover:text-primary transition-colors">
                            {log.action === 'UPDATE_SCORE' ? 'Cập nhật tỉ số' : 
                             log.action === 'CREATE_NEWS' ? 'Đăng tin tức' : 
                             log.action === 'UPDATE_NEWS' ? 'Sửa tin tức' : 
                             log.action === 'DELETE_NEWS' ? 'Xóa tin tức' : 
                             log.action}
                        </span>
                    </div>
                    <div className="col-span-4">
                        <span className="px-4 py-1.5 bg-black border border-white/10 text-white/60 font-bold text-[10px] uppercase tracking-widest rounded-lg">
                            {log.entityType}
                        </span>
                    </div>
                    <div className="col-span-3 flex items-center justify-end gap-3 text-white/40">
                        <Clock size={14} className="opacity-40" />
                        <span className="font-medium text-sm">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
                ))}
                {(!stats?.recentLogs || stats.recentLogs.length === 0) && (
                    <div className="p-24 text-center flex flex-col items-center gap-5">
                        <Activity size={56} className="text-primary opacity-10" />
                        <p className="text-white/20 font-bold uppercase tracking-[0.4em] text-[10px]">Hiện không có hoạt động nào được ghi lại</p>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* System Terminal Sidebar */}
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h3 className="text-3xl font-heading font-black text-white uppercase tracking-[0.1em]">HẠ TẦNG HỆ THỐNG</h3>
                <p className="text-on-surface-variant text-sm font-medium opacity-60">Giám sát độ toàn vẹn và hiệu suất phần cứng hệ thống</p>
            </div>
            
            <div className="glass-panel p-10 rounded-[3rem] flex flex-col gap-12 border border-white/10 bg-[#0A0A0A]">
                <div className="flex flex-col gap-10">
                    <StatusItem 
                        label="Crawler Engine" 
                        status={health?.redis === 'ready' ? 'Running' : 'Disconnected'} 
                        icon={Globe} 
                        color={health?.redis === 'ready' ? '#00FF66' : '#FF4B4B'} 
                    />
                    <StatusItem 
                        label="Core Database" 
                        status={health?.database === 'online' ? 'Stable' : 'Error'} 
                        icon={Database} 
                        color={health?.database === 'online' ? '#00FF66' : '#FF4B4B'} 
                    />
                    <StatusItem 
                        label="Background Services" 
                        status={health?.queue?.active >= 0 ? 'Running' : 'Paused'} 
                        icon={Cpu} 
                        color={health?.queue?.active >= 0 ? '#00FF66' : '#FFB800'} 
                    />
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                            <Activity size={14} className="text-primary" />
                            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">System Load (RAM)</span>
                        </div>
                        <span className="text-white font-bold text-sm italic">{health?.system?.memory?.heapUsed || '0MB'}</span>
                    </div>
                    <div className="h-3 bg-black rounded-full overflow-hidden border border-white/10 p-[2px]">
                        <div 
                            className="h-full bg-primary rounded-full shadow-[0_0_20px_rgba(0,255,102,0.5)] transition-all duration-1000" 
                            style={{ 
                              width: (health?.system?.memory?.heapUsed && health?.system?.memory?.heapTotal)
                                ? `${(parseInt(health.system.memory.heapUsed) / parseInt(health.system.memory.heapTotal) * 100).toFixed(1)}%`
                                : '0%'
                            }}
                        />
                    </div>
                </div>

                <button className="w-full h-14 bg-white/5 border border-white/10 text-white font-bold uppercase text-[11px] tracking-[0.2em] rounded-2xl hover:bg-primary hover:text-black hover:border-primary transition-all mt-4">
                    REBOOT SYSTEM
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const StatusItem = ({ label, status, icon: Icon, color }: any) => (
    <div className="flex justify-between items-center group cursor-default">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-all">
                <Icon size={18} className="text-primary" />
            </div>
            <span className="text-white/80 font-medium text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse shadow-lg" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
            <span className="font-bold text-[11px] opacity-80" style={{ color: color }}>{status}</span>
        </div>
    </div>
);

export default DashboardPage;
