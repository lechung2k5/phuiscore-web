"use client"
import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, Button, Card, View, Avatar, H2, H4, ScrollView, Separator, Spinner } from 'tamagui'
import { MapPin, Phone, Mail, Calendar, ShieldCheck, Trophy, Star, ArrowLeft, Edit3 } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'

const COLORS: any = {
  green: '#28a745',
  bgDark: '#0a0f0d',
  cardBg: '#111613',
  borderDark: '#1a221e',
  textGray: '#888',
  gold: '#FFD700'
}

const FONT_BODY = 'var(--font-be-vietnam), sans-serif' as any

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    fetchUserProfile()
  }, [params.id])

  const fetchUserProfile = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
      const response = await fetch(`${API}/auth/profile/${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setUserData(data)
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Lỗi kết nối Profile API")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <YStack flex={1} backgroundColor={COLORS.bgDark as any} justifyContent="center" alignItems="center">
      <Spinner size="large" color={COLORS.green as any} />
      <Text color="white" mt="$4" fontFamily={FONT_BODY}>Đang tải hồ sơ cầu thủ...</Text>
    </YStack>
  )

  if (!userData) return <Text color="white">Không tìm thấy dữ liệu.</Text>

  return (
    <ScrollView backgroundColor={COLORS.bgDark as any} flex={1}>
      <YStack padding="$4" maxWidth={800} width="100%" marginHorizontal="auto" gap="$6" py="$8">
        
        {/* Nút Quay lại */}
        <XStack alignItems="center" gap="$2" cursor="pointer" onPress={() => router.push('/')}>
          <ArrowLeft size={18} color={COLORS.green as any} />
          <Text color={COLORS.green as any} fontWeight="700">Quay lại trang chủ</Text>
        </XStack>

        {/* HEADER CARD */}
        <Card 
          {...({ animation: "bouncy", enterStyle: { opacity: 0, scale: 0.9, y: 10 } } as any)}
          backgroundColor={COLORS.cardBg as any} borderRadius="$10" padding="$8" borderWidth={1} borderColor={COLORS.borderDark as any}
        >
          <XStack gap="$6" alignItems="center" $ltSm={{ flexDirection: 'column', textAlign: 'center' } as any}>
            <Avatar circular size="$10" borderWidth={4} borderColor={COLORS.green as any}>
              <Avatar.Image src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=28a745&color=fff&size=256` as any} />
              <Avatar.Fallback backgroundColor={"$gray5" as any} />
            </Avatar>

            <YStack flex={1} gap="$2">
              <XStack alignItems="center" gap="$3" $ltSm={{ justifyContent: 'center' } as any}>
                <H2 color="white" fontWeight="900" fontFamily={FONT_BODY}>{userData.fullName}</H2>
                <View backgroundColor={userData.plan === 'FREE' ? COLORS.green : COLORS.gold} px="$2" py="$0.5" borderRadius="$4">
                  <Text color="black" fontSize={10} fontWeight="900">{userData.plan}</Text>
                </View>
              </XStack>
              
              <Text color={COLORS.textGray as any} fontSize={16} fontWeight="600">@{userData.username}</Text>
              
              <XStack gap="$4" mt="$2" $ltSm={{ justifyContent: 'center' } as any}>
                <XStack alignItems="center" gap="$1">
                  <ShieldCheck size={16} color={COLORS.green as any} />
                  <Text color="white" fontSize={14} fontWeight="700">{userData.role === 'MANAGER' ? 'Đội trưởng' : 'Cầu thủ'}</Text>
                </XStack>
                <XStack alignItems="center" gap="$1">
                  <Star size={16} color={COLORS.gold as any} />
                  <Text color="white" fontSize={14} fontWeight="700">Hạng Phủi: Bạc</Text>
                </XStack>
              </XStack>
            </YStack>

            <Button icon={<Edit3 size={18} />} backgroundColor="#1a1f1c" borderRadius="$8" $ltSm={{ width: '100%' } as any}>
              Chỉnh sửa
            </Button>
          </XStack>
        </Card>

        {/* STATS SECTION */}
        <XStack gap="$4" $ltSm={{ flexDirection: 'column' } as any}>
          <StatCard 
            icon={<Trophy color={COLORS.green as any} />} 
            label="Giải đấu" 
            value={`${userData.usage.leaguesCreated}/${userData.usage.limitLeagues}`} 
            sub="Lượt tạo giải còn lại"
          />
          <StatCard 
            icon={<Star color={COLORS.green as any} />} 
            label="Trận đấu" 
            value={`${userData.usage.matchesCreated}/${userData.usage.limitMatches}`} 
            sub="Lượt tạo trận còn lại"
          />
        </XStack>

        {/* DETAIL INFO */}
        <Card backgroundColor={COLORS.cardBg as any} borderRadius="$10" padding="$8" borderWidth={1} borderColor={COLORS.borderDark as any}>
          <YStack gap="$5">
            <H4 color="white" fontWeight="800" mb="$2">Thông tin liên lạc</H4>
            <InfoRow icon={<Mail size={20} color={COLORS.textGray as any} />} label="Email" value={userData.email} />
            <Separator borderColor={COLORS.borderDark as any} />
            <InfoRow icon={<Phone size={20} color={COLORS.textGray as any} />} label="Số điện thoại" value={userData.phoneNumber} />
            <Separator borderColor={COLORS.borderDark as any} />
            <InfoRow icon={<MapPin size={20} color={COLORS.textGray as any} />} label="Khu vực" value="TP. Hồ Chí Minh" />
            <Separator borderColor={COLORS.borderDark as any} />
            <InfoRow icon={<Calendar size={20} color={COLORS.textGray as any} />} label="Ngày tham gia" value={new Date(userData.createdAt).toLocaleDateString('vi-VN')} />
          </YStack>
        </Card>

      </YStack>
    </ScrollView>
  )
}

const StatCard = ({ icon, label, value, sub }: any) => (
  <Card flex={1} backgroundColor={COLORS.cardBg as any} padding="$5" borderRadius="$10" borderWidth={1} borderColor={COLORS.borderDark as any} alignItems="center" gap="$2">
    {icon}
    <Text color={COLORS.textGray as any} fontWeight="700" fontSize={12}>{label.toUpperCase()}</Text>
    <Text color="white" fontWeight="900" fontSize={24}>{value}</Text>
    <Text color={COLORS.textGray as any} fontSize={11}>{sub}</Text>
  </Card>
)

const InfoRow = ({ icon, label, value }: any) => (
  <XStack justifyContent="space-between" alignItems="center">
    <XStack alignItems="center" gap="$3">
      {icon}
      <Text color={COLORS.textGray as any} fontWeight="600">{label}</Text>
    </XStack>
    <Text color="white" fontWeight="700">{value}</Text>
  </XStack>
)