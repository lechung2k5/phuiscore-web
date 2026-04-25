"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { ScrollView, YStack, XStack, Text, Button, Image, Spinner, View, Input, useMedia } from 'tamagui'
import { Search, Flame, LayoutGrid, GitBranch, X, ChevronDown } from '@tamagui/lucide-icons'
import axios from 'axios'

import { Header } from 'app/components/Header'
import { StandingRow } from './StandingRow'
import { KnockoutBracket } from './KnockoutBracket'

// Alias
const YS: any = YStack; const XS: any = XStack; const Txt: any = Text
const BTN: any = Button; const IMG: any = Image; const IPT: any = Input

const API_BASE_URL = 'http://localhost:5000/api'

const HOT_LEAGUES = [
  { id: 17,  name: 'Premier League',    country: 'Anh',       icon: 'https://api.sofascore.app/api/v1/unique-tournament/17/image' },
  { id: 626, name: 'V-League 1',        country: 'Việt Nam',  icon: 'https://api.sofascore.app/api/v1/unique-tournament/626/image' },
  { id: 8,   name: 'LaLiga',            country: 'TBN',       icon: 'https://api.sofascore.app/api/v1/unique-tournament/8/image' },
  { id: 23,  name: 'Serie A',           country: 'Ý',         icon: 'https://api.sofascore.app/api/v1/unique-tournament/23/image' },
  { id: 35,  name: 'Bundesliga',        country: 'Đức',       icon: 'https://api.sofascore.app/api/v1/unique-tournament/35/image' },
  { id: 34,  name: 'Ligue 1',           country: 'Pháp',      icon: 'https://api.sofascore.app/api/v1/unique-tournament/34/image' },
  { id: 7,   name: 'Champions League',  country: 'EU',        icon: 'https://api.sofascore.app/api/v1/unique-tournament/7/image' },
]

const CUP_IDS = new Set([7, 679, 931, 19, 329, 137, 106, 481, 11, 955])

// ─── Mobile League Picker (horizontal chip scroll) ────────────────────────
function MobileLeaguePicker({ currentId, onSelect, allLeagues }: any) {
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const scrollRef = useRef<any>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return allLeagues.filter((l: any) => l.name?.toLowerCase().includes(q)).slice(0, 20)
  }, [search, allLeagues])

  const currentLeague = HOT_LEAGUES.find(l => l.id === currentId)

  return (
    <YS backgroundColor="#050807" borderBottomWidth={1} borderColor="#111">
      {/* Search bar toggle */}
      {showSearch ? (
        <XS
      alignItems="center"
      backgroundColor="#111"
      marginHorizontal={12}
      marginVertical={8}
      paddingHorizontal={12}
      borderRadius={12}
      height={44}
      gap={8}
      overflow="hidden"
    >
          <Search size={16} color="#555" />
          <IPT
            flex={1}
            backgroundColor="transparent"
            borderWidth={0}
            color="white"
            fontSize={14}
            placeholder="Tìm giải đấu..."
            placeholderTextColor="#444"
            value={search}
            onChangeText={setSearch}
            autoFocus
            style={{ outlineStyle: 'none', background: 'transparent' }}
          />
          <BTN unstyled onPress={() => { setSearch(''); setShowSearch(false) }}>
            <X size={16} color="#555" />
          </BTN>
        </XS>
      ) : (
        /* Hot League chips */
        <XS alignItems="center" gap={0}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}
            style={{ flex: 1 }}
          >
            {HOT_LEAGUES.map(l => {
              const isActive = currentId === l.id
              return (
                <BTN
                  key={l.id}
                  unstyled
                  onPress={() => onSelect(l.id)}
                  flexDirection="row"
                  alignItems="center"
                  gap={6}
                  paddingHorizontal={10}
                  paddingVertical={6}
                  borderRadius={20}
                  marginRight={6}
                  backgroundColor={isActive ? 'rgba(40,167,69,0.2)' : '#111'}
                  borderWidth={1}
                  borderColor={isActive ? '#28a745' : '#1e1e1e'}
                >
                  <IMG src={l.icon} width={18} height={18} style={{ objectFit: 'contain', borderRadius: 3 }} />
                  <Txt
                    color={isActive ? '#28a745' : '#aaa'}
                    fontSize={12}
                    fontWeight={isActive ? '800' : '600'}
                    numberOfLines={1}
                  >
                    {l.name}
                  </Txt>
                </BTN>
              )
            })}
          </ScrollView>
          {/* Search icon button */}
          <BTN
            unstyled
            onPress={() => setShowSearch(true)}
            padding={10}
            marginRight={8}
            backgroundColor="#111"
            borderRadius={20}
            alignItems="center"
            justifyContent="center"
          >
            <Search size={16} color="#555" />
          </BTN>
        </XS>
      )}

      {/* Search results dropdown — dùng native div để tránh Tamagui theme trắng */}
      {showSearch && search.trim() !== '' && (
        <div style={{
          backgroundColor: '#0d0d0d',
          margin: '0 12px 8px',
          borderRadius: 12,
          border: '1px solid #1e1e1e',
          overflow: 'hidden',
          maxHeight: 280,
          overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: '12px 16px' }}>
              Không tìm thấy giải đấu
            </div>
          ) : filtered.map((l: any) => {
            const isCup = CUP_IDS.has(Number(l.id))
            return (
              <button
                key={l.id}
                onClick={() => { onSelect(Number(l.id)); setSearch(''); setShowSearch(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px',
                  background: 'transparent',
                  border: 'none', borderBottom: '1px solid #111',
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#161616')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <img src={`https://api.sofascore.app/api/v1/unique-tournament/${l.id}/image`} width={24} height={24} alt={l.name} style={{ objectFit: 'contain', flexShrink: 0 }} />
                <span style={{ flex: 1, color: isCup ? '#f0d060' : '#ddd', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.name}
                </span>
                {isCup && (
                  <span style={{ backgroundColor: 'rgba(255,215,0,0.12)', borderRadius: 6, padding: '2px 6px', fontSize: 9, color: '#ffd700', fontWeight: 900 }}>
                    KO
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </YS>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function StandingsScreen() {
  const media = useMedia()
  const isMobile = !media.gtMd

  const [currentId, setCurrentId] = useState(17)
  const [data, setData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'groups' | 'knockout'>('groups')
  const [allLeagues, setAllLeagues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLeague, setSearchLeague] = useState('')
  const [mounted, setMounted] = useState(false)

  const selectLeague = (id: number) => {
    setCurrentId(id)
    setSearchLeague('')
    if (CUP_IDS.has(id)) setActiveTab('knockout')
    else setActiveTab('groups')
  }

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted) {
      axios.get(`${API_BASE_URL}/leagues`)
        .then(res => setAllLeagues(res.data || []))
        .catch(() => {})
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    setLoading(true)
    axios.get(`${API_BASE_URL}/standings/${currentId}`)
      .then(res => setData(res.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [currentId, mounted])

  const groupsToRender = useMemo(() => {
    if (!data) return []
    if (data.standings && Array.isArray(data.standings))
      return data.standings.filter((g: any) => g && Array.isArray(g.rows))
    if (data.standingsData && Array.isArray(data.standingsData))
      return [{ name: null, rows: data.standingsData }]
    return []
  }, [data])

  const hasKnockout = useMemo(() =>
    data?.knockoutData && Array.isArray(data.knockoutData) && data.knockoutData.length > 0,
  [data])

  useEffect(() => {
    if (!data || loading) return
    const isCup = CUP_IDS.has(currentId)
    if (isCup) {
      if (hasKnockout) setActiveTab('knockout')
      else if (groupsToRender.length > 0) setActiveTab('groups')
    } else {
      if (groupsToRender.length > 0) setActiveTab('groups')
      else if (hasKnockout) setActiveTab('knockout')
    }
  }, [data, loading, groupsToRender, hasKnockout, currentId])

  const filteredLeagues = useMemo(() => {
    const query = searchLeague.trim().toLowerCase()
    if (!query) return []
    return allLeagues.filter(l => l.name?.toLowerCase().includes(query)).slice(0, 30)
  }, [searchLeague, allLeagues])

  if (!mounted) return null

  return (
    <YS flex={1} backgroundColor="#050807">

      {/* Mobile league picker */}
      {isMobile && (
        <MobileLeaguePicker
          currentId={currentId}
          onSelect={selectLeague}
          allLeagues={allLeagues}
        />
      )}

      <XS flex={1} width="100%" maxWidth={1400} marginHorizontal="auto">
        {/* ── SIDEBAR (desktop only) ── */}
        {!isMobile && (
          <YS width={280} backgroundColor="#0a0a0a" borderRightWidth={1} borderColor="#111">
            <YS padding="$4" gap="$4">
              <XS alignItems="center" justifyContent="space-between">
                <Txt color="white" fontWeight="900" fontSize={16}>GIẢI ĐẤU</Txt>
                <Flame size={14} color="#e67e22" />
              </XS>
              <XS
                alignItems="center"
                backgroundColor="#111"
                paddingHorizontal="$3"
                borderRadius={12}
                height={44}
                borderWidth={0}
              >
                <Search size={16} color="#555" />
                <IPT
                  flex={1}
                  backgroundColor="transparent"
                  borderWidth={0}
                  color="white"
                  fontSize={13}
                  placeholder="Tìm giải đấu..."
                  value={searchLeague}
                  onChangeText={setSearchLeague}
                  style={{ outlineStyle: 'none' }}
                />
              </XS>
            </YS>
            <ScrollView showsVerticalScrollIndicator={false}>
              <YS padding="$2" gap="$1">
                {searchLeague.trim() !== '' ? (
                  filteredLeagues.map((l: any) => {
                    const isCupResult = CUP_IDS.has(Number(l.id))
                    return (
                      <BTN key={l.id} unstyled
                        onPress={() => selectLeague(Number(l.id))}
                        paddingVertical="$2" paddingHorizontal="$3"
                        borderRadius={10} alignItems="center" gap="$3"
                        backgroundColor={currentId === Number(l.id) ? 'rgba(40,167,69,0.12)' : "transparent"}
                        hoverStyle={{ backgroundColor: isCupResult ? "rgba(255,215,0,0.07)" : "rgba(40,167,69,0.1)" }}
                      >
                        <View padding={8} backgroundColor="#161b18" borderRadius={10}>
                          <IMG src={`https://api.sofascore.app/api/v1/unique-tournament/${l.id}/image`} width={24} height={24} style={{ objectFit: 'contain' }} />
                        </View>
                        <Txt color={isCupResult ? "#f0d060" : "#eee"} fontWeight="700" fontSize={13} flex={1} numberOfLines={1}>{l.name}</Txt>
                        {isCupResult && (
                          <View backgroundColor="rgba(255,215,0,0.12)" borderRadius={6} paddingHorizontal={6} paddingVertical={3} flexDirection="row" alignItems="center" gap={4}>
                            <GitBranch size={11} color="#ffd700" />
                            <Txt color="#ffd700" fontSize={9} fontWeight="900">KNOCKOUT</Txt>
                          </View>
                        )}
                      </BTN>
                    )
                  })
                ) : (
                  <>
                    <XS alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$2">
                      <Flame size={14} color="#e67e22" />
                      <Txt color="#555" fontWeight="900" fontSize={11} letterSpacing={1}>NỔI BẬT</Txt>
                    </XS>
                    {HOT_LEAGUES.map(l => (
                      <BTN key={l.id} unstyled
                        onPress={() => setCurrentId(l.id)}
                        paddingVertical="$2.5" paddingHorizontal="$3"
                        borderRadius={10} alignItems="center" gap="$3"
                        backgroundColor={currentId === l.id ? "rgba(40,167,69,0.15)" : "transparent"}
                        hoverStyle={{ backgroundColor: "rgba(40,167,69,0.1)" }}
                      >
                        <View padding={8} backgroundColor="#161b18" borderRadius={10}>
                          <IMG src={l.icon} width={24} height={24} style={{ objectFit: 'contain' }} />
                        </View>
                        <YS flex={1}>
                          <Txt color={currentId === l.id ? "#28a745" : "#ddd"} fontWeight="800" fontSize={13.5}>{l.name}</Txt>
                          <Txt color="#444" fontSize={10} fontWeight="700">{l.country.toUpperCase()}</Txt>
                        </YS>
                        {currentId === l.id && <View width={6} height={6} borderRadius={3} backgroundColor="#28a745" />}
                      </BTN>
                    ))}
                  </>
                )}
              </YS>
            </ScrollView>
          </YS>
        )}

        {/* ── MAIN CONTENT ── */}
        <YS flex={1} padding={isMobile ? "$2" : "$6"} gap={isMobile ? "$3" : "$5"}>
          {loading ? (
            <YS flex={1} justifyContent="center" alignItems="center" gap="$4" paddingTop={80}>
              <Spinner size="large" color="#28a745" />
              <Txt color="#555" fontSize={14}>Đang tải bảng xếp hạng...</Txt>
            </YS>
          ) : (
            <>
              {/* ── Tournament Header ── */}
              <XS
                alignItems="center"
                justifyContent="space-between"
                backgroundColor="#0a0a0a"
                padding={isMobile ? "$3" : "$5"}
                borderRadius={isMobile ? 14 : 20}
                borderWidth={1}
                borderColor="#1e1e1e"
              >
                {/* Logo + Name */}
                <XS alignItems="center" gap={isMobile ? "$2" : "$4"} flex={1}>
                  <IMG
                    src={data?.tournamentInfo?.logo || `https://api.sofascore.app/api/v1/unique-tournament/${currentId}/image`}
                    width={isMobile ? 36 : 56}
                    height={isMobile ? 36 : 56}
                    style={{ objectFit: 'contain' }}
                  />
                  <YS flex={1}>
                    <Txt
                      color="white"
                      fontSize={isMobile ? 15 : 24}
                      fontWeight="900"
                      letterSpacing={isMobile ? 0 : -0.5}
                      numberOfLines={1}
                    >
                      {data?.tournamentInfo?.name || 'Bảng xếp hạng'}
                    </Txt>
                    <Txt color="#28a745" fontSize={isMobile ? 11 : 13} fontWeight="700">
                      {data?.tournamentInfo?.season || ''}
                    </Txt>
                  </YS>
                </XS>

                {/* Tab switcher */}
                {(groupsToRender.length > 0 || hasKnockout) && (
                  <XS backgroundColor="#111" borderRadius={10} padding={3} gap="$1">
                    {groupsToRender.length > 0 && (
                      <BTN
                        unstyled
                        paddingHorizontal={isMobile ? "$2" : "$3"}
                        paddingVertical="$2"
                        borderRadius={7}
                        backgroundColor={activeTab === 'groups' ? '#28a745' : 'transparent'}
                        onPress={() => setActiveTab('groups')}
                        flexDirection="row"
                        alignItems="center"
                        gap={4}
                      >
                        <LayoutGrid size={14} color="white" />
                        {!isMobile && <Txt color="white" fontSize={11} fontWeight="800">BXH</Txt>}
                      </BTN>
                    )}
                    {hasKnockout && (
                      <BTN
                        unstyled
                        paddingHorizontal={isMobile ? "$2" : "$3"}
                        paddingVertical="$2"
                        borderRadius={7}
                        backgroundColor={activeTab === 'knockout' ? '#28a745' : 'transparent'}
                        onPress={() => setActiveTab('knockout')}
                        flexDirection="row"
                        alignItems="center"
                        gap={4}
                      >
                        <GitBranch size={14} color="white" />
                        {!isMobile && <Txt color="white" fontSize={11} fontWeight="800">KNOCKOUT</Txt>}
                      </BTN>
                    )}
                  </XS>
                )}
              </XS>

              {/* ── Content area ── */}
              <ScrollView showsVerticalScrollIndicator={false}>
                {activeTab === 'groups' && groupsToRender.length > 0 ? (
                  <YS gap="$4">
                    {groupsToRender.map((group: any, gIdx: number) => (
                      <YS
                        key={group.name ?? gIdx}
                        backgroundColor="#0a0a0a"
                        borderRadius={isMobile ? 12 : 20}
                        overflow="hidden"
                        borderWidth={1}
                        borderColor="#1a1a1a"
                      >
                        {group.name && (
                          <XS
                            backgroundColor="#151b18"
                            paddingHorizontal="$4"
                            paddingVertical="$2.5"
                            borderBottomWidth={1}
                            borderColor="#111"
                          >
                            <Txt color="#28a745" fontWeight="900" fontSize={13}>
                              {group.name.toUpperCase()}
                            </Txt>
                          </XS>
                        )}

                        {/* Column headers */}
                        <XS
                          paddingHorizontal={isMobile ? "$3" : "$5"}
                          paddingVertical="$2"
                          backgroundColor="#0f1410"
                          borderBottomWidth={1}
                          borderColor="#111"
                          alignItems="center"
                        >
                          {/* # */}
                          <Txt width={isMobile ? 32 : 44} color="#555" fontWeight="900" fontSize={10} textAlign="center">#</Txt>
                          {/* Đội bóng */}
                          <Txt flex={1} color="#555" fontWeight="900" fontSize={10}>ĐỘI BÓNG</Txt>
                          {/* Stats */}
                          <XS alignItems="center" gap={0}>
                            <Txt width={isMobile ? 32 : 40} textAlign="center" color="#555" fontWeight="900" fontSize={10}>ST</Txt>
                            {!isMobile && <Txt width={36} textAlign="center" color="#555" fontWeight="900" fontSize={10}>T</Txt>}
                            {!isMobile && <Txt width={36} textAlign="center" color="#555" fontWeight="900" fontSize={10}>H</Txt>}
                            {!isMobile && <Txt width={36} textAlign="center" color="#555" fontWeight="900" fontSize={10}>B</Txt>}
                            <Txt width={isMobile ? 38 : 44} textAlign="center" color="#555" fontWeight="900" fontSize={10}>HS</Txt>
                            <Txt width={isMobile ? 36 : 48} textAlign="center" color="#28a745" fontWeight="900" fontSize={11}>Đ</Txt>
                            {!isMobile && <Txt width={140} textAlign="right" color="#555" fontWeight="900" fontSize={10} paddingRight={4}>PHONG ĐỘ</Txt>}
                          </XS>
                        </XS>

                        {group.rows?.map((item: any, idx: number) => (
                          <StandingRow
                            key={item.team?.id ?? item.id ?? idx}
                            item={item}
                            isLast={idx === group.rows.length - 1}
                            compact={isMobile}
                          />
                        ))}
                      </YS>
                    ))}
                  </YS>
                ) : activeTab === 'knockout' && hasKnockout ? (
                  <YS padding={isMobile ? "$0" : "$2"}>
                    <KnockoutBracket rounds={data.knockoutData} compact={isMobile} />
                  </YS>
                ) : (
                  <YS flex={1} justifyContent="center" alignItems="center" padding="$10">
                    <Txt color="#444" fontSize={16} textAlign="center">
                      Không có dữ liệu cho giải đấu này
                    </Txt>
                  </YS>
                )}
              </ScrollView>
            </>
          )}
        </YS>
      </XS>
    </YS>
  )
}