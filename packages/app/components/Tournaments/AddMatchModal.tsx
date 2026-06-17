import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, View, Button, Input, Spinner } from 'tamagui'
import { X, Calendar, Clock, MapPin, Hash, Plus, Trash2 } from '@tamagui/lucide-icons'
import axios from 'axios'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
const C = { primary: '#28a745', bg: '#050807', card: 'rgba(15,22,18,0.85)', border: 'rgba(255,255,255,0.07)' }

interface Props {
  tournamentId: string
  teams: any[]
  editMatch?: any
  onClose: () => void
  onSuccess: () => void
}

type IncidentForm = {
  minute: string
  type: 'goal' | 'yellowCard' | 'redCard' | 'sub'
  team: 'home' | 'away'
  player: string
  playerIn?: string
}

const STATUS_OPTIONS = [
  { value: 'Scheduled', label: 'Sắp đá' },
  { value: 'Ongoing', label: 'Đang đá' },
  { value: '1st_half', label: 'Hiệp 1' },
  { value: 'halftime', label: 'Nghỉ giữa hiệp' },
  { value: '2nd_half', label: 'Hiệp 2' },
  { value: 'penalties', label: 'Luân lưu (PEN)' },
  { value: 'Finished', label: 'Đã kết thúc' },
]

const INCIDENT_OPTIONS = [
  { value: 'goal', label: 'Bàn thắng' },
  { value: 'yellowCard', label: 'Thẻ vàng' },
  { value: 'redCard', label: 'Thẻ đỏ' },
  { value: 'sub', label: 'Thay người' },
]

const selectStyle = {
  background: 'rgba(255,255,255,0.05)',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.1)',
  height: 42,
  borderRadius: 10,
  padding: '0 12px',
  width: '100%',
  outline: 'none',
}

const optionStyle = { background: '#111', color: 'white' }

const getScore = (match: any, side: 'home' | 'away') => {
  const direct = side === 'home' ? match?.homeScore : match?.awayScore
  const nested = match?.score?.[side]
  return direct ?? (typeof nested === 'object' ? nested?.current : nested) ?? 0
}

const normalizeIncidentType = (type: any): IncidentForm['type'] => {
  const value = String(type || '').toLowerCase()
  if (value.includes('yellow')) return 'yellowCard'
  if (value.includes('red')) return 'redCard'
  if (value.includes('sub')) return 'sub'
  return 'goal'
}

const getPlayers = (team: any) => {
  const players = Array.isArray(team?.players) ? team.players : []
  return players.map((player: any) => player?.name || player?.playerName || player).filter(Boolean)
}

export function AddMatchModal({ tournamentId, teams, editMatch, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    dateString: editMatch?.dateString || new Date().toISOString().split('T')[0],
    timeString: editMatch?.timeString || '18:00',
    stadium: editMatch?.stadium || 'Sân Phủi',
    pitchNumber: editMatch?.pitchNumber || 'Sân 1',
    round: editMatch?.round || 'Vòng Bảng',
    status: editMatch?.status || 'Scheduled',
    currentMinute: String(editMatch?.currentMinute || ''),
    facebookLiveUrl: editMatch?.facebookLiveUrl || '',
    homeScore: String(getScore(editMatch, 'home')),
    awayScore: String(getScore(editMatch, 'away')),
    homeTeamName: editMatch?.homeTeam?.name === 'TBA' ? '' : (editMatch?.homeTeam?.name || ''),
    awayTeamName: editMatch?.awayTeam?.name === 'TBA' ? '' : (editMatch?.awayTeam?.name || ''),
  })
  const [incidents, setIncidents] = useState<IncidentForm[]>(
    (editMatch?.incidents || []).map((incident: any) => ({
      minute: String(incident.minute || ''),
      type: normalizeIncidentType(incident.type || incident.incidentType),
      team: String(incident.team || incident.incidentClass || '').toLowerCase().includes('away') ? 'away' : 'home',
      player: incident.playerName || incident.playerOutName || incident.player?.name || incident.player || '',
      playerIn: incident.playerInName || incident.playerIn || '',
    }))
  )

  const availableTeams = useMemo(() => teams.filter(t => t.status === 'Approved' || t.status === 'Confirmed'), [teams])
  const homeRegistration = teams.find(t => t.teamName === form.homeTeamName)
  const awayRegistration = teams.find(t => t.teamName === form.awayTeamName)
  const homePlayers = getPlayers(homeRegistration)
  const awayPlayers = getPlayers(awayRegistration)

  const resolveTeam = (teamName: string, original: any) => {
    const match = teams.find(t => t.teamName === teamName)
    if (match) return { 
      id: match.id, 
      name: match.teamName, 
      logo: match.logo || '', 
      players: match.players || [], 
      coach: match.coach || match.manager || '' 
    }
    if (original?.name === teamName) return original
    return { id: null, name: teamName || 'TBA', logo: '', players: [], coach: '' }
  }

  const updateIncident = (index: number, patch: Partial<IncidentForm>) => {
    setIncidents(items => items.map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  const addIncident = (type: IncidentForm['type']) => {
    const team = 'home'
    const players = homePlayers.length ? homePlayers : awayPlayers
    setIncidents(items => [...items, {
      minute: '',
      type,
      team,
      player: players[0] || '',
    }])
  }

  const removeIncident = (index: number) => {
    setIncidents(items => items.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!form.dateString) return alert('Vui lòng chọn ngày đá')
    const homeScore = Number(form.homeScore || 0)
    const awayScore = Number(form.awayScore || 0)
    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) return alert('Tỉ số không hợp lệ')

    try {
      setLoading(true)
      const payload: any = {
        dateString: form.dateString,
        timeString: form.timeString,
        stadium: form.stadium,
        pitchNumber: form.pitchNumber,
        round: form.round,
        status: form.status,
        currentMinute: form.status === 'Ongoing' ? Number(form.currentMinute || 0) : 0,
        facebookLiveUrl: form.facebookLiveUrl,
        homeTeam: resolveTeam(form.homeTeamName, editMatch?.homeTeam),
        awayTeam: resolveTeam(form.awayTeamName, editMatch?.awayTeam),
        homeScore,
        awayScore,
        score: { home: homeScore, away: awayScore },
        incidents: incidents
          .filter(item => item.type && item.team)
          .map(item => {
            const base = {
              minute: Number(item.minute || 0),
              type: item.type,
              team: item.team,
            };
            if (item.type === 'sub') {
              return { ...base, playerOutName: item.player || 'Chưa rõ', playerInName: item.playerIn || 'Chưa rõ' };
            }
            return { ...base, playerName: item.player || 'Chưa rõ' };
          })
          .sort((a, b) => a.minute - b.minute),
      }

      if (editMatch) {
        await axios.put(`${API}/tournaments/${tournamentId}/matches/${editMatch.id}`, { oldDate: editMatch.dateString, updates: payload }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        alert('Đã cập nhật trận đấu!')
      } else {
        await axios.post(`${API}/tournaments/${tournamentId}/matches`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        alert('Đã thêm trận đấu thành công!')
      }
      onSuccess()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Lỗi thao tác trận đấu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View position="fixed" top={0} left={0} right={0} bottom={0}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <YStack backgroundColor={C.bg as any} borderRadius={20} borderWidth={1} borderColor={C.border as any}
        width={760} maxWidth="100%" maxHeight="92vh"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.9)', overflow: 'hidden' }}>
        <XStack padding="$4" borderBottomWidth={1} borderColor={C.border as any} justifyContent="space-between" alignItems="center">
          <Text color="white" fontSize={18} fontWeight="900">{editMatch ? 'Cập nhật trận đấu' : 'Thêm trận đấu mới'}</Text>
          <View padding={6} onPress={onClose} style={{ cursor: 'pointer' }}><X size={20} color="#888" /></View>
        </XStack>

        <YStack padding="$4" gap="$4" style={{ overflowY: 'auto' }} flex={1}>
          <XStack gap="$3" flexWrap={"wrap" as any}>
            <YStack flex={1} minWidth={170} gap="$2">
              <Text color="#888" fontSize={12} fontWeight="700">Ngày đá</Text>
              <XStack backgroundColor={"rgba(255,255,255,0.05)" as any} borderRadius={10} paddingHorizontal="$3" alignItems="center" gap="$2" borderWidth={1} borderColor={C.border as any}>
                <Calendar size={16} color="#888" />
                <Input unstyled flex={1} height={44} color="white" type="date" style={{ colorScheme: 'dark' }} value={form.dateString} onChangeText={t => setForm({ ...form, dateString: t })} />
              </XStack>
            </YStack>
            <YStack flex={1} minWidth={150} gap="$2">
              <Text color="#888" fontSize={12} fontWeight="700">Giờ đá</Text>
              <XStack backgroundColor={"rgba(255,255,255,0.05)" as any} borderRadius={10} paddingHorizontal="$3" alignItems="center" gap="$2" borderWidth={1} borderColor={C.border as any}>
                <Clock size={16} color="#888" />
                <Input unstyled flex={1} height={44} color="white" type="time" style={{ colorScheme: 'dark' }} value={form.timeString} onChangeText={t => setForm({ ...form, timeString: t })} />
              </XStack>
            </YStack>
            <YStack flex={1} minWidth={160} gap="$2">
              <Text color="#888" fontSize={12} fontWeight="700">Trạng thái</Text>
              <select style={selectStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map(status => <option key={status.value} value={status.value} style={optionStyle}>{status.label}</option>)}
              </select>
            </YStack>
            {(form.status === 'Ongoing' || form.status.includes('half') || form.status === 'penalties') && (
              <YStack width={120} gap="$2">
                <Text color="#888" fontSize={12} fontWeight="700">Phút</Text>
                <Input backgroundColor={"rgba(255,255,255,0.05)" as any} height={42} color="white" type="number" borderRadius={10} borderWidth={1} borderColor={C.border as any}
                  value={form.currentMinute} onChangeText={t => setForm({ ...form, currentMinute: t })} />
              </YStack>
            )}
          </XStack>

          {/* Quick Action Buttons for Match Status */}
          <XStack gap="$2" flexWrap="wrap" marginTop="$-2">
            <Button size="$2" backgroundColor={"rgba(40,167,69,0.15)" as any} borderWidth={1} borderColor={"rgba(40,167,69,0.35)" as any} onPress={() => setForm({ ...form, status: '1st_half', currentMinute: '0' })}>
              <Text color={C.primary as any} fontSize={12} fontWeight="700">Bắt đầu H1</Text>
            </Button>
            <Button size="$2" backgroundColor={"rgba(59,130,246,0.15)" as any} borderWidth={1} borderColor={"rgba(59,130,246,0.35)" as any} onPress={() => setForm({ ...form, status: 'halftime' })}>
              <Text color="#3b82f6" fontSize={12} fontWeight="700">Nghỉ giữa hiệp</Text>
            </Button>
            <Button size="$2" backgroundColor={"rgba(255,165,0,0.15)" as any} borderWidth={1} borderColor={"rgba(255,165,0,0.35)" as any} onPress={() => setForm({ ...form, status: '2nd_half', currentMinute: '30' })}>
              <Text color="#ffa500" fontSize={12} fontWeight="700">Bắt đầu H2</Text>
            </Button>
            <Button size="$2" backgroundColor={"rgba(168,85,247,0.15)" as any} borderWidth={1} borderColor={"rgba(168,85,247,0.35)" as any} onPress={() => setForm({ ...form, status: 'penalties' })}>
              <Text color="#a855f7" fontSize={12} fontWeight="700">Luân lưu (PEN)</Text>
            </Button>
            <Button size="$2" backgroundColor={"rgba(255,77,79,0.15)" as any} borderWidth={1} borderColor={"rgba(255,77,79,0.35)" as any} onPress={() => setForm({ ...form, status: 'Finished' })}>
              <Text color="#ff4d4f" fontSize={12} fontWeight="700">Kết thúc (FT)</Text>
            </Button>
          </XStack>

          <XStack gap="$3" flexWrap={"wrap" as any}>
            <YStack flex={1} minWidth={220} gap="$2">
              <Text color="#888" fontSize={12} fontWeight="700">Tên sân</Text>
              <XStack backgroundColor={"rgba(255,255,255,0.05)" as any} borderRadius={10} paddingHorizontal="$3" alignItems="center" gap="$2" borderWidth={1} borderColor={C.border as any}>
                <MapPin size={16} color="#888" />
                <Input unstyled flex={1} height={44} color="white" backgroundColor="transparent" value={form.stadium} onChangeText={t => setForm({ ...form, stadium: t })} />
              </XStack>
            </YStack>
            <YStack width={140} gap="$2">
              <Text color="#888" fontSize={12} fontWeight="700">Số sân</Text>
              <XStack backgroundColor={"rgba(255,255,255,0.05)" as any} borderRadius={10} paddingHorizontal="$3" alignItems="center" gap="$2" borderWidth={1} borderColor={C.border as any}>
                <Hash size={16} color="#888" />
                <Input unstyled flex={1} height={44} color="white" backgroundColor="transparent" value={form.pitchNumber} onChangeText={t => setForm({ ...form, pitchNumber: t })} />
              </XStack>
            </YStack>
            <YStack flex={1} minWidth={180} gap="$2">
              <Text color="#888" fontSize={12} fontWeight="700">Vòng đấu</Text>
              <Input backgroundColor={"rgba(255,255,255,0.05)" as any} height={44} color="white" paddingHorizontal="$3" borderRadius={10} borderWidth={1} borderColor={C.border as any}
                value={form.round} onChangeText={t => setForm({ ...form, round: t })} />
            </YStack>
          </XStack>

          <YStack gap="$2" padding="$3" backgroundColor={"rgba(255,255,255,0.02)" as any} borderRadius={12} borderWidth={1} borderColor={C.border as any}>
            <Text color="#888" fontSize={12} fontWeight="700">Link Facebook Live (Phát sóng)</Text>
            <Input backgroundColor={"rgba(255,255,255,0.05)" as any} height={44} color="white" paddingHorizontal="$3" borderRadius={10} borderWidth={1} borderColor={C.border as any}
              placeholder="https://www.facebook.com/..." value={form.facebookLiveUrl} onChangeText={t => setForm({ ...form, facebookLiveUrl: t })} />
          </YStack>

          <YStack gap="$3" padding="$3" backgroundColor={"rgba(255,255,255,0.02)" as any} borderRadius={12} borderWidth={1} borderColor={C.border as any}>
            <Text color="white" fontSize={14} fontWeight="900" textAlign="center">Đội bóng và tỉ số</Text>
            <XStack alignItems="flex-end" gap="$3" flexWrap={"wrap" as any}>
              <YStack flex={1} minWidth={220} gap="$2">
                <Text color="#888" fontSize={12} fontWeight="700">Đội nhà</Text>
                <select style={selectStyle} value={form.homeTeamName} onChange={(e) => setForm({ ...form, homeTeamName: e.target.value })}>
                  <option value="" style={optionStyle}>Chọn đội hoặc để trống</option>
                  {availableTeams.map(t => <option key={t.id} value={t.teamName} style={optionStyle}>{t.teamName}</option>)}
                  <option value="TBA" style={optionStyle}>TBA</option>
                </select>
              </YStack>
              <Input width={70} height={42} textAlign="center" backgroundColor={"rgba(255,255,255,0.05)" as any} color="white" type="number" borderRadius={10} borderWidth={1} borderColor={C.border as any}
                value={form.homeScore} onChangeText={t => setForm({ ...form, homeScore: t })} />
              <Text color="#555" fontSize={14} fontWeight="900" paddingBottom="$3">VS</Text>
              <Input width={70} height={42} textAlign="center" backgroundColor={"rgba(255,255,255,0.05)" as any} color="white" type="number" borderRadius={10} borderWidth={1} borderColor={C.border as any}
                value={form.awayScore} onChangeText={t => setForm({ ...form, awayScore: t })} />
              <YStack flex={1} minWidth={220} gap="$2">
                <Text color="#888" fontSize={12} fontWeight="700">Đội khách</Text>
                <select style={selectStyle} value={form.awayTeamName} onChange={(e) => setForm({ ...form, awayTeamName: e.target.value })}>
                  <option value="" style={optionStyle}>Chọn đội hoặc để trống</option>
                  {availableTeams.map(t => <option key={t.id} value={t.teamName} style={optionStyle}>{t.teamName}</option>)}
                  <option value="TBA" style={optionStyle}>TBA</option>
                </select>
              </YStack>
            </XStack>
          </YStack>

          <YStack gap="$3" padding="$3" backgroundColor={"rgba(255,255,255,0.02)" as any} borderRadius={12} borderWidth={1} borderColor={C.border as any}>
            <XStack justifyContent="space-between" alignItems="center" gap="$2" flexWrap={"wrap" as any}>
              <YStack>
                <Text color="white" fontSize={14} fontWeight="900">Diễn biến trận</Text>
                <Text color="#666" fontSize={11}>Dữ liệu này dùng cho vua phá lưới, thẻ phạt và thống kê giải</Text>
              </YStack>
              <XStack gap="$2" flexWrap={"wrap" as any}>
                <Button size="$2" backgroundColor={"rgba(40,167,69,0.15)" as any} borderWidth={1} borderColor={"rgba(40,167,69,0.35)" as any} onPress={() => addIncident('goal')}>
                  <Plus size={13} color={C.primary as any} /><Text color={C.primary as any} fontSize={11} fontWeight="900">Bàn</Text>
                </Button>
                <Button size="$2" backgroundColor={"rgba(255,215,0,0.12)" as any} borderWidth={1} borderColor={"rgba(255,215,0,0.28)" as any} onPress={() => addIncident('yellowCard')}>
                  <Plus size={13} color="#ffd700" /><Text color="#ffd700" fontSize={11} fontWeight="900">Thẻ vàng</Text>
                </Button>
                <Button size="$2" backgroundColor={"rgba(255,77,79,0.12)" as any} borderWidth={1} borderColor={"rgba(255,77,79,0.28)" as any} onPress={() => addIncident('redCard')}>
                  <Plus size={13} color="#ff4d4f" /><Text color="#ff4d4f" fontSize={11} fontWeight="900">Thẻ đỏ</Text>
                </Button>
                <Button size="$2" backgroundColor={"rgba(59,130,246,0.12)" as any} borderWidth={1} borderColor={"rgba(59,130,246,0.28)" as any} onPress={() => addIncident('sub')}>
                  <Plus size={13} color="#3b82f6" /><Text color="#3b82f6" fontSize={11} fontWeight="900">Thay người</Text>
                </Button>
              </XStack>
            </XStack>

            {incidents.length === 0 ? (
              <YStack padding="$4" alignItems="center">
                <Text color="#666" fontSize={13} fontWeight="700">Chưa có diễn biến</Text>
              </YStack>
            ) : incidents.map((incident, index) => {
              const playerOptions = incident.team === 'home' ? homePlayers : awayPlayers
              return (
                <XStack key={index} gap="$2" alignItems="center" flexWrap={"wrap" as any}>
                  <Input width={72} height={38} backgroundColor={"rgba(255,255,255,0.05)" as any} color="white" type="number" placeholder="Phút" borderRadius={10} borderWidth={1} borderColor={C.border as any}
                    value={incident.minute} onChangeText={t => updateIncident(index, { minute: t })} />
                  <select style={{ ...selectStyle, width: 132, height: 38 }} value={incident.type} onChange={(e) => updateIncident(index, { type: e.target.value as any })}>
                    {INCIDENT_OPTIONS.map(type => <option key={type.value} value={type.value} style={optionStyle}>{type.label}</option>)}
                  </select>
                  <select style={{ ...selectStyle, width: 120, height: 38 }} value={incident.team} onChange={(e) => updateIncident(index, { team: e.target.value as any, player: '' })}>
                    <option value="home" style={optionStyle}>Đội nhà</option>
                    <option value="away" style={optionStyle}>Đội khách</option>
                  </select>
                  {incident.type === 'sub' ? (
                    <XStack flex={1} minWidth={180} gap="$2">
                      <select style={{ ...selectStyle, flex: 1, height: 38 }} value={incident.player} onChange={(e) => updateIncident(index, { player: e.target.value })}>
                        <option value="" style={optionStyle}>Ra sân (Out)</option>
                        {playerOptions.map((player: string) => <option key={player} value={player} style={optionStyle}>{player}</option>)}
                      </select>
                      <select style={{ ...selectStyle, flex: 1, height: 38 }} value={incident.playerIn} onChange={(e) => updateIncident(index, { playerIn: e.target.value })}>
                        <option value="" style={optionStyle}>Vào sân (In)</option>
                        {playerOptions.map((player: string) => <option key={player} value={player} style={optionStyle}>{player}</option>)}
                      </select>
                    </XStack>
                  ) : (
                    playerOptions.length > 0 ? (
                      <select style={{ ...selectStyle, flex: 1, minWidth: 180, height: 38 }} value={incident.player} onChange={(e) => updateIncident(index, { player: e.target.value })}>
                        <option value="" style={optionStyle}>Chọn cầu thủ</option>
                        {playerOptions.map((player: string) => <option key={player} value={player} style={optionStyle}>{player}</option>)}
                      </select>
                    ) : (
                      <Input flex={1} minWidth={180} height={38} backgroundColor={"rgba(255,255,255,0.05)" as any} color="white" placeholder="Tên cầu thủ" borderRadius={10} borderWidth={1} borderColor={C.border as any}
                        value={incident.player} onChangeText={t => updateIncident(index, { player: t })} />
                    )
                  )}
                  <Button size="$2" backgroundColor={"rgba(255,77,79,0.12)" as any} borderWidth={1} borderColor={"rgba(255,77,79,0.28)" as any} onPress={() => removeIncident(index)}>
                    <Trash2 size={14} color="#ff4d4f" />
                  </Button>
                </XStack>
              )
            })}
          </YStack>
        </YStack>

        <XStack padding="$4" borderTopWidth={1} borderColor={C.border as any} justifyContent="flex-end" gap="$3">
          <Button size="$4" backgroundColor="transparent" borderWidth={1} borderColor={C.border as any} onPress={onClose}>
            <Text color="white">Thoát</Text>
          </Button>
          <Button size="$4" backgroundColor={C.primary as any} onPress={handleSubmit} disabled={loading} opacity={loading ? 0.7 : 1}>
            {loading ? <Spinner color="white" /> : <Text color="white" fontWeight="900">{editMatch ? 'Lưu thay đổi' : 'Ghi nhận & tạo'}</Text>}
          </Button>
        </XStack>
      </YStack>
    </View>
  )
}
