import React, { useRef } from 'react'
import dynamic from 'next/dynamic'
import imageCompression from 'browser-image-compression'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface NewsEditorProps {
  title: string;
  setTitle: (v: string) => void;
  excerpt: string;
  setExcerpt: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  author: string;
  setAuthor: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  preview: string;
  setPreview: (v: string) => void;
  image: File | null;
  setImage: (f: File | null) => void;
  isUploading: boolean;
  handleCreateNews: () => void;
  showToast: (m: string) => void;
  editingId: string | null;
}

export function NewsEditor({
  title, setTitle, excerpt, setExcerpt, category, setCategory, 
  author, setAuthor, content, setContent, preview, setPreview, 
  image, setImage, isUploading, handleCreateNews, showToast, editingId
}: NewsEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true }
      const compressedFile = await imageCompression(file, options)
      setImage(compressedFile)
      setPreview(URL.createObjectURL(compressedFile))
    } catch (error) {
      showToast("Lỗi nén ảnh!")
    }
  }

  return (
    <div className="md-card">
      <h2 className="md-section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        {editingId ? 'CHỈNH SỬA BÀI VIẾT' : 'SOẠN THẢO BÀI VIẾT MỚI'}
      </h2>

      <div className="form-group">
        <label className="form-label">Tiêu đề bài viết</label>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Nhập tiêu đề hấp dẫn..." 
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="form-group">
          <label className="form-label">Tác giả</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Tên người viết bài..." 
            value={author}
            onChange={e => setAuthor(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Chuyên mục</label>
          <select 
            className="form-input" 
            style={{ appearance: 'none', background: 'rgba(0,0,0,0.3)', color: 'white' }}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="Tin tức">Tin tức</option>
            <option value="Sự kiện">Sự kiện</option>
            <option value="Bên lề">Bên lề</option>
            <option value="Phỏng vấn">Phỏng vấn</option>
            <option value="Giải đấu">Giải đấu</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Tóm tắt ngắn (Excerpt)</label>
        <textarea 
          className="form-input" 
          style={{ height: 80, resize: 'none' }}
          placeholder="Mô tả ngắn gọn về bài viết để thu hút người đọc..." 
          value={excerpt}
          onChange={e => setExcerpt(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Ảnh đại diện (Thumbnail)</label>
        <div className="upload-area" onClick={() => fileInputRef.current?.click()} style={{ minHeight: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(34,197,94,0.3)', borderRadius: 16, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
          {!preview ? (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" style={{ marginBottom: 10 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Tải ảnh bìa (Kích thước khuyên dùng: 1200x630)</div>
              <div style={{ fontSize: 12, color: '#5a6a5e', marginTop: 5 }}>Đã tự động tối ưu & nén ảnh cho S3</div>
            </>
          ) : (
            <div style={{ position: 'relative', width: '100%', height: 200 }}>
              <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="image-overlay">
                 <span style={{ fontWeight: 800, fontSize: 12, background: '#22c55e', color: '#000', padding: '6px 16px', borderRadius: 100 }}>THAY ĐỔI ẢNH</span>
              </div>
            </div>
          )}
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Nội dung bài viết (Hỗ trợ định dạng & Chèn ảnh)</label>
        <div className="md-editor-wrap">
          <ReactQuill 
            theme="snow" 
            value={content} 
            onChange={setContent}
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
              ]
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 30 }}>
        <button className="md-btn" onClick={handleCreateNews} disabled={isUploading}>
          {isUploading ? 'ĐANG XỬ LÝ...' : (editingId ? 'CẬP NHẬT BÀI VIẾT' : 'XUẤT BẢN BÀI VIẾT')}
        </button>
      </div>
    </div>
  )
}
