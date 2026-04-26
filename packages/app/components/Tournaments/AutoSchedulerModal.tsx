import React, { useState } from 'react'
import { YStack, XStack, Text, Button, View, Input, Spinner, ScrollView } from 'tamagui'
import { Calendar, Clock, Map, Settings, Play, Plus, X, Trash2 } from '@tamagui/lucide-icons'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const COLORS = {
  primary: '#28a745',
  bgDark: '#0a0f0d',
  card: 'rgba(15,22,18,0.95)',
  border: 'rgba(255,255,255,0.08)'
}

export const AutoSchedulerModal = ({ 
  tournamentId, 
  onClose, 
  onSuccess 
}: { 
  tournamentId: string, 
  onClose: () => void,
  onSuccess: () => void
}) => {
  const [loading, setLoading] = useState(false)
  const [configs, setConfigs] = useState([
    {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      slots: [{ id: Date.now().toString() + '1', time: '18:00', pitchesCount: '2' }]
    }
  ])

  const addDay = () => {
    setConfigs([...configs, {
      id: Date.now().toString(),
      date: '',
      slots: [{ id: Date.now().toString() + '1', time: '18:00', pitchesCount: '2' }]
    }])
  }

  const removeDay = (dayId: string) => {
    setConfigs(configs.filter(c => c.id !== dayId))
  }

  const addSlot = (dayId: string) => {
    setConfigs(configs.map(c => {
      if (c.id === dayId) {
        return { ...c, slots: [...c.slots, { id: Date.now().toString(), time: '19:00', pitchesCount: '2' }] }
      }
      return c
    }))
  }

  const removeSlot = (dayId: string, slotId: string) => {
    setConfigs(configs.map(c => {
      if (c.id === dayId) {
        return { ...c, slots: c.slots.filter(s => s.id !== slotId) }
      }
      return c
    }))
  }

  const updateDayDate = (dayId: string, date: string) => {
    setConfigs(configs.map(c => c.id === dayId ? { ...c, date } : c))
  }

  const updateSlot = (dayId: string, slotId: string, field: 'time' | 'pitchesCount', value: string) => {
    setConfigs(configs.map(c => {
      if (c.id === dayId) {
        return {
          ...c,
          slots: c.slots.map(s => s.id === slotId ? { ...s, [field]: value } : s)
        }
      }
      return c
    }))
  }

  const handleSchedule = async () => {
    // Validate
    if (configs.length === 0) return alert('Vui lòng thêm ít nhất 1 ngày thi đấu!')
    const slotsConfig = configs.map(c => ({
      date: c.date,
      slots: c.slots.map(s => ({ time: s.time, pitchesCount: s.pitchesCount }))
    }))

    for (const c of slotsConfig) {
      if (!c.date) return alert('Vui lòng chọn ngày thi đấu cho tất cả các nhóm!')
      if (c.slots.length === 0) return alert(`Ngày ${c.date} chưa có khung giờ thi đấu nào!`)
      for (const s of c.slots) {
        if (!s.time || !s.pitchesCount) return alert(`Vui lòng nhập đầy đủ giờ và số sân cho ngày ${c.date}!`)
      }
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await axios.post(`${API}/tournaments/${tournamentId}/auto-schedule`, { slotsConfig }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(`Thành công! Đã xếp lịch ${res.data.data?.length || 0} trận đấu.`)
      onSuccess()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi xếp lịch! Kiểm tra số lượng sân có đáp ứng đủ số lượng trận đấu không.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View
      position="fixed" top={0} left={0} right={0} bottom={0}
      backgroundColor="rgba(0,0,0,0.8)" style={{ backdropFilter: 'blur(10px)', zIndex: 9999 }}
      alignItems="center" justifyContent="center" padding="$4"
    >
      <YStack
        width="100%" maxWidth={600} maxHeight="90vh"
        backgroundColor={COLORS.card as any}
        borderRadius={20} borderWidth={1} borderColor={COLORS.border as any}
        padding="$5" gap="$5" flex={1}
      >
        <YStack gap="$1" paddingBottom="$3" borderBottomWidth={1} borderColor={COLORS.border as any} flexShrink={0}>
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap="$2">
              <Settings size={22} color={COLORS.primary as any} />
              <Text color="white" fontSize={20} fontWeight="900">Xếp Lịch Tự Động Giải Phủi</Text>
            </XStack>
            <View onPress={onClose} style={{ cursor: 'pointer' }} padding="$2" backgroundColor="rgba(255,255,255,0.05)" borderRadius={20}>
              <X size={18} color="#aaa" />
            </View>
          </XStack>
          <Text color="#888" fontSize={13}>Cấp phép các Slot (Ngày, Giờ, Sân). Hệ thống sẽ tự động gắp trận đấu vòng bảng, nhánh đấu và trộn vào các Slot hợp lệ theo thuật toán Greedy.</Text>
        </YStack>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: '$4', paddingBottom: 20 }}>
          {configs.map((dayConfig, dIndex) => (
            <YStack key={dayConfig.id} backgroundColor="rgba(255,255,255,0.02)" borderRadius={16} borderWidth={1} borderColor="rgba(255,255,255,0.05)" padding="$4" gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="white" fontSize={14} fontWeight="900">📅 Ngày thi đấu {dIndex + 1}</Text>
                {configs.length > 1 && (
                  <View onPress={() => removeDay(dayConfig.id)} style={{ cursor: 'pointer' }} padding="$1.5">
                    <Trash2 size={16} color="#ff4d4f" />
                  </View>
                )}
              </XStack>

              <XStack alignItems="center" gap="$3">
                <Calendar size={16} color="#aaa" />
                <Input
                  type="date"
                  value={dayConfig.date}
                  onChangeText={t => updateDayDate(dayConfig.id, t)}
                  backgroundColor="rgba(255,255,255,0.05)"
                  color="white" borderWidth={0} borderRadius={10} flex={1} height={42}
                />
              </XStack>

              <YStack gap="$2" marginTop="$2">
                <Text color="#888" fontSize={12} fontWeight="700">CÁC CA THI ĐẤU (SLOT)</Text>
                {dayConfig.slots.map((slot, sIndex) => (
                  <XStack key={slot.id} alignItems="center" gap="$3" backgroundColor="rgba(0,0,0,0.3)" padding="$2" borderRadius={10}>
                    <YStack gap="$1" flex={1}>
                      <Text color="#aaa" fontSize={10} fontWeight="700">GIỜ BẮT ĐẦU</Text>
                      <XStack alignItems="center" gap="$2" backgroundColor="rgba(255,255,255,0.05)" borderRadius={8} paddingHorizontal="$2">
                        <Clock size={14} color="#888" />
                        <Input
                          type="time"
                          value={slot.time}
                          onChangeText={t => updateSlot(dayConfig.id, slot.id, 'time', t)}
                          backgroundColor="transparent" color="white" borderWidth={0} flex={1} height={36} paddingHorizontal={0}
                        />
                      </XStack>
                    </YStack>
                    <YStack gap="$1" flex={0.8}>
                      <Text color="#aaa" fontSize={10} fontWeight="700">SỐ LƯỢNG SÂN</Text>
                      <XStack alignItems="center" gap="$2" backgroundColor="rgba(255,255,255,0.05)" borderRadius={8} paddingHorizontal="$2">
                        <Map size={14} color="#888" />
                        <Input
                          keyboardType="numeric"
                          value={slot.pitchesCount}
                          onChangeText={t => updateSlot(dayConfig.id, slot.id, 'pitchesCount', t)}
                          backgroundColor="transparent" color="white" borderWidth={0} flex={1} height={36} paddingHorizontal={0}
                        />
                      </XStack>
                    </YStack>
                    <View onPress={() => removeSlot(dayConfig.id, slot.id)} style={{ cursor: 'pointer', padding: 8 }}>
                      <X size={16} color="#666" />
                    </View>
                  </XStack>
                ))}
                
                <Button alignSelf="flex-start" size="$3" backgroundColor="rgba(40,167,69,0.1)" borderWidth={1} borderColor="rgba(40,167,69,0.3)" borderRadius={10} icon={<Plus size={14} color={COLORS.primary as any} />} onPress={() => addSlot(dayConfig.id)} marginTop="$2">
                  <Text color={COLORS.primary as any} fontSize={12} fontWeight="700">Thêm Ca Mới</Text>
                </Button>
              </YStack>
            </YStack>
          ))}

          <Button alignSelf="center" size="$4" backgroundColor="transparent" borderWidth={1} borderColor="rgba(255,255,255,0.2)" borderRadius={12} icon={<Plus size={16} color="white" />} onPress={addDay} marginTop="$2" width="100%">
            <Text color="white" fontWeight="700">Thêm Ngày Thi Đấu</Text>
          </Button>
        </ScrollView>

        <YStack flexShrink={0} paddingTop="$3" borderTopWidth={1} borderColor={COLORS.border as any}>
          {loading ? (
            <YStack alignItems="center" gap="$3" padding="$4">
              <Spinner size="large" color={COLORS.primary as any} />
              <Text color={COLORS.primary as any} fontWeight="700">Hệ thống AI đang nhồi lịch chống đụng giờ...</Text>
            </YStack>
          ) : (
            <XStack gap="$3" marginTop="$2">
              <Button
                flex={1} backgroundColor="transparent" borderWidth={1} borderColor={"#444" as any}
                borderRadius={12} onPress={onClose} height={50}
              >
                <Text color="white">Hủy bỏ</Text>
              </Button>
              <Button
                flex={1} backgroundColor={COLORS.primary as any} borderRadius={12} height={50}
                icon={<Play size={18} color="white" />} onPress={handleSchedule}
              >
                <Text color="white" fontWeight="700" fontSize={15}>Bắt đầu rải lịch</Text>
              </Button>
            </XStack>
          )}
        </YStack>
      </YStack>
    </View>
  )
}

