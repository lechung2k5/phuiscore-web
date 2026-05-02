"use client"
import { useEffect, useState } from 'react'
import { XStack, YStack, Text, View, useMedia, Spinner } from 'tamagui'
import { ChevronRight } from '@tamagui/lucide-icons'
import { LiveMatchCard } from './LiveMatchCard'
import { Link } from 'solito/link'
import axios from 'axios'
import { getImageUrl } from '../utils/image'
import { API_BASE } from '../utils/api-config'

const API = API_BASE

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

          // Lọc trận đang đá: Chỉ lấy các trận thực sự LIVE hoặc INPROGRESS và chưa quá giờ
          const now = Math.floor(Date.now() / 1000);
          const activeMatches = allMatches.filter((m: any) => {
            const status = String(m.status || "").toLowerCase();
            
            // 1. Đã kết thúc hoặc bị huỷ → bỏ qua ngay
            if (['finished', 'canceled', 'postponed', 'closed', 'ended'].includes(status)) return false;
            
            // 2. Kiểm tra thời gian trôi qua (Safety Check)
            if (m.startTimestamp) {
              const elapsed = now - m.startTimestamp;
              
              // Nếu trận đấu đã bắt đầu quá 180 phút (3 tiếng) -> Coi như đã xong, ẩn khỏi Live
              if (elapsed > 180 * 60) return false;

              // Nếu trận đấu chưa bắt đầu (còn hơn 15 phút nữa mới đá) -> Không hiện ở Live
              if (elapsed < -15 * 60) return false;
            }

            // 3. Ưu tiên LIVE từ bảng điều khiển media hoặc status crawler
            if (['inprogress', 'live', 'in_progress'].includes(status)) return true;

            // 4. Các trận sắp đá trong vòng 30 phút tới -> Đưa lên mục LIVE để user chuẩn bị
            if (m.startTimestamp && (m.startTimestamp - now <= 30 * 60) && (m.startTimestamp > now)) return true;
            
            // 5. Nếu không có status nhưng đã bắt đầu chưa quá 3 tiếng -> Coi là LIVE
            if (m.startTimestamp && (now - m.startTimestamp > 0) && (now - m.startTimestamp < 180 * 60)) return true;
            
            return false;
          }).sort((a: any, b: any) => {
            const diffA = Math.abs(now - (a.startTimestamp || 0));
            const diffB = Math.abs(now - (b.startTimestamp || 0));
            return diffA - diffB;
          });
          
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
                 logo: getImageUrl(m.homeTeam?.logo || m.homeTeamLogo, 'logo', m.homeTeam?.id)
               },
               teamB: {
                 name: m.awayTeam?.name || m.awayTeamName || 'Đội Khách',
                 logo: getImageUrl(m.awayTeam?.logo || m.awayTeamLogo, 'logo', m.awayTeam?.id)
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

  const [showAll, setShowAll] = useState(false)
  const displayedMatches = showAll ? liveMatches : liveMatches.slice(0, 15)

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

        <Link href="/truc-tiep" style={{ textDecoration: 'none' }}>
            <XStack
                alignItems="center"
                gap="$1"
                cursor="pointer"
                hoverStyle={{ opacity: 0.7 } as any}
            >
                <Text color="#666" fontWeight="700" fontSize={13}>Tất cả</Text>
                <ChevronRight size={15} color="#666" />
            </XStack>
        </Link>
      </XStack>

      {/* Cards — vertical on mobile, grid on desktop */}
      {isMobile ? (
        <YStack gap="$3">
          {displayedMatches.map((match) => (
            <LiveMatchCard key={match.id} {...match} />
          ))}
        </YStack>
      ) : (
        <XStack flexWrap={"wrap" as any} gap="$4" alignItems="stretch">
          {displayedMatches.map((match) => (
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

      {/* Nút Xem thêm nếu còn trận chưa hiển thị */}
      {!showAll && liveMatches.length > 15 && (
          <View 
            marginTop="$4" 
            alignSelf="center"
            paddingHorizontal="$6"
            paddingVertical="$3"
            borderRadius={100}
            borderWidth={1}
            borderColor="rgba(255,77,79,0.4)"
            backgroundColor="rgba(255,77,79,0.05)"
            hoverStyle={{ backgroundColor: 'rgba(255,77,79,0.15)', borderColor: '#ff4d4f', scale: 1.02 } as any}
            pressStyle={{ scale: 0.98 } as any}
            cursor="pointer"
            onPress={() => setShowAll(true)}
            style={{ transition: 'all 0.2s' } as any}
          >
              <Text color="#ff4d4f" fontWeight="900" fontSize={13}>
                XEM THÊM {liveMatches.length - 15} TRẬN ĐANG DIỄN RA
              </Text>
          </View>
      )}
    </YStack>
  )
}
