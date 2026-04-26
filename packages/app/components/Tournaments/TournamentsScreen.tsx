"use client"
import React, { useState, useEffect, useMemo } from 'react'
import {
  YStack, XStack, Text, View, Image, Button,
  Input, ScrollView, Spinner, useMedia
} from 'tamagui'
import { Search, Plus, MapPin, Users, Trophy, Play } from '@tamagui/lucide-icons'
import Link from 'next/link'
import { useRouter } from 'solito/navigation'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const COLORS = {
  primary: '#28a745',
  bg: '#050807',
  card: 'rgba(15,22,18,0.9)',
  border: 'rgba(255,255,255,0.07)',
}

const STATUS_CONFIG: Record<string, any> = {
  Registration: { label: 'ĐANG MỞ ĐK', color: '#28a745', bg: 'rgba(40,167,69,0.12)' },
  Opening:      { label: 'SẮP KHAI MẠC', color: '#17a2b8', bg: 'rgba(23,162,184,0.12)' },
  Ongoing:      { label: 'ĐANG THI ĐẤU', color: '#ffd700', bg: 'rgba(255,215,0,0.1)' },
  Finished:     { label: 'ĐÃ KẾT THÚC', color: '#555', bg: 'rgba(80,80,80,0.12)' },
  Pending:      { label: 'CHỜ PHÊ DUYỆT', color: '#fa8c16', bg: 'rgba(250,140,22,0.12)' },
}

const FORMAT_LABEL: Record<string, string> = {
  League:          'Vòng tròn',
  Knockout:        'Loại trực tiếp',
  GroupKnockout:   'Chia bảng + KO',
  DoubleElimination: 'Thắng/Thua',
}

const FILTERS = [
  { key: 'all', label: '🏆 Tất cả' },
  { key: 'Registration', label: '🟢 Đang mở ĐK' },
  { key: 'Ongoing', label: '⚽ Đang đấu' },
  { key: 'Finished', label: '🏁 Kết thúc' },
]

// ─── Seed data (fallback khi API chưa có data) ───────────────────
const SEED_TOURNAMENTS = [
  {
    id: 'hpl-s11', name: 'HPL Season 11',
    region: 'Hà Nội', format: 'GroupKnockout',
    status: 'Ongoing', maxTeams: 12,
    teams: Array(10).fill(0),
    pitchType: 'Sân 7', entryFee: 5000000,
    expectedStartDate: '2026-01-10', expectedEndDate: '2026-04-30',
    banner: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800',
    organizerName: 'CLB HPL',
  },
  {
    id: 'vietcup-26', name: 'VietCup 2026',
    region: 'Toàn quốc', format: 'Knockout',
    status: 'Registration', maxTeams: 64,
    teams: Array(24).fill(0),
    pitchType: 'Sân 7', entryFee: 3000000,
    expectedStartDate: '2026-03-15', expectedEndDate: '2026-06-30',
    banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=800',
    organizerName: 'VietCup Org',
  },
  {
    id: 'saigon-s4', name: 'Sài Gòn League S4',
    region: 'TP. HCM', format: 'League',
    status: 'Registration', maxTeams: 16,
    teams: Array(8).fill(0),
    pitchType: 'Sân 5', entryFee: 2000000,
    expectedStartDate: '2026-04-01', expectedEndDate: '2026-07-31',
    banner: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800',
    organizerName: 'SGL Org',
  },
  {
    id: 'danang-open', name: 'Đà Nẵng Open 2026',
    region: 'Đà Nẵng', format: 'GroupKnockout',
    status: 'Pending', maxTeams: 24,
    teams: [],
    pitchType: 'Sân 11', entryFee: 8000000,
    expectedStartDate: '2026-05-01', expectedEndDate: '2026-08-31',
    banner: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=800',
    organizerName: 'DNO',
  },
]

export default function TournamentsScreen() {
  const media = useMedia()
  const isMobile = !media.gtMd
  const router = useRouter()

  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  // Scroll to top when page mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [])

  useEffect(() => {
    axios.get(`${API}/tournaments/list`)
      .then(res => setTournaments(res.data?.data?.length ? res.data.data : SEED_TOURNAMENTS))
      .catch(() => setTournaments(SEED_TOURNAMENTS))
      .finally(() => setLoading(false))

    const u = localStorage.getItem('user')
    if (u) {
      try { setCurrentUser(JSON.parse(u)) } catch(e){}
    }
  }, [])

  const handleCreateClick = () => {
    if (!currentUser) {
      router.push('/register')
      return
    }
    router.push('/giai-dau/tao-moi')
  }

  const filtered = useMemo(() => {
    let items = tournaments
    if (activeFilter !== 'all') items = items.filter(t => t.status === activeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(t =>
        t.name?.toLowerCase().includes(q) || t.region?.toLowerCase().includes(q)
      )
    }
    return items
  }, [tournaments, activeFilter, search])

  return (
    <YStack flex={1} backgroundColor={COLORS.bg as any} minHeight="100vh">
      {/* Font Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important; }
        .gradient-filter-btn {
          background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
          box-shadow: 0 2px 12px rgba(34,197,94,0.4);
          border: none;
        }
        .gradient-filter-btn:hover {
          opacity: 0.92;
        }
        .inactive-filter-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.2s ease;
        }
        .inactive-filter-btn:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.2);
        }
        .tournament-card-link {
          text-decoration: none !important;
          display: block;
        }
        .tournament-card-wrap {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          cursor: pointer;
        }
        .tournament-card-wrap:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(34,197,94,0.18), 0 8px 24px rgba(0,0,0,0.5) !important;
          border-color: rgba(34,197,94,0.35) !important;
        }
        .card-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1fr;
          width: 100%;
        }
        @media (min-width: 640px) {
          .card-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .card-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .hero-section {
          position: relative;
          overflow: hidden;
        }
        .hero-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .search-box:focus-within {
          border-color: rgba(34,197,94,0.4) !important;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.08);
        }
      `}</style>

      {/* HERO */}
      <YStack
        className="hero-section"
        paddingHorizontal={isMobile ? '$4' : '$8'}
        paddingTop={isMobile ? '$6' : '$10'}
        paddingBottom={isMobile ? '$6' : '$10'}
        style={{
          borderBottom: '1px solid rgba(40,167,69,0.1)',
        }}
        gap="$5"
      >
        <XStack justifyContent="space-between" alignItems="center" flexWrap={"wrap" as any} gap="$3">
          <YStack gap="$2" flex={1}>
            <XStack alignItems="center" gap="$2">
              <Trophy size={18} color={COLORS.primary as any} />
              <Text
                color={COLORS.primary as any}
                fontSize={11}
                fontWeight="900"
                letterSpacing={2.5}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                GIẢI ĐẤU BÓNG ĐÁ PHONG TRÀO
              </Text>
            </XStack>
            <Text
              color="white"
              fontSize={isMobile ? 28 : 40}
              fontWeight="900"
              letterSpacing={-1}
              style={{ fontFamily: 'Inter, sans-serif', lineHeight: isMobile ? '36px' : '48px' }}
            >
              Khám phá giải đấu
            </Text>
            <Text
              color="#666"
              fontSize={isMobile ? 13 : 15}
              fontWeight="500"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {tournaments.length} giải đấu trên toàn quốc
            </Text>
          </YStack>
          {!isMobile && (
            <div
              onClick={handleCreateClick}
              style={{
                background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
                boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
                padding: '12px 24px',
                borderRadius: 100,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                flexShrink: 0,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 900,
                fontSize: 14,
                color: 'black',
                border: 'none',
                transition: 'opacity 0.2s, transform 0.2s',
              }}
              onMouseOver={e => { (e.currentTarget as any).style.opacity = '0.9'; (e.currentTarget as any).style.transform = 'scale(1.02)'; }}
              onMouseOut={e => { (e.currentTarget as any).style.opacity = '1'; (e.currentTarget as any).style.transform = 'scale(1)'; }}
            >
              <Plus size={18} color="black" />
              TẠO GIẢI ĐẤU
            </div>
          )}
        </XStack>

        {/* Search + Filter */}
        <YStack gap="$3">
          {/* Search Box */}
          <div
            className="search-box"
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '0 14px',
              height: 52,
              gap: 10,
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <Search size={16} color="#555" />
            <input
              type="text"
              placeholder="Tìm tên giải đấu, khu vực..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
              }}
            />
            {search.length > 0 && (
              <div
                onClick={() => setSearch('')}
                style={{
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  color: '#666',
                  fontSize: 12,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                ✕
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={activeFilter === f.key ? 'gradient-filter-btn' : 'inactive-filter-btn'}
                style={{
                  padding: '8px 18px',
                  borderRadius: 100,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 800,
                  fontSize: 12,
                  color: activeFilter === f.key ? 'black' : '#888',
                  letterSpacing: 0.2,
                  transition: 'all 0.22s ease',
                  outline: 'none',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </YStack>
      </YStack>

      {/* CONTENT */}
      <YStack
        flex={1}
        paddingHorizontal={isMobile ? '$3' : '$8'}
        paddingTop="$6"
        paddingBottom="$12"
        maxWidth={1280}
        width="100%"
        marginHorizontal="auto"
      >
        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center" paddingTop={80} gap="$3">
            <Spinner size="large" color={COLORS.primary as any} />
            <Text color="#555" fontSize={14} style={{ fontFamily: 'Inter, sans-serif' }}>Đang tải dữ liệu...</Text>
          </YStack>
        ) : filtered.length === 0 ? (
          <YStack flex={1} justifyContent="center" alignItems="center" paddingTop={80} gap="$2">
            <Text color="#333" fontSize={40}>🏆</Text>
            <Text color="#555" fontSize={16} fontWeight="700" style={{ fontFamily: 'Inter, sans-serif' }}>Không tìm thấy giải đấu</Text>
            <Text color="#333" fontSize={13} style={{ fontFamily: 'Inter, sans-serif' }}>Thử tìm kiếm với từ khóa khác</Text>
          </YStack>
        ) : (
          <YStack gap="$5">
            <Text
              color="#444"
              fontSize={12}
              fontWeight="700"
              letterSpacing={1}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {filtered.length} GIẢI ĐẤU
            </Text>
            <div className="card-grid">
              {filtered.map(t => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          </YStack>
        )}
      </YStack>

      {/* Mobile FAB */}
      {isMobile && (
        <div
          onClick={handleCreateClick}
          style={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
            boxShadow: '0 4px 20px rgba(34,197,94,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 99,
            border: 'none',
          }}
        >
          <Plus size={24} color="black" />
        </div>
      )}
    </YStack>
  )
}

// ─── Tournament Card ──────────────────────────────────────────────
export const TournamentCard = ({ tournament: t }: { tournament: any }) => {
  const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.Pending
  const registeredTeams = t.teams?.length || 0
  const isLive = t.status === 'Ongoing'

  return (
    <Link href={`/giai-dau/${t.id}`} className="tournament-card-link">
      <div
        className="tournament-card-wrap"
        style={{
          background: 'rgba(15,22,18,0.92)',
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Banner */}
        <div style={{ width: '100%', height: 170, position: 'relative', overflow: 'hidden' }}>
          <img
            src={t.banner || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800'}
            alt={t.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,22,18,1) 0%, rgba(15,22,18,0.3) 60%, transparent 100%)' }} />

          {/* LIVE badge */}
          {isLive && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 20,
              padding: '4px 10px',
              display: 'flex', alignItems: 'center', gap: 6,
              backdropFilter: 'blur(6px)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', animation: 'pulse-red 1.5s infinite' }} />
              <span style={{ color: 'white', fontSize: 10, fontWeight: 900, fontFamily: 'Inter, sans-serif', letterSpacing: 1 }}>LIVE</span>
            </div>
          )}

          {/* Status badge */}
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: statusCfg.bg,
            border: `1px solid ${statusCfg.color}44`,
            borderRadius: 20,
            padding: '4px 12px',
          }}>
            <span style={{
              color: statusCfg.color,
              fontSize: 10,
              fontWeight: 900,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: 0.5,
            }}>
              {statusCfg.label}
            </span>
          </div>

          {/* Format badge */}
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            backgroundColor: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '3px 10px',
            backdropFilter: 'blur(4px)',
          }}>
            <span style={{ color: '#ccc', fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
              {FORMAT_LABEL[t.format] || t.format}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          <div style={{
            color: 'white',
            fontSize: 17,
            fontWeight: 900,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: -0.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {t.name}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: 0.65 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={11} color="#aaa" />
              <span style={{ color: '#aaa', fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{t.region}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={11} color="#aaa" />
              <span style={{ color: '#aaa', fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{registeredTeams}/{t.maxTeams} đội</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.round((registeredTeams / t.maxTeams) * 100)}%`,
              background: t.status === 'Registration'
                ? 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)'
                : t.status === 'Ongoing' ? '#ffd700' : '#555',
              borderRadius: 2,
            }} />
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <span style={{ color: '#555', fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
              {t.entryFee > 0 ? `${(t.entryFee / 1000000).toFixed(1)}M VNĐ/đội` : 'Miễn phí'}
            </span>

            {/* Gradient "Xem ngay" button */}
            <div style={{
              background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
              borderRadius: 100,
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 2px 10px rgba(34,197,94,0.35)',
              fontSize: 11,
              fontWeight: 900,
              color: 'black',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: 0.2,
            }}>
              <Play size={10} color="black" />
              CHI TIẾT
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

