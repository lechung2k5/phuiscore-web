"use client"
import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, View, Image, Spinner, useMedia, ScrollView, Button } from 'tamagui'
import { MapPin, Shield, CheckCircle2, ChevronLeft, Phone, User, Users, Calendar, Trophy, Image as ImageIcon, Shirt } from '@tamagui/lucide-icons'
import Link from 'next/link'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const C = { primary: '#28a745', bg: '#050807', card: 'rgba(15,22,18,0.85)', border: 'rgba(255,255,255,0.07)' }

const YS: any = YStack; const XS: any = XStack; const T: any = Text; const V: any = View;

export default function TeamDetailScreen() {
  const media = useMedia()
  const isDesktop = media.gtMd
  const isTablet = media.gtSm && !media.gtMd
  const isMobile = !media.gtSm
  const params = useParams()
  const id = params?.id

  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // overview, squad, matches, media
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (id) {
      axios.get(`${API}/teams/${id}`)
        .then(res => {
          if (res.data.success) {
            setTeam(res.data.data)
            checkOwner(res.data.data)
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [id])

  const checkOwner = (teamData: any) => {
    const userId = localStorage.getItem('userId')
    if (userId && teamData.userId === parseInt(userId, 10)) {
      setIsOwner(true)
    }
  }

  if (loading) return (
    <YS flex={1} backgroundColor={C.bg as any} alignItems="center" justifyContent="center" minHeight="100vh">
      <Spinner size="large" color={C.primary as any} />
    </YS>
  )

  if (!team) return (
    <YS flex={1} backgroundColor={C.bg as any} alignItems="center" justifyContent="center" minHeight="100vh" gap="$4">
      <T fontSize={48}>🏜️</T>
      <T color="#888" fontSize={16}>Không tìm thấy hồ sơ đội bóng này</T>
      <Link href="/doi-bong" style={{ textDecoration: 'none' }}>
        <XS backgroundColor={C.primary as any} padding="$3" borderRadius={8}><T color="white" fontWeight="700">Quay lại tìm đội</T></XS>
      </Link>
    </YS>
  )

  const TABS = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'squad', label: `Đội hình (${(team.players || []).length})` },
    { id: 'matches', label: 'Lịch thi đấu' },
    { id: 'media', label: 'Thành tích & Media' }
  ]

  const createdDate = team.createdAt ? format(new Date(team.createdAt), 'MM/yyyy', { locale: vi }) : 'N/A'

  return (
    <ScrollView flex={1} backgroundColor={C.bg as any} minHeight="100vh">
      <YS maxWidth={1100} width="100%" marginHorizontal="auto" 
          paddingHorizontal={isMobile ? '$4' : '$6'} 
          paddingTop={isMobile ? '$6' : '$8'} 
          paddingBottom="$10" gap="$6">
        
        <Link href="/doi-bong" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
          <ChevronLeft size={16} color={"#888" as any} />
          <T color="#888" fontSize={14} fontWeight="700">Tìm kiếm đội bóng</T>
        </Link>

        {/* --- HERO BANNER --- */}
        <YS borderRadius={24} overflow="hidden" position="relative" borderWidth={1} borderColor={C.border as any}>
          {/* Cover Background (gradient) */}
          <V position="absolute" top={0} left={0} right={0} height="100%" backgroundColor="#0c1912" />
          <V position="absolute" bottom={0} left={0} right={0} height="60%" style={{ background: 'linear-gradient(to top, #0c1912 0%, transparent 100%)' } as any} />
          
          <YS padding={isMobile ? "$4" : "$8"} position="relative" zIndex={10}>
            
            {/* Top Row: Logo + Info + Actions */}
            <XStack flexWrap={"wrap" as any} gap={isMobile ? "$4" : "$6"} alignItems="flex-start">
              
              {/* Logo */}
              <V width={isMobile ? 100 : 140} height={isMobile ? 100 : 140} borderRadius={isMobile ? 50 : 70} overflow="hidden" 
                 backgroundColor="rgba(0,0,0,0.5)"
                 borderWidth={4} borderColor={C.primary as any}
                 alignItems="center" justifyContent="center" style={{ boxShadow: `0 0 40px rgba(40,167,69,0.3)` }}>
                {(team.logo_url || team.logo) ? (
                  <Image src={(team.logo_url || team.logo)} width="100%" height="100%" style={{ objectFit: 'cover' } as any} />
                ) : (
                  <Shield size={isMobile ? 50 : 70} color={"#555" as any} />
                )}
              </V>

              {/* Main Info */}
              <YS flex={1} minWidth={280} gap="$2">
                <XS alignItems="center" gap="$2" flexWrap={"wrap" as any}>
                  <T color="white" fontSize={isMobile ? 28 : 38} fontWeight="900" letterSpacing={-1} numberOfLines={1}>
                    {team.name}
                  </T>
                  {team.short_name && (
                    <V backgroundColor="rgba(255,255,255,0.1)" paddingHorizontal="$2" paddingVertical="$1" borderRadius={6}>
                      <T color="#ccc" fontSize={12} fontWeight="800">[{team.short_name}]</T>
                    </V>
                  )}
                  <CheckCircle2 size={24} color={C.primary as any} />
                </XS>

                {team.slogan ? (
                  <T color="#aaa" fontSize={16} fontStyle="italic" marginBottom="$2">"{team.slogan}"</T>
                ) : (
                  <V marginBottom="$2" />
                )}

                {/* Quick Stats Grid */}
                <XStack flexWrap={"wrap" as any} gap={isMobile ? "$2" : "$4"} rowGap="$2">
                  <XS alignItems="center" gap="$1.5">
                    <MapPin size={15} color={C.primary as any} />
                    <T color="#ddd" fontSize={14} fontWeight="500">{team.area || 'Chưa cập nhật'}</T>
                  </XS>
                  <XS alignItems="center" gap="$1.5">
                    <User size={15} color={C.primary as any} />
                    <T color="#ddd" fontSize={14} fontWeight="500">Quản lý: {team.leader || 'N/A'}</T>
                  </XS>
                  <XS alignItems="center" gap="$1.5">
                    <Users size={15} color={C.primary as any} />
                    <T color="#ddd" fontSize={14} fontWeight="500">{(team.players || []).length} TV</T>
                  </XS>
                  <XS alignItems="center" gap="$1.5">
                    <Calendar size={15} color={C.primary as any} />
                    <T color="#ddd" fontSize={14} fontWeight="500">Thành lập: {createdDate}</T>
                  </XS>
                </XStack>
              </YS>

              {/* Action Buttons */}
              <YS gap="$3" width={isMobile ? '100%' : 'auto'} marginTop={isMobile ? 0 : "$2"}>
                {isOwner ? (
                  <Link href="/quan-ly-doi/dashboard" style={{ textDecoration: 'none' }}>
                    <Button width={isMobile ? '100%' : 160} size="$4" backgroundColor={C.primary as any} borderRadius={10}>
                      <T color="white" fontWeight="800" fontSize={14}>✏️ Quản lý đội</T>
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button width={isMobile ? '100%' : 160} size="$4" backgroundColor={C.primary as any} borderRadius={10}>
                      <T color="white" fontWeight="800" fontSize={14}>Gia nhập đội</T>
                    </Button>
                    <Button width={isMobile ? '100%' : 160} size="$4" backgroundColor="rgba(255,255,255,0.1)" borderColor="rgba(255,255,255,0.2)" borderWidth={1} borderRadius={10}>
                      <T color="white" fontWeight="800" fontSize={14}>Mời giao hữu</T>
                    </Button>
                  </>
                )}
              </YS>

            </XStack>
          </YS>
        </YS>

        {/* --- NAVIGATION TABS --- */}
        <YS borderBottomWidth={1} borderColor={C.border as any} paddingBottom={0} marginHorizontal={isMobile ? -16 : -24} paddingHorizontal={isMobile ? 16 : 24}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XS gap="$5" paddingBottom="$0">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <V key={tab.id} paddingBottom="$3" borderBottomWidth={3} borderColor={isActive ? C.primary : 'transparent' as any} onPress={() => setActiveTab(tab.id)} cursor="pointer">
                    <T color={isActive ? "white" : "#888" as any} fontSize={15} fontWeight={isActive ? "800" : "600"}>
                      {tab.label}
                    </T>
                  </V>
                )
              })}
            </XS>
          </ScrollView>
        </YS>

        {/* --- TAB CONTENT --- */}
        <V minHeight={400}>
          
          {/* TAB: VIEW - TỔNG QUAN */}
          {activeTab === 'overview' && (
            <XStack flexWrap={"wrap" as any} gap="$6" alignItems="flex-start">
              
              {/* Left Column (Feed/About) */}
              <YS flex={1} minWidth={isMobile ? '100%' : 0} gap="$6">
                
                <YS backgroundColor={C.card as any} borderRadius={20} borderWidth={1} borderColor={C.border as any} padding="$5" gap="$3">
                  <T color="white" fontSize={18} fontWeight="800">Giới thiệu đội bóng</T>
                  <T color="#ccc" fontSize={15} lineHeight={22}>
                    {team.description || "Đội bóng chưa cập nhật lời giới thiệu. Hãy liên hệ quản lý để biết thêm chi tiết về định hướng và lịch hoạt động của đội."}
                  </T>
                </YS>

                <YS backgroundColor={C.card as any} borderRadius={20} borderWidth={1} borderColor={C.border as any} padding="$5" gap="$4">
                  <XS alignItems="center" justifyContent="space-between">
                    <T color="white" fontSize={18} fontWeight="800">Tin tức & Hoạt động</T>
                    {isOwner && <T color={C.primary as any} fontSize={14} fontWeight="700" style={{ cursor: 'pointer' }}>+ Đăng bài mới</T>}
                  </XS>
                  
                  {/* Empty Feed Placeholder */}
                  <YS padding="$6" alignItems="center" justifyContent="center" backgroundColor="rgba(255,255,255,0.02)" borderRadius={12} borderWidth={1} borderColor="rgba(255,255,255,0.05)" borderStyle="dashed">
                    <Text fontSize={32} marginBottom="$2">📰</Text>
                    <T color="#888" fontSize={14} textAlign={"center" as any}>Chưa có bài đăng nào trên Bảng tin của đội bóng.</T>
                  </YS>
                </YS>

              </YS>

              {/* Right Column (Sidebar) */}
              <YS width={isMobile ? '100%' : 320} gap="$6">
                
                <YS backgroundColor={C.card as any} borderRadius={20} borderWidth={1} borderColor={C.border as any} padding="$5" gap="$4">
                  <T color="white" fontSize={16} fontWeight="800">Thông tin Liên lạc</T>
                  <YS gap="$3">
                    <XS alignItems="center" gap="$3">
                      <V backgroundColor="rgba(255,255,255,0.05)" padding={8} borderRadius={10}><User size={16} color={"#aaa" as any} /></V>
                      <YS flex={1}>
                        <T color="#888" fontSize={12}>Đại diện / Quản lý</T>
                        <T color="white" fontSize={14} fontWeight="700">{team.leader || 'N/A'}</T>
                      </YS>
                    </XS>
                    <XS alignItems="center" gap="$3">
                      <V backgroundColor="rgba(255,255,255,0.05)" padding={8} borderRadius={10}><Phone size={16} color={"#aaa" as any} /></V>
                      <YS flex={1}>
                        <T color="#888" fontSize={12}>Số điện thoại</T>
                        <T color="white" fontSize={14} fontWeight="700">{team.phone || 'Đang cập nhật'}</T>
                      </YS>
                    </XS>
                    <XS alignItems="center" gap="$3">
                      <V backgroundColor="rgba(255,255,255,0.05)" padding={8} borderRadius={10}><Shirt size={16} color={"#aaa" as any} /></V>
                      <YS flex={1}>
                        <T color="#888" fontSize={12}>Màu áo thi đấu</T>
                        <XS gap="$2" alignItems="center" marginTop={4}>
                          {team.primary_color && <T color="white" fontSize={14} fontWeight="700">Chính: {team.primary_color}</T>}
                        </XS>
                      </YS>
                    </XS>
                  </YS>
                </YS>

                <YS backgroundColor={C.card as any} borderRadius={20} borderWidth={1} borderColor={C.border as any} padding="$5" gap="$4">
                  <T color="white" fontSize={16} fontWeight="800">Thống kê tóm tắt</T>
                  <XStack flexWrap={"wrap" as any} gap="$2">
                    <V flex={1} minWidth="45%" backgroundColor="rgba(0,0,0,0.3)" borderRadius={12} padding="$3" alignItems="center">
                      <T color={C.primary as any} fontSize={24} fontWeight="900">0</T>
                      <T color="#888" fontSize={11}>TRẬN THAM GIA</T>
                    </V>
                    <V flex={1} minWidth="45%" backgroundColor="rgba(0,0,0,0.3)" borderRadius={12} padding="$3" alignItems="center">
                      <T color="#fff" fontSize={24} fontWeight="900">0</T>
                      <T color="#888" fontSize={11}>BÀN THẮNG</T>
                    </V>
                  </XStack>
                </YS>

              </YS>

            </XStack>
          )}

          {/* TAB: SQUAD - ĐỘI HÌNH */}
          {activeTab === 'squad' && (
            <YS gap="$6">
              {/* Filter Row */}
              <XStack justifyContent="space-between" alignItems="center" flexWrap={"wrap" as any} gap="$3">
                <T color="white" fontSize={18} fontWeight="800">Danh sách Cầu thủ ({team.players?.length || 0})</T>
              </XStack>

              {(!team.players || team.players.length === 0) ? (
                <YS padding="$10" alignItems="center" justifyContent="center" backgroundColor={C.card as any} borderRadius={20} borderWidth={1} borderColor={C.border as any}>
                  <T fontSize={48} marginBottom="$3">👕</T>
                  <T color="#888" fontSize={15}>Đội bóng này hiện chưa có cầu thủ nào.</T>
                  {isOwner && (
                    <Button marginTop="$4" backgroundColor={C.primary as any}>
                      <T color="white" fontWeight="700">Thêm cầu thủ ngay</T>
                    </Button>
                  )}
                </YS>
              ) : (
                <XStack flexWrap={"wrap" as any} marginHorizontal={-8}>
                  {team.players.map((p: any) => (
                    <V key={p.id} width={isMobile ? '50%' : isTablet ? '33.333%' : '25%'} paddingHorizontal={8} paddingBottom={16} display="flex">
                      <YS flex={1} backgroundColor={C.card as any} borderRadius={16} borderWidth={1} borderColor={C.border as any} padding="$4" gap="$3" alignItems="center" position="relative" overflow="hidden">
                        
                        {/* Background Effect */}
                        <V position="absolute" top={0} left={0} right={0} height={40} backgroundColor="rgba(255,255,255,0.02)" />

                        {/* Number Badge */}
                        <V position="absolute" top={10} left={10} backgroundColor="rgba(40,167,69,0.15)" borderRadius={8} width={26} height={26} alignItems="center" justifyContent="center">
                          <T color={C.primary as any} fontSize={11} fontWeight="900">{p.shirtNumber || '-'}</T>
                        </V>
                        
                        {/* Avatar */}
                        <V width={80} height={80} borderRadius={40} overflow="hidden" backgroundColor="rgba(0,0,0,0.5)" borderWidth={2} borderColor={"rgba(255,255,255,0.1)" as any} alignItems="center" justifyContent="center" marginTop="$4">
                          {p.avatar ? (
                            <Image src={p.avatar} width="100%" height="100%" style={{ objectFit: 'cover' } as any} />
                          ) : (
                            <User size={36} color={"#555" as any} />
                          )}
                        </V>

                        {/* Info */}
                        <YS alignItems="center" marginTop="$2" width="100%">
                          <T color="white" fontSize={15} fontWeight="800" textAlign={"center" as any} numberOfLines={1}>{p.name}</T>
                          <T color="#aaa" fontSize={12} marginTop={2}>{p.position || 'Cầu thủ'}</T>
                        </YS>
                      </YS>
                    </V>
                  ))}
                </XStack>
              )}
            </YS>
          )}

          {/* TAB: MATCHES - LỊCH THI ĐẤU */}
          {activeTab === 'matches' && (
             <YS padding="$10" alignItems="center" justifyContent="center" backgroundColor={C.card as any} borderRadius={20} borderWidth={1} borderColor={C.border as any}>
               <T fontSize={48} marginBottom="$3">⚽</T>
               <T color="white" fontSize={18} fontWeight="700">Chưa có trận đấu nào</T>
               <T color="#888" fontSize={14} marginTop="$2">Đội bóng này chưa tham gia trận đấu nào được ghi nhận trên hệ thống.</T>
             </YS>
          )}

          {/* TAB: MEDIA - THÀNH TÍCH & THƯ VIỆN */}
          {activeTab === 'media' && (
            <YS gap="$6">

              {/* ── TROPHY ROOM ── */}
              <YS gap="$4">
                <XStack justifyContent="space-between" alignItems="center">
                  <T color="white" fontSize={18} fontWeight="800">🏆 Phòng Truyền thống</T>
                  <T color="#888" fontSize={13}>{(team.trophies || []).length} danh hiệu</T>
                </XStack>

                {(!team.trophies || team.trophies.length === 0) ? (
                  <YS padding="$10" alignItems="center" justifyContent="center" backgroundColor={C.card as any} borderRadius={20} borderWidth={1} borderColor={C.border as any}>
                    <T fontSize={48} marginBottom="$3">🏆</T>
                    <T color="white" fontSize={16} fontWeight="700">Phòng truyền thống trống</T>
                    <T color="#888" fontSize={14} marginTop="$2" textAlign={"center" as any}>Đội bóng này chưa đăng ký danh hiệu nào.</T>
                  </YS>
                ) : (
                  <V style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 } as any}>
                    {team.trophies.map((t: any) => {
                      const medal = t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : '🏦'
                      const rankLabel = t.rank === 1 ? 'Vô địch' : t.rank === 2 ? 'Á quân' : t.rank === 3 ? 'Hạng Ba' : 'Top 4+'
                      const typeLabel: Record<string, string> = { phong_trao: 'Phong trào', lien_quan: 'Liên quận', thanh_pho: 'Thành phố', quoc_gia: 'Quốc gia' }
                      return (
                        <YS key={t.id} backgroundColor={C.card as any} borderRadius={16} borderWidth={1}
                          borderColor={t.rank === 1 ? 'rgba(255,196,0,0.4)' : t.rank === 2 ? 'rgba(200,200,200,0.3)' : 'rgba(205,127,50,0.3)' as any}
                          padding="$4" gap="$3"
                          style={{ boxShadow: t.rank === 1 ? '0 0 20px rgba(255,196,0,0.12)' : 'none' } as any}>
                          <XStack alignItems="flex-start" gap="$3">
                            <T fontSize={36}>{medal}</T>
                            <YS flex={1}>
                              <T color="white" fontSize={15} fontWeight="900" numberOfLines={2}>{t.tournament}</T>
                              <T color="#888" fontSize={12} marginTop={2}>{t.year} • {typeLabel[t.type] || t.type}</T>
                            </YS>
                          </XStack>
                          <XStack gap="$2" flexWrap={"wrap" as any}>
                            <YS paddingHorizontal="$2" paddingVertical={3} borderRadius={20}
                              backgroundColor={t.rank === 1 ? 'rgba(255,196,0,0.12)' : t.rank === 2 ? 'rgba(200,200,200,0.08)' : 'rgba(205,127,50,0.1)' as any}>
                              <T color={t.rank === 1 ? '#ffc400' : t.rank === 2 ? '#ccc' : '#cd7f32' as any} fontSize={11} fontWeight="800">🏆 {rankLabel}</T>
                            </YS>
                            {t.totalTeams && (
                              <YS paddingHorizontal="$2" paddingVertical={3} borderRadius={20} backgroundColor={"rgba(255,255,255,0.05)" as any}>
                                <T color="#888" fontSize={11} fontWeight="700">👥 {t.totalTeams} đội</T>
                              </YS>
                            )}
                          </XStack>
                          {t.organizer && <T color="#888" fontSize={12}>🏙️ {t.organizer}</T>}
                          {t.notes && <T color="#aaa" fontSize={12} fontStyle="italic" numberOfLines={2}>{t.notes}</T>}
                        </YS>
                      )
                    })}
                  </V>
                )}
              </YS>

              {/* ── PHOTO GALLERY ── */}
              {team.gallery && team.gallery.length > 0 && (
                <YS gap="$4">
                  <XStack justifyContent="space-between" alignItems="center">
                    <T color="white" fontSize={18} fontWeight="800">📸 Thư viện Ảnh</T>
                    <T color="#888" fontSize={13}>{team.gallery.length} ảnh</T>
                  </XStack>
                  <V style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 } as any}>
                    {team.gallery.map((url: string, i: number) => (
                      <V key={i} borderRadius={12} overflow="hidden" style={{ aspectRatio: '1' } as any}>
                        <Image src={url} width="100%" height="100%" style={{ objectFit: 'cover' } as any} />
                      </V>
                    ))}
                  </V>
                </YS>
              )}

            </YS>
          )}

        </V>

      </YS>
    </ScrollView>
  )
}

