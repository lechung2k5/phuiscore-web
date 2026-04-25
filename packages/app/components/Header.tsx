"use client"
import React, { 
  useState, 
  forwardRef, 
  useEffect, 
  memo, 
  useCallback, 
  useMemo 
} from 'react'
import { 
  XStack, 
  YStack, 
  Text, 
  Button, 
  Sheet, 
  ScrollView, 
  Popover, 
  View,
  Image,
  Avatar,
  Separator,
  AnimatePresence
} from 'tamagui'
import { 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  Bell, 
  ChevronRight,
  LogOut,
  User as UserIcon,
  Shield,
  Home,
  Tv,
  Trophy,
  Calendar,
  Users,
  Newspaper
} from '@tamagui/lucide-icons'
import { useRouter, usePathname } from 'solito/navigation'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

import LogoAsset from '../assets/logo.svg'

const API = 'http://localhost:5000/api'

// ==========================================================
// 1. CẤU HÌNH HỆ THỐNG & HẰNG SỐ
// ==========================================================

/**
 * Hệ màu chuẩn cho dự án Phui Score
 * Ép kiểu 'any' để linh hoạt trong hệ thống theme của Tamagui
 */
const COLORS: any = {
  logoGreen: '#28a745',
  logoBlue: '#0056b3',
  bgDark: '#0a0f0d',
  borderDark: '#1a1f1c',
  textGray: '#eee',
  subText: '#666',
  white: '#ffffff',
  red: '#e74c3c',
  popoverBg: '#0f1412'
}

/**
 * Danh mục Menu chính
 */
const MENU_ITEMS = [
  { label: 'Trang chủ', path: '/', icon: Home },
  { label: 'Trực tiếp', path: '/live', isLive: true, icon: Tv },
  { 
    label: 'Giải đấu', 
    path: '/giai-dau', 
    icon: Trophy,
    subMenu: [
      { label: 'Danh sách giải', path: '/giai-dau' },
      { label: 'Tìm giải đấu', path: '/giai-dau/tim-kiem' },
      { label: 'Tạo giải mới', path: '/giai-dau/tao-moi' },
    ]
  },
  { label: 'Lịch thi đấu', path: '/lich-thi-dau', icon: Calendar },
  { label: 'BXH', path: '/bang-xep-hang', icon: Trophy },
  { 
    label: 'Đội bóng', 
    icon: Users,
    subMenu: [
      { label: 'Tạo đội / Quản lý', path: '/user/my-teams' },
      { label: 'Tìm đội', path: '/doi-bong' },
    ]
  },
  { label: 'Tin tức', path: '/tin-tuc', icon: Newspaper },
]

// ==========================================================
// 2. SUB-COMPONENTS (TỐI ƯU HIỆU NĂNG)
// ==========================================================

/**
 * Component Logo - Đảm bảo không bị giật lag khi chuyển trang
 */
const PhuiLogo = memo(() => (
  <View width={160} height={50} justifyContent="center">
    <Image
      src={LogoAsset.src || LogoAsset}
      width={160}
      height={50}
      alt="Phui Score Logo"
      style={{ objectFit: 'contain' }} // Dùng style thay vì prop trực tiếp
    />
  </View>
))

/**
 * Button kích hoạt Menu có Dropdown
 */
const MenuTriggerButton = forwardRef<any, any>(({ label, isActive, ...props }, ref) => (
  // Bọc View và nhận ref là bắt buộc để Popover/Trigger không bị crash
  <View ref={ref}> 
    <Button 
      {...props} 
      chromeless 
      paddingHorizontal="$3" 
      iconAfter={<ChevronDown size={14} color={isActive ? '#28a745' : '#666'} />}
    >
      <Text color={isActive ? '#28a745' : '#eee'} fontWeight="700" fontSize={13}>
        {label}
      </Text>
    </Button>
  </View>
))

// ==========================================================
// 3. COMPONENT CHÍNH (HEADER)
// ==========================================================

const HeaderComponent = () => {
  // --- Hooks khởi tạo ---
  const router = useRouter()
  const pathname = usePathname()

  // --- States ---
  const [mounted, setMounted] = useState(false)
  const [openMobileMenu, setOpenMobileMenu] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)
  
  // Notification states
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState<any[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)

  // --- Effects ---
  
  /**
   * Bước 1: Mounted Guard - Giải quyết dứt điểm lỗi "(0, _react.use) is not a function"
   * và "Cannot read properties of null (reading 'useState')".
   * Ép component chỉ render sau khi Client đã hydrate xong.
   */
  useEffect(() => {
    setMounted(true)
    
    // Lấy thông tin user từ localStorage an toàn ở phía Client
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        setUser(parsed)
        fetchNotificationData() // Lấy dữ liệu thông báo khi có user
      } catch (e) {
        console.error("Critical: User data corruption in localStorage", e)
      }
    }

    // Xử lý hiệu ứng scroll
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    
    // Polling nhẹ để đếm số thông báo mỗi 60 giây (Nên dùng WebSocket trong thực tế)
    const interval = setInterval(() => {
       if (localStorage.getItem('token')) fetchNotificationData(true)
    }, 60000)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearInterval(interval)
    }
  }, [])

  /**
   * Tự động đóng menu mobile khi đường dẫn thay đổi
   */
  useEffect(() => {
    setOpenMobileMenu(false)
  }, [pathname])

  // --- Logic Functions ---

  const fetchNotificationData = async (silent = false) => {
    try {
      if (!silent) setLoadingNotifs(true)
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 5 }
      })
      if (res.data.success) {
        setUnreadCount(res.data.unreadCount || 0)
        setRecentNotifications(res.data.data || [])
      }
    } catch(e) {
      console.error("Lỗi lấy thông báo mini:", e)
    } finally {
      setLoadingNotifs(false)
    }
  }

  const handleMarkAsRead = async (id: string, currentStatus: boolean, link?: string) => {
    if (!currentStatus) {
      try {
        const token = localStorage.getItem('token')
        await axios.patch(`${API}/notifications/${id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        fetchNotificationData(true) // Làm mới sau khi xử lý
      } catch (e) {
        console.error("Lỗi mark as read:", e)
      }
    }
    if (link) {
      window.location.href = link
    }
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
  }, [router])

  /**
   * Điều hướng thông minh, kiểm tra quyền truy cập cho IUH project
   */
  const handleNavigation = useCallback((path: string | null | undefined) => {
    if (!path) return
    
    // Chặn các đường dẫn yêu cầu đăng nhập
    const protectedPaths = ['/giai-dau/tim-kiem', '/giai-dau/tao-moi', '/user/my-teams']
    if (protectedPaths.includes(path) && !user) {
      router.push('/register')
      setOpenMobileMenu(false)
      return
    }
    
    router.push(path)
    setOpenMobileMenu(false)
  }, [user, router])

  const toggleExpand = useCallback((label: string) => {
    setExpandedItem(prev => (prev === label ? null : label))
  }, [])

  const getImageUrl = (asset: any) => {
    if (typeof asset === 'string') return asset
    return asset?.src || asset?.default?.src || asset
  }

  // --- Render Guard ---
  // Nếu chưa mounted, trả về một khung trống với chiều cao cố định để tránh Layout Shift
  if (!mounted) {
    return <View height={75} backgroundColor={COLORS.bgDark} />
  }

  return (
    <YStack 
      backgroundColor={COLORS.bgDark as any} 
      position="sticky" 
      top={0} 
      zIndex={1000} 
      borderBottomWidth={1} 
      borderColor={scrolled ? COLORS.logoGreen : COLORS.borderDark as any}
      style={{
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.5)' : 'none'
      }}
    >
      {/* CSS Animation cho trạng thái LIVE */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes phuiBlinker {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        .live-dot {
          animation: phuiBlinker 1.5s infinite ease-in-out;
        }
      `}} />

      <XStack 
        maxWidth={1250 as any} 
        width="100%" 
        marginHorizontal="auto" 
        paddingVertical="$2" 
        paddingHorizontal="$4" 
        alignItems="center" 
        justifyContent="space-between"
        height={70}
      >
        
        {/* KHU VỰC BÊN TRÁI: LOGO */}
        <XStack 
          alignItems="center" 
          cursor="pointer" 
          flexShrink={0} 
          onPress={() => router.push('/')}
        >
          <PhuiLogo />
        </XStack>

        {/* KHU VỰC GIỮA: DESKTOP NAVIGATION */}
        <XStack 
          gap="$1" 
          flex={1} 
          justifyContent="center" 
          $ltLg={{ display: 'none' } as any}
        >
          {MENU_ITEMS.map((item) => {
            const isActive = item.path 
              ? (item.path === '/' ? pathname === '/' : pathname?.startsWith(item.path)) 
              : false

            // Render Menu có SubMenu
            if (item.subMenu) {
              return (
                <Popover key={item.label} size="$5" allowFlip placement="bottom">
                  <Popover.Trigger asChild>
                    <MenuTriggerButton label={item.label} isActive={isActive} />
                  </Popover.Trigger>
                  
                  <Popover.Content 
                    borderWidth={1} 
                    borderColor={COLORS.borderDark as any} 
                    elevate 
                    backgroundColor={COLORS.popoverBg as any} 
                    padding="$0" 
                    borderRadius="$4"
                    width={200 as any}
                  >
                    <YStack>
                      {item.subMenu.map((sub: any, idx: number) => {
                        const subLabel = typeof sub === 'string' ? sub : sub.label
                        const subPath  = typeof sub === 'string' ? null  : sub.path
                        return (
                          <XStack
                            key={subLabel}
                            paddingVertical="$3"
                            paddingHorizontal="$4"
                            hoverStyle={{ backgroundColor: 'rgba(40, 167, 69, 0.12)' } as any}
                            cursor="pointer"
                            alignItems="center"
                            justifyContent="space-between"
                            borderBottomWidth={idx === (item.subMenu?.length || 0) - 1 ? 0 : 1}
                            borderColor={COLORS.borderDark as any}
                            onPress={() => handleNavigation(subPath)}
                          >
                            <Text color={"#ccc" as any} fontSize={13} fontWeight="600">{subLabel}</Text>
                            <ChevronRight size={14} color={COLORS.subText as any} />
                          </XStack>
                        )
                      })}
                    </YStack>
                  </Popover.Content>
                </Popover>
              )
            }

            // Render Menu đơn (Trang chủ, Live, Tin tức...)
            return (
              <XStack key={item.label} alignItems="center">
                <Button 
                  chromeless 
                  paddingHorizontal="$4" 
                  height={40}
                  borderRadius={8}
                  hoverStyle={{ backgroundColor: 'rgba(40, 167, 69, 0.08)' } as any} 
                  onPress={() => handleNavigation(item.path)}
                >
                  <Text 
                    color={(isActive ? COLORS.logoGreen : COLORS.textGray) as any} 
                    fontWeight="700" 
                    fontSize={13}
                  >
                    {item.label}
                  </Text>
                </Button>
                {item.isLive && (
                  <View 
                    width={8 as any} 
                    height={8 as any} 
                    borderRadius={4} 
                    backgroundColor={COLORS.red as any} 
                    marginLeft={-12}
                    marginTop={-10}
                    className="live-dot"
                    shadowColor={COLORS.red}
                    shadowRadius={4}
                  />
                )}
              </XStack>
            )
          })}
        </XStack>

        {/* KHU VỰC BÊN PHẢI: USER ACTIONS & SEARCH */}
        <XStack gap="$3" alignItems="center" flexShrink={0}>
          
          {/* Nút tìm kiếm nhanh */}
          <Button 
            chromeless 
            circular
            icon={<Search size={20} color={COLORS.white as any} />} 
            p="$2" 
            $ltMd={{ display: 'none' } as any} 
            hoverStyle={{ backgroundColor: '#222' } as any}
          />
          
          {/* Thông báo (CHỈ HIỆN KHI CÓ USER) */}
          {user && (
            <Popover size="$5" allowFlip placement="bottom-end">
              <Popover.Trigger asChild>
                <XStack 
                  position="relative" 
                  p="$2" 
                  cursor="pointer" 
                  $ltMd={{ display: 'none' } as any}
                  hoverStyle={{ backgroundColor: '#222', borderRadius: 20 } as any}
                  onPress={() => fetchNotificationData()}
                >
                  <Bell size={20} color={COLORS.white as any} />
                  {unreadCount > 0 && (
                    <View 
                      position="absolute" 
                      top={2} 
                      right={2} 
                      backgroundColor={COLORS.red as any} 
                      borderRadius={10}
                      borderWidth={2}
                      borderColor={COLORS.bgDark as any}
                      minWidth={16}
                      height={16}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="#fff" fontSize={9} fontWeight="900" style={{ transform: 'scale(0.85)' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </XStack>
              </Popover.Trigger>

              <Popover.Content 
                borderWidth={1} 
                borderColor={COLORS.borderDark as any} 
                backgroundColor={COLORS.popoverBg as any} 
                padding="$0" 
                borderRadius="$4" 
                width={320 as any} 
                elevate
              >
                <YStack>
                  <XStack padding="$3" borderBottomWidth={1} borderColor={COLORS.borderDark as any} justifyContent="space-between" alignItems="center">
                    <Text color="#eee" fontWeight="800" fontSize={15}>Thông báo</Text>
                    <Button size="$2" chromeless paddingHorizontal="$2" onPress={() => { /* TODO: Mark all read */ }}>
                      <Text color={COLORS.logoGreen as any} fontSize={12} fontWeight="600">Đánh dấu đã đọc</Text>
                    </Button>
                  </XStack>

                  <YStack maxHeight={320} style={{ overflowY: 'auto' }}>
                    {loadingNotifs ? (
                       <Text color="#666" fontSize={13} textAlign="center" padding="$5">Đang tải...</Text>
                    ) : recentNotifications.length === 0 ? (
                       <YStack padding="$6" alignItems="center" opacity={0.5}>
                          <Bell size={32} color="#666" />
                          <Text color="#666" fontSize={13} marginTop="$2">Chưa có thông báo nào</Text>
                       </YStack>
                    ) : (
                      recentNotifications.map(notif => (
                        <XStack 
                          key={notif.id} 
                          padding="$3" 
                          gap="$3" 
                          borderBottomWidth={1} 
                          borderColor={"#1a1f1c" as any}
                          backgroundColor={(notif.isRead ? 'transparent' : 'rgba(0, 230, 118, 0.05)') as any}
                          cursor={notif.link ? 'pointer' : 'default'}
                          hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.03)' } as any}
                          onPress={() => handleMarkAsRead(notif.id, notif.isRead, notif.link)}
                        >
                          <View width={8} alignItems="center" paddingTop={4}>
                            {!notif.isRead && <View width={6} height={6} borderRadius={3} backgroundColor={COLORS.logoGreen as any} />}
                          </View>
                          <YStack flex={1}>
                            <Text color="#eee" fontSize={13} fontWeight={notif.isRead ? "500" : "700"}>{notif.title}</Text>
                            <Text color="#aaa" fontSize={12} numberOfLines={2} marginTop={2}>{notif.message}</Text>
                            <Text color="#666" fontSize={10} marginTop={4}>
                               {notif.createdAt && formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                            </Text>
                          </YStack>
                        </XStack>
                      ))
                    )}
                  </YStack>

                  <Button 
                    chromeless 
                    borderRadius={0} 
                    borderTopWidth={1} 
                    borderColor={COLORS.borderDark as any}
                    padding="$3"
                    onPress={() => router.push('/user/notifications')}
                    hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.03)' } as any}
                  >
                    <Text color="#aaa" fontSize={13} fontWeight="600" textAlign="center">Xem tất cả thông báo</Text>
                  </Button>
                </YStack>
              </Popover.Content>
            </Popover>
          )}

          <Separator vertical height={20} backgroundColor={"#333" as any} $ltMd={{ display: 'none' } as any} marginHorizontal="$1" />
          
          {user ? (
            /* UI KHI ĐÃ ĐĂNG NHẬP */
            <Popover size="$5" allowFlip placement="bottom-end">
              <Popover.Trigger asChild>
                <XStack 
                  alignItems="center" 
                  gap="$2.5" 
                  cursor="pointer" 
                  padding="$1"
                  borderRadius={20}
                  hoverStyle={{ backgroundColor: '#111' } as any}
                >
                  <Avatar circular size="$2.5" borderWidth={1.5} borderColor={COLORS.logoGreen as any}>
                    <Avatar.Image src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=28a745&color=fff` as any} />
                    <Avatar.Fallback backgroundColor={"#333" as any} />
                  </Avatar>
                  <YStack $ltMd={{ display: 'none' } as any}>
                    <Text color={COLORS.white as any} fontSize={13} fontWeight="800" numberOfLines={1}>{user.fullName}</Text>
                    <XStack alignItems="center" gap="$1">
                       <Shield size={10} color={COLORS.logoGreen as any} />
                       <Text color={COLORS.logoGreen as any} fontSize={10} fontWeight="700">
                        {user.role === 'MANAGER' ? 'Đội trưởng' : 'Thành viên'}
                      </Text>
                    </XStack>
                  </YStack>
                  <ChevronDown size={14} color={COLORS.subText as any} />
                </XStack>
              </Popover.Trigger>
              
              <Popover.Content 
                borderWidth={1} 
                borderColor={COLORS.borderDark as any} 
                backgroundColor={COLORS.popoverBg as any} 
                padding="$0" 
                borderRadius="$4" 
                width={220 as any} 
                elevate
              >
                <YStack padding="$2">
                  <Button 
                    unstyled 
                    padding="$3" 
                    flexDirection="row" 
                    alignItems="center" 
                    gap="$3" 
                    borderRadius={6}
                    hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.05)' } as any} 
                    onPress={() => handleNavigation('/user')}
                  >
                    <UserIcon size={18} color={COLORS.logoGreen as any} />
                    <Text color={"#ddd" as any} fontWeight="600" fontSize={14}>Hồ sơ cá nhân</Text>
                  </Button>
                  
                  <Button 
                    unstyled 
                    padding="$3" 
                    flexDirection="row" 
                    alignItems="center" 
                    gap="$3" 
                    borderRadius={6}
                    hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.05)' } as any} 
                    onPress={() => handleNavigation('/user/my-teams')}
                  >
                    <Shield size={18} color={COLORS.logoGreen as any} />
                    <Text color={"#ddd" as any} fontWeight="600" fontSize={14}>Quản lý đội bóng</Text>
                  </Button>
                  
                  <Separator marginVertical="$2" backgroundColor={COLORS.borderDark as any} />
                  
                  <Button 
                    unstyled 
                    padding="$3" 
                    flexDirection="row" 
                    alignItems="center" 
                    gap="$3" 
                    borderRadius={6}
                    onPress={handleLogout} 
                    hoverStyle={{ backgroundColor: 'rgba(231,76,60,0.1)' } as any}
                  >
                    <LogOut size={18} color={COLORS.red as any} />
                    <Text color={COLORS.red as any} fontWeight="700" fontSize={14}>Đăng xuất</Text>
                  </Button>
                </YStack>
              </Popover.Content>
            </Popover>
          ) : (
            /* UI KHI CHƯA ĐĂNG NHẬP */
            <XStack gap="$2">
              <Button 
                chromeless 
                onPress={() => router.push('/login')}
                $ltSm={{ display: 'none' } as any}
              >
                <Text color={COLORS.white as any} fontWeight="700" fontSize={13}>Đăng nhập</Text>
              </Button>
              <Button 
                backgroundColor={COLORS.logoBlue as any} 
                borderRadius="$10" 
                height={36}
                onPress={() => router.push('/register')}
                hoverStyle={{ backgroundColor: '#004494' } as any}
              >
                <Text color={COLORS.white as any} fontWeight="900" fontSize={12} letterSpacing={0.5}>ĐĂNG KÝ</Text>
              </Button>
            </XStack>
          )}

          {/* NÚT THÔNG BÁO MOBILE (Chỉ hiện khi màn hình nhỏ và có user) */}
          {user && (
            <XStack
              $gtMd={{ display: 'none' } as any}
              position="relative"
              padding="$2"
              onPress={() => router.push('/user/notifications')}
            >
              <Bell size={24} color={COLORS.white as any} />
              {unreadCount > 0 && (
                <View 
                  position="absolute" 
                  top={0} 
                  right={0} 
                  backgroundColor={COLORS.red as any} 
                  borderRadius={10}
                  minWidth={16}
                  height={16}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="#fff" fontSize={9} fontWeight="900" style={{ transform: 'scale(0.85)' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </XStack>
          )}

          {/* NÚT MỞ MENU MOBILE */}
          <Button 
            $ltLg={{ display: 'flex' } as any} 
            display="none" 
            chromeless 
            circular
            icon={<Menu color={COLORS.white as any} size={28} />} 
            onPress={() => setOpenMobileMenu(true)} 
          />
        </XStack>
      </XStack>

      {/* ==========================================================
          MOBILE MENU (BOTTOM SHEET)
          ========================================================== */}
      <Sheet 
        open={openMobileMenu} 
        onOpenChange={setOpenMobileMenu} 
        snapPoints={[90]} 
        position={0} 
        dismissOnSnapToBottom 
        modal
      >
        <Sheet.Overlay 
          backgroundColor={"rgba(0,0,0,0.95)" as any} 
        />
        <Sheet.Handle backgroundColor={COLORS.logoGreen as any} height={4} />
        <Sheet.Frame backgroundColor={COLORS.bgDark as any} padding="$4" borderTopLeftRadius={25} borderTopRightRadius={25}>
          
          {/* Header trong Sheet */}
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$6">
            <Image src={getImageUrl(LogoAsset) as any} width={130 as any} height={40 as any} style={{ objectFit: 'contain' } as any} />
            <Button 
              icon={<X color={COLORS.white as any} size={26} />} 
              circular
              backgroundColor="#222"
              onPress={() => setOpenMobileMenu(false)} 
            />
          </XStack>
          
          <ScrollView width="100%" showsVerticalScrollIndicator={false}>
            <YStack gap="$2" paddingBottom="$10">
              
              {/* Profile Section on Mobile */}
              {user && (
                <XStack 
                  alignItems="center" 
                  gap="$4" 
                  padding="$4" 
                  marginBottom="$4" 
                  backgroundColor="#111"
                  borderRadius={15}
                  onPress={() => handleNavigation('/user')}
                >
                  <Avatar circular size="$5" borderWidth={2} borderColor={COLORS.logoGreen as any}>
                    <Avatar.Image src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=28a745&color=fff` as any} />
                  </Avatar>
                  <YStack flex={1}>
                    <Text color={COLORS.white as any} fontSize={18} fontWeight="900">{user.fullName}</Text>
                    <Text color={COLORS.logoGreen as any} fontSize={13} fontWeight="600">{user.role === 'MANAGER' ? 'Quản lý Đội bóng' : 'Thành viên'}</Text>
                  </YStack>
                  <ChevronRight size={20} color={COLORS.subText as any} />
                </XStack>
              )}

              {/* Menu Items List */}
              {MENU_ITEMS.map((item) => {
                const isExpanded = expandedItem === item.label
                const ItemIcon = item.icon

                return (
                  <YStack key={item.label} borderBottomWidth={1} borderColor={COLORS.borderDark as any}>
                    <XStack 
                      paddingVertical="$4" 
                      justifyContent="space-between" 
                      alignItems="center" 
                      onPress={() => item.subMenu ? toggleExpand(item.label) : handleNavigation(item.path)}
                    >
                      <XStack alignItems="center" gap="$3">
                        <View width={36} height={36} borderRadius={10} backgroundColor="#111" alignItems="center" justifyContent="center">
                           <ItemIcon size={18} color={isExpanded ? COLORS.logoGreen : COLORS.textGray as any} />
                        </View>
                        <Text color={isExpanded ? COLORS.logoGreen : COLORS.white as any} fontSize={16} fontWeight="700">
                          {item.label}
                        </Text>
                        {item.isLive && (
                          <View width={6} height={6} borderRadius={3} backgroundColor={COLORS.red as any} />
                        )}
                      </XStack>
                      {item.subMenu && (
                        <ChevronDown 
                          size={20} 
                          color={isExpanded ? COLORS.logoGreen : ("#555" as any)} 
                          rotate={isExpanded ? "180deg" : "0deg"} 
                        />
                      )}
                    </XStack>
                    
                    {/* Submenu on Mobile */}
                    <AnimatePresence>
                      {item.subMenu && isExpanded && (
                        <YStack 
                          paddingLeft="$11" 
                          paddingBottom="$4" 
                          gap="$4"
                        >
                          {item.subMenu.map((sub: any) => {
                            const subLabel = typeof sub === 'string' ? sub : sub.label
                            const subPath  = typeof sub === 'string' ? null  : sub.path
                            return (
                              <XStack 
                                key={subLabel} 
                                paddingVertical="$1" 
                                onPress={() => handleNavigation(subPath)}
                                pressStyle={{ opacity: 0.5 }}
                              >
                                <Text color={"#888" as any} fontSize={15} fontWeight="600">{subLabel}</Text>
                              </XStack>
                            )
                          })}
                        </YStack>
                      )}
                    </AnimatePresence>
                  </YStack>
                )
              })}

              {/* Mobile Footer Auth Buttons */}
              <YStack marginTop="$8" gap="$3.5">
                {!user ? (
                  <>
                    <Button 
                      backgroundColor={COLORS.logoBlue as any} 
                      size="$5" 
                      borderRadius="$10" 
                      onPress={() => { setOpenMobileMenu(false); router.push('/register'); }}
                    >
                      <Text color={COLORS.white as any} fontWeight="900" fontSize={15}>ĐĂNG KÝ NGAY</Text>
                    </Button>
                    <Button 
                      chromeless 
                      borderWidth={1} 
                      borderColor={"#333" as any} 
                      size="$5" 
                      borderRadius="$10" 
                      onPress={() => { setOpenMobileMenu(false); router.push('/login'); }}
                    >
                      <Text color={COLORS.textGray as any} fontWeight="700">Đăng nhập</Text>
                    </Button>
                  </>
                ) : (
                  <Button 
                    backgroundColor={COLORS.red as any} 
                    size="$5" 
                    borderRadius="$10" 
                    icon={<LogOut size={20} />}
                    onPress={handleLogout}
                  >
                    <Text color={COLORS.white as any} fontWeight="900" fontSize={15}>ĐĂNG XUẤT</Text>
                  </Button>
                )}
              </YStack>
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  )
}

// 4. Export Component với định danh rõ ràng
export const Header = memo(HeaderComponent)

