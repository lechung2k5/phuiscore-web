"use client"

import { HeroSection } from 'app/components/HeroSection'
import { LiveMatchStrip } from 'app/components/LiveMatchStrip'
import { FeaturedLeagues } from 'app/components/FeaturedLeagues'
import { NewsSection } from 'app/components/Home/NewsSection'
import { YStack } from 'tamagui'

const COLORS = {
  bgDark: '#0a0f0d' as any,
}

export function HomeClient() {
    return (
        <YStack flex={1} backgroundColor={COLORS.bgDark}>
            {/* 1. HERO SECTION (Banner + Thống kê) */}
            <HeroSection />

            {/* 2. NỘI DUNG CHÍNH */}
            <YStack 
                maxWidth={1200}
                width="100%"
                marginHorizontal="auto"
                px="$3"
            >
                {/* 2.1 KHU VỰC TRẬN ĐẤU LIVE */}
                <LiveMatchStrip />

                {/* 2.2 TIN TỨC TIÊU ĐIỂM */}
                <NewsSection />

                {/* 2.3 GIẢI ĐẤU NỔI BẬT */}
                <FeaturedLeagues />
            </YStack>
        </YStack>
    )
}
