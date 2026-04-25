"use client"

import { HeroSection } from 'app/components/HeroSection'
import { LiveMatchStrip } from 'app/components/LiveMatchStrip'
import { FeaturedLeagues } from 'app/components/FeaturedLeagues'
import { YStack } from 'tamagui'



const COLORS = {
  bgDark: '#0a0f0d' as any,
}

export default function UserPage() {
    return (
        <YStack flex={1} backgroundColor={COLORS.bgDark}>

            {/* 2. HERO SECTION (Banner + Thống kê) */}
            <HeroSection />

            {/* 3. NỘI DUNG CHÍNH */}
            <YStack 
                maxWidth={1200}
                width="100%"
                marginHorizontal="auto"
                px="$3"
            >
                {/* KHU VỰC TRẬN ĐẤU LIVE - Đã thay thế Grid cũ bằng Strip */}
                <LiveMatchStrip />

                {/* Bạn có thể đăng ký thêm các Section khác ở đây:
                    - <StandingTable leagueId="hpl-s11" />
                    - <NewsFeed />
                */}
                <FeaturedLeagues/>

            </YStack>

        </YStack>
    )
}