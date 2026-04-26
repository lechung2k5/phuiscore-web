"use client"

import { XStack, YStack, Text, View, Image, Separator } from 'tamagui'
import { Facebook, Youtube, Globe, Apple, Play } from '@tamagui/lucide-icons'

// 1. IMPORT LOGO TỪ ASSETS DÙNG CHUNG
import LogoAsset from '../assets/logo.svg'

const COLORS = {
  logoGreen: '#28a745' as any,
  logoBlue: '#0056b3' as any,
  bgDark: '#020604' as any,
  borderDark: '#121714' as any,
  textGray: '#a0a0a0' as any
}

export const Footer = () => {
  const getImageUrl = (asset: any) => {
    if (typeof asset === 'string') return asset
    return asset?.src || asset?.default?.src || asset
  }

  return (
    <YStack backgroundColor={COLORS.bgDark} paddingTop="$12" paddingBottom="$8" borderTopWidth={1} borderColor={COLORS.borderDark}>
      
      {/* Container chính: Căn giữa và giới hạn chiều rộng */}
      <XStack 
        maxWidth={1200} 
        width="100%" 
        marginHorizontal="auto" 
        paddingHorizontal="$5"
        // ltMd: Tự động chuyển thành 1 cột trên điện thoại
        $ltMd={{ flexDirection: 'column', gap: '$10' }}
      >
        
        {/* CỘT 1: LOGO & GIỚI THIỆU (25%) */}
        <YStack flex={1} gap="$5" paddingRight="$5">
          <Image 
            src={getImageUrl(LogoAsset)} 
            width={160} 
            height={50} 
            alt="Phui Score Logo"
            resizeMode="contain" 
          />
          <Text color={COLORS.textGray} fontSize={14} lineHeight={22}>
            Hệ thống quản lý và truyền thông bóng đá phủi hàng đầu Việt Nam. Mang lại trải nghiệm chuyên nghiệp cho mọi trận đấu.
          </Text>
        </YStack>

        {/* CỘT 2: LIÊN KẾT (25%) */}
        <YStack flex={1} gap="$5">
          <Text color="white" fontWeight="800" fontSize={18} letterSpacing={0.5}>Liên kết</Text>
          <YStack gap="$3">
            {['Về chúng tôi', 'Điều khoản dịch vụ', 'Chính sách bảo mật', 'Liên hệ quảng cáo'].map(item => (
              <Text key={item} color={COLORS.textGray} fontSize={14} hoverStyle={{ color: COLORS.logoGreen, cursor: 'pointer', x: 5 } as any}>
                {item}
              </Text>
            ))}
          </YStack>
        </YStack>

        {/* CỘT 3: TÍNH NĂNG (25%) */}
        <YStack flex={1} gap="$5">
          <Text color="white" fontWeight="800" fontSize={18} letterSpacing={0.5}>Tính năng</Text>
          <YStack gap="$3">
            {['Tạo giải đấu', 'Quản lý đội bóng', 'Thống kê cầu thủ', 'Livestream kỹ thuật số'].map(item => (
              <Text key={item} color={COLORS.textGray} fontSize={14} hoverStyle={{ color: COLORS.logoGreen, cursor: 'pointer', x: 5 } as any}>
                {item}
              </Text>
            ))}
          </YStack>
        </YStack>

        {/* CỘT 4: TẢI ỨNG DỤNG (25%) */}
        <YStack flex={1} gap="$5">
          <Text color="white" fontWeight="800" fontSize={18} letterSpacing={0.5}>Tải ứng dụng</Text>
          <YStack gap="$3.5">
            <DownloadStoreButton icon={<Apple size={22} color="white" />} label="Download on" title="App Store" hoverColor={COLORS.logoGreen} />
            <DownloadStoreButton icon={<Play size={20} color="white" fill="white" />} label="Get it on" title="Google Play" hoverColor={COLORS.logoBlue} />
          </YStack>
        </YStack>

      </XStack>

      {/* FOOTER BOTTOM: BẢN QUYỀN & SOCIAL */}
      <YStack maxWidth={1200} width="100%" marginHorizontal="auto" marginTop="$12" paddingHorizontal="$5">
        <Separator borderColor={COLORS.borderDark} />
        <XStack 
            paddingTop="$7" 
            justifyContent="space-between" 
            alignItems="center"
            $ltSm={{ flexDirection: 'column-reverse', gap: '$6' }}
        >
          <Text color="#555" fontSize={12}>
            © 2026 Phủi Score. All rights reserved.
          </Text>
          
          <XStack gap="$4">
            <SocialCircle icon={<Facebook size={18} />} hoverColor={COLORS.logoBlue} />
            <SocialCircle icon={<Youtube size={18} />} hoverColor="#ff0000" />
            <SocialCircle icon={<Globe size={18} />} hoverColor={COLORS.logoGreen} />
          </XStack>
        </XStack>
      </YStack>
    </YStack>
  )
}

// Sub-component cho nút Store
const DownloadStoreButton = ({ icon, label, title, hoverColor }: any) => (
    <XStack 
        backgroundColor="#0a0f0d" 
        borderWidth={1} 
        borderColor={"#222" as any} 
        borderRadius="$4" 
        paddingVertical="$2" 
        paddingHorizontal="$3.5" 
        alignItems="center" 
        gap="$3"
        cursor="pointer"
        hoverStyle={{ borderColor: hoverColor } as any}
    >
        {icon}
        <YStack>
            <Text color={"#777" as any} fontSize={9}>{label}</Text>
            <Text color={"white" as any} fontSize={15} fontWeight="700">{title}</Text>
        </YStack>
    </XStack>
)

// Sub-component cho Social Icons
const SocialCircle = ({ icon, hoverColor }: any) => (
    <View 
        p="$2.5" 
        borderRadius="$10" 
        backgroundColor={"#0a0f0d" as any} 
        borderWidth={1}
        borderColor={COLORS.borderDark}
        cursor="pointer"
        hoverStyle={{ backgroundColor: hoverColor, borderColor: hoverColor, scale: 1.1 } as any}
    >
        {icon}
    </View>
)

