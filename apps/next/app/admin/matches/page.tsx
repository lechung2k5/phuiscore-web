'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, Search, PlusCircle, Edit2, Trash2, 
  ChevronLeft, ChevronRight, Filter, AlertCircle, X, Save, Upload
} from 'lucide-react';

export default function MatchCrudPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lọc theo ngày
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Phân trang client-side
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Reset trang về 1 khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedDate]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create'|'edit'>('create');
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>, side: 'home' | 'away') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'teams');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setCurrentMatch((prev: any) => ({
          ...prev,
          [side === 'home' ? 'homeTeam' : 'awayTeam']: {
            ...prev[side === 'home' ? 'homeTeam' : 'awayTeam'],
            logo: data.url
          }
        }));
      } else {
        alert(data.message || 'Lỗi upload ảnh');
      }
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Lỗi kết nối upload');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchMatches(selectedDate);
  }, [selectedDate]);

  const fetchMatches = async (date: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Gọi API GET /admin/matches/:date
      const res = await fetch(`http://localhost:5000/api/admin/matches/${date}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setMatches(json.data);
      }
    } catch (e) {
      console.error('Lỗi lấy danh sách trận đấu:', e);
    } finally {
      setLoading(false);
      setCurrentPage(1); // Reset page khi đổi ngày
    }
  };

  const handleDateChange = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentMatch({
      dateString: selectedDate,
      tournamentName: '',
      homeTeam: { name: '', logo: '' },
      awayTeam: { name: '', logo: '' },
      score: { home: 0, away: 0 },
      status: 'notstarted',
      startTimestamp: Math.floor(Date.now() / 1000)
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (match: any) => {
    setModalMode('edit');
    setCurrentMatch(JSON.parse(JSON.stringify(match))); // Deep copy
    setIsModalOpen(true);
  };

  const handleOpenDelete = (match: any) => {
    setMatchToDelete(match);
    setIsDeleteModalOpen(true);
  };

  const saveMatch = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = modalMode === 'create' 
        ? `http://localhost:5000/api/admin/matches` 
        : `http://localhost:5000/api/admin/matches/${currentMatch.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(currentMatch)
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchMatches(selectedDate);
      } else {
        alert(json.message);
      }
    } catch (e) {
      console.error('Lỗi lưu trận đấu:', e);
    }
  };

  const deleteMatch = async () => {
    if (!matchToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/matches/${selectedDate}/${matchToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setIsDeleteModalOpen(false);
        fetchMatches(selectedDate);
      }
    } catch (e) {
      console.error('Lỗi xóa trận đấu:', e);
    }
  };

  // Logic lọc và phân trang
  const filteredMatches = matches.filter(m => {
    // Lấy trạng thái thực sự (bao gồm fallback 130 phút)
    const nowSec = Math.floor(Date.now() / 1000);
    const s = String(m.status || '').toLowerCase();
    const explicitlyLive = ['inprogress', 'live', 'in_progress'].includes(s);
    const isFallbackLive = ['notstarted', 'not_started'].includes(s) && m.startTimestamp && (nowSec - m.startTimestamp >= -30 * 60) && (nowSec - m.startTimestamp <= 130 * 60);
    const isLive = explicitlyLive || isFallbackLive;
    const isFinished = ['finished', 'ended', 'closed', 'canceled', 'postponed'].includes(s);
    const isUpcoming = !isLive && !isFinished;

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'live' && !isLive) return false;
      if (statusFilter === 'finished' && !isFinished) return false;
      if (statusFilter === 'upcoming' && !isUpcoming) return false;
    }

    // Filter by query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const id = String(m.id || '').toLowerCase();
    const home = String(m.homeTeam?.name || '').toLowerCase();
    const away = String(m.awayTeam?.name || '').toLowerCase();
    return id.includes(q) || home.includes(q) || away.includes(q);
  });

  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const paginatedMatches = filteredMatches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-160px)] font-body">
      {/* Header & Date Filter */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(0,255,102,0.5)]" />
            <h1 className="text-4xl font-heading font-black tracking-widest text-white uppercase leading-none">
              QUẢN LÝ TRẬN ĐẤU
            </h1>
          </div>
          <p className="text-on-surface-variant font-medium text-sm mt-2 ml-6 opacity-70">
            Xem, thêm, sửa, xóa dữ liệu trận đấu
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-white/80 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary transition-all cursor-pointer"
          >
            <option value="all" className="bg-[#111]">Tất cả trạng thái</option>
            <option value="live" className="bg-[#111]">Đang đá (Live)</option>
            <option value="upcoming" className="bg-[#111]">Chưa bắt đầu</option>
            <option value="finished" className="bg-[#111]">Đã kết thúc</option>
          </select>

          {/* Search Box */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl w-64 transition-all focus-within:border-primary focus-within:bg-white/10">
            <Search size={16} className="text-white/40" />
            <input 
              type="text" 
              placeholder="Tìm ID, Tên đội..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-white outline-none w-full placeholder:text-white/30"
            />
          </div>

          <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
            <button 
              onClick={() => handleDateChange(-1)}
              className="px-4 py-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all text-sm font-bold"
            >
              Hôm qua
            </button>
            <button 
              onClick={() => setSelectedDate(getTodayString())}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedDate === getTodayString() ? 'bg-primary text-black' : 'hover:bg-white/10 text-white/60'}`}
            >
              Hôm nay
            </button>
            <button 
              onClick={() => handleDateChange(1)}
              className="px-4 py-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all text-sm font-bold"
            >
              Ngày mai
            </button>
            <div className="w-[1px] h-6 bg-white/10 mx-2" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert pr-2 font-mono text-sm"
            />
          </div>
          
          <button 
            onClick={handleOpenCreate}
            className="btn-primary h-12 px-6 bg-primary text-black font-heading font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(0,255,102,0.3)] flex items-center gap-2 rounded-2xl"
          >
            <PlusCircle size={16} />
            THÊM TRẬN ĐẤU
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 glass-panel rounded-[2rem] border border-white/10 bg-[#0A0A0A] flex flex-col overflow-hidden">
        {loading ? (
           <div className="flex-1 flex flex-col items-center justify-center gap-4">
             <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Đang lấy dữ liệu...</p>
           </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-10">
                  <tr className="border-b border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    <th className="px-6 py-4">ID / Giờ</th>
                    <th className="px-6 py-4">Giải đấu</th>
                    <th className="px-6 py-4 text-right">Đội nhà</th>
                    <th className="px-6 py-4 text-center">Tỉ số</th>
                    <th className="px-6 py-4">Đội khách</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedMatches.map((m) => {
                    const nowSec = Math.floor(Date.now() / 1000);
                    const s = String(m.status || '').toLowerCase();
                    const explicitlyLive = ['inprogress', 'live', 'in_progress'].includes(s);
                    const isFallbackLive = ['notstarted', 'not_started'].includes(s) && m.startTimestamp && (nowSec - m.startTimestamp >= -30 * 60) && (nowSec - m.startTimestamp <= 130 * 60);
                    const isLive = explicitlyLive || isFallbackLive;
                    const isFinished = ['finished', 'ended', 'closed', 'canceled', 'postponed'].includes(s);
                    
                    let displayLabel = 'CHƯA ĐÁ';
                    let colorClass = 'border-amber-500/30 text-amber-500 bg-amber-500/10';
                    
                    if (explicitlyLive) {
                        displayLabel = 'LIVE';
                        colorClass = 'border-red-500/30 text-red-500 bg-red-500/10';
                    } else if (isFallbackLive) {
                        const minLeft = Math.floor((m.startTimestamp - nowSec) / 60);
                        displayLabel = minLeft > 0 ? `SẮP ĐÁ (${minLeft}')` : 'ĐANG ĐÁ';
                        colorClass = 'border-red-500/30 text-red-500 bg-red-500/10';
                    } else if (isFinished) {
                        displayLabel = 'KẾT THÚC';
                        colorClass = 'border-white/20 text-white/60 bg-white/5';
                    }

                    return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-white/30 font-mono text-[10px]">{m.id?.substring(0, 6)}...</span>
                          <span className="text-white font-bold text-xs">
                            {m.startTimestamp ? new Date(m.startTimestamp * 1000).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-primary/80 font-bold text-xs line-clamp-1 max-w-[150px]">{m.tournamentName}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-white font-bold text-sm">{m.homeTeam?.name}</span>
                          {m.homeTeam?.logo && <img src={m.homeTeam.logo} alt="" className="w-6 h-6 object-contain" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xl font-heading font-black text-white px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                          {(typeof m.score?.home === 'object' ? m.score.home.current : m.score?.home) ?? 0} - {(typeof m.score?.away === 'object' ? m.score.away.current : m.score?.away) ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {m.awayTeam?.logo && <img src={m.awayTeam.logo} alt="" className="w-6 h-6 object-contain" />}
                          <span className="text-white font-bold text-sm">{m.awayTeam?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md border ${colorClass}`}>
                          {displayLabel} {explicitlyLive && m.currentMinute && m.currentMinute !== 'Not started' ? `(${m.currentMinute})` : ''}
                        </span>
                        {m.isCustom && <span className="ml-2 text-[8px] text-primary border border-primary/30 px-1 rounded">CUSTOM</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEdit(m)} className="p-2 bg-white/5 hover:bg-primary/20 hover:text-primary text-white/60 rounded-xl transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleOpenDelete(m)} className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-white/60 rounded-xl transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                  {paginatedMatches.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-white/40 font-bold uppercase tracking-widest text-xs">
                        Không có trận đấu nào trong ngày này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#0A0A0A]">
                <span className="text-xs font-bold text-white/40">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredMatches.length)} trên tổng số {filteredMatches.length}
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={16} className="text-white" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition-colors ${
                          currentPage === i + 1 ? 'bg-primary text-black' : 'hover:bg-white/10 text-white/60'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={16} className="text-white" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CRUD Modal */}
      {isModalOpen && currentMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-heading font-black text-white uppercase tracking-widest">
                {modalMode === 'create' ? 'Thêm Trận Đấu Mới' : 'Chỉnh sửa Trận Đấu'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-8 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
              {/* Giải đấu & Thời gian */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Giải đấu</label>
                  <input 
                    type="text" 
                    value={currentMatch.tournamentName} 
                    onChange={e => setCurrentMatch({...currentMatch, tournamentName: e.target.value})}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                    placeholder="VD: Phui League 2026"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Thời gian bắt đầu</label>
                  <input 
                    type="datetime-local" 
                    value={
                      currentMatch.startTimestamp 
                      ? new Date(currentMatch.startTimestamp * 1000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
                      : ''
                    } 
                    onChange={e => {
                        const ts = Math.floor(new Date(e.target.value).getTime() / 1000);
                        if (!isNaN(ts)) setCurrentMatch({...currentMatch, startTimestamp: ts});
                    }}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none font-mono [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                  <span className="text-[10px] text-white/30 text-right">Unix: {currentMatch.startTimestamp}</span>
                </div>
              </div>

              {/* Đội nhà */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-white/60">Đội Nhà</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Tên đội nhà" value={currentMatch.homeTeam?.name || ''} onChange={e => setCurrentMatch({...currentMatch, homeTeam: {...currentMatch.homeTeam, name: e.target.value}})} className="bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none" />
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Link Logo Đội nhà" value={currentMatch.homeTeam?.logo || ''} onChange={e => setCurrentMatch({...currentMatch, homeTeam: {...currentMatch.homeTeam, logo: e.target.value}})} className="bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none w-full" />
                    <button onClick={() => document.getElementById('upload-home-logo')?.click()} className="p-2 bg-white/10 hover:bg-primary hover:text-black rounded-xl text-white/60 transition-colors shrink-0" disabled={isUploading}>
                       <Upload size={18} />
                    </button>
                    <input type="file" id="upload-home-logo" className="hidden" accept="image/*" onChange={(e) => handleUploadLogo(e, 'home')} />
                  </div>
                </div>
              </div>

              {/* Đội khách */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-white/60">Đội Khách</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Tên đội khách" value={currentMatch.awayTeam?.name || ''} onChange={e => setCurrentMatch({...currentMatch, awayTeam: {...currentMatch.awayTeam, name: e.target.value}})} className="bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none" />
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Link Logo Đội khách" value={currentMatch.awayTeam?.logo || ''} onChange={e => setCurrentMatch({...currentMatch, awayTeam: {...currentMatch.awayTeam, logo: e.target.value}})} className="bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none w-full" />
                    <button onClick={() => document.getElementById('upload-away-logo')?.click()} className="p-2 bg-white/10 hover:bg-primary hover:text-black rounded-xl text-white/60 transition-colors shrink-0" disabled={isUploading}>
                       <Upload size={18} />
                    </button>
                    <input type="file" id="upload-away-logo" className="hidden" accept="image/*" onChange={(e) => handleUploadLogo(e, 'away')} />
                  </div>
                </div>
              </div>

              {/* Tỉ số & Trạng thái */}
              <div className="grid grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tỉ số Nhà</label>
                  <input 
                    type="number" min="0" 
                    value={currentMatch.score?.home ?? 0} 
                    onChange={e => setCurrentMatch({...currentMatch, score: {...currentMatch.score, home: parseInt(e.target.value)}})}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-center text-white focus:border-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tỉ số Khách</label>
                  <input 
                    type="number" min="0" 
                    value={currentMatch.score?.away ?? 0} 
                    onChange={e => setCurrentMatch({...currentMatch, score: {...currentMatch.score, away: parseInt(e.target.value)}})}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-center text-white focus:border-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Trạng thái</label>
                  <select 
                    value={currentMatch.status}
                    onChange={e => setCurrentMatch({...currentMatch, status: e.target.value})}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                  >
                    <option value="notstarted">Chưa bắt đầu</option>
                    <option value="inprogress">Đang diễn ra (Live)</option>
                    <option value="finished">Kết thúc</option>
                    <option value="canceled">Hủy</option>
                    <option value="postponed">Hoãn</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Phút hiện tại (Tùy chọn)</label>
                  <input 
                    type="text" 
                    value={currentMatch.currentMinute || ''} 
                    onChange={e => setCurrentMatch({...currentMatch, currentMinute: e.target.value})}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                    placeholder="VD: 45', HT, FT..."
                  />
              </div>

            </div>
            <div className="p-6 border-t border-white/10 bg-black flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-white/60 font-bold text-sm hover:bg-white/5 transition-colors">
                HỦY
              </button>
              <button onClick={saveMatch} className="px-8 py-3 rounded-xl bg-primary text-black font-black uppercase text-sm tracking-widest shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-105 transition-transform flex items-center gap-2">
                <Save size={16} />
                LƯU LẠI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && matchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111] border border-red-500/20 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-heading font-black text-white uppercase">Xác nhận xóa trận đấu</h3>
              <p className="text-sm text-white/60">
                Bạn có chắc chắn muốn xóa trận đấu <strong>{matchToDelete.homeTeam?.name} vs {matchToDelete.awayTeam?.name}</strong> không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="p-4 border-t border-white/10 bg-black flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 rounded-xl text-white/60 font-bold text-sm hover:bg-white/5 transition-colors">
                HỦY
              </button>
              <button onClick={deleteMatch} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-black uppercase text-sm tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105 transition-transform">
                XÓA NGAY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
