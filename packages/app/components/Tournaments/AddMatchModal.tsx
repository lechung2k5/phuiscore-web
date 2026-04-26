import React, { useState } from 'react'
import { YStack, XStack, Text, View, Button, Input, Spinner } from 'tamagui'
import { X, Calendar, Clock, MapPin, Hash, Shield } from '@tamagui/lucide-icons'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const C = { primary: '#28a745', bg: '#050807', card: 'rgba(15,22,18,0.85)', border: 'rgba(255,255,255,0.07)' }

interface Props {
  tournamentId: string
  teams: any[] // to render options
  editMatch?: any // data trận đấu nếu đang ở chế độ Sửa
  onClose: () => void
  onSuccess: () => void
}

export function AddMatchModal({ tournamentId, teams, editMatch, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    dateString: editMatch?.dateString || new Date().toISOString().split('T')[0],
    timeString: editMatch?.timeString || '18:00',
    stadium: editMatch?.stadium || 'Sân Phủi',
    pitchNumber: editMatch?.pitchNumber || 'Sân 1',
    round: editMatch?.round || 'Vòng Bảng',
    homeTeamName: editMatch?.homeTeam?.name === 'TBA' ? '' : (editMatch?.homeTeam?.name || ''),
    awayTeamName: editMatch?.awayTeam?.name === 'TBA' ? '' : (editMatch?.awayTeam?.name || '')
  })

  const availableTeams = teams.filter(t => t.status === 'Approved' || t.status === 'Confirmed')

  const handleSubmit = async () => {
    if (!form.dateString) return alert('Vui lòng chọn Ngày')
    try {
      setLoading(true)
      const payload: any = {
        dateString: form.dateString,
        timeString: form.timeString,
        stadium: form.stadium,
        pitchNumber: form.pitchNumber,
        round: form.round,
        homeTeam: { id: null, name: form.homeTeamName || 'TBA', logo: '' },
        awayTeam: { id: null, name: form.awayTeamName || 'TBA', logo: '' }
      }
      
      const homeMatch = teams.find(t => t.teamName === form.homeTeamName)
      if (homeMatch) payload.homeTeam = { id: homeMatch.id, name: homeMatch.teamName, logo: homeMatch.logo || '' }
      else if (editMatch && editMatch.homeTeam?.name === form.homeTeamName) payload.homeTeam = editMatch.homeTeam
      
      const awayMatch = teams.find(t => t.teamName === form.awayTeamName)
      if (awayMatch) payload.awayTeam = { id: awayMatch.id, name: awayMatch.teamName, logo: awayMatch.logo || '' }
      else if (editMatch && editMatch.awayTeam?.name === form.awayTeamName) payload.awayTeam = editMatch.awayTeam

      if (editMatch) {
        await axios.put(`${API}/tournaments/${tournamentId}/matches/${editMatch.id}`, { oldDate: editMatch.dateString, updates: payload }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        alert('Đã cập nhật trận đấu!')
      } else {
        await axios.post(`${API}/tournaments/${tournamentId}/matches`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
        width={500} maxWidth="100%"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.9)' }}>
        
        {/* Header */}
        <XStack padding="$4" borderBottomWidth={1} borderColor={C.border as any} justifyContent="space-between" alignItems="center">
          <Text color="white" fontSize={18} fontWeight="900">{editMatch ? 'Cập Nhật Trận Đấu' : 'Thêm Trận Đấu Mới'}</Text>
          <View padding={6} onPress={onClose} style={{ cursor: 'pointer' }}><X size={20} color="#888" /></View>
        </XStack>

        {/* Body */}
        <YStack padding="$4" gap="$4">
          
          <XStack gap="$3">
            <YStack flex={1} gap="$2">
              <Text color="#888" fontSize={12} fontWeight="700">NGÀY ĐÁ</Text>
              <XStack backgroundColor={"rgba(255,255,255,0.05)" as any} borderRadius={10} paddingHorizontal="$3" alignItems="center" gap="$2" borderWidth={1} borderColor={C.border as any}>
                <Calendar size={16} color="#888" />
                <Input unstyled flex={1} height={44} color="white" type="date"
                  style={{ colorScheme: 'dark' }}
                  value={form.dateString} onChangeText={t => setForm({ ...form, dateString: t })} />
              </XStack>
            </YStack>
            <YStack flex={1} gap="$2">
              <Text color="#888" fontSize={12} fontWeight="700">GIỜ ĐÁ</Text>
              <XStack backgroundColor={"rgba(255,255,255,0.05)" as any} borderRadius={10} paddingHorizontal="$3" alignItems="center" gap="$2" borderWidth={1} borderColor={C.border as any}>
                <Clock size={16} color="#888" />
                <Input unstyled flex={1} height={44} color="white" type="time"
                  style={{ colorScheme: 'dark' }}
                  value={form.timeString} onChangeText={t => setForm({ ...form, timeString: t })} />
              </XStack>
            </YStack>
          </XStack>

          <XStack gap="$3">
             <YStack flex={1} gap="$2">
              <Text color="#888" fontSize={12} fontWeight="700">TÊN SÂN (Vd: Sân Chảo Lửa)</Text>
              <XStack backgroundColor={"rgba(255,255,255,0.05)" as any} borderRadius={10} paddingHorizontal="$3" alignItems="center" gap="$2" borderWidth={1} borderColor={C.border as any}>
                <MapPin size={16} color="#888" />
                <Input unstyled flex={1} height={44} color="white"
                  backgroundColor="transparent"
                  value={form.stadium} onChangeText={t => setForm({ ...form, stadium: t })} />
              </XStack>
            </YStack>
             <YStack width={120} gap="$2">
              <Text color="#888" fontSize={12} fontWeight="700">SỐ SÂN</Text>
              <XStack backgroundColor={"rgba(255,255,255,0.05)" as any} borderRadius={10} paddingHorizontal="$3" alignItems="center" gap="$2" borderWidth={1} borderColor={C.border as any}>
                <Hash size={16} color="#888" />
                <Input unstyled flex={1} height={44} color="white"
                  backgroundColor="transparent"
                  value={form.pitchNumber} onChangeText={t => setForm({ ...form, pitchNumber: t })} />
              </XStack>
            </YStack>
          </XStack>

          <YStack gap="$2">
            <Text color="#888" fontSize={12} fontWeight="700">TÊN VÒNG (Vd: Tứ kết, Vòng 2)</Text>
            <Input backgroundColor={"rgba(255,255,255,0.05)" as any} height={44} color="white" paddingHorizontal="$3" borderRadius={10} borderWidth={1} borderColor={C.border as any}
                  value={form.round} onChangeText={t => setForm({ ...form, round: t })} />
          </YStack>

          <YStack gap="$3" marginTop="$2" padding="$3" backgroundColor={"rgba(255,255,255,0.02)" as any} borderRadius={12} borderWidth={1} borderColor={C.border as any}>
            <Text color="white" fontSize={14} fontWeight="900" textAlign="center">XÁC ĐỊNH ĐỘI BÓNG</Text>
            
            <XStack alignItems="center" gap="$3">
              <YStack flex={1} gap="$2">
                <Text color="#888" fontSize={12} fontWeight="700">ĐỘI NHÀ</Text>
                <select 
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', height: 44, borderRadius: 10, padding: '0 12px', width: '100%', outline: 'none' }}
                  value={form.homeTeamName} onChange={(e) => setForm({ ...form, homeTeamName: e.target.value })}
                >
                  <option value="" style={{ background: '#111', color: 'white' }}>...Chọn đội hoặc Trống...</option>
                  {availableTeams.map(t => (
                    <option key={t.id} value={t.teamName} style={{ background: '#111', color: 'white' }}>{t.teamName}</option>
                  ))}
                  <option value="TBA" style={{ background: '#111', color: 'white' }}>TBA (Đợi xác định)</option>
                </select>
              </YStack>

              <Text color="#555" fontSize={14} fontWeight="900" marginTop="$5">VS</Text>

              <YStack flex={1} gap="$2">
                <Text color="#888" fontSize={12} fontWeight="700">ĐỘI KHÁCH</Text>
                <select 
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', height: 44, borderRadius: 10, padding: '0 12px', width: '100%', outline: 'none' }}
                  value={form.awayTeamName} onChange={(e) => setForm({ ...form, awayTeamName: e.target.value })}
                >
                  <option value="" style={{ background: '#111', color: 'white' }}>...Chọn đội hoặc Trống...</option>
                  {availableTeams.map(t => (
                    <option key={t.id} value={t.teamName} style={{ background: '#111', color: 'white' }}>{t.teamName}</option>
                  ))}
                  <option value="TBA" style={{ background: '#111', color: 'white' }}>TBA (Đợi xác định)</option>
                </select>
              </YStack>
            </XStack>
          </YStack>

        </YStack>

        {/* Footer */}
        <XStack padding="$4" borderTopWidth={1} borderColor={C.border as any} justifyContent="flex-end" gap="$3">
          <Button size="$4" backgroundColor="transparent" borderWidth={1} borderColor={C.border as any} onPress={onClose}>
            <Text color="white">Thoát</Text>
          </Button>
          <Button size="$4" backgroundColor={C.primary as any} onPress={handleSubmit} disabled={loading} opacity={loading ? 0.7 : 1}>
            {loading ? <Spinner color="white" /> : <Text color="white" fontWeight="900">{editMatch ? 'Lưu Thay Đổi' : 'Ghi Nhận & Tạo'}</Text>}
          </Button>
        </XStack>
      </YStack>
    </View>
  )
}

