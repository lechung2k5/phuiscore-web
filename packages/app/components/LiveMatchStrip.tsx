"use client"
import { useEffect, useState } from 'react'
import { XStack, YStack, Text, View, useMedia, Spinner } from 'tamagui'
import { ChevronRight } from '@tamagui/lucide-icons'
import { LiveMatchCard } from './LiveMatchCard'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')

export const LiveMatchStrip = () => {
  const media = useMedia()
  const isMobile = !media.gtMd

  const [liveMatches, setLiveMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLiveMatches = async () => {
      try {
        const today = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).split(',')[0]
        const res = await axios.get(`${API}/matches/${today}`)
        if (res.data.success) {
          const allMatches = res.data.data.flatMap((group: any) => group.matches || [])
          
          const nowSec = Math.floor(Date.now() / 1000)
          const MATCH_DURATION_SEC = 110 * 60 // 110 phút (bao gồm hiệp phụ buffer)

          // Lọc trận đang đá: status live/in_progress HOẶC thời gian đang trong khoảng thi đấu
          const activeMatches = allMatches.filter((m: any) => {
            // Đã kết thúc hoặc bị huỷ → bỏ qua
            if (m.status === 'finished' || m.status === 'canceled' || m.status === 'postponed') return false
            // Status rõ ràng là live → lấy
            if (m.status === 'live' || m.status === 'inprogress' || m.status === 'in_progress') return true
            // Chưa bắt đầu nhưng thời gian đã qua startTimestamp và chưa quá 110 phút
            if (m.startTimestamp) {
              const elapsed = nowSec - m.startTimestamp
              return elapsed >= 0 && elapsed <= MATCH_DURATION_SEC
            }
            return false
          })
          
          const formatted = activeMatches.map((m: any) => {
            // Extract ID from sk (MATCH#12345) or use id/_id
            const rawId = m.sk || m._id || m.id || "";
            const cleanId = rawId.includes('#') ? rawId.split('#')[1] : rawId;

            return {
               id: cleanId,
               league: m.tournamentName || "Giải đấu Khác",
               time: m.time || "00:00",
               currentPeriod: m.currentPeriod || m.currentMinute || "",
               status: m.status,
               startTimestamp: m.startTimestamp,
               teamA: {
                 name: m.homeTeam?.name || m.homeTeamName || 'Đội Nhà',
                 logo: m.homeTeam?.logo || m.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=home'
               },
               teamB: {
                 name: m.awayTeam?.name || m.awayTeamName || 'Đội Khách',
                 logo: m.awayTeam?.logo || m.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=away'
               },
               scoreA: m.homeScore ?? m.score?.home ?? 0,
               scoreB: m.awayScore ?? m.score?.away ?? 0
            }
          })
          
          setLiveMatches(formatted)
        }
      } catch (error) {
        console.error("Lỗi khi fetch live match:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveMatches()
    // Có thể bổ sung interval để fetch lại mỗi phút nếu cần
    const interval = setInterval(fetchLiveMatches, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
     return (
        <YStack alignItems="center" justifyContent="center" paddingVertical="$10">
           <Spinner size="large" color="#ff4d4f" />
        </YStack>
     )
  }

  if (!liveMatches || liveMatches.length === 0) return null

  return (
    <YStack
      width="100%"
      maxWidth={1200}
      marginHorizontal="auto"
      gap={isMobile ? "$4" : "$6"}
      paddingHorizontal={isMobile ? "$3" : "$4"}
      marginTop={isMobile ? "$6" : "$10"}
    >
      {/* Section Header */}
      <XStack justifyContent="space-between" alignItems="center">
        <XStack gap="$2" alignItems="center">
          <View
            width={5} height={24}
            backgroundColor="#ff4d4f"
            borderRadius={3}
            style={{ boxShadow: '0 0 10px rgba(255,77,79,0.6)' }}
          />
          <Text color="white" fontWeight="900" fontSize={isMobile ? 18 : 24} letterSpacing={0.3}>
            ĐANG TRỰC TIẾP
          </Text>
          <View
            backgroundColor="rgba(255,77,79,0.15)"
            paddingHorizontal={8}
            paddingVertical={3}
            borderRadius={20}
            borderWidth={1}
            borderColor={"rgba(255,77,79,0.3)" as any}
          >
            <Text color="#ff4d4f" fontSize={11} fontWeight="900">{liveMatches.length}</Text>
          </View>
        </XStack>

        <XStack
          alignItems="center"
          gap="$1"
          cursor="pointer"
          hoverStyle={{ opacity: 0.7 } as any}
        >
          <Text color="#666" fontWeight="700" fontSize={13}>Tất cả</Text>
          <ChevronRight size={15} color="#666" />
        </XStack>
      </XStack>

      {/* Cards — vertical on mobile, grid on desktop */}
      {isMobile ? (
        <YStack gap="$3">
          {liveMatches.map((match) => (
            <LiveMatchCard key={match.id} {...match} />
          ))}
        </YStack>
      ) : (
        <XStack flexWrap={"wrap" as any} gap="$4" alignItems="stretch">
          {liveMatches.map((match) => (
            <View
              key={match.id}
              flexGrow={1}
              width="31%"
              $ltLg={{ width: "48%" } as any}
              minWidth={280}
            >
              <LiveMatchCard {...match} />
            </View>
          ))}
        </XStack>
      )}
    </YStack>
  )
}
