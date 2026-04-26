"use client"
import React, { useState, useRef, useEffect } from 'react'
import { YStack, XStack, Text, View, Spinner, Button } from 'tamagui'
import { Check, X, Users, User, Plus, Trash2, Shield, ChevronDown, ChevronUp, Upload, Download, Camera } from '@tamagui/lucide-icons'
import axios from 'axios'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
const C = { primary: '#28a745', bg: '#050807', card: 'rgba(15,22,18,0.85)', border: 'rgba(255,255,255,0.07)' }

const iStyle: React.CSSProperties = {
  flex: 1, background: 'transparent', border: 'none', outline: 'none',
  color: 'white', fontSize: 14, fontFamily: 'inherit',
}

// ─── Helpers ──────────────────────────────────────────────────────
const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })

const parseCSV = (text: string): Player[] => {
  const lines = text.trim().split('\n').filter(l => l.trim())
  // Bỏ header
  const start = lines[0].toLowerCase().includes('họ') || lines[0].toLowerCase().includes('name') ? 1 : 0
  return lines.slice(start).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    return {
      name: cols[0] || '', number: cols[1] || '', position: cols[2] || '',
      dob: cols[3] || '', idCard: cols[4] || '', photo: ''
    }
  }).filter(p => p.name)
}

const downloadTemplate = () => {
  const header = 'Họ và tên,Số áo,Vị trí,Ngày sinh (dd/mm/yyyy),Số CCCD/CMND'
  const sample = [
    'Nguyễn Văn An,1,Thủ môn,01/01/1998,012345678901',
    'Trần Văn Bình,7,Tiền đạo,15/06/2000,098765432109',
    'Lê Thị Cúc,10,Tiền vệ,20/12/1999,111222333444',
  ].join('\n')
  const blob = new Blob(['\ufeff' + header + '\n' + sample], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'mau_danh_sach_cau_thu.csv'
  a.click()
}

// ─── Types ────────────────────────────────────────────────────────
type Player = { name: string; dob: string; idCard: string; number: string; position: string; photo: string }
const EMPTY_PLAYER = (): Player => ({ name: '', dob: '', idCard: '', number: '', position: '', photo: '' })
const POSITIONS = ['Thủ môn', 'Hậu vệ', 'Tiền vệ', 'Tiền đạo']
const JERSEY_COLORS = [
  { l: 'Đỏ', h: '#e74c3c' }, { l: 'Xanh dương', h: '#2980b9' },
  { l: 'Xanh lá', h: '#27ae60' }, { l: 'Vàng', h: '#f1c40f' },
  { l: 'Trắng', h: '#ffffff' }, { l: 'Đen', h: '#222' },
  { l: 'Cam', h: '#e67e22' }, { l: 'Tím', h: '#8e44ad' },
]

// ─── Sub-components ───────────────────────────────────────────────
const Field = ({ label, placeholder, value, onChange, type = 'text', required = false, half = false }: any) => (
  <YStack gap="$1" style={half ? { flex: 1, minWidth: 0 } : { width: '100%' }}>
    <XStack alignItems="center" gap="$1">
      <Text color={"#888" as any} fontSize={11} fontWeight="700">{label.toUpperCase()}</Text>
      {required && <Text color={"#ff4d4f" as any} fontSize={11}>*</Text>}
    </XStack>
    <XStack backgroundColor={"rgba(255,255,255,0.05)" as any} borderRadius={10}
      borderWidth={1} borderColor={"rgba(255,255,255,0.1)" as any}
      paddingHorizontal="$3" height={42} alignItems="center">
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={iStyle} />
    </XStack>
  </YStack>
)

const Section = ({ icon, title, right }: any) => (
  <XStack alignItems="center" gap="$2" paddingBottom="$1"
    borderBottomWidth={1} borderColor={"rgba(255,255,255,0.07)" as any} justifyContent="space-between">
    <XStack alignItems="center" gap="$2">
      {icon}
      <Text color={"white" as any} fontSize={14} fontWeight="900">{title}</Text>
    </XStack>
    {right}
  </XStack>
)

const JerseyPicker = ({ label, value, onChange }: any) => (
  <YStack gap="$1.5">
    <Text color={"#888" as any} fontSize={11} fontWeight="700">{label.toUpperCase()}</Text>
    <XStack flexWrap={"wrap" as any} gap="$1.5">
      {JERSEY_COLORS.map(c => (
        <XStack key={c.h} alignItems="center" gap="$1.5"
          backgroundColor={(value === c.h ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)') as any}
          paddingHorizontal="$2" paddingVertical="$1.5" borderRadius={8}
          borderWidth={value === c.h ? 2 : 1}
          borderColor={(value === c.h ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)') as any}
          onPress={() => onChange(value === c.h ? '' : c.h)} style={{ cursor: 'pointer' }}>
          <View width={12} height={12} borderRadius={6} backgroundColor={c.h as any}
            borderWidth={c.h === '#ffffff' ? 1 : 0} borderColor={"rgba(0,0,0,0.3)" as any} />
          <Text color={"#ccc" as any} fontSize={10}>{c.l}</Text>
        </XStack>
      ))}
    </XStack>
  </YStack>
)

// ─── Player photo upload ──────────────────────────────────────────
const PlayerPhoto = ({ photo, onChange }: { photo: string; onChange: (b64: string) => void }) => {
  const ref = useRef<HTMLInputElement>(null)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const b64 = await readFileAsBase64(file)
    onChange(b64)
  }
  return (
    <View
      width={52} height={52} borderRadius={26}
      backgroundColor={(photo ? 'transparent' : 'rgba(255,255,255,0.06)') as any}
      borderWidth={photo ? 0 : 1.5}
      borderColor={"rgba(255,255,255,0.12)" as any}
      alignItems="center" justifyContent="center"
      onPress={() => ref.current?.click()}
      style={{ cursor: 'pointer', overflow: 'hidden', flexShrink: 0, position: 'relative' }}
    >
      {photo ? (
        <img src={photo} alt="avatar"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
      ) : (
        <Camera size={18} color={"#555" as any} />
      )}
      {/* Overlay khi hover */}
      <View position="absolute" top={0} left={0} right={0} bottom={0}
        backgroundColor={"rgba(0,0,0,0.4)" as any}
        alignItems="center" justifyContent="center"
        style={{ opacity: 0, transition: 'opacity 0.2s' }}
        hoverStyle={{ opacity: 1 } as any}>
        <Camera size={14} color={"white" as any} />
      </View>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </View>
  )
}

// ─── Player Row (accordion) ───────────────────────────────────────
const PlayerRow = ({ player, index, onChange, onRemove }: {
  player: Player; index: number; onChange: (p: Player) => void; onRemove: () => void
}) => {
  const [expanded, setExpanded] = useState(index === 0)
  const set = (k: keyof Player) => (v: string) => onChange({ ...player, [k]: v })

  return (
    <YStack backgroundColor={"rgba(255,255,255,0.03)" as any} borderRadius={12}
      borderWidth={1} borderColor={"rgba(255,255,255,0.07)" as any} overflow="hidden">
      {/* Header */}
      <XStack padding="$2.5" alignItems="center" gap="$2"
        backgroundColor={(expanded ? 'rgba(40,167,69,0.05)' : 'transparent') as any}
        onPress={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
        {/* Photo avatar nhỏ */}
        {player.photo ? (
          <img src={player.photo} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <View width={32} height={32} borderRadius={16}
            backgroundColor={"rgba(40,167,69,0.15)" as any}
            alignItems="center" justifyContent="center"
            borderWidth={1} borderColor={"rgba(40,167,69,0.25)" as any} style={{ flexShrink: 0 }}>
            <Text color={C.primary as any} fontSize={11} fontWeight="900">{index + 1}</Text>
          </View>
        )}
        <YStack flex={1}>
          <Text color={(player.name ? 'white' : '#444') as any} fontSize={13} fontWeight="700">
            {player.name || `Cầu thủ #${index + 1}`}
          </Text>
          {(player.position || player.number) && (
            <Text color={"#555" as any} fontSize={10}>
              {[player.position, player.number && `#${player.number}`].filter(Boolean).join(' · ')}
            </Text>
          )}
        </YStack>
        <View padding={4} onPress={e => { (e as any).stopPropagation?.(); onRemove() }} style={{ cursor: 'pointer' }}>
          <Trash2 size={13} color={"#444" as any} />
        </View>
        {expanded ? <ChevronUp size={13} color={"#555" as any} /> : <ChevronDown size={13} color={"#555" as any} />}
      </XStack>

      {/* Expanded fields */}
      {expanded && (
        <YStack padding="$3" gap="$3" borderTopWidth={1} borderColor={"rgba(255,255,255,0.05)" as any}>
          {/* Photo + basic info */}
          <XStack gap="$3" alignItems="flex-start">
            {/* Ảnh thẻ cầu thủ */}
            <YStack alignItems="center" gap="$1">
              <PlayerPhoto photo={player.photo} onChange={set('photo')} />
              <Text color={"#444" as any} fontSize={9} fontWeight="700" textAlign={"center" as any}>ẢNH THẺ</Text>
            </YStack>
            <YStack flex={1} gap="$3">
              <Field label="Họ và tên" placeholder="Nguyễn Văn A" value={player.name}
                onChange={set('name')} required />
              <XStack gap="$2">
                <Field label="Số áo" placeholder="10" value={player.number} onChange={set('number')} half />
                <Field label="Ngày sinh" placeholder="01/01/1998" value={player.dob} onChange={set('dob')} type="date" half />
              </XStack>
            </YStack>
          </XStack>

          <Field label="Số CCCD/CMND" placeholder="012345678901" value={player.idCard} onChange={set('idCard')} />

          <YStack gap="$1">
            <Text color={"#888" as any} fontSize={11} fontWeight="700">VỊ TRÍ</Text>
            <XStack gap="$1.5" flexWrap={"wrap" as any}>
              {POSITIONS.map(pos => (
                <XStack key={pos}
                  backgroundColor={(player.position === pos ? C.primary : 'rgba(255,255,255,0.04)') as any}
                  paddingHorizontal="$2.5" paddingVertical="$1.5" borderRadius={8}
                  borderWidth={1} borderColor={(player.position === pos ? C.primary : 'rgba(255,255,255,0.08)') as any}
                  onPress={() => set('position')(pos)} style={{ cursor: 'pointer' }}>
                  <Text color={(player.position === pos ? 'white' : '#888') as any} fontSize={11} fontWeight="700">{pos}</Text>
                </XStack>
              ))}
            </XStack>
          </YStack>
        </YStack>
      )}
    </YStack>
  )
}

// ─── MAIN MODAL ───────────────────────────────────────────────────
interface Props { 
  tournament: any; 
  onClose: () => void; 
  onSuccess: () => void;
  initialData?: any; // Dữ liệu cũ để sửa
}
type Form = {
  teamName: string; logo: string; jerseyColor: string; jerseyColorAlt: string
  managerName: string; managerPhone: string; managerEmail: string; managerIdCard: string
  coachName: string; coachPhone: string; note: string
}
const EMPTY_FORM = (): Form => ({
  teamName: '', logo: '', jerseyColor: '', jerseyColorAlt: '',
  managerName: '', managerPhone: '', managerEmail: '', managerIdCard: '',
  coachName: '', coachPhone: '', note: '',
})
const TABS = ['Thông tin đội', 'Danh sách cầu thủ', 'Xác nhận']

export default function RegisterTeamModal({ tournament, onClose, onSuccess, initialData }: Props) {
  const [tab, setTab] = useState(0)
  const [registerMode, setRegisterMode] = useState<'manual' | 'select'>(initialData ? 'manual' : 'manual')
  const [myTeams, setMyTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  
  const [form, setForm] = useState<Form>(initialData ? {
    teamName: initialData.teamName || '',
    logo: initialData.logo || '',
    jerseyColor: initialData.jerseyColor || '',
    jerseyColorAlt: initialData.jerseyColorAlt || '',
    managerName: initialData.managerName || '',
    managerPhone: initialData.managerPhone || '',
    managerEmail: initialData.managerEmail || '',
    managerIdCard: initialData.managerIdCard || '',
    coachName: initialData.coachName || '',
    coachPhone: initialData.coachPhone || '',
    note: initialData.note || '',
  } : EMPTY_FORM())

  const [players, setPlayers] = useState<Player[]>(initialData?.players || [EMPTY_PLAYER()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const excelInputRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof Form) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const updatePlayer = (i: number, p: Player) => setPlayers(ps => ps.map((x, j) => j === i ? p : x))
  const addPlayer = () => setPlayers(ps => [...ps, EMPTY_PLAYER()])
  const removePlayer = (i: number) => setPlayers(ps => ps.length > 1 ? ps.filter((_, j) => j !== i) : ps)

  // ─── Lấy danh sách đội bóng ────────────────────────────────────
  useEffect(() => {
    const fetchMyTeams = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await axios.get(`${API}/teams/my-teams/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMyTeams(res.data)
      } catch (err) {
        console.error("Lỗi lấy đội bóng:", err)
      }
    }
    fetchMyTeams()
  }, [])

  // ─── Xử lý chọn đội ────────────────────────────────────────────
  const handleSelectTeam = async (teamId: string) => {
    setSelectedTeamId(teamId)
    if (!teamId) {
      setForm(EMPTY_FORM())
      setPlayers([EMPTY_PLAYER()])
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API}/teams/${teamId}`)
      if (res.data.success) {
        const teamData = res.data.data
        // Tự động điền Form
        setForm(f => ({
          ...f,
          teamName: teamData.name || '',
          logo: teamData.logo_url || teamData.logo || teamData.photo || '',
          managerName: teamData.leader || '',
        }))
        // Tự động lấy danh sách cầu thủ
        if (teamData.players && teamData.players.length > 0) {
           const mappedPlayers = teamData.players.map((p: any) => ({
             name: p.name || '',
             dob: p.birthYear ? `15/06/${p.birthYear}` : '',
             idCard: p.idCard || '',
             number: p.shirtNumber ? String(p.shirtNumber) : '',
             position: p.position || '',
             photo: p.avatar || ''
           }))
           setPlayers(mappedPlayers)
           setImportStatus(`✅ Tự động tải ${mappedPlayers.length} thành viên từ đội bóng`)
        } else {
           setPlayers([EMPTY_PLAYER()])
           setImportStatus('Đội bóng chưa có thành viên nào')
        }
      }
    } catch (err) {
      console.error(err)
      setError("Lỗi lấy thông tin đội bóng")
    } finally {
      setLoading(false)
    }
  }

  // ─── Import Excel / CSV ───────────────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus('Đang đọc file...')
    try {
      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        const imported = parseCSV(text)
        if (imported.length === 0) throw new Error('Không tìm thây dữ liệu cầu thủ trong file CSV')
        setPlayers(imported)
        setImportStatus(`✅ Đã import ${imported.length} cầu thủ từ CSV`)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Dynamic import xlsx
        const XLSX = await import('xlsx').catch(() => null)
        if (!XLSX) throw new Error('Không thể đọc Excel. Hãy lưu file dạng CSV và thử lại.')
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        // Tìm header row
        const headerIdx = rows.findIndex(r =>
          r.some(c => String(c).toLowerCase().includes('họ') || String(c).toLowerCase().includes('name') || String(c).toLowerCase().includes('tên'))
        )
        const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows.slice(1)
        const imported: Player[] = dataRows
          .filter(r => r[0] && String(r[0]).trim())
          .map(r => ({
            name: String(r[0] || '').trim(),
            number: String(r[1] || '').trim(),
            position: String(r[2] || '').trim(),
            dob: String(r[3] || '').trim(),
            idCard: String(r[4] || '').trim(),
            photo: '',
          }))
        if (imported.length === 0) throw new Error('Không tìm thấy dữ liệu. Kiểm tra lại cấu trúc file Excel.')
        const maxP = tournament.config?.maxPlayers || 20
        const capped = imported.slice(0, maxP)
        setPlayers(capped)
        setImportStatus(`✅ Đã import ${capped.length} cầu thủ từ Excel${capped.length < imported.length ? ` (giới hạn ${maxP})` : ''}`)
      } else {
        throw new Error('Chỉ hỗ trợ file .xlsx, .xls hoặc .csv')
      }
    } catch (err: any) {
      setImportStatus(`❌ ${err.message}`)
    } finally {
      if (e.target) e.target.value = ''
    }
  }

  // ─── Validate ─────────────────────────────────────────────────
  const validate = (): string => {
    if (!form.teamName.trim()) return 'Vui lòng nhập tên đội'
    if (!form.managerName.trim()) return 'Vui lòng nhập họ tên trưởng đoàn'
    if (!form.managerPhone.trim()) return 'Vui lòng nhập SĐT trưởng đoàn'
    const filled = players.filter(p => p.name.trim())
    if (filled.length < 7) return `Cần nhập ít nhất 7 cầu thủ (hiện có ${filled.length})`
    return ''
  }

  const submit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    try {
      const filledPlayers = players.filter(p => p.name.trim())
      const token = localStorage.getItem('token')
      
      if (initialData?.id) {
        // CẬP NHẬT
        await axios.patch(`${API}/tournaments/${tournament.id}/teams/${initialData.id}`, {
          ...form,
          players: filledPlayers,
          playerCount: filledPlayers.length,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        // ĐĂNG KÝ MỚI
        await axios.post(`${API}/tournaments/${tournament.id}/register`, {
          ...form,
          players: filledPlayers,
          playerCount: filledPlayers.length,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      setDone(true)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Đã có lỗi xảy ra')
    } finally { setLoading(false) }
  }

  const maxPlayers = tournament.config?.maxPlayers || 20
  const remaining = tournament.maxTeams - (tournament.teams?.length || 0)
  const filledCount = players.filter(p => p.name.trim()).length

  // ─── Success screen ────────────────────────────────────────────
  if (done) return (
    <View position="fixed" top={0} left={0} right={0} bottom={0}
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <YStack backgroundColor={"#0c1410" as any} borderRadius={20}
        borderWidth={1} borderColor={"rgba(40,167,69,0.25)" as any}
        padding="$8" alignItems="center" gap="$4" width={380} maxWidth="94%"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>
        <View width={72} height={72} borderRadius={36}
          backgroundColor={"rgba(40,167,69,0.15)" as any}
          alignItems="center" justifyContent="center"
          borderWidth={2} borderColor={"rgba(40,167,69,0.4)" as any}>
          <Check size={36} color={(C.primary) as any} />
        </View>
        <YStack alignItems="center" gap="$2">
          <Text color={"white" as any} fontSize={20} fontWeight="900">
            {initialData ? 'Cập nhật thành công!' : 'Đăng ký thành công! 🎉'}
          </Text>
          <Text color={"#555" as any} fontSize={13} textAlign={"center" as any}>
            {initialData ? 'Hồ sơ của bạn đã được gửi lại cho BTC xét duyệt.' : 'Hồ sơ đang chờ BTC kiểm duyệt.'}
          </Text>
          <Text color={C.primary as any} fontSize={13} fontWeight="700">{form.managerPhone}</Text>
        </YStack>
        <XStack backgroundColor={C.primary as any} paddingHorizontal="$6" paddingVertical="$3"
          borderRadius="$10" onPress={onSuccess} style={{ cursor: 'pointer' }}>
          <Text color={"white" as any} fontWeight="900">Đóng</Text>
        </XStack>
      </YStack>
    </View>
  )

  return (
    <View position="fixed" top={0} left={0} right={0} bottom={0}
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
      <YStack backgroundColor={"#0c1410" as any} borderRadius={20}
        borderWidth={1} borderColor={"rgba(40,167,69,0.2)" as any}
        width={540} maxWidth="100%"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.8)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '93vh' }}>

        {/* Header */}
        <XStack padding="$4" paddingBottom="$3"
          borderBottomWidth={1} borderColor={"rgba(255,255,255,0.06)" as any}
          justifyContent="space-between" alignItems="flex-start" style={{ flexShrink: 0 }}>
          <YStack flex={1}>
            <Text color={C.primary as any} fontSize={11} fontWeight="900" letterSpacing={1}>ĐĂNG KÝ THAM DỰ</Text>
            <Text color={"white" as any} fontSize={16} fontWeight="900" numberOfLines={1}>{tournament.name}</Text>
            <Text color={"#444" as any} fontSize={11}>
              {`Còn ${remaining} chỗ · ${tournament.entryFee > 0 ? `${(tournament.entryFee / 1e6).toFixed(0)}M VNĐ` : 'Miễn phí'} · Tối đa ${maxPlayers} cầu thủ/đội`}
            </Text>
          </YStack>
          <View padding={6} onPress={onClose} style={{ cursor: 'pointer' }}>
            <X size={18} color={"#555" as any} />
          </View>
        </XStack>

        {/* Tab bar */}
        <XStack backgroundColor={"rgba(255,255,255,0.03)" as any}
          padding="$1.5" gap="$1" marginHorizontal="$4" marginTop="$3" borderRadius={10}
          style={{ flexShrink: 0 }}>
          {TABS.map((t, i) => (
            <XStack key={t} flex={1} justifyContent="center"
              backgroundColor={(tab === i ? C.primary : 'transparent') as any}
              paddingVertical="$2" borderRadius={8}
              onPress={() => { setError(''); setTab(i) }} style={{ cursor: 'pointer' }}>
              <Text color={(tab === i ? 'white' : '#555') as any} fontSize={11} fontWeight="800" textAlign={"center" as any}>{t}</Text>
            </XStack>
          ))}
        </XStack>

        {/* BTC Note if editing */}
        {initialData?.btcNote && (
          <YStack marginHorizontal="$4" marginTop="$3" padding="$3" backgroundColor="rgba(250,140,22,0.1)" borderRadius={10} borderWidth={1} borderColor="rgba(250,140,22,0.2)">
            <Text color="#fa8c16" fontSize={11} fontWeight="900">YÊU CẦU TỪ BTC:</Text>
            <Text color="#eee" fontSize={13}>{initialData.btcNote}</Text>
          </YStack>
        )}

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <YStack gap="$4">

            {/* ── Tab 0: Thông tin đội ── */}
            {tab === 0 && (
              <YStack gap="$4">
                
                {/* ── Chọn chế độ đăng ký ── */}
                <XStack mb="$3" backgroundColor={"rgba(255,255,255,0.05)" as any} borderRadius={12} padding={4} gap={4}>
                  <Button 
                    flex={1} size="$3" borderRadius={8}
                    backgroundColor={registerMode === 'manual' ? ('#2980b9' as any) : 'transparent'}
                    onPress={() => {
                       setRegisterMode('manual')
                       setSelectedTeamId('')
                       setForm(EMPTY_FORM())
                       setPlayers([EMPTY_PLAYER()])
                    }}
                    hoverStyle={{ backgroundColor: registerMode === 'manual' ? '#2980b9' : 'rgba(255,255,255,0.08)' } as any}
                  >
                    <User size={16} color={registerMode === 'manual' ? "white" : "#888"} />
                    <Text color={registerMode === 'manual' ? "white" : "#888"} fontSize={13} fontWeight="800">Nhập thủ công</Text>
                  </Button>
                  <Button 
                    flex={1} size="$3" borderRadius={8}
                    backgroundColor={registerMode === 'select' ? (C.primary as any) : 'transparent'}
                    onPress={() => setRegisterMode('select')}
                    hoverStyle={{ backgroundColor: registerMode === 'select' ? C.primary : 'rgba(255,255,255,0.08)' } as any}
                  >
                    <Shield size={16} color={registerMode === 'select' ? "white" : "#888"} />
                    <Text color={registerMode === 'select' ? "white" : "#888"} fontSize={13} fontWeight="800">Chọn đội có sẵn</Text>
                  </Button>
                </XStack>

                {registerMode === 'select' && (
                  <YStack gap="$2" mb="$2">
                    <Text color="#888" fontSize={12} fontWeight="700">LỰA CHỌN ĐỘI BÓNG ĐÃ TẠO</Text>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => handleSelectTeam(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                    >
                      <option value="" style={{ color: 'black' }}>-- Chọn một đội bóng --</option>
                      {myTeams.map(t => (
                        <option key={t.id} value={t.id} style={{ color: 'black' }}>{t.name}</option>
                      ))}
                    </select>
            {loading && <Text color={C.primary as any} fontSize={12} marginTop="$1">Đang tải dữ liệu đội bóng...</Text>}
                  </YStack>
                )}

                <Section icon={<Shield size={15} color={(C.primary) as any} />} title="Thông tin đội bóng" />
                <XStack gap="$3" alignItems="center">
                  <YStack gap="$1" width={60} alignItems="center">
                    <Text color="#888" fontSize={10} fontWeight="700">LOGO ĐỘI</Text>
                    <PlayerPhoto photo={form.logo} onChange={set('logo')} />
                  </YStack>
                  <YStack flex={1}>
                    <Field label="Tên đội" placeholder="VD: FC Sao Vàng 2026" required value={form.teamName} onChange={set('teamName')} />
                  </YStack>
                </XStack>
                <JerseyPicker label="Màu áo chính" value={form.jerseyColor} onChange={set('jerseyColor')} />
                <JerseyPicker label="Màu áo phụ (Tùy chọn)" value={form.jerseyColorAlt} onChange={set('jerseyColorAlt')} />

                <Section icon={<User size={15} color={(C.primary) as any} />} title="Trưởng đoàn / Quản lý" />
                <Field label="Họ và tên" placeholder="Nguyễn Văn A" required value={form.managerName} onChange={set('managerName')} />
                <Field label="Số điện thoại" placeholder="0901 234 567" required value={form.managerPhone} onChange={set('managerPhone')} />
                <Field label="Email" placeholder="email@example.com" value={form.managerEmail} onChange={set('managerEmail')} type="email" />
                <Field label="Số CCCD/CMND" placeholder="012345678901" value={form.managerIdCard} onChange={set('managerIdCard')} />

                <Section icon={<Users size={15} color={"#888" as any} />} title="HLV trưởng (Tùy chọn)" />
                <Field label="Họ và tên HLV" placeholder="Trần Văn B" value={form.coachName} onChange={set('coachName')} />
                <Field label="SĐT HLV" placeholder="0912 345 678" value={form.coachPhone} onChange={set('coachPhone')} />
              </YStack>
            )}

            {/* ── Tab 1: Danh sách cầu thủ ── */}
            {tab === 1 && (
              <YStack gap="$3">
                {/* Import toolbar */}
                <YStack backgroundColor={"rgba(40,167,69,0.05)" as any} borderRadius={12}
                  borderWidth={1} borderColor={"rgba(40,167,69,0.15)" as any} padding="$3" gap="$2.5">
                  <Text color={"#888" as any} fontSize={11} fontWeight="700">IMPORT DANH SÁCH HÀNG LOẠT</Text>
                  <XStack gap="$2" flexWrap={"wrap" as any}>
                    {/* Download template */}
                    <XStack
                      backgroundColor={"rgba(255,255,255,0.06)" as any} paddingHorizontal="$3" paddingVertical="$2"
                      borderRadius={9} alignItems="center" gap="$1.5"
                      onPress={downloadTemplate} style={{ cursor: 'pointer' }}>
                      <Download size={13} color={"#888" as any} />
                      <Text color={"#888" as any} fontSize={12} fontWeight="700">Tải mẫu CSV</Text>
                    </XStack>
                    {/* Upload Excel/CSV */}
                    <XStack
                      backgroundColor={C.primary as any} paddingHorizontal="$3" paddingVertical="$2"
                      borderRadius={9} alignItems="center" gap="$1.5"
                      onPress={() => excelInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                      <Upload size={13} color={"white" as any} />
                      <Text color={"white" as any} fontSize={12} fontWeight="800">Upload Excel / CSV</Text>
                    </XStack>
                    <input
                      ref={excelInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: 'none' }}
                      onChange={handleImportFile}
                    />
                  </XStack>
                  {importStatus && (
                    <Text
                      color={(importStatus.startsWith('✅') ? C.primary : importStatus.startsWith('❌') ? '#ff4d4f' : '#888') as any}
                      fontSize={12} fontWeight="700">
                      {importStatus}
                    </Text>
                  )}
                  <Text color={"#333" as any} fontSize={11}>
                    Cột: Họ tên · Số áo · Vị trí · Ngày sinh · Số CCCD
                  </Text>
                </YStack>

                {/* Header info */}
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text color={"white" as any} fontSize={13} fontWeight="900">
                      {`${filledCount}/${maxPlayers} cầu thủ`}
                    </Text>
                    <Text color={(filledCount < 7 ? '#fa8c16' : C.primary) as any} fontSize={11} fontWeight="700">
                      {filledCount < 7 ? `Cần thêm ${7 - filledCount} nữa (tối thiểu 7)` : 'Đủ số lượng ✓'}
                    </Text>
                  </YStack>
                  {players.length < maxPlayers && (
                    <XStack backgroundColor={C.primary as any} paddingHorizontal="$3" paddingVertical="$1.5"
                      borderRadius={8} alignItems="center" gap="$1"
                      onPress={addPlayer} style={{ cursor: 'pointer' }}>
                      <Plus size={13} color={"white" as any} />
                      <Text color={"white" as any} fontSize={12} fontWeight="800">Thêm thủ công</Text>
                    </XStack>
                  )}
                </XStack>

                {/* Player list */}
                {players.map((p, i) => (
                  <PlayerRow key={`player-${i}`} player={p} index={i}
                    onChange={updated => updatePlayer(i, updated)}
                    onRemove={() => removePlayer(i)} />
                ))}

                {players.length < maxPlayers && (
                  <XStack padding="$3" borderRadius={12} justifyContent="center"
                    onPress={addPlayer} style={{ cursor: 'pointer', border: '1.5px dashed rgba(255,255,255,0.08)' }}>
                    <XStack alignItems="center" gap="$1.5">
                      <Plus size={13} color={"#444" as any} />
                      <Text color={"#444" as any} fontSize={12} fontWeight="700">Thêm cầu thủ</Text>
                    </XStack>
                  </XStack>
                )}
              </YStack>
            )}

            {/* ── Tab 2: Xác nhận ── */}
            {tab === 2 && (
              <YStack gap="$4">
                <Text color={"white" as any} fontSize={15} fontWeight="900">Xác nhận hồ sơ đăng ký</Text>

                {/* Preview danh sách cầu thủ */}
                <YStack backgroundColor={"rgba(255,255,255,0.03)" as any} borderRadius={12}
                  borderWidth={1} borderColor={"rgba(255,255,255,0.07)" as any} padding="$3" gap="$2">
                  <YStack backgroundColor={"rgba(255,255,255,0.03)" as any} borderRadius={10} padding="$2.5" gap="$2">
                    <ConfirmRow label="Tên đội" value={form.teamName} />
                    <ConfirmRow label="Màu áo" value={''} extra={
                      <XStack gap="$1.5" alignItems="center">
                        {form.jerseyColor && <View width={16} height={16} borderRadius={8} backgroundColor={form.jerseyColor as any}
                          borderWidth={1} borderColor={"rgba(255,255,255,0.2)" as any} />}
                        {form.jerseyColorAlt && <View width={16} height={16} borderRadius={8} backgroundColor={form.jerseyColorAlt as any}
                          borderWidth={1} borderColor={"rgba(255,255,255,0.2)" as any} />}
                        {!form.jerseyColor && <Text color={"#444" as any} fontSize={12}>Chưa chọn</Text>}
                      </XStack>
                    } />
                    <ConfirmRow label="Trưởng đoàn" value={form.managerName} />
                    <ConfirmRow label="SĐT" value={form.managerPhone} />
                    {form.coachName && <ConfirmRow label="HLV" value={form.coachName} />}
                    <ConfirmRow label="Cầu thủ đăng ký"
                      value={`${filledCount} cầu thủ`}
                      valueColor={filledCount >= 7 ? C.primary : '#fa8c16'} />
                  </YStack>

                  {/* Thumbnail cầu thủ */}
                  {players.filter(p => p.photo).length > 0 && (
                    <YStack gap="$1">
                      <Text color={"#555" as any} fontSize={11} fontWeight="700">ẢNH CẦU THỦ ĐÃ UPLOAD</Text>
                      <XStack flexWrap={"wrap" as any} gap="$1.5">
                        {players.filter(p => p.photo).map((p, i) => (
                          <YStack key={`photo-${p.name || i}`} alignItems="center" gap="$0.5">
                            <img src={p.photo} alt={p.name}
                              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} />
                            <Text color={"#444" as any} fontSize={9} numberOfLines={1} style={{ maxWidth: 40 }}>{p.name.split(' ').pop()}</Text>
                          </YStack>
                        ))}
                      </XStack>
                    </YStack>
                  )}
                </YStack>

                <YStack backgroundColor={"rgba(250,140,22,0.06)" as any} borderRadius={10}
                  borderWidth={1} borderColor={"rgba(250,140,22,0.2)" as any} padding="$3" gap="$1">
                  <Text color={"#fa8c16" as any} fontSize={12} fontWeight="900">⚠️ Lưu ý</Text>
                  <Text color={"#888" as any} fontSize={12}>Sau khi gửi, BTC sẽ kiểm tra và liên hệ xác nhận qua SĐT trưởng đoàn.</Text>
                  {tournament.deadline && (
                    <Text color={"#888" as any} fontSize={12}>Hạn: {new Date(tournament.deadline).toLocaleString('vi-VN')}</Text>
                  )}
                </YStack>

                <YStack gap="$1.5">
                  <Text color={"#888" as any} fontSize={11} fontWeight="700">GHI CHÚ CHO BTC</Text>
                  <XStack backgroundColor={"rgba(255,255,255,0.05)" as any} borderRadius={10}
                    borderWidth={1} borderColor={"rgba(255,255,255,0.1)" as any}
                    paddingHorizontal="$3" paddingVertical="$2.5" alignItems="flex-start">
                    <textarea value={form.note} onChange={e => set('note')(e.target.value)}
                      placeholder="Yêu cầu đặc biệt, câu hỏi..." rows={3}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 13, fontFamily: 'inherit', resize: 'none', width: '100%' }} />
                  </XStack>
                </YStack>
              </YStack>
            )}

            {/* Error */}
            {error.length > 0 && (
              <XStack backgroundColor={"rgba(255,77,79,0.08)" as any} borderRadius={10}
                borderWidth={1} borderColor={"rgba(255,77,79,0.2)" as any} padding="$3">
                <Text color={"#ff4d4f" as any} fontSize={13} fontWeight="700">{error}</Text>
              </XStack>
            )}
          </YStack>
        </div>

        {/* Footer */}
        <XStack padding="$4" paddingTop="$3" gap="$3"
          borderTopWidth={1} borderColor={"rgba(255,255,255,0.06)" as any}
          style={{ flexShrink: 0 }}>
          <XStack flex={1} height={46} borderRadius="$10"
            backgroundColor={"rgba(255,255,255,0.07)" as any}
            alignItems="center" justifyContent="center"
            onPress={() => { setError(''); tab > 0 ? setTab(t => t - 1) : onClose() }} style={{ cursor: 'pointer' }}>
            <Text color={"white" as any} fontWeight="700">{tab > 0 ? '← Quay lại' : 'Huỷ'}</Text>
          </XStack>

          {tab < TABS.length - 1 ? (
            <XStack flex={2} height={46} borderRadius="$10"
              backgroundColor={C.primary as any}
              alignItems="center" justifyContent="center"
              onPress={() => { setError(''); setTab(t => t + 1) }}
              style={{ cursor: 'pointer', boxShadow: '0 4px 16px rgba(40,167,69,0.4)' }}>
              <Text color={"white" as any} fontWeight="900">Tiếp theo →</Text>
            </XStack>
          ) : (
            <XStack flex={2} height={46} borderRadius="$10"
              backgroundColor={C.primary as any}
              alignItems="center" justifyContent="center"
              onPress={loading ? undefined : submit}
              style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(40,167,69,0.4)' }}>
              {loading ? <Spinner size="small" color={"white" as any} />
                : <Text color={"white" as any} fontWeight="900">GỬI HỒ SƠ ĐĂNG KÝ</Text>}
            </XStack>
          )}
        </XStack>
      </YStack>
    </View>
  )
}

const ConfirmRow = ({ label, value, extra, valueColor = 'white' }: any) => (
  <XStack justifyContent="space-between" alignItems="center">
    <Text color={"#555" as any} fontSize={12} fontWeight="700">{label}</Text>
    {extra || <Text color={(valueColor) as any} fontSize={12} fontWeight="700">{value}</Text>}
  </XStack>
)
