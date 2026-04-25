"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { YStack, XStack, Text, View, Image, Input, Button, useMedia } from 'tamagui'
import { Search, MapPin, Shield, ChevronRight, ChevronLeft } from '@tamagui/lucide-icons'
import Link from 'next/link'
import axios from 'axios'
import mockTeamsData from '../../data/football_teams.json'
import { PROVINCES_34 } from '../../constants/regions'

const API = 'http://localhost:5000/api'
const C = { primary: '#28a745', bg: '#050807', card: 'rgba(15,22,18,0.85)', border: 'rgba(255,255,255,0.07)' }

// Alias
const YS: any = YStack; const XS: any = XStack; const T: any = Text; const V: any = View;

export default function TeamListScreen() {
  const media = useMedia()
  const isDesktop = media.gtMd
  const isTablet = media.gtSm && !media.gtMd
  const isMobile = !media.gtSm

  const [apiTeams, setApiTeams] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('Tất cả')
  const [page, setPage] = useState(1)
  const [mounted, setMounted] = useState(false)
  const ITEMS_PER_PAGE = 15

  const regions = useMemo(() => {
    return ['Tất cả', ...PROVINCES_34]
  }, [])

  const formattedMocks = useMemo(() => mockTeamsData.map((t: any) => ({
    id: `mock-${t.id}`,
    name: t.name,
    short_name: t.shortName,
    logo_url: t.logo,
    area: `${t.stadium} (${t.league})`,
    league: t.league,
    leader: 'PhuiScore Verified'
  })), [])

  useEffect(() => {
    setMounted(true)
    window.scrollTo(0, 0)
    // Fetch real DB teams in the background
    axios.get(`${API}/teams`)
      .then(res => {
        if (res.data?.success) setApiTeams(res.data.data)
      })
      .catch(err => console.error("Error fetching API teams:", err))
  }, [])


  // Instant local filtering without loading
  const displayTeams = useMemo(() => {
    const combined = [...apiTeams, ...formattedMocks]
    
    return combined.filter(t => {
      const q = search.toLowerCase().trim()
      const matchSearch = !q || 
        (t.name || '').toLowerCase().includes(q) || 
        (t.short_name || '').toLowerCase().includes(q) ||
        (t.area || '').toLowerCase().includes(q);
        
      let matchRegion = true;
      if (selectedRegion !== 'Tất cả') {
        const areaLower = (t.area || '').toLowerCase();
        const leagueLower = (t.league || '').toLowerCase();
        const regionLower = selectedRegion.toLowerCase();
        matchRegion = areaLower.includes(regionLower) || leagueLower.includes(regionLower);
      }
      
      return matchSearch && matchRegion;
    })
  }, [search, selectedRegion, apiTeams, formattedMocks])

  // Pagination
  const totalPages = Math.ceil(displayTeams.length / ITEMS_PER_PAGE)
  const paginatedTeams = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return displayTeams.slice(start, start + ITEMS_PER_PAGE)
  }, [displayTeams, page])
  
  useEffect(() => {
    setPage(1)
  }, [search, selectedRegion])

  if (!mounted) return null

  return (
    <YStack flex={1} backgroundColor={C.bg as any} minHeight="100vh">
      <YS maxWidth={1000} width="100%" marginHorizontal="auto" 
          paddingHorizontal={isMobile ? '$4' : '$6'} 
          paddingTop={isMobile ? '$6' : '$10'} 
          paddingBottom="$10" gap="$6">
        
        {/* Header & Search */}
        <YS gap="$4">
          <T color="white" fontSize={isMobile ? 28 : 36} fontWeight="900" letterSpacing={-1}>
            Cộng đồng Đội bóng 🛡️
          </T>
          <T color="#888" fontSize={14}>Khám phá và tìm kiếm các câu lạc bộ bóng đá phong trào trên toàn quốc.</T>

          <XS gap="$3" flexWrap={"wrap" as any}>
            <XS flex={1} minWidth={250} backgroundColor={C.card as any} borderRadius={16} 
                borderWidth={1} borderColor={C.border as any} 
                paddingHorizontal="$4" height={54} alignItems="center" gap="$3">
              <Search size={20} color="#888" />
              <Input unstyled flex={1} height="100%" color="black" fontSize={15}
                     placeholder="Tìm tên đội hoặc khu vực..."
                     value={search} onChangeText={setSearch} />
            </XS>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                backgroundColor: 'rgba(15,22,18,0.85)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'white',
                padding: '0 16px',
                height: '54px',
                borderRadius: '16px',
                fontSize: '15px',
                outline: 'none',
                width: isMobile ? '100%' : '200px',
                cursor: 'pointer'
              }}
            >
              {regions.map(r => <option key={r} value={r} style={{ color: 'white', backgroundColor: '#1a1f1c' }}>{r}</option>)}
            </select>
          </XS>
        </YS>

        {/* List */}
        {displayTeams.length === 0 ? (
          <YS padding="$10" alignItems="center" justifyContent="center" gap="$3">
            <T fontSize={48}>🏜️</T>
            <T color="#888" fontSize={15}>Không tìm thấy đội bóng nào.</T>
          </YS>
        ) : (
          <YStack gap="$6">
            <XStack flexWrap={"wrap" as any} marginHorizontal={-8} alignItems="stretch">
              {paginatedTeams.map(team => (
                <V key={team.id} width={isMobile ? '100%' : isTablet ? '50%' : '33.333%'} paddingHorizontal={8} paddingBottom={16} display="flex">
                  <Link href={`/doi-bong/${team.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <YS flex={1} backgroundColor={C.card as any} borderRadius={20} 
                        borderWidth={1} borderColor={C.border as any}
                        padding="$5" gap="$4" style={{ cursor: 'pointer', transition: 'all 0.2s', ':hover': { borderColor: C.primary, transform: 'translateY(-2px)' } } as any}>
                      
                      <XS gap="$4" alignItems="center">
                        <V width={64} height={64} borderRadius={32} overflow="hidden" 
                           backgroundColor="rgba(255,255,255,0.05)"
                           borderWidth={2} borderColor={"rgba(255,255,255,0.1)" as any}
                           alignItems="center" justifyContent="center">
                          {(team.logo_url || team.logo) ? (
                            <Image src={team.logo_url || team.logo} width="100%" height="100%" style={{ objectFit: 'cover' } as any} />
                          ) : (
                            <Shield size={32} color="#555" />
                          )}
                        </V>
                        <YS flex={1}>
                          <T color="white" fontSize={18} fontWeight="900" numberOfLines={1}>{team.name}</T>
                          <T color={C.primary as any} fontSize={10} fontWeight="800" marginTop="$0.5">CLB ĐÃ XÁC THỰC</T>
                        </YS>
                      </XS>

                      <YS gap="$3" marginTop="auto" paddingTop="$2">
                        <XS alignItems="center" gap="$2">
                          <MapPin size={14} color="#888" />
                          <T color="#aaa" fontSize={13} numberOfLines={1}>{team.area || 'Chưa cập nhật KV'}</T>
                        </XS>
                        <XS alignItems="center" justifyContent="space-between" borderTopWidth={1} borderTopColor={C.border as any} paddingTop="$3">
                          <XS alignItems="center" gap="$1.5">
                            <T color="#666" fontSize={12} fontWeight="600">Quản lý:</T>
                            <T color="white" fontSize={12} fontWeight="700" numberOfLines={1}>{team.leader || 'N/A'}</T>
                          </XS>
                          
                          <XS alignItems="center" gap="$1" paddingHorizontal="$2" paddingVertical="$1" borderRadius={8} backgroundColor="rgba(40,167,69,0.1)" style={{ transition: 'all 0.2s' } as any}>
                            <T color={C.primary as any} fontSize={12} fontWeight="800">Chi tiết</T>
                            <ChevronRight size={14} color={C.primary as any} strokeWidth={3} />
                          </XS>
                        </XS>
                      </YS>

                    </YS>
                  </Link>
                </V>
              ))}
            </XStack>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <XStack justifyContent="center" alignItems="center" gap="$4" marginTop="$4">
                <Button 
                  size="$3" circular onPress={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1} opacity={page === 1 ? 0.5 : 1}
                  backgroundColor={C.card as any} borderColor={C.border as any} borderWidth={1}>
                  <ChevronLeft size={20} color="white" />
                </Button>
                
                <T color="white" fontSize={14} fontWeight="700">
                  Trang {page} / {totalPages}
                </T>
                
                <Button 
                  size="$3" circular onPress={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages} opacity={page === totalPages ? 0.5 : 1}
                  backgroundColor={C.card as any} borderColor={C.border as any} borderWidth={1}>
                  <ChevronRight size={20} color="white" />
                </Button>
              </XStack>
            )}
          </YStack>
        )}

      </YS>
    </YStack>
  )
}

