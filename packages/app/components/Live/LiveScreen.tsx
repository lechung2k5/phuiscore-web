"use client"
import React, { useState, useEffect } from 'react'
import { LiveMatchCard } from '../LiveMatchCard' // Reuse the existing card component
import { generateMatchSlug } from '../../utils/slug'
import { getImageUrl } from '../../utils/image'

import { API_BASE } from '../../utils/api-config'

const API = API_BASE

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .ls-root * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important; box-sizing: border-box; }
  .ls-root { background: #060908; min-height: 100vh; color: white; padding-bottom: 80px; }
  .ls-container { max-width: 1250px; margin: 0 auto; padding: 40px 20px 0; }
  
  /* Header */
  .ls-title { font-size: 40px; font-weight: 900; font-style: italic; letter-spacing: -1px; margin: 0 0 8px; text-transform: uppercase; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
  .ls-subtitle { font-size: 15px; color: #7a8c7e; font-weight: 500; margin-bottom: 40px; }
  
  /* Top Filters Area */
  .ls-top-bar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; flex-wrap: wrap; gap: 24px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 16px; }
  
  .ls-tabs { display: flex; gap: 24px; overflow-x: auto; scrollbar-width: none; }
  .ls-tabs::-webkit-scrollbar { display: none; }
  
  .ls-tab { background: transparent; border: none; color: #5a6a5e; font-size: 14px; font-weight: 800; cursor: pointer; padding: 0 0 12px; position: relative; white-space: nowrap; transition: color 0.2s; }
  .ls-tab:hover { color: white; }
  .ls-tab.active { color: #22c55e; }
  .ls-tab.active::after { content: ''; position: absolute; bottom: -17px; left: 0; width: 30px; height: 3px; background: #22c55e; border-radius: 4px; }
  
  .ls-filter-wrap { display: flex; flex-direction: column; gap: 8px; }
  .ls-filter-label { color: #22c55e; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
  
  .ls-select { background: rgba(14,26,17,0.8); border: 1px solid rgba(34,197,94,0.3); color: white; padding: 10px 36px 10px 16px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2322c55e' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  .ls-select:focus { outline: none; border-color: #22c55e; }
  
  /* Sections */
  .ls-section-title { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 900; color: white; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px; }
  .ls-dot { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; }
  .ls-dot.green { background: #22c55e; }
  
  /* Grid */
  .ls-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 60px; }
  @media(max-width: 1024px) { .ls-grid { grid-template-columns: repeat(2, 1fr); } }
  @media(max-width: 768px) { .ls-grid { grid-template-columns: 1fr; } }
  
  /* Upcoming Card */
  .up-card { background: rgba(14,22,17,0.6); border: 1px solid rgba(255,255,255,0.04); border-radius: 24px; padding: 20px; transition: transform 0.2s, background 0.2s; }
  .up-card:hover { transform: translateY(-4px); background: rgba(20,30,22,0.8); border-color: rgba(34,197,94,0.15); }
  
  .up-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 12px; }
  .up-date { color: #22c55e; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
  .up-countdown { color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 700; background: rgba(0,0,0,0.3); padding: 4px 10px; border-radius: 100px; }
  
  .up-teams { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 24px; }
  .up-team { display: flex; align-items: center; gap: 10px; flex: 1; }
  .up-team.right { flex-direction: row-reverse; }
  .up-logo { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 4px; }
  .up-logo img { width: 100%; height: 100%; object-fit: contain; }
  .up-name { color: white; font-size: 15px; font-weight: 800; max-width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .up-vs { color: #22c55e; font-size: 12px; font-weight: 900; font-style: italic; opacity: 0.8; }
  
  .up-footer { display: flex; justify-content: space-between; align-items: center; }
  .up-location { display: flex; align-items: center; gap: 6px; color: #5a6a5e; font-size: 11px; font-weight: 600; }
  .up-btn { background: transparent; border: 1px solid rgba(34,197,94,0.4); color: #22c55e; font-size: 11px; font-weight: 800; padding: 8px 16px; border-radius: 100px; cursor: pointer; transition: all 0.2s; text-transform: uppercase; }
  .up-btn:hover { background: rgba(34,197,94,0.1); border-color: #22c55e; }
  
  .empty-state { padding: 40px; text-align: center; color: #5a6a5e; font-size: 14px; font-weight: 600; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px dashed rgba(255,255,255,0.1); }
  
  .ls-loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 20px; }
  .spinner-spotify { width: 40px; height: 40px; border: 3px solid rgba(34,197,94,0.1); border-top-color: #22c55e; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360px); } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'live', label: 'Đang diễn ra' },
  { key: 'upcoming', label: 'Sắp diễn ra' },
  { key: 'finished', label: 'Đã kết thúc' }
]

function getStartOfDayTimestamp(date: Date) {
  return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 1000)
}

function UpcomingMatchCard({ m }: { m: any }) {
  const d = new Date(m.startTimestamp * 1000)
  const isToday = d.toDateString() === new Date().toDateString()
  const isTomorrow = d.toDateString() === new Date(Date.now() + 86400000).toDateString()
  
  let dateText = isToday ? 'HÔM NAY, ' : isTomorrow ? 'NGÀY MAI, ' : `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}, `
  dateText += d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="up-card">
      <div className="up-header">
        <span className="up-date">{dateText}</span>
        {isToday && <span className="up-countdown">BẮT ĐẦU SỚM</span>}
      </div>
      <div className="up-teams">
        <div className="up-team">
          <div className="up-logo"><img src={getImageUrl(m.teamA?.logo, 'logo', m.teamA?.id)} alt="" /></div>
          <span className="up-name">{m.teamA?.name}</span>
        </div>
        <span className="up-vs">VS</span>
        <div className="up-team right">
          <div className="up-logo"><img src={getImageUrl(m.teamB?.logo, 'logo', m.teamB?.id)} alt="" /></div>
          <span className="up-name">{m.teamB?.name}</span>
        </div>
      </div>
      <div className="up-footer">
        <div className="up-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
          {m.league || 'Giải đấu Khác'}
        </div>
        <a href={`/truc-tiep/${generateMatchSlug(m.teamA?.name || 'Home', m.teamB?.name || 'Away', new Date().toISOString().split('T')[0], m.id || '123')}`} style={{ textDecoration: 'none' }}>
          <button className="up-btn">CHI TIẾT</button>
        </a>
      </div>
    </div>
  )
}

// 🚀 GLOBAL CACHE TO PERSIST DATA BETWEEN NAVIGATION
let matchesCache: any[] | null = null;

export default function LiveScreen() {
  const [matches, setMatches] = useState<any[]>(matchesCache || [])
  const [loading, setLoading] = useState(!matchesCache)
  const [activeTab, setActiveTab] = useState('all')

  const fetchMatches = async () => {
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
      const res = await fetch(`${API}/matches/${todayStr}`)
      const json = await res.json()
      if (json.success) {
        // Flatten grouped matches from the backend
        const allMatches = json.data.flatMap((group: any) => group.matches || [])
        
        // Format to the schema expected by cards
        const formatted = allMatches.map((m: any) => {
          // Extract ID from sk (MATCH#12345) or use id/_id
          const rawId = m.sk || m._id || m.id || "";
          const cleanId = rawId.includes('#') ? rawId.split('#')[1] : rawId;

          return {
            id: cleanId,
            league: m.tournamentName || "Giải đấu Khác",
            time: m.time || "00:00",
            currentPeriod: m.currentPeriod || m.currentMinute || "",
            status: m.status,
            startTimestamp: m.startTimestamp,
            location: m.location || m.venue,
            teamA: {
              name: m.homeTeam?.name || m.homeTeamName || 'Đội Nhà',
              logo: getImageUrl(m.homeTeam?.logo || m.homeTeamLogo, 'logo', m.homeTeam?.id)
            },
            teamB: {
              name: m.awayTeam?.name || m.awayTeamName || 'Đội Khách',
              logo: getImageUrl(m.awayTeam?.logo || m.awayTeamLogo, 'logo', m.awayTeam?.id)
            },
            scoreA: (typeof m.homeScore === 'object' ? m.homeScore?.current : m.homeScore) ?? (typeof m.score?.home === 'object' ? m.score.home.current : m.score?.home) ?? 0,
            scoreB: (typeof m.awayScore === 'object' ? m.awayScore?.current : m.awayScore) ?? (typeof m.score?.away === 'object' ? m.score.away.current : m.score?.away) ?? 0,
            rawTime: m.time,
            liveStatus: m.liveStatus
          }
        })
        
        setMatches(formatted)
        matchesCache = formatted
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
    const interval = setInterval(fetchMatches, 30000)
    return () => clearInterval(interval)
  }, [])

  // Derived Match Groups
  const MATCH_DURATION_SEC = 110 * 60 // 110 mins
  const nowSec = Math.floor(Date.now() / 1000)

  const liveMatches = matches.filter(m => {
    const status = String(m.status || "").toLowerCase();
    const liveStatus = String(m.liveStatus || "").toLowerCase();

    // 1. Nếu đã kết thúc rõ ràng -> Loại khỏi Live
    if (['finished', 'closed', 'ended'].includes(status)) return false;

    // 2. Safety Check: Nếu bắt đầu quá 180 phút (3 tiếng) -> Coi như đã xong
    if (m.startTimestamp && (nowSec - m.startTimestamp > 180 * 60)) return false;

    // 3. Ưu tiên liveStatus từ bảng điều khiển media hoặc status từ crawler
    if (liveStatus === 'inprogress' || liveStatus === 'live') return true;
    if (['live', 'inprogress', 'in_progress'].includes(status)) return true;
    
    // 4. Trận sắp đá trong vòng 30 phút tới -> Đưa lên mục LIVE
    if (m.startTimestamp && (m.startTimestamp - nowSec <= 30 * 60) && (m.startTimestamp > nowSec)) return true;

    return false;
  }).sort((a, b) => {
    const diffA = Math.abs(nowSec - (a.startTimestamp || 0));
    const diffB = Math.abs(nowSec - (b.startTimestamp || 0));
    return diffA - diffB;
  });
  
  const upcomingMatches = matches.filter(m => {
    const status = String(m.status || "").toLowerCase();

    if (['finished', 'canceled', 'postponed', 'closed', 'ended'].includes(status)) return false;
    if (['live', 'inprogress', 'in_progress'].includes(status)) return false;

    if (m.startTimestamp) {
       const elapsed = nowSec - m.startTimestamp;
       // Nếu đã quá 180 phút thì không còn là "Sắp diễn ra" (đã sang Finished)
       if (elapsed > 180 * 60) return false;
       // Hiện các trận chưa đá hoặc sắp đá (từ 30 phút nữa đến 2 tiếng nữa)
       return m.startTimestamp > nowSec + 1800 && m.startTimestamp <= nowSec + 7200;
    }
    return false;
  }).sort((a, b) => (a.startTimestamp || 0) - (b.startTimestamp || 0));
  
  const finishedMatches = matches.filter(m => {
    const status = String(m.status || "").toLowerCase();
    // Coi là kết thúc nếu status là finished HOẶC đã bắt đầu quá 3 tiếng
    return ['finished', 'closed', 'ended'].includes(status) || (m.startTimestamp && (nowSec - m.startTimestamp > 180 * 60));
  }).sort((a, b) => (b.startTimestamp || 0) - (a.startTimestamp || 0));

  return (
    <div className="ls-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ls-container">
        
        <h1 className="ls-title">TRỰC TIẾP</h1>
        <p className="ls-subtitle">Theo dõi các trận cầu nảy lửa từ các giải đấu phủi hàng đầu Việt Nam</p>

        <div className="ls-top-bar">
          <div className="ls-tabs">
            {TABS.map(t => (
              <button 
                key={t.key} 
                className={`ls-tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="ls-filter-wrap">
            <span className="ls-filter-label">Chọn Giải Đấu</span>
            <select className="ls-select">
              <option>Tất cả giải đấu (Hôm nay)</option>
              <option>HPL-S10: Giải Ngoại hạng Phủi</option>
              {/* Optional: map unique leagues from today's matches */}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="ls-loading-wrap">
            <div className="spinner-spotify" />
            <span style={{ color: '#5a6a5e', fontSize: 14, fontWeight: 700 }}>Đang tải trận đấu...</span>
          </div>
        ) : (
          <>
            {/* --- LIVE SECTION --- */}
            {(activeTab === 'all' || activeTab === 'live') && (
              <div style={{ marginBottom: 60 }}>
                <h2 className="ls-section-title">
                  <div className="ls-dot" style={{ animation: 'pulse-live 1.2s infinite' }} /> 
                  ĐANG TRỰC TIẾP
                </h2>
                <div className="ls-grid">
                  {liveMatches.length > 0 ? (
                    liveMatches.map(m => (
                      <div key={m.id} style={{ display: 'flex' }}>
                        <LiveMatchCard {...m} />
                      </div>
                    ))
                  ) : (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                      Không có trận đấu nào đang diễn ra ngay lúc này.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- UPCOMING SECTION --- */}
            {(activeTab === 'all' || activeTab === 'upcoming') && (
              <div style={{ marginBottom: 60 }}>
                <h2 className="ls-section-title">
                  <div className="ls-dot green" /> 
                  SẮP DIỄN RA
                </h2>
                <div className="ls-grid">
                  {upcomingMatches.length > 0 ? (
                    upcomingMatches.map(m => <UpcomingMatchCard key={m.id} m={m} />)
                  ) : (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                      Không có trận đấu nào sắp diễn ra trong ngày.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- FINISHED SECTION --- */}
            {(activeTab === 'finished') && (
              <div style={{ marginBottom: 60 }}>
                <h2 className="ls-section-title">
                  <div className="ls-dot" style={{ background: '#5a6a5e' }} /> 
                  ĐÃ KẾT THÚC
                </h2>
                <div className="ls-grid">
                   {finishedMatches.length > 0 ? (
                    finishedMatches.map(m => (
                      <div key={m.id} style={{ display: 'flex', opacity: 0.8 }}>
                        <LiveMatchCard {...m} />
                      </div>
                    ))
                  ) : (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                      Hôm nay chưa có trận nào kết thúc.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
