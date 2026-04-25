"use client"
import React, { useState, useRef } from 'react'
import { YStack, XStack, Text, View, Button, Image, Spinner, useMedia } from 'tamagui'
import { ChevronLeft, ChevronRight, Check, X, Upload } from '@tamagui/lucide-icons'
import Link from 'next/link'
import axios from 'axios'

const API = 'http://localhost:5000/api'
const C = { primary: '#28a745', bg: '#050807', card: 'rgba(15,22,18,0.85)', border: 'rgba(255,255,255,0.07)' }

const FORMATS = [
  { key: 'League', label: 'Vòng tròn', desc: 'Mỗi đội gặp nhau 1 lần', icon: '🔄' },
  { key: 'GroupKnockout', label: 'Chia bảng + KO', desc: 'Vòng bảng rồi loại trực tiếp', icon: '🏆' },
  { key: 'Knockout', label: 'Loại trực tiếp', desc: 'Thua là nghỉ - knockout thuần', icon: '⚔️' },
  { key: 'DoubleElimination', label: 'Nhánh Thắng/Thua', desc: 'Cơ hội thứ 2 khi thua 1 lần', icon: '🎯' },
]
const REGION_PRESETS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Toàn quốc']
const PITCH_TYPES = ['Sân 5', 'Futsal', 'Sân 7', 'Sân 11']
const STEPS = ['Thông tin chung', 'Thể thức & Kỹ thuật', 'Tài chính & Quy định']
const FEE_PRESETS = [0, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000]

type Form = {
  name: string; region: string; stadium: string; phone: string
  expectedStartDate: string; expectedEndDate: string
  format: string; maxTeams: number; pitchType: string; matchDuration: number
  entryFee: number | string; deadline: string; rankingCriteria: string[]
  banner: string; regulationsUrl: string
}

// ─── base64 upload ────────────────────────────────────────────────
async function uploadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await axios.post(`${API}/upload/tournament-file`.replace('/api/api/', '/api/'), {
          base64: reader.result, filename: file.name, mimeType: file.type,
        })
        res.data.success ? resolve(res.data.url) : reject(new Error(res.data.message))
      } catch (e: any) { reject(e) }
    }
    reader.onerror = () => reject(new Error('Đọc file thất bại'))
    reader.readAsDataURL(file)
  })
}

// ─── Reusable input style (native html) ──────────────────────────
const inputStyle: React.CSSProperties = {
  flex: 1, background: 'transparent', border: 'none', outline: 'none',
  color: 'white', fontSize: 14, fontFamily: 'inherit',
}
const dateInputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: 'white', padding: '11px 14px',
  fontSize: 14, fontFamily: 'inherit', width: '100%', outline: 'none',
}

// ─── FormField ────────────────────────────────────────────────────
const FormField = ({ label, placeholder, value, onChange, type = 'text' }: any) => (
  <YStack gap="$1.5">
    <Text color="#888" fontSize={12} fontWeight="700">{String(label).toUpperCase()}</Text>
    <XStack backgroundColor={"rgba(255,255,255,0.04)" as any} borderRadius={10}
      borderWidth={1} borderColor={"rgba(255,255,255,0.1)" as any}
      paddingHorizontal="$3" height={46} alignItems="center">
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={inputStyle} />
    </XStack>
  </YStack>
)

// ─── Chip selector ────────────────────────────────────────────────
const Chip = ({ label, active, onPress }: any) => (
  <XStack
    backgroundColor={(active ? C.primary : 'rgba(255,255,255,0.05)') as any}
    paddingHorizontal="$3" paddingVertical="$2" borderRadius={20}
    borderWidth={1} borderColor={(active ? C.primary : 'rgba(255,255,255,0.1)') as any}
    onPress={onPress} style={{ cursor: 'pointer' }}
  >
    <Text color={active ? 'white' : '#888'} fontSize={12} fontWeight="800">{label}</Text>
  </XStack>
)

// ─── Upload Zone ──────────────────────────────────────────────────
const UploadZone = ({ label, accept, hint, value, onDone, type }: {
  label: string; accept: string; hint: string; value: string
  onDone: (url: string) => void; type: 'image' | 'pdf'
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')

  const handle = async (file: File) => {
    setErr(''); setUploading(true)
    try { onDone(await uploadFile(file)) }
    catch (e: any) { setErr(e.message || 'Upload thất bại') }
    finally { setUploading(false) }
  }

  return (
    <YStack gap="$1.5">
      <Text color="#888" fontSize={12} fontWeight="700">{label.toUpperCase()}</Text>

      {value ? (
        type === 'image' ? (
          <View borderRadius={12} overflow="hidden" height={160} position="relative">
            <Image src={value} width="100%" height="100%" style={{ objectFit: 'cover' } as any} />
            <View position="absolute" top={8} right={8}
              backgroundColor={"rgba(0,0,0,0.7)" as any} borderRadius={20} padding={6}
              onPress={() => onDone('')} style={{ cursor: 'pointer' }}>
              <X size={14} color={"white" as any} />
            </View>
          </View>
        ) : (
          <XStack backgroundColor={"rgba(40,167,69,0.08)" as any} borderRadius={10}
            borderWidth={1} borderColor={"rgba(40,167,69,0.2)" as any}
            padding="$3" alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap="$2">
              <Text fontSize={20}>📄</Text>
              <YStack>
                <Text color="white" fontSize={13} fontWeight="700">File đã tải lên</Text>
                <Text color="#555" fontSize={10}>{value.split('/').pop()}</Text>
              </YStack>
            </XStack>
            <XStack gap="$3" alignItems="center">
              <Text color={C.primary as any} fontSize={12} fontWeight="700"
                onPress={() => window.open(value, '_blank')} style={{ cursor: 'pointer' }}>
                Xem
              </Text>
              <Text color="#ff4d4f" fontSize={12} fontWeight="700"
                onPress={() => onDone('')} style={{ cursor: 'pointer' }}>
                Xóa
              </Text>
            </XStack>
          </XStack>
        )
      ) : (
        <YStack
          alignItems="center" justifyContent="center" gap="$1.5"
          padding="$5"
          style={{
            border: `1.5px dashed rgba(255,255,255,0.1)`, borderRadius: 12,
            background: 'rgba(255,255,255,0.02)',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
          onDrop={(e: any) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) handle(f) }}
          onDragOver={(e: any) => e.preventDefault()}
          onPress={() => !uploading && inputRef.current?.click()}
        >
          {uploading
            ? <Spinner size="small" color={C.primary} />
            : (
              <YStack alignItems="center" gap="$1.5">
                <Text fontSize={28}>{type === 'image' ? '🖼️' : '📄'}</Text>
                <Text color="#666" fontSize={13} fontWeight="700" textAlign={"center" as any}>
                  {type === 'image' ? 'Kéo ảnh vào đây hoặc nhấn để chọn' : 'Kéo PDF vào đây hoặc nhấn để chọn'}
                </Text>
                <Text color="#333" fontSize={11}>{hint}</Text>
              </YStack>
            )
          }

        </YStack>
      )}

      {err && <Text color="#ff4d4f" fontSize={12}>{err}</Text>}
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f) }} />
    </YStack>
  )
}

// ─── Main Component ────────────────────────────────────────────────
export default function CreateTournamentScreen() {
  const media = useMedia()
  const isMobile = !media.gtMd

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState<Form>({
    name: '', region: '', stadium: '', phone: '',
    expectedStartDate: '', expectedEndDate: '',
    format: 'GroupKnockout', maxTeams: 16, pitchType: 'Sân 7', matchDuration: 70,
    entryFee: 0, deadline: '', rankingCriteria: ['Points', 'HeadToHead', 'GoalDifference'],
    banner: '', regulationsUrl: '',
  })

  const set = (k: keyof Form, v: any) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    if (step === 0 && !form.name.trim()) { setError('Vui lòng nhập tên giải đấu'); return false }
    if (step === 0 && !form.region) { setError('Vui lòng chọn hoặc nhập khu vực'); return false }
    setError(''); return true
  }

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 2)) }
  const prev = () => { setError(''); setStep(s => Math.max(s - 1, 0)) }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      await axios.post(`${API}/tournaments/create`,
        { ...form, entryFee: Number(form.entryFee) || 0 },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      setSuccess(true)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally { setLoading(false) }
  }

  const estimated =
    form.format === 'League' ? Math.floor(Number(form.maxTeams) * (Number(form.maxTeams) - 1) / 2)
    : form.format === 'Knockout' ? Number(form.maxTeams) - 1
    : Math.floor(Number(form.maxTeams) / 2 * 3) + 3

  if (success) return (
    <YStack flex={1} backgroundColor={C.bg as any} justifyContent="center" alignItems="center" minHeight="100vh">
      <YStack backgroundColor={C.card as any} borderRadius={24}
        borderWidth={1} borderColor={"rgba(40,167,69,0.3)" as any}
        padding="$8" alignItems="center" gap="$4" maxWidth={400} width="90%"
        style={{ boxShadow: '0 20px 60px rgba(40,167,69,0.15)' }}>
        <View width={80} height={80} borderRadius={40}
          backgroundColor={"rgba(40,167,69,0.15)" as any}
          alignItems="center" justifyContent="center"
          borderWidth={2} borderColor={"rgba(40,167,69,0.4)" as any}>
          <Check size={40} color={C.primary as any} />
        </View>
        <YStack alignItems="center" gap="$1">
          <Text color="white" fontSize={22} fontWeight="900">Tạo giải thành công! 🏆</Text>
          <Text color="#555" fontSize={13} textAlign={"center" as any}>
            Giải đấu đã gửi chờ Admin phê duyệt. Sau khi duyệt sẽ hiển thị công khai.
          </Text>
        </YStack>
        <Link href="/giai-dau">
          <XStack backgroundColor={C.primary as any} paddingHorizontal="$6" paddingVertical="$3"
            borderRadius="$10" style={{ cursor: 'pointer' }}>
            <Text color="white" fontWeight="900">Xem danh sách giải</Text>
          </XStack>
        </Link>
      </YStack>
    </YStack>
  )

  return (
    <YStack flex={1} backgroundColor={C.bg as any} minHeight="100vh">
      <YStack maxWidth={760} width="100%" marginHorizontal="auto"
        paddingHorizontal={isMobile ? '$4' : '$6'}
        paddingTop={isMobile ? '$5' : '$8'}
        paddingBottom="$10" gap="$5">

        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <Link href="/giai-dau">
            <XStack alignItems="center" gap="$1.5" style={{ cursor: 'pointer' }}>
              <ChevronLeft size={18} color={"#666" as any} />
              <Text color="#666" fontSize={14} fontWeight="700">Quay lại</Text>
            </XStack>
          </Link>
          <Text color="#333" fontSize={12} fontWeight="900" letterSpacing={2}>TẠO GIẢI ĐẤU</Text>
        </XStack>

        <Text color="white" fontSize={isMobile ? 24 : 30} fontWeight="900" letterSpacing={-0.5}>
          Tạo mùa giải mới 🏆
        </Text>

        {/* Steps */}
        <XStack gap="$2" alignItems="center">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <XStack alignItems="center" gap="$2" opacity={i === step ? 1 : i < step ? 0.8 : 0.35}>
                <View width={28} height={28} borderRadius={14}
                  backgroundColor={(i <= step ? C.primary : 'rgba(255,255,255,0.1)') as any}
                  alignItems="center" justifyContent="center">
                  {i < step
                    ? <Check size={14} color={"white" as any} />
                    : <Text color={i === step ? 'white' : '#555'} fontSize={12} fontWeight="900">{i + 1}</Text>
                  }
                </View>
                {!isMobile && (
                  <Text color={i === step ? 'white' : '#555'} fontSize={12}
                    fontWeight={i === step ? '800' : '600'}>{s}</Text>
                )}
              </XStack>
              {i < STEPS.length - 1 && (
                <View flex={1} height={1}
                  backgroundColor={(i < step ? C.primary : 'rgba(255,255,255,0.07)') as any} />
              )}
            </React.Fragment>
          ))}
        </XStack>

        {/* Card */}
        <YStack backgroundColor={C.card as any} borderRadius={20}
          borderWidth={1} borderColor={C.border as any}
          padding={isMobile ? '$4' : '$6'}
          style={{ backdropFilter: 'blur(12px)' }} gap="$4">

          {/* ── STEP 0 ── */}
          {step === 0 && (
            <YStack gap="$4">
              <Text color="white" fontSize={16} fontWeight="900">📋 Thông tin cơ bản</Text>

              <UploadZone label="Banner / Ảnh đại diện giải đấu" accept="image/*"
                hint="JPG, PNG, WebP — tối đa 5MB" value={form.banner}
                onDone={url => set('banner', url)} type="image" />

              <FormField label="Tên giải đấu *" placeholder="VD: HPL Season 12"
                value={form.name} onChange={(v: string) => set('name', v)} />

              {/* Khu vực: chip preset + ô nhập tùy chỉnh */}
              <YStack gap="$2">
                <Text color="#888" fontSize={12} fontWeight="700">KHU VỰC *</Text>
                <XStack flexWrap={"wrap" as any} gap="$2">
                  {REGION_PRESETS.map(r => (
                    <Chip key={r} label={r} active={form.region === r}
                      onPress={() => set('region', r)} />
                  ))}
                </XStack>
                <XStack backgroundColor={"rgba(255,255,255,0.04)" as any} borderRadius={10}
                  borderWidth={1} borderColor={"rgba(255,255,255,0.1)" as any}
                  paddingHorizontal="$3" height={42} alignItems="center" gap="$2">
                  <Text color="#444" fontSize={12}>✏️</Text>
                  <input
                    value={form.region}
                    onChange={e => set('region', e.target.value)}
                    placeholder="Hoặc nhập khu vực tùy chỉnh..."
                    style={inputStyle}
                  />
                </XStack>
              </YStack>

              <FormField label="Sân vận động / Cụm sân" placeholder="VD: Sân Cỏ Nhân Tạo Mỹ Đình"
                value={form.stadium} onChange={(v: string) => set('stadium', v)} />
              <FormField label="Điện thoại BTC" placeholder="0901 234 567"
                value={form.phone} onChange={(v: string) => set('phone', v)} />

              <XStack gap="$3">
                <YStack flex={1} gap="$1.5">
                  <Text color="#888" fontSize={12} fontWeight="700">NGÀY BẮT ĐẦU</Text>
                  <input type="date" value={form.expectedStartDate}
                    onChange={e => set('expectedStartDate', e.target.value)} style={dateInputStyle} />
                </YStack>
                <YStack flex={1} gap="$1.5">
                  <Text color="#888" fontSize={12} fontWeight="700">NGÀY KẾT THÚC</Text>
                  <input type="date" value={form.expectedEndDate}
                    onChange={e => set('expectedEndDate', e.target.value)} style={dateInputStyle} />
                </YStack>
              </XStack>
            </YStack>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <YStack gap="$4">
              <Text color="white" fontSize={16} fontWeight="900">⚽ Thể thức & Kỹ thuật</Text>

              <YStack gap="$2">
                <Text color="#888" fontSize={12} fontWeight="700">HÌNH THỨC THI ĐẤU *</Text>
                {FORMATS.map(f => (
                  <XStack key={f.key}
                    backgroundColor={(form.format === f.key ? 'rgba(40,167,69,0.1)' : 'rgba(255,255,255,0.03)') as any}
                    borderWidth={1}
                    borderColor={(form.format === f.key ? 'rgba(40,167,69,0.4)' : C.border) as any}
                    borderRadius={12} padding="$3" alignItems="center" gap="$3"
                    onPress={() => set('format', f.key)} style={{ cursor: 'pointer' }}>
                    <Text fontSize={24}>{f.icon}</Text>
                    <YStack flex={1}>
                      <Text color="white" fontSize={14} fontWeight="800">{f.label}</Text>
                      <Text color="#555" fontSize={11}>{f.desc}</Text>
                    </YStack>
                    {form.format === f.key && <Check size={18} color={C.primary as any} />}
                  </XStack>
                ))}
              </YStack>

              <YStack gap="$1.5">
                <Text color="#888" fontSize={12} fontWeight="700">SỐ ĐỘI</Text>
                <XStack gap="$2" flexWrap={"wrap" as any}>
                  {[8, 12, 16, 24, 32].map(n => (
                    <Chip key={n} label={`${n} đội`} active={Number(form.maxTeams) === n}
                      onPress={() => set('maxTeams', n)} />
                  ))}
                </XStack>
                <XStack backgroundColor={"rgba(255,255,255,0.04)" as any} borderRadius={10}
                  borderWidth={1} borderColor={"rgba(255,255,255,0.1)" as any}
                  paddingHorizontal="$3" height={42} alignItems="center" gap="$2">
                  <Text color="#444" fontSize={12}>✏️</Text>
                  <input
                    type="number"
                    value={form.maxTeams}
                    onChange={e => set('maxTeams', e.target.value)}
                    placeholder="Nhập số đội tùy chỉnh..."
                    style={inputStyle}
                  />
                </XStack>
              </YStack>

              <YStack gap="$1.5">
                <Text color="#888" fontSize={12} fontWeight="700">LOẠI SÂN</Text>
                <XStack gap="$2">
                  {PITCH_TYPES.map(p => (
                    <Chip key={p} label={p} active={form.pitchType === p}
                      onPress={() => set('pitchType', p)} />
                  ))}
                </XStack>
              </YStack>

              <YStack gap="$1.5">
                <Text color="#888" fontSize={12} fontWeight="700">THỜI LƯỢNG MỖI TRẬN (PHÚT)</Text>
                <XStack gap="$2" flexWrap={"wrap" as any}>
                  {[40, 50, 60, 70, 90].map(m => (
                    <Chip key={m} label={`${m} phút`} active={Number(form.matchDuration) === m}
                      onPress={() => set('matchDuration', m)} />
                  ))}
                </XStack>
                <XStack backgroundColor={"rgba(255,255,255,0.04)" as any} borderRadius={10}
                  borderWidth={1} borderColor={"rgba(255,255,255,0.1)" as any}
                  paddingHorizontal="$3" height={42} alignItems="center" gap="$2">
                  <Text color="#444" fontSize={12}>✏️</Text>
                  <input
                    type="number"
                    value={form.matchDuration}
                    onChange={e => set('matchDuration', e.target.value)}
                    placeholder="Nhập thời lượng tùy chỉnh (phút)..."
                    style={inputStyle}
                  />
                </XStack>
              </YStack>

              <XStack backgroundColor={"rgba(40,167,69,0.06)" as any}
                borderRadius={12} borderWidth={1} borderColor={"rgba(40,167,69,0.15)" as any}
                padding="$3" alignItems="center" gap="$3">
                <Text fontSize={20}>⚡</Text>
                <YStack>
                  <Text color="#888" fontSize={11} fontWeight="700">SỐ TRẬN DỰ KIẾN</Text>
                  <Text color={C.primary as any} fontSize={22} fontWeight="900">{estimated} trận</Text>
                </YStack>
              </XStack>
            </YStack>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <YStack gap="$4">
              <Text color="white" fontSize={16} fontWeight="900">💰 Tài chính & Quy định</Text>

              {/* Lệ phí: chip preset + ô nhập tùy chỉnh */}
              <YStack gap="$2">
                <Text color="#888" fontSize={12} fontWeight="700">LỆ PHÍ ĐĂNG KÝ (VNĐ/đội)</Text>
                <XStack gap="$2" flexWrap={"wrap" as any}>
                  {FEE_PRESETS.map(fee => (
                    <Chip key={fee}
                      label={fee === 0 ? 'Miễn phí' : `${(fee / 1_000_000).toFixed(0)}M`}
                      active={Number(form.entryFee) === fee}
                      onPress={() => set('entryFee', fee)} />
                  ))}
                </XStack>
                <XStack backgroundColor={"rgba(255,255,255,0.04)" as any} borderRadius={10}
                  borderWidth={1} borderColor={"rgba(255,255,255,0.1)" as any}
                  paddingHorizontal="$3" height={42} alignItems="center" gap="$2">
                  <Text color="#444" fontSize={12}>✏️</Text>
                  <input
                    type="number"
                    value={form.entryFee}
                    onChange={e => set('entryFee', e.target.value)}
                    placeholder="Hoặc nhập số tiền tùy chỉnh (VNĐ)..."
                    style={inputStyle}
                  />
                </XStack>
              </YStack>

              <YStack gap="$1.5">
                <Text color="#888" fontSize={12} fontWeight="700">HẠN ĐĂNG KÝ CUỐI</Text>
                <input type="datetime-local" value={form.deadline}
                  onChange={e => set('deadline', e.target.value)} style={dateInputStyle} />
              </YStack>

              <UploadZone label="Điều lệ giải đấu (PDF)" accept=".pdf,application/pdf"
                hint="Chỉ file PDF — tối đa 10MB" value={form.regulationsUrl}
                onDone={url => set('regulationsUrl', url)} type="pdf" />

              <YStack gap="$2">
                <Text color="#888" fontSize={12} fontWeight="700">TIÊU CHÍ XẾP HẠNG</Text>
                {[
                  { key: 'Points', label: '🏅 Tổng điểm số' },
                  { key: 'HeadToHead', label: '⚔️ Thành tích đối đầu' },
                  { key: 'GoalDifference', label: '⚽ Hiệu số bàn thắng' },
                  { key: 'FairPlay', label: '🟨 Chỉ số fair play' },
                ].map(cr => {
                  const active = form.rankingCriteria.includes(cr.key)
                  return (
                    <XStack key={cr.key}
                      backgroundColor={(active ? 'rgba(40,167,69,0.08)' : 'rgba(255,255,255,0.03)') as any}
                      borderWidth={1}
                      borderColor={(active ? 'rgba(40,167,69,0.3)' : C.border) as any}
                      borderRadius={10} padding="$3" alignItems="center" justifyContent="space-between"
                      onPress={() => set('rankingCriteria', active
                        ? form.rankingCriteria.filter(k => k !== cr.key)
                        : [...form.rankingCriteria, cr.key]
                      )} style={{ cursor: 'pointer' }}>
                      <Text color={(active ? 'white' : '#888') as any} fontSize={13} fontWeight="700">{cr.label}</Text>
                      {active && <Check size={16} color={C.primary as any} />}
                    </XStack>
                  )
                })}
              </YStack>
            </YStack>
          )}

          {error.length > 0 && (
            <XStack backgroundColor={"rgba(255,77,79,0.1)" as any} borderRadius={8} padding="$3"
              borderWidth={1} borderColor={"rgba(255,77,79,0.2)" as any}>
              <Text color="#ff4d4f" fontSize={13} fontWeight="700">{`⚠️ ${error}`}</Text>
            </XStack>
          )}
        </YStack>

        {/* Nav Buttons */}
        <XStack justifyContent="space-between" alignItems="center">
          {step > 0 ? (
            <Button onPress={prev} backgroundColor={"rgba(255,255,255,0.07)" as any}
              borderRadius="$10" size="$4" icon={<ChevronLeft size={18} />}>
              <Text color="white" fontWeight="700">Quay lại</Text>
            </Button>
          ) : <View />}

          {step < 2 ? (
            <Button onPress={next} backgroundColor={C.primary as any} borderRadius="$10" size="$4"
              iconAfter={<ChevronRight size={18} color={"white" as any} />}
              style={{ boxShadow: '0 4px 16px rgba(40,167,69,0.35)' }}>
              <Text color="white" fontWeight="900">Tiếp theo</Text>
            </Button>
          ) : (
            <Button onPress={submit} disabled={loading}
              backgroundColor={C.primary as any} borderRadius="$10" size="$4"
              style={{ boxShadow: '0 4px 16px rgba(40,167,69,0.35)' }}>
              {loading
                ? <Spinner size="small" color="white" />
                : <Text color="white" fontWeight="900">{'🏆 TẠO GIẢI ĐẤU'}</Text>}
            </Button>
          )}
        </XStack>
      </YStack>
    </YStack>
  )
}
