"use client"
import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, Button, Input, Sheet, Image, Spinner, ScrollView, View } from 'tamagui'
import { X, Upload, Shield, CheckCircle2 } from '@tamagui/lucide-icons'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const C = { primary: '#28a745', bgDark: '#0a0f0d', cardDark: '#121714', borderDark: '#1a1f1c', textGray: '#eee', subText: '#888' }

export const EditTeamModal = ({ 
  open, 
  setOpen, 
  teamData, 
  onSuccess 
}: { 
  open: boolean, 
  setOpen: (o: boolean) => void, 
  teamData: any, 
  onSuccess: () => void 
}) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '', short_name: '', leader: '', phone: '', area: '', 
    primary_color: '', secondary_color: '', slogan: '', logo_url: ''
  })

  useEffect(() => {
    if (open && teamData) {
      setFormData({
        name: teamData.name || '',
        short_name: teamData.short_name || '',
        leader: teamData.leader || '',
        phone: teamData.phone || '',
        area: teamData.area || '',
        primary_color: teamData.primary_color || '',
        secondary_color: teamData.secondary_color || '',
        slogan: teamData.slogan || '',
        logo_url: teamData.logo_url || teamData.logo || ''
      })
    }
  }, [open, teamData])

  // Upload Logo
  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setFormData(prev => ({ ...prev, logo_url: res.data.url }))
        }
      } catch (err) {
        console.error("Lỗi upload logo:", err)
        alert("Upload thất bại")
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.leader) {
      alert("Vui lòng nhập Tên đội và Đội trưởng")
      return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.put(`${API}/teams/${teamData.id || teamData._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert("Cập nhật đội thành công!")
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error(error)
      alert("Lỗi khi cập nhật đội. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet modal open={open} onOpenChange={setOpen} snapPoints={[90]} dismissOnSnapToBottom position={0}>
      <Sheet.Overlay backgroundColor="rgba(0,0,0,0.85)" />
      <Sheet.Frame backgroundColor={C.bgDark as any} padding="$0" borderTopLeftRadius={24} borderTopRightRadius={24}>
        
        {/* Header */}
        <XStack padding="$4" borderBottomWidth={1} borderColor={C.borderDark as any} justifyContent="space-between" alignItems="center" backgroundColor={C.cardDark as any} borderTopLeftRadius={24} borderTopRightRadius={24}>
          <Text color="white" fontSize={18} fontWeight="800">Chỉnh sửa Đội Bóng</Text>
          <Button size="$3" chromeless icon={<X color="white" />} onPress={() => setOpen(false)} />
        </XStack>

        <ScrollView padding="$5" flex={1}>
          <YStack maxWidth={600} marginHorizontal="auto" width="100%" gap="$5" paddingBottom="$10">
            
            {/* Logo Upload Zone */}
            <YStack alignItems="center" gap="$3">
              <View position="relative" width={100} height={100} borderRadius={50} overflow="hidden" backgroundColor="rgba(255,255,255,0.05)" borderWidth={2} borderColor={formData.logo_url ? C.primary : ("rgba(255,255,255,0.1)" as any)} alignItems="center" justifyContent="center" onPress={() => document.getElementById('edit_team_logo_upload')?.click()} style={{ cursor: 'pointer' }}>
                {formData.logo_url ? (
                  <Image src={formData.logo_url} width="100%" height="100%" style={{ objectFit: 'cover' } as any} />
                ) : (
                  <Shield size={40} color="#555" />
                )}
                {loading && <View position="absolute" top={0} left={0} right={0} bottom={0} backgroundColor="rgba(0,0,0,0.5)" alignItems="center" justifyContent="center"><Spinner color={C.primary} /></View>}
              </View>
              <Button size="$3" backgroundColor="rgba(255,255,255,0.1)" hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.2)' } as any} icon={<Upload size={16} color="white" />} onPress={() => document.getElementById('edit_team_logo_upload')?.click()}>
                <Text color="white" fontWeight="600">Thay đổi Logo / Huy hiệu</Text>
              </Button>
              <input type="file" id="edit_team_logo_upload" style={{ display: 'none' }} accept="image/*" onChange={handleUploadLogo} />
            </YStack>

            {/* Form Fields */}
            <XStack gap="$4" flexWrap="wrap">
              <YStack gap="$2" flex={1} minWidth={250}>
                <Text color={C.textGray as any} fontSize={14} fontWeight="600">Tên Đội bóng <Text color="#e74c3c">*</Text></Text>
                <Input backgroundColor="transparent" borderWidth={1} borderColor={C.borderDark as any} color="white" placeholder="VD: FC Phủi Thủ Đức" value={formData.name} onChangeText={t => setFormData({...formData, name: t})} />
              </YStack>

              <YStack gap="$2" flex={1} minWidth={250}>
                <Text color={C.subText as any} fontSize={14} fontWeight="600">Tên viết tắt (Dùng trên Mobile/BXH)</Text>
                <Input backgroundColor="transparent" borderWidth={1} borderColor={C.borderDark as any} color="white" placeholder="VD: PTD" maxLength={8} value={formData.short_name} onChangeText={t => setFormData({...formData, short_name: t.toUpperCase()})} />
              </YStack>
            </XStack>

            <XStack gap="$4" flexWrap="wrap">
              <YStack gap="$2" flex={1} minWidth={250}>
                <Text color={C.textGray as any} fontSize={14} fontWeight="600">Người Quản Lý / HLV <Text color="#e74c3c">*</Text></Text>
                <Input backgroundColor="transparent" borderWidth={1} borderColor={C.borderDark as any} color="white" placeholder="VD: Nguyễn Văn A" value={formData.leader} onChangeText={t => setFormData({...formData, leader: t})} />
              </YStack>

              <YStack gap="$2" flex={1} minWidth={250}>
                <Text color={C.textGray as any} fontSize={14} fontWeight="600">Khu vực hoạt động</Text>
                <Input backgroundColor="transparent" borderWidth={1} borderColor={C.borderDark as any} color="white" placeholder="VD: Quận 9, TP.HCM" value={formData.area} onChangeText={t => setFormData({...formData, area: t})} />
              </YStack>
            </XStack>

            <XStack gap="$4" flexWrap="wrap">
              <YStack gap="$2" flex={1} minWidth={150}>
                <Text color={C.subText as any} fontSize={14} fontWeight="600">SĐT Liên hệ</Text>
                <Input backgroundColor="transparent" borderWidth={1} borderColor={C.borderDark as any} color="white" keyboardType="phone-pad" placeholder="09xxxx" value={formData.phone} onChangeText={t => setFormData({...formData, phone: t})} />
              </YStack>
              <YStack gap="$2" flex={1} minWidth={150}>
                <Text color={C.subText as any} fontSize={14} fontWeight="600">Màu áo chính</Text>
                <Input backgroundColor="transparent" borderWidth={1} borderColor={C.borderDark as any} color="white" placeholder="Xanh / Trắng" value={formData.primary_color} onChangeText={t => setFormData({...formData, primary_color: t})} />
              </YStack>
            </XStack>

            <YStack gap="$2">
              <Text color={C.subText as any} fontSize={14} fontWeight="600">Slogan / Khẩu hiệu</Text>
              <Input backgroundColor="transparent" borderWidth={1} borderColor={C.borderDark as any} color="white" placeholder="Ra sân là chiến..." value={formData.slogan} onChangeText={t => setFormData({...formData, slogan: t})} />
            </YStack>

            {/* Submit */}
            <Button marginTop="$4" size="$5" backgroundColor={C.primary as any} onPress={handleSubmit} disabled={loading} opacity={loading ? 0.7 : 1} icon={loading ? <Spinner color="white" /> : <CheckCircle2 color="white" />}>
              <Text color="white" fontWeight="800" fontSize={16}>{loading ? 'Đang xử lý...' : 'LƯU THAY ĐỔI'}</Text>
            </Button>

          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  )
}

