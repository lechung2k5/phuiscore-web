"use client"
import React, { useState, useEffect } from 'react'
import { NewsEditor } from './NewsEditor'
import { ArticleList } from './ArticleList'
import { LiveControl } from './LiveControl'
import { MEDIA_DASHBOARD_CSS } from './MediaDashboardStyles'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function MediaDashboard() {
  const [activeTab, setActiveTab] = useState('news')
  const [toast, setToast] = useState({ show: false, message: '' })

  // News States
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [category, setCategory] = useState('Tin tức')
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Management States
  const [myArticles, setMyArticles] = useState<any[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)

  const showToast = (message: string) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }

  const fetchMyArticles = async () => {
    setLoadingArticles(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/media/my-news`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.success) setMyArticles(json.data)
    } catch (e) {
      showToast("Lỗi tải danh sách bài viết!")
    } finally {
      setLoadingArticles(false)
    }
  }

  const deleteArticle = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/media/news/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        showToast("Đã xóa bài viết!")
        fetchMyArticles()
      }
    } catch (e) {
      showToast("Lỗi khi xóa bài viết!")
    }
  }

  const handleCreateNews = async () => {
    if (!title || !content || (!image && !preview)) {
      showToast("Vui lòng điền đủ thông tin & chọn ảnh bìa!")
      return
    }

    setIsUploading(true)
    try {
      const token = localStorage.getItem('token')
      let thumbnailUrl = preview

      if (image) {
        const formData = new FormData()
        formData.append('image', image)
        formData.append('type', 'news')
        const uploadRes = await fetch(`${API}/media/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })
        const uploadJson = await uploadRes.json()
        if (!uploadJson.success) throw new Error(uploadJson.message)
        thumbnailUrl = uploadJson.url
      }

      const articleData = {
        id: editingId,
        title,
        content,
        excerpt,
        category,
        author: author || 'Ban biên tập Phủi Score',
        thumbnail: thumbnailUrl
      }

      const newsRes = await fetch(`${API}/media/create-news`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(articleData)
      })
      
      if (newsRes.ok) {
        showToast(editingId ? "Cập nhật thành công! ✨" : "Đăng bài thành công! 🚀")
        resetForm()
        if (editingId) setActiveTab('manage')
      } else {
        const errorData = await newsRes.json()
        throw new Error(errorData.message || "Lỗi khi lưu bài viết")
      }
    } catch (error: any) {
      showToast(error.message || "Lỗi khi đăng bài!")
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setExcerpt('')
    setContent('')
    setAuthor('')
    setImage(null)
    setPreview('')
    setEditingId(null)
  }

  useEffect(() => {
    if (activeTab === 'manage') fetchMyArticles()
  }, [activeTab])

  return (
    <div className="md-root">
      <style dangerouslySetInnerHTML={{ __html: MEDIA_DASHBOARD_CSS }} />
      <div className="md-container">
        <header className="md-header">
          <div>
            <h1 className="md-title">Media Dashboard</h1>
            <p style={{ color: '#5a6a5e', fontSize: 14, marginTop: 5 }}>Quản lý nội dung & Điều khiển Livestream chuyên nghiệp</p>
          </div>
        </header>

        <nav className="md-tabs">
          {['news', 'manage', 'live', 'assets'].map(tab => (
            <button 
              key={tab}
              className={`md-tab ${activeTab === tab ? 'active' : ''}`} 
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'news' && 'BÀI VIẾT & TIN TỨC'}
              {tab === 'manage' && 'QUẢN LÝ BÀI VIẾT'}
              {tab === 'live' && 'TRUNG TÂM LIVESTREAM'}
              {tab === 'assets' && 'THƯ VIỆN ẢNH'}
            </button>
          ))}
        </nav>

        {activeTab === 'news' && (
          <NewsEditor 
            {...{ title, setTitle, excerpt, setExcerpt, category, setCategory, author, setAuthor, content, setContent, preview, setPreview, image, setImage, isUploading, handleCreateNews, showToast, editingId }}
          />
        )}

        {activeTab === 'manage' && (
          <ArticleList 
            myArticles={myArticles} 
            loadingArticles={loadingArticles} 
            deleteArticle={deleteArticle}
            onEdit={(art) => {
              setEditingId(art.id);
              setTitle(art.title);
              setExcerpt(art.excerpt || '');
              setCategory(art.category || 'Tin tức');
              setAuthor(art.author || '');
              setContent(art.content);
              setPreview(art.thumbnail);
              setActiveTab('news');
            }}
          />
        )}

        {activeTab === 'live' && <LiveControl API={API} showToast={showToast} />}

        {activeTab === 'assets' && (
          <div className="md-card" style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 20 }}>🖼️</div>
            <h2 style={{ fontSize: 24, fontWeight: 900 }}>THƯ VIỆN ĐANG ĐƯỢC ĐỒNG BỘ</h2>
            <p style={{ color: '#5a6a5e' }}>Tính năng quản lý tài nguyên tập trung sẽ ra mắt sớm.</p>
          </div>
        )}
      </div>

      <div className={`toast ${toast.show ? 'show' : ''}`}>{toast.message}</div>
    </div>
  )
}
