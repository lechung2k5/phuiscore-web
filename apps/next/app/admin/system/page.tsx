'use client';

import React, { useEffect, useState } from 'react';
import { 
  Server, Database, Activity, Clock, Zap, RefreshCw, Trash2, 
  Terminal, ShieldCheck, User, CheckCircle2, XCircle
} from 'lucide-react';

export default function SystemPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [healthRes, logsRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/health', { headers }),
        fetch('http://localhost:5000/api/admin/audit-logs', { headers })
      ]);

      const [healthJson, logsJson] = await Promise.all([
        healthRes.json(), logsRes.json()
      ]);

      if (healthJson.success) setHealthData(healthJson.data);
      if (logsJson.success) setLogs(logsJson.data);
    } catch (e) {
      console.error('Lỗi nạp dữ liệu hệ thống:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Tự động làm mới health mỗi 15s
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      fetch('http://localhost:5000/api/admin/health', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if(d.success) setHealthData(d.data); });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    if(!confirm("Bạn có chắc chắn muốn xóa toàn bộ bộ nhớ đệm (Cache) không? Quá trình này sẽ ép mọi người dùng lấy dữ liệu mới nhất ngay lập tức.")) return;
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/cache/clear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message || (data.success ? 'Đã xóa Cache thành công' : 'Lỗi xóa Cache'));
      fetchData(); // Tải lại logs
    } catch (e) {
      alert('Lỗi kết nối tới Server');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncNews = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('http://localhost:5000/api/news/sync', {
        method: 'POST'
      });
      const data = await res.json();
      if(data.success) {
        alert(`Đã đồng bộ xong! Thêm mới: ${data.synced}, Cập nhật: ${data.updated}, Lỗi: ${data.errors}`);
      } else {
        alert('Lỗi đồng bộ tin tức');
      }
    } catch (e) {
      alert('Lỗi kết nối tới Server');
    } finally {
      setActionLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
  };

  const formatDate = (ts: number) => {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN');
  };

  return (
    <div className="flex flex-col gap-6 font-body pb-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(0,255,102,0.5)]" />
            <h1 className="text-4xl font-heading font-black tracking-widest text-white uppercase leading-none">
              TRUNG TÂM HỆ THỐNG
            </h1>
          </div>
          <p className="text-on-surface-variant font-medium text-sm mt-2 ml-6 opacity-70">
            Giám sát tài nguyên, dọn dẹp bộ nhớ đệm và xem nhật ký hoạt động
          </p>
        </div>
        
        <button 
          onClick={fetchData}
          className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-white transition-colors"
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={20} className={loading ? "animate-spin text-primary" : ""} />
        </button>
      </div>

      {loading && !healthData ? (
        <div className="flex items-center justify-center p-20">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Top Row: Health & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Server Health Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="glass-panel p-6 rounded-[2rem] border border-white/10 bg-[#0A0A0A] flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <Server size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xs font-heading font-black uppercase text-white/50 tracking-widest">Máy chủ (RAM)</h3>
                    <p className="text-2xl font-black text-white">{healthData?.system?.memory?.rss || '0MB'}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs font-mono text-white/40">
                  Heap: {healthData?.system?.memory?.heapUsed} / {healthData?.system?.memory?.heapTotal}
                </div>
              </div>

              <div className="glass-panel p-6 rounded-[2rem] border border-white/10 bg-[#0A0A0A] flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <Database size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-heading font-black uppercase text-white/50 tracking-widest">Dynamo DB</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {healthData?.database === 'online' ? (
                        <><CheckCircle2 size={16} className="text-primary" /><span className="text-lg font-black text-white">ONLINE</span></>
                      ) : (
                        <><XCircle size={16} className="text-red-500" /><span className="text-lg font-black text-white">LỖI</span></>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-[2rem] border border-white/10 bg-[#0A0A0A] flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <Zap size={20} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-heading font-black uppercase text-white/50 tracking-widest">Redis Cache</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {healthData?.redis === 'ready' || healthData?.redis === 'online' ? (
                        <><CheckCircle2 size={16} className="text-primary" /><span className="text-lg font-black text-white">ONLINE</span></>
                      ) : (
                        <><XCircle size={16} className="text-red-500" /><span className="text-lg font-black text-white">MẤT KẾT NỐI</span></>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-[2rem] border border-white/10 bg-[#0A0A0A] flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <Clock size={20} className="text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-heading font-black uppercase text-white/50 tracking-widest">Uptime</h3>
                    <p className="text-xl font-black text-white mt-1">{formatUptime(healthData?.system?.uptime || 0)}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs font-mono text-white/40">
                  Node {healthData?.system?.nodeVersion}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-panel p-8 rounded-[2rem] border border-white/10 bg-[#0A0A0A] flex flex-col gap-6">
              <h3 className="text-sm font-heading font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Terminal size={16} className="text-primary" /> Điều khiển nhanh
              </h3>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleClearCache}
                  disabled={actionLoading}
                  className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl flex flex-col gap-1 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest">
                    <Trash2 size={16} /> Dọn dẹp Cache (Xóa Cache)
                  </div>
                  <span className="text-[10px] text-white/50 font-medium">Xóa toàn bộ Cache API, ép Client nhận dữ liệu mới</span>
                </button>

                <button 
                  onClick={handleSyncNews}
                  disabled={actionLoading}
                  className="w-full p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-2xl flex flex-col gap-1 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 text-blue-500 font-bold uppercase text-xs tracking-widest">
                    <RefreshCw size={16} className={actionLoading ? "animate-spin" : ""} /> Kích hoạt Bot Cào Tin
                  </div>
                  <span className="text-[10px] text-white/50 font-medium">Bắt buộc Bot thu thập bài viết mới nhất từ nguồn ngoài ngay lập tức</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="glass-panel rounded-[2rem] border border-white/10 bg-[#0A0A0A] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/5 flex items-center gap-3">
               <ShieldCheck size={20} className="text-primary" />
               <h3 className="text-sm font-heading font-black uppercase tracking-widest text-white">Nhật ký Hoạt động (Audit Logs)</h3>
            </div>
            
            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-10">
                  <tr className="border-b border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Tài khoản (Admin)</th>
                    <th className="px-6 py-4">Hành động</th>
                    <th className="px-6 py-4">Đối tượng (ID)</th>
                    <th className="px-6 py-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => {
                    const actionColors: Record<string, string> = {
                      'CREATE': 'text-green-400 bg-green-400/10 border-green-400/20',
                      'UPDATE': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
                      'DELETE': 'text-red-400 bg-red-400/10 border-red-400/20',
                      'CLEAR': 'text-orange-400 bg-orange-400/10 border-orange-400/20'
                    };
                    const type = log.action.split('_')[0];
                    const colorClass = actionColors[type] || 'text-white/60 bg-white/5 border-white/10';

                    return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className="text-white/60 text-xs font-mono">{formatDate(log.timestamp)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                             <User size={12} className="text-primary" />
                           </div>
                           <span className="text-white font-bold text-xs">{log.userId || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 py-1 text-[10px] font-black rounded border ${colorClass}`}>
                            {log.action}
                         </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className="text-white/40 text-[10px] font-mono">{log.entityType} #{log.entityId?.substring(0, 8)}</span>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-white/80 text-xs font-medium">{log.note || '-'}</span>
                      </td>
                    </tr>
                  )})}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-white/40 font-bold uppercase tracking-widest text-xs">
                        Chưa có nhật ký hoạt động nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
