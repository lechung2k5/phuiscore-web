"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  H2,
  Image,
  ScrollView,
  Separator,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
  useMedia,
} from 'tamagui'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  Crown,
  Edit3,
  Images,
  Lock,
  Mail,
  MapPin,
  Medal,
  MessageCircle,
  Newspaper,
  Phone,
  Radio,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  Users,
} from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const API = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`

const C = {
  bg: '#050706',
  surface: '#0d1210',
  panel: '#111816',
  panelSoft: '#151d1a',
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(74,222,128,0.26)',
  text: '#f7faf7',
  muted: '#9aa7a0',
  green: '#35d071',
  greenDark: '#123f27',
  amber: '#f5c451',
  blue: '#68a7ff',
  red: '#ef6868',
}

const coverImages: Record<string, string> = {
  user: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1800&q=80',
  manager: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1800&q=80',
  creator: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1800&q=80',
  media: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=80',
  coordinator: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1800&q=80',
  admin: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1800&q=80',
  super_admin: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1800&q=80',
}

const roleCopy: Record<string, any> = {
  user: {
    label: 'Cầu thủ',
    tagline: 'Hồ sơ bóng đá phủi, đội bóng và lịch thi đấu cá nhân.',
    primary: 'Mời vào đội',
    icon: Star,
  },
  manager: {
    label: 'Đội trưởng',
    tagline: 'Quản lý đội, thành viên, lịch đấu và đăng ký giải.',
    primary: 'Quản lý đội',
    icon: Users,
  },
  creator: {
    label: 'Biên tập viên',
    tagline: 'Tác giả tin tức, bài viết và câu chuyện bóng đá phủi.',
    primary: 'Viết bài mới',
    icon: Newspaper,
  },
  media: {
    label: 'Media',
    tagline: 'Vận hành live match, hình ảnh và khoảnh khắc trận đấu.',
    primary: 'Vào live control',
    icon: Radio,
  },
  coordinator: {
    label: 'Điều phối viên',
    tagline: 'Điều phối giải đấu, trận đấu và kết quả cần xử lý.',
    primary: 'Xem việc cần xử lý',
    icon: CalendarDays,
  },
  admin: {
    label: 'Admin',
    tagline: 'Vận hành người dùng, đội bóng, giải đấu và nội dung.',
    primary: 'Admin dashboard',
    icon: ShieldCheck,
  },
  super_admin: {
    label: 'Super Admin',
    tagline: 'Toàn quyền hệ thống, bảo mật, audit và phân quyền.',
    primary: 'Quản trị hệ thống',
    icon: Crown,
  },
}

const samplePhotos = [
  'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=75',
]

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const media = useMedia()
  const isMobile = !media.gtSm
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)

  useEffect(() => {
    fetchUserProfile()
  }, [params.id])

  const fetchUserProfile = async () => {
    try {
      const token = getClientToken()
      const response = await fetch(`${API}/auth/profile/${params.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await response.json()
      if (response.ok) {
        setUserData(data)
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Lỗi kết nối Profile API', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadProfileImage = async (type: 'avatar' | 'cover' | 'photo', file?: File | null) => {
    if (!file) return

    const token = getClientToken()
    if (!token) {
      alert('Bạn cần đăng nhập để cập nhật ảnh hồ sơ.')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh.')
      return
    }

    if (file.size > 6 * 1024 * 1024) {
      alert('Ảnh tối đa 6MB. Bạn nén ảnh nhỏ hơn rồi thử lại nhé.')
      return
    }

    try {
      setUploadingImage(type)
      const base64 = await fileToBase64(file)
      const response = await fetch(`${API}/auth/me/profile-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, filename: file.name, base64 }),
      })
      const data = await response.json()
      if (response.status === 401) {
        throw new Error(data.message || 'Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại rồi upload ảnh nhé.')
      }
      if (!response.ok) throw new Error(data.message || 'Upload ảnh thất bại')

      const nextProfile = data.publicProfile || data.user
      if (nextProfile) setUserData(nextProfile)
      if (data.user) syncLocalUser(data.user)
    } catch (error: any) {
      console.error('Upload profile image error', error)
      alert(error.message || 'Không thể upload ảnh hồ sơ.')
    } finally {
      setUploadingImage(null)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      if (coverInputRef.current) coverInputRef.current.value = ''
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const openImagePicker = (type: 'avatar' | 'cover' | 'photo') => {
    const inputRef = type === 'avatar' ? avatarInputRef : type === 'cover' ? coverInputRef : photoInputRef
    if (inputRef.current) {
      inputRef.current.click()
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => uploadProfileImage(type, input.files?.[0])
    input.click()
  }

  const role = String(userData?.role || 'user').toLowerCase()
  const roleInfo = roleCopy[role] || roleCopy.user
  const RoleIcon = roleInfo.icon
  const cover = userData?.coverUrl || coverImages[role] || coverImages.user
  const displayName = userData?.fullName || userData?.username || 'PhuiScore User'
  const usage = userData?.usage || {}
  const isAdminRole = ['admin', 'super_admin'].includes(role)
  const localUsername = getLocalUsername()
  const isOwner = Boolean(
    userData?.isOwner ||
    (localUsername && localUsername === userData?.username) ||
    (localUsername && localUsername === params.id)
  )
  const profilePhotos = Array.isArray(userData?.photos) && userData.photos.length > 0 ? userData.photos : samplePhotos

  const stats = useMemo(() => [
    {
      label: 'Giải đấu',
      value: `${usage.leaguesCreated ?? 0}/${usage.limitLeagues ?? 0}`,
      sub: 'Lượt tạo giải',
      icon: Trophy,
      color: C.green,
    },
    {
      label: 'Trận đấu',
      value: `${usage.matchesCreated ?? 0}/${usage.limitMatches ?? 0}`,
      sub: 'Lượt tạo trận',
      icon: CalendarDays,
      color: C.blue,
    },
    {
      label: 'Đội bóng',
      value: role === 'manager' ? 'Quản lý' : 'Đang theo dõi',
      sub: 'Kết nối đội',
      icon: Users,
      color: C.amber,
    },
    {
      label: 'Hạng phủi',
      value: isAdminRole ? 'System' : 'Bạc',
      sub: 'Hồ sơ hoạt động',
      icon: Medal,
      color: C.red,
    },
  ], [usage.leaguesCreated, usage.limitLeagues, usage.matchesCreated, usage.limitMatches, role, isAdminRole])

  if (loading) {
    return (
      <YStack flex={1} minHeight="100vh" backgroundColor={C.bg as any} justifyContent="center" alignItems="center" gap="$4">
        <Spinner size="large" color={C.green as any} />
        <Text color={C.text as any} fontWeight="700">Đang tải hồ sơ...</Text>
      </YStack>
    )
  }

  if (!userData) {
    return (
      <YStack minHeight="100vh" backgroundColor={C.bg as any} justifyContent="center" alignItems="center" gap="$4" padding="$5">
        <Text color={C.text as any} fontSize={20} fontWeight="800">Không tìm thấy hồ sơ</Text>
        <Button icon={ArrowLeft} onPress={() => router.back()} borderRadius={8}>Quay lại</Button>
      </YStack>
    )
  }

  return (
    <ScrollView backgroundColor={C.bg as any} flex={1}>
      <YStack minHeight="100vh" backgroundColor={C.bg as any}>
        <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={(event) => uploadProfileImage('avatar', event.target.files?.[0])} />
        <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={(event) => uploadProfileImage('cover', event.target.files?.[0])} />
        <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={(event) => uploadProfileImage('photo', event.target.files?.[0])} />

        <View height={isMobile ? 260 : 360} position="relative" overflow="hidden">
          <View
            position="absolute"
            inset={0}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(5,7,6,0.05) 0%, rgba(5,7,6,0.45) 55%, ${C.bg} 100%), url(${cover})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            } as any}
          />
          <XStack position="absolute" top="$4" left="$4" right="$4" justifyContent="space-between" alignItems="center">
            <Button size="$3" icon={ArrowLeft} borderRadius={8} backgroundColor="rgba(0,0,0,0.45)" color={"white" as any} onPress={() => router.back()}>
              Trang chủ
            </Button>
            <XStack gap="$2">
              {isOwner && (
                <IconButton
                  label={uploadingImage === 'cover' ? 'Đang tải...' : 'Đổi ảnh bìa'}
                  onPress={() => openImagePicker('cover')}
                  icon={uploadingImage === 'cover' ? <Spinner size="small" color={C.green as any} /> : <Camera size={18} color={"white" as any} />}
                />
              )}
              <IconButton icon={<Share2 size={18} color={"white" as any} />} />
            </XStack>
          </XStack>
        </View>

        <YStack maxWidth={1180} width="100%" marginHorizontal="auto" paddingHorizontal={isMobile ? '$3' : '$5'} paddingBottom="$10" gap="$5" marginTop={isMobile ? -72 : -92}>
          <Card borderRadius={8} backgroundColor={C.surface as any} borderWidth={1} borderColor={C.borderStrong as any} padding={isMobile ? '$4' : '$5'}>
            <XStack gap="$5" alignItems="flex-end" $ltMd={{ flexDirection: 'column', alignItems: 'flex-start' } as any}>
              <View position="relative">
                <Avatar circular size={isMobile ? '$10' : '$12'} borderWidth={4} borderColor={C.bg as any}>
                  <Avatar.Image 
                    src={userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=35d071&color=06120b&size=256`} 
                    fullscreen={undefined as any}
                  />
                  <Avatar.Fallback backgroundColor={C.green as any} />
                </Avatar>
                <XStack position="absolute" right={0} bottom={2} width={34} height={34} borderRadius={17} backgroundColor={C.green as any} alignItems="center" justifyContent="center" borderWidth={3} borderColor={C.surface as any}>
                  <RoleIcon size={16} color={"#06120b" as any} />
                </XStack>
                {isOwner && (
                  <XStack
                    position="absolute"
                    left={2}
                    bottom={2}
                    width={34}
                    height={34}
                    borderRadius={17}
                    backgroundColor="rgba(0,0,0,0.72)"
                    alignItems="center"
                    justifyContent="center"
                    borderWidth={3}
                    borderColor={C.surface as any}
                    style={{ cursor: 'pointer' }}
                    onPress={() => openImagePicker('avatar')}
                  >
                    {uploadingImage === 'avatar' ? <Spinner size="small" color={C.green as any} /> : <Camera size={15} color={"white" as any} />}
                  </XStack>
                )}
              </View>

              <YStack flex={1} gap="$2" minWidth={0}>
                <XStack alignItems="center" gap="$2" flexWrap="wrap">
                  <H2 color={C.text as any} fontWeight="900" fontSize={isMobile ? 27 : 36} lineHeight={isMobile ? 32 : 42}>
                    {displayName}
                  </H2>
                  <Badge tone="green" icon={<CheckCircle2 size={13} color={C.green as any} />} text={roleInfo.label} />
                  <Badge tone="amber" icon={<Sparkles size={13} color={C.amber as any} />} text={userData.plan || 'FREE'} />
                </XStack>
                <Text color={C.muted as any} fontWeight="700">@{userData.username}</Text>
                <Text color={C.text as any} fontSize={15} lineHeight={22} maxWidth={680}>
                  {userData.bio || roleInfo.tagline}
                </Text>
                <XStack gap="$3" flexWrap="wrap" marginTop="$1">
                  <MiniMeta icon={<MapPin size={15} color={C.green as any} />} text={userData.area || 'Chưa cập nhật khu vực'} />
                  <MiniMeta icon={<ShieldCheck size={15} color={C.blue as any} />} text={userData.status || 'ACTIVE'} />
                  <MiniMeta icon={<CalendarDays size={15} color={C.amber as any} />} text={`Tham gia ${formatDate(userData.createdAt)}`} />
                </XStack>
              </YStack>

              <XStack gap="$2" $ltSm={{ width: '100%' } as any}>
                {isOwner && (
                  <Button
                    flex={isMobile ? 1 : undefined}
                    icon={uploadingImage === 'avatar' ? undefined : Camera}
                    borderRadius={8}
                    backgroundColor={C.panelSoft as any}
                    color={C.text as any}
                    borderWidth={1}
                    borderColor={C.border as any}
                    disabled={uploadingImage === 'avatar'}
                    onPress={() => openImagePicker('avatar')}
                  >
                    {uploadingImage === 'avatar' ? 'Đang tải avatar' : 'Đổi avatar'}
                  </Button>
                )}
                <Button flex={isMobile ? 1 : undefined} icon={UserPlus} borderRadius={8} backgroundColor={C.green as any} color={"#06120b" as any} fontWeight="900" disabled={isOwner} opacity={isOwner ? 0.5 : 1}>
                  {roleInfo.primary}
                </Button>
                <Button flex={isMobile ? 1 : undefined} icon={MessageCircle} borderRadius={8} backgroundColor={C.panelSoft as any} color={C.text as any} borderWidth={1} borderColor={C.border as any} disabled={isOwner} opacity={isOwner ? 0.5 : 1}>
                  Liên hệ
                </Button>
              </XStack>
            </XStack>
          </Card>

          <XStack gap="$3" flexWrap="wrap">
            {stats.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </XStack>

          <XStack gap="$5" alignItems="flex-start" $ltMd={{ flexDirection: 'column' } as any}>
            <YStack width={isMobile ? '100%' : 330} gap="$4">
              <FootballCard user={userData} roleInfo={roleInfo} />
              <QuotaCard usage={usage} />
              <PhotoGrid photos={profilePhotos} isOwner={isOwner} uploading={uploadingImage === 'photo'} onAddPhoto={() => openImagePicker('photo')} />
              {isOwner && <ContactCard user={userData} />}
            </YStack>

            <YStack flex={1} width="100%" gap="$4">
              <ComposerCard displayName={displayName} avatarUrl={userData.avatarUrl} isOwner={isOwner} uploading={uploadingImage === 'photo'} onAddPhoto={() => openImagePicker('photo')} />
              <RolePanel role={role} />
              <FeedCard role={role} displayName={displayName} />
              <AchievementCard role={role} />
            </YStack>

            {!isMobile && (
              <YStack width={300} gap="$4">
                <ActionCard role={role} />
                <UpcomingCard />
                {isOwner && <SecurityCard />}
              </YStack>
            )}
          </XStack>

          {isMobile && (
            <YStack gap="$4">
              <ActionCard role={role} />
              <UpcomingCard />
              {isOwner && <SecurityCard />}
            </YStack>
          )}
        </YStack>
      </YStack>
    </ScrollView>
  )
}

const IconButton = ({ icon, onPress, label }: { icon: React.ReactNode, onPress?: () => void, label?: string }) => (
  <XStack
    width={38}
    height={38}
    borderRadius={8}
    alignItems="center"
    justifyContent="center"
    backgroundColor="rgba(0,0,0,0.45)"
    borderWidth={1}
    borderColor="rgba(255,255,255,0.18)"
    style={{ cursor: onPress ? 'pointer' : 'default' }}
    title={label}
    onPress={onPress}
  >
    {icon}
  </XStack>
)

const Badge = ({ text, icon, tone }: { text: string, icon: React.ReactNode, tone: 'green' | 'amber' }) => (
  <XStack alignItems="center" gap="$1.5" paddingHorizontal="$2.5" paddingVertical="$1" borderRadius={8} backgroundColor={tone === 'green' ? 'rgba(53,208,113,0.13)' : 'rgba(245,196,81,0.14)'} borderWidth={1} borderColor={tone === 'green' ? 'rgba(53,208,113,0.35)' : 'rgba(245,196,81,0.34)'}>
    {icon}
    <Text color={(tone === 'green' ? C.green : C.amber) as any} fontSize={12} fontWeight="900">{text}</Text>
  </XStack>
)

const MiniMeta = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <XStack alignItems="center" gap="$1.5">
    {icon}
    <Text color={C.muted as any} fontSize={13} fontWeight="700">{text}</Text>
  </XStack>
)

const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
  <Card flex={1} minWidth={180} borderRadius={8} backgroundColor={C.panel as any} borderWidth={1} borderColor={C.border as any} padding="$4">
    <XStack justifyContent="space-between" alignItems="center">
      <YStack gap="$1">
        <Text color={C.muted as any} fontSize={12} fontWeight="800">{label.toUpperCase()}</Text>
        <Text color={C.text as any} fontSize={24} fontWeight="900">{value}</Text>
        <Text color={C.muted as any} fontSize={12}>{sub}</Text>
      </YStack>
      <XStack width={42} height={42} borderRadius={8} alignItems="center" justifyContent="center" backgroundColor={`${color}22` as any}>
        <Icon size={22} color={color as any} />
      </XStack>
    </XStack>
  </Card>
)

const SectionCard = ({ title, icon, children, action }: any) => (
  <Card borderRadius={8} backgroundColor={C.surface as any} borderWidth={1} borderColor={C.border as any} padding="$4">
    <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
      <XStack alignItems="center" gap="$2">
        {icon}
        <Text color={C.text as any} fontSize={16} fontWeight="900">{title}</Text>
      </XStack>
      {action}
    </XStack>
    {children}
  </Card>
)

const FootballCard = ({ user, roleInfo }: any) => (
  <SectionCard title="Hồ sơ bóng đá" icon={<Star size={18} color={C.green as any} />}>
    <YStack gap="$3">
      <ProfileRow label="Vai trò" value={roleInfo.label} />
      <ProfileRow label="Vị trí" value={user.position || 'Chưa cập nhật'} />
      <ProfileRow label="Chân thuận" value={user.strongFoot || 'Chưa cập nhật'} />
      <ProfileRow label="Số áo" value={user.jerseyNumber || 'Chưa cập nhật'} />
      <ProfileRow label="Khu vực" value={user.area || 'Chưa cập nhật'} />
    </YStack>
  </SectionCard>
)

const ProfileRow = ({ label, value }: { label: string, value: string }) => (
  <XStack justifyContent="space-between" alignItems="center" gap="$3">
    <Text color={C.muted as any} fontSize={13} fontWeight="700">{label}</Text>
    <Text color={C.text as any} fontSize={13} fontWeight="900" textAlign="right" flexShrink={1}>{value}</Text>
  </XStack>
)

const QuotaCard = ({ usage }: any) => {
  const leagues = progress(usage.leaguesCreated, usage.limitLeagues)
  const matches = progress(usage.matchesCreated, usage.limitMatches)

  return (
    <SectionCard title="Gói sử dụng" icon={<BarChart3 size={18} color={C.blue as any} />}>
      <YStack gap="$4">
        <ProgressLine label="Tạo giải" value={usage.leaguesCreated ?? 0} limit={usage.limitLeagues ?? 0} percent={leagues} />
        <ProgressLine label="Tạo trận" value={usage.matchesCreated ?? 0} limit={usage.limitMatches ?? 0} percent={matches} />
        <Button borderRadius={8} backgroundColor={C.greenDark as any} color={C.green as any} fontWeight="900">
          Xem quyền lợi
        </Button>
      </YStack>
    </SectionCard>
  )
}

const ProgressLine = ({ label, value, limit, percent }: any) => (
  <YStack gap="$2">
    <XStack justifyContent="space-between">
      <Text color={C.text as any} fontSize={13} fontWeight="800">{label}</Text>
      <Text color={C.muted as any} fontSize={13} fontWeight="800">{value}/{limit}</Text>
    </XStack>
    <View height={8} borderRadius={8} backgroundColor="rgba(255,255,255,0.08)" overflow="hidden">
      <View height="100%" width={`${percent}%` as any} backgroundColor={percent >= 90 ? C.red as any : C.green as any} />
    </View>
  </YStack>
)

const PhotoGrid = ({ photos, isOwner, uploading, onAddPhoto }: any) => (
  <SectionCard
    title="Ảnh nổi bật"
    icon={<Images size={18} color={C.amber as any} />}
    action={isOwner ? (
      <XStack alignItems="center" gap="$1.5" style={{ cursor: 'pointer' }} onPress={onAddPhoto}>
        {uploading ? <Spinner size="small" color={C.green as any} /> : <Camera size={14} color={C.green as any} />}
        <Text color={C.green as any} fontSize={12} fontWeight="900">{uploading ? 'Đang tải' : 'Thêm ảnh'}</Text>
      </XStack>
    ) : (
      <Text color={C.green as any} fontSize={12} fontWeight="900">Xem tất cả</Text>
    )}
  >
    <XStack flexWrap="wrap" gap="$2">
      {photos.map((src: string) => (
        <Image key={src} src={src} width="48%" height={86} borderRadius={8} objectFit="cover" />
      ))}
    </XStack>
  </SectionCard>
)

const ContactCard = ({ user }: any) => (
  <SectionCard title="Liên hệ" icon={<Mail size={18} color={C.green as any} />}>
    <YStack gap="$3">
      <MiniMeta icon={<Mail size={15} color={C.muted as any} />} text={user.email || 'Email riêng tư'} />
      <MiniMeta icon={<Phone size={15} color={C.muted as any} />} text={user.phoneNumber || 'Số điện thoại riêng tư'} />
      <Text color={C.muted as any} fontSize={12} lineHeight={18}>
        Sau này nên chỉ hiện thông tin này với chính chủ, admin hoặc người được cấp quyền.
      </Text>
    </YStack>
  </SectionCard>
)

const ComposerCard = ({ displayName, avatarUrl, isOwner, uploading, onAddPhoto }: any) => (
  <Card borderRadius={8} backgroundColor={C.surface as any} borderWidth={1} borderColor={C.border as any} padding="$4">
    <XStack gap="$3" alignItems="center">
      <Avatar circular size="$3.5">
        <Avatar.Image 
          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=35d071&color=06120b&size=128`} 
          fullscreen={undefined as any}
        />
        <Avatar.Fallback backgroundColor={C.green as any} />
      </Avatar>
      <XStack flex={1} minHeight={42} borderRadius={8} backgroundColor={C.panelSoft as any} alignItems="center" paddingHorizontal="$3">
        <Text color={C.muted as any} fontWeight="700">Chia sẻ kèo giao hữu, ảnh trận đấu hoặc cảm nghĩ hôm nay...</Text>
      </XStack>
      {isOwner && (
        <Button
          icon={uploading ? undefined : Camera}
          borderRadius={8}
          backgroundColor={C.panelSoft as any}
          color={C.text as any}
          onPress={onAddPhoto}
          disabled={uploading}
        >
          {uploading ? 'Đang tải' : undefined}
        </Button>
      )}
    </XStack>
  </Card>
)

const RolePanel = ({ role }: { role: string }) => {
  const items: Record<string, string[]> = {
    user: ['Xem lịch thi đấu cá nhân', 'Tìm giải đấu gần khu vực', 'Cập nhật hồ sơ cầu thủ'],
    manager: ['Quản lý đội bóng', 'Duyệt thành viên', 'Đăng ký giải đấu'],
    creator: ['Viết bài mới', 'Quản lý bài đã đăng', 'Theo dõi hiệu suất tin'],
    media: ['Vào live control', 'Cập nhật diễn biến trận', 'Tải ảnh highlight'],
    coordinator: ['Xếp lịch trận', 'Duyệt đội tham gia', 'Xác nhận kết quả'],
    admin: ['Quản lý người dùng', 'Kiểm tra giải/trận', 'Duyệt nội dung'],
    super_admin: ['Phân quyền hệ thống', 'Xem audit log', 'Kiểm tra bảo mật'],
  }

  return (
    <SectionCard title="Việc nên làm tiếp theo" icon={<Activity size={18} color={C.green as any} />}>
      <XStack flexWrap="wrap" gap="$2">
        {(items[role] || items.user).map((item) => (
          <XStack key={item} paddingHorizontal="$3" paddingVertical="$2" borderRadius={8} backgroundColor={C.panelSoft as any} borderWidth={1} borderColor={C.border as any}>
            <Text color={C.text as any} fontSize={13} fontWeight="800">{item}</Text>
          </XStack>
        ))}
      </XStack>
    </SectionCard>
  )
}

const FeedCard = ({ role, displayName }: { role: string, displayName: string }) => (
  <SectionCard title="Bảng tin cá nhân" icon={<Newspaper size={18} color={C.blue as any} />}>
    <YStack gap="$4">
      <FeedItem
        name={displayName}
        meta="Hoạt động mới"
        text={role === 'manager' ? 'Đang chuẩn bị danh sách đội hình cho giải đấu sắp tới.' : 'Đã cập nhật hồ sơ bóng đá phủi trên PhuiScore.'}
        image={samplePhotos[1]}
      />
      <Separator borderColor={C.border as any} />
      <FeedItem
        name="PhuiScore"
        meta="Gợi ý hệ thống"
        text="Hoàn thiện vị trí thi đấu, khu vực và ảnh nổi bật để hồ sơ nhìn chuyên nghiệp hơn."
      />
    </YStack>
  </SectionCard>
)

const FeedItem = ({ name, meta, text, image }: any) => (
  <YStack gap="$3">
    <XStack alignItems="center" gap="$3">
      <Avatar circular size="$3">
        <Avatar.Image 
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=35d071&color=06120b&size=128`} 
          fullscreen={undefined as any}
        />
        <Avatar.Fallback backgroundColor={C.green as any} />
      </Avatar>
      <YStack>
        <Text color={C.text as any} fontWeight="900">{name}</Text>
        <Text color={C.muted as any} fontSize={12} fontWeight="700">{meta}</Text>
      </YStack>
    </XStack>
    <Text color={C.text as any} lineHeight={22}>{text}</Text>
    {image && <Image src={image} width="100%" height={220} borderRadius={8} objectFit="cover" />}
  </YStack>
)

const AchievementCard = ({ role }: { role: string }) => (
  <SectionCard title="Thành tích & huy hiệu" icon={<Trophy size={18} color={C.amber as any} />}>
    <XStack flexWrap="wrap" gap="$3">
      <Achievement icon={<Medal size={20} color={C.amber as any} />} title={role === 'manager' ? 'Đội trưởng' : 'Hồ sơ mới'} sub="Badge khởi đầu" />
      <Achievement icon={<Star size={20} color={C.green as any} />} title="Hạng Bạc" sub="Hoạt động ổn định" />
      <Achievement icon={<Camera size={20} color={C.blue as any} />} title="Khoảnh khắc" sub="Ảnh nổi bật" />
    </XStack>
  </SectionCard>
)

const Achievement = ({ icon, title, sub }: any) => (
  <XStack flex={1} minWidth={170} gap="$3" alignItems="center" padding="$3" borderRadius={8} backgroundColor={C.panelSoft as any} borderWidth={1} borderColor={C.border as any}>
    <XStack width={42} height={42} borderRadius={8} alignItems="center" justifyContent="center" backgroundColor="rgba(255,255,255,0.06)">
      {icon}
    </XStack>
    <YStack>
      <Text color={C.text as any} fontWeight="900">{title}</Text>
      <Text color={C.muted as any} fontSize={12}>{sub}</Text>
    </YStack>
  </XStack>
)

const ActionCard = ({ role }: { role: string }) => (
  <SectionCard title="Lối tắt" icon={<Settings size={18} color={C.green as any} />}>
    <YStack gap="$2">
      {shortcutByRole(role).map((item) => (
        <XStack key={item} justifyContent="space-between" alignItems="center" padding="$3" borderRadius={8} backgroundColor={C.panelSoft as any}>
          <Text color={C.text as any} fontWeight="800">{item}</Text>
          <ArrowLeft size={16} color={C.muted as any} style={{ transform: 'rotate(180deg)' } as any} />
        </XStack>
      ))}
    </YStack>
  </SectionCard>
)

const UpcomingCard = () => (
  <SectionCard title="Sắp diễn ra" icon={<Bell size={18} color={C.amber as any} />}>
    <YStack gap="$3">
      <ProfileRow label="Trận tiếp theo" value="Chưa có lịch" />
      <ProfileRow label="Giải đang theo dõi" value="Chưa cập nhật" />
      <ProfileRow label="Thông báo" value="0 mới" />
    </YStack>
  </SectionCard>
)

const SecurityCard = () => (
  <SectionCard title="Tài khoản" icon={<Lock size={18} color={C.blue as any} />}>
    <YStack gap="$2">
      <Button icon={Edit3} borderRadius={8} backgroundColor={C.panelSoft as any} color={C.text as any}>Chỉnh sửa hồ sơ</Button>
      <Button icon={ShieldCheck} borderRadius={8} backgroundColor={C.panelSoft as any} color={C.text as any}>Bảo mật</Button>
    </YStack>
  </SectionCard>
)

function shortcutByRole(role: string) {
  const map: Record<string, string[]> = {
    user: ['Đội của tôi', 'Lịch thi đấu', 'Tìm giải đấu'],
    manager: ['Quản lý đội', 'Tạo đội mới', 'Đăng ký giải'],
    creator: ['Media dashboard', 'Bài viết của tôi', 'Tạo tin mới'],
    media: ['Live control', 'Trận đang live', 'Kho ảnh'],
    coordinator: ['Giải phụ trách', 'Duyệt đội', 'Xếp lịch'],
    admin: ['Admin dashboard', 'Quản lý giải', 'Quản lý user'],
    super_admin: ['System dashboard', 'Audit log', 'Phân quyền'],
  }
  return map[role] || map.user
}

function progress(value?: number, limit?: number) {
  if (!limit || limit <= 0) return 0
  return Math.min(100, Math.round(((value || 0) / limit) * 100))
}

function formatDate(value?: string) {
  if (!value) return 'chưa rõ'
  try {
    return new Date(value).toLocaleDateString('vi-VN')
  } catch {
    return 'chưa rõ'
  }
}

function getClientToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || localStorage.getItem('accessToken')
}

function getLocalUsername() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user')
    const user = raw ? JSON.parse(raw) : null
    return user?.username || null
  } catch {
    return null
  }
}

function syncLocalUser(nextUser: any) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem('user')
    const currentUser = raw ? JSON.parse(raw) : {}
    localStorage.setItem('user', JSON.stringify({ ...currentUser, ...nextUser }))
  } catch {
    localStorage.setItem('user', JSON.stringify(nextUser))
  }
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
