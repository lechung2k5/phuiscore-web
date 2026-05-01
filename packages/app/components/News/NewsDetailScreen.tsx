"use client"
import React, { useState, useEffect } from 'react'

import { API_BASE } from '../../utils/api-config'

const API = API_BASE

// ─── CSS ─────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  
  .nd-root * { 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important; 
    box-sizing: border-box; 
  }
  
  .nd-root { 
    background: #09100c; 
    min-height: 100vh; 
    color: white; 
    padding-bottom: 80px;
  }
  
  .nd-container { 
    max-width: 800px; 
    margin: 0 auto; 
    padding: 32px 20px 0; 
  }
  
  /* Breadcrumbs */
  .nd-breadcrumb {
    color: #7a8c7e;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .nd-breadcrumb a { color: #7a8c7e; text-decoration: none; }
  .nd-breadcrumb a:hover { color: white; }
  .nd-breadcrumb span { color: white; }
  
  /* Top Meta (Badge + Read Time) */
  .nd-top-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  
  .nd-badge {
    background: #22c55e;
    color: #060908;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.5px;
    padding: 4px 10px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  
  .nd-read-time {
    color: #7a8c7e;
    font-size: 12px;
    font-weight: 600;
  }
  
  /* Title */
  .nd-title { 
    font-size: 38px; 
    font-weight: 900; 
    line-height: 1.25; 
    letter-spacing: -0.5px; 
    margin: 0 0 24px; 
    color: #ffffff;
  }
  @media(max-width:768px) { .nd-title { font-size:28px; } }
  
  /* Author Row */
  .nd-author-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .nd-author-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .nd-author-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    background: rgba(255,255,255,0.1);
  }
  
  .nd-author-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .nd-author-name {
    color: white;
    font-size: 14px;
    font-weight: 800;
  }
  
  .nd-author-date {
    color: #7a8c7e;
    font-size: 12px;
    font-weight: 500;
  }
  
  .nd-action-btns {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .nd-icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }
  .nd-icon-btn:hover { background: rgba(255,255,255,0.15); }
  .nd-icon-btn svg { width: 16px; height: 16px; stroke-width: 2.5; }
  
  /* Hero Image */
  .nd-hero-container {
    width: 100%;
    position: relative;
    margin-bottom: 40px;
    border-radius: 20px;
    overflow: hidden;
  }
  
  .nd-hero-container img {
    width: 100%;
    aspect-ratio: 16/9;
    object-fit: cover;
    display: block;
    background: rgba(255,255,255,0.02);
  }
  
  .nd-caption {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    color: rgba(255,255,255,0.9);
    font-size: 11px;
    padding: 6px 12px;
    border-radius: 100px;
    font-weight: 600;
  }
  
  /* Content Typography */
  .nd-content { 
    font-size: 17px; 
    line-height: 1.8; 
    color: #d1dbd4; 
    font-weight: 400;
  }
  
  /* Drop Cap for the very first paragraph */
  .nd-content > p:first-of-type::first-letter {
    color: #4ade80;
    float: left;
    font-size: 64px;
    line-height: 52px;
    padding-top: 4px;
    padding-right: 8px;
    font-weight: 900;
  }
  
  .nd-content p { margin-bottom: 24px; }
  
  .nd-content h2, .nd-content h3 { 
    color: white; 
    font-weight: 800; 
    margin: 40px 0 20px; 
    line-height: 1.4; 
  }
  .nd-content h2 { font-size: 24px; }
  .nd-content h3 { font-size: 20px; }
  
  .nd-content img { 
    max-width: 100%; 
    height: auto; 
    border-radius: 16px; 
    margin: 32px 0; 
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }
  
  .nd-content figure { margin: 32px 0; text-align: center; }
  .nd-content figcaption { font-size: 13px; color: #7a8c7e; margin-top: 12px; font-style: italic; }
  .nd-content a { color: #22c55e; text-decoration: none; font-weight: 600; }
  .nd-content a:hover { text-decoration: underline; }
  
  /* Custom Blockquote (Green Box Style) */
  .nd-content blockquote { 
    border-left: none;
    background: rgba(14,26,17,0.8);
    border: 1px solid rgba(34,197,94,0.15);
    margin: 40px 0; 
    padding: 24px 32px; 
    border-radius: 16px; 
    font-style: italic; 
    color: rgba(255,255,255,0.95);
    font-size: 18px;
    line-height: 1.6;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    position: relative;
  }
  
  /* Custom Blockquote Cite/Author styling if WP adds it */
  .nd-content blockquote cite,
  .nd-content blockquote p:last-child {
    display: block;
    margin-top: 12px;
    color: #4ade80;
    font-size: 14px;
    font-weight: 700;
    font-style: normal;
  }
  .nd-content blockquote p:last-child { margin-bottom: 0; }
  
  .nd-content ul, .nd-content ol { margin-bottom: 24px; padding-left: 24px; }
  .nd-content li { margin-bottom: 10px; }
  
  /* Interaction Row */
  .nd-interactions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 48px;
    padding-top: 24px;
    padding-bottom: 24px;
    border-top: 1px solid rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .nd-interact-left {
    display: flex;
    gap: 16px;
  }
  
  .nd-action-text-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    color: white;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .nd-action-text-btn:hover { opacity: 0.7; }
  .nd-action-text-btn svg { width: 16px; height: 16px; fill: white; }
  
  .nd-views-count {
    color: #7a8c7e;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  /* Static Comments Section */
  .nd-comments-section {
    margin-top: 40px;
  }
  .nd-section-title {
    font-size: 18px;
    font-weight: 900;
    margin-bottom: 24px;
    color: white;
  }
  
  .nd-comment-input-wrap {
    display: flex;
    gap: 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 32px;
  }
  .nd-comment-input-wrap:focus-within {
    border-color: rgba(34,197,94,0.3);
    background: rgba(34,197,94,0.02);
  }
  
  .nd-comment-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    flex-shrink: 0;
  }
  
  .nd-comment-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }
  
  .nd-comment-textarea {
    width: 100%;
    background: transparent;
    border: none;
    color: white;
    font-size: 14px;
    resize: none;
    outline: none;
    min-height: 48px;
  }
  .nd-comment-textarea::placeholder { color: #5a6a5e; }
  
  .nd-submit-btn {
    background: #22c55e;
    color: black;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .nd-submit-btn:hover { opacity: 0.85; }
  
  .nd-comment-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .nd-comment-item {
    display: flex;
    gap: 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 16px;
    padding: 16px;
  }
  
  .nd-c-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    align-items: center;
  }
  .nd-c-name { color: white; font-size: 13px; font-weight: 700; }
  .nd-c-time { color: #5a6a5e; font-size: 11px; }
  .nd-c-text { color: #d1dbd4; font-size: 14px; line-height: 1.5; margin-bottom: 12px; }
  .nd-c-actions { display: flex; gap: 16px; }
  .nd-c-action { color: #22c55e; font-size: 11px; font-weight: 700; cursor: pointer; }
  .nd-c-action:hover { text-decoration: underline; }
  
  /* Related News Grid */
  .nd-related-grid { 
    display: grid; 
    grid-template-columns: repeat(3, 1fr); 
    gap: 20px; 
    margin-top: 16px;
  }
  @media(max-width:768px) { .nd-related-grid { grid-template-columns: repeat(2, 1fr); } }
  @media(max-width:480px) { .nd-related-grid { grid-template-columns: 1fr; } }
  
  .r-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    text-decoration: none;
    transition: transform 0.2s;
  }
  .r-card:hover { transform: translateY(-4px); }
  
  .r-card-img-wrap {
    width: 100%;
    aspect-ratio: 16/10;
    border-radius: 12px;
    overflow: hidden;
  }
  .r-card-img-wrap img {
    width: 100%; height: 100%; object-fit: cover;
  }
  
  .r-card-cat {
    color: #22c55e;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
  }
  
  .r-card-title { 
    color: white; 
    font-size: 14px; 
    font-weight: 800; 
    line-height: 1.4; 
    display: -webkit-box; 
    -webkit-line-clamp: 2; 
    -webkit-box-orient: vertical; 
    overflow: hidden; 
  }
  
  .r-card-time { color: #7a8c7e; font-size: 11px; }

  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .skeleton { background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.04) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px; }
`

function formatTime(isoString: string) {
  if (!isoString) return ''
  const d = new Date(isoString);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatTimeAgo(isoString: string) {
  if (!isoString) return ''
  const diffMinutes = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays <= 30) return `${diffDays} ngày trước`
  return new Date(isoString).toLocaleDateString('vi-VN')
}

// Icons
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
)

const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
)

const ThumbsUpIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
  </svg>
)

const CommentIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
)

export default function NewsDetailScreen({ slug }: { slug: string }) {
  const [data, setData] = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' })
    fetch(`${API}/news/${slug}`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setData(json.data)
          setRelated(json.related || [])
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="nd-root">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="nd-container">
          <div className="skeleton" style={{ width: '80%', height: 40, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: '60%', height: 40, marginBottom: 32 }} />
          <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9', borderRadius: 20, marginBottom: 40 }} />
          <div className="skeleton" style={{ width: '100%', height: 20, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: '90%', height: 20, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: '95%', height: 20, marginBottom: 12 }} />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="nd-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Không tìm thấy bài viết</h2>
        <a href="/tin-tuc" style={{ padding: '10px 24px', background: '#22c55e', color: 'black', fontWeight: 800, textDecoration: 'none', borderRadius: 100 }}>Về trang Tin tức</a>
      </div>
    )
  }

  const wordCount = data.content ? data.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length : 500
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="nd-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="nd-container">
        
        {/* Breadcrumb */}
        <div className="nd-breadcrumb">
          <a href="/">Trang chủ</a> • <a href="/tin-tuc">Tin tức</a> • <span>Chi tiết bài viết</span>
        </div>
        
        {/* Meta & Badge */}
        <div className="nd-top-meta">
          <span className="nd-badge">TIN TỨC CẬP NHẬT</span>
          <span className="nd-read-time">{readTime} phút đọc • Đang cập nhật lượt xem</span>
        </div>

        {/* Title */}
        <h1 className="nd-title" dangerouslySetInnerHTML={{__html: data.title}} />
        
        {/* Author Row */}
        <div className="nd-author-row">
          <div className="nd-author-left">
            <div className="nd-author-avatar">
              <img src="https://ui-avatars.com/api/?name=GBD&background=22c55e&color=fff" alt="Avatar" style={{width:'100%', height:'100%', borderRadius:'50%'}} />
            </div>
            <div className="nd-author-info">
              <div className="nd-author-name">{data.author || 'Ghiền Bóng Đá'}</div>
              <div className="nd-author-date">Biên tập viên thể thao • {formatTime(data.published_at)}</div>
            </div>
          </div>
          <div className="nd-action-btns">
            <button className="nd-icon-btn"><ShareIcon /></button>
            <button className="nd-icon-btn"><BookmarkIcon /></button>
          </div>
        </div>

        {/* Hero Image */}
        <div className="nd-hero-container">
          <img src={data.thumbnail || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=85'} alt={data.title.replace(/<[^>]*>?/gm, '')} />
          <div className="nd-caption">Ảnh thumbnail / ghienbongda.vn</div>
        </div>

        {/* Content */}
        <div className="nd-content" dangerouslySetInnerHTML={{__html: data.content}} />

        {/* Interactions Row (Like, Comment, View stats) */}
        <div className="nd-interactions">
          <div className="nd-interact-left">
            <button className="nd-action-text-btn">
              <ThumbsUpIcon /> Thích ({Math.floor(Math.random() * 300) + 50})
            </button>
            <button className="nd-action-text-btn">
              <CommentIcon /> Bình luận (1)
            </button>
          </div>
          <div className="nd-views-count">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            {(Math.random() * 10 + 2).toFixed(1)}k lượt xem
          </div>
        </div>

        {/* Static Comments Placeholder */}
        <div className="nd-comments-section">
          <h3 className="nd-section-title">Bình luận</h3>
          
          <div className="nd-comment-input-wrap">
            <div className="nd-comment-avatar" style={{background: '#334155'}} />
            <div className="nd-comment-right">
              <textarea className="nd-comment-textarea" placeholder="Chia sẻ ý kiến của bạn..."></textarea>
              <button className="nd-submit-btn">Gửi bình luận</button>
            </div>
          </div>

          <div className="nd-comment-list">
            <div className="nd-comment-item">
              <div className="nd-comment-avatar">
                <img src="https://i.pravatar.cc/100?img=5" alt="user" style={{width:'100%', height:'100%', borderRadius:'50%'}} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="nd-c-info">
                  <span className="nd-c-name">Lê Minh Tuấn</span>
                  <span className="nd-c-time">1 giờ trước</span>
                </div>
                <div className="nd-c-text">
                  Trận đấu quá cảm xúc! Bàn thắng cuối cùng thực sự là đẳng cấp của bóng đá chuyên nghiệp chứ không phải phủi nữa.
                </div>
                <div className="nd-c-actions">
                  <span className="nd-c-action">Thích</span>
                  <span className="nd-c-action">Trả lời</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related News Grid */}
        {related.length > 0 && (
          <div className="nd-comments-section" style={{ marginTop: 60, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 className="nd-section-title" style={{ margin: 0 }}>Tin liên quan</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="nd-icon-btn" style={{ width: 32, height: 32 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                <button className="nd-icon-btn" style={{ width: 32, height: 32 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
              </div>
            </div>
            
            <div className="nd-related-grid">
              {related.map(r => (
                <a key={r.slug} href={`/tin-tuc/${r.slug}`} className="r-card">
                  <div className="r-card-img-wrap">
                    <img src={r.thumbnail || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80'} alt="" />
                  </div>
                  <div>
                    <div className="r-card-cat">Tin Tức</div>
                    <div className="r-card-title" dangerouslySetInnerHTML={{__html: r.title}} />
                    <div className="r-card-time" style={{ marginTop: 6 }}>{formatTimeAgo(r.published_at)}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
