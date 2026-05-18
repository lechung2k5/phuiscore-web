'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Trophy, ArrowLeft, MapPin, Users, Calendar, Edit3,
  CheckCircle, XCircle, AlertTriangle, Clock, Shield,
  ChevronRight, RefreshCw, Globe, Phone, FileText
} from 'lucide-react';

const API = 'http://localhost:5000';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Pending:       { label: 'Chờ duyệt',   color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20' },
  Approved:      { label: 'Đã duyệt',    color: 'text-sky-400',    bg: 'bg-sky-400/10',    border: 'border-sky-400/20' },
  Confirmed:     { label: 'Xác nhận',    color: 'text-primary',    bg: 'bg-primary/10',    border: 'border-primary/20' },
  RequireUpdate: { label: 'Cần bổ sung', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  Rejected:      { label: 'Từ chối',     color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
};

const TOURNAMENT_STATUS: Record<string, { label: string; color: string }> = {
  Registration: { label: 'Đang mở ĐK',   color: 'text-sky-400' },
  Opening:      { label: 'Chuẩn bị KM',  color: 'text-amber-400' },
  Ongoing:      { label: 'Đang diễn ra', color: 'text-primary' },
  Finished:     { label: 'Đã kết thúc',  color: 'text-white/40' },
  Draft:        { label: 'Bản nháp',     color: 'text-white/30' },
};

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'teams'>('info');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [updatingTeam, setUpdatingTeam] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const getToken = () => localStorage.getItem('token') || '';

  const fetchTournament = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/tournaments/${id}`);
      const json = await res.json();
      if (json.success) setTournament(json.data);
      else showToast('error', 'Không tìm thấy giải đấu!');
    } catch {
      showToast('error', 'Lỗi kết nối server!');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTournament(); }, [fetchTournament]);

  // Duyệt / từ chối đội
  const updateTeamStatus = async (teamId: string, status: string, note?: string) => {
    setUpdatingTeam(teamId);
    try {
      const res = await fetch(`${API}/api/tournaments/${id}/teams/${teamId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ status, btcNote: note || '' }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast('success', `Đã cập nhật: ${status}`);
        setTournament(json.data);
      } else {
        showToast('error', json.message || 'Cập nhật thất bại!');
      }
    } catch {
      showToast('error', 'Lỗi kết nối server!');
    } finally {
      setUpdatingTeam(null);
    }
  };

  // Đổi trạng thái giải đấu
  const changeTournamentStatus = async (action: string) => {
    const endpointMap: Record<string, string> = {
      publish:           `${API}/api/tournaments/${id}/publish`,
      closeRegistration: `${API}/api/tournaments/${id}/close-registration`,
      activate:          `${API}/api/tournaments/${id}/activate`,
    };
    try {
      const res = await fetch(endpointMap[action], {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (res.ok) {
        showToast('success', json.message);
        fetchTournament();
      } else {
        showToast('error', json.message);
      }
    } catch {
      showToast('error', 'Lỗi kết nối!');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-white/40 font-heading font-black uppercase tracking-widest text-xs">Đang tải...</p>
    </div>
  );

  if (!tournament) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <Trophy size={64} className="text-primary opacity-10" />
      <p className="text-white/40 font-heading font-black uppercase tracking-widest">Không tìm thấy giải đấu</p>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-primary font-bold hover:underline">
        <ArrowLeft size={16} /> Quay lại
      </button>
    </div>
  );

  const tStatus = TOURNAMENT_STATUS[tournament.status] || { label: tournament.status, color: 'text-white/40' };
  const teams: any[] = tournament.teams || [];
  const pendingCount = teams.filter(t => t.status === 'Pending').length;

  return (
    <div className="flex flex-col gap-8 font-body relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl ${
          toast.type === 'success' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span className="font-bold text-sm">{toast.msg}</span>
        </div>
      )}

      {/* Back + Header */}
      <div className="flex flex-col gap-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors font-bold text-sm w-fit">
          <ArrowLeft size={16} /> Quay lại Quản lý Giải đấu
        </button>

        <div className="flex justify-between items-start gap-6">
          <div className="flex items-center gap-6">
            {tournament.banner ? (
              <img src={tournament.banner} alt={tournament.name} className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
            ) : (
              <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                <Trophy size={36} className="text-primary" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(0,255,102,0.5)]" />
                <h1 className="text-4xl font-heading font-black text-white uppercase leading-none">{tournament.name}</h1>
              </div>
              <div className="flex items-center gap-4 ml-5">
                <span className={`text-sm font-bold ${tStatus.color}`}>● {tStatus.label}</span>
                {tournament.region && (
                  <span className="flex items-center gap-1.5 text-white/40 text-sm">
                    <MapPin size={13} /> {tournament.region}
                  </span>
                )}
                {tournament.organizerName && (
                  <span className="flex items-center gap-1.5 text-white/40 text-sm">
                    <Shield size={13} /> {tournament.organizerName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 shrink-0">
            <button onClick={fetchTournament} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Làm mới">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => router.push(`/admin/tournaments`)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-primary hover:border-primary/50 transition-all" title="Sửa">
              <Edit3 size={16} />
            </button>
            {tournament.status === 'Draft' && (
              <button onClick={() => changeTournamentStatus('publish')} className="h-10 px-5 bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold text-xs rounded-xl hover:bg-sky-500/20 transition-all">
                MỞ ĐĂNG KÝ
              </button>
            )}
            {tournament.status === 'Registration' && (
              <button onClick={() => changeTournamentStatus('closeRegistration')} className="h-10 px-5 bg-amber-400/10 border border-amber-400/30 text-amber-400 font-bold text-xs rounded-xl hover:bg-amber-400/20 transition-all">
                ĐÓNG ĐĂNG KÝ
              </button>
            )}
            {tournament.status === 'Opening' && (
              <button onClick={() => changeTournamentStatus('activate')} className="h-10 px-5 bg-primary text-black font-heading font-black text-xs rounded-xl hover:shadow-[0_0_20px_rgba(0,255,102,0.4)] transition-all">
                KHAI MẠC
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tổng đội', value: teams.length, icon: Users, color: '#00FF66' },
          { label: 'Chờ duyệt', value: pendingCount, icon: Clock, color: '#FFB800' },
          { label: 'Xác nhận', value: teams.filter(t => t.status === 'Confirmed').length, icon: CheckCircle, color: '#38BDF8' },
          { label: 'Tối đa', value: tournament.maxTeams || '∞', icon: Shield, color: '#A855F7' },
        ].map((s, i) => (
          <div key={i} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-heading font-black text-white">{s.value}</p>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0A0A0A] border border-white/10 p-1.5 rounded-2xl w-fit">
        {(['info', 'teams'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl font-heading font-black uppercase text-xs tracking-widest transition-all ${
              activeTab === tab
                ? 'bg-primary text-black shadow-[0_0_20px_rgba(0,255,102,0.3)]'
                : 'text-white/40 hover:text-white'
            }`}
          >
            {tab === 'info' ? 'Thông tin' : `Đội đăng ký ${teams.length > 0 ? `(${teams.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* TAB: INFO */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col gap-6">
            <h3 className="text-xs font-heading font-black text-white/40 uppercase tracking-widest">Thông tin cơ bản</h3>
            {[
              { label: 'Tên giải', value: tournament.name, icon: Trophy },
              { label: 'Khu vực', value: tournament.region, icon: MapPin },
              { label: 'Ban tổ chức', value: tournament.organizerName, icon: Shield },
              { label: 'Thể thức', value: tournament.format, icon: FileText },
              { label: 'Số đội tối đa', value: tournament.maxTeams, icon: Users },
              { label: 'Loại sân', value: tournament.pitchType, icon: Globe },
              { label: 'Lệ phí tham dự', value: tournament.entryFee ? `${Number(tournament.entryFee).toLocaleString('vi')}đ` : 'Miễn phí', icon: CheckCircle },
              { label: 'SĐT liên hệ', value: tournament.phone, icon: Phone },
              { label: 'Deadline ĐK', value: tournament.deadline, icon: Calendar },
            ].filter(r => r.value).map((row, i) => (
              <div key={i} className="flex items-center gap-4">
                <row.icon size={14} className="text-white/20 shrink-0" />
                <span className="text-white/40 text-sm w-36 shrink-0">{row.label}</span>
                <span className="text-white font-medium text-sm">{String(row.value)}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col gap-6">
            <h3 className="text-xs font-heading font-black text-white/40 uppercase tracking-widest">Lịch & Mô tả</h3>
            {tournament.expectedStartDate && (
              <div className="flex items-center gap-4">
                <Calendar size={14} className="text-white/20" />
                <span className="text-white/40 text-sm w-36">Bắt đầu dự kiến</span>
                <span className="text-white font-medium text-sm">{tournament.expectedStartDate}</span>
              </div>
            )}
            {tournament.expectedEndDate && (
              <div className="flex items-center gap-4">
                <Calendar size={14} className="text-white/20" />
                <span className="text-white/40 text-sm w-36">Kết thúc dự kiến</span>
                <span className="text-white font-medium text-sm">{tournament.expectedEndDate}</span>
              </div>
            )}
            {tournament.description && (
              <div className="flex flex-col gap-2">
                <span className="text-white/40 text-xs uppercase tracking-widest font-bold">Mô tả</span>
                <p className="text-white/70 text-sm leading-relaxed">{tournament.description}</p>
              </div>
            )}
            {!tournament.description && !tournament.expectedStartDate && (
              <p className="text-white/20 text-sm italic">Chưa có thông tin bổ sung</p>
            )}
          </div>
        </div>
      )}

      {/* TAB: TEAMS */}
      {activeTab === 'teams' && (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-[2rem] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10">
                <th className="px-8 py-5 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em]">Tên đội</th>
                <th className="px-8 py-5 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em]">Trưởng đoàn</th>
                <th className="px-8 py-5 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em]">Cầu thủ</th>
                <th className="px-8 py-5 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em]">Trạng thái</th>
                <th className="px-8 py-5 text-[11px] font-heading font-black text-white/40 uppercase tracking-[0.2em] text-right">Duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teams.map((team: any) => {
                const ts = STATUS_MAP[team.status] || STATUS_MAP['Pending'];
                const isUpdating = updatingTeam === team.id;
                return (
                  <tr key={team.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        {team.logo ? (
                          <img src={team.logo} alt={team.teamName} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                            <Shield size={16} className="text-white/20" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-bold text-sm group-hover:text-primary transition-colors">{team.teamName}</p>
                          {team.btcNote && <p className="text-amber-400 text-xs font-medium mt-0.5">📝 {team.btcNote}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-white/80 text-sm font-medium">{team.managerName || '—'}</p>
                        {team.managerPhone && <p className="text-white/30 text-xs">{team.managerPhone}</p>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-white font-bold">{team.playerCount || (team.players?.length) || 0}</span>
                      <span className="text-white/30 text-xs ml-1">cầu thủ</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${ts.bg} ${ts.color} ${ts.border}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${ts.color.replace('text-', 'bg-')}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{ts.label}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-2">
                        {isUpdating ? (
                          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : (
                          <>
                            {team.status !== 'Confirmed' && (
                              <button
                                onClick={() => updateTeamStatus(team.id, 'Confirmed')}
                                className="p-2 bg-primary/10 border border-primary/30 rounded-xl text-primary hover:bg-primary/20 transition-all"
                                title="Xác nhận"
                              >
                                <CheckCircle size={15} />
                              </button>
                            )}
                            {team.status !== 'Approved' && team.status !== 'Confirmed' && (
                              <button
                                onClick={() => updateTeamStatus(team.id, 'Approved')}
                                className="p-2 bg-sky-400/10 border border-sky-400/30 rounded-xl text-sky-400 hover:bg-sky-400/20 transition-all"
                                title="Duyệt"
                              >
                                <ChevronRight size={15} />
                              </button>
                            )}
                            {team.status !== 'Rejected' && (
                              <button
                                onClick={() => updateTeamStatus(team.id, 'Rejected', 'Hồ sơ không đủ điều kiện')}
                                className="p-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/20 transition-all"
                                title="Từ chối"
                              >
                                <XCircle size={15} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {teams.length === 0 && (
            <div className="p-20 flex flex-col items-center gap-4">
              <Users size={48} className="text-white/5" />
              <p className="text-white/20 font-heading font-black uppercase tracking-widest text-xs">Chưa có đội nào đăng ký</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
