import React from 'react'

interface ArticleListProps {
  myArticles: any[];
  loadingArticles: boolean;
  deleteArticle: (id: string) => void;
  onEdit: (art: any) => void;
}

export function ArticleList({ myArticles, loadingArticles, deleteArticle, onEdit }: ArticleListProps) {
  return (
    <div className="md-card">
      <h2 className="md-section-title">DANH SÁCH BÀI VIẾT ĐÃ ĐĂNG</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {loadingArticles ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
        ) : myArticles.map(art => (
          <div key={art.id} style={{ display: 'flex', gap: 20, background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
            <img src={art.thumbnail} style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 5 }}>{art.title}</div>
              <div style={{ display: 'flex', gap: 15, fontSize: 12, color: '#5a6a5e' }}>
                 <span>📅 {new Date(art.published_at).toLocaleDateString('vi-VN')}</span>
                 <span>📂 {art.category}</span>
                 <span style={{ color: '#22c55e' }}>✅ Đã xuất bản</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="md-btn md-btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => onEdit(art)}>SỬA</button>
              <button className="md-btn" style={{ background: '#ef4444', padding: '6px 12px', fontSize: 12 }} onClick={() => deleteArticle(art.id)}>XÓA</button>
            </div>
          </div>
        ))}
        {myArticles.length === 0 && !loadingArticles && (
          <div style={{ textAlign: 'center', padding: 40, color: '#5a6a5e' }}>Bạn chưa có bài viết nào.</div>
        )}
      </div>
    </div>
  )
}
