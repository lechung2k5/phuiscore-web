"use client"
import React, { useState, useEffect, useCallback } from 'react'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')

// ─── Constants ────────────────────────────────────────────────
const MOCK_FEATURED = {
  id: '1', category: 'Tiêu điểm', categoryColor: '#22c55e',
  title: 'Đại chiến HPL-S11: Phoenix FC đối đầu EOC trong trận chung kết kịch tính nhất mùa giải',
  image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=85',
  timeAgo: '2 giờ trước', views: '12.4k', author: 'BTV Phủi Score',
}

const TABS = [
  { key: 'all', label: 'Tất cả', emoji: '📰' }
]

// ─── CSS ─────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .ns-root * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important; box-sizing: border-box; }
  @keyframes pulse-live { 0%,100%{opacity:1} 50%{opacity:0.25} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .ns-root { background:#060908; min-height:100vh; }
  .ns-tab { padding:8px 16px; border-radius:100px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); color:#7a8c7e; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; transition:all 0.2s; outline:none; }
  .ns-tab.active { background:linear-gradient(90deg,#4ade80 0%,#22c55e 100%); color:black; border-color:transparent; box-shadow:0 2px 14px rgba(34,197,94,0.4); }
  .ns-tab:hover:not(.active) { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.14); color:white; }
  .featured-card { border-radius:22px; overflow:hidden; position:relative; cursor:pointer; aspect-ratio:16/9; display:block; transition:transform 0.3s,box-shadow 0.3s; box-shadow:0 8px 40px rgba(0,0,0,0.5); text-decoration:none; }
  .featured-card:hover { transform:scale(1.01); box-shadow:0 16px 60px rgba(34,197,94,0.18); }
  .featured-card img { width:100%;height:100%;object-fit:cover;display:block; }
  .featured-card .overlay { position:absolute;inset:0; background:linear-gradient(to top,rgba(0,0,0,0.94) 0%,rgba(0,0,0,0.5) 55%,transparent 100%); padding:28px; display:flex;flex-direction:column;justify-content:flex-end; }
  .article-row { display:flex; gap:16px; padding:18px 0; border-bottom:1px solid rgba(255,255,255,0.06); cursor:pointer; transition:opacity 0.2s; align-items:flex-start; animation:fadeUp 0.4s ease both; text-decoration:none; }
  .article-row:hover { opacity:0.8; }
  .article-row:last-child { border-bottom:none; }
  .article-thumb { width:108px;height:72px;border-radius:12px;overflow:hidden;flex-shrink:0;box-shadow:0 4px 16px rgba(0,0,0,0.4); }
  .article-thumb img { width:100%;height:100%;object-fit:cover;display:block; }
  .cat-badge { display:inline-flex;align-items:center;gap:4px; padding:3px 9px;border-radius:6px; font-size:9px;font-weight:800;letter-spacing:0.6px;text-transform:uppercase; background:rgba(34,197,94,0.15); color:#22c55e; }
  .hot-badge { background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#ef4444;font-size:9px;font-weight:900;letter-spacing:1px;padding:2px 7px;border-radius:6px;text-transform:uppercase; }
  .sidebar-card { background:rgba(14,20,16,0.92);border-radius:18px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;backdrop-filter:blur(12px); }
  .sidebar-card .s-header { display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.06); }
  .sidebar-card .s-body { padding:14px 18px; }
  .live-pill { display:flex;align-items:center;background:rgba(15,24,18,0.96);border-radius:14px;border:1px solid rgba(239,68,68,0.2);padding:11px 14px;gap:12px;transition:border-color 0.2s;cursor:pointer;text-decoration:none; }
  .live-pill:hover { border-color:rgba(239,68,68,0.5); }
  .live-dot { width:7px;height:7px;border-radius:50%;background:#ef4444;animation:pulse-live 1.2s infinite;flex-shrink:0; }
  .standings-row { display:flex;align-items:center;padding:9px 6px;border-radius:8px;transition:background 0.15s; }
  .standings-row:hover { background:rgba(255,255,255,0.03); }
  .standings-row.top2 { background:rgba(34,197,94,0.04); }
  .loadmore-btn { width:100%;padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:#7a8c7e;font-size:12px;font-weight:700;letter-spacing:0.5px;cursor:pointer;transition:all 0.2s;text-transform:uppercase; }
  .loadmore-btn:hover { background:rgba(255,255,255,0.06);color:white;border-color:rgba(255,255,255,0.16); }
  .loadmore-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .ns-grid { display:grid;gap:28px;grid-template-columns:1fr; }
  @media(min-width:1024px) { .ns-grid{grid-template-columns:1fr 290px} }
  .ns-sidebar { display:none; }
  @media(min-width:1024px) { .ns-sidebar{display:flex;flex-direction:column;gap:18px} }
  .xem-ngay-btn { display:inline-flex;align-items:center;gap:6px;background:linear-gradient(90deg,#4ade80 0%,#22c55e 100%);color:black;font-weight:900;font-size:12px;padding:8px 18px;border-radius:100px;box-shadow:0 2px 14px rgba(34,197,94,0.35);transition:opacity 0.2s,transform 0.2s;cursor:pointer;border:none;margin-top:12px;align-self:flex-start; pointer-events:none; }
  .xem-btn-sm { background:linear-gradient(90deg,#4ade80 0%,#22c55e 100%);color:black;font-size:10px;font-weight:900;padding:4px 12px;border-radius:100px;box-shadow:0 1px 8px rgba(34,197,94,0.25); }
  .skeleton { background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.04) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px; }
  .spinner { width:18px;height:18px;border:2px solid rgba(34,197,94,0.2);border-top-color:#22c55e;border-radius:50%;animation:spin 0.7s linear infinite; }
  .live-header-badge { display:flex;align-items:center;gap:6px; }
  .empty-state { text-align:center;padding:24px 0;color:#4a5a4e; }
  .news-img-loading { opacity: 0; transition: opacity 0.3s; }
  .news-img-loaded { opacity: 1; }
`

// ─── Helpers ─────────────────────────────────────────────────────
function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getHotScore(m: any) {
  const goals = (m.homeScore ?? m.score?.home ?? 0) + (m.awayScore ?? m.score?.away ?? 0)
  return goals * 10 + (m.currentMinute ? parseInt(m.currentMinute) : 0)
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

// ─── Main Component ───────────────────────────────────────────────
export default function NewsScreen() {
  const [activeTab, setActiveTab] = useState('all')
  const [mounted, setMounted] = useState(false)

  // Real News từ Backend
  const [news, setNews] = useState<any[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsPage, setNewsPage] = useState(1)
  const [hasMoreNews, setHasMoreNews] = useState(true)

  // Live matches (từ BE)
  const [liveMatches, setLiveMatches] = useState<any[]>([])
  const [liveLoading, setLiveLoading] = useState(true)

  // Standings (từ BE)
  const [standings, setStandings] = useState<any[]>([])
  const [standingsTournament, setStandingsTournament] = useState('')
  const [standingsTournamentId, setStandingsTournamentId] = useState('')
  const [standingsLoading, setStandingsLoading] = useState(true)

  // ── Fetch News từ /api/news ──
  const fetchNews = useCallback(async (page: number, append = false) => {
    if (!append) setNewsLoading(true)
    try {
      const res = await fetch(`${API}/news?page=${page}&limit=10`)
      const json = await res.json()
      if (json.success && json.data) {
        if (append) {
          setNews(prev => [...prev, ...json.data])
        } else {
          setNews(json.data)
        }
        setHasMoreNews(page < json.totalPages)
      }
    } catch (e) {
      console.error('Fetch news error', e)
    } finally {
      setNewsLoading(false)
    }
  }, [])

  // ── Fetch live matches từ /api/matches/:date ──
  const fetchLiveMatches = useCallback(async () => {
    setLiveLoading(true)
    try {
      const res = await fetch(`${API}/matches/${getTodayStr()}`)
      const json = await res.json()
      if (json.success && json.data) {
        const allMatches: any[] = []
        for (const league of json.data) {
          for (const m of league.matches || []) {
            allMatches.push({ ...m, tournamentName: league.name, tournamentId: league.id })
          }
        }
        const live = allMatches.filter(m =>
          m.status === 'Ongoing' || m.status === 'live' || m.status === 'inprogress'
        )
        // Hottest first: nhều bàn thắng + phút cao nhất
        live.sort((a, b) => getHotScore(b) - getHotScore(a))
        setLiveMatches(live)
      } else {
        setLiveMatches([])
      }
    } catch {
      setLiveMatches([])
    } finally {
      setLiveLoading(false)
    }
  }, [])

  // ── Fetch standings từ /api/tournaments/list → tính BXH từ matches ──
  const fetchStandings = useCallback(async () => {
    setStandingsLoading(true)
    try {
      const listRes = await fetch(`${API}/tournaments/list?status=Ongoing`)
      const listJson = await listRes.json()
      const ongoingList: any[] = listJson.data || []

      if (ongoingList.length === 0) {
        setStandings([])
        setStandingsLoading(false)
        return
      }

      // Giải sôi động nhất (nhiều đội nhất)
      const hot = ongoingList.sort((a, b) => (b.teams?.length || 0) - (a.teams?.length || 0))[0]
      setStandingsTournament(hot.name)
      setStandingsTournamentId(hot.id)

      // Lấy matches → tính điểm
      const mRes = await fetch(`${API}/tournaments/${hot.id}/matches`)
      const mJson = await mRes.json()
      const matches: any[] = mJson.data || []

      const teamMap: Record<string, any> = {}
      const init = (id: string, name: string, logo: string) => {
        if (!teamMap[id]) teamMap[id] = { name, logo, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }
      }

      for (const m of matches.filter((m: any) => m.status === 'Finished')) {
        const hId = m.homeTeam?.id || m.homeTeam?.name || 'h'
        const aId = m.awayTeam?.id || m.awayTeam?.name || 'a'
        const hG = m.homeScore ?? m.score?.home ?? 0
        const aG = m.awayScore ?? m.score?.away ?? 0
        init(hId, m.homeTeam?.name || 'TBA', m.homeTeam?.logo || '')
        init(aId, m.awayTeam?.name || 'TBA', m.awayTeam?.logo || '')
        teamMap[hId].played++; teamMap[aId].played++
        teamMap[hId].gf += hG; teamMap[hId].ga += aG
        teamMap[aId].gf += aG; teamMap[aId].ga += hG
        if (hG > aG) { teamMap[hId].won++; teamMap[hId].points += 3; teamMap[aId].lost++ }
        else if (hG < aG) { teamMap[aId].won++; teamMap[aId].points += 3; teamMap[hId].lost++ }
        else { teamMap[hId].drawn++; teamMap[hId].points++; teamMap[aId].drawn++; teamMap[aId].points++ }
      }

      // Fallback khi chưa có kết quả: list đội từ tournament
      if (Object.keys(teamMap).length === 0) {
        ;(hot.teams || []).filter((t: any) => ['Approved','Confirmed'].includes(t.status))
          .forEach((t: any, i: number) => {
            teamMap[t.id || i] = { name: t.teamName, logo: t.logo||'', played:0, won:0, drawn:0, lost:0, gf:0, ga:0, points:0 }
          })
      }

      const sorted = Object.values(teamMap)
        .sort((a: any, b: any) => b.points - a.points || (b.gf-b.ga) - (a.gf-a.ga) || b.gf - a.gf)
      setStandings(sorted.slice(0, 6))
    } catch {
      setStandings([])
    } finally {
      setStandingsLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' })
    fetchLiveMatches()
    fetchStandings()
    fetchNews(1)
    const interval = setInterval(fetchLiveMatches, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveMatches, fetchStandings, fetchNews])

  const handleLoadMore = () => {
    if (!hasMoreNews || newsLoading) return
    const nextPage = newsPage + 1
    fetchNews(nextPage, true)
    setNewsPage(nextPage)
  }

  if (!mounted) return null

  // Determine featured and list articles
  const featuredArticle = news.length > 0 ? news[0] : MOCK_FEATURED;
  const listArticles = news.length > 0 ? news.slice(1) : [];

  return (
    <div className="ns-root">
      <style>{CSS}</style>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <span style={{ color: '#4a5a4e', fontSize: 12 }}>Trang chủ</span>
            <span style={{ color: '#4a5a4e', fontSize: 12 }}>›</span>
            <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 700 }}>Tin tức</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>📰</span>
                <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>TIN TỨC BÓNG ĐÁ</span>
              </div>
              <h1 style={{ color: 'white', fontSize: 38, fontWeight: 900, margin: 0, letterSpacing: -1.2, lineHeight: '1.1' }}>
                Tin Tức Giải Đấu
              </h1>
              <div style={{ width: 50, height: 3, background: 'linear-gradient(90deg,#4ade80,#22c55e)', borderRadius: 2, marginTop: 10 }} />
            </div>
            <div className="live-header-badge">
              <div className="live-dot" />
              <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 800 }}>
                {liveLoading ? '...' : liveMatches.length} trận đang live
              </span>
            </div>
          </div>
        </div>

        {/* ── FILTER TABS ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {TABS.map(t => (
            <button key={t.key} className={`ns-tab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="ns-grid">

          {/* LEFT: Articles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0 }}>
            {activeTab === 'all' && (
              <a href={`/tin-tuc/${featuredArticle.slug || '#'}`} className="featured-card">
                <img src={featuredArticle.thumbnail || featuredArticle.image} alt={featuredArticle.title} />
                <div className="overlay">
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(34,197,94,0.3)', padding: '5px 12px', borderRadius: 100, marginBottom: 12, backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ color: '#4ade80', fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>TIÊU ĐIỂM</span>
                  </div>
                  <p style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: '0 0 12px', letterSpacing: -0.5, lineHeight: '1.35', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }} dangerouslySetInnerHTML={{__html: featuredArticle.title}} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ color: '#7a8c7e', fontSize: 12 }}>🕐 {featuredArticle.published_at ? formatTimeAgo(featuredArticle.published_at) : featuredArticle.timeAgo}</span>
                    <span style={{ color: '#7a8c7e', fontSize: 12 }}>✍️ {featuredArticle.author}</span>
                  </div>
                  <button className="xem-ngay-btn">▶ XEM NGAY</button>
                </div>
              </a>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#4a5a4e', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>Tin Mới Nhất</span>
            </div>

            <div>
              {newsLoading && newsPage === 1
                ? [0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 108, marginBottom: 16 }} />)
                : listArticles.length === 0
                  ? <div className="empty-state"><div style={{ fontSize: 40, marginBottom: 12 }}>📭</div><div style={{ fontSize: 15, fontWeight: 700, color: '#6a7a6e' }}>Chưa có bài viết</div></div>
                  : listArticles.map((a, idx) => <ArticleRow key={a.id} article={a} idx={idx} />)
              }
            </div>

            {hasMoreNews && (
              <button className="loadmore-btn" onClick={handleLoadMore} disabled={newsLoading}>
                {newsLoading ? 'ĐANG TẢI...' : '📄 Xem thêm bài viết cũ hơn'}
              </button>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="ns-sidebar">

            {/* ── LIVE MATCHES (real API) ── */}
            <div className="sidebar-card">
              <div className="s-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="live-dot" />
                  <span style={{ color: 'white', fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>ĐANG PHÁT TRỰC TIẾP</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {liveLoading && <div className="spinner" />}
                  <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700 }}>
                    {liveLoading ? '...' : `${liveMatches.length} trận`}
                  </span>
                </div>
              </div>
              <div className="s-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {liveLoading
                  ? [0,1].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 14 }} />)
                  : liveMatches.length === 0
                    ? <div className="empty-state" style={{ padding: '16px 0' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>😴</div>
                        <div style={{ fontSize: 12, color: '#4a5a4e', fontWeight: 600 }}>Hiện chưa có trận live</div>
                        <div style={{ fontSize: 11, color: '#3a4a3e', marginTop: 4 }}>Tự cập nhật mỗi 30 giây</div>
                      </div>
                    : liveMatches.slice(0, 4).map((m, i) => <LiveMatchPill key={m.id || i} match={m} />)
                }
                <a href="/lich-thi-dau" style={{ display: 'block', textAlign: 'center', padding: '10px 0', color: '#22c55e', fontSize: 11, fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', marginTop: 4 }}>
                  Xem tất cả lịch đấu →
                </a>
              </div>
            </div>

            {/* ── STANDINGS (real API) ── */}
            <div className="sidebar-card">
              <div className="s-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>🏆</span>
                  <div>
                    <div style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>BẢNG XẾP HẠNG</div>
                    {standingsTournament && <div style={{ color: '#4a5a4e', fontSize: 10, marginTop: 1 }}>{standingsTournament}</div>}
                  </div>
                </div>
                {standingsTournamentId && (
                  <a href={`/giai-dau/${standingsTournamentId}`} style={{ color: '#22c55e', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Chi tiết</a>
                )}
              </div>
              <div className="s-body">
                {standingsLoading
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 32 }} />)}
                    </div>
                  : standings.length === 0
                    ? <div className="empty-state" style={{ padding: '16px 0' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                        <div style={{ fontSize: 12, color: '#4a5a4e', fontWeight: 600 }}>Chưa có giải đang thi đấu</div>
                      </div>
                    : <>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 6px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 4 }}>
                          <span style={{ color: '#3a4a3e', fontSize: 9, fontWeight: 800, width: 28 }}>#</span>
                          <span style={{ color: '#3a4a3e', fontSize: 9, fontWeight: 800, flex: 1 }}>ĐỘI BÓNG</span>
                          <span style={{ color: '#3a4a3e', fontSize: 9, fontWeight: 800, width: 24, textAlign: 'center' }}>T</span>
                          <span style={{ color: '#3a4a3e', fontSize: 9, fontWeight: 800, width: 36, textAlign: 'right' }}>ĐIỂM</span>
                        </div>
                        {standings.map((row: any, i) => (
                          <div key={row.name + i} className={`standings-row${i < 2 ? ' top2' : ''}`}>
                            <span style={{ color: i<2?'#22c55e':i===2?'#f59e0b':'#7a8c7e', fontSize: 11, fontWeight: 900, width: 28 }}>{String(i+1).padStart(2,'0')}</span>
                            {row.logo && <img src={row.logo} alt="" style={{ width: 18, height: 18, objectFit: 'contain', marginRight: 6, borderRadius: 3 }} />}
                            <span style={{ color: 'white', fontSize: 12, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
                            <span style={{ color: '#7a8c7e', fontSize: 11, width: 24, textAlign: 'center' }}>{row.played}</span>
                            <span style={{ color: i<2?'#22c55e':'white', fontSize: 13, fontWeight: 900, width: 36, textAlign: 'right' }}>{row.points}</span>
                          </div>
                        ))}
                      </>
                }
              </div>
            </div>

            {/* Newsletter */}
            <div className="sidebar-card" style={{ background: 'linear-gradient(135deg,rgba(20,35,25,0.98),rgba(8,14,10,0.98))' }}>
              <div className="s-body" style={{ textAlign: 'center', padding: '24px 18px' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔔</div>
                <div style={{ color: 'white', fontSize: 14, fontWeight: 900, marginBottom: 6, letterSpacing: -0.3 }}>Nhận tin ngay!</div>
                <div style={{ color: '#7a8c7e', fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>Đừng bỏ lỡ kết quả hay tin tức từ giải đấu</div>
                <button style={{ width: '100%', padding: '11px 0', background: 'linear-gradient(90deg,#4ade80 0%,#22c55e 100%)', color: 'black', fontWeight: 900, fontSize: 12, letterSpacing: 0.5, border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}>
                  ĐẶT THÔNG BÁO
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Live Match Pill ──────────────────────────────────────────────
function LiveMatchPill({ match: m }: { match: any }) {
  const hS = m.homeScore ?? m.score?.home ?? 0
  const aS = m.awayScore ?? m.score?.away ?? 0
  const minute = m.currentMinute ? `${m.currentMinute}'` : '▶'
  const hName = m.homeTeam?.name || m.teamA || 'TBA'
  const aName = m.awayTeam?.name || m.teamB || 'TBA'
  const href = m.tournamentId ? `/giai-dau/${m.tournamentId}` : '#'

  return (
    <a href={href} className="live-pill">
      <div className="live-dot" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 30, alignItems: 'center' }}>
        <span style={{ color: '#ef4444', fontSize: 9, fontWeight: 900 }}>{minute}</span>
        {hS + aS >= 3 && <span style={{ fontSize: 8, color: '#f59e0b' }}>🔥</span>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
          <span style={{ color: 'white', fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hName}</span>
          <span style={{ color: hS > aS ? '#22c55e' : 'white', fontSize: 14, fontWeight: 900, minWidth: 18, textAlign: 'center' }}>{hS}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#aaa', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aName}</span>
          <span style={{ color: aS > hS ? '#22c55e' : 'white', fontSize: 14, fontWeight: 900, minWidth: 18, textAlign: 'center' }}>{aS}</span>
        </div>
        {m.tournamentName && <span style={{ color: '#3a4a3e', fontSize: 9, fontWeight: 600, marginTop: 1 }}>{m.tournamentName}</span>}
      </div>
    </a>
  )
}

// ─── Article Row ──────────────────────────────────────────────────
function ArticleRow({ article: a, idx }: { article: any; idx: number }) {
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <a href={`/tin-tuc/${a.slug}`} className="article-row" style={{ animationDelay: `${idx * 0.06}s` }}>
      <div className="article-thumb" style={{ background: '#111814' }}>
        <img 
          src={a.thumbnail || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'} 
          alt={a.title} 
          className={`news-img-loading ${imgLoaded ? 'news-img-loaded' : ''}`}
          onLoad={() => setImgLoaded(true)}
        />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="cat-badge">Tin Tức</span>
        </div>
        <p style={{ color: 'white', fontSize: 14, fontWeight: 800, margin: 0, lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any} dangerouslySetInnerHTML={{__html: a.title}} />
        {a.summary && <p style={{ color: '#7a8c7e', fontSize: 12, margin: 0, lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any} dangerouslySetInnerHTML={{__html: a.summary}} />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#4a5a4e', fontSize: 11 }}>🕐 {a.published_at ? formatTimeAgo(a.published_at) : ''}</span>
            <span style={{ color: '#4a5a4e', fontSize: 11 }}>✍️ {a.author || 'BTV Phủi Score'}</span>
          </div>
          <div className="xem-btn-sm">▶ XEM</div>
        </div>
      </div>
    </a>
  )
}
