"use client"
import React, { useState, useEffect, useMemo } from 'react'
import {
  ScrollView, YStack, XStack, Text, Button, Image,
  Spinner, View, Dialog, Adapt, Input, Sheet, Separator, useMedia
} from 'tamagui'
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Clock, ChevronRight as ChevronRightIcon, Star, ChevronDown, ChevronUp
} from '@tamagui/lucide-icons'
import axios from 'axios'
import { Link } from 'solito/link'
import { generateMatchSlug } from '../utils/slug'
import { API_BASE } from '../utils/api-config'

// Components

// Alias
const YS: any = YStack; const XS: any = XStack; const T: any = Text;
const BTN: any = Button; const IMG: any = Image;
const DLG: any = Dialog; const SH: any = Sheet; const IPT: any = Input;
const SEP: any = Separator; const V: any = View;

const API_BASE_URL = API_BASE

const THEME_COLORS: any = {
  bgDark: '#0a0f0d',
  cardDark: '#121714',
  borderDark: '#1a1f1c',
  logoGreen: '#28a745',
  liveRed: '#ff4d4d',
  liveOrange: '#f5a623'
}

const blinkStyles = `
  @keyframes blinker {
    0% { opacity: 1; }
    50% { opacity: 0.3; }
    100% { opacity: 1; }
  }
`;

// Danh sách các giải đấu ưu tiên (ID SofaScore)
// Ví dụ: 17 (Premier League), 8 (La Liga), 23 (Serie A), 34 (Ligue 1), 35 (Bundesliga)
const PRIORITY_LEAGUE_IDS = [17, 8, 23, 35, 34, 7, 676];

export default function MatchSchedulePage() {
  const media = useMedia()
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 10);
    return localISOTime;
  })
  const [leagues, setLeagues] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Quản lý các giải đấu đang được mở rộng
  const [expandedLeagues, setExpandedLeagues] = useState<Record<string, boolean>>({})

  useEffect(() => { setMounted(true) }, [])

  // LOGIC CŨ: Tạo dải ngày
  const dateRange = useMemo(() => {
    const count = media.gtMd ? 7 : 3
    const offset = Math.floor(count / 2)
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(selectedDate)
      d.setDate(d.getDate() + i - offset)
      return {
        full: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('vi-VN', { weekday: 'short' }).toUpperCase(),
        dateStr: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      }
    })
  }, [selectedDate, media.gtMd])

  // LOGIC MỚI: Phân tách giải ưu tiên/đang LIVE và giải cỏ
  const { topLeagues, minorLeagues } = useMemo(() => {
    const top: any[] = [];
    const minor: any[] = [];
    const nowSec = Math.floor(Date.now() / 1000)

    leagues.forEach(league => {
      // 1. Sắp xếp trận đấu bên trong giải: Live > Not Started > Finished
      const sortedMatches = [...league.matches].sort((a: any, b: any) => {
        const getStatusOrder = (m: any) => {
          if (m.status === 'inprogress' || m.status === 'live' || m.status === 'in_progress') return 0;
          if (m.status === 'notstarted' || m.status === 'not_started') return 1;
          if (m.status === 'finished') return 2;
          return 3;
        };
        return getStatusOrder(a) - getStatusOrder(b);
      });

      const processedLeague = { ...league, matches: sortedMatches };
      
      const hasLiveMatch = league.matches.some((m: any) => {
        if (m.liveStatus === 'inprogress' || m.liveStatus === 'live') return true;
        if (m.status === 'inprogress' || m.status === 'live' || m.status === 'in_progress') return true;
        return false;
      });
      const isPriority = PRIORITY_LEAGUE_IDS.includes(Number(league.id));

      if (hasLiveMatch || isPriority) {
        top.push(processedLeague);
      } else {
        minor.push(processedLeague);
      }
    });

    return { topLeagues: top, minorLeagues: minor };
  }, [leagues]);

// Tìm và thay thế hàm fetchMatches cũ bằng đoạn này:
  const fetchMatches = React.useCallback(async (date: string, isPolling = false) => {
    if (!isPolling) setLoading(true) // Chỉ hiện Spinner khi đổi ngày, không hiện khi đang update ngầm
    try {
      const res = await axios.get(`${API_BASE_URL}/matches/${date}`)
      if (res.data.success) {
        setLeagues(res.data.data)
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔌 THIẾT LẬP SOCKET.IO CHO DANH SÁCH
  useEffect(() => {
    if (!mounted) return
    const { socket } = require('../utils/socket')
    
    socket.connect()

    socket.on('scoreUpdate', (updatedData: any) => {
        setLeagues(prevLeagues => {
            return prevLeagues.map(league => {
                // Kiểm tra xem trận đấu cập nhật có thuộc giải này không
                const matchIndex = league.matches.findIndex((m: any) => String(m.id) === String(updatedData.matchId || updatedData.id));
                
                if (matchIndex !== -1) {
                    const newMatches = [...league.matches];
                    newMatches[matchIndex] = {
                        ...newMatches[matchIndex],
                        ...updatedData,
                        // Đảm bảo các trường điểm số đồng bộ
                        score: updatedData.score || {
                            home: updatedData.homeScore,
                            away: updatedData.awayScore
                        }
                    };
                    return { ...league, matches: newMatches };
                }
                return league;
            });
        });
    });

    return () => {
        socket.off('matchUpdate')
        socket.disconnect()
    }
  }, [mounted])

  // Tự động cập nhật mỗi 2 phút một lần (Dự phòng cho Socket)
  useEffect(() => {
    if (!mounted) return
    
    fetchMatches(selectedDate)

    const todayStr = new Date().toISOString().split('T')[0]
    let interval: any

    if (selectedDate === todayStr) {
      interval = setInterval(() => {
        fetchMatches(selectedDate, true) 
      }, 120000)
    }

    return () => { if (interval) clearInterval(interval) }
  }, [selectedDate, mounted, fetchMatches])

  const handleStepDay = (step: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + step)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const toggleLeague = (id: string) => {
    setExpandedLeagues(prev => ({ ...prev, [id]: !prev[id] }));
  }

  if (!mounted) return null

  return (
    <YS f={1} backgroundColor={THEME_COLORS.bgDark}>

      <YS width="100%" maxWidth={1250} marginHorizontal="auto" f={1} py="$6" px="$0">
        <XS ai="center" jc="center" mb="$8" px={media.gtSm ? "$4" : "$2"} width="100%">
          <XS
            backgroundColor="#111" borderWidth={1} borderColor={THEME_COLORS.borderDark}
            borderRadius={12} overflow="hidden" width="100%" height={84} elevation={4}
            flexDirection="row" alignItems="center"
          >
            <BTN unstyled width={58} ai="center" jc="center" onPress={() => handleStepDay(-1)} hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <ChevronLeft size={24} color="#888" />
            </BTN>

            <XS flex={1} flexDirection="row" alignItems="center">
              {dateRange.map((item: any) => {
                const isActive = selectedDate === item.full
                const isToday = item.full === new Date().toISOString().split('T')[0]
                return (
                  <BTN
                    key={item.full} unstyled onPress={() => setSelectedDate(item.full)}
                    backgroundColor="transparent" flex={1} ai="center" jc="center" paddingVertical="$3"
                    pressStyle={{ opacity: 0.7 }}
                  >
                    <YS ai="center" jc="center" gap="$2" position="relative">
                      <T color={isActive ? THEME_COLORS.logoGreen : (isToday ? "#aaa" : "#777")} fontSize={11} fontWeight="700">{item.dayName}</T>
                      <T color={isActive ? "#ffffff" : (isToday ? "#ddd" : "#bbb")} fontSize={20} fontWeight="900">{item.dateStr}</T>
                      {isActive && <View position="absolute" bottom={0} left={12} right={12} height={3} backgroundColor={THEME_COLORS.logoGreen} borderRadius={2} />}
                    </YS>
                  </BTN>
                )
              })}
            </XS>

            <BTN unstyled width={58} ai="center" jc="center" onPress={() => handleStepDay(1)} hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <ChevronRight size={24} color="#888" />
            </BTN>

            <SEP vertical height="55%" borderColor="#222" marginVertical="auto" />

            <DLG open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DLG.Trigger asChild>
                <BTN unstyled width={62} ai="center" jc="center" hoverStyle={{ backgroundColor: 'rgba(40,167,69,0.15)' }}>
                  <CalendarIcon size={24} color={THEME_COLORS.logoGreen} />
                </BTN>
              </DLG.Trigger>
              <Adapt when="sm" platform="touch">
                <SH modal dismissOnSnapToBottom>
                  <SH.Frame p="$4" backgroundColor={THEME_COLORS.bgDark} borderRadius={25}><Adapt.Contents /></SH.Frame>
                  <SH.Overlay backgroundColor="rgba(0,0,0,0.8)" />
                </SH>
              </Adapt>
              <DLG.Portal>
                <DLG.Overlay opacity={0.9} backgroundColor="black" animation="quick" />
                <DLG.Content backgroundColor="#fff" borderRadius="$6" padding="$0" width={380} alignSelf="center" elevate animation="quick">
                  <YS padding="$5" backgroundColor="white" borderTopLeftRadius={24} borderTopRightRadius={24} borderBottomWidth={1} borderColor="#eee">
                    <XS justifyContent="space-between" alignItems="center" marginBottom="$4">
                      <BTN unstyled onPress={() => handleStepDay(-30)}><ChevronLeft size={20} color="black" /></BTN>
                      <T color="black" fontWeight="900" fontSize={18}>Chọn Ngày</T>
                      <BTN unstyled onPress={() => handleStepDay(30)}><ChevronRight size={20} color="black" /></BTN>
                    </XS>
                    <IPT type="date" value={selectedDate} onChange={(e: any) => setSelectedDate(e.target.value)} backgroundColor="#f5f5f5" color="black" fontSize={16} height={55} borderWidth={0} borderRadius="$3" paddingHorizontal="$4" />
                  </YS>
                  <YS padding="$4" backgroundColor="white" borderBottomLeftRadius={24} borderBottomRightRadius={24}>
                    <BTN backgroundColor={THEME_COLORS.logoGreen} onPress={() => setIsDialogOpen(false)} height={55} borderRadius="$3">
                      <T color="white" fontWeight="900">XÁC NHẬN</T>
                    </BTN>
                  </YS>
                </DLG.Content>
              </DLG.Portal>
            </DLG>
          </XS>
        </XS>

        {/* DANH SÁCH TRẬN ĐẤU */}
        {loading ? (
          <YS flex={1} height={400} justifyContent="center" alignItems="center">
            <Spinner size="large" color={THEME_COLORS.logoGreen} />
          </YS>
        ) : (
          <YS gap="$4" marginBottom="$12" paddingHorizontal={media.gtSm ? "$4" : "$2"}>
            {leagues.length === 0 && (
              <YS alignItems="center" justifyContent="center" paddingVertical="$20" gap="$4">
                <V backgroundColor="#111" padding="$8" borderRadius={100}><Clock size={60} color="#333" /></V>
                <T color="#555" fontWeight="800" fontSize={18}>CHƯA CÓ TRẬN ĐẤU</T>
              </YS>
            )}

            {/* 1. HIỂN THỊ CÁC GIẢI ĐẤU ƯU TIÊN (MẶC ĐỊNH MỞ) */}
            {topLeagues.map((league) => (
              <LeagueContainer 
                key={league.id} 
                league={league} 
                isExpandedDefault={true} 
              />
            ))}

            {/* 2. HIỂN THỊ CÁC GIẢI CỎ (MẶC ĐỊNH ĐÓNG) */}
            {minorLeagues.length > 0 && (
              <YS mt="$8">
                <T color="#666" fontSize={11} fontWeight="800" ml="$3" mb="$4" letterSpacing={1}>CÁC GIẢI ĐẤU KHÁC</T>
                {minorLeagues.map((league) => (
                  <LeagueContainer 
                    key={league.id} 
                    league={league} 
                    isExpandedDefault={expandedLeagues[league.id] || false}
                    onToggle={() => toggleLeague(league.id)}
                  />
                ))}
              </YS>
            )}
          </YS>
        )}
      </YS>
    </YS>
  )
}

const LeagueContainer = ({ league, isExpandedDefault, onToggle }: any) => {
  const [isOpen, setIsOpen] = useState(isExpandedDefault);
  const nowSec = Math.floor(Date.now() / 1000)
  const MATCH_DURATION_SEC = 110 * 60

  const liveMatchCount = league.matches.filter((m: any) => {
    if (m.status === 'finished' || m.status === 'canceled' || m.status === 'postponed') return false
    if (m.status === 'inprogress' || m.status === 'live' || m.status === 'in_progress') return true
    if (m.startTimestamp) {
      const elapsed = nowSec - m.startTimestamp
      return elapsed >= 0 && elapsed <= MATCH_DURATION_SEC
    }
    return false
  }).length;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
      setIsOpen(!isOpen);
    } else {
      setIsOpen(!isOpen);
    }
  }

  return (
    <YS marginBottom="$4">
      {/* Tiêu đề giải đấu - Clickable */}
      <BTN 
        unstyled 
        onPress={handleToggle} 
        backgroundColor="#111" 
        padding="$3" 
        borderRadius={12}
        borderWidth={1}
        borderColor={isOpen ? "#222" : "#1a1a1a"}
        pressStyle={{ opacity: 0.8 }}
      >
        <XS alignItems="center" justifyContent="space-between">
          <XS alignItems="center" gap="$3">
            <V padding="$1.5" backgroundColor="#161616" borderRadius={8}>
              <IMG src={league.logo} width={18} height={18} style={{ objectFit: 'contain' }} />
            </V>
            <YS>
              <T color="#fff" fontWeight="800" fontSize={13} letterSpacing={0.5}>
                {typeof league.name === 'string' ? league.name.toUpperCase() : 'GIẢI ĐẤU'}
              </T>
              <T color="#666" fontSize={9} fontWeight="700">{league.matches.length} TRẬN ĐẤU</T>
            </YS>
          </XS>
          
          <XS ai="center" gap="$3">
            {liveMatchCount > 0 && (
              <XS bc="rgba(245, 166, 35, 0.1)" px="$2" py="$0.5" br={4} ai="center">
                <V w={4} h={4} br={2} bc="#f5a623" mr="$1.5" />
                <T color="#f5a623" fontSize={10} fontWeight="900">{liveMatchCount} LIVE</T>
              </XS>
            )}
            {isOpen ? <ChevronUp size={16} color="#444" /> : <ChevronDown size={16} color="#444" />}
          </XS>
        </XS>
      </BTN>

      {/* Danh sách trận đấu - Chỉ render khi được mở */}
      {isOpen && (
        <YS mt="$2" backgroundColor="#141414" borderRadius={12} overflow="hidden" elevation={4} shadowColor="#000">
          {league.matches.map((match: any, idx: number) => (
            <MatchRow key={match.id} match={match} isLast={idx === league.matches.length - 1} />
          ))}
        </YS>
      )}
    </YS>
  )
}

// Layout Desktop
// Layout Desktop - giữ nguyên như code bạn gửi
const MatchRowDesktop = ({ match, isLast }: any) => {
  const nowSec = Math.floor(Date.now() / 1000)
  const MATCH_DURATION_SEC = 110 * 60

  const isLive = (match.status === 'inprogress' || match.status === 'live' || match.status === 'in_progress') || 
                (match.status !== 'finished' && match.status !== 'canceled' && match.startTimestamp && (nowSec - match.startTimestamp >= 0) && (nowSec - match.startTimestamp <= MATCH_DURATION_SEC))
  
  const isFinished = match.status === 'finished'

  let timeDisplay = ""
  if (isLive) {
    if (match.currentMinute) {
      timeDisplay = match.currentMinute
    } else if (match.startTimestamp) {
      const elapsed = Math.floor((nowSec - match.startTimestamp) / 60)
      if (elapsed > 90) timeDisplay = "90+'"
      else if (elapsed > 45 && elapsed < 60) timeDisplay = "HT"
      else timeDisplay = `${elapsed}'`
    } else {
      timeDisplay = "Đang đá"
    }
  } else if (isFinished) {
    timeDisplay = "FT"
  } else {
    timeDisplay = new Date(match.startTimestamp * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  const timeLabel = timeDisplay;

  return (
    <XS
      alignItems="center"
      paddingVertical="$3"
      paddingHorizontal="$4"
      borderBottomWidth={isLast ? 0 : 1}
      borderColor="#1a1a1a"
      hoverStyle={{ backgroundColor: "#141414" }}
      width="100%"
      opacity={isFinished ? 0.5 : 1}
    >
      <style>{blinkStyles}</style>
      
      <V width={80} alignItems="center">
        <T
          fontSize={13}
          fontWeight="800"
          color={isLive ? "#f5a623" : "#888"}
          // 2. GỌI ĐÚNG TÊN 'blinker' ĐÃ ĐỊNH NGHĨA Ở TRÊN
          style={isLive ? { animation: 'blinker 1s linear infinite' } : {}}
        >
          {timeLabel}
        </T>
      </V>

      {/* Phần giữa: Tên nhà + Tỉ số + Tên khách - tỉ số center cố định */}
      <XS flex={1} flexDirection="row" alignItems="center" justifyContent="center" gap="$6">
        {/* Tên + logo nhà - căn phải sát tỉ số */}
        <XS flex={1} justifyContent="flex-end" alignItems="center" gap="$3" maxWidth={300}>
            <T
              fontSize={15}
              fontWeight="700"
              numberOfLines={1}
              textAlign="right"
            >
              {typeof match.homeTeam?.name === 'string' ? match.homeTeam.name : 'Đội Nhà'}
            </T>
            <IMG src={match.homeTeam.logo} width={32} height={32} />
        </XS>

        {/* Tỉ số - CỐ ĐỊNH Ở GIỮA */}
        <V width={140} alignItems="center">
          <XS
            backgroundColor={isLive ? "#f5a623" : "#1f1f1f"}
            paddingHorizontal="$5"
            paddingVertical="$2"
            borderRadius={10}
            minWidth={90}
            alignItems="center"
            justifyContent="center"
          >
            <T
              fontSize={16}
              fontWeight="900"
              color={isLive ? "#000" : "#fff"}
            >
              {match.status === 'notstarted'
                ? "VS"
                : `${typeof match.score?.home === 'object' ? (match.score.home.current ?? 0) : (match.score?.home ?? 0)} - ${typeof match.score?.away === 'object' ? (match.score.away.current ?? 0) : (match.score?.away ?? 0)}`}
            </T>
          </XS>
        </V>

        {/* Tên + logo khách - căn trái sát tỉ số */}
        <XS flex={1} justifyContent="flex-start" alignItems="center" gap="$3" maxWidth={300}>
          <IMG src={match.awayTeam.logo} width={32} height={32} />
          <T
            fontSize={15}
            fontWeight="700"
            numberOfLines={1}
            textAlign="left"
          >
            {typeof match.awayTeam?.name === 'string' ? match.awayTeam.name : 'Đội Khách'}
          </T>
        </XS>
      </XS>

      {/* STAR */}
      <V width={50} alignItems="center">
        <Star size={18} color="#ffd700" opacity={0.7} />
      </V>
    </XS>
  )
}

// Layout Mobile - giống ảnh bạn gửi (tỉ số ở bên phải)
const MatchRowMobile = ({ match, isLast }: any) => {
  const nowSec = Math.floor(Date.now() / 1000)
  const MATCH_DURATION_SEC = 110 * 60

  const isLive = (match.status === 'inprogress' || match.status === 'live' || match.status === 'in_progress') || 
                (match.status !== 'finished' && match.status !== 'canceled' && match.startTimestamp && (nowSec - match.startTimestamp >= 0) && (nowSec - match.startTimestamp <= MATCH_DURATION_SEC))
  
  const isFinished = match.status === 'finished'

  let timeDisplay = ""
  if (isLive) {
    if (match.currentMinute) {
      timeDisplay = match.currentMinute
    } else if (match.startTimestamp) {
      const elapsed = Math.floor((nowSec - match.startTimestamp) / 60)
      if (elapsed > 90) timeDisplay = "90+'"
      else if (elapsed > 45 && elapsed < 60) timeDisplay = "HT"
      else timeDisplay = `${elapsed}'`
    } else {
      timeDisplay = "Đang đá"
    }
  } else if (isFinished) {
    timeDisplay = "FT"
  } else {
    timeDisplay = new Date(match.startTimestamp * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  const timeLabel = timeDisplay;
  return (
    <YS
      backgroundColor="#0f0f0f"
      borderRadius={14}
      paddingVertical="$3"
      paddingHorizontal="$3"
      marginBottom="$3"
      borderWidth={1}
      borderColor="#1e1e1e"
      width="100%"
      opacity={isFinished ? 0.6 : 1}
    >
      <style>{blinkStyles}</style>

      <XS alignItems="center" gap="$3">
        <T
          width={40}
          textAlign="center"
          fontWeight="800"
          fontSize={12}
          color={isLive ? "#f5a623" : "#888"}
          // 2. ÁP DỤNG ANIMATION KHI ĐANG LIVE
          style={isLive ? { animation: 'blinker 1s linear infinite' } : {}}
        >
          {timeLabel}
        </T>

        {/* Cột giữa: 2 đội */}
        <YS flex={1} gap="$2">
          {/* Home */}
          <XS alignItems="center" gap="$3">
            <IMG src={match.homeTeam.logo} width={24} height={24} style={{ objectFit: 'contain' }} />
            <T
              color="#eaeaea"
              fontSize={14}
              fontWeight="700"
              numberOfLines={0}
              flex={1}
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
            >
              {typeof match.homeTeam?.name === 'string' ? match.homeTeam.name : 'Đội Nhà'}
            </T>
          </XS>

          {/* Away */}
          <XS alignItems="center" gap="$3">
            <IMG src={match.awayTeam.logo} width={24} height={24} style={{ objectFit: 'contain' }} />
            <T
              color="#cfcfcf"
              fontSize={14}
              fontWeight="700"
              numberOfLines={0}
              flex={1}
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
            >
              {typeof match.awayTeam?.name === 'string' ? match.awayTeam.name : 'Đội Khách'}
            </T>
          </XS>
        </YS>

        {/* Cột phải: Score box dọc */}
        <YS
          backgroundColor="#111"
          borderRadius={10}
          minWidth={44}
          paddingVertical="$2"
          alignItems="center"
          justifyContent="center"
          borderWidth={1}
          borderColor={isLive ? "#f5a623" : "#2a2a2a"}
        >
          <T
            fontSize={16}
            fontWeight="900"
            color={isLive ? "#f5a623" : "#fff"}
          >
            {match.status === 'notstarted' ? "-" : (typeof match.score?.home === 'object' ? (match.score.home.current ?? 0) : (match.score?.home ?? 0))}
          </T>

          <T
            fontSize={16}
            fontWeight="900"
            color={isLive ? "#f5a623" : "#fff"}
          >
            {match.status === 'notstarted' ? "-" : (typeof match.score?.away === 'object' ? (match.score.away.current ?? 0) : (match.score?.away ?? 0))}
          </T>
        </YS>
      </XS>

      {/* Star */}
      
    </YS>
  )
}

// Component chính - chọn layout theo mobile/desktop
const MatchRow = ({ match, isLast }: any) => {
  const media = useMedia()
  const isMobile = media.ltMd

  return (
    <Link href={`/truc-tiep/${generateMatchSlug(match.homeTeam.name, match.awayTeam.name, match.dateString || new Date().toISOString().split('T')[0], match.id)}`} style={{ textDecoration: 'none' }}>
      {isMobile ? (
        <MatchRowMobile match={match} isLast={isLast} />
      ) : (
        <MatchRowDesktop match={match} isLast={isLast} />
      )}
    </Link>
  )
}

