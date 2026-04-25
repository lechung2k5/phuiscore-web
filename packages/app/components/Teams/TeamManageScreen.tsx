"use client"
import React, { useState, useEffect } from 'react'
import {
  YStack, XStack, Text, Button, Input, View, Image, ScrollView, Spinner, Sheet, TextArea
} from 'tamagui'
import {
  ArrowLeft, Download, FileSpreadsheet, Plus, Search,
  Edit3, Trash2, Shield, Star, Users, ChevronRight,
  Swords, User, Settings, DollarSign, TrendingUp,
  TrendingDown, Save, Upload, Trophy, Image as ImageIcon, X
} from '@tamagui/lucide-icons'
import axios from 'axios'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'

import { AddMemberModal } from './AddMemberModal'
import { EditMemberModal } from './EditMemberModal'

const API = 'http://localhost:5000/api'

/* ─── Design tokens ─────────────────────────── */
const C = {
  bg: '#07090a',
  surface: '#0d1117',
  surfaceHover: '#111820',
  card: '#0d1117',
  cardBorder: '#1a2030',
  cardHover: '#111820',
  accent: '#00e676',
  accentDim: 'rgba(0,230,118,0.12)',
  accentBorder: 'rgba(0,230,118,0.3)',
  accentGlow: '0 0 24px rgba(0,230,118,0.18)',
  gold: '#ffc400',
  goldDim: 'rgba(255,196,0,0.12)',
  red: '#ff4444',
  redDim: 'rgba(255,68,68,0.12)',
  blue: '#448aff',
  blueDim: 'rgba(68,138,255,0.12)',
  orange: '#ff9800',
  orangeDim: 'rgba(255,152,0,0.12)',
  text: '#e8edf2',
  textSub: '#6b7a8d',
  textDim: '#3a4555',
  white: '#ffffff',
}

const ROLE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  captain: { label: 'Đội Trưởng', color: C.gold, bg: C.goldDim, icon: '👑' },
  coach: { label: 'HLV', color: C.blue, bg: C.blueDim, icon: '📋' },
  player: { label: 'Cầu Thủ', color: C.textSub, bg: 'rgba(107,122,141,0.1)', icon: '⚽' },
}

/* ─── Tab config ─────────────────────────────── */
const MANAGE_TABS = [
  { id: 'squad', label: '⚽ Quân số' },
  { id: 'matches', label: '🏆 Lịch đấu' },
  { id: 'media', label: '🏅 Thành tích & Media' },
  { id: 'settings', label: '⚙️ Cài đặt' },
]

/* ─── Sub-components ───────────────────────── */
const StatBadge = ({ label, color, bg, icon }: any) => (
  <XStack paddingHorizontal="$2" paddingVertical="$1" borderRadius={20} alignItems="center" gap="$1" backgroundColor={bg as any}>
    <Text fontSize={10}>{icon}</Text>
    <Text color={color as any} fontSize={11} fontWeight="700">{label}</Text>
  </XStack>
)

const PlayerCard = ({ member, index, onEdit, onDelete, onUploadAvatar }: any) => {
  const role = ROLE_META[member.role] || ROLE_META.player
  const isCaptain = member.role === 'captain' || member.role === 'coach'
  return (
    <View
      backgroundColor={C.card as any} borderRadius={16} borderWidth={1}
      borderColor={isCaptain ? (C.accentBorder as any) : (C.cardBorder as any)}
      overflow="hidden"
      hoverStyle={{ borderColor: isCaptain ? C.accentBorder : '#252f40', backgroundColor: C.cardHover } as any}
      style={{
        transition: 'all 0.2s',
        boxShadow: isCaptain ? C.accentGlow : 'none',
        animationName: 'fadeSlideUp', animationDuration: '0.35s',
        animationTimingFunction: 'cubic-bezier(0.22,1,0.36,1)', animationFillMode: 'both',
        animationDelay: `${index * 55}ms`,
      } as any}
    >
      <View position="absolute" top={0} right={0} width={52} height={52} alignItems="center" justifyContent="center"
        style={{ background: isCaptain ? `linear-gradient(135deg,${C.accent}22,${C.accent}44)` : 'linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.08))', borderBottomLeftRadius: 16 } as any}>
        <Text color={isCaptain ? (C.accent as any) : (C.textSub as any)} fontSize={15} fontWeight="900" letterSpacing={-0.5}>{member.shirtNumber || '–'}</Text>
      </View>
      <YStack padding="$4" gap="$3">
        <XStack gap="$3" alignItems="center" paddingRight="$8">
          <View width={52} height={52} borderRadius={26} overflow="hidden" backgroundColor="rgba(255,255,255,0.05)"
            borderWidth={2} borderColor={isCaptain ? (C.accentBorder as any) : (C.cardBorder as any)}
            style={{ flexShrink: 0, cursor: 'pointer' } as any} hoverStyle={{ opacity: 0.8 } as any}
            onPress={() => onUploadAvatar(member.id || member._id)}>
            {member.avatar ? <Image src={member.avatar} width={52} height={52} style={{ objectFit: 'cover' } as any} />
              : <View flex={1} alignItems="center" justifyContent="center"><User size={22} color={C.textDim as any} /></View>}
          </View>
          <YStack flex={1} gap="$1">
            <Text color={C.text as any} fontSize={15} fontWeight="800" numberOfLines={1} letterSpacing={-0.2}>{member.name}</Text>
            <Text color={C.textSub as any} fontSize={12} fontWeight="500">{member.position || 'Chưa rõ vị trí'}</Text>
          </YStack>
        </XStack>
        <XStack justifyContent="space-between" alignItems="center">
          <StatBadge label={role.label} color={role.color} bg={role.bg} icon={role.icon} />
          {member.birthYear && <Text color={C.textDim as any} fontSize={11} fontWeight="600">{new Date().getFullYear() - member.birthYear} tuổi</Text>}
        </XStack>
        <View height={1} backgroundColor={C.cardBorder as any} />
        <XStack gap="$2" justifyContent="flex-end">
          <Button size="$2" backgroundColor="rgba(68,138,255,0.1)" borderWidth={1} borderColor="rgba(68,138,255,0.25)"
            borderRadius={8} icon={<Edit3 size={13} color={C.blue as any} />} onPress={() => onEdit(member)} pressStyle={{ opacity: 0.7 } as any}>
            <Text color={C.blue as any} fontSize={12} fontWeight="700">Sửa</Text>
          </Button>
          <Button size="$2" backgroundColor={C.redDim as any} borderWidth={1} borderColor="rgba(255,68,68,0.25)"
            borderRadius={8} icon={<Trash2 size={13} color={C.red as any} />} onPress={() => onDelete(member.id || member._id)} pressStyle={{ opacity: 0.7 } as any}>
            <Text color={C.red as any} fontSize={12} fontWeight="700">Xóa</Text>
          </Button>
        </XStack>
      </YStack>
    </View>
  )
}

const FilterTab = ({ label, active, count, onPress }: any) => (
  <Button size="$3" onPress={onPress} borderRadius={10}
    backgroundColor={active ? (C.accentDim as any) : 'transparent'}
    borderWidth={1} borderColor={active ? (C.accentBorder as any) : 'transparent'}
    pressStyle={{ opacity: 0.8 } as any} style={{ transition: 'all 0.15s' } as any}>
    <XStack gap="$1.5" alignItems="center">
      <Text color={active ? (C.accent as any) : (C.textSub as any)} fontSize={13} fontWeight="700">{label}</Text>
      <View paddingHorizontal="$1.5" paddingVertical={2} borderRadius={10}
        backgroundColor={active ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)' as any}>
        <Text color={active ? (C.accent as any) : (C.textDim as any)} fontSize={10} fontWeight="800">{count}</Text>
      </View>
    </XStack>
  </Button>
)

/* ─── Finance row component ──────────────────── */
const FinanceRow = ({ item }: { item: any }) => {
  const isIncome = item.type === 'income'
  return (
    <XStack padding="$3" borderRadius={10} backgroundColor="rgba(255,255,255,0.02)" borderWidth={1} borderColor={C.cardBorder as any} alignItems="center" gap="$3">
      <View width={36} height={36} borderRadius={18} alignItems="center" justifyContent="center"
        backgroundColor={isIncome ? 'rgba(0,230,118,0.1)' : 'rgba(255,68,68,0.1)' as any}>
        {isIncome ? <TrendingUp size={18} color={C.accent as any} /> : <TrendingDown size={18} color={C.red as any} />}
      </View>
      <YStack flex={1}>
        <Text color={C.text as any} fontSize={14} fontWeight="700">{item.description}</Text>
        <Text color={C.textSub as any} fontSize={12}>{item.date}</Text>
      </YStack>
      <Text color={isIncome ? (C.accent as any) : (C.red as any)} fontSize={15} fontWeight="900">
        {isIncome ? '+' : '-'}{item.amount?.toLocaleString('vi-VN')}đ
      </Text>
    </XStack>
  )
}

/* ─── Match row component ────────────────────── */
const MatchRow = ({ match }: { match: any }) => (
  <XStack padding="$4" borderRadius={14} backgroundColor="rgba(255,255,255,0.02)" borderWidth={1} borderColor={C.cardBorder as any} alignItems="center" gap="$3" flexWrap="wrap">
    <YStack flex={1} minWidth={200}>
      <XStack alignItems="center" gap="$2">
        <Text color="#ffc400" fontSize={11} fontWeight="800">{match.type === 'friendly' ? '⚽ Giao hữu' : '🏆 Giải đấu'}</Text>
        <Text color={C.textDim as any} fontSize={11}>• {match.date || 'Chưa xác định'}</Text>
      </XStack>
      <Text color={C.text as any} fontSize={15} fontWeight="800" marginTop={2}>{match.opponent || 'TBD'}</Text>
      <Text color={C.textSub as any} fontSize={12}>📍 {match.venue || 'Chưa có sân'}</Text>
    </YStack>
    {match.score ? (
      <View paddingHorizontal="$4" paddingVertical="$2" borderRadius={10} backgroundColor="rgba(0,230,118,0.08)" borderWidth={1} borderColor="rgba(0,230,118,0.2)">
        <Text color={C.accent as any} fontSize={20} fontWeight="900">{match.score}</Text>
      </View>
    ) : (
      <View paddingHorizontal="$3" paddingVertical="$2" borderRadius={10} backgroundColor="rgba(255,255,255,0.05)">
        <Text color={C.textSub as any} fontSize={12} fontWeight="700">Chờ đấu</Text>
      </View>
    )}
  </XStack>
)

/* ─── Main component ─────────────────────────── */
export default function TeamManageScreen() {
  const params = useParams()
  const searchParams = useSearchParams()
  const teamId = params?.id

  // Core state
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams?.get('tab')
    const valid = ['squad', 'matches', 'media', 'settings']
    return valid.includes(tab || '') ? tab! : 'squad'
  })

  // Squad tab
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'captain' | 'coach' | 'player'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [uploadingAvatarId, setUploadingAvatarId] = useState<string | null>(null)
  const [editMember, setEditMember] = useState<any>(null)

  // Finance tab
  const [finances, setFinances] = useState<any[]>([])
  const [showAddFinance, setShowAddFinance] = useState(false)
  const [financeForm, setFinanceForm] = useState({ type: 'income', description: '', amount: '', date: new Date().toISOString().split('T')[0] })

  // Match tab
  const [matches, setMatches] = useState<any[]>([])
  const [showAddMatch, setShowAddMatch] = useState(false)
  const [matchForm, setMatchForm] = useState({ type: 'friendly', opponent: '', venue: '', date: '', notes: '' })

  // Settings tab
  const [settingsForm, setSettingsForm] = useState<any>({})
  const [savingSettings, setSavingSettings] = useState(false)

  // Media / Trophy tab
  const [showAddTrophy, setShowAddTrophy] = useState(false)
  const [trophyForm, setTrophyForm] = useState({
    tournament: '',
    type: 'phong_trao',
    rank: '1',
    year: new Date().getFullYear().toString(),
    organizer: '',
    totalTeams: '',
    notes: '',
  })

  // Alerts
  const [alertMsg, setAlertMsg] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ msg: string; onConfirm: () => void } | null>(null)

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null

  /* ─── Fetch ──────────────────────────── */
  const fetchData = async () => {
    setLoading(true)
    try {
      const resTeam = await axios.get(`${API}/teams/${teamId}`)
      if (resTeam.data.success) {
        const t = resTeam.data.data
        setTeam(t)
        setMembers(t.players || [])
        setSettingsForm({
          name: t.name || '',
          short_name: t.short_name || '',
          leader: t.leader || '',
          phone: t.phone || '',
          area: t.area || '',
          primary_color: t.primary_color || '',
          secondary_color: t.secondary_color || '',
          slogan: t.slogan || '',
          description: t.description || '',
          logo_url: t.logo_url || '',
        })
        setFinances(t.finances || [])
        setMatches(t.matches || [])
      }
    } catch { setMembers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { 
    setMounted(true)
    if (teamId) fetchData() 
    window.scrollTo(0, 0)
  }, [teamId])


  /* ─── Squad actions ──────────────────── */
  const confirmDelete = (id: string) => {
    setConfirmAction({ msg: 'Xác nhận xóa cầu thủ này khỏi đội bóng?', onConfirm: () => executeDelete(id) })
  }

  const executeDelete = async (id: string) => {
    try {
      const token = getToken()
      await axios.delete(`${API}/team-members/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      setAlertMsg('Đã xóa cầu thủ!')
      fetchData()
    } catch { setAlertMsg('Không thể xóa') }
  }

  const handleDownloadSample = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet([
      { HoTen: 'Nguyễn Văn A', SoAo: '10', ViTri: 'Tiền đạo', VaiTro: 'player', NamSinh: '1999', CCCD: '' },
      { HoTen: 'Trần Văn B', SoAo: '1', ViTri: 'Thủ môn', VaiTro: 'captain', NamSinh: '1998', CCCD: '' },
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachCauThu')
    XLSX.writeFile(wb, 'PhuiScore_Mau_DanhSachCauThu.xlsx')
  }

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const XLSX = await import('xlsx')
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws) as any[]
      if (!data.length) { setAlertMsg('File không có dữ liệu hợp lệ'); return }
      const token = getToken(); setLoading(true)
      let added = 0, failed = 0
      for (const row of data) {
        try {
          if (!row.HoTen) continue
          await axios.post(`${API}/team-members`, {
            teamId, name: row.HoTen, shirtNumber: row.SoAo || null,
            position: row.ViTri || 'N/A', role: row.VaiTro || 'player',
            birthYear: row.NamSinh || null, idCard: row.CCCD || null
          }, { headers: { Authorization: `Bearer ${token}` } })
          added++
        } catch { failed++ }
      }
      setAlertMsg(`Nhập thành công: ${added} cầu thủ. Lỗi/Trùng: ${failed}.`)
      fetchData()
    }
    reader.readAsBinaryString(file)
  }

  const handleUploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingAvatarId) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const base64 = evt.target?.result; setLoading(true)
      try {
        const token = getToken()
        const resUp = await axios.post(`${API}/upload/tournament-file`, { base64, filename: file.name, mimeType: file.type })
        if (resUp.data.success) {
          await axios.put(`${API}/team-members/${uploadingAvatarId}`, { avatar: resUp.data.url }, { headers: { Authorization: `Bearer ${token}` } })
          fetchData()
        }
      } catch { setAlertMsg('Lỗi upload ảnh.'); setLoading(false) }
    }
    reader.readAsDataURL(file)
  }

  /* ─── Trophy actions ────────────────── */
  const handleAddTrophy = async () => {
    if (!trophyForm.tournament) { setAlertMsg('Vui lòng nhập tên giải đấu.'); return }
    try {
      const token = getToken()
      const newTrophy = {
        ...trophyForm,
        rank: parseInt(trophyForm.rank),
        totalTeams: trophyForm.totalTeams ? parseInt(trophyForm.totalTeams) : null,
        id: Date.now().toString(),
        addedAt: new Date().toISOString(),
        source: 'manual',
      }
      const current = [...(team?.trophies || []), newTrophy]
      await axios.put(`${API}/teams/${teamId}`, { trophies: current }, { headers: { Authorization: `Bearer ${token}` } })
      setAlertMsg('Đã lưu danh hiệu!')
      setShowAddTrophy(false)
      setTrophyForm({ tournament: '', type: 'phong_trao', rank: '1', year: new Date().getFullYear().toString(), organizer: '', totalTeams: '', notes: '' })
      fetchData()
    } catch { setAlertMsg('Lỗi khi lưu danh hiệu.') }
  }

  const handleDeleteTrophy = (id: string) => {
    setConfirmAction({
      msg: 'Xác nhận xóa danh hiệu này khỏi phòng truyền thống?',
      onConfirm: async () => {
        try {
          const token = getToken()
          const current = (team?.trophies || []).filter((t: any) => t.id !== id)
          await axios.put(`${API}/teams/${teamId}`, { trophies: current }, { headers: { Authorization: `Bearer ${token}` } })
          fetchData()
        } catch { setAlertMsg('Lỗi khi xóa.') }
      }
    })
  }
  const handleAddFinance = async () => {
    if (!financeForm.description || !financeForm.amount) { setAlertMsg('Vui lòng nhập mô tả và số tiền.'); return }
    try {
      const token = getToken()
      const newEntry = { ...financeForm, amount: parseFloat(financeForm.amount), id: Date.now().toString() }
      const current = [...finances, newEntry]
      await axios.put(`${API}/teams/${teamId}`, { finances: current }, { headers: { Authorization: `Bearer ${token}` } })
      setFinances(current)
      setShowAddFinance(false)
      setFinanceForm({ type: 'income', description: '', amount: '', date: new Date().toISOString().split('T')[0] })
      setAlertMsg('Đã ghi nhận giao dịch!')
    } catch { setAlertMsg('Lỗi khi lưu giao dịch.') }
  }

  /* ─── Match actions ──────────────────── */
  const handleAddMatch = async () => {
    if (!matchForm.opponent) { setAlertMsg('Vui lòng nhập tên đội đối thủ.'); return }
    try {
      const token = getToken()
      const newMatch = { ...matchForm, id: Date.now().toString() }
      const current = [...matches, newMatch]
      await axios.put(`${API}/teams/${teamId}`, { matches: current }, { headers: { Authorization: `Bearer ${token}` } })
      setMatches(current)
      setShowAddMatch(false)
      setMatchForm({ type: 'friendly', opponent: '', venue: '', date: '', notes: '' })
      setAlertMsg('Đã thêm lịch thi đấu!')
    } catch { setAlertMsg('Lỗi khi lưu lịch.') }
  }

  /* ─── Settings action ────────────────── */
  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const token = getToken()
      await axios.put(`${API}/teams/${teamId}`, settingsForm, { headers: { Authorization: `Bearer ${token}` } })
      setAlertMsg('Đã lưu thông tin đội!')
    } catch { setAlertMsg('Lỗi khi lưu.') }
    finally { setSavingSettings(false) }
  }

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      setLoading(true)
      try {
        const res = await axios.post(`${API}/upload/tournament-file`, { base64: evt.target?.result, filename: file.name, mimeType: file.type })
        if (res.data.success) setSettingsForm((prev: any) => ({ ...prev, logo_url: res.data.url }))
      } catch { setAlertMsg('Lỗi upload logo.') }
      finally { setLoading(false) }
    }
    reader.readAsDataURL(file)
  }

  const handleUploadGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const token = getToken()
    setLoading(true)
    const uploads = Array.from(files).map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const res = await axios.post(`${API}/upload/tournament-file`, { base64: evt.target?.result, filename: file.name, mimeType: file.type })
          if (res.data.success) resolve(res.data.url); else reject()
        } catch { reject() }
      }
      reader.readAsDataURL(file)
    }))
    Promise.allSettled(uploads).then(async (results) => {
      const newUrls = results.filter(r => r.status === 'fulfilled').map(r => (r as any).value)
      const current = [...(team?.gallery || []), ...newUrls]
      try {
        await axios.put(`${API}/teams/${teamId}`, { gallery: current }, { headers: { Authorization: `Bearer ${token}` } })
        setAlertMsg(`Đã tải lên ${newUrls.length} ảnh!`)
        fetchData()
      } catch { setAlertMsg('Lỗi lưu ảnh.') }
      finally { setLoading(false) }
    })
  }

  /* ─── Derived ─────────────────────────── */
  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    return (m.name?.toLowerCase().includes(q) || String(m.shirtNumber).includes(q)) && (filter === 'all' || m.role === filter)
  })
  const counts = {
    all: members.length,
    captain: members.filter(m => m.role === 'captain' || m.role === 'coach').length,
    coach: 0,
    player: members.filter(m => m.role === 'player').length,
  }
  const totalIncome = finances.filter(f => f.type === 'income').reduce((s, f) => s + (f.amount || 0), 0)
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + (f.amount || 0), 0)

  /* ─── Render ──────────────────────────── */
  if (!mounted) return null
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }` }} />
      <input type="file" id="avatar_upload" accept="image/*" style={{ display: 'none' }} onChange={handleUploadAvatar} />
      <input type="file" id="excel_upload" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportExcel} />
      <input type="file" id="logo_upload" accept="image/*" style={{ display: 'none' }} onChange={handleUploadLogo} />
      <input type="file" id="gallery_upload" accept="image/*" multiple style={{ display: 'none' }} onChange={handleUploadGallery} />

      <View flex={1} backgroundColor={C.bg as any} minHeight="100vh">
        <YStack>
          <YStack maxWidth={1100} marginHorizontal="auto" width="100%" padding="$5" gap="$5">

            {/* ── Breadcrumb ── */}
            <XStack alignItems="center" gap="$2" paddingTop="$2">
              <Link href="/user/my-teams" passHref style={{ textDecoration: 'none' }}>
                <Button size="$2" chromeless icon={<ArrowLeft size={16} color={C.textSub as any} />} pressStyle={{ opacity: 0.7 } as any}>
                  <Text color={C.textSub as any} fontSize={13} fontWeight="600">Danh sách Đội</Text>
                </Button>
              </Link>
              <ChevronRight size={12} color={C.textDim as any} />
              <Text color={C.accent as any} fontSize={13} fontWeight="600">{team?.name || '...'}</Text>
            </XStack>

            {/* ── Page header ── */}
            <XStack gap="$4" alignItems="center">
              <View width={56} height={56} borderRadius={28} overflow="hidden"
                backgroundColor="rgba(255,255,255,0.05)" borderWidth={2} borderColor={C.accentBorder as any}
                alignItems="center" justifyContent="center">
                {team?.logo_url ? <Image src={team.logo_url} width={56} height={56} style={{ objectFit: 'cover' } as any} />
                  : <Shield size={24} color={C.accent as any} />}
              </View>
              <YStack flex={1}>
                <Text color={C.white as any} fontSize={26} fontWeight="900" letterSpacing={-0.5}
                  style={{ fontFamily: "var(--font-barlow-condensed,'Barlow Condensed',sans-serif)" } as any}>
                  {team?.name || 'Đang tải...'}
                </Text>
                <Text color={C.textSub as any} fontSize={13}>{members.length} thành viên · quản lý bởi <Text color={C.accent as any}>{team?.leader}</Text></Text>
              </YStack>
            </XStack>

            {/* ── Navigation Tabs ── */}
            <YStack borderBottomWidth={1} borderColor={C.cardBorder as any}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <XStack gap="$4" paddingBottom="$0">
                  {MANAGE_TABS.map(tab => {
                    const isActive = activeTab === tab.id
                    return (
                      <View key={tab.id} paddingBottom="$3" borderBottomWidth={3} borderColor={isActive ? C.accent : 'transparent' as any}
                        onPress={() => setActiveTab(tab.id)} cursor="pointer" style={{ transition: 'all 0.15s' } as any}>
                        <Text color={isActive ? C.accent : C.textSub as any} fontSize={14} fontWeight={isActive ? '800' : '600'}>{tab.label}</Text>
                      </View>
                    )
                  })}
                </XStack>
              </ScrollView>
            </YStack>

            {/* ══════════════════════════════
                TAB: SQUAD (QUÂN SỐ)
            ══════════════════════════════ */}
            {activeTab === 'squad' && (
              <YStack gap="$5">
                {/* Header */}
                <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$3">
                  <XStack gap="$3" flexWrap="wrap">
                    {[
                      { label: 'Tổng quân số', value: counts.all, color: C.accent, icon: '👥' },
                      { label: 'Cầu thủ', value: counts.player, color: C.text, icon: '⚽' },
                      { label: 'Ban cán sự', value: counts.captain, color: C.gold, icon: '⭐' },
                    ].map(s => (
                      <View key={s.label} padding="$4" flex={1} minWidth={110} backgroundColor={C.surface as any}
                        borderRadius={14} borderWidth={1} borderColor={C.cardBorder as any}>
                        <XStack justifyContent="space-between" alignItems="flex-start">
                          <YStack>
                            <Text color={s.color as any} fontSize={28} fontWeight="900">{s.value}</Text>
                            <Text color={C.textSub as any} fontSize={12} fontWeight="600">{s.label}</Text>
                          </YStack>
                          <Text fontSize={22}>{s.icon}</Text>
                        </XStack>
                      </View>
                    ))}
                  </XStack>
                  <XStack gap="$2" flexWrap="wrap">
                    <Button size="$3" backgroundColor={C.surface as any} borderWidth={1} borderColor={C.cardBorder as any}
                      borderRadius={10} icon={<Download size={15} color={C.textSub as any} />} onPress={handleDownloadSample}>
                      <Text color={C.textSub as any} fontSize={13} fontWeight="600">Tải mẫu</Text>
                    </Button>
                    <Button size="$3" backgroundColor={C.surface as any} borderWidth={1} borderColor={C.cardBorder as any}
                      borderRadius={10} icon={<FileSpreadsheet size={15} color={C.textSub as any} />}
                      onPress={() => document.getElementById('excel_upload')?.click()}>
                      <Text color={C.textSub as any} fontSize={13} fontWeight="600">Import Excel</Text>
                    </Button>
                    <Button size="$3" backgroundColor={C.accent as any} borderRadius={10} onPress={() => setAddOpen(true)}
                      icon={<Plus size={16} color={C.bg as any} />} style={{ boxShadow: C.accentGlow } as any}>
                      <Text color={C.bg as any} fontWeight="900" fontSize={13}>Thêm cầu thủ</Text>
                    </Button>
                  </XStack>
                </XStack>

                {/* Search + filter */}
                <XStack gap="$3" flexWrap="wrap" alignItems="center">
                  <XStack flex={1} minWidth={200} backgroundColor={C.surface as any} borderWidth={1} borderColor={C.cardBorder as any}
                    borderRadius={12} alignItems="center" paddingHorizontal="$3">
                    <Search size={16} color={C.textDim as any} />
                    <Input unstyled flex={1} color={C.text as any} fontSize={14} paddingVertical="$3" paddingLeft="$2"
                      placeholderTextColor={C.textDim as any} placeholder="Tìm tên hoặc số áo..." value={search} onChangeText={setSearch} />
                    {!!search && <Button size="$2" chromeless onPress={() => setSearch('')}><Text color={C.textSub as any}>✕</Text></Button>}
                  </XStack>
                  <XStack gap="$1" backgroundColor={C.surface as any} padding="$1" borderRadius={12} borderWidth={1} borderColor={C.cardBorder as any}>
                    <FilterTab label="Tất cả" active={filter === 'all'} count={counts.all} onPress={() => setFilter('all')} />
                    <FilterTab label="Ban cán sự" active={filter === 'captain'} count={counts.captain} onPress={() => setFilter('captain')} />
                    <FilterTab label="Cầu thủ" active={filter === 'player'} count={counts.player} onPress={() => setFilter('player')} />
                  </XStack>
                </XStack>

                {/* Player grid */}
                {loading ? (
                  <YStack alignItems="center" paddingVertical="$12"><Spinner size="large" color={C.accent as any} /></YStack>
                ) : filtered.length === 0 ? (
                  <YStack alignItems="center" paddingVertical="$10" gap="$4">
                    <View width={80} height={80} borderRadius={40} backgroundColor={C.accentDim as any} borderWidth={1}
                      borderColor={C.accentBorder as any} alignItems="center" justifyContent="center">
                      <Users size={32} color={C.accent as any} />
                    </View>
                    <Text color={C.text as any} fontSize={16} fontWeight="700">
                      {search ? `Không tìm thấy "${search}"` : 'Chưa có cầu thủ nào'}
                    </Text>
                    {!search && <Button size="$4" backgroundColor={C.accent as any} borderRadius={12} onPress={() => setAddOpen(true)} icon={<Plus color={C.bg as any} size={18} />}>
                      <Text color={C.bg as any} fontWeight="900" fontSize={14}>Thêm cầu thủ đầu tiên</Text>
                    </Button>}
                  </YStack>
                ) : (
                  <View style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 } as any}>
                    {filtered.map((m, i) => (
                      <PlayerCard key={m.id || m._id} member={m} index={i}
                        onEdit={(mb: any) => setEditMember(mb)}
                        onDelete={confirmDelete}
                        onUploadAvatar={(id: string) => { setUploadingAvatarId(id); document.getElementById('avatar_upload')?.click() }}
                      />
                    ))}
                  </View>
                )}
              </YStack>
            )}

            {/* ══════════════════════════════
                TAB: MATCHES (LỊCH THI ĐẤU)
            ══════════════════════════════ */}
            {activeTab === 'matches' && (
              <YStack gap="$5">
                <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
                  <YStack>
                    <Text color={C.white as any} fontSize={20} fontWeight="900">Lịch thi đấu & Kết quả</Text>
                    <Text color={C.textSub as any} fontSize={13}>{matches.length} trận đã lên lịch</Text>
                  </YStack>
                  <Button size="$3" backgroundColor={C.accent as any} borderRadius={10}
                    icon={<Plus size={16} color={C.bg as any} />} onPress={() => setShowAddMatch(true)}
                    style={{ boxShadow: C.accentGlow } as any}>
                    <Text color={C.bg as any} fontWeight="900" fontSize={13}>Thêm trận đấu</Text>
                  </Button>
                </XStack>

                {/* Add match form */}
                {showAddMatch && (
                  <YStack backgroundColor={C.surface as any} borderRadius={16} borderWidth={1} borderColor={C.accentBorder as any} padding="$5" gap="$4">
                    <Text color={C.text as any} fontSize={16} fontWeight="800">📅 Thêm Lịch Thi Đấu</Text>
                    <XStack gap="$3" flexWrap="wrap">
                      <YStack flex={1} minWidth={200} gap="$2">
                        <Text color={C.textSub as any} fontSize={13} fontWeight="600">Loại trận</Text>
                        <XStack gap="$2">
                          {[{ v: 'friendly', l: '⚽ Giao hữu' }, { v: 'tournament', l: '🏆 Giải đấu' }].map(opt => (
                            <Button key={opt.v} size="$3" flex={1}
                              backgroundColor={matchForm.type === opt.v ? C.accentDim as any : 'transparent'}
                              borderWidth={1} borderColor={matchForm.type === opt.v ? C.accentBorder as any : C.cardBorder as any}
                              borderRadius={8} onPress={() => setMatchForm(p => ({ ...p, type: opt.v }))}>
                              <Text color={matchForm.type === opt.v ? C.accent as any : C.textSub as any} fontSize={13} fontWeight="700">{opt.l}</Text>
                            </Button>
                          ))}
                        </XStack>
                      </YStack>
                      <YStack flex={1} minWidth={200} gap="$2">
                        <Text color={C.textSub as any} fontSize={13} fontWeight="600">Ngày thi đấu</Text>
                        <input type="date" value={matchForm.date}
                          onChange={e => setMatchForm(p => ({ ...p, date: e.target.value }))}
                          style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.text, padding: '10px 12px', borderRadius: 8, fontSize: 14, width: '100%' }} />
                      </YStack>
                    </XStack>
                    <XStack gap="$3" flexWrap="wrap">
                      <YStack flex={1} minWidth={200} gap="$2">
                        <Text color={C.textSub as any} fontSize={13} fontWeight="600">Đội đối thủ *</Text>
                        <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                          placeholder="Tên đội đối thủ" placeholderTextColor={C.textDim as any}
                          value={matchForm.opponent} onChangeText={v => setMatchForm(p => ({ ...p, opponent: v }))} />
                      </YStack>
                      <YStack flex={1} minWidth={200} gap="$2">
                        <Text color={C.textSub as any} fontSize={13} fontWeight="600">Địa điểm / Sân</Text>
                        <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                          placeholder="VD: Sân Thống Nhất" placeholderTextColor={C.textDim as any}
                          value={matchForm.venue} onChangeText={v => setMatchForm(p => ({ ...p, venue: v }))} />
                      </YStack>
                    </XStack>
                    <XStack gap="$3" justifyContent="flex-end">
                      <Button size="$3" backgroundColor="transparent" borderWidth={1} borderColor={C.cardBorder as any} borderRadius={8}
                        onPress={() => setShowAddMatch(false)}>
                        <Text color={C.textSub as any} fontWeight="700">Hủy</Text>
                      </Button>
                      <Button size="$3" backgroundColor={C.accent as any} borderRadius={8} icon={<Save size={14} color={C.bg as any} />} onPress={handleAddMatch}>
                        <Text color={C.bg as any} fontWeight="900">Lưu lịch</Text>
                      </Button>
                    </XStack>
                  </YStack>
                )}

                {/* Match list */}
                {matches.length === 0 ? (
                  <YStack alignItems="center" paddingVertical="$10" gap="$3">
                    <Text fontSize={48}>⚽</Text>
                    <Text color={C.text as any} fontSize={16} fontWeight="700">Chưa có lịch thi đấu</Text>
                    <Text color={C.textSub as any} fontSize={14} textAlign="center">Thêm trận giao hữu hoặc lịch giải đấu để theo dõi kết quả</Text>
                  </YStack>
                ) : (
                  <YStack gap="$3">
                    {matches.map(m => <MatchRow key={m.id} match={m} />)}
                  </YStack>
                )}
              </YStack>
            )}

            {/* ══════════════════════════════
                TAB: FINANCE (TÀI CHÍNH)
            ══════════════════════════════ */}
            {activeTab === 'finance' && (
              <YStack gap="$5">
                {/* Summary cards */}
                <XStack gap="$3" flexWrap="wrap">
                  {[
                    { label: 'Tổng Thu', value: totalIncome, color: C.accent, bg: C.accentDim, icon: '💰' },
                    { label: 'Tổng Chi', value: totalExpense, color: C.red, bg: C.redDim, icon: '📤' },
                    { label: 'Số dư Quỹ', value: totalIncome - totalExpense, color: totalIncome - totalExpense >= 0 ? C.accent : C.red, bg: 'rgba(255,255,255,0.04)', icon: '🏦' },
                  ].map(s => (
                    <View key={s.label} flex={1} minWidth={150} padding="$4" borderRadius={16}
                      backgroundColor={s.bg as any} borderWidth={1} borderColor={C.cardBorder as any}>
                      <Text fontSize={28}>{s.icon}</Text>
                      <Text color={s.color as any} fontSize={24} fontWeight="900" marginTop="$2">
                        {(s.value || 0).toLocaleString('vi-VN')}đ
                      </Text>
                      <Text color={C.textSub as any} fontSize={12} fontWeight="600">{s.label}</Text>
                    </View>
                  ))}
                </XStack>

                <XStack justifyContent="space-between" alignItems="center">
                  <Text color={C.white as any} fontSize={18} fontWeight="800">Lịch sử Giao dịch</Text>
                  <Button size="$3" backgroundColor={C.accent as any} borderRadius={10}
                    icon={<Plus size={15} color={C.bg as any} />} onPress={() => setShowAddFinance(true)}>
                    <Text color={C.bg as any} fontWeight="900" fontSize={13}>Ghi giao dịch</Text>
                  </Button>
                </XStack>

                {/* Add finance form */}
                {showAddFinance && (
                  <YStack backgroundColor={C.surface as any} borderRadius={16} borderWidth={1} borderColor={C.accentBorder as any} padding="$5" gap="$4">
                    <Text color={C.text as any} fontSize={16} fontWeight="800">💳 Ghi nhận Giao dịch</Text>
                    <XStack gap="$3" flexWrap="wrap">
                      <YStack flex={1} minWidth={180} gap="$2">
                        <Text color={C.textSub as any} fontSize={13} fontWeight="600">Loại</Text>
                        <XStack gap="$2">
                          {[{ v: 'income', l: '💰 Thu', c: C.accent }, { v: 'expense', l: '📤 Chi', c: C.red }].map(opt => (
                            <Button key={opt.v} size="$3" flex={1}
                              backgroundColor={financeForm.type === opt.v ? `${opt.c}22` : 'transparent'}
                              borderWidth={1} borderColor={financeForm.type === opt.v ? opt.c : C.cardBorder as any}
                              borderRadius={8} onPress={() => setFinanceForm(p => ({ ...p, type: opt.v }))}>
                              <Text color={financeForm.type === opt.v ? opt.c as any : C.textSub as any} fontWeight="700" fontSize={13}>{opt.l}</Text>
                            </Button>
                          ))}
                        </XStack>
                      </YStack>
                      <YStack flex={1} minWidth={180} gap="$2">
                        <Text color={C.textSub as any} fontSize={13} fontWeight="600">Ngày</Text>
                        <input type="date" value={financeForm.date}
                          onChange={e => setFinanceForm(p => ({ ...p, date: e.target.value }))}
                          style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.text, padding: '10px 12px', borderRadius: 8, fontSize: 14, width: '100%' }} />
                      </YStack>
                    </XStack>
                    <YStack gap="$2">
                      <Text color={C.textSub as any} fontSize={13} fontWeight="600">Mô tả *</Text>
                      <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                        placeholder="VD: Tiền phí sân tháng 3, Đóng quỹ tháng 3..." placeholderTextColor={C.textDim as any}
                        value={financeForm.description} onChangeText={v => setFinanceForm(p => ({ ...p, description: v }))} />
                    </YStack>
                    <YStack gap="$2">
                      <Text color={C.textSub as any} fontSize={13} fontWeight="600">Số tiền (VNĐ) *</Text>
                      <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                        placeholder="VD: 500000" placeholderTextColor={C.textDim as any} keyboardType="numeric"
                        value={financeForm.amount} onChangeText={v => setFinanceForm(p => ({ ...p, amount: v }))} />
                    </YStack>
                    <XStack gap="$3" justifyContent="flex-end">
                      <Button size="$3" backgroundColor="transparent" borderWidth={1} borderColor={C.cardBorder as any} borderRadius={8} onPress={() => setShowAddFinance(false)}>
                        <Text color={C.textSub as any} fontWeight="700">Hủy</Text>
                      </Button>
                      <Button size="$3" backgroundColor={C.accent as any} borderRadius={8} icon={<Save size={14} color={C.bg as any} />} onPress={handleAddFinance}>
                        <Text color={C.bg as any} fontWeight="900">Lưu</Text>
                      </Button>
                    </XStack>
                  </YStack>
                )}

                {finances.length === 0 ? (
                  <YStack alignItems="center" paddingVertical="$10" gap="$3">
                    <Text fontSize={48}>💰</Text>
                    <Text color={C.text as any} fontSize={16} fontWeight="700">Chưa có giao dịch nào</Text>
                    <Text color={C.textSub as any} fontSize={14}>Ghi lại các khoản thu chi để quản lý quỹ đội hiệu quả</Text>
                  </YStack>
                ) : (
                  <YStack gap="$2">{finances.map(f => <FinanceRow key={f.id} item={f} />)}</YStack>
                )}
              </YStack>
            )}

            {/* ══════════════════════════════
                TAB: MEDIA (THÀNH TÍCH & MEDIA)
            ══════════════════════════════ */}
            {activeTab === 'media' && (
              <YStack gap="$5">

                {/* ── TROPHY ROOM ── */}
              <YStack gap="$4">
                  <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
                    <YStack>
                      <Text color={C.white as any} fontSize={20} fontWeight="900">🏆 Phòng Truyền thống</Text>
                      <Text color={C.textSub as any} fontSize={13}>{(team?.trophies || []).length} danh hiệu đã đoạt được</Text>
                    </YStack>
                    <Button size="$3" backgroundColor={C.accent as any} borderRadius={10}
                      icon={<Plus size={16} color={C.bg as any} />}
                      onPress={() => setShowAddTrophy(v => !v)}
                      style={{ boxShadow: C.accentGlow } as any}>
                      <Text color={C.bg as any} fontWeight="900" fontSize={13}>{showAddTrophy ? 'Hủy' : 'Thêm danh hiệu'}</Text>
                    </Button>
                  </XStack>

                  {/* ── ADD TROPHY FORM ── */}
                  {showAddTrophy && (
                    <YStack backgroundColor={C.surface as any} borderRadius={16} borderWidth={1}
                      borderColor={C.accentBorder as any} padding="$5" gap="$4"
                      style={{ animationName: 'fadeSlideUp', animationDuration: '0.25s' } as any}>
                      <Text color={C.text as any} fontSize={16} fontWeight="900">🏅 Ghi nhận Danh hiệu</Text>

                      {/* Row 1: Ten giai - Loai giai */}
                      <XStack gap="$4" flexWrap="wrap">
                        <YStack flex={1} minWidth={220} gap="$2">
                          <Text color={C.textSub as any} fontSize={13} fontWeight="600">Tên giải đấu *</Text>
                          <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any}
                            color={C.text as any} placeholder="VD: Cup Cúp Phù Đổng 2024"
                            placeholderTextColor={C.textDim as any}
                            value={trophyForm.tournament} onChangeText={v => setTrophyForm(p => ({ ...p, tournament: v }))} />
                        </YStack>
                        <YStack flex={1} minWidth={180} gap="$2">
                          <Text color={C.textSub as any} fontSize={13} fontWeight="600">Loại giải</Text>
                          <XStack gap="$2" flexWrap="wrap">
                            {[
                              { v: 'phong_trao', l: '🎮 Phong trào' },
                              { v: 'lien_quan', l: '🏙️ Liên quận' },
                              { v: 'thanh_pho', l: '🏙️ Thành phố' },
                              { v: 'quoc_gia', l: '🇺🇳 Quốc gia' },
                            ].map(opt => (
                              <Button key={opt.v} size="$2"
                                backgroundColor={trophyForm.type === opt.v ? C.accentDim as any : 'transparent'}
                                borderWidth={1} borderColor={trophyForm.type === opt.v ? C.accentBorder as any : C.cardBorder as any}
                                borderRadius={8} onPress={() => setTrophyForm(p => ({ ...p, type: opt.v }))}>
                                <Text color={trophyForm.type === opt.v ? C.accent as any : C.textSub as any} fontSize={12} fontWeight="700">{opt.l}</Text>
                              </Button>
                            ))}
                          </XStack>
                        </YStack>
                      </XStack>

                      {/* Row 2: Hang dat - Nam */}
                      <XStack gap="$4" flexWrap="wrap">
                        <YStack flex={1} minWidth={180} gap="$2">
                          <Text color={C.textSub as any} fontSize={13} fontWeight="600">Hạng đạt được *</Text>
                          <XStack gap="$2">
                            {[{v:'1', l:'🥇 Vô địch'}, {v:'2', l:'🥈 Á quân'}, {v:'3', l:'🥉 Hạng Ba'}, {v:'4', l:'🙌 Top 4/8'}].map(opt => (
                              <Button key={opt.v} size="$2" flex={1}
                                backgroundColor={trophyForm.rank === opt.v ? `${opt.v==='1' ? C.gold : opt.v==='2' ? '#ccc' : opt.v==='3' ? '#cd7f32' : C.textSub}22` : 'transparent'}
                                borderWidth={1} borderColor={trophyForm.rank === opt.v ? (opt.v==='1' ? C.gold : opt.v==='2' ? '#ccc' : opt.v==='3' ? '#cd7f32' : C.textSub) : C.cardBorder as any}
                                borderRadius={8} onPress={() => setTrophyForm(p => ({ ...p, rank: opt.v }))}>
                                <Text fontSize={11} fontWeight="700"
                                  color={trophyForm.rank === opt.v ? (opt.v==='1' ? C.gold : opt.v==='2' ? '#ccc' : '#cd7f32') as any : C.textSub as any}>
                                  {opt.l}
                                </Text>
                              </Button>
                            ))}
                          </XStack>
                        </YStack>
                        <YStack flex={1} minWidth={120} gap="$2">
                          <Text color={C.textSub as any} fontSize={13} fontWeight="600">Năm đoạt giải</Text>
                          <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any}
                            color={C.text as any} keyboardType="numeric" maxLength={4}
                            value={trophyForm.year} onChangeText={v => setTrophyForm(p => ({ ...p, year: v }))} />
                        </YStack>
                      </XStack>

                      {/* Row 3: Don vi to chuc - So doi */}
                      <XStack gap="$4" flexWrap="wrap">
                        <YStack flex={1} minWidth={220} gap="$2">
                          <Text color={C.textSub as any} fontSize={13} fontWeight="600">Đơn vị tổ chức</Text>
                          <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any}
                            color={C.text as any} placeholder="VD: UBND Q. Tân Bình, Công ty XYZ..."
                            placeholderTextColor={C.textDim as any}
                            value={trophyForm.organizer} onChangeText={v => setTrophyForm(p => ({ ...p, organizer: v }))} />
                        </YStack>
                        <YStack flex={1} minWidth={130} gap="$2">
                          <Text color={C.textSub as any} fontSize={13} fontWeight="600">Số đội tham dự</Text>
                          <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any}
                            color={C.text as any} placeholder="VD: 16" keyboardType="numeric"
                            placeholderTextColor={C.textDim as any}
                            value={trophyForm.totalTeams} onChangeText={v => setTrophyForm(p => ({ ...p, totalTeams: v }))} />
                        </YStack>
                      </XStack>

                      {/* Notes */}
                      <YStack gap="$2">
                        <Text color={C.textSub as any} fontSize={13} fontWeight="600">Ghi chú thêm</Text>
                        <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any}
                          color={C.text as any} placeholder="VD: Tổ chức vào tháng 12, ghi được 24 bàn thắng..."
                          placeholderTextColor={C.textDim as any}
                          value={trophyForm.notes} onChangeText={v => setTrophyForm(p => ({ ...p, notes: v }))} />
                      </YStack>

                      <XStack gap="$3" justifyContent="flex-end">
                        <Button size="$3" backgroundColor="transparent" borderWidth={1} borderColor={C.cardBorder as any}
                          borderRadius={8} onPress={() => setShowAddTrophy(false)}>
                          <Text color={C.textSub as any} fontWeight="700">Hủy</Text>
                        </Button>
                        <Button size="$3" backgroundColor={C.gold as any} borderRadius={8}
                          icon={<Save size={14} color="#000" />} onPress={handleAddTrophy}>
                          <Text color="#000" fontWeight="900">🏆 Lưu Danh hiệu</Text>
                        </Button>
                      </XStack>
                    </YStack>
                  )}

                  {/* ── TROPHY LIST ── */}
                  {(team?.trophies || []).length === 0 && !showAddTrophy ? (
                    <YStack alignItems="center" paddingVertical="$10" gap="$3"
                      backgroundColor="rgba(255,255,255,0.02)" borderRadius={16} borderWidth={1}
                      borderColor={C.cardBorder as any} style={{ borderStyle: 'dashed' } as any}
                      cursor="pointer" onPress={() => setShowAddTrophy(true)}>
                      <Text fontSize={52}>🏆</Text>
                      <Text color={C.text as any} fontSize={16} fontWeight="700">Phòng truyền thống trống</Text>
                      <Text color={C.textSub as any} fontSize={13} textAlign="center" maxWidth={320}>
                        Nhấn để ghi nhận danh hiệu đầu tiên của đội!
                      </Text>
                    </YStack>
                  ) : (
                    <View style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 } as any}>
                      {(team?.trophies || []).map((t: any) => {
                        const medal = t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : '🏦'
                        const rankLabel = t.rank === 1 ? 'Vô địch' : t.rank === 2 ? 'Á quân' : t.rank === 3 ? 'Hạng Ba' : 'Top 4+'
                        const typeLabel: Record<string,string> = { phong_trao: 'Phong trào', lien_quan: 'Liên quận', thanh_pho: 'Thành phố', quoc_gia: 'Quốc gia' }
                        return (
                          <YStack key={t.id} backgroundColor={C.surface as any} borderRadius={16} borderWidth={1}
                            borderColor={t.rank === 1 ? 'rgba(255,196,0,0.4)' : t.rank === 2 ? 'rgba(200,200,200,0.3)' : 'rgba(205,127,50,0.3)'}
                            padding="$4" gap="$3"
                            style={{ boxShadow: t.rank === 1 ? '0 0 20px rgba(255,196,0,0.12)' : 'none' } as any}>

                            {/* Top row: medal + name + delete */}
                            <XStack alignItems="flex-start" gap="$3">
                              <Text fontSize={36}>{medal}</Text>
                              <YStack flex={1}>
                                <Text color={C.text as any} fontSize={15} fontWeight="900" numberOfLines={2}>{t.tournament}</Text>
                                <Text color={C.textSub as any} fontSize={12} marginTop={2}>{t.year} • {typeLabel[t.type] || t.type}</Text>
                              </YStack>
                              <Button size="$1" chromeless onPress={() => handleDeleteTrophy(t.id)}
                                pressStyle={{ opacity: 0.6 } as any}>
                                <Trash2 size={14} color={C.textDim as any} />
                              </Button>
                            </XStack>

                            {/* Tags */}
                            <XStack gap="$2" flexWrap="wrap">
                              <YStack paddingHorizontal="$2" paddingVertical={3} borderRadius={20}
                                backgroundColor={t.rank===1 ? 'rgba(255,196,0,0.12)' : t.rank===2 ? 'rgba(200,200,200,0.08)' : 'rgba(205,127,50,0.1)'}>
                                <Text color={t.rank===1 ? C.gold : t.rank===2 ? '#ccc' : '#cd7f32' as any} fontSize={11} fontWeight="800">🏆 {rankLabel}</Text>
                              </YStack>
                              {t.totalTeams && (
                                <YStack paddingHorizontal="$2" paddingVertical={3} borderRadius={20} backgroundColor="rgba(255,255,255,0.05)">
                                  <Text color={C.textSub as any} fontSize={11} fontWeight="700">👥 {t.totalTeams} đội</Text>
                                </YStack>
                              )}
                              {t.source === 'manual' && (
                                <YStack paddingHorizontal="$2" paddingVertical={3} borderRadius={20} backgroundColor="rgba(255,255,255,0.04)">
                                  <Text color={C.textDim as any} fontSize={10}>✍️ Thủ công</Text>
                                </YStack>
                              )}
                            </XStack>

                            {/* Organizer + Notes */}
                            {t.organizer && (
                              <Text color={C.textSub as any} fontSize={12}>🏙️ {t.organizer}</Text>
                            )}
                            {t.notes && (
                              <Text color="#aaa" fontSize={12} fontStyle="italic" numberOfLines={2}>{t.notes}</Text>
                            )}
                          </YStack>
                        )
                      })}
                    </View>
                  )}
                </YStack>

                {/* ── PHOTO GALLERY ── */}
                <YStack gap="$4">
                  <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
                    <YStack>
                      <Text color={C.white as any} fontSize={20} fontWeight="900">📸 Thư viện Ảnh</Text>
                      <Text color={C.textSub as any} fontSize={13}>{(team?.gallery || []).length} ảnh đã đăng</Text>
                    </YStack>
                    <Button size="$3" backgroundColor={C.surface as any} borderWidth={1} borderColor={C.cardBorder as any}
                      borderRadius={10} icon={<Upload size={15} color={C.textSub as any} />}
                      onPress={() => document.getElementById('gallery_upload')?.click()}>
                      <Text color={C.textSub as any} fontSize={13} fontWeight="600">Tải ảnh lên</Text>
                    </Button>
                  </XStack>

                  {(team?.gallery || []).length === 0 ? (
                    <YStack alignItems="center" paddingVertical="$10" gap="$3"
                      backgroundColor="rgba(255,255,255,0.02)" borderRadius={16} borderWidth={1}
                      borderColor={C.cardBorder as any} style={{ borderStyle: 'dashed' } as any}
                      cursor="pointer" onPress={() => document.getElementById('gallery_upload')?.click()}>
                      <Text fontSize={52}>📷</Text>
                      <Text color={C.text as any} fontSize={16} fontWeight="700">Chưa có ảnh nào</Text>
                      <Text color={C.textSub as any} fontSize={13}>
                        Nhấn để tải ảnh tập thể, khoảnh khắc thi đấu lên thư viện đội
                      </Text>
                    </YStack>
                  ) : (
                    <View style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 } as any}>
                      {(team?.gallery || []).map((url: string, i: number) => (
                        <View key={i} borderRadius={12} overflow="hidden" style={{ aspectRatio: '1', position: 'relative' } as any}>
                          <Image src={url} width="100%" height="100%" style={{ objectFit: 'cover' } as any} />
                        </View>
                      ))}
                    </View>
                  )}
                </YStack>

              </YStack>
            )}

            {/* ══════════════════════════════
                TAB: SETTINGS (CÀI ĐẶT ĐỘI)
            ══════════════════════════════ */}
            {activeTab === 'settings' && (
              <YStack gap="$6">

                {/* Logo */}
                <YStack backgroundColor={C.surface as any} borderRadius={16} borderWidth={1} borderColor={C.cardBorder as any} padding="$5" gap="$4">
                  <Text color={C.white as any} fontSize={16} fontWeight="800">🖼️ Logo / Huy hiệu đội</Text>
                  <XStack gap="$5" alignItems="center" flexWrap="wrap">
                    <View width={100} height={100} borderRadius={50} overflow="hidden"
                      backgroundColor="rgba(255,255,255,0.05)" borderWidth={2} borderColor={C.accentBorder as any}
                      alignItems="center" justifyContent="center">
                      {settingsForm.logo_url
                        ? <Image src={settingsForm.logo_url} width={100} height={100} style={{ objectFit: 'cover' } as any} />
                        : <Shield size={40} color={C.accent as any} />}
                    </View>
                    <Button size="$3" backgroundColor={C.surface as any} borderWidth={1} borderColor={C.cardBorder as any}
                      borderRadius={10} icon={<Upload size={15} color={C.textSub as any} />}
                      onPress={() => document.getElementById('logo_upload')?.click()}>
                      <Text color={C.textSub as any} fontSize={13} fontWeight="600">Tải Logo mới</Text>
                    </Button>
                  </XStack>
                </YStack>

                {/* Basic info */}
                <YStack backgroundColor={C.surface as any} borderRadius={16} borderWidth={1} borderColor={C.cardBorder as any} padding="$5" gap="$4">
                  <Text color={C.white as any} fontSize={16} fontWeight="800">📋 Thông tin cơ bản</Text>
                  <XStack gap="$4" flexWrap="wrap">
                    <YStack flex={1} minWidth={220} gap="$2">
                      <Text color={C.textSub as any} fontSize={13} fontWeight="600">Tên đội đầy đủ *</Text>
                      <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                        value={settingsForm.name} onChangeText={v => setSettingsForm((p: any) => ({ ...p, name: v }))} />
                    </YStack>
                    <YStack flex={1} minWidth={150} gap="$2">
                      <Text color={C.textSub as any} fontSize={13} fontWeight="600">Tên viết tắt</Text>
                      <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                        maxLength={8} value={settingsForm.short_name} onChangeText={v => setSettingsForm((p: any) => ({ ...p, short_name: v.toUpperCase() }))} />
                    </YStack>
                  </XStack>
                  <XStack gap="$4" flexWrap="wrap">
                    <YStack flex={1} minWidth={220} gap="$2">
                      <Text color={C.textSub as any} fontSize={13} fontWeight="600">Quản lý / HLV *</Text>
                      <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                        value={settingsForm.leader} onChangeText={v => setSettingsForm((p: any) => ({ ...p, leader: v }))} />
                    </YStack>
                    <YStack flex={1} minWidth={180} gap="$2">
                      <Text color={C.textSub as any} fontSize={13} fontWeight="600">SĐT Liên hệ</Text>
                      <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                        keyboardType="phone-pad" value={settingsForm.phone} onChangeText={v => setSettingsForm((p: any) => ({ ...p, phone: v }))} />
                    </YStack>
                  </XStack>
                  <YStack gap="$2">
                    <Text color={C.textSub as any} fontSize={13} fontWeight="600">Khu vực hoạt động</Text>
                    <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                      placeholder="VD: Tân Bình, TP.HCM" value={settingsForm.area} onChangeText={v => setSettingsForm((p: any) => ({ ...p, area: v }))} />
                  </YStack>
                </YStack>

                {/* Appearance */}
                <YStack backgroundColor={C.surface as any} borderRadius={16} borderWidth={1} borderColor={C.cardBorder as any} padding="$5" gap="$4">
                  <Text color={C.white as any} fontSize={16} fontWeight="800">🎨 Hình ảnh & Slogan</Text>
                  <XStack gap="$4" flexWrap="wrap">
                    <YStack flex={1} minWidth={180} gap="$2">
                      <Text color={C.textSub as any} fontSize={13} fontWeight="600">Màu áo chính</Text>
                      <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                        placeholder="VD: Xanh, Đỏ..." value={settingsForm.primary_color} onChangeText={v => setSettingsForm((p: any) => ({ ...p, primary_color: v }))} />
                    </YStack>
                    <YStack flex={1} minWidth={180} gap="$2">
                      <Text color={C.textSub as any} fontSize={13} fontWeight="600">Màu áo phụ</Text>
                      <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                        placeholder="VD: Trắng, Vàng..." value={settingsForm.secondary_color} onChangeText={v => setSettingsForm((p: any) => ({ ...p, secondary_color: v }))} />
                    </YStack>
                  </XStack>
                  <YStack gap="$2">
                    <Text color={C.textSub as any} fontSize={13} fontWeight="600">Slogan / Khẩu hiệu</Text>
                    <Input backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                      placeholder="Ra sân là để cống hiến..." value={settingsForm.slogan} onChangeText={v => setSettingsForm((p: any) => ({ ...p, slogan: v }))} />
                  </YStack>
                  <YStack gap="$2">
                    <Text color={C.textSub as any} fontSize={13} fontWeight="600">Giới thiệu đội bóng</Text>
                    <TextArea backgroundColor={C.card as any} borderWidth={1} borderColor={C.cardBorder as any} color={C.text as any}
                      rows={4} placeholder="Mô tả lịch sử, định hướng và phong cách thi đấu của đội..."
                      value={settingsForm.description} onChangeText={v => setSettingsForm((p: any) => ({ ...p, description: v }))} />
                  </YStack>
                </YStack>

                {/* Save button */}
                <Button size="$5" backgroundColor={C.accent as any} borderRadius={12} onPress={handleSaveSettings}
                  disabled={savingSettings} opacity={savingSettings ? 0.7 : 1}
                  icon={savingSettings ? <Spinner color={C.bg as any} /> : <Save size={18} color={C.bg as any} />}
                  style={{ boxShadow: C.accentGlow } as any}>
                  <Text color={C.bg as any} fontWeight="900" fontSize={16}>{savingSettings ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}</Text>
                </Button>
              </YStack>
            )}

            <View height={40} />
          </YStack>
        </YStack>
      </View>

      {/* ── Modals ── */}
      {teamId && <AddMemberModal open={addOpen} setOpen={setAddOpen} teamId={teamId as string} onSuccess={fetchData} />}
      {teamId && <EditMemberModal open={!!editMember} setOpen={(o) => !o && setEditMember(null)}
        member={editMember} teamId={teamId as string} onSuccess={fetchData} onAlert={setAlertMsg} />}

      <Sheet modal open={!!alertMsg} onOpenChange={() => setAlertMsg('')} snapPoints={[30]} dismissOnSnapToBottom position={0}>
        <Sheet.Overlay backgroundColor="rgba(0,0,0,0.85)" />
        <Sheet.Frame backgroundColor={C.card as any} padding="$5" borderTopLeftRadius={24} borderTopRightRadius={24} alignItems="center" justifyContent="center">
          <YStack gap="$4" alignItems="center">
            <Text color={C.white as any} fontSize={16} fontWeight="700" textAlign="center">{alertMsg}</Text>
            <Button backgroundColor={C.accent as any} onPress={() => setAlertMsg('')} width={120} borderRadius={10}>
              <Text color={C.bg as any} fontWeight="900">ĐÓNG</Text>
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      <Sheet modal open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)} snapPoints={[30]} dismissOnSnapToBottom position={0}>
        <Sheet.Overlay backgroundColor="rgba(0,0,0,0.85)" />
        <Sheet.Frame backgroundColor={C.card as any} padding="$5" borderTopLeftRadius={24} borderTopRightRadius={24} alignItems="center" justifyContent="center">
          <YStack gap="$5" alignItems="center" width="100%">
            <Text color={C.white as any} fontSize={16} fontWeight="700" textAlign="center">{confirmAction?.msg}</Text>
            <XStack gap="$3" width="100%" justifyContent="center">
              <Button flex={1} maxWidth={150} backgroundColor="transparent" borderWidth={1} borderColor={C.cardBorder as any} onPress={() => setConfirmAction(null)} borderRadius={10}>
                <Text color={C.textSub as any} fontWeight="700">HỦY</Text>
              </Button>
              <Button flex={1} maxWidth={150} backgroundColor={C.red as any} onPress={() => { confirmAction?.onConfirm(); setConfirmAction(null) }} borderRadius={10}>
                <Text color={C.white as any} fontWeight="800">XÁC NHẬN</Text>
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  )
}
