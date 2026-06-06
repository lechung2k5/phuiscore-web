'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  Calendar, 
  Users, 
  FileText, 
  Activity, 
  LogOut,
  RefreshCw,
  Shield,
  Settings,
  Bell,
  Search,
  Radio,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import LogoAsset from '../../../../packages/app/assets/logo.svg';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        setIsAdmin(false);
        return;
      }

      try {
        const user = JSON.parse(userStr);
        const adminRoles = ['admin', 'super_admin', 'manager'];
        if (!adminRoles.includes(user.role?.toLowerCase())) {
          setIsAdmin(false);
          return;
        }

        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setIsAdmin(false);
          return;
        }

        setIsAdmin(true);
      } catch (e) {
        setIsAdmin(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setIsAdmin(false);
  };

  const AdminLoginModal = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData)
        });
        const data = await response.json();
        const adminRoles = ['admin', 'super_admin', 'manager'];
        if (response.ok && adminRoles.includes(data.user?.role?.toLowerCase())) {
          // Lưu cả 2 key (accessToken là field mới, token là key cũ để tương thích)
          localStorage.setItem('token', data.accessToken);
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.reload();
        } else {
          setError(data.message || "Bạn không có quyền truy cập quản trị!");
        }
      } catch (err) {
        setError("Lỗi kết nối hệ thống!");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black overflow-hidden stadium-bg">
        <div className="relative w-[450px] glass-panel p-12 rounded-[2.5rem] flex flex-col gap-10 shadow-[0_0_80px_rgba(0,255,102,0.1)] border border-primary/20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/40 shadow-[0_0_30px_rgba(0,255,102,0.2)]">
                <Shield size={40} className="text-primary" />
            </div>
            <div className="text-center">
                <h2 className="text-3xl font-heading font-black text-white tracking-[0.05em] uppercase leading-none">HỆ THỐNG QUẢN TRỊ</h2>
                <p className="text-primary text-[10px] font-body font-bold uppercase tracking-[0.5em] mt-3 opacity-80">Bảng Điều Khiển Trung Tâm</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-heading font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Mã Định Danh</label>
              <input 
                type="text"
                placeholder="Tên đăng nhập admin"
                className="w-full bg-white/5 border border-white/10 text-white px-5 py-4 rounded-xl outline-none focus:border-primary focus:shadow-[0_0_20px_rgba(0,255,102,0.15)] transition-all font-body font-semibold placeholder:text-white/20"
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-heading font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Khóa Truy Cập</label>
              <input 
                type="password"
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/10 text-white px-5 py-4 rounded-xl outline-none focus:border-primary focus:shadow-[0_0_20px_rgba(0,255,102,0.15)] transition-all font-body font-semibold placeholder:text-white/20"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && (
                <div className="bg-error/20 border border-error/40 p-4 rounded-xl text-center">
                    <p className="text-white text-xs font-body font-bold uppercase tracking-wider">{error}</p>
                </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <button 
                className="btn-primary w-full h-14 text-sm font-heading !bg-primary !text-black shadow-[0_0_30px_rgba(0,255,102,0.4)] hover:shadow-[0_0_50px_rgba(0,255,102,0.6)]"
                onClick={handleLogin}
                disabled={loading}
            >
                {loading ? "ĐANG XÁC THỰC..." : "KÍCH HOẠT TRUY CẬP"}
            </button>
            <button 
                className="text-on-surface-variant text-[10px] font-body font-bold uppercase tracking-[0.3em] hover:text-white transition-colors py-2"
                onClick={() => router.push('/')}
            >
                NGẮT KẾT NỐI HỆ THỐNG
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isAdmin === false) return <AdminLoginModal />;
  if (isAdmin === null) return null;

  const menuItems = [
    { name: 'Tổng quan', icon: LayoutDashboard, href: '/admin' },
    { name: 'Giải đấu', icon: Trophy, href: '/admin/tournaments' },
    { name: 'Trận đấu', icon: Calendar, href: '/admin/matches' },
    { name: 'Đội bóng', icon: Users, href: '/admin/teams' },
    { name: 'Tin tức', icon: FileText, href: '/admin/news' },
    { name: 'Livestream', icon: Radio, href: '/admin/livestreams' },
    { name: 'Hệ thống', icon: Activity, href: '/admin/system' },
  ];

  return (
    <div className="flex h-screen bg-black stadium-bg overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-[280px]' : 'w-24'} bg-black border-r border-white/10 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col z-20`}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/10">
             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/30 group-hover:border-primary/60 transition-all shadow-[0_0_15px_rgba(0,255,102,0.1)]">
                    <Shield size={20} className="text-primary" />
                </div>
                {isSidebarOpen && (
                    <div className="flex items-center ml-2">
                        <img 
                            src={LogoAsset.src || LogoAsset} 
                            alt="Phủi Score Logo" 
                            className="h-9 w-auto object-contain brightness-0 invert" 
                        />
                    </div>
                )}
             </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 flex flex-col gap-2 custom-scrollbar overflow-y-auto mt-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href} className="no-underline">
                  <div 
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${isActive ? 'sidebar-active border border-primary/20' : 'hover:bg-white/5 border border-transparent'}`}
                  >
                    <item.icon size={20} className={isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-white'} />
                    {isSidebarOpen && (
                      <span 
                        className={`text-[11px] font-heading font-bold uppercase tracking-widest ${isActive ? 'text-white' : 'text-on-surface-variant group-hover:text-white'}`}
                      >
                        {item.name}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-white/10 bg-black/50">
          <button 
            onClick={handleLogout}
            className="w-full h-12 flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-on-surface-variant rounded-xl hover:bg-error hover:text-white hover:border-error transition-all font-heading font-black uppercase text-[10px] tracking-[0.2em]"
          >
            {isSidebarOpen ? "ĐĂNG XUẤT HỆ THỐNG" : <LogOut size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-10 border-b border-white/10 bg-black/80 backdrop-blur-3xl z-10 sticky top-0">
          <div className="flex items-center gap-8">
             <h1 className="text-xl font-heading font-black tracking-[0.1em] text-white uppercase ml-2">
                {menuItems.find(m => pathname === m.href)?.name || 'QUẢN TRỊ'}
             </h1>
             <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl ml-4 focus-within:border-primary transition-all">
                <Search size={16} className="text-on-surface-variant" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm lệnh hệ thống..." 
                    className="bg-transparent border-none outline-none text-xs font-body font-medium text-white w-48 placeholder:text-white/20"
                />
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <button className="p-2.5 text-on-surface-variant hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10">
                    <RefreshCw size={18} />
                </button>
                <button className="p-2.5 text-on-surface-variant hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 relative">
                    <Bell size={18} />
                    <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-black" />
                </button>
                <button className="p-2.5 text-on-surface-variant hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10">
                    <Settings size={18} />
                </button>
            </div>
            
            <div className="w-px h-8 bg-white/10" />
            
            <button className="btn-primary !h-10 px-6 !bg-primary !text-black shadow-[0_0_20px_rgba(0,255,102,0.3)]">
                <div className="pulse-dot !bg-black !shadow-none" />
                TRỰC TIẾP
            </button>

            <div className="flex items-center gap-3 ml-2">
                <div className="flex flex-col items-end leading-none">
                    <span className="text-xs font-heading font-black uppercase text-white">Quản trị viên</span>
                    <span className="text-[9px] font-body font-bold uppercase text-primary tracking-widest mt-1.5 shadow-primary/20">CONNECTED</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden p-1 group cursor-pointer hover:border-primary/50 transition-all">
                    <img src="https://ui-avatars.com/api/?name=Admin&background=00FF66&color=000" className="w-full h-full rounded-lg" alt="Avatar" />
                </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-10 max-w-[1600px] mx-auto w-full animate-in fade-in duration-700 font-body">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
