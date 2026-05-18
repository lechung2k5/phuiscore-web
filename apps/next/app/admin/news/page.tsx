'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, PlusCircle, Edit2, Trash2, 
  ChevronLeft, ChevronRight, X, Save, Upload, FileText, Globe
} from 'lucide-react';

export default function NewsCrudPage() {
  const [newsList, setNewsList] = useState<any[]>([]);
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
  const [currentNews, setCurrentNews] = useState<any>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Reset trang về 1 khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/news`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setNewsList(json.data || []);
      }
    } catch (e) {
      console.error('Lỗi lấy danh sách tin tức:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentNews({
      title: '', slug: '', summary: '', content: '', thumbnail: '', 
      author: 'Ban Biên Tập', status: 'published'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (news: any) => {
    setModalMode('edit');
    setCurrentNews({...news});
    setIsModalOpen(true);
  };

  const handleOpenDelete = (news: any) => {
    setNewsToDelete(news);
    setIsDeleteModalOpen(true);
  };

  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'news');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setCurrentNews((prev: any) => ({ ...prev, thumbnail: data.url }));
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

  const saveNews = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = modalMode === 'create' 
        ? `http://localhost:5000/api/admin/news`
        : `http://localhost:5000/api/admin/news/${currentNews.id}`;
      
      const res = await fetch(url, {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(currentNews)
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchNews();
      } else {
        alert(json.message || 'Có lỗi xảy ra');
      }
    } catch (e) {
      console.error('Lỗi lưu tin tức:', e);
    }
  };

  const deleteNews = async () => {
    if (!newsToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/news/${newsToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setIsDeleteModalOpen(false);
        fetchNews();
      }
    } catch (e) {
      console.error('Lỗi xóa tin tức:', e);
    }
  };

  // Logic lọc và phân trang
  const filteredNews = newsList.filter(n => {
    // Filter by status
    if (statusFilter !== 'all') {
      const s = String(n.status || 'published').toLowerCase();
      if (statusFilter !== s) return false;
    }

    // Filter by query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = String(n.title || '').toLowerCase();
    const author = String(n.author || '').toLowerCase();
    return title.includes(q) || author.includes(q);
  });

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const paginatedNews = filteredNews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDate = (dateString: string | number) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return String(dateString);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-160px)] font-body">
      {/* Header & Filter */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(0,255,102,0.5)]" />
            <h1 className="text-4xl font-heading font-black tracking-widest text-white uppercase leading-none">
              QUẢN LÝ TIN TỨC
            </h1>
          </div>
          <p className="text-on-surface-variant font-medium text-sm mt-2 ml-6 opacity-70">
            Quản lý các bài viết tự động từ Bot hoặc bài viết độc quyền
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
            <option value="published" className="bg-[#111]">Đã xuất bản</option>
            <option value="hidden" className="bg-[#111]">Đang ẩn</option>
          </select>

          {/* Search Box */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl w-64 transition-all focus-within:border-primary focus-within:bg-white/10">
            <Search size={16} className="text-white/40" />
            <input 
              type="text" 
              placeholder="Tìm theo tiêu đề, tác giả..." 
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
            THÊM BÀI VIẾT
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
                    <th className="px-6 py-4">Ảnh Bìa</th>
                    <th className="px-6 py-4">Tiêu đề bài viết</th>
                    <th className="px-6 py-4">Tác giả</th>
                    <th className="px-6 py-4">Ngày đăng</th>
                    <th className="px-6 py-4">Nguồn</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedNews.map((n) => {
                    const s = String(n.status || 'published').toLowerCase();
                    const isPublished = s === 'published';

                    return (
                    <tr key={n.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="w-16 h-10 rounded-lg overflow-hidden border border-white/10 bg-white/5 relative">
                          {n.thumbnail ? (
                            <img src={n.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText size={16} className="text-white/30" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex flex-col gap-1">
                          <span className="text-white font-bold text-sm line-clamp-2" title={n.title}>{n.title}</span>
                          <span className="text-white/40 text-[10px] truncate">{n.slug}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-white/80 text-sm font-medium">{n.author || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-white/60 text-xs font-mono">{formatDate(n.published_at || n.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                         {n.isCustom ? (
                           <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1 w-max">
                             <FileText size={10} /> THỦ CÔNG
                           </span>
                         ) : (
                           <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 w-max">
                             <Globe size={10} /> BOT CÀO
                           </span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md border ${
                          isPublished ? 'border-primary/30 text-primary bg-primary/10' : 'border-white/20 text-white/40 bg-white/5'
                        }`}>
                          {isPublished ? 'XUẤT BẢN' : 'ĐANG ẨN'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEdit(n)} className="p-2 bg-white/5 hover:bg-primary/20 hover:text-primary text-white/60 rounded-xl transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleOpenDelete(n)} className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-white/60 rounded-xl transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                  {paginatedNews.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-white/40 font-bold uppercase tracking-widest text-xs">
                        Không có bài viết nào phù hợp
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
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredNews.length)} trên tổng số {filteredNews.length}
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
      {isModalOpen && currentNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-heading font-black text-white uppercase tracking-widest flex items-center gap-3">
                {modalMode === 'create' ? 'Viết Bài Mới' : 'Chỉnh sửa Bài Viết'}
                {currentNews.isCustom === false && (
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-md">
                    BÀI VIẾT TỪ BOT
                  </span>
                )}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tiêu đề bài viết *</label>
                <input 
                  type="text" 
                  value={currentNews.title || ''} 
                  onChange={e => setCurrentNews({...currentNews, title: e.target.value})}
                  className="bg-black border border-white/10 rounded-xl px-4 py-3 text-lg text-white font-bold focus:border-primary outline-none"
                  placeholder="Nhập tiêu đề..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Đường dẫn tĩnh (Slug)</label>
                <input 
                  type="text" 
                  value={currentNews.slug || ''} 
                  onChange={e => setCurrentNews({...currentNews, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                  className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white/60 focus:border-primary outline-none font-mono"
                  placeholder="Để trống sẽ tự tạo từ tiêu đề"
                  disabled={!currentNews.isCustom && modalMode === 'edit'} // Don't let them easily change bot slug
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Link Ảnh Bìa (Thumbnail)</label>
                    <div className="flex items-center gap-2">
                      <input 
                          type="text" 
                          value={currentNews.thumbnail || ''} 
                          onChange={e => setCurrentNews({...currentNews, thumbnail: e.target.value})}
                          className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none flex-1"
                          placeholder="https://..."
                      />
                      <button onClick={() => document.getElementById('upload-news-thumb')?.click()} className="p-3 bg-white/5 border border-white/10 hover:bg-primary hover:text-black hover:border-primary rounded-xl text-white/60 transition-colors shrink-0" disabled={isUploading}>
                          <Upload size={20} />
                      </button>
                      <input type="file" id="upload-news-thumb" className="hidden" accept="image/*" onChange={handleUploadThumbnail} />
                    </div>
                    {currentNews.thumbnail && (
                      <div className="mt-2 w-full h-32 rounded-lg overflow-hidden border border-white/10 relative">
                         <img src={currentNews.thumbnail} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                </div>

                <div className="flex flex-col gap-6">
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tác giả</label>
                     <input 
                       type="text" 
                       value={currentNews.author || ''} 
                       onChange={e => setCurrentNews({...currentNews, author: e.target.value})}
                       className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                     />
                   </div>
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Trạng thái</label>
                     <select 
                       value={currentNews.status || 'published'}
                       onChange={e => setCurrentNews({...currentNews, status: e.target.value})}
                       className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                     >
                       <option value="published">Xuất bản</option>
                       <option value="hidden">Ẩn bài</option>
                     </select>
                   </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tóm tắt (Summary)</label>
                <textarea 
                  value={currentNews.summary || ''} 
                  onChange={e => setCurrentNews({...currentNews, summary: e.target.value})}
                  className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none min-h-[80px] custom-scrollbar"
                  placeholder="Nhập tóm tắt bài viết..."
                />
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center justify-between">
                  Nội dung chi tiết (Content - HTML)
                </label>
                <textarea 
                  value={currentNews.content || ''} 
                  onChange={e => setCurrentNews({...currentNews, content: e.target.value})}
                  className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none min-h-[300px] font-mono custom-scrollbar"
                  placeholder="Nhập nội dung HTML..."
                />
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
                onClick={saveNews}
                className="px-8 py-3 bg-primary text-black rounded-xl font-black text-sm tracking-widest uppercase hover:shadow-[0_0_20px_rgba(0,255,102,0.4)] transition-all flex items-center gap-2"
              >
                <Save size={16} />
                Lưu Bài Viết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && newsToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111] border border-red-500/20 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-heading font-black text-white">Xóa Bài Viết?</h3>
              <p className="text-white/60 text-sm font-medium">
                Bạn có chắc chắn muốn xóa vĩnh viễn bài <strong className="text-white">{newsToDelete.title}</strong> không?
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
                onClick={deleteNews}
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
