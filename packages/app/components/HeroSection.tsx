"use client"
import React from 'react'
import { YStack, XStack, Text, Button, View, Image, ZStack, useMedia } from 'tamagui'
import { PlayCircle, Calendar, ChevronRight, ChevronLeft, Zap } from '@tamagui/lucide-icons'
import { useState, useEffect } from 'react'

const COLORS = {
  primary: '#28a745',
  primaryHover: '#218838',
  bgDark: '#050807',
} as const

export const HeroSection = () => {
  const media = useMedia()
  const isMobile = !media.gtMd

  const BANNERS = [
    'https://images.pexels.com/photos/4122451/pexels-photo-4122451.jpeg',
    'https://images.pexels.com/photos/3448250/pexels-photo-3448250.jpeg',
    'https://images.pexels.com/photos/29282855/pexels-photo-29282855.jpeg',
    'https://images.pexels.com/photos/1261014/pexels-photo-1261014.jpeg',
    'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg'
  ]

  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [BANNERS.length])

  const handleNext = () => setCurrentSlide((prev) => (prev + 1) % BANNERS.length)
  const handlePrev = () => setCurrentSlide((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1))

  return (
    <YStack width="100%" backgroundColor={COLORS.bgDark}>
      <ZStack width="100%" height={isMobile ? 480 : 640} position="relative">

        {/* Carousel Images */}
        {BANNERS.map((banner, index) => (
          <Image
            key={index}
            src={banner}
            alt={`Banner ${index}`}
            position="absolute"
            top={0} left={0} right={0} bottom={0}
            width="100%" height="100%"
            style={{ 
              objectFit: 'cover',
              opacity: index === currentSlide ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out'
            } as any}
            zIndex={0}
          />
        ))}

        {/* Gradient tối mờ overlay */}
        <View
          position="absolute" top={0} left={0} right={0} bottom={0}
          style={{ background: isMobile
            ? 'linear-gradient(to bottom, rgba(5,8,7,0.75) 0%, rgba(5,8,7,0.5) 40%, rgba(5,8,7,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(5,8,7,0.88) 0%, rgba(5,8,7,0.35) 50%, rgba(5,8,7,0.97) 100%)'
          }}
          zIndex={1}
        />

        {/* Content */}
        <YStack
          maxWidth={1200}
          width="100%"
          height="100%"
          marginHorizontal="auto"
          justifyContent={isMobile ? "flex-end" : "center"}
          paddingHorizontal={isMobile ? "$4" : "$8"}
          paddingBottom={isMobile ? "$12" : "$0"}
          gap={isMobile ? "$3" : "$5"}
          zIndex={10}
        >
          {/* LIVE Badge + title block */}
          <XStack
            backgroundColor="rgba(40,167,69,0.12)"
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius="$10"
            alignSelf="flex-start"
            alignItems="center"
            gap="$2"
            borderWidth={1}
            borderColor="rgba(40,167,69,0.35)"
          >
            <View width={7} height={7} borderRadius={4} backgroundColor={COLORS.primary} style={{ boxShadow: '0 0 8px #28a745' }} />
            <Text color={COLORS.primary} fontSize={11} fontWeight="900" letterSpacing={1.5}>TRỰC TIẾP</Text>
          </XStack>

          <YStack gap={isMobile ? -8 : -12}>
            <Text
              color="white"
              fontSize={isMobile ? 38 : 68}
              fontWeight="900"
              letterSpacing={-1}
              lineHeight={isMobile ? 44 : 76}
            >
              ĐỈNH CAO
            </Text>
            <Text
              color={COLORS.primary}
              fontSize={isMobile ? 38 : 68}
              fontWeight="900"
              letterSpacing={-1}
              lineHeight={isMobile ? 44 : 76}
              style={{ textShadow: '0 0 32px rgba(40,167,69,0.35)' }}
            >
              BÓNG ĐÁ PHỦI
            </Text>
          </YStack>

          {!isMobile && (
            <Text color="#aaa" fontSize={17} maxWidth={580} lineHeight={26} fontWeight="500">
              Nền tảng quản lý và truyền thông giải đấu chuyên nghiệp nhất Việt Nam. Nơi kết nối niềm đam mê bóng đá phong trào.
            </Text>
          )}

          {/* CTA Buttons */}
          <XStack gap="$3" marginTop={isMobile ? "$1" : "$3"}>
            <Button
              backgroundColor={COLORS.primary}
              flex={isMobile ? 1 : 0}
              size={isMobile ? "$4" : "$5"}
              borderRadius="$10"
              iconAfter={<PlayCircle size={18} color="white" />}
              hoverStyle={{ backgroundColor: COLORS.primaryHover } as any}
              pressStyle={{ scale: 0.97 } as any}
              style={{ boxShadow: '0 4px 16px rgba(40,167,69,0.4)' }}
            >
              <Text color="white" fontWeight="900" fontSize={isMobile ? 14 : 15}>XEM TRỰC TIẾP</Text>
            </Button>

            <Button
              backgroundColor={"rgba(255,255,255,0.06)" as any}
              borderWidth={1}
              borderColor={"rgba(255,255,255,0.15)" as any}
              flex={isMobile ? 1 : 0}
              size={isMobile ? "$4" : "$5"}
              borderRadius="$10"
              iconAfter={<Calendar size={18} color="white" />}
              hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.1)' } as any}
              pressStyle={{ scale: 0.97 } as any}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <Text color="white" fontWeight="800" fontSize={isMobile ? 14 : 15}>LỊCH THI ĐẤU</Text>
            </Button>
          </XStack>

          {/* Carousel Next/Prev Constraints */}
          {!isMobile && (
            <XStack position="absolute" width="100%" top="50%" left={0} paddingHorizontal="$4" justifyContent="space-between" zIndex={2}>
              <Button circular size="$5" backgroundColor="rgba(255,255,255,0.1)" hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.2)' } as any} onPress={handlePrev} icon={<ChevronLeft size={24} color="white" />} style={{ backdropFilter: 'blur(10px)' }} />
              <Button circular size="$5" backgroundColor="rgba(255,255,255,0.1)" hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.2)' } as any} onPress={handleNext} icon={<ChevronRight size={24} color="white" />} style={{ backdropFilter: 'blur(10px)' }} />
            </XStack>
          )}

          {/* Carousel Dots */}
          <XStack position="absolute" bottom={isMobile ? 30 : 60} alignSelf="center" gap="$2" zIndex={2}>
            {BANNERS.map((_, i) => (
              <View
                key={i}
                width={i === currentSlide ? 24 : 8}
                height={8}
                borderRadius={4}
                backgroundColor={i === currentSlide ? COLORS.primary : 'rgba(255,255,255,0.3)'}
                style={{ transition: 'all 0.3s ease' } as any}
                cursor="pointer"
                onPress={() => setCurrentSlide(i)}
              />
            ))}
          </XStack>
        </YStack>
      </ZStack>

      {/* Stats Bar */}
      <View
        maxWidth={1100}
        width="100%"
        marginHorizontal="auto"
        marginTop={isMobile ? -32 : -48}
        zIndex={20}
        paddingHorizontal={isMobile ? "$3" : "$6"}
      >
        <XStack
          backgroundColor={"rgba(12,18,15,0.9)" as any}
          borderRadius={isMobile ? 16 : 20}
          borderWidth={1}
          borderColor={"rgba(255,255,255,0.07)" as any}
          style={{ backdropFilter: 'blur(20px)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
          // 2x2 grid on mobile, 1x4 line on desktop
          flexWrap={"wrap" as any}
          paddingHorizontal={isMobile ? "$3" : "$6"}
          paddingVertical={isMobile ? "$3" : "$5"}
        >
          <StatBox value="500+" label="ĐỘI BÓNG" isMobile={isMobile} />
          {!isMobile && <Divider />}
          <StatBox value="12K+" label="CẦU THỦ" highlight isMobile={isMobile} />
          {!isMobile && <Divider />}
          <StatBox value="150+" label="GIẢI ĐẤU" isMobile={isMobile} />
          {!isMobile && <Divider />}
          <StatBox value="2.5M" label="LƯỢT XEM" highlight isMobile={isMobile} />
        </XStack>
      </View>
    </YStack>
  )
}

const StatBox = ({ value, label, highlight = false, isMobile }: any) => (
  <YStack
    width={isMobile ? '50%' : 'auto'}
    flex={isMobile ? 0 : 1}
    alignItems="center"
    paddingVertical={isMobile ? "$2" : "$0"}
    gap="$0.5"
  >
    <Text
      color={highlight ? COLORS.primary : 'white'}
      fontSize={isMobile ? 26 : 36}
      fontWeight="900"
      letterSpacing={-1}
    >
      {value}
    </Text>
    <Text color="#666" fontSize={isMobile ? 10 : 12} fontWeight="800" letterSpacing={1.5}>
      {label}
    </Text>
  </YStack>
)

const Divider = () => (
  <View width={1} height={36} backgroundColor="rgba(255,255,255,0.07)" alignSelf="center" />
)

