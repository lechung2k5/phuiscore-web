"use client"
import React, { useState } from 'react'
import { YStack, XStack, Text, Button, Input, Sheet, Spinner, ScrollView, View, Image } from 'tamagui'
import { X, CheckCircle2, Upload, User } from '@tamagui/lucide-icons'
import axios from 'axios'

const API = 'http://localhost:5000/api'
const C = { primary: '#28a745', bgDark: '#0a0f0d', cardDark: '#121714', borderDark: '#1a1f1c', textGray: '#eee', subText: '#888' }

export const AddMemberModal = ({ open, setOpen, teamId, onSuccess }: { open: boolean, setOpen: (o: boolean) => void, teamId: string, onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '', shirtNumber: '', position: '', role: 'player', birthYear: '', hometown: '', phone: '', avatar: ''
  })

  // --- UPLOAD AVATAR ---
  const handleUploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target?.result
      setLoading(true)
      try {
        const res = await axios.post(`${API}/upload/tournament-file`, {
          base64, filename: file.name, mimeType: file.type
        })
        if (res.data.success) {
          setFormData(prev => ({ ...prev, avatar: res.data.url }))
        }
      } catch (err) {
        console.error("Lỗi upload avatar:", err)
        alert("Upload thất bại")
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      alert("Vui lòng nhập Tên cầu thủ")
      return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      // Parse các field số trước khi gửi lên API (DynamoDB GSI yêu cầu kiểu N)
      const payload = {
        ...formData,
        teamId,
        shirtNumber: formData.shirtNumber ? Number(formData.shirtNumber) : undefined,
        birthYear: formData.birthYear ? Number(formData.birthYear) : undefined,
      }

      await axios.post(`${API}/team-members`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert("Đã thêm cầu thủ!")
      setOpen(false)
      onSuccess()
      setFormData({ name: '', shirtNumber: '', position: '', role: 'player', birthYear: '', hometown: '', phone: '', avatar: '' })
    } catch (e: any) {
      alert("Lỗi: " + (e.response?.data?.message || e.message || 'Không thể thêm'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet modal open={open} onOpenChange={setOpen} snapPoints={[85]} dismissOnSnapToBottom position={0}>
      <Sheet.Overlay backgroundColor="rgba(0,0,0,0.85)" />
      <Sheet.Frame backgroundColor={C.bgDark as any} padding="$0" borderTopLeftRadius={24} borderTopRightRadius={24}>
        
        {/* Header */}
        <XStack padding="$4" borderBottomWidth={1} borderColor={C.borderDark as any} justifyContent="space-between" alignItems="center" backgroundColor={C.cardDark as any} borderTopLeftRadius={24} borderTopRightRadius={24}>
          <Text color="white" fontSize={18} fontWeight="800">Thêm Cầu Thủ Mới</Text>
          <Button size="$3" chromeless icon={<X color="white" />} onPress={() => setOpen(false)} />
        </XStack>

        <ScrollView padding="$5" flex={1}>
          <YStack maxWidth={500} marginHorizontal="auto" width="100%" gap="$5" paddingBottom="$10">
            
            {/* Avatar Upload Zone */}
            <YStack alignItems="center" gap="$3">
              <View position="relative" width={80} height={80} borderRadius={40} overflow="hidden" backgroundColor="rgba(255,255,255,0.05)" borderWidth={2} borderColor={formData.avatar ? C.primary : ("rgba(255,255,255,0.1)" as any)} alignItems="center" justifyContent="center">
                {formData.avatar ? (
                  <Image src={formData.avatar} width="100%" height="100%" style={{ objectFit: 'cover' } as any} />
                ) : (
                  <User size={30} color="#555" />
                )}
                {loading && <View position="absolute" top={0} left={0} right={0} bottom={0} backgroundColor="rgba(0,0,0,0.5)" alignItems="center" justifyContent="center"><Spinner color={C.primary} /></View>}
              </View>
              <Button size="$3" backgroundColor="rgba(255,255,255,0.1)" hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.2)' } as any} icon={<Upload size={16} color="white" />} onPress={() => document.getElementById('player_avatar_upload')?.click()}>
                <Text color="white" fontWeight="600">Tải ảnh đại diện</Text>
              </Button>
              <input type="file" id="player_avatar_upload" style={{ display: 'none' }} accept="image/*" onChange={handleUploadAvatar} />
            </YStack>

            <YStack gap="$2">
              <Text color={C.textGray as any} fontSize={14} fontWeight="600">Họ và Tên <Text color="#e74c3c">*</Text></Text>
              <Input backgroundColor="transparent" borderWidth={1} borderColor={C.borderDark as any} color="white" placeholder="VD: Nguyễn Văn A" value={formData.name} onChangeText={t => setFormData({...formData, name: t})} />
            </YStack>

            <XStack gap="$4" flexWrap="wrap">
              <YStack gap="$2" flex={1} minWidth={150}>
                <Text color={C.textGray as any} fontSize={14} fontWeight="600">Số Áo</Text>
                <Input backgroundColor="transparent" borderWidth={1} borderColor={C.borderDark as any} color="white" keyboardType="numeric" placeholder="VD: 10" value={formData.shirtNumber} onChangeText={t => setFormData({...formData, shirtNumber: t})} />
                <Text color={C.subText as any} fontSize={12}>* Chỉ điền số (thường từ 1-99)</Text>
              </YStack>

              <YStack gap="$2" flex={1} minWidth={150}>
                <Text color={C.textGray as any} fontSize={14} fontWeight="600">Vị trí thi đấu</Text>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${C.borderDark}`,
                    color: formData.position ? 'white' : '#888',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                >
                  <option value="" disabled style={{ color: 'black' }}>Chọn vị trí...</option>
                  <option value="Tiền đạo" style={{ color: 'black' }}>Tiền đạo (ST/CF)</option>
                  <option value="Tiền vệ" style={{ color: 'black' }}>Tiền vệ (CM/CAM/CDM)</option>
                  <option value="Chạy cánh" style={{ color: 'black' }}>Chạy cánh (LW/RW/LM/RM)</option>
                  <option value="Hậu vệ" style={{ color: 'black' }}>Hậu vệ (CB/LB/RB)</option>
                  <option value="Thủ môn" style={{ color: 'black' }}>Thủ môn (GK)</option>
                  <option value="Khác" style={{ color: 'black' }}>Khác</option>
                </select>
                <Text color={C.subText as any} fontSize={12}>* VD: CB, CM, CF, GK, Tiền đạo</Text>
              </YStack>
            </XStack>

            <XStack gap="$4" flexWrap="wrap">
              <YStack gap="$2" flex={1} minWidth={150}>
                <Text color={C.textGray as any} fontSize={14} fontWeight="600">Vai trò</Text>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${C.borderDark}`,
                    color: 'white',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                >
                  <option value="player" style={{ color: 'black' }}>Cầu thủ (Player)</option>
                  <option value="captain" style={{ color: 'black' }}>Đội trưởng / BCS (Captain)</option>
                  <option value="coach" style={{ color: 'black' }}>Huấn luyện viên (Coach)</option>
                </select>
                <Text color={C.subText as any} fontSize={12}>* Chọn vai trò trong đội</Text>
              </YStack>

              <YStack gap="$2" flex={1} minWidth={150}>
                <Text color={C.textGray as any} fontSize={14} fontWeight="600">Năm sinh</Text>
                <Input backgroundColor="transparent" borderWidth={1} borderColor={C.borderDark as any} color="white" keyboardType="numeric" placeholder="VD: 1999" value={formData.birthYear} onChangeText={t => setFormData({...formData, birthYear: t})} />
                <Text color={C.subText as any} fontSize={12}>* 4 chữ số, VD: 1996</Text>
              </YStack>
            </XStack>

            <XStack gap="$4" flexWrap="wrap">
              <YStack gap="$2" flex={1} minWidth={150}>
                <Text color={C.textGray as any} fontSize={14} fontWeight="600">Quê quán</Text>
                <Input backgroundColor="transparent" borderWidth={1} borderColor={C.borderDark as any} color="white" placeholder="VD: Hà Nội, Nghệ An..." value={formData.hometown} onChangeText={t => setFormData({...formData, hometown: t})} />
              </YStack>

              <YStack gap="$2" flex={1} minWidth={150}>
                <Text color={C.textGray as any} fontSize={14} fontWeight="600">Số Điện Thoại</Text>
                <Input backgroundColor="transparent" borderWidth={1} borderColor={C.borderDark as any} color="white" keyboardType="phone-pad" placeholder="09xxxx..." value={formData.phone} onChangeText={t => setFormData({...formData, phone: t})} />
              </YStack>
            </XStack>

            {/* Submit */}
            <Button marginTop="$4" size="$5" backgroundColor={C.primary as any} onPress={handleSubmit} disabled={loading} opacity={loading ? 0.7 : 1} icon={loading ? <Spinner color="white" /> : <CheckCircle2 color="white" />}>
              <Text color="white" fontWeight="800" fontSize={16}>{loading ? 'Đang thêm...' : 'THÊM CẦU THỦ'}</Text>
            </Button>

          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  )
}