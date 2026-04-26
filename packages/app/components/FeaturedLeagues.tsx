"use client"
import { useEffect, useState } from 'react'
import { YStack, XStack, Text, View, Image, Card, useMedia, Spinner } from 'tamagui'
import { ChevronRight, MapPin, CalendarDays } from '@tamagui/lucide-icons'
import axios from 'axios'
import { useRouter } from 'solito/navigation'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')

const COLORS = {
  primary: '#28a745',
  bgCard: 'rgba(18, 24, 20, 0.8)',
  border: 'rgba(255, 255, 255, 0.07)',
}

export const FeaturedLeagues = () => {
  const media = useMedia()
  const isMobile = !media.gtMd
  const router = useRouter()

  const [leagues, setLeagues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await axios.get(`${API}/tournaments/list`)
        if (res.data.success) {
          // Trích xuất list giải đấu
          const fetchedLeagues = res.data.data.map((t: any) => ({
            id: t._id || t.id,
            name: t.name || 'Giải bóng đá Mặc định',
            category: t.format || 'Hệ thống Phủi',
            location: t.location || 'Toàn quốc',
            image: t.logo || t.banner || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=800',
            desc: t.description || 'Giải đấu chuyên nghiệp và uy tín.',
            participants: (t.teams || []).slice(0, 3).map((team: any) => team.logo || 'https://api.dicebear.com/7.x/identicon/svg?seed=team'),
            totalTeams: t.settings?.maxTeams || t.teams?.length || 8,
            status: t.status === 'publish' ? 'Đang diễn ra' : t.status === 'draft' ? 'Sắp khởi tranh' : 'Đã kết thúc'
          }))
          setLeagues(fetchedLeagues)
        }
      } catch (err) {
        console.error("Lỗi khi fetch FeaturedLeagues:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeagues()
  }, [])

  if (loading) {
     return (
        <YStack alignItems="center" justifyContent="center" paddingVertical="$10">
           <Spinner size="large" color={COLORS.primary} />
        </YStack>
     )
  }

  if (leagues.length === 0) return null

  return (
    <YStack
      width="100%"
      maxWidth={1200}
      marginHorizontal="auto"
      marginTop={isMobile ? "$6" : "$10"}
      marginBottom={isMobile ? "$8" : "$12"}
      paddingHorizontal={isMobile ? "$3" : "$4"}
      gap={isMobile ? "$4" : "$6"}
    >
      {/* Section Header */}
      <XStack justifyContent="space-between" alignItems="center">
        <XStack gap="$2" alignItems="center">
          <View width={5} height={24} backgroundColor={COLORS.primary as any} borderRadius={3} style={{ boxShadow: '0 0 10px rgba(40,167,69,0.5)' }} />
          <Text color="white" fontWeight="900" fontSize={isMobile ? 18 : 24} letterSpacing={0.3}>
            GIẢI ĐẤU NỔI BẬT
          </Text>
        </XStack>
        <XStack alignItems="center" gap="$1" cursor="pointer" hoverStyle={{ opacity: 0.7 } as any} onPress={() => router.push('/giai-dau/tim-kiem')}>
          <Text color="#666" fontWeight="700" fontSize={13}>Tất cả</Text>
          <ChevronRight size={15} color="#666" />
        </XStack>
      </XStack>

      {/* Cards — vertical on mobile, grid on desktop */}
      {isMobile ? (
        <YStack gap="$3">
          {leagues.map((league) => (
            <LeagueCard key={league.id} league={league} isMobile router={router} />
          ))}
        </YStack>
      ) : (
        <XStack flexWrap={"wrap" as any} gap="$5" alignItems="stretch">
          {leagues.map((league) => (
            <View
              key={league.id}
              flexGrow={1}
              width="31%"
              $ltLg={{ width: "48%" } as any}
              minWidth={280}
            >
              <LeagueCard league={league} isMobile={false} router={router} />
            </View>
          ))}
        </XStack>
      )}
    </YStack>
  )
}

const LeagueCard = ({ league, isMobile, router }: any) => {
  const isOngoing = league.status === 'Đang diễn ra'

  const cardProps: any = {
    animation: 'lazy',
    hoverStyle: { y: -4, borderColor: 'rgba(40,167,69,0.25)' },
    pressStyle: { scale: 0.98 },
    onPress: () => router.push(`/giai-dau/${league.id}`)
  }

  return (
    <Card
      {...cardProps}
      backgroundColor={COLORS.bgCard as any}
      borderRadius={"$5" as any}
      overflow="hidden"
      borderWidth={1}
      borderColor={COLORS.border as any}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {/* Image */}
      <View width="100%" height={isMobile ? 150 : 195} position="relative">
        <Image
          src={league.image}
          width="100%" height="100%"
          style={{ objectFit: 'cover' } as any}
        />
        {/* Gradient bottom fade */}
        <View
          position="absolute" left={0} right={0} bottom={0} height={80}
          style={{ background: 'linear-gradient(to top, rgba(18,24,20,1) 0%, transparent 100%)' }}
        />
        {/* Badges */}
        <XStack position="absolute" top={10} left={10} right={10} justifyContent="space-between" alignItems="flex-start">
          <View backgroundColor={COLORS.primary as any} paddingHorizontal={10} paddingVertical={4} borderRadius={20}>
            <Text color="white" fontSize={10} fontWeight="900" letterSpacing={0.8}>
              {league.category}
            </Text>
          </View>
          {isOngoing && (
            <XStack backgroundColor={"rgba(255,77,79,0.85)" as any} paddingHorizontal={8} paddingVertical={4} borderRadius={20} alignItems="center" gap={5}>
              <View width={5} height={5} borderRadius={3} backgroundColor={"white" as any} style={{ animation: 'blinker 1s infinite' }} />
              <Text color="white" fontSize={9} fontWeight="900">LIVE</Text>
            </XStack>
          )}
        </XStack>
      </View>

      {/* Content */}
      <YStack padding={isMobile ? "$3" : "$4"} paddingTop="$2" gap="$2">
        <Text color="white" fontSize={isMobile ? 17 : 20} fontWeight="900" numberOfLines={1} letterSpacing={-0.3}>
          {league.name}
        </Text>

        <XStack alignItems="center" gap="$3" opacity={0.6}>
          <XStack alignItems="center" gap="$1">
            <MapPin size={11} color="white" />
            <Text color="white" fontSize={11} fontWeight="600">{league.location}</Text>
          </XStack>
          <View width={1} height={10} backgroundColor="rgba(255,255,255,0.2)" />
          <XStack alignItems="center" gap="$1">
            <CalendarDays size={11} color="white" />
            <Text color="white" fontSize={11} fontWeight="600">{league.status}</Text>
          </XStack>
        </XStack>

        {!isMobile && (
          <Text color="#888" fontSize={13} lineHeight={20} numberOfLines={2} fontWeight="400">
            {league.desc}
          </Text>
        )}

        {/* Footer */}
        <XStack justifyContent="space-between" alignItems="center" marginTop="$2" paddingTop="$2" borderTopWidth={1} borderColor={COLORS.border as any}>
          <XStack alignItems="center" gap="$2">
            <XStack>
              {league.participants.slice(0, 3).map((avatar: string, i: number) => (
                <Image
                  key={avatar} src={avatar}
                  width={24} height={24} borderRadius={12}
                  marginLeft={i === 0 ? 0 : -8}
                  borderWidth={2} borderColor={COLORS.bgCard as any}
                />
              ))}
            </XStack>
            <Text color="#555" fontSize={11} fontWeight="600">{league.totalTeams} đội</Text>
          </XStack>
          <XStack alignItems="center" gap="$1">
            <Text color={COLORS.primary as any} fontSize={13} fontWeight="800">Chi tiết</Text>
            <ChevronRight size={14} color={COLORS.primary as any} />
          </XStack>
        </XStack>
      </YStack>
    </Card>
  )
}
