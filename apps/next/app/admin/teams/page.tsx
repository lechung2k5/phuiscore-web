'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, PlusCircle, Edit2, Trash2, 
  ChevronLeft, ChevronRight, X, Save, Upload, Shield
} from 'lucide-react';

export default function TeamCrudPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create'|'edit'>('create');
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Reset trang về 1 khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setTeams(json.data || []);
      }
    } catch (e) {
      console.error('Lỗi lấy danh sách đội bóng:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentTeam({
      name: '', short_name: '', leader: '', area: '', logo_url: '', 
      primary_color: '', founded_year: '', status: 'active', managerId: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (team: any) => {
    setModalMode('edit');
    setCurrentTeam({...team});
    setIsModalOpen(true);
  };

  const handleOpenDelete = (team: any) => {
    setTeamToDelete(team);
    setIsDeleteModalOpen(true);
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setCurrentTeam((prev: any) => ({ ...prev, logo_url: data.url }));
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

  const saveTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = modalMode === 'create' 
        ? `http://localhost:5000/api/admin/teams`
        : `http://localhost:5000/api/admin/teams/${currentTeam.id}`;
      
      const res = await fetch(url, {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(currentTeam)
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchTeams();
      } else {
        alert(json.message || 'Có lỗi xảy ra');
      }
    } catch (e) {
      console.error('Lỗi lưu đội bóng:', e);
    }
  };

  const deleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/teams/${teamToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setIsDeleteModalOpen(false);
        fetchTeams();
      }
    } catch (e) {
      console.error('Lỗi xóa đội bóng:', e);
    }
  };

  // Logic lọc và phân trang
  const filteredTeams = teams.filter(t => {
    // Filter by status
    if (statusFilter !== 'all') {
      const s = String(t.status || '').toLowerCase();
      if (statusFilter !== s) return false;
    }

    // Filter by query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = String(t.name || '').toLowerCase();
    const short = String(t.short_name || '').toLowerCase();
    const area = String(t.area || '').toLowerCase();
    return name.includes(q) || short.includes(q) || area.includes(q);
  });

  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const paginatedTeams = filteredTeams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-160px)] font-body">
      {/* Header & Date Filter */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(0,255,102,0.5)]" />
            <h1 className="text-4xl font-heading font-black tracking-widest text-white uppercase leading-none">
              QUẢN LÝ ĐỘI BÓNG
            </h1>
          </div>
          <p className="text-on-surface-variant font-medium text-sm mt-2 ml-6 opacity-70">
            Xem, thêm, sửa, xóa dữ liệu đội bóng toàn hệ thống
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
            <option value="active" className="bg-[#111]">Hoạt động</option>
            <option value="inactive" className="bg-[#111]">Tạm ngưng</option>
            <option value="banned" className="bg-[#111]">Bị khóa (Banned)</option>
          </select>

          {/* Search Box */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl w-64 transition-all focus-within:border-primary focus-within:bg-white/10">
            <Search size={16} className="text-white/40" />
            <input 
              type="text" 
              placeholder="Tìm Tên đội, Khu vực..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-white outline-none w-full placeholder:text-white/30"
            />
          </div>
          
          <button 
            onClick={handleOpenCreate}
            className="btn-primary h-12 px-6 bg-primary text-black font-heading font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(0,255,102,0.3)] flex items-center gap-2 rounded-2xl"
          >
            <PlusCircle size={16} />
            THÊM ĐỘI BÓNG
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
                    <th className="px-6 py-4">Logo / ID</th>
                    <th className="px-6 py-4">Tên đội bóng</th>
                    <th className="px-6 py-4">Đội trưởng</th>
                    <th className="px-6 py-4">Khu vực</th>
                    <th className="px-6 py-4">Màu áo</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedTeams.map((t) => {
                    const s = String(t.status || '').toLowerCase();
                    let displayLabel = 'Hoạt động';
                    let colorClass = 'border-primary/30 text-primary bg-primary/10';
                    
                    if (s === 'banned') {
                        displayLabel = 'BỊ KHÓA';
                        colorClass = 'border-red-500/30 text-red-500 bg-red-500/10';
                    } else if (s === 'inactive') {
                        displayLabel = 'TẠM NGƯNG';
                        colorClass = 'border-amber-500/30 text-amber-500 bg-amber-500/10';
                    }

                    return (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           {t.logo_url ? (
                               <img src={t.logo_url} alt="" className="w-8 h-8 object-contain rounded-full bg-white/5 p-1" />
                           ) : (
                               <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                   <Shield size={14} className="text-white/30" />
                               </div>
                           )}
                           <span className="text-white/30 font-mono text-[10px]">{t.id?.substring(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-white font-bold text-sm">{t.name}</span>
                          {t.short_name && <span className="text-primary/80 font-bold text-[10px] uppercase">{t.short_name}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-white/80 text-sm font-medium">{t.leader || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-white/60 text-xs">{t.area || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                             {t.primary_color && <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.primary_color }} title={t.primary_color} />}
                             {t.secondary_color && <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.secondary_color }} title={t.secondary_color} />}
                             {!t.primary_color && !t.secondary_color && <span className="text-white/30 text-xs">-</span>}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md border ${colorClass}`}>
                          {displayLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEdit(t)} className="p-2 bg-white/5 hover:bg-primary/20 hover:text-primary text-white/60 rounded-xl transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleOpenDelete(t)} className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-white/60 rounded-xl transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                  {paginatedTeams.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-white/40 font-bold uppercase tracking-widest text-xs">
                        Không có đội bóng nào phù hợp
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
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTeams.length)} trên tổng số {filteredTeams.length}
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={16} className="text-white" />
                  </button>
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
      {isModalOpen && currentTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-heading font-black text-white uppercase tracking-widest">
                {modalMode === 'create' ? 'Thêm Đội Bóng Mới' : 'Chỉnh sửa Đội Bóng'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-8 flex flex-col gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tên đội bóng *</label>
                  <input 
                    type="text" 
                    value={currentTeam.name || ''} 
                    onChange={e => setCurrentTeam({...currentTeam, name: e.target.value})}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                    placeholder="VD: FC Phủi"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tên viết tắt (3 chữ) *</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    value={currentTeam.short_name || ''} 
                    onChange={e => setCurrentTeam({...currentTeam, short_name: e.target.value.toUpperCase()})}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none uppercase font-bold"
                    placeholder="VD: FCP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Đội trưởng *</label>
                  <input 
                    type="text" 
                    value={currentTeam.leader || ''} 
                    onChange={e => setCurrentTeam({...currentTeam, leader: e.target.value})}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                    placeholder="Họ tên đội trưởng"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Khu vực</label>
                  <input 
                    type="text" 
                    value={currentTeam.area || ''} 
                    onChange={e => setCurrentTeam({...currentTeam, area: e.target.value})}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                    placeholder="VD: Hà Nội, TP.HCM..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Link Logo / Huy hiệu</label>
                  <div className="flex items-center gap-2">
                    <input 
                        type="text" 
                        value={currentTeam.logo_url || ''} 
                        onChange={e => setCurrentTeam({...currentTeam, logo_url: e.target.value})}
                        className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none flex-1"
                        placeholder="https://..."
                    />
                    <button onClick={() => document.getElementById('upload-team-logo')?.click()} className="p-3 bg-white/5 border border-white/10 hover:bg-primary hover:text-black hover:border-primary rounded-xl text-white/60 transition-colors shrink-0" disabled={isUploading}>
                        <Upload size={20} />
                    </button>
                    <input type="file" id="upload-team-logo" className="hidden" accept="image/*" onChange={handleUploadLogo} />
                  </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Màu áo chính</label>
                  <div className="flex items-center gap-2 bg-black border border-white/10 rounded-xl px-2 py-1">
                    <input 
                        type="color" 
                        value={currentTeam.primary_color || '#ffffff'} 
                        onChange={e => setCurrentTeam({...currentTeam, primary_color: e.target.value})}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-none outline-none"
                    />
                    <span className="text-white/60 font-mono text-xs">{currentTeam.primary_color || '#...'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Năm thành lập</label>
                  <input 
                    type="number" 
                    value={currentTeam.founded_year || ''} 
                    onChange={e => setCurrentTeam({...currentTeam, founded_year: parseInt(e.target.value) || ''})}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Trạng thái</label>
                  <select 
                    value={currentTeam.status || 'active'}
                    onChange={e => setCurrentTeam({...currentTeam, status: e.target.value})}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm ngưng</option>
                    <option value="banned">Bị khóa (Banned)</option>
                  </select>
                </div>
              </div>

            </div>
            
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-xl text-white/60 font-bold text-sm hover:bg-white/10 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={saveTeam}
                className="px-8 py-3 bg-primary text-black rounded-xl font-black text-sm tracking-widest uppercase hover:shadow-[0_0_20px_rgba(0,255,102,0.4)] transition-all flex items-center gap-2"
              >
                <Save size={16} />
                Lưu Đội Bóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111] border border-red-500/20 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-heading font-black text-white">Xóa Đội Bóng?</h3>
              <p className="text-white/60 text-sm font-medium">
                Bạn có chắc chắn muốn xóa vĩnh viễn đội bóng <strong className="text-white">{teamToDelete.name}</strong> không?
                Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="p-6 bg-red-500/5 border-t border-red-500/10 flex gap-4">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 rounded-xl text-white/60 font-bold text-sm hover:bg-white/10 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={deleteTeam}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black text-sm tracking-widest uppercase hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
