"use client"
import React, { useEffect, useState } from 'react'
import { Card, XStack, YStack, Text, Image, Button, View, useMedia } from 'tamagui'
import { Link } from 'solito/link'
import { Play } from '@tamagui/lucide-icons'
import { generateMatchSlug } from '../utils/slug'
import { getImageUrl } from '../utils/image'

const COLORS = {
  green: '#28a745',
  live: '#ff4d4f',
  bg: 'rgba(18, 24, 20, 0.9)',
  border: 'rgba(255, 255, 255, 0.07)',
}

export const LiveMatchCard = React.memo((props: any) => {
  const { league, currentPeriod, teamA, teamB, scoreA, scoreB, status, time, startTimestamp } = props
  const media = useMedia()
  
  // Logic tính phút thực tế chính xác từ SofaScore rawTime
  const [displayMinute, setDisplayMinute] = useState(currentPeriod)
  const rawTime = props.rawTime

  useEffect(() => {
    if ((status === 'live' || status === 'inprogress' || status === 'in_progress' || !status)) {
      const updateMinute = () => {
        if (rawTime?.currentPeriodStartTimestamp) {
          const now = Math.floor(Date.now() / 1000)
          const elapsedSec = (now - rawTime.currentPeriodStartTimestamp) + (rawTime.initial || 0)
          const m = Math.floor(elapsedSec / 60) + 1 // SofaScore style: 00:01 is 1'
          
          if (m > 0) {
            if (m > 90) setDisplayMinute('90+')
            else if (m > 45 && rawTime.initial < 2700) setDisplayMinute('45+') // Stoppage time 1st half
            else setDisplayMinute(`${m}'`)
          } else {
            setDisplayMinute('1\'')
          }
        } else {
          setDisplayMinute(currentPeriod || 'Live')
        }
      }
      
      updateMinute()
      const timer = setInterval(updateMinute, 10000) // Update every 10s for smooth feeling
      return () => clearInterval(timer)
    }
  }, [status, rawTime, currentPeriod])

  const nowSec = Math.floor(Date.now() / 1000)
  const cleanStatus = String(status || "").toLowerCase()
  
  const explicitlyLive = ['live', 'inprogress', 'in_progress', 'first_half', 'second_half', 'half_time', 'extra_time', 'penalty'].includes(cleanStatus)
  const isFallbackLive = ['notstarted', 'not_started'].includes(cleanStatus) && startTimestamp && (nowSec - startTimestamp >= -30 * 60) && (nowSec - startTimestamp <= 130 * 60)
  
  const isLive = explicitlyLive || isFallbackLive
                 
  const isFinished = ['finished', 'closed', 'ended'].includes(cleanStatus) || 
                    (startTimestamp && (nowSec - startTimestamp > 180 * 60))

  const isMobile = !media.gtMd

  const minLeft = startTimestamp ? Math.floor((startTimestamp - nowSec) / 60) : 0;
  const fallbackLabel = minLeft > 0 ? 'SẮP ĐÁ' : 'ĐANG ĐÁ';

  const formattedDate = startTimestamp ? new Date(startTimestamp * 1000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : ""
  const formattedTime = startTimestamp ? new Date(startTimestamp * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ""

  return (
    <Card
      {...({
        animation: "lazy",
        hoverStyle: { y: -4, scale: 1.01 },
        pressStyle: { scale: 0.98 },
        width: "100%",
        height: isMobile ? 300 : 340,
        borderRadius: 32,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(34,197,94,0.3)",
        padding: isMobile ? "$4" : "$5",
        justifyContent: "space-between",
      } as any)}
      style={{
        background: 'linear-gradient(180deg, #052c16 0%, #020f08 45%, #010502 100%)',
        boxShadow: '0 0 20px rgba(34,197,94,0.15), 0 12px 30px rgba(0,0,0,0.6)'
      } as any}
      padding={isMobile ? "$4" : "$5"}
      justifyContent="space-between"
    >
      <style>{`
        @keyframes pulse-red {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* TOP BAR: LIVE | LEAGUE | HOT */}
      <XStack justifyContent="space-between" alignItems="center">
        {/* Live/Finished Badge */}
        <XStack 
          backgroundColor={isLive ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)"} 
          paddingHorizontal="$2.5" 
          paddingVertical="$1" 
          borderRadius={20}
          alignItems="center"
          gap="$1.5"
          borderWidth={1}
          borderColor={isLive ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}
        >
          {isLive && (
            <View 
              width={6} height={6} borderRadius={3} 
              backgroundColor="#ef4444" 
              style={{ animation: 'pulse-red 1.5s infinite' }}
            />
          )}
          <Text color={isLive ? "#ef4444" : "#888"} fontSize={10} fontWeight="900" letterSpacing={1}>
            {explicitlyLive ? "LIVE" : isFallbackLive ? fallbackLabel : isFinished ? "KẾT THÚC" : "CHỜ ĐÁ"}
          </Text>
        </XStack>

        {/* League Info */}
        <XStack alignItems="center" gap="$2" backgroundColor="rgba(0,0,0,0.4)" paddingHorizontal="$3" paddingVertical="$1" borderRadius={10}>
             <View width={18} height={18} backgroundColor="white" borderRadius={3} alignItems="center" justifyContent="center">
                <Text fontSize={8}>🏆</Text>
             </View>
             <Text color="white" fontSize={11} fontWeight="800" numberOfLines={1}>{typeof league === 'string' ? league : 'GIẢI ĐẤU'}</Text>
        </XStack>

        {/* Hot Badge */}
        <View backgroundColor="#ea580c" paddingHorizontal="$2" paddingVertical="$1" borderRadius={10}>
            <Text color="white" fontSize={10} fontWeight="900" fontStyle="italic">HOT!</Text>
        </View>
      </XStack>

      {/* CENTER CONTENT: LOGOS & SCORE */}
      <XStack alignItems="center" justifyContent="center" gap={isMobile ? "$1" : "$2"} marginTop="$2">
        
        {/* Team A */}
        <YStack alignItems="center" gap="$3" flex={1} flexBasis={0}>
          <View 
            width={isMobile ? 70 : 85} 
            height={isMobile ? 70 : 85} 
            borderRadius={50} 
            backgroundColor="rgba(255,255,255,0.05)"
            alignItems="center" 
            justifyContent="center"
            borderWidth={2}
            borderColor="rgba(255,255,255,0.08)"
            style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}
          >
            <Image src={getImageUrl(teamA?.logo, 'logo', teamA?.id)} width={isMobile ? 40 : 50} height={isMobile ? 40 : 50} style={{ objectFit: 'contain' } as any} />
          </View>
          <Text color="white" fontSize={isMobile ? 11 : 12} fontWeight="800" textAlign="center" numberOfLines={2} height={32} paddingHorizontal="$1">
            {teamA?.name}
          </Text>
        </YStack>

        {/* Score & Time */}
        <YStack alignItems="center" gap="$2" minWidth={110}>
          <Text color="#22c55e" fontSize={14} fontWeight="900" style={{ letterSpacing: 0.5 }}>
            {formattedTime}
          </Text>
          <Text color="#f97316" fontSize={11} fontWeight="900" style={{ textShadow: '0 0 10px rgba(249,115,22,0.3)', marginTop: -4 }}>
            {explicitlyLive ? (displayMinute || 'ĐANG ĐÁ') : isFallbackLive ? fallbackLabel : isFinished ? 'KẾT THÚC' : 'CHƯA ĐÁ'}
          </Text>
          <Text
            color="white"
            fontSize={isMobile ? 40 : 44}
            fontWeight="900"
            letterSpacing={-1}
            style={{ textShadow: '0 0 20px rgba(255,255,255,0.1)' }}
          >
            {scoreA ?? 0} - {scoreB ?? 0}
          </Text>
          
          <View 
            backgroundColor="rgba(34,197,94,0.15)" 
            paddingHorizontal="$3" 
            paddingVertical="$1.5" 
            borderRadius={20}
            borderWidth={1}
            borderColor="rgba(34,197,94,0.3)"
          >
            <Text color="#22c55e" fontSize={10} fontWeight="900">
               {isLive ? "LIVE" : isFinished ? "FT" : "CHỜ ĐÁ"}
            </Text>
          </View>
        </YStack>

        {/* Team B */}
        <YStack alignItems="center" gap="$3" flex={1} flexBasis={0}>
          <View 
            width={isMobile ? 70 : 85} 
            height={isMobile ? 70 : 85} 
            borderRadius={50} 
            backgroundColor="rgba(255,255,255,0.05)"
            alignItems="center" 
            justifyContent="center"
            borderWidth={2}
            borderColor="rgba(255,255,255,0.08)"
            style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}
          >
            <Image src={getImageUrl(teamB?.logo, 'logo', teamB?.id)} width={isMobile ? 40 : 50} height={isMobile ? 40 : 50} style={{ objectFit: 'contain' } as any} />
          </View>
          <Text color="white" fontSize={isMobile ? 11 : 12} fontWeight="800" textAlign="center" numberOfLines={2} height={32} paddingHorizontal="$1">
            {teamB?.name}
          </Text>
        </YStack>
      </XStack>

      {/* FOOTER BUTTONS */}
      <XStack gap="$3" marginTop="$2">
        <XStack 
            flex={1} 
            backgroundColor="rgba(255,255,255,0.05)" 
            height={46} 
            borderRadius={14} 
            alignItems="center" 
            justifyContent="center" 
            gap="$2"
        >
            <Text fontSize={14}>🎧</Text>
            <Text color="#aaa" fontSize={13} fontWeight="700">Phủi Score</Text>
        </XStack>

        <Link href={`/truc-tiep/${generateMatchSlug(teamA?.name || 'team-a', teamB?.name || 'team-b', new Date().toISOString().split('T')[0], props.id || '123')}${isLive ? '?type=live' : ''}`} style={{ textDecoration: 'none' }}>
          <Button
              flex={1}
              height={46}
              width="100%"
              borderRadius={14}
              hoverStyle={{ scale: 1.02, opacity: 0.9 }}
              pressStyle={{ scale: 0.97 }}
              style={{ 
                background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
                boxShadow: '0 0 15px rgba(34,197,94,0.3)',
                borderWidth: 0
              } as any}
          >
              <Text color="black" fontWeight="900" fontSize={14}>XEM NGAY</Text>
          </Button>
        </Link>
      </XStack>
    </Card>
  )
})
