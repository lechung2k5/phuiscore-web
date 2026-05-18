"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { YStack, XStack, Text, View, Image, Spinner, useMedia } from 'tamagui'
import { Search, MapPin, Users, Filter, ChevronRight, X } from '@tamagui/lucide-icons'
import Link from 'next/link'
import { useRouter } from 'solito/navigation'
import axios from 'axios'
import RegisterTeamModal from './RegisterTeamModal'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
const C = { primary: '#28a745', bg: '#050807', card: 'rgba(15,22,18,0.85)', border: 'rgba(255,255,255,0.07)' }

const STATUS_CFG: Record<string, any> = {
  Registration: { label: 'Đang mở ĐK', color: '#28a745', bg: 'rgba(40,167,69,0.12)' },
  Opening:      { label: 'Sắp khai mạc', color: '#17a2b8', bg: 'rgba(23,162,184,0.12)' },
  Ongoing:      { label: 'Đang đấu', color: '#ffd700', bg: 'rgba(255,215,0,0.1)' },
  Finished:     { label: 'Kết thúc', color: '#555', bg: 'rgba(80,80,80,0.12)' },
  Pending:      { label: 'Chờ duyệt', color: '#fa8c16', bg: 'rgba(250,140,22,0.12)' },
}
const FORMAT_LABEL: Record<string, string> = {
  League: 'Vòng tròn', Knockout: 'Loại trực tiếp',
  GroupKnockout: 'Chia bảng + KO', DoubleElimination: 'Thắng/Thua',
}
const PITCH_OPTS = ['Tất cả', 'Sân 5', 'Sân 7', 'Sân 11']
const REGION_OPTS = ['Tất cả', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Toàn quốc']

// ─── Tournament Search Card ───────────────────────────────────────
const SearchCard = ({ t, onRegister }: { t: any; onRegister: () => void }) => {
  const statusCfg = STATUS_CFG[t.status] || STATUS_CFG.Pending
  const registered = t.teams?.length || 0
  const pct = Math.round((registered / t.maxTeams) * 100)
  const canRegister = ['Registration', 'Pending', 'Opening'].includes(t.status) && registered < t.maxTeams

  return (
    <YStack
      backgroundColor={C.card as any} borderRadius={16}
      borderWidth={1} borderColor={C.border as any}
      overflow="hidden"
      hoverStyle={{ borderColor: 'rgba(40,167,69,0.25)' } as any}
      style={{ backdropFilter: 'blur(12px)', transition: 'border-color 0.2s' }}
    >
      <XStack>
        {/* Banner nhỏ bên trái */}
        <View width={90} style={{ flexShrink: 0 }}>
          <Image
            src={t.banner || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400'}
            width="100%" height="100%"
            style={{ objectFit: 'cover', minHeight: 90 } as any}
          />
        </View>

        {/* Content */}
        <YStack flex={1} padding="$3" gap="$1.5">
          <XStack justifyContent="space-between" alignItems="flex-start">
            <YStack flex={1} gap="$0.5">
              <View
                backgroundColor={statusCfg.bg}
                paddingHorizontal={8} paddingVertical={2}
                borderRadius={20} alignSelf="flex-start"
                borderWidth={1} borderColor={(statusCfg.color + '44') as any}
              >
                <Text color={statusCfg.color as any} fontSize={9} fontWeight="900">{statusCfg.label}</Text>
              </View>
              <Text color="white" fontSize={14} fontWeight="900" numberOfLines={1} marginTop="$1">{t.name}</Text>
            </YStack>
          </XStack>

          <XStack gap="$3" alignItems="center">
            <XStack alignItems="center" gap="$1">
              <MapPin size={10} color="#666" />
              <Text color="#666" fontSize={10} fontWeight="600">{t.region}</Text>
            </XStack>
            <XStack alignItems="center" gap="$1">
              <Users size={10} color="#666" />
              <Text color="#666" fontSize={10} fontWeight="600">{registered}/{t.maxTeams}</Text>
            </XStack>
            <Text color="#555" fontSize={10} fontWeight="600">
              {t.entryFee > 0 ? `${(t.entryFee / 1_000_000).toFixed(0)}M VNĐ` : 'Miễn phí'}
            </Text>
          </XStack>

          {/* Progress bar */}
          <View height={3} backgroundColor={"rgba(255,255,255,0.06)" as any} borderRadius={2} overflow="hidden">
            <View height="100%" width={`${pct}%` as any}
              backgroundColor={(canRegister ? C.primary : '#444') as any} borderRadius={2} />
          </View>
        </YStack>
      </XStack>

      {/* Actions */}
      <XStack borderTopWidth={1} borderColor={C.border as any}>
        <Link href={`/giai-dau/${t.id}`} style={{ textDecoration: 'none', flex: 1 }}>
          <XStack flex={1} padding="$2.5" justifyContent="center" alignItems="center" gap="$1"
            hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.03)' } as any}>
            <Text color="#666" fontSize={12} fontWeight="700">Chi tiết</Text>
            <ChevronRight size={13} color="#666" />
          </XStack>
        </Link>

        <View width={1} backgroundColor={C.border as any} />

        <XStack flex={1} padding="$2.5" justifyContent="center" alignItems="center" gap="$1"
          backgroundColor={(canRegister ? 'rgba(40,167,69,0.08)' : 'transparent') as any}
          onPress={canRegister ? onRegister : undefined}
          style={{ cursor: canRegister ? 'pointer' : 'default' }}
          hoverStyle={canRegister ? { backgroundColor: 'rgba(40,167,69,0.15)' } as any : {}}
        >
          <Text
            color={(canRegister ? C.primary : '#333') as any}
            fontSize={12} fontWeight="900"
          >
            {canRegister ? 'Đăng ký ngay' : registered >= t.maxTeams ? 'Đã đủ đội' : 'Không mở ĐK'}
          </Text>
        </XStack>
      </XStack>
    </YStack>
  )
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────
export default function SearchTournamentScreen() {
  const media = useMedia()
  const isMobile = !media.gtMd
  const router = useRouter()

  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filterPitch, setFilterPitch] = useState('Tất cả')
  const [filterRegion, setFilterRegion] = useState('Tất cả')
  const [onlyOpen, setOnlyOpen] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [registerTarget, setRegisterTarget] = useState<any>(null)

  useEffect(() => {
    axios.get(`${API}/tournaments/list`)
      .then(r => setTournaments(r.data?.data || []))
      .catch(() => setTournaments([]))
      .finally(() => setLoading(false))

    const u = localStorage.getItem('user')
    if (u) {
      try { setCurrentUser(JSON.parse(u)) } catch(e){}
    }
  }, [])

  const filtered = useMemo(() => {
    let items = [...tournaments]
    if (onlyOpen) items = items.filter(t => t.status === 'Registration')
    if (filterPitch !== 'Tất cả') items = items.filter(t => t.pitchType === filterPitch)
    if (filterRegion !== 'Tất cả') items = items.filter(t => t.region === filterRegion)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.region?.toLowerCase().includes(q) ||
        t.organizerName?.toLowerCase().includes(q)
      )
    }
    return items
  }, [tournaments, search, filterPitch, filterRegion, onlyOpen])

  const handleRegistered = () => {
    // Refresh giải đó trong list
    axios.get(`${API}/tournaments/list`)
      .then(r => setTournaments(r.data?.data || []))
      .catch(() => {})
  }

  const handleRegisterClick = (t: any) => {
    if (!currentUser) {
      router.push('/register')
      return
    }
    setRegisterTarget(t)
  }

  const activeFilterCount = [filterPitch !== 'Tất cả', filterRegion !== 'Tất cả', onlyOpen].filter(Boolean).length

  return (
    <YStack flex={1} backgroundColor={C.bg as any} minHeight="100vh">
      {/* HEADER */}
      <YStack
        paddingHorizontal={isMobile ? '$4' : '$8'}
        paddingTop={isMobile ? '$5' : '$7'}
        paddingBottom="$4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(180deg, rgba(40,167,69,0.05) 0%, transparent 100%)' }}
        gap="$3"
      >
        <YStack gap="$1">
          <Text color={C.primary as any} fontSize={11} fontWeight="900" letterSpacing={2}>TÌM KIẾM</Text>
          <Text color="white" fontSize={isMobile ? 24 : 32} fontWeight="900" letterSpacing={-0.5}>
            Tìm giải đấu để tham gia
          </Text>
          <Text color="#555" fontSize={13}>Hàng trăm giải đấu phong trào đang mở đăng ký</Text>
        </YStack>

        {/* Search bar */}
        <XStack
          backgroundColor={"rgba(255,255,255,0.05)" as any}
          borderRadius={14} borderWidth={1} borderColor={"rgba(255,255,255,0.08)" as any}
          paddingHorizontal="$3" height={50} alignItems="center" gap="$2"
        >
          <Search size={18} color="#555" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tên giải đấu, khu vực, BTC..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 15, fontFamily: 'inherit' }}
          />
          {search.length > 0 && (
            <View padding={4} onPress={() => setSearch('')} style={{ cursor: 'pointer' }}>
              <X size={14} color="#555" />
            </View>
          )}
          {/* Filter toggle */}
          <XStack
            backgroundColor={(showFilters ? C.primary : 'rgba(255,255,255,0.06)') as any}
            paddingHorizontal="$3" paddingVertical="$1.5"
            borderRadius={10} alignItems="center" gap="$1.5"
            onPress={() => setShowFilters(s => !s)}
            style={{ cursor: 'pointer', marginLeft: 4 }}
          >
            <Filter size={14} color={showFilters ? 'white' : '#888'} />
            <Text color={showFilters ? 'white' : '#888'} fontSize={12} fontWeight="800">
              {activeFilterCount > 0 ? `Lọc (${activeFilterCount})` : 'Lọc'}
            </Text>
          </XStack>
        </XStack>

        {/* Filters panel */}
        {showFilters && (
          <YStack
            backgroundColor={"rgba(255,255,255,0.03)" as any}
            borderRadius={14} borderWidth={1} borderColor={"rgba(255,255,255,0.07)" as any}
            padding="$4" gap="$3"
          >
            {/* Chỉ mở đăng ký */}
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="#888" fontSize={13} fontWeight="700">Chỉ hiện giải đang mở đăng ký</Text>
              <XStack
                width={44} height={24} borderRadius={12}
                backgroundColor={(onlyOpen ? C.primary : 'rgba(255,255,255,0.1)') as any}
                alignItems="center"
                paddingHorizontal={2}
                justifyContent={onlyOpen ? 'flex-end' : 'flex-start'}
                onPress={() => setOnlyOpen(v => !v)}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
              >
                <View width={20} height={20} borderRadius={10} backgroundColor={"white" as any} />
              </XStack>
            </XStack>

            {/* Loại sân */}
            <YStack gap="$2">
              <Text color="#888" fontSize={11} fontWeight="700">LOẠI SÂN</Text>
              <XStack gap="$2" flexWrap={"wrap" as any}>
                {PITCH_OPTS.map(p => (
                  <XStack key={p}
                    backgroundColor={(filterPitch === p ? C.primary : 'rgba(255,255,255,0.05)') as any}
                    paddingHorizontal="$3" paddingVertical="$1.5" borderRadius={20}
                    borderWidth={1} borderColor={(filterPitch === p ? C.primary : 'rgba(255,255,255,0.08)') as any}
                    onPress={() => setFilterPitch(p)} style={{ cursor: 'pointer' }}>
                    <Text color={filterPitch === p ? 'white' : '#888'} fontSize={12} fontWeight="700">{p}</Text>
                  </XStack>
                ))}
              </XStack>
            </YStack>

            {/* Khu vực */}
            <YStack gap="$2">
              <Text color="#888" fontSize={11} fontWeight="700">KHU VỰC</Text>
              <XStack gap="$2" flexWrap={"wrap" as any}>
                {REGION_OPTS.map(r => (
                  <XStack key={r}
                    backgroundColor={(filterRegion === r ? C.primary : 'rgba(255,255,255,0.05)') as any}
                    paddingHorizontal="$3" paddingVertical="$1.5" borderRadius={20}
                    borderWidth={1} borderColor={(filterRegion === r ? C.primary : 'rgba(255,255,255,0.08)') as any}
                    onPress={() => setFilterRegion(r)} style={{ cursor: 'pointer' }}>
                    <Text color={filterRegion === r ? 'white' : '#888'} fontSize={12} fontWeight="700">{r}</Text>
                  </XStack>
                ))}
              </XStack>
            </YStack>
          </YStack>
        )}
      </YStack>

      {/* RESULTS */}
      <YStack
        flex={1}
        paddingHorizontal={isMobile ? '$3' : '$8'}
        paddingTop="$4" paddingBottom="$10"
        maxWidth={1100} width="100%" marginHorizontal="auto"
      >
        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center" paddingTop={80} gap="$3">
            <Spinner size="large" color={C.primary as any} />
            <Text color="#555" fontSize={14}>Đang tìm kiếm giải đấu...</Text>
          </YStack>
        ) : filtered.length === 0 ? (
          <YStack flex={1} justifyContent="center" alignItems="center" paddingTop={80} gap="$3">
            <Text color="#333" fontSize={48}>🏆</Text>
            <Text color="#555" fontSize={16} fontWeight="700">
              {search ? `Không tìm thấy giải nào cho "${search}"` : 'Không có giải đấu nào phù hợp'}
            </Text>
            <Text color="#333" fontSize={13}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</Text>
            {onlyOpen && (
              <XStack backgroundColor={C.primary as any} paddingHorizontal="$4" paddingVertical="$2.5"
                borderRadius="$10" onPress={() => setOnlyOpen(false)} style={{ cursor: 'pointer' }}>
                <Text color="white" fontWeight="700" fontSize={13}>Xem tất cả giải đấu</Text>
              </XStack>
            )}
          </YStack>
        ) : (
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="#444" fontSize={12} fontWeight="700">
                {`${filtered.length} giải đấu${onlyOpen ? ' đang mở đăng ký' : ''}`}
              </Text>
              {onlyOpen && (
                <Text color={C.primary as any} fontSize={12} fontWeight="700"
                  onPress={() => setOnlyOpen(false)} style={{ cursor: 'pointer' }}>
                  Xem tất cả
                </Text>
              )}
            </XStack>

            <XStack flexWrap={"wrap" as any} gap="$3" alignItems="stretch">
              {filtered.map(t => (
                <View
                  key={t.id}
                  width={isMobile ? '100%' : '48%'}
                  flexGrow={1}
                  minWidth={isMobile ? undefined : 320}
                >
                  <SearchCard t={t} onRegister={() => handleRegisterClick(t)} />
                </View>
              ))}
            </XStack>
          </YStack>
        )}
      </YStack>

      {registerTarget && (
        <RegisterTeamModal
          tournament={registerTarget}
          onClose={() => setRegisterTarget(null)}
          onSuccess={() => { setRegisterTarget(null); handleRegistered() }}
        />
      )}
    </YStack>
  )
}
