"use client"

import React, { useMemo } from 'react'
import { XStack, Text, Circle, View, Image, useMedia } from 'tamagui'
import { Trophy } from '@tamagui/lucide-icons'

import { COUNTRY_MAP } from 'app/utils/countryMap';

const getSafeLogo = (originalUrl: string, name: string = '') => {
  if (!originalUrl) {
    return `https://ui-avatars.com/api/?name=${name ? encodeURIComponent(name) : 'T'}&background=random&color=fff&bold=true`;
  }
  if (!originalUrl.startsWith('http')) return originalUrl;
  if (originalUrl.includes('api.sofascore.app') || originalUrl.includes('sofascore.com')) {
    if (name) {
      const countryCode = COUNTRY_MAP[name];
      if (countryCode) return `https://flagcdn.com/w80/${countryCode}.png`;
    }
    return `https://ui-avatars.com/api/?name=${name ? encodeURIComponent(name) : 'T'}&background=random&color=fff&bold=true`;
  }
  return originalUrl;
};

export const StandingRow = ({ item, isLast, compact }: any) => {
  const media = useMedia()
  const isDesktop = !compact && media.gtMd

  // Form: SofaScore trả dạng mảng object [{result:'W',...}] hoặc string 'WDLWW'
  const formArray: string[] = useMemo(() => {
    if (!item.form) return []
    if (Array.isArray(item.form)) {
      // Nếu là mảng string: ['W','D','L']
      if (typeof item.form[0] === 'string') return item.form.slice(0, 5)
      // Nếu là mảng object: [{result: 'W'}, ...]
      if (typeof item.form[0] === 'object') return item.form.slice(0, 5).map((f: any) => f.result || f.type || '?')
      return []
    }
    // Nếu là chuỗi: 'WDLWW'
    return String(item.form).split('').filter(Boolean).slice(0, 5)
  }, [item.form])

  const getIndicatorColor = (type: string) => {
    if (!type) return 'transparent'
    const t = type.toLowerCase()
    if (t.includes('champions league') || t.includes('promotion') || t.includes('qualified')) return '#0056b3'
    if (t.includes('europa') || t.includes('conference')) return '#f28c38'
    if (t.includes('relegation') || t.includes('relegate')) return '#dc3545'
    if (t.includes('playoff') || t.includes('play-off')) return '#e67e22'
    return 'transparent'
  }

  const formColor = (f: string) => {
    if (f === 'W') return '#28a745'
    if (f === 'D') return '#6c757d'
    if (f === 'L') return '#dc3545'
    return '#222'
  }

  const isTop1 = item.rank === 1
  const isTop4 = item.rank <= 4

  return (
    <XStack
      paddingHorizontal={compact ? "$3" : "$5"}
      paddingVertical={compact ? "$2.5" : "$3"}
      alignItems="center"
      borderBottomWidth={isLast ? 0 : 1}
      borderColor="#111"
      hoverStyle={{ backgroundColor: 'rgba(40,167,69,0.07)' }}
      position="relative"
      backgroundColor={isTop1 ? 'rgba(40,167,69,0.04)' : 'transparent'}
    >
      {/* Thanh màu promotion/relegation */}
      <View
        position="absolute" left={0} top={4} bottom={4} width={4}
        backgroundColor={getIndicatorColor(item.promotion)}
        borderTopRightRadius={4} borderBottomRightRadius={4}
      />

      {/* #  Rank */}
      <XStack width={compact ? 32 : 44} alignItems="center" justifyContent="center" gap="$1.5">
        {isTop1 && !compact && <Trophy size={13} color="#ffd700" />}
        <Text
          fontWeight="900"
          fontSize={compact ? 13 : 15}
          color={isTop4 ? "#28a745" : (item.rank > 17 ? "#dc3545" : "#aaa")}
        >
          {item.rank}
        </Text>
      </XStack>

      {/* Đội bóng */}
      <XStack flex={1} alignItems="center" gap={compact ? "$2" : "$3"} minWidth={compact ? 100 : 160}>
        <View
          padding={compact ? 4 : 6}
          backgroundColor="#161b18"
          borderRadius={compact ? 8 : 10}
        >
          <Image
            src={getSafeLogo(item.team?.logo, item.team?.name)}
            width={compact ? 22 : 26}
            height={compact ? 22 : 26}
            style={{ objectFit: 'contain' }}
          />
        </View>
        <Text
          color="white"
          fontWeight="700"
          fontSize={compact ? 12 : 14}
          numberOfLines={1}
          flex={1}
        >
          {typeof item.team?.name === 'string' ? item.team.name : 'N/A'}
        </Text>
      </XStack>

      {/* Stats columns */}
      <XStack alignItems="center" gap={0}>
        {/* ST — Số trận */}
        <Text
          width={compact ? 32 : 40}
          textAlign="center"
          color="#888"
          fontSize={compact ? 12 : 13}
          fontWeight="700"
        >
          {String(item.mp ?? '-')}
        </Text>

        {/* W D L GD — chỉ desktop */}
        {isDesktop && (
          <XStack>
            <Text width={36} textAlign="center" color="#666" fontSize={12} fontWeight="600">{String(item.w ?? '-')}</Text>
            <Text width={36} textAlign="center" color="#666" fontSize={12} fontWeight="600">{String(item.d ?? '-')}</Text>
            <Text width={36} textAlign="center" color="#666" fontSize={12} fontWeight="600">{String(item.l ?? '-')}</Text>
          </XStack>
        )}

        {/* HS (GD) — luôn hiển thị cả mobile */}
        <Text
          width={compact ? 38 : 44}
          textAlign="center"
          color={item.gd > 0 ? "#28a745" : item.gd < 0 ? "#dc3545" : "#666"}
          fontSize={compact ? 12 : 13}
          fontWeight="700"
        >
          {item.gd != null ? (typeof item.gd === 'object' ? '0' : (item.gd > 0 ? `+${item.gd}` : item.gd)) : '-'}
        </Text>

        {/* Điểm — luôn hiện */}
        <Text
          width={compact ? 36 : 48}
          textAlign="center"
          color="#28a745"
          fontSize={compact ? 15 : 17}
          fontWeight="900"
        >
          {String(item.pts ?? '-')}
        </Text>

        {/* Phong độ 5 trận — chỉ desktop */}
        {isDesktop && (() => {
          const SLOTS = 5
          // pad ô trống vào đầu nếu thiếu
          const padded = [
            ...Array(Math.max(0, SLOTS - formArray.length)).fill(''),
            ...formArray.slice(0, SLOTS)
          ]
          return (
            <XStack gap={3} width={140} justifyContent="flex-end" paddingRight={4}>
              {padded.map((f: string, i: number) =>
                f === '' ? (
                  <View
                    key={`empty-${i}`}
                    width={22} height={22} borderRadius={11}
                    backgroundColor="#1a1a1a"
                    borderWidth={1} borderColor="#2a2a2a"
                  />
                ) : (
                  <Circle
                    key={`form-${i}-${f}`}
                    size={22}
                    backgroundColor={formColor(f)}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize={9} fontWeight="900" color="white">{f}</Text>
                  </Circle>
                )
              )}
            </XStack>
          )
        })()}
      </XStack>
    </XStack>
  )
}