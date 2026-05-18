'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Trophy, Search, Plus, Eye, Edit3, Trash2,
  MapPin, Users, ChevronRight, X, Save, AlertTriangle, CheckCircle
} from 'lucide-react';
import Link from 'next/link';

const API = 'http://localhost:5000';

interface Tournament {
  id: string;
  name: string;
  region: string;
  status: string;
  maxTeams?: number;
  logo?: string;
  banner?: string;
  teams?: any[];
  organizerName?: string;
  startDate?: string;
  description?: string;
}

type ModalMode = 'create' | 'edit' | 'delete' | null;

const EMPTY_FORM = {
  name: '',
  region: '',
  status: 'Registration',
  maxTeams: 16,
  logo: '',
  banner: '',
  description: '',
  organizerName: '',
};

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('admin_tournaments');
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  });
  const [filtered, setFiltered] = useState<Tournament[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('admin_tournaments');
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const getToken = () => localStorage.getItem('token') || '';

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/tournaments/list`);
      const json = await res.json();
      if (json.success) {
        setTournaments(json.data);
        setFiltered(json.data);
        sessionStorage.setItem('admin_tournaments', JSON.stringify(json.data)); // Lưu cache
      }
    } catch (e) {
      console.error('Lỗi lấy danh sách giải đấu:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  // Search filter
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      tournaments.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.region?.toLowerCase().includes(q) ||
        t.organizerName?.toLowerCase().includes(q)
      )
    );
  }, [search, tournaments]);

  // Open modals
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSelected(null);
    setModalMode('create');
  };
  const openEdit = (t: Tournament) => {
    setSelected(t);
    setForm({
      name: t.name || '',
      region: t.region || '',
      status: t.status || 'Registration',
      maxTeams: t.maxTeams || 16,
      logo: t.logo || '',
      banner: t.banner || '',
      description: t.description || '',
      organizerName: t.organizerName || '',
    });
    setModalMode('edit');
  };
  const openDelete = (t: Tournament) => {
    setSelected(t);
    setModalMode('delete');
  };
  const closeModal = () => { setModalMode(null); setSelected(null); };

  // ── CREATE ─────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim()) return showToast('error', 'Vui lòng nhập tên giải đấu!');
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/tournaments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        showToast('success', 'Đã tạo giải đấu thành công!');
        closeModal();
        // Thêm ngay vào state không cần reload
        if (json.data) {
          const updated = [...tournaments, json.data];
          setTournaments(updated);
          setFiltered(updated);
        } else {
          fetchTournaments(); // fallback nếu API không trả về data
        }
      } else {
        showToast('error', json.message || 'Tạo thất bại!');
      }
    } catch {
      showToast('error', 'Lỗi kết nối server!');
    } finally {
      setSaving(false);
    }
  };

  // ── UPDATE ─────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/tournaments/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        showToast('success', 'Cập nhật giải đấu thành công!');
        closeModal();
        // Cập nhật ngay trong state
        const updatedList = tournaments.map(t =>
          t.id === selected.id ? { ...t, ...form } : t
        );
        setTournaments(updatedList);
        setFiltered(updatedList.filter(t => {
          const q = search.toLowerCase();
          return t.name?.toLowerCase().includes(q) ||
                 t.region?.toLowerCase().includes(q) ||
                 t.organizerName?.toLowerCase().includes(q);
        }));
      } else {
        showToast('error', json.message || 'Cập nhật thất bại!');
      }
    } catch {
      showToast('error', 'Lỗi kết nối server!');
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/tournaments/${selected.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (res.ok) {
        // Optimistic: xóa ngay khỏi state, không cần reload từ server
        const updatedList = tournaments.filter(t => t.id !== selected.id);
        setTournaments(updatedList);
        setFiltered(updatedList.filter(t => {
          const q = search.toLowerCase();
          return t.name?.toLowerCase().includes(q) ||
                 t.region?.toLowerCase().includes(q) ||
                 t.organizerName?.toLowerCase().includes(q);
        }));
        showToast('success', `Đã xóa "${selected.name}"!`);
        closeModal();
      } else {
        showToast('error', json.message || 'Xóa thất bại!');
      }
    } catch {
      showToast('error', 'Lỗi kết nối server!');
    } finally {
      setSaving(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'registration': return { label: 'Đang mở ĐK', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' };
      case 'ongoing': return { label: 'Đang diễn ra', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
      case 'finished': return { label: 'Đã kết thúc', color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' };
      default: return { label: status || 'N/A', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
    }
  };

  // ── SHARED FORM FIELDS ─────────────────────────────────────
  const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-heading font-black text-white/40 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
  const inputCls = "bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-medium placeholder:text-white/20 outline-none focus:border-primary transition-all w-full";

  // Chỉ hiện spinner khi đang load LẦN ĐẦU và chưa có dữ liệu nào (kể cả cache)
  if (loading && tournaments.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-on-surface-variant font-heading font-black uppercase tracking-[0.3em] text-xs">Đang tải...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-10 font-body relative">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl transition-all ${
          toast.type === 'success'
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span className="font-bold text-sm">{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(0,255,102,0.5)]" />
            <h1 className="text-6xl font-heading font-black tracking-[0.05em] text-white uppercase leading-none">QUẢN LÝ GIẢI ĐẤU</h1>
            {loading && tournaments.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Đang cập nhật</span>
              </div>
            )}
          </div>
          <p className="text-on-surface-variant font-medium text-sm mt-4 ml-6 opacity-70">Thiết lập, điều hành và theo dõi các giải đấu trên hệ thống</p>
        </div>
        <button onClick={openCreate} className="h-14 px-8 bg-primary text-black font-heading font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_0_30px_rgba(0,255,102,0.3)] hover:shadow-[0_0_50px_rgba(0,255,102,0.5)] flex items-center gap-3 transition-all">
          <Plus size={18} />
          TẠO GIẢI ĐẤU MỚI
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-[#0A0A0A] border border-white/10 px-6 py-4 rounded-2xl focus-within:border-primary transition-all">
        <Search size={20} className="text-white/20 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo tên, khu vực, ban tổ chức..."
          className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/20 font-medium"
        />
      </div>

      {/* Table */}
      <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/10 bg-[#0A0A0A]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/10">
              <th className="px-8 py-6 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em]">Giải đấu</th>
              <th className="px-8 py-6 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em]">Khu vực</th>
              <th className="px-8 py-6 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em]">Đội</th>
              <th className="px-8 py-6 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em]">Trạng thái</th>
              <th className="px-8 py-6 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em] text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((t) => {
              const status = getStatusInfo(t.status);
              return (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {t.logo ? (
                        <img src={t.logo} alt={t.name} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-all">
                          <Trophy size={20} className="text-primary" />
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-bold text-base group-hover:text-primary transition-colors leading-tight">{t.name}</span>
                        {t.organizerName && <span className="text-white/30 text-xs font-medium">{t.organizerName}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-white/60">
                      <MapPin size={14} className="text-white/20 shrink-0" />
                      <span className="font-medium text-sm">{t.region || '—'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-white/20" />
                      <span className="text-white font-bold">{(t.teams || []).length}</span>
                      {t.maxTeams && <span className="text-white/20 text-xs">/ {t.maxTeams}</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${status.bg} ${status.color} ${status.border}`}>
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status.color.replace('text-', 'bg-')}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/tournaments/${t.id}`} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Xem chi tiết">
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => openEdit(t)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all" title="Chỉnh sửa">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => openDelete(t)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/5 transition-all" title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-24 text-center flex flex-col items-center gap-6">
            <Trophy size={64} className="text-primary opacity-5" />
            <div className="flex flex-col gap-2">
              <p className="text-white font-heading font-black uppercase tracking-[0.4em] text-lg">
                {search ? 'Không tìm thấy kết quả' : 'Chưa có giải đấu nào'}
              </p>
              <p className="text-white/30 font-medium text-sm">
                {search ? `Không có giải đấu nào khớp với "${search}"` : 'Nhấn "Tạo giải đấu mới" để bắt đầu'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex justify-between items-center px-2">
        <p className="text-white/40 text-xs font-medium">
          Hiển thị <span className="text-white font-bold">{filtered.length}</span>
          {search && <span> / {tournaments.length}</span>} giải đấu
        </p>
      </div>

      {/* ── MODAL OVERLAY ────────────────────────────────── */}
      {modalMode && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >

          {/* DELETE CONFIRM */}
          {modalMode === 'delete' && (
            <div className="bg-[#0D0D0D] border border-red-500/20 rounded-[2rem] p-10 max-w-md w-full flex flex-col gap-8 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={28} className="text-red-400" />
                </div>
                <button onClick={closeModal} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <h2 className="text-2xl font-heading font-black text-white uppercase">Xác nhận xóa</h2>
                <p className="text-white/60 font-medium leading-relaxed">
                  Bạn có chắc muốn xóa giải đấu <span className="text-red-400 font-bold">"{selected?.name}"</span>?
                  <br />Hành động này <span className="text-red-400 font-bold">không thể hoàn tác</span> và sẽ xóa toàn bộ dữ liệu liên quan.
                </p>
              </div>
              <div className="flex gap-4">
                <button onClick={closeModal} className="flex-1 h-12 border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-all">
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 h-12 bg-red-500 text-white font-heading font-black uppercase tracking-wider rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={16} />}
                  XÓA GIẢI ĐẤU
                </button>
              </div>
            </div>
          )}

          {/* CREATE / EDIT FORM */}
          {(modalMode === 'create' || modalMode === 'edit') && (
            <div className="bg-[#0D0D0D] border border-white/10 rounded-[2rem] p-10 max-w-2xl w-full flex flex-col gap-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-heading font-black text-white uppercase">
                    {modalMode === 'create' ? '⚡ Tạo Giải Đấu Mới' : '✏️ Chỉnh Sửa Giải Đấu'}
                  </h2>
                  <p className="text-white/40 text-sm font-medium">
                    {modalMode === 'edit' ? `Đang sửa: ${selected?.name}` : 'Điền thông tin bên dưới để tạo giải đấu'}
                  </p>
                </div>
                <button onClick={closeModal} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <FormField label="Tên giải đấu *">
                    <input className={inputCls} placeholder="Vd: Giải Bóng Đá Phủi Hà Nội Mở Rộng" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </FormField>
                </div>

                <FormField label="Khu vực / Địa điểm">
                  <input className={inputCls} placeholder="Vd: Hà Nội, TP.HCM..." value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} />
                </FormField>

                <FormField label="Ban tổ chức">
                  <input className={inputCls} placeholder="Tên đơn vị / cá nhân tổ chức" value={form.organizerName} onChange={e => setForm(f => ({ ...f, organizerName: e.target.value }))} />
                </FormField>

                <FormField label="Số đội tối đa">
                  <input className={inputCls} type="number" min={2} max={128} value={form.maxTeams} onChange={e => setForm(f => ({ ...f, maxTeams: Number(e.target.value) }))} />
                </FormField>

                <FormField label="Trạng thái">
                  <select className={inputCls} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="Registration">Đang mở đăng ký</option>
                    <option value="Ongoing">Đang diễn ra</option>
                    <option value="Finished">Đã kết thúc</option>
                    <option value="Draft">Bản nháp</option>
                  </select>
                </FormField>

                <div className="col-span-2">
                  <FormField label="Link Logo (URL)">
                    <input className={inputCls} placeholder="https://..." value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} />
                  </FormField>
                </div>

                <div className="col-span-2">
                  <FormField label="Link Banner (URL)">
                    <input className={inputCls} placeholder="https://..." value={form.banner} onChange={e => setForm(f => ({ ...f, banner: e.target.value }))} />
                  </FormField>
                </div>

                <div className="col-span-2">
                  <FormField label="Mô tả">
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={3}
                      placeholder="Mô tả ngắn về giải đấu..."
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </FormField>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2 border-t border-white/5">
                <button onClick={closeModal} className="flex-1 h-12 border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-all">
                  Hủy bỏ
                </button>
                <button
                  onClick={modalMode === 'create' ? handleCreate : handleUpdate}
                  disabled={saving}
                  className="flex-1 h-12 bg-primary text-black font-heading font-black uppercase tracking-wider rounded-xl hover:shadow-[0_0_30px_rgba(0,255,102,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving
                    ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    : <Save size={16} />
                  }
                  {modalMode === 'create' ? 'TẠO GIẢI ĐẤU' : 'LƯU THAY ĐỔI'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentsPage;
