"use client"

import React, { useState, useEffect } from 'react'
import {
  Button,
  Image,
  ScrollView,
  Separator,
  Text,
  View,
  XStack,
  YStack,
  useMedia,
} from 'tamagui'
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  Database,
  Film,
  KeyRound,
  Newspaper,
  Radio,
  ShieldCheck,
  Smartphone,
  Trophy,
  Users,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Home,
} from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'

import LogoAsset from '../assets/logo.svg'

// Premium Executive Light Theme Palette (Stripe/Apple Corporate Keynote Style)
const C = {
  bg: '#f4f6f8', // Clean light background
  surface: '#f9fafb', // Clean card surface
  panel: '#ffffff', // Pure white slide canvas
  border: '#d1d5db', // Darker soft gray borders for higher visibility
  borderAccent: 'rgba(16, 185, 129, 0.5)', // Stronger accent emerald border
  text: '#111827', // Deep pitch black/gray for maximum contrast
  muted: '#1f2937', // Even darker charcoal description text for high-contrast reading
  dim: '#4b5563', // Solid mid gray
  green: '#059669', // Executive Emerald Green
  lightGreen: '#10b981', // Vibrant Emerald
  blue: '#2563eb', // Executive Corporate Blue
  amber: '#d97706', // Dark Golden Amber
  red: '#dc2626', // Solid deep red
}

const overview = [
  {
    title: 'Bối cảnh Thực tế',
    desc: 'Dữ liệu bóng đá phong trào phong phú nhưng cực kỳ rời rạc: đội bóng, cầu thủ, giải đấu, lịch đấu. Dự án tập trung gom và đồng bộ hóa toàn diện dữ liệu này.',
    icon: Trophy,
  },
  {
    title: 'Mục tiêu Cốt lõi',
    desc: 'Xây dựng nền tảng số hóa toàn diện nhằm chuyên nghiệp hóa bóng đá phong trào: Cung cấp hệ thống quản lý giải đấu tự động, công cụ quản trị đội bóng và hồ sơ cầu thủ chi tiết. Đồng thời, nâng tầm trải nghiệm khán giả qua tính năng Livestream, cập nhật tỉ số trực tiếp và tương tác (Chat) theo thời gian thực (Realtime).',
    icon: CheckCircle2,
  },
  {
    title: 'Phạm vi Đạt được',
    desc: 'Hoàn thiện Web App & API backend bền vững. Phát triển các cổng giao tiếp realtime (chat, score updates) thông qua Socket.IO và Redis adapter.',
    icon: ShieldCheck,
  },
]

const techStack = [
  { name: 'Next.js / React', desc: 'Giao diện SPA tối ưu tốc độ và SEO vượt trội.', logos: ['https://cdn.simpleicons.org/nextdotjs/000000', 'https://cdn.simpleicons.org/react/61DAFB'] },
  { name: 'Tamagui / Solito', desc: 'Thư viện UI dùng chung, tối ưu đa nền tảng.', logos: ['https://tamagui.dev/favicon.svg'] },
  { name: 'Node.js / Express', desc: 'Kiến trúc API 3 lớp (Route - Controller - Repository).', logos: ['https://cdn.simpleicons.org/nodedotjs/339933', 'https://cdn.simpleicons.org/express/000000'] },
  { name: 'AWS DynamoDB', desc: 'Cơ sở dữ liệu đám mây lưu trữ dữ liệu vận hành.', logos: ['https://api.iconify.design/logos:aws-dynamodb.svg'] },
  { name: 'AWS S3 Cloud', desc: 'Lưu trữ tài nguyên media (logo đội, avatar, ảnh tin).', logos: ['https://api.iconify.design/logos:aws-s3.svg'] },
  { name: 'Socket.IO / Redis', desc: 'Kênh realtime live chat và cập nhật tỉ số tự động.', logos: ['https://cdn.simpleicons.org/socketdotio/000000', 'https://cdn.simpleicons.org/redis/DC382D'] },
  { name: 'LiveKit Server', desc: 'Hạ tầng stream truyền dữ liệu livestream video trực tiếp.', logos: ['https://awsmp-logos.s3.amazonaws.com/seller-t4dbdwhifzc6e/666f13ad2e09843961c6f1869636cca3.png'] },
  { name: 'Vercel', desc: 'Nền tảng Serverless triển khai Web frontend tốc độ cao.', logos: ['https://api.iconify.design/logos:vercel-icon.svg'] },
  { name: 'Render', desc: 'Hạ tầng Cloud vận hành Node.js Backend và Socket.IO.', logos: ['https://cdn.simpleicons.org/render/000000'] },
]

const roles = [
  ['Khán giả / Cầu thủ', 'Xem tin tức, lịch đấu, theo dõi live chat realtime, cập nhật tỉ số trực tiếp.'],
  ['Ban quản lý đội', 'Tạo đội bóng, quản trị thành viên, đăng ký đội vào giải đấu trực tuyến.'],
  ['Media / Trọng tài', 'Điều khiển Live Control Center, phát luồng stream, cập nhật tỉ số.'],
  ['Admin', 'Giám sát hệ thống, phê duyệt đội bóng, quản lý giải đấu và tin tức.'],
]



const modules = [
  {
    title: 'Hồ sơ & Xác thực',
    desc: 'Đăng ký, xác minh OTP email, đổi/quên mật khẩu, cập nhật profile và upload avatar S3.',
    icon: KeyRound,
    href: '/user',
    tags: ['Auth', 'OTP', 'AWS S3'],
  },
  {
    title: 'Hệ thống Giải đấu',
    desc: 'Tạo giải đấu, mở đăng ký đội bóng, xếp lịch đấu tự động và tự động cập nhật kết quả.',
    icon: Trophy,
    href: '/giai-dau',
    tags: ['Tournament', 'Fixture', 'Auto Rank'],
  },
  {
    title: 'Quản trị Đội bóng',
    desc: 'Tạo lập đội bóng, thêm cầu thủ, phân quyền thành viên và thiết lập lịch đấu riêng.',
    icon: Users,
    href: '/doi-bong',
    tags: ['Team', 'Members', 'Logo Upload'],
  },
  {
    title: 'Lịch thi đấu & BXH',
    desc: 'Hệ thống tính điểm thông minh tự động xếp hạng đội bóng theo hiệu số tức thời.',
    icon: CalendarDays,
    href: '/lich-thi-dau',
    tags: ['Matches', 'Standings', 'Sync'],
  },
  {
    title: 'Live Stream & Chat',
    desc: 'Tích hợp WebRTC LiveKit, trò chuyện trực tiếp mượt mà, tự động reconnect.',
    icon: Radio,
    href: '/live',
    tags: ['LiveKit', 'Socket.IO', 'Chat room'],
    inProgress: true,
  },
  {
    title: 'Admin Control Center',
    desc: 'Bảng điều khiển toàn diện cho quản trị viên, quản lý danh sách trận đấu và tin tức.',
    icon: Newspaper,
    href: '/admin',
    tags: ['Admin Console', 'System Health', 'News Creator'],
    inProgress: true,
  },
]

const flows = [
  ['01', 'Bảo mật tài khoản', 'Khách đăng ký -> Xác thực OTP -> Đăng nhập Token an toàn.', KeyRound, C.green, false],
  ['02', 'Đăng ký giải đấu', 'Đội bóng tạo profile -> Đăng ký giải -> Admin duyệt trực quan.', Trophy, C.amber, false],
  ['03', 'Điều khiển Realtime', 'Media cập nhật tỉ số -> Live Kit stream -> Khán giả chat trực tiếp.', Activity, C.blue, true],
  ['04', 'Phân tích dữ liệu', 'BXH tự động xếp hạng -> Tin tức xuất bản -> AI tạo highlight.', Bell, C.red, true],
]

const results = [
  { text: 'Phát triển hệ thống Next.js với đầy đủ luồng nghiệp vụ lớn cho khán giả và quản trị viên.', inProgress: true },
  { text: 'Cơ chế cào dữ liệu trận đấu tự động, hiển thị tỉ số trực tiếp theo thời gian thực.', inProgress: false },
  { text: 'Tích hợp AWS S3 đám mây cho toàn bộ luồng upload logo, avatar và ảnh tin tức.', inProgress: false },
  { text: 'Hệ thống Live Control Center cho Media điều khiển luồng live, chat realtime.', inProgress: true },
]

const directions = [
  'Hệ thống Đặt sân trực tuyến: Cho phép người dùng tìm kiếm, đặt lịch sân bóng thực tế.',
  'Tính năng Cáp kèo giao hữu: Kết nối các đội bóng tự do bắt cặp thi đấu, chia sẻ chi phí.',
  'AI hỗ trợ Media chuyên nghiệp: Nhận diện tình huống nguy hiểm để tạo Highlights tự động và tự động phát lại (auto-replay) cho kỹ thuật viên.',
  'Hoàn thiện hiển thị và tối ưu hóa trải nghiệm trên ứng dụng di động Mobile App.',
]

const slides = [
  { id: 0, title: 'Trang chủ', subtitle: 'Phủi Score' },
  { id: 1, title: 'Chương 1', subtitle: 'Tổng quan & Bối cảnh' },
  { id: 2, title: 'Chương 2', subtitle: 'Cơ sở Công nghệ' },
  { id: 3, title: 'Chương 3', subtitle: 'Thiết kế Hệ thống' },
  { id: 4, title: 'Chương 4', subtitle: 'Tính năng Hiện thực' },
  { id: 5, title: 'Chương 5', subtitle: 'Tổng kết & Định hướng' },
]

export const AcademicIntro = () => {
  const media = useMedia()
  const router = useRouter()
  const isMobile = !media.gtSm
  const logoSrc = (LogoAsset as any)?.src || LogoAsset

  const [activeSlide, setActiveSlide] = useState(0)
  const AnimYStack = YStack as any;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault()
        setActiveSlide((prev) => Math.min(prev + 1, slides.length - 1))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setActiveSlide((prev) => Math.max(prev - 1, 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const nextSlide = () => setActiveSlide((prev) => Math.min(prev + 1, slides.length - 1))
  const prevSlide = () => setActiveSlide((prev) => Math.max(prev - 1, 0))

  return (
    <YStack height="100vh" backgroundColor={C.bg as any} position="relative" overflow="hidden" justifyContent="center">
      
      {/* 🏁 BOLDER GRID DOT MATRIX BACKGROUND PATTERN (DENSE OR EMERALD GREENS) */}
      <View
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{
          backgroundImage: 'radial-gradient(rgba(5, 150, 105, 0.18) 2px, transparent 2px)',
          backgroundSize: '28px 28px'
        }}
        pointerEvents="none"
      />

      {/* 🚀 SUBTLE EXECUTIVE BACKGROUND DECORATIONS (GLOWING BLOBS) */}
      <View
        position="absolute"
        top="-10%"
        left="-10%"
        width={700}
        height={700}
        borderRadius={350}
        backgroundColor="rgba(16, 185, 129, 0.06)"
        style={{ filter: 'blur(160px)' }}
        pointerEvents="none"
      />
      <View
        position="absolute"
        bottom="-10%"
        right="-10%"
        width={800}
        height={800}
        borderRadius={400}
        backgroundColor="rgba(37, 99, 235, 0.05)"
        style={{ filter: 'blur(180px)' }}
        pointerEvents="none"
      />

      {/* 🟢 TOP PRESENTATION PROGRESS BAR */}
      <View 
        position="absolute"
        top={0}
        left={0}
        height={6}
        backgroundColor={C.green as any}
        width={`${((activeSlide + 1) / slides.length) * 100}%`}
        style={{ transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
        zIndex={100}
      />

      {/* 🎞️ SLIDE CANVAS AREA */}
      <YStack flex={1} paddingHorizontal={isMobile ? '$3' : '$8'} paddingVertical={isMobile ? '$3' : '$4'} justifyContent="center" alignItems="center">
        
        {/* SLIDE CARD */}
        <YStack
          width="96%"
          maxWidth={1480}
          height={isMobile ? '82%' : '90vh'}
          backgroundColor={C.panel as any}
          borderWidth={1.5}
          borderColor={C.green as any} // High-end deep emerald green card border
          borderRadius={24}
          overflow="hidden"
          position="relative"
          style={{ 
            boxShadow: 'rgba(15, 23, 42, 0.12) 0px 30px 90px',
          }}
        >
          {/* 📐 BOLDER DECORATIVE BLUEPRINT / TECHNICAL PITCH DECK GLYPHS */}
          
          {/* Technical Solid Left Accent Stripe */}
          <View
            position="absolute"
            left={0}
            top={0}
            bottom={0}
            width={8}
            backgroundColor={C.green as any}
            zIndex={10}
            pointerEvents="none"
          />

          {/* Technical Corner Brackets / L-Shaped Alignment Glyphs */}
          <View position="absolute" top={24} left={32} width={28} height={28} borderLeftWidth={3} borderTopWidth={3} borderColor="rgba(5, 150, 105, 0.4)" pointerEvents="none" />
          <View position="absolute" top={24} right={32} width={28} height={28} borderRightWidth={3} borderTopWidth={3} borderColor="rgba(5, 150, 105, 0.4)" pointerEvents="none" />
          <View position="absolute" bottom={24} left={32} width={28} height={28} borderLeftWidth={3} borderBottomWidth={3} borderColor="rgba(5, 150, 105, 0.4)" pointerEvents="none" />
          <View position="absolute" bottom={24} right={32} width={28} height={28} borderRightWidth={3} borderBottomWidth={3} borderColor="rgba(5, 150, 105, 0.4)" pointerEvents="none" />

          {/* Floating blueprint technical circles (Top-Right) */}
          <View
            position="absolute"
            top={-100}
            right={-100}
            width={340}
            height={340}
            borderRadius={170}
            borderWidth={1.5}
            borderColor="rgba(5, 150, 105, 0.3)"
            pointerEvents="none"
          />
          <View
            position="absolute"
            top={-80}
            right={-80}
            width={300}
            height={300}
            borderRadius={150}
            borderWidth={1.5}
            borderColor="rgba(5, 150, 105, 0.18)"
            pointerEvents="none"
          />
          <View
            position="absolute"
            top={-60}
            right={-60}
            width={260}
            height={260}
            borderRadius={130}
            borderWidth={1}
            borderColor="rgba(5, 150, 105, 0.08)"
            pointerEvents="none"
          />

          {/* Floating blueprint technical circles (Bottom-Left) */}
          <View
            position="absolute"
            bottom={-120}
            left={-120}
            width={380}
            height={380}
            borderRadius={190}
            borderWidth={1.5}
            borderColor="rgba(37, 99, 235, 0.2)"
            pointerEvents="none"
          />
          <View
            position="absolute"
            bottom={-100}
            left={-100}
            width={340}
            height={340}
            borderRadius={170}
            borderWidth={1}
            borderColor="rgba(37, 99, 235, 0.1)"
            pointerEvents="none"
          />

          {/* Technical Dot Matrix Grid Inside the Card Background */}
          <View
            position="absolute"
            top={80}
            left={80}
            width={160}
            height={100}
            style={{
              backgroundImage: 'radial-gradient(rgba(5, 150, 105, 0.16) 1.5px, transparent 1.5px)',
              backgroundSize: '16px 16px'
            }}
            pointerEvents="none"
          />
          
          {/* Subtle Grid Pattern Overlay inside the slide itself for perfect blueprint texture */}
          <View
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            style={{
              backgroundImage: 'radial-gradient(rgba(5, 150, 105, 0.06) 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px'
            }}
            pointerEvents="none"
          />

          {/* SLIDE CONTENT RENDERING */}
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <YStack padding={isMobile ? '$5' : '$10'} gap="$6" justifyContent="center" zIndex={1}>
              
              {/* SLIDE 0: HERO / COVER */}
              {activeSlide === 0 && (
                <AnimYStack gap="$6" animation="lazy" enterStyle={{ opacity: 0, y: 20 }}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text color={C.green as any} fontSize={18} fontWeight="900" letterSpacing={4}>
                      BÁO CÁO BÀI TẬP LỚN MÔN PHÁT TRIỂN GIAO DIỆN ỨNG DỤNG
                    </Text>
                    <Image src={logoSrc as any} width={130} height={36} objectFit="contain" $ltSm={{ display: 'none' } as any} />
                  </XStack>
                  <Text color={C.text as any} fontSize={isMobile ? 56 : 95} lineHeight={isMobile ? 66 : 105} fontWeight="900" letterSpacing={-3}>
                    PHỦI <Text color={C.green as any}>SCORE</Text>
                  </Text>
                  <Text color={C.text as any} fontSize={isMobile ? 24 : 40} lineHeight={isMobile ? 36 : 54} fontWeight="800">
                    Hệ thống tích hợp Website quản lý & Livestream Bóng đá phong trào
                  </Text>

                  {/* 🎓 Student & Instructor Presentation Panel */}
                  <XStack gap="$8" flexWrap="wrap" marginTop="$2" padding="$4" backgroundColor="rgba(5, 150, 105, 0.04)" borderRadius={16} borderWidth={1.5} borderColor="rgba(5, 150, 105, 0.15)">
                    <YStack gap="$1">
                      <Text color={C.green as any} fontSize={12} fontWeight="900" letterSpacing={1}>SINH VIÊN THỰC HIỆN</Text>
                      <Text color={C.text as any} fontSize={18} fontWeight="900">Lê Công Chung - MSSV: 23637071</Text>
                    </YStack>
                    <View width={1.5} height={40} backgroundColor={C.border as any} $ltSm={{ display: 'none' } as any} />
                    <YStack gap="$1">
                      <Text color={C.green as any} fontSize={12} fontWeight="900" letterSpacing={1}>GIẢNG VIÊN HƯỚNG DẪN</Text>
                      <Text color={C.text as any} fontSize={18} fontWeight="900">ThS. Nguyễn Trọng Tiến</Text>
                    </YStack>
                  </XStack>

                </AnimYStack>
              )}

              {/* SLIDE 1: CHAPTER 1 */}
              {activeSlide === 1 && (
                <AnimYStack gap="$5" animation="lazy" enterStyle={{ opacity: 0, y: 20 }}>
                  <SlideHeader num="CHƯƠNG 01" title="Tổng quan & Bối cảnh Đề tài" subtitle="Xác định lý do hình thành và phạm vi nghiên cứu thực tế." logoSrc={logoSrc} />
                  <XStack flexWrap="wrap" gap="$5" alignItems="stretch" marginTop="$2">
                    {overview.map((item) => (
                      <InfoCard key={item.title} item={item} />
                    ))}
                  </XStack>
                </AnimYStack>
              )}

              {/* SLIDE 2: CHAPTER 2 */}
              {activeSlide === 2 && (
                <AnimYStack gap="$5" animation="lazy" enterStyle={{ opacity: 0, y: 20 }}>
                  <SlideHeader num="CHƯƠNG 02" title="Công nghệ sử dụng" subtitle="Danh sách các công nghệ đang vận hành hệ thống Phủi Score." logoSrc={logoSrc} />
                  <XStack flexWrap="wrap" gap="$4" marginTop="$2">
                    {techStack.map((item) => (
                      <TechCard key={item.name} name={item.name} desc={item.desc} logos={item.logos} />
                    ))}
                  </XStack>
                </AnimYStack>
              )}

              {/* SLIDE 3: CHAPTER 3 */}
              {activeSlide === 3 && (
                <AnimYStack gap="$5" animation="lazy" enterStyle={{ opacity: 0, y: 20 }}>
                  <SlideHeader num="CHƯƠNG 03" title="Phân tích & Thiết kế Hệ thống" subtitle="Cơ chế phân quyền người dùng." logoSrc={logoSrc} />
                  <XStack flexWrap="wrap" gap="$8" alignItems="stretch" marginTop="$2">
                    <YStack flex={1} minWidth={isMobile ? '100%' : 460} gap="$4">
                      <Text color={C.green as any} fontSize={18} fontWeight="900" letterSpacing={3}>PHÂN QUYỀN (ACTOR & ROLES)</Text>
                      {roles.map(([name, desc]) => (
                        <RoleRow key={name} name={name} desc={desc} />
                      ))}
                    </YStack>
                  </XStack>
                </AnimYStack>
              )}

              {/* SLIDE 4: CHAPTER 4 */}
              {activeSlide === 4 && (
                <AnimYStack gap="$5" animation="lazy" enterStyle={{ opacity: 0, y: 20 }}>
                  <SlideHeader num="CHƯƠNG 04" title="Các Phân hệ Tính năng Thực tiễn" subtitle="Toàn bộ các phân hệ chức năng đã và đang hoàn thiện giao diện và API." logoSrc={logoSrc} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
                    <XStack gap="$5" paddingBottom="$4">
                      {modules.map((item) => (
                        <ModuleCard key={item.title} item={item} onPress={() => router.push(item.href)} />
                      ))}
                    </XStack>
                  </ScrollView>
                  <XStack flexWrap="wrap" gap="$4" marginTop="$2">
                    {flows.map(([index, title, desc, Icon, color, inProgress]) => (
                      <FlowStep key={String(index)} index={index} title={title} desc={desc} Icon={Icon} color={color} inProgress={inProgress} />
                    ))}
                  </XStack>
                </AnimYStack>
              )}

              {/* SLIDE 5: CHAPTER 5 */}
              {activeSlide === 5 && (
                <AnimYStack gap="$5" animation="lazy" enterStyle={{ opacity: 0, y: 20 }}>
                  <SlideHeader num="CHƯƠNG 05" title="Tổng kết kết quả & Hướng phát triển" subtitle="Đánh giá khách quan thành tựu đạt được và định hướng nâng cấp AI." logoSrc={logoSrc} />
                  <XStack flexWrap="wrap" gap="$8" alignItems="stretch" marginTop="$2">
                    <YStack flex={1} minWidth={isMobile ? '100%' : 460} gap="$4">
                      <Text color={C.green as any} fontSize={18} fontWeight="900" letterSpacing={3}>KẾT QUẢ ĐẠT ĐƯỢC</Text>
                      {results.map((item) => (
                        <NoteRow key={item.text} text={item.text} tone="green" inProgress={item.inProgress as boolean} />
                      ))}
                    </YStack>
                    <YStack flex={1} minWidth={isMobile ? '100%' : 460} gap="$4">
                      <Text color={C.amber as any} fontSize={18} fontWeight="900" letterSpacing={3}>ĐỊNH HƯỚNG PHÁT TRIỂN</Text>
                      {directions.map((item) => (
                        <NoteRow key={item} text={item} tone="amber" />
                      ))}
                    </YStack>
                  </XStack>
                </AnimYStack>
              )}

            </YStack>
          </ScrollView>
        </YStack>
      </YStack>

      {/* 🧭 NAVIGATION FOOTER BAR */}
      <XStack 
        paddingHorizontal={isMobile ? '$5' : '$10'} 
        paddingVertical="$4" 
        justifyContent="space-between" 
        alignItems="center"
        backgroundColor="#ffffff"
        borderTopWidth={1.5}
        borderColor={C.border as any}
        zIndex={10}
        style={{ 
          boxShadow: '0 -4px 25px rgba(0,0,0,0.03)'
        }}
      >
        <XStack gap="$4" alignItems="center">
          <Button 
            size="$4.5" 
            backgroundColor={C.bg as any}
            hoverStyle={{ backgroundColor: '#e5e7eb' } as any}
            onPress={() => router.push('/')}
            borderRadius={12}
          >
            <Home size={18} color={C.text as any} />
            <Text color={C.text as any} fontWeight="800" fontSize={15}>Về Trang chủ</Text>
          </Button>
          <View width={1.5} height={20} backgroundColor={C.border as any} />
          <Text color={C.green as any} fontSize={16} fontWeight="900">
            {slides[activeSlide].title.toUpperCase()} : {slides[activeSlide].subtitle.toUpperCase()}
          </Text>
        </XStack>

        <XStack gap="$3">
          <Button 
            size="$4.5" 
            backgroundColor={C.bg as any}
            hoverStyle={{ backgroundColor: '#e5e7eb' } as any}
            disabled={activeSlide === 0} 
            onPress={prevSlide}
            borderRadius={12}
            paddingHorizontal="$5"
          >
            <ArrowLeft size={18} color={C.text as any} />
            <Text color={C.text as any} fontWeight="800" fontSize={15}>Slide trước</Text>
          </Button>

          <Button 
            size="$4.5" 
            backgroundColor={activeSlide === slides.length - 1 ? C.bg as any : C.green as any} 
            hoverStyle={activeSlide === slides.length - 1 ? { backgroundColor: '#e5e7eb' } : { backgroundColor: '#047857' } as any}
            disabled={activeSlide === slides.length - 1}
            onPress={nextSlide}
            borderRadius={12}
            paddingHorizontal="$5"
          >
            <Text color={activeSlide === slides.length - 1 ? C.text as any : '#ffffff' as any} fontWeight="900" fontSize={15}>Slide tiếp</Text>
            <ArrowRight size={18} color={activeSlide === slides.length - 1 ? C.text as any : '#ffffff' as any} />
          </Button>
        </XStack>
      </XStack>
    </YStack>
  )
}

const HeroMetric = ({ value, label }: { value: string, label: string }) => (
  <YStack minWidth={220} padding="$4.5" backgroundColor="#f9fafb" borderWidth={1.5} borderColor={C.border as any} borderRadius={16} flexGrow={1} gap="$1" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
    <Text color={C.green as any} fontSize={30} fontWeight="900">{value}</Text>
    <Text color={C.muted as any} fontSize={15} fontWeight="800">{label}</Text>
  </YStack>
)

const SlideHeader = ({ num, title, subtitle, logoSrc }: { num: string, title: string, subtitle: string, logoSrc: any }) => (
  <XStack justifyContent="space-between" alignItems="flex-start" borderBottomWidth={1.5} borderColor={C.border as any} paddingBottom="$4">
    <YStack gap="$2">
      <XStack alignItems="center" gap="$3.5">
        <Text color={C.green as any} fontSize={34} fontWeight="900" style={{ letterSpacing: 2 }}>{num}</Text>
        <Text color={C.text as any} fontSize={42} fontWeight="900" letterSpacing={-0.5}>{title}</Text>
      </XStack>
      <Text color={C.green as any} fontSize={20} fontWeight="700" opacity={0.8}>{subtitle}</Text>
    </YStack>
    <Image src={logoSrc as any} width={120} height={34} objectFit="contain" $ltSm={{ display: 'none' } as any} style={{ marginTop: 6 }} />
  </XStack>
)

const InfoCard = ({ item }: any) => {
  const Icon = item.icon

  return (
    <YStack flex={1} minWidth={320} backgroundColor={C.surface as any} borderWidth={1.5} borderColor={C.border as any} borderRadius={20} padding="$6" gap="$4" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.015)' }}>
      <XStack width={56} height={56} borderRadius={14} alignItems="center" justifyContent="center" backgroundColor="rgba(16,185,129,0.08)">
        <Icon size={30} color={C.green as any} />
      </XStack>
      <Text color={C.text as any} fontSize={26} fontWeight="900">{item.title}</Text>
      <Text color={C.muted as any} fontSize={20} lineHeight={30}>{item.desc}</Text>
    </YStack>
  )
}

const InfoRow = ({ item }: any) => {
  const Icon = item.icon

  return (
    <XStack gap="$4" padding="$4" backgroundColor={C.surface as any} borderRadius={16} borderWidth={1.5} borderColor={C.border as any} alignItems="flex-start" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
      <Icon size={26} color={C.blue as any} style={{ marginTop: 4 }} />
      <YStack flex={1} gap="$1.5">
        <Text color={C.text as any} fontWeight="900" fontSize={21}>{item.title}</Text>
        <Text color={C.muted as any} fontSize={18} lineHeight={26}>{item.desc}</Text>
      </YStack>
    </XStack>
  )
}

const TechCard = ({ name, desc, logos }: { name: string, desc: string, logos?: string[] }) => (
  <YStack flex={1} minWidth={280} backgroundColor={C.surface as any} borderWidth={1.5} borderColor={C.border as any} borderRadius={16} padding="$5" gap="$2.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
    <XStack justifyContent="space-between" alignItems="center">
      <Text color={C.text as any} fontSize={22} fontWeight="900">{name}</Text>
      {logos && (
        <XStack gap="$2.5">
          {logos.map((logo, idx) => (
            <Image key={idx} src={logo} width={26} height={26} style={{ objectFit: 'contain' }} />
          ))}
        </XStack>
      )}
    </XStack>
    <Text color={C.muted as any} fontSize={18} lineHeight={26}>{desc}</Text>
  </YStack>
)

const ModuleCard = ({ item, onPress }: any) => {
  const Icon = item.icon

  return (
    <YStack
      width={365}
      backgroundColor={C.surface as any}
      borderWidth={1.5}
      borderColor={C.border as any}
      borderRadius={20}
      padding="$6"
      gap="$5"
      cursor="pointer"
      hoverStyle={{ borderColor: C.green, y: -6 } as any}
      pressStyle={{ scale: 0.98 } as any}
      onPress={onPress}
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.015)' }}
    >
      <XStack justifyContent="space-between" alignItems="center">
        <XStack gap="$3" alignItems="center">
          <XStack width={52} height={52} borderRadius={14} alignItems="center" justifyContent="center" backgroundColor="rgba(16,185,129,0.08)">
            <Icon size={28} color={C.green as any} />
          </XStack>
          {item.inProgress && (
            <Text color={C.amber as any} fontSize={12} fontWeight="900" backgroundColor="rgba(217,119,6,0.12)" paddingHorizontal="$2.5" paddingVertical="$1" borderRadius={8} borderWidth={1} borderColor="rgba(217,119,6,0.2)">
              Đang hoàn thiện
            </Text>
          )}
        </XStack>
        <ChevronRight size={26} color={C.dim as any} />
      </XStack>
      <YStack gap="$3">
        <Text color={C.text as any} fontSize={24} fontWeight="900">{item.title}</Text>
        <Text color={C.muted as any} fontSize={18} lineHeight={26}>{item.desc}</Text>
      </YStack>
      <XStack gap="$2.5" flexWrap="wrap" marginTop="auto">
        {item.tags.map((tag: string) => (
          <Text key={tag} color={C.blue as any} fontSize={14} fontWeight="900" paddingHorizontal="$3" paddingVertical="$1" borderWidth={1.5} borderColor="rgba(37,99,235,0.15)" borderRadius={8}>
            {tag}
          </Text>
        ))}
      </XStack>
    </YStack>
  )
}

const FlowStep = ({ index, title, desc, Icon, color, inProgress }: any) => (
  <YStack flex={1} minWidth={240} padding="$5" backgroundColor={C.surface as any} borderWidth={1.5} borderColor={C.border as any} borderRadius={16} gap="$3.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
    <XStack justifyContent="space-between" alignItems="center">
      <XStack gap="$3" alignItems="center">
        <Text color={C.dim as any} fontSize={15} fontWeight="900">{index}</Text>
        {inProgress && (
          <Text color={C.amber as any} fontSize={11} fontWeight="900" backgroundColor="rgba(217,119,6,0.12)" paddingHorizontal="$2" paddingVertical="$0.5" borderRadius={6} borderWidth={1} borderColor="rgba(217,119,6,0.2)">
            Đang hoàn thiện
          </Text>
        )}
      </XStack>
      <Icon size={24} color={color as any} />
    </XStack>
    <Text color={C.text as any} fontSize={22} fontWeight="900">{title}</Text>
    <Text color={C.muted as any} fontSize={18} lineHeight={26}>{desc}</Text>
  </YStack>
)

const RoleRow = ({ name, desc }: { name: string, desc: string }) => (
  <XStack gap="$4" padding="$4" backgroundColor={C.surface as any} borderRadius={16} borderWidth={1.5} borderColor={C.border as any} alignItems="flex-start" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
    <Users size={26} color={C.amber as any} style={{ marginTop: 4 }} />
    <YStack flex={1} gap="$1.5">
      <Text color={C.text as any} fontWeight="900" fontSize={21}>{name}</Text>
      <Text color={C.muted as any} fontSize={18} lineHeight={26}>{desc}</Text>
    </YStack>
  </XStack>
)

const NoteRow = ({ text, tone, inProgress }: { text: string, tone: 'green' | 'amber', inProgress?: boolean }) => (
  <XStack gap="$4" alignItems="flex-start" padding="$4" backgroundColor={C.surface as any} borderWidth={1.5} borderColor={C.border as any} borderRadius={16} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
    <CheckCircle2 size={22} color={(tone === 'green' ? C.green : C.amber) as any} style={{ marginTop: 4 }} />
    <YStack flex={1} gap="$2">
      {inProgress && (
        <XStack>
          <Text color={C.amber as any} fontSize={11} fontWeight="900" backgroundColor="rgba(217,119,6,0.12)" paddingHorizontal="$2" paddingVertical="$0.5" borderRadius={6} borderWidth={1} borderColor="rgba(217,119,6,0.2)">
            Đang hoàn thiện
          </Text>
        </XStack>
      )}
      <Text color={C.muted as any} fontSize={19} lineHeight={28} marginTop={inProgress ? 0 : -2}>{text}</Text>
    </YStack>
  </XStack>
)

