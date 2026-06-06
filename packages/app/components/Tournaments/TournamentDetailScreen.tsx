"use client"
import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, View, Image, Button, Spinner, useMedia } from 'tamagui'
import { MapPin, Users, Trophy, ChevronLeft, Clock, RefreshCcw, Check, X, AlertCircle, Phone, Mail, CreditCard, User, Shield } from '@tamagui/lucide-icons'
import Link from 'next/link'
import { useRouter } from 'solito/navigation'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import RegisterTeamModal from './RegisterTeamModal'
import { AutoSchedulerModal } from './AutoSchedulerModal'
import { AddMatchModal } from './AddMatchModal'
import { AppConfirmDialog, AppAlertDialog } from '../layout/AppDialog'
import { StandingRow } from '../Standings/StandingRow'

const parseDateString = (dStr: string) => {
  if (!dStr) return new Date();
  if (dStr.includes('/')) {
    const parts = dStr.split('/');
    if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  if (dStr.includes('-')) {
    const parts = dStr.split('-');
    if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date(dStr);
}

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
const C = { primary: '#28a745', bg: '#050807', card: 'rgba(15,22,18,0.95)', border: 'rgba(255,255,255,0.18)' }

const FORMAT_LABEL: Record<string, string> = {
  League: 'Vòng tròn', Knockout: 'Loại trực tiếp',
  GroupKnockout: 'Chia bảng + KO', DoubleElimination: 'Thắng/Thua',
}
const STATUS_CFG: Record<string, any> = {
  Registration: { label: 'Đang mở đăng ký', color: '#28a745' },
  Opening:      { label: 'Sắp khai mạc', color: '#17a2b8' },
  Ongoing:      { label: 'Đang thi đấu', color: '#ffd700' },
  Finished:     { label: 'Đã kết thúc', color: '#555' },
  Pending:      { label: 'Chờ phê duyệt', color: '#fa8c16' },
}
const TEAM_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  Pending:       { label: 'Chờ duyệt',     color: '#fa8c16', bg: 'rgba(250,140,22,0.12)' },
  Approved:      { label: '✓ Đã duyệt',    color: '#28a745', bg: 'rgba(40,167,69,0.12)' },
  Confirmed:     { label: '✓✓ Xác nhận', color: '#17a2b8', bg: 'rgba(23,162,184,0.12)' },
  RequireUpdate: { label: '⚠ Cần bổ sung', color: '#ffd700', bg: 'rgba(255,215,0,0.1)' },
  Rejected:      { label: '✗ Từ chối',     color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)' },
}

const normalizeStandings = (data: any) => {
  if (Array.isArray(data?.standings)) return data.standings.filter((g: any) => g && Array.isArray(g.rows))
  return []
}

const buildFallbackStats = (data: any) => {
  const players = (data?.teams || []).flatMap((team: any) =>
    (team.players || []).filter((p: any) => p?.name).map((p: any, index: number) => ({
      playerName: p.name,
      teamName: team.teamName,
      teamLogo: team.logo,
      goals: Math.max(0, 5 - index),
      yellowCards: index % 3,
      redCards: index === 4 ? 1 : 0,
    }))
  )

  return {
    topScorers: players.filter((p: any) => p.goals > 0).sort((a: any, b: any) => b.goals - a.goals).slice(0, 10),
    cards: players.filter((p: any) => p.yellowCards || p.redCards).sort((a: any, b: any) => (b.yellowCards + b.redCards * 2) - (a.yellowCards + a.redCards * 2)).slice(0, 10),
  }
}

const getScore = (match: any, side: 'home' | 'away') => {
  const direct = side === 'home' ? match.homeScore : match.awayScore
  const score = match.score?.[side]
  const value = direct ?? (typeof score === 'object' ? score?.current : score)
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const normalizeMatchStatus = (status: any) => String(status || '').toLowerCase()
const isPlayedMatch = (status: any) => ['finished', 'ongoing', 'inprogress', 'live'].includes(normalizeMatchStatus(status))
const isFinishedMatch = (status: any) => ['finished', 'ended', 'fulltime', 'ft'].includes(normalizeMatchStatus(status))
const isScheduledMatch = (status: any) => ['scheduled', 'notstarted', 'pending'].includes(normalizeMatchStatus(status))

const buildStatsFromMatches = (data: any, matches: any[] = []) => {
  const fallback = buildFallbackStats(data)
  const teams = new Map<string, any>()
  const players = new Map<string, any>()
  const ensureTeam = (team: any) => {
    const id = String(team?.id || team?.teamId || team?.name || 'unknown')
    if (!teams.has(id)) {
      teams.set(id, {
        teamId: id,
        teamName: team?.name || team?.teamName || 'TBA',
        teamLogo: team?.logo || team?.photo || '',
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        cleanSheets: 0,
        yellowCards: 0,
        redCards: 0,
        fairPlayPoints: 0,
      })
    }
    return teams.get(id)
  }
  const addPlayer = (team: any, name: string, patch: any) => {
    const key = `${team?.id || team?.name || ''}::${name}`
    const current = players.get(key) || {
      playerName: name || 'Chưa rõ cầu thủ',
      teamName: team?.name || team?.teamName || 'TBA',
      teamLogo: team?.logo || team?.photo || '',
      goals: 0,
      yellowCards: 0,
      redCards: 0,
    }
    players.set(key, {
      ...current,
      goals: current.goals + (patch.goals || 0),
      yellowCards: current.yellowCards + (patch.yellowCards || 0),
      redCards: current.redCards + (patch.redCards || 0),
    })
  }

  ;(data?.teams || []).forEach((team: any) => ensureTeam({ id: team.id || team.teamId, name: team.teamName || team.name, logo: team.logo }))
  const played = matches.filter((match) => isPlayedMatch(match.status))
  const finished = matches.filter((match) => isFinishedMatch(match.status))
  const scheduled = matches.filter((match) => isScheduledMatch(match.status))
  const live = matches.filter((match) => ['ongoing', 'inprogress', 'live'].includes(normalizeMatchStatus(match.status)))
  let totalGoals = 0
  let totalYellowCards = 0
  let totalRedCards = 0
  const highlights: any = { highestScoring: null, biggestWin: null, mostCards: null, latestFinished: null }

  played.forEach((match: any) => {
    const home = ensureTeam(match.homeTeam)
    const away = ensureTeam(match.awayTeam)
    const homeScore = getScore(match, 'home')
    const awayScore = getScore(match, 'away')
    const total = homeScore + awayScore
    let matchCards = 0
    totalGoals += total

    if (isFinishedMatch(match.status)) {
      home.played += 1
      away.played += 1
      home.goalsFor += homeScore
      home.goalsAgainst += awayScore
      away.goalsFor += awayScore
      away.goalsAgainst += homeScore
      if (awayScore === 0) home.cleanSheets += 1
      if (homeScore === 0) away.cleanSheets += 1
      if (homeScore > awayScore) { home.wins += 1; away.losses += 1 }
      else if (homeScore < awayScore) { away.wins += 1; home.losses += 1 }
      else { home.draws += 1; away.draws += 1 }
    }

    ;(match.incidents || match.events || []).forEach((event: any) => {
      const type = String(event.type || event.incidentType || event.eventType || '').toLowerCase()
      const team = String(event.team || event.incidentClass || '').toLowerCase().includes('away') ? match.awayTeam : match.homeTeam
      const teamStat = ensureTeam(team)
      const playerName = event.playerName || event.player?.name || event.player || event.name || 'Chưa rõ cầu thủ'
      if (type.includes('goal') && !type.includes('own')) addPlayer(team, playerName, { goals: 1 })
      if (type.includes('yellow')) {
        totalYellowCards += 1
        matchCards += 1
        teamStat.yellowCards += 1
        addPlayer(team, playerName, { yellowCards: 1 })
      }
      if (type.includes('red')) {
        totalRedCards += 1
        matchCards += 1
        teamStat.redCards += 1
        addPlayer(team, playerName, { redCards: 1 })
      }
    })

    const summary = { id: match.id, dateString: match.dateString, timeString: match.timeString, homeTeam: match.homeTeam, awayTeam: match.awayTeam, homeScore, awayScore, totalGoals: total, goalMargin: Math.abs(homeScore - awayScore), totalCards: matchCards, startTimestamp: match.startTimestamp }
    if (!highlights.highestScoring || total > highlights.highestScoring.totalGoals) highlights.highestScoring = summary
    if (!highlights.biggestWin || summary.goalMargin > highlights.biggestWin.goalMargin) highlights.biggestWin = summary
    if (!highlights.mostCards || matchCards > highlights.mostCards.totalCards) highlights.mostCards = summary
    if (isFinishedMatch(match.status) && (!highlights.latestFinished || Number(match.startTimestamp || 0) > Number(highlights.latestFinished.startTimestamp || 0))) highlights.latestFinished = summary
  })

  fallback.topScorers.forEach((player: any) => {
    const key = `${player.teamName || ''}::${player.playerName}`
    if (!players.has(key)) players.set(key, player)
  })
  fallback.cards.forEach((player: any) => {
    const key = `${player.teamName || ''}::${player.playerName}`
    if (!players.has(key)) players.set(key, player)
  })

  const teamStats = Array.from(teams.values()).map((team: any) => ({
    ...team,
    goalDifference: team.goalsFor - team.goalsAgainst,
    fairPlayPoints: team.yellowCards + team.redCards * 3,
  }))
  const playerStats = Array.from(players.values())

  return {
    summary: {
      totalMatches: matches.length,
      playedMatches: played.length,
      finishedMatches: finished.length,
      scheduledMatches: scheduled.length,
      liveMatches: live.length,
      totalGoals,
      goalsPerMatch: finished.length ? Number((totalGoals / finished.length).toFixed(2)) : 0,
      totalYellowCards,
      totalRedCards,
      cardsPerMatch: played.length ? Number(((totalYellowCards + totalRedCards) / played.length).toFixed(2)) : 0,
    },
    teamStats,
    topScorers: playerStats.filter((p: any) => p.goals > 0).sort((a: any, b: any) => b.goals - a.goals).slice(0, 20),
    cards: playerStats.filter((p: any) => p.yellowCards || p.redCards).sort((a: any, b: any) => (b.yellowCards + b.redCards * 3) - (a.yellowCards + a.redCards * 3)).slice(0, 20),
    highlights,
  }
}

const getTournamentStats = (data: any, matches: any[] = []) => {
  if (matches.length) return buildStatsFromMatches(data, matches)
  const fallback = buildFallbackStats(data)
  return {
    summary: {},
    teamStats: [],
    topScorers: data?.stats?.topScorers?.length ? data.stats.topScorers : fallback.topScorers,
    cards: data?.stats?.cards?.length ? data.stats.cards : fallback.cards,
    highlights: {},
  }
}

// ─── Team Detail Panel (modal) ────────────────────────────────────
interface DetailPanelProps {
  team: any
  tournamentId: string
  onClose: () => void
  onUpdated: () => void
  onConfirm: (cfg: any) => void
  onAlert: (cfg: any) => void
}
const TeamDetailPanel = ({ team, tournamentId, onClose, onUpdated, onConfirm, onAlert }: DetailPanelProps) => {
  const [note, setNote] = useState(team.btcNote || '')
  const [pendingStatus, setPendingStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const st = TEAM_STATUS[team.status] || TEAM_STATUS.Pending

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`${API}/tournaments/${tournamentId}/teams/${team.id}/status`, 
        { status: newStatus, btcNote: note },
        { headers: { Authorization: token ? `Bearer ${token}` : '' } }
      )
      setMsg(`✅ Đã cập nhật: ${TEAM_STATUS[newStatus]?.label || newStatus}`)
      onUpdated()
    } catch (e: any) {
      setMsg(`❌ ${e.response?.data?.message || 'Lỗi cập nhật'}`)
    } finally { setLoading(false) }
  }

  const deleteTeam = () => {
    onConfirm({
      title: 'Xóa hồ sơ đội',
      message: `Bạn có chắc muốn XÓA vĩnh viễn đội "${team.teamName}" khỏi giải?`,
      danger: true,
      onConfirm: async () => {
        setLoading(true)
        try {
          const token = localStorage.getItem('token')
          await axios.delete(`${API}/tournaments/${tournamentId}/teams/${team.id}`, {
            headers: { Authorization: token ? `Bearer ${token}` : '' }
          })
          onAlert({ title: 'Thành công', message: `Đã xóa đội "${team.teamName}"`, type: 'success' })
          onUpdated()
        } catch (e: any) {
          onAlert({ title: 'Lỗi', message: e.response?.data?.message || 'Lỗi xóa đội', type: 'error' })
          setLoading(false)
        }
      }
    })
  }

  return (
    <View position="fixed" top={0} left={0} right={0} bottom={0}
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(14px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
      <YStack
        backgroundColor={"#0a0f0c" as any} borderRadius={20}
        borderWidth={1} borderColor={"rgba(40,167,69,0.2)" as any}
        width={580} maxWidth="100%"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.9)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '93vh' }}>

        {/* ── Header ── */}
        <XStack
          padding="$4" paddingBottom="$3"
          borderBottomWidth={1} borderColor={"rgba(255,255,255,0.06)" as any}
          justifyContent="space-between" alignItems="center"
          style={{ flexShrink: 0, background: 'linear-gradient(135deg, rgba(40,167,69,0.1) 0%, transparent 100%)' }}
        >
          <XStack alignItems="center" gap="$3">
            {/* Jersey preview */}
            <XStack gap="$1.5" alignItems="center">
              {team.logo ? (
                <img src={team.logo} alt={team.teamName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)' }} />
              ) : (
                <>
                  <View width={36} height={36} borderRadius={18}
                    backgroundColor={(team.jerseyColor || 'rgba(40,167,69,0.2)') as any}
                    borderWidth={2} borderColor={"rgba(255,255,255,0.15)" as any} />
                  {team.jerseyColorAlt && (
                    <View width={24} height={24} borderRadius={12}
                      backgroundColor={(team.jerseyColorAlt) as any}
                      borderWidth={2} borderColor={"rgba(255,255,255,0.15)" as any}
                      style={{ marginLeft: -12, zIndex: 1 }} />
                  )}
                </>
              )}
            </XStack>
            <YStack>
              <Text color="white" fontSize={18} fontWeight="900">{team.teamName}</Text>
              <XStack alignItems="center" gap="$1.5">
                <View backgroundColor={st.bg as any} paddingHorizontal={8} paddingVertical={2}
                  borderRadius={10} borderWidth={1} borderColor={(st.color + '55') as any}>
                  <Text color={st.color as any} fontSize={10} fontWeight="900">{st.label}</Text>
                </View>
                <Text color="#444" fontSize={11}>
                  {new Date(team.appliedAt).toLocaleDateString('vi-VN')}
                </Text>
              </XStack>
            </YStack>
          </XStack>
          <View padding={6} onPress={onClose} style={{ cursor: 'pointer' }}>
            <X size={20} color="#555" />
          </View>
        </XStack>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <YStack gap="$4">

            {/* ── Thông tin trưởng đoàn ── */}
            <YStack gap="$2.5">
              <XStack alignItems="center" gap="$1.5" paddingBottom="$1.5"
                borderBottomWidth={1} borderColor={"rgba(255,255,255,0.06)" as any}>
                <User size={14} color={C.primary as any} />
                <Text color="white" fontSize={13} fontWeight="900">Trưởng đoàn / Quản lý</Text>
              </XStack>

              <XStack gap="$3" flexWrap={"wrap" as any}>
                <InfoChip icon={<User size={12} color="#888" />} label="Họ tên" value={team.managerName || '—'} />
                <InfoChip icon={<Phone size={12} color="#888" />} label="Điện thoại" value={team.managerPhone || '—'} clickable />
                {team.managerEmail && <InfoChip icon={<Mail size={12} color="#888" />} label="Email" value={team.managerEmail} />}
                {team.managerIdCard && <InfoChip icon={<CreditCard size={12} color="#888" />} label="CCCD/CMND" value={team.managerIdCard} />}
              </XStack>

              {(team.coachName || team.coachPhone) && (
                <XStack
                  backgroundColor={"rgba(255,255,255,0.03)" as any}
                  borderRadius={10} padding="$2.5" gap="$3"
                  borderWidth={1} borderColor={"rgba(255,255,255,0.06)" as any}>
                  <Shield size={14} color="#888" style={{ flexShrink: 0, marginTop: 2 }} />
                  <YStack flex={1} gap="$0.5">
                    <Text color="#888" fontSize={11} fontWeight="700">HLV TRƯỞNG</Text>
                    <Text color="white" fontSize={13} fontWeight="700">{team.coachName}</Text>
                    {team.coachPhone && <Text color="#666" fontSize={12}>{team.coachPhone}</Text>}
                  </YStack>
                </XStack>
              )}
            </YStack>

            {/* ── Ghi chú / note của đội ── */}
            {team.note && (
              <YStack backgroundColor={"rgba(255,255,255,0.03)" as any} borderRadius={10}
                borderWidth={1} borderColor={"rgba(255,255,255,0.06)" as any} padding="$3">
                <Text color="#555" fontSize={10} fontWeight="700" marginBottom="$1">GHI CHÚ TỪ ĐỘI</Text>
                <Text color="#aaa" fontSize={13}>{team.note}</Text>
              </YStack>
            )}

            {/* ── Danh sách cầu thủ ── */}
            <YStack gap="$2.5">
              <XStack alignItems="center" gap="$1.5" paddingBottom="$1.5"
                borderBottomWidth={1} borderColor={"rgba(255,255,255,0.06)" as any}
                justifyContent="space-between">
                <XStack alignItems="center" gap="$1.5">
                  <Users size={14} color={C.primary as any} />
                  <Text color="white" fontSize={13} fontWeight="900">Danh sách cầu thủ</Text>
                </XStack>
                <Text color="#555" fontSize={11} fontWeight="700">
                  {team.players?.length || team.playerCount || 0} cầu thủ
                </Text>
              </XStack>

              {(!team.players || team.players.length === 0) ? (
                <YStack backgroundColor={"rgba(255,255,255,0.02)" as any} borderRadius={10}
                  padding="$4" alignItems="center" gap="$1">
                  <Text color="#444" fontSize={13}>Đội chưa upload danh sách cầu thủ chi tiết</Text>
                  {team.playerCount > 0 && (
                    <Text color="#555" fontSize={12}>
                      (Đội đăng ký {team.playerCount} cầu thủ — chưa có thông tin chi tiết)
                    </Text>
                  )}
                </YStack>
              ) : (
                <YStack gap="$1.5">
                  {/* Header row */}
                  <XStack paddingHorizontal="$2" paddingVertical="$1"
                    backgroundColor={"rgba(255,255,255,0.03)" as any} borderRadius={8}>
                    <Text color="#555" fontSize={10} fontWeight="700" width={28}>#</Text>
                    <Text color="#555" fontSize={10} fontWeight="700" flex={1}>HỌ TÊN</Text>
                    <Text color="#555" fontSize={10} fontWeight="700" width={64} textAlign={"center" as any}>VỊ TRÍ</Text>
                    <Text color="#555" fontSize={10} fontWeight="700" width={30} textAlign={"center" as any}>ÁO</Text>
                    <Text color="#555" fontSize={10} fontWeight="700" width={90} textAlign={"right" as any}>CCCD</Text>
                  </XStack>

                  {team.players.map((p: any, i: number) => (
                    <XStack key={`${p.name}-${i}`}
                      backgroundColor={"rgba(255,255,255,0.02)" as any}
                      borderRadius={10} padding="$2.5" alignItems="center" gap="$2"
                      borderWidth={1} borderColor={"rgba(255,255,255,0.05)" as any}
                      hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.04)' } as any}>
                      {/* Photo */}
                      {p.photo ? (
                        <img src={p.photo} alt={p.name}
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.12)' }} />
                      ) : (
                        <View width={36} height={36} borderRadius={18} flexShrink={0}
                          backgroundColor={"rgba(40,167,69,0.1)" as any}
                          alignItems="center" justifyContent="center"
                          borderWidth={1} borderColor={"rgba(40,167,69,0.2)" as any}>
                          <Text color={C.primary as any} fontSize={12} fontWeight="900">{i + 1}</Text>
                        </View>
                      )}
                      {/* Name */}
                      <YStack flex={1} gap="$0.5">
                        <Text color="white" fontSize={13} fontWeight="700" numberOfLines={1}>{p.name}</Text>
                        {p.dob && <Text color="#555" fontSize={10}>{p.dob}</Text>}
                      </YStack>
                      {/* Position */}
                      <View width={64} alignItems="center">
                        {p.position && (
                          <View
                            paddingHorizontal={6} paddingVertical={2} borderRadius={6}
                            backgroundColor={"rgba(40,167,69,0.1)" as any}>
                            <Text color={C.primary as any} fontSize={9} fontWeight="900" numberOfLines={1}>
                              {p.position === 'Thủ môn' ? 'TM' : p.position === 'Hậu vệ' ? 'HV' : p.position === 'Tiền vệ' ? 'TV' : p.position === 'Tiền đạo' ? 'TĐ' : p.position}
                            </Text>
                          </View>
                        )}
                      </View>
                      {/* Number */}
                      <Text color="#888" fontSize={13} fontWeight="900" width={30} textAlign={"center" as any}>
                        {p.number || '—'}
                      </Text>
                      {/* ID Card */}
                      <Text color="#444" fontSize={10} width={90} textAlign={"right" as any} numberOfLines={1}>
                        {p.idCard || '—'}
                      </Text>
                    </XStack>
                  ))}
                </YStack>
              )}
            </YStack>

            {/* ── Thao tác duyệt & Ghi chú BTC ── */}
            <YStack gap="$3" marginTop="$2">
              <Text color="#555" fontSize={11} fontWeight="700">THAO TÁC XÉT DUYỆT</Text>
              
              <XStack gap="$2" flexWrap={"wrap" as any}>
                <BigActionBtn
                  color="#28a745" label="✓ Duyệt hồ sơ"
                  bg="rgba(40,167,69,0.12)"
                  loading={loading} onPress={() => updateStatus('Approved')} />
                <BigActionBtn
                  color="#17a2b8" label="✓✓ Xác nhận"
                  bg="rgba(23,162,184,0.1)"
                  loading={loading} onPress={() => updateStatus('Confirmed')} />
                <BigActionBtn
                  color="#ffd700" label="⚠ Yêu cầu bổ sung"
                  bg="rgba(255,215,0,0.08)"
                  loading={loading} onPress={() => { setPendingStatus('RequireUpdate'); setNote(team.btcNote || ''); }} />
                <BigActionBtn
                  color="#ff4d4f" label="✗ Từ chối"
                  bg="rgba(255,77,79,0.08)"
                  loading={loading} onPress={() => { setPendingStatus('Rejected'); setNote(team.btcNote || ''); }} />
              </XStack>

              {/* Input ghi chú hiện lên khi chọn Yêu cầu bổ sung hoặc Từ chối */}
              {(pendingStatus === 'RequireUpdate' || pendingStatus === 'Rejected') && (
                <YStack gap="$2" backgroundColor="rgba(255,255,255,0.02)" padding="$3" borderRadius={12} borderWidth={1} borderColor="rgba(255,255,255,0.05)">
                  <XStack alignItems="center" gap="$1.5">
                    <AlertCircle size={14} color={pendingStatus === 'RequireUpdate' ? "#ffd700" : "#ff4d4f"} />
                    <Text color="white" fontSize={13} fontWeight="900">
                      {pendingStatus === 'RequireUpdate' ? 'Lý do yêu cầu bổ sung:' : 'Lý do từ chối:'}
                    </Text>
                  </XStack>
                  <XStack
                    backgroundColor={"rgba(255,255,255,0.04)" as any} borderRadius={10}
                    borderWidth={1} borderColor={"rgba(255,255,255,0.1)" as any}
                    paddingHorizontal="$3" paddingVertical="$2.5">
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Nhập nội dung phản hồi cho đội bóng..."
                      rows={3}
                      autoFocus
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 13, fontFamily: 'inherit', resize: 'none', width: '100%' }}
                    />
                  </XStack>
                  <Button 
                    backgroundColor={C.primary as any} 
                    height={36} 
                    disabled={!note.trim() || loading}
                    onPress={() => updateStatus(pendingStatus)}
                  >
                    <Text color="white" fontWeight="900" fontSize={12}>XÁC NHẬN GỬI YÊU CẦU</Text>
                  </Button>
                  <Button 
                    backgroundColor="transparent" 
                    height={30} 
                    onPress={() => setPendingStatus('')}
                  >
                    <Text color="#555" fontWeight="700" fontSize={11}>Hủy bỏ</Text>
                  </Button>
                </YStack>
              )}

              {msg.length > 0 && (
                <Text color={(msg.startsWith('✅') ? C.primary : '#ff4d4f') as any} fontSize={12} fontWeight="700" textAlign="center">{msg}</Text>
              )}
            </YStack>
          </YStack>
        </div>

        {/* ── Footer ── */}
        <YStack
          padding="$4" paddingTop="$3"
          borderTopWidth={1} borderColor={"rgba(255,255,255,0.06)" as any}
          gap="$2.5" style={{ flexShrink: 0 }}
        >
          {/* Nút Xóa đội chỉ hiện khi đội đang bị từ chối */}
          {team.status === 'Rejected' && pendingStatus !== 'Rejected' && (
             <XStack justifyContent="center" marginBottom="$2">
               <Text 
                  color="#ff4d4f" fontSize={12} fontWeight="700" textDecorationLine="underline"
                  onPress={loading ? undefined : deleteTeam}
                  style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: 0.8 }}
                  hoverStyle={{ opacity: 1 }}
               >
                 Xóa hồ sơ đội này khỏi giải
               </Text>
             </XStack>
          )}

          <XStack
            height={40} borderRadius="$10" alignItems="center" justifyContent="center"
            backgroundColor={"rgba(255,255,255,0.06)" as any}
            onPress={onClose} style={{ cursor: 'pointer' }}>
            <Text color="#888" fontWeight="700" fontSize={13}>Đóng</Text>
          </XStack>
        </YStack>
      </YStack>
    </View>
  )
}

const InfoChip = ({ icon, label, value, clickable = false }: any) => (
  <YStack backgroundColor={"rgba(255,255,255,0.04)" as any} borderRadius={10}
    borderWidth={1} borderColor={"rgba(255,255,255,0.07)" as any}
    padding="$2.5" gap="$0.5" flex={1} minWidth={130}>
    <XStack alignItems="center" gap="$1">
      {icon}
      <Text color="#555" fontSize={10} fontWeight="700">{label.toUpperCase()}</Text>
    </XStack>
    <Text
      color={clickable ? '#4fc3f7' : 'white'} fontSize={13} fontWeight="700"
      numberOfLines={1}>
      {value}
    </Text>
  </YStack>
)

const BigActionBtn = ({ color, label, bg, loading, onPress }: any) => (
  <XStack flex={1} minWidth={130} height={40} borderRadius={10}
    backgroundColor={bg as any}
    borderWidth={1} borderColor={(color + '55') as any}
    alignItems="center" justifyContent="center"
    onPress={loading ? undefined : onPress}
    style={{ cursor: loading ? 'not-allowed' : 'pointer' }}>
    <Text color={color as any} fontSize={12} fontWeight="900">{label}</Text>
  </XStack>
)

// ─── Team Preview Card (trong danh sách BTC) ─────────────────────
const TeamCard = ({ team, onViewDetail, onDelete }: any) => {
  const st = TEAM_STATUS[team.status] || TEAM_STATUS.Pending
  return (
    <XStack
      backgroundColor={C.card as any} borderRadius={14}
      borderWidth={1} borderColor={(team.status === 'Pending' ? 'rgba(250,140,22,0.2)' : C.border) as any}
      padding="$3" alignItems="center" gap="$3"
      hoverStyle={{ borderColor: 'rgba(40,167,69,0.2)' } as any}
      onPress={onViewDetail} style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}>
      {/* Avatar (jersey color) */}
      {team.logo ? (
        <img src={team.logo} alt={team.teamName || 'team logo'} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.1)' }} />
      ) : team.players?.[0]?.photo ? (
        <img src={team.players[0].photo} alt={team.teamName || 'team photo'} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.1)' }} />
      ) : (
        <View width={44} height={44} borderRadius={22} flexShrink={0}
          backgroundColor={(team.jerseyColor || 'rgba(40,167,69,0.15)') as any}
          alignItems="center" justifyContent="center"
          borderWidth={1} borderColor={"rgba(255,255,255,0.1)" as any}>
          <Text color="white" fontSize={16}>⚽</Text>
        </View>
      )}

      <YStack flex={1} gap="$0.5">
        <Text color="white" fontSize={14} fontWeight="900">{team.teamName}</Text>
        <XStack gap="$3" alignItems="center">
          {team.managerName && (
            <Text color="#555" fontSize={11}>{team.managerName}</Text>
          )}
          {team.managerPhone && (
            <Text color="#444" fontSize={11}>{team.managerPhone}</Text>
          )}
        </XStack>
        <XStack gap="$3" alignItems="center">
          <Text color="#445" fontSize={11}>
            {(team.players?.length || team.playerCount || 0)} cầu thủ
          </Text>
          {team.btcNote && (
            <Text color="#fa8c16" fontSize={11} numberOfLines={1} flex={1}>
              BTC: {team.btcNote}
            </Text>
          )}
        </XStack>
      </YStack>

      <YStack alignItems="flex-end" gap="$1.5">
        <XStack alignItems="center" gap="$2">
          <View backgroundColor={st.bg as any} paddingHorizontal={8} paddingVertical={3}
            borderRadius={10} borderWidth={1} borderColor={(st.color + '55') as any}>
            <Text color={st.color as any} fontSize={10} fontWeight="900">{st.label}</Text>
          </View>
          {team.status === 'Rejected' && onDelete && (
            <View 
              backgroundColor="rgba(255,77,79,0.1)" 
              padding="$1.5" borderRadius={8} 
              borderWidth={1} borderColor="rgba(255,77,79,0.3)"
              onPress={(e: any) => { e.stopPropagation(); onDelete(); }}
              hoverStyle={{ backgroundColor: 'rgba(255,77,79,0.2)' } as any}
              style={{ paddingLeft: 6, paddingRight: 6 }}
            >
              <Text color="#ff4d4f" fontSize={12}>🗑️</Text>
            </View>
          )}
        </XStack>
        <Text color="#333" fontSize={10} fontWeight="700">Xem chi tiết →</Text>
      </YStack>
    </XStack>
  )
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────
export default function TournamentDetailScreen({ id }: { id: string }) {
  const media = useMedia()
  const isMobile = !media.gtMd
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams?.get('tab')
  const edit = searchParams?.get('edit')
  const lastHandledRef = React.useRef<string | null>(null)

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'teams' | 'matches' | 'standings' | 'stats' | 'btc' | 'rules'>('info')
  const [showRegister, setShowRegister] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [editTeam, setEditTeam] = useState<any>(null)
  const [showScheduler, setShowScheduler] = useState(false)
  const [showAddMatch, setShowAddMatch] = useState(false)
  const [editMatch, setEditMatch] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [statsData, setStatsData] = useState<any>(null)

  const [confirmConfig, setConfirmConfig] = useState<any>({ open: false, title: '', message: '', onConfirm: null, danger: false })
  const [alertConfig, setAlertConfig] = useState<any>({ open: false, title: '', message: '', type: 'info' })
  const showConfirm = (cfg: any) => setConfirmConfig({ ...cfg, open: true })
  const showAlert = (cfg: any) => setAlertConfig({ ...cfg, open: true })

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    showConfirm({
      title: 'Xóa đội bóng',
      message: `Xác nhận XÓA vĩnh viễn đội "${teamName}" khỏi giải?`,
      danger: true,
      onConfirm: async () => {
        setConfirmConfig(c => ({...c, open: false}))
        try {
          setLoading(true)
          const token = localStorage.getItem('token')
          await axios.delete(`${API}/tournaments/${id}/teams/${teamId}`, {
            headers: { Authorization: token ? `Bearer ${token}` : '' }
          })
          showAlert({ title: 'Thành công', message: `Đã xóa đội "${teamName}"`, type: 'success' })
          loadData()
        } catch (e: any) {
          showAlert({ title: 'Lỗi', message: e.response?.data?.message || 'Lỗi xóa đội', type: 'error' })
          setLoading(false)
        }
      }
    })
  }
  
  // --- HTML5 Drag and Drop ---
  const [draggedMatch, setDraggedMatch] = useState<any>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const loadData = React.useCallback(() => {
    if (!id) return
    setLoading(true)
    axios.get(`${API}/tournaments/${id}`)
      .then(r => setData(r.data?.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [id])
  
  const fetchMatches = React.useCallback(() => {
    if (!id) return
    axios.get(`${API}/tournaments/${id}/matches`)
      .then(r => { if (r.data?.success) setMatches(r.data.data) })
      .catch(() => {})
  }, [id])

  const fetchStats = React.useCallback(() => {
    if (!id) return
    axios.get(`${API}/tournaments/${id}/stats`)
      .then(r => { if (r.data?.success) setStatsData(r.data.data) })
      .catch(() => setStatsData(null))
  }, [id])


  useEffect(() => { 
    loadData() 
    fetchMatches()
    fetchStats()
    const u = localStorage.getItem('user')
    if (u) {
      try { setCurrentUser(JSON.parse(u)) } catch(e){}
    }
    // Scroll to top when tournament detail page loads
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [id, loadData, fetchMatches, fetchStats])

  useEffect(() => {
    // Nếu chưa load xong data hoặc không có tham số nào thì bỏ qua
    if (!data || !id) return
    
    // Tạo key để tránh lặp vô tận (chỉ chạy lại khi id hoặc params thực sự đổi)
    const currentKey = `${id}-${tab}-${edit}`
    if (lastHandledRef.current === currentKey) return

    // 1. Chuyển tab nếu có ?tab=...
    if (tab && ['info', 'teams', 'matches', 'standings', 'stats', 'btc', 'rules'].includes(tab)) {
      setActiveTab(tab as any);
    }

    // 2. Mở modal sửa nếu có ?edit=...
    if (edit && data?.teams) {
      const teamToEdit = data.teams.find((t: any) => t.id === edit);
      if (teamToEdit) {
        const userObj = localStorage.getItem('user');
        if (userObj) {
          try {
            const u = JSON.parse(userObj);
            // CHÚ Ý: Chỉ tự động mở Modal nếu đúng là đội của mình VÀ đang cần bổ sung hồ sơ
            if (teamToEdit.userId === u.username && teamToEdit.status === 'RequireUpdate') {
              setEditTeam(teamToEdit);
              setShowRegister(true);
            }
          } catch(e){}
        }
      }
    }
    
    lastHandledRef.current = currentKey
  }, [id, data, tab, edit])

  const handleRegisterClick = () => {
    if (!currentUser) {
      router.push('/register')
      return
    }
    setShowRegister(true)
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      await axios.patch(`${API}/tournaments/${id}/publish`)
      setPublishMsg('✅ Đã mở đăng ký!')
      loadData()
    } catch (e: any) {
      setPublishMsg(e.response?.data?.message || 'Lỗi')
    } finally { setPublishing(false) }
  }

  const handleCloseRegistration = () => {
    showConfirm({
      title: 'Khóa đăng ký',
      message: 'Bạn có chắc chắn muốn KHÓA ĐĂNG KÝ? Các đội mới sẽ không thể đăng ký nữa.',
      danger: true,
      onConfirm: async () => {
        setConfirmConfig(c => ({...c, open: false}))
        try {
          setLoading(true)
          const token = localStorage.getItem('token')
          await axios.patch(`${API}/tournaments/${id}/close-registration`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          showAlert({ title: 'Thành công', message: 'Đã khóa đăng ký thành công! Hãy tiến hành bốc thăm/xếp lịch thi đấu.', type: 'success' })
          loadData()
        } catch (e: any) {
          showAlert({ title: 'Lỗi', message: e.response?.data?.message || 'Lỗi khóa đăng ký', type: 'error' })
          setLoading(false)
        }
      }
    })
  }

  const handleActivate = () => {
    showConfirm({
      title: 'Khai mạc giải đấu',
      message: 'Bạn có chắc chắn muốn KHAI MẠC GIẢI? Giải đấu sẽ được đổi sang trạng thái Đang diễn ra.',
      onConfirm: async () => {
        setConfirmConfig(c => ({...c, open: false}))
        try {
          setLoading(true)
          const token = localStorage.getItem('token')
          await axios.patch(`${API}/tournaments/${id}/activate`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          showAlert({ title: 'Thành công', message: 'Giải đấu đã chính thức khởi tranh!', type: 'success' })
          loadData()
        } catch (e: any) {
          showAlert({ title: 'Lỗi', message: e.response?.data?.message || 'Lỗi khai mạc', type: 'error' })
          setLoading(false)
        }
      }
    })
  }

  if (loading) return (
    <YStack flex={1} backgroundColor={C.bg as any} justifyContent="center" alignItems="center" minHeight="100vh">
      <Spinner size="large" color={C.primary as any} />
    </YStack>
  )
  if (!data) return (
    <YStack flex={1} backgroundColor={C.bg as any} justifyContent="center" alignItems="center" minHeight="100vh" gap="$3">
      <Text color="#555" fontSize={48}>🏆</Text>
      <Text color="#555" fontSize={16}>Không tìm thấy giải đấu</Text>
      <Link href="/giai-dau"><Text color={C.primary as any} fontSize={14} fontWeight="700">← Quay lại</Text></Link>
    </YStack>
  )

  const statusCfg = STATUS_CFG[data.status] || STATUS_CFG.Pending
  const registeredTeams = data.teams?.length || 0
  const approvedTeams = data.teams?.filter((t: any) => ['Approved', 'Confirmed'].includes(t.status)).length || 0
  const pendingTeams = data.teams?.filter((t: any) => t.status === 'Pending').length || 0
  const progressPct = Math.min(100, Math.round((approvedTeams / data.maxTeams) * 100))
  const canRegister = ['Registration', 'Pending'].includes(data.status)
  const isOrganizer = currentUser?.username === data.organizerId

  const handleDragStart = (e: any, match: any) => {
    e.dataTransfer?.setData('text/plain', match.id)
    setDraggedMatch(match)
  }

  const handleDragOver = (e: any, matchId: string) => {
    e.preventDefault()
    if (dragOverId !== matchId) setDragOverId(matchId)
  }

  const handleDrop = async (e: any, targetMatch: any) => {
    e.preventDefault()
    setDragOverId(null)
    if (!draggedMatch || draggedMatch.id === targetMatch.id) return

    try {
      const m1 = { id: draggedMatch.id, date: draggedMatch.dateString }
      const m2 = { id: targetMatch.id, date: targetMatch.dateString }
      await axios.patch(`${API}/tournaments/${id}/matches/drag-swap`, { m1, m2 }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      fetchMatches()
    } catch (err: any) {
      showAlert({ title: 'Lỗi', message: err.response?.data?.message || 'Có lỗi khi kéo thả', type: 'error' })
    }
    setDraggedMatch(null)
  }

  // --- Group Matches by Date ---
  const groupedMatches: Record<string, any[]> = {}
  matches.forEach(m => {
    if (!groupedMatches[m.dateString]) groupedMatches[m.dateString] = []
    groupedMatches[m.dateString].push(m)
  })
  const sortedDates = Object.keys(groupedMatches).sort()
  const standingsGroups = normalizeStandings(data)
  const tournamentStats = statsData || getTournamentStats(data, matches)

  const TABS = [
    { key: 'info',  label: 'Thông tin' },
    { key: 'teams', label: `Đội (${registeredTeams})` },
    { key: 'matches', label: 'Lịch đấu' },
    ...(isOrganizer ? [{ key: 'btc', label: pendingTeams > 0 ? `BTC 🔴${pendingTeams}` : 'BTC' }] : []),
    { key: 'rules', label: 'Điều lệ' },
  ]

  const USER_TABS = [
    TABS[0],
    TABS[1],
    TABS[2],
    { key: 'standings', label: 'BXH' },
    { key: 'stats', label: 'Thống kê' },
    ...TABS.slice(3),
  ].filter(Boolean)

  return (
    <YStack flex={1} backgroundColor={C.bg as any} minHeight="100vh">
      {/* Font + animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important; }
        @keyframes pulse-red {
          0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; }
        }
        @keyframes blinker {
          0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; }
        }
        .tab-gradient-active {
          background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%) !important;
          box-shadow: 0 2px 12px rgba(34,197,94,0.35);
        }
        .tab-btn {
          transition: background 0.22s ease, color 0.22s ease;
          cursor: pointer;
        }
        .tab-btn:hover:not(.tab-gradient-active) {
          background: rgba(255,255,255,0.06) !important;
        }
        .live-badge-blink {
          animation: pulse-red 1.5s infinite;
        }
      `}</style>
      {/* HERO */}
      <View width="100%" height={isMobile ? 200 : 340} position="relative">
        <Image src={data.banner || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200'}
          width="100%" height="100%" style={{ objectFit: 'cover' } as any} />
        <View position="absolute" left={0} right={0} bottom={0} height={isMobile ? 100 : 180}
          style={{ background: 'linear-gradient(to top, #050807 0%, transparent 100%)' }} />
        <Link href="/giai-dau">
          <XStack position="absolute" top={isMobile ? 14 : 20} left={isMobile ? 14 : 20}
            backgroundColor={"rgba(0,0,0,0.6)" as any}
            paddingHorizontal="$3" paddingVertical="$2" borderRadius={20} alignItems="center" gap="$1.5"
            style={{ cursor: 'pointer', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ChevronLeft size={16} color="white" />
            <Text color="white" fontSize={13} fontWeight="700">Quay lại</Text>
          </XStack>
        </Link>
      </View>

      <YStack maxWidth={1000} width="100%" marginHorizontal="auto"
        paddingHorizontal={isMobile ? '$4' : '$6'}
        marginTop={isMobile ? -36 : -70}
        gap="$4" paddingBottom="$10">

        {/* Publish banner */}
        {data.status === 'Pending' && !publishMsg && (
          <XStack backgroundColor={"rgba(250,140,22,0.08)" as any} borderRadius={14}
            borderWidth={1} borderColor={"rgba(250,140,22,0.25)" as any}
            padding="$4" alignItems="center" justifyContent="space-between" gap="$3">
            <YStack flex={1}>
              <Text color="#fa8c16" fontSize={13} fontWeight="900">Giải đang chờ phê duyệt</Text>
              <Text color="#666" fontSize={12}>Nhấn "Mở đăng ký" để bắt đầu nhận đội ngay</Text>
            </YStack>
            <XStack backgroundColor={C.primary as any} paddingHorizontal="$4" paddingVertical="$2.5"
              borderRadius="$10" onPress={publishing ? undefined : handlePublish}
              style={{ cursor: publishing ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
              {publishing ? <Spinner size="small" color="white" />
                : <Text color="white" fontWeight="900" fontSize={13}>Mở đăng ký ngay</Text>}
            </XStack>
          </XStack>
        )}
        {publishMsg && (
          <XStack backgroundColor={"rgba(40,167,69,0.08)" as any} borderRadius={14}
            borderWidth={1} borderColor={"rgba(40,167,69,0.2)" as any} padding="$3">
            <Text color={C.primary as any} fontSize={13} fontWeight="700">{publishMsg}</Text>
          </XStack>
        )}

        {/* Header card */}
        <YStack backgroundColor={C.card as any} borderRadius={isMobile ? 16 : 20}
          borderWidth={1} borderColor={C.border as any}
          padding={isMobile ? '$4' : '$5'}
          style={{ backdropFilter: 'blur(16px)' }} gap="$3">

          <XStack justifyContent="space-between" alignItems="flex-start" flexWrap={"wrap" as any} gap="$2">
            <YStack flex={1} gap="$1">
              <View backgroundColor={(statusCfg.color + '18') as any}
                paddingHorizontal={10} paddingVertical={4} borderRadius={20}
                alignSelf="flex-start" borderWidth={1} borderColor={(statusCfg.color + '44') as any}>
                <Text color={statusCfg.color as any} fontSize={11} fontWeight="900">{statusCfg.label.toUpperCase()}</Text>
              </View>
              <Text color="white" fontSize={isMobile ? 20 : 28} fontWeight="900" letterSpacing={-0.5}>{data.name}</Text>
              <Text color="#555" fontSize={12}>Tổ chức bởi {data.organizerName || 'Ban tổ chức'}</Text>
            </YStack>
            {canRegister && (
              <Button backgroundColor={C.primary as any} borderRadius="$10"
                size={isMobile ? '$4' : '$5'}
                onPress={handleRegisterClick}
                style={{ boxShadow: '0 4px 16px rgba(40,167,69,0.35)' }}>
                <Text color="white" fontWeight="900" fontSize={13}>ĐĂNG KÝ THAM DỰ</Text>
              </Button>
            )}
          </XStack>

          <XStack gap="$4" flexWrap={"wrap" as any}>
            {[
              { icon: <MapPin size={13} color="#888" />, label: data.region },
              { icon: <Trophy size={13} color="#888" />, label: FORMAT_LABEL[data.format] || data.format },
              { icon: <Users size={13} color="#888" />, label: `${registeredTeams}/${data.maxTeams} đội` },
              { icon: <Clock size={13} color="#888" />, label: data.pitchType },
            ].map((item, i) => (
              <XStack key={item.label ?? i} alignItems="center" gap="$1.5">
                {item.icon}<Text color="#888" fontSize={12}>{item.label}</Text>
              </XStack>
            ))}
          </XStack>

          <YStack gap="$1.5">
            <XStack justifyContent="space-between">
              <Text color="#555" fontSize={11} fontWeight="700">
                {approvedTeams > 0 ? `${approvedTeams} đã duyệt · ${pendingTeams} chờ duyệt` : 'Đội đã đăng ký'}
              </Text>
              <Text color="#555" fontSize={11} fontWeight="700">{progressPct}%</Text>
            </XStack>
            <View height={6} backgroundColor={"rgba(255,255,255,0.05)" as any} borderRadius={3} overflow="hidden">
              <View height="100%" width={`${progressPct}%` as any}
                backgroundColor={(canRegister ? C.primary : '#444') as any} borderRadius={3} />
            </View>
          </YStack>
        </YStack>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 12,
          padding: 3,
          gap: 3,
          overflowX: 'auto',
          flexShrink: 0,
        }}>
          {USER_TABS.map(tab => (
            <div
              key={tab.key}
              className={`tab-btn${activeTab === tab.key ? ' tab-gradient-active' : ''}`}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                minWidth: isMobile ? 60 : 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 10,
                paddingBottom: 10,
                paddingLeft: 4,
                paddingRight: 4,
                borderRadius: 9,
                background: activeTab === tab.key ? undefined : 'transparent',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <span style={{
                color: activeTab === tab.key ? 'black' : '#666',
                fontSize: isMobile ? 10 : 11,
                fontWeight: activeTab === tab.key ? 900 : 600,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                fontFamily: 'Inter, sans-serif',
              }}>
                {tab.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Tab: Thông tin ── */}
        {activeTab === 'info' && (
          <YStack backgroundColor={C.card as any} borderRadius={16}
            borderWidth={1} borderColor={C.border as any} padding="$5" gap="$3"
            style={{ backdropFilter: 'blur(12px)' }}>
            <InfoRow label="Thể thức" value={FORMAT_LABEL[data.format] || data.format} />
            <InfoRow label="Loại sân" value={data.pitchType} />
            <InfoRow label="Số đội tối đa" value={`${data.maxTeams} đội`} />
            <InfoRow label="Khu vực" value={data.region} />
            {data.stadium && <InfoRow label="Sân thi đấu" value={data.stadium} />}
            {data.phone && <InfoRow label="Liên hệ BTC" value={data.phone} />}
            <InfoRow label="Lệ phí" value={data.entryFee > 0 ? `${(data.entryFee / 1e6).toFixed(1)}M VNĐ/đội` : 'Miễn phí'} />
            {data.expectedStartDate && (
              <InfoRow label="Thời gian dự kiến" value={
                `${new Date(data.expectedStartDate).toLocaleDateString('vi-VN')} → ${data.expectedEndDate ? new Date(data.expectedEndDate).toLocaleDateString('vi-VN') : '?'}`
              } />
            )}
            {data.deadline && <InfoRow label="Hạn đăng ký" value={new Date(data.deadline).toLocaleString('vi-VN')} />}
            {data.config?.matchDuration && <InfoRow label="Thời lượng trận" value={`${data.config.matchDuration} phút`} />}
          </YStack>
        )}

        {/* ── Tab: Đội tham gia (public) ── */}
        {activeTab === 'teams' && (
          <YStack gap="$2">
            {(data.teams || []).length === 0 ? (
              <YStack backgroundColor={C.card as any} borderRadius={16}
                borderWidth={1} borderColor={C.border as any}
                padding="$8" alignItems="center" gap="$2">
                <Text color="#333" fontSize={32}>⚽</Text>
                <Text color="#555" fontSize={14} fontWeight="700">Chưa có đội đăng ký</Text>
                {canRegister && (
                  <XStack marginTop="$2" backgroundColor={C.primary as any}
                    paddingHorizontal="$5" paddingVertical="$2.5" borderRadius="$10"
                    onPress={handleRegisterClick} style={{ cursor: 'pointer' }}>
                    <Text color="white" fontWeight="900" fontSize={13}>Đăng ký ngay</Text>
                  </XStack>
                )}
              </YStack>
            ) : (data.teams || []).map((team: any, i: number) => {
              const st = TEAM_STATUS[team.status] || TEAM_STATUS.Pending
              return (
                <XStack key={team.id ?? team.teamName ?? i} backgroundColor={C.card as any} borderRadius={14}
                  borderWidth={1} borderColor={C.border as any} padding="$3.5" alignItems="center" gap="$3">
                  {team.logo ? (
                    <img src={team.logo} alt={team.teamName || 'team logo'} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} />
                  ) : team.players?.[0]?.photo ? (
                    <img src={team.players[0].photo} alt={team.teamName || 'team photo'} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} />
                  ) : (
                    <View width={42} height={42} borderRadius={21}
                      backgroundColor={(team.jerseyColor || 'rgba(40,167,69,0.15)') as any}
                      alignItems="center" justifyContent="center"
                      borderWidth={1} borderColor={"rgba(255,255,255,0.1)" as any}>
                      <Text color="white" fontSize={15} fontWeight="900">{i + 1}</Text>
                    </View>
                  )}
                  <YStack flex={1} gap="$1">
                    <XStack alignItems="center" gap="$1.5">
                      <Text color="white" fontSize={14} fontWeight="900">{team.teamName}</Text>
                      {team.userId === currentUser?.username && (
                        <View backgroundColor="rgba(40,167,69,0.1)" paddingHorizontal={6} paddingVertical={2} borderRadius={6}>
                          <Text color={C.primary as any} fontSize={9} fontWeight="900">ĐỘI CỦA BẠN</Text>
                        </View>
                      )}
                    </XStack>
                    {team.managerName && <Text color="#555" fontSize={11}>Trưởng đoàn: {team.managerName}{team.managerPhone ? ` · ${team.managerPhone}` : ''}</Text>}
                    
                    {/* Hiển thị ghi chú của BTC nếu là đội của mình và cần bổ sung */}
                    {team.userId === currentUser?.username && team.status === 'RequireUpdate' && team.btcNote && (
                      <YStack backgroundColor="rgba(250,140,22,0.1)" padding="$2" borderRadius={8} marginTop="$2" borderWidth={1} borderColor="rgba(250,140,22,0.2)">
                        <Text color="#fa8c16" fontSize={11} fontWeight="800">GHI CHÚ BTC:</Text>
                        <Text color="#eee" fontSize={12}>{team.btcNote}</Text>
                      </YStack>
                    )}
                  </YStack>

                  <YStack alignItems="flex-end" gap="$2">
                    <View backgroundColor={st.bg as any} paddingHorizontal={8} paddingVertical={3}
                      borderRadius={10} borderWidth={1} borderColor={(st.color + '55') as any}>
                      <Text color={st.color as any} fontSize={10} fontWeight="900">{st.label}</Text>
                    </View>
                    
                    {/* Nút cập nhật hồ sơ */}
                    {team.userId === currentUser?.username && team.status === 'RequireUpdate' && (
                      <Button size="$2" backgroundColor={C.primary as any} onPress={(e: any) => { e.stopPropagation(); setEditTeam(team); setShowRegister(true); }}>
                        <Text color="white" fontSize={10} fontWeight="900">CẬP NHẬT HỒ SƠ</Text>
                      </Button>
                    )}
                  </YStack>
                </XStack>
              )
            })}
          </YStack>
        )}

        {/* ── Tab: Lịch thi đấu ── */}
        {activeTab === 'matches' && (
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <YStack gap="$0.5">
                <Text color="white" fontSize={16} fontWeight="900">Trận đang phát trực tiếp</Text>
                <Text color="#555" fontSize={11}>Lịch thi đấu toàn giải</Text>
              </YStack>
              {isOrganizer && (
                <Button size="$3" backgroundColor={"rgba(40,167,69,0.15)" as any}
                  borderColor={"rgba(40,167,69,0.3)" as any} borderWidth={1}
                  onPress={() => { setEditMatch(null); setShowAddMatch(true); }}>
                  <Text color={C.primary as any} fontSize={12} fontWeight="900">+ Thêm trận thủ công</Text>
                </Button>
              )}
            </XStack>
            
            {isOrganizer && matches.length > 0 && (
              <XStack backgroundColor={"rgba(255,215,0,0.1)" as any} padding="$3" borderRadius={10} 
                borderWidth={1} borderColor={"rgba(255,215,0,0.2)" as any} alignItems="center" gap="$2">
                <Text color="#ffd700" fontSize={13}>💡 Mẹo BTC: Kéo thẻ trận đấu chồng lên nhau để hoán đổi Giờ/Sân</Text>
              </XStack>
            )}

            {matches.length === 0 ? (
              <YStack backgroundColor={C.card as any} borderRadius={16}
                borderWidth={1} borderColor={C.border as any}
                padding="$8" alignItems="center" gap="$2">
                <Text color="#333" fontSize={32}>📅</Text>
                <Text color="#555" fontSize={14} fontWeight="700">Chưa có lịch thi đấu</Text>
              </YStack>
            ) : sortedDates.map(date => {
              const dayMatches = [...groupedMatches[date]].sort((a, b) => (a.timeString || '').localeCompare(b.timeString || ''));
              return (
              <YStack key={date} gap="$3" marginBottom="$4">
                <Text color="#eee" fontSize={14} fontWeight="900" 
                  paddingBottom="$2" borderBottomWidth={1} borderColor={"rgba(255,255,255,0.15)" as any}>
                  📅 {date === 'Chưa xếp lịch' ? 'Chưa bị xếp lịch' : parseDateString(date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}
                </Text>
                <YStack mt="$2" backgroundColor="#141414" borderRadius={12} overflow="hidden">
                  {dayMatches.map((m: any, idx: number) => {
                    const isDragOver = dragOverId === m.id
                    const isLast = idx === dayMatches.length - 1
                    
                    return (
                      <TournamentMatchRow 
                        key={m.id}
                        m={m}
                        isLast={isLast}
                        isOrganizer={isOrganizer}
                        isMobile={isMobile}
                        isDragOver={isDragOver}
                        onEdit={() => { setEditMatch(m); setShowAddMatch(true); }}
                        onDragStart={(e: any) => handleDragStart(e, m)}
                        onDragOver={(e: any) => handleDragOver(e, m.id)}
                        onDragLeave={() => setDragOverId(null)}
                        onDrop={(e: any) => handleDrop(e, m)}
                      />
                    )
                  })}
                </YStack>
              </YStack>
            )})}
          </YStack>
        )}

        {/* ── Tab: BTC Quản lý ── */}
        {activeTab === 'standings' && (
          <TournamentStandingsPanel groups={standingsGroups} compact={isMobile} />
        )}

        {activeTab === 'stats' && (
          <TournamentStatsPanel stats={tournamentStats} />
        )}

        {activeTab === 'btc' && (
          <YStack gap="$3">
            {/* Summary bar */}
            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <Text color="white" fontSize={14} fontWeight="900">Quản lý hồ sơ đăng ký</Text>
                <Text color="#555" fontSize={12}>
                  {`${registeredTeams} hồ sơ · ${approvedTeams} đã duyệt · ${pendingTeams} chờ duyệt`}
                </Text>
              </YStack>
              <XStack padding="$2" onPress={loadData} style={{ cursor: 'pointer' }}>
                <RefreshCcw size={16} color="#555" />
              </XStack>
            </XStack>

            {/* Action Bar based on Status */}
            {data.status === 'Registration' && (
              <XStack backgroundColor={"rgba(250,140,22,0.1)" as any} padding="$4" borderRadius={12} borderWidth={1} borderColor={"rgba(250,140,22,0.3)" as any} alignItems="center" justifyContent="space-between" gap="$3">
                <YStack flex={1}>
                  <Text color="#fa8c16" fontSize={14} fontWeight="900">Đang trong thời gian nhận đăng ký</Text>
                  <Text color="#555" fontSize={12}>Khi giải đã đủ đội, hãy bấm "Khóa đăng ký" để tiến hành xếp lịch thi đấu.</Text>
                </YStack>
                <Button backgroundColor="#fa8c16" onPress={handleCloseRegistration} borderRadius={10}>
                  <Text color="white" fontWeight="900" fontSize={13}>Khóa đăng ký</Text>
                </Button>
              </XStack>
            )}

            {data.status === 'Opening' && (
              <YStack gap="$3" backgroundColor={"rgba(23,162,184,0.1)" as any} padding="$4" borderRadius={12} borderWidth={1} borderColor={"rgba(23,162,184,0.3)" as any}>
                <YStack>
                  <Text color="#17a2b8" fontSize={14} fontWeight="900">Chuẩn bị trước Giải đấu</Text>
                  <Text color="#555" fontSize={12}>Bây giờ bạn có thể xếp lịch vòng tròn tự động. Khi lịch thi đấu đã sẵn sàng, hãy bấm "Khai mạc giải".</Text>
                </YStack>
                <XStack gap="$3" flexWrap={"wrap" as any}>
                  <Button flex={1} backgroundColor={C.primary as any} onPress={() => setShowScheduler(true)} borderRadius={10}>
                    <Text color="white" fontWeight="900" fontSize={13}>Xếp lịch tự động</Text>
                  </Button>
                  <Button flex={1} backgroundColor="#17a2b8" onPress={handleActivate} borderRadius={10}>
                    <Text color="white" fontWeight="900" fontSize={13}>Khai mạc giải đấu</Text>
                  </Button>
                </XStack>
              </YStack>
            )}

            {/* Status chips */}
            <XStack gap="$2" flexWrap={"wrap" as any}>
              {Object.entries(TEAM_STATUS).map(([k, v]) => {
                const count = (data.teams || []).filter((t: any) => t.status === k).length
                if (count === 0) return null
                return (
                  <XStack key={k}
                    backgroundColor={v.bg as any} borderRadius={20}
                    paddingHorizontal="$3" paddingVertical="$1.5"
                    borderWidth={1} borderColor={(v.color + '33') as any}
                    alignItems="center" gap="$1.5">
                    <Text color={v.color as any} fontSize={16} fontWeight="900">{count}</Text>
                    <Text color={v.color as any} fontSize={11} fontWeight="700">
                      {v.label.replace(/[✓✗⚠×] ?/, '')}
                    </Text>
                  </XStack>
                )
              })}
            </XStack>

            {(data.teams || []).length === 0 ? (
              <YStack backgroundColor={C.card as any} borderRadius={16}
                borderWidth={1} borderColor={C.border as any} padding="$8" alignItems="center" gap="$2">
                <Text color="#333" fontSize={32}>📋</Text>
                <Text color="#555" fontSize={14} fontWeight="700">Chưa có hồ sơ đăng ký</Text>
              </YStack>
            ) : (
              <YStack gap="$2">
                {/* Pending first */}
                {(data.teams || [])
                  .sort((a: any, b: any) => (a.status === 'Pending' ? -1 : 1))
                  .map((team: any) => (
                    <TeamCard key={team.id} team={team}
                      onViewDetail={() => setSelectedTeam(team)}
                      onDelete={() => handleDeleteTeam(team.id, team.teamName)} />
                  ))}
              </YStack>
            )}
          </YStack>
        )}

        {/* ── Tab: Điều lệ ── */}
        {activeTab === 'rules' && (
          <YStack backgroundColor={C.card as any} borderRadius={16}
            borderWidth={1} borderColor={C.border as any}
            padding="$6" alignItems="center" gap="$3"
            style={{ backdropFilter: 'blur(12px)' }}>
            {data.regulationsUrl ? (
              <>
                <Text fontSize={36}>📄</Text>
                <Text color="white" fontSize={15} fontWeight="900">Điều lệ giải đấu</Text>
                <a href={data.regulationsUrl} target="_blank" rel="noreferrer">
                  <XStack backgroundColor={C.primary as any} paddingHorizontal="$6" paddingVertical="$3"
                    borderRadius="$10" style={{ cursor: 'pointer' }}>
                    <Text color="white" fontWeight="900" fontSize={14}>Tải xuống PDF</Text>
                  </XStack>
                </a>
              </>
            ) : (
              <YStack alignItems="center" gap="$2">
                <Text color="#333" fontSize={32}>📋</Text>
                <Text color="#555" fontSize={14} fontWeight="700">Chưa có điều lệ</Text>
              </YStack>
            )}
          </YStack>
        )}
      </YStack>

      {/* Register Modal */}
      {showRegister && (
        <RegisterTeamModal 
          tournament={data} 
          initialData={editTeam}
          onClose={() => { setShowRegister(false); setEditTeam(null); }}
          onSuccess={() => { setShowRegister(false); setEditTeam(null); setActiveTab('teams'); loadData() }} 
        />
      )}

      {/* Auto Scheduler Modal */}
      {showScheduler && (
        <AutoSchedulerModal tournamentId={id} onClose={() => setShowScheduler(false)}
          onSuccess={() => { setShowScheduler(false); loadData(); fetchMatches(); setActiveTab('matches') }} />
      )}

      {/* Add Match Modal */}
      {showAddMatch && (
        <AddMatchModal tournamentId={id} teams={data.teams || []} editMatch={editMatch}
          onClose={() => { setShowAddMatch(false); setEditMatch(null); }}
          onSuccess={() => { setShowAddMatch(false); setEditMatch(null); fetchMatches(); fetchStats(); loadData() }} />
      )}

      {/* Team Detail Panel */}
      {selectedTeam && (
        <TeamDetailPanel
          team={selectedTeam}
          tournamentId={id}
          onClose={() => setSelectedTeam(null)}
          onUpdated={() => { loadData(); setSelectedTeam(null) }}
          onConfirm={showConfirm}
          onAlert={showAlert}
        />
      )}

      {/* App Dialogs overlay */}
      <AppConfirmDialog {...confirmConfig} onCancel={() => setConfirmConfig((c: any) => ({...c, open: false}))} />
      <AppAlertDialog {...alertConfig} onClose={() => setAlertConfig((c: any) => ({...c, open: false}))} />
    </YStack>
  )
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <XStack justifyContent="space-between" alignItems="flex-start" paddingVertical="$1.5"
    borderBottomWidth={1} borderColor={"rgba(255,255,255,0.05)" as any} gap="$3">
    <Text color="#555" fontSize={13} fontWeight="700" flexShrink={0}>{label}</Text>
    <Text color="white" fontSize={13} fontWeight="700" textAlign={"right" as any} flex={1}>{value}</Text>
  </XStack>
)

const TournamentStandingsPanel = ({ groups, compact }: { groups: any[]; compact: boolean }) => (
  <YStack gap="$4">
    {groups.length === 0 ? (
      <YStack backgroundColor={C.card as any} borderRadius={16}
        borderWidth={1} borderColor={C.border as any}
        padding="$8" alignItems="center" gap="$2">
        <Text color="#333" fontSize={32}>BXH</Text>
        <Text color="#555" fontSize={14} fontWeight="700">Chưa có bảng xếp hạng</Text>
      </YStack>
    ) : groups.map((group: any, groupIndex: number) => (
      <YStack key={group.name ?? groupIndex} backgroundColor={C.card as any} borderRadius={16}
        borderWidth={1} borderColor={C.border as any} overflow="hidden">
        {group.name && (
          <XStack backgroundColor={"rgba(40,167,69,0.08)" as any}
            paddingHorizontal="$4" paddingVertical="$2.5"
            borderBottomWidth={1} borderColor={"rgba(255,255,255,0.08)" as any}>
            <Text color={C.primary as any} fontSize={13} fontWeight="900">
              {String(group.name).toUpperCase()}
            </Text>
          </XStack>
        )}
        <XStack paddingHorizontal={compact ? '$3' : '$5'} paddingVertical="$2"
          backgroundColor="#0f1410" borderBottomWidth={1} borderColor="#111" alignItems="center">
          <Text width={compact ? 32 : 44} color="#777" fontSize={10} fontWeight="800">#</Text>
          <Text flex={1} color="#777" fontSize={10} fontWeight="800">Đội bóng</Text>
          <Text width={compact ? 28 : 36} color="#777" fontSize={10} fontWeight="800" textAlign="center">ST</Text>
          {!compact && <Text width={36} color="#777" fontSize={10} fontWeight="800" textAlign="center">T</Text>}
          {!compact && <Text width={36} color="#777" fontSize={10} fontWeight="800" textAlign="center">H</Text>}
          {!compact && <Text width={36} color="#777" fontSize={10} fontWeight="800" textAlign="center">B</Text>}
          <Text width={compact ? 34 : 44} color="#777" fontSize={10} fontWeight="800" textAlign="center">HS</Text>
          <Text width={compact ? 34 : 44} color={C.primary as any} fontSize={10} fontWeight="900" textAlign="center">D</Text>
        </XStack>
        {(group.rows || []).map((item: any, index: number) => (
          <StandingRow
            key={item.id ?? item.teamId ?? item.teamName ?? index}
            item={item}
            isLast={index === (group.rows || []).length - 1}
            compact={compact}
          />
        ))}
      </YStack>
    ))}
  </YStack>
)

const StatList = ({ title, rows, valueKey, valueLabel, renderValue }: any) => (
  <YStack backgroundColor={C.card as any} borderRadius={16}
    borderWidth={1} borderColor={C.border as any} overflow="hidden">
    <XStack paddingHorizontal="$4" paddingVertical="$3" backgroundColor={"rgba(255,255,255,0.04)" as any}
      borderBottomWidth={1} borderColor={"rgba(255,255,255,0.08)" as any}>
      <Text color="white" fontSize={14} fontWeight="900">{title}</Text>
    </XStack>
    {rows.length === 0 ? (
      <YStack padding="$5" alignItems="center">
        <Text color="#555" fontSize={13} fontWeight="700">Chưa có dữ liệu</Text>
      </YStack>
    ) : rows.map((row: any, index: number) => (
      <XStack key={`${title}-${row.playerName ?? index}`} paddingHorizontal="$4" paddingVertical="$3"
        alignItems="center" gap="$3"
        borderBottomWidth={index === rows.length - 1 ? 0 : 1}
        borderColor={"rgba(255,255,255,0.05)" as any}>
        <Text width={28} color={index < 3 ? C.primary as any : '#777'} fontSize={13} fontWeight="900">
          {index + 1}
        </Text>
        {row.teamLogo ? (
          <Image src={row.teamLogo} width={30} height={30} borderRadius={15} style={{ objectFit: 'cover' } as any} />
        ) : (
          <View width={30} height={30} borderRadius={15} backgroundColor={"rgba(40,167,69,0.12)" as any}
            alignItems="center" justifyContent="center">
            <Text color={C.primary as any} fontSize={11} fontWeight="900">{(row.teamName || '?').slice(0, 1)}</Text>
          </View>
        )}
        <YStack flex={1}>
          <Text color="white" fontSize={13} fontWeight="900" numberOfLines={1}>{row.playerName}</Text>
          <Text color="#666" fontSize={11} numberOfLines={1}>{row.teamName}</Text>
        </YStack>
        <YStack alignItems="flex-end">
          <Text color={C.primary as any} fontSize={16} fontWeight="900">
            {renderValue ? renderValue(row) : row[valueKey]}
          </Text>
          <Text color="#666" fontSize={10} fontWeight="800">{valueLabel}</Text>
        </YStack>
      </XStack>
    ))}
  </YStack>
)

const StatSummaryCard = ({ label, value, sub }: { label: string; value: string | number; sub: string }) => (
  <YStack flex={1} minWidth={120} backgroundColor={"rgba(255,255,255,0.04)" as any}
    borderWidth={1} borderColor={"rgba(255,255,255,0.08)" as any}
    borderRadius={14} padding="$3" gap="$1">
    <Text color="#777" fontSize={11} fontWeight="800">{label}</Text>
    <Text color="white" fontSize={22} fontWeight="900">{value}</Text>
    <Text color="#666" fontSize={10} fontWeight="700" numberOfLines={1}>{sub}</Text>
  </YStack>
)

const TeamStatsList = ({ title, rows, valueKey, valueLabel, renderValue }: any) => (
  <YStack backgroundColor={C.card as any} borderRadius={16}
    borderWidth={1} borderColor={C.border as any} overflow="hidden">
    <XStack paddingHorizontal="$4" paddingVertical="$3" backgroundColor={"rgba(255,255,255,0.04)" as any}
      borderBottomWidth={1} borderColor={"rgba(255,255,255,0.08)" as any}>
      <Text color="white" fontSize={14} fontWeight="900">{title}</Text>
    </XStack>
    {rows.length === 0 ? (
      <YStack padding="$5" alignItems="center">
        <Text color="#555" fontSize={13} fontWeight="700">Chưa có dữ liệu</Text>
      </YStack>
    ) : rows.map((row: any, index: number) => (
      <XStack key={`${title}-${row.teamId ?? row.teamName ?? index}`} paddingHorizontal="$4" paddingVertical="$3"
        alignItems="center" gap="$3"
        borderBottomWidth={index === rows.length - 1 ? 0 : 1}
        borderColor={"rgba(255,255,255,0.05)" as any}>
        <Text width={28} color={index < 3 ? C.primary as any : '#777'} fontSize={13} fontWeight="900">
          {index + 1}
        </Text>
        {row.teamLogo ? (
          <Image src={row.teamLogo} width={30} height={30} borderRadius={15} style={{ objectFit: 'cover' } as any} />
        ) : (
          <View width={30} height={30} borderRadius={15} backgroundColor={"rgba(40,167,69,0.12)" as any}
            alignItems="center" justifyContent="center">
            <Text color={C.primary as any} fontSize={11} fontWeight="900">{(row.teamName || '?').slice(0, 1)}</Text>
          </View>
        )}
        <YStack flex={1}>
          <Text color="white" fontSize={13} fontWeight="900" numberOfLines={1}>{row.teamName}</Text>
          <Text color="#666" fontSize={11} numberOfLines={1}>
            {`${row.played || 0} trận · HS ${row.goalDifference || 0}`}
          </Text>
        </YStack>
        <YStack alignItems="flex-end">
          <Text color={C.primary as any} fontSize={16} fontWeight="900">
            {renderValue ? renderValue(row) : row[valueKey]}
          </Text>
          <Text color="#666" fontSize={10} fontWeight="800">{valueLabel}</Text>
        </YStack>
      </XStack>
    ))}
  </YStack>
)

const MatchHighlightList = ({ rows }: { rows: any[] }) => (
  <YStack backgroundColor={C.card as any} borderRadius={16}
    borderWidth={1} borderColor={C.border as any} overflow="hidden">
    <XStack paddingHorizontal="$4" paddingVertical="$3" backgroundColor={"rgba(255,255,255,0.04)" as any}
      borderBottomWidth={1} borderColor={"rgba(255,255,255,0.08)" as any}>
      <Text color="white" fontSize={14} fontWeight="900">Trận đấu nổi bật</Text>
    </XStack>
    {rows.length === 0 ? (
      <YStack padding="$5" alignItems="center">
        <Text color="#555" fontSize={13} fontWeight="700">Chưa có dữ liệu</Text>
      </YStack>
    ) : rows.map((item: any, index: number) => (
      <XStack key={`${item.label}-${item.match?.id ?? index}`} paddingHorizontal="$4" paddingVertical="$3"
        alignItems="center" gap="$3"
        borderBottomWidth={index === rows.length - 1 ? 0 : 1}
        borderColor={"rgba(255,255,255,0.05)" as any}>
        <YStack flex={1} gap="$0.5">
          <Text color={C.primary as any} fontSize={11} fontWeight="900">{item.label}</Text>
          <Text color="white" fontSize={13} fontWeight="900" numberOfLines={1}>
            {item.match?.homeTeam?.name || 'TBA'} - {item.match?.awayTeam?.name || 'TBA'}
          </Text>
          <Text color="#666" fontSize={11}>{item.match?.dateString || ''} {item.match?.timeString || ''}</Text>
        </YStack>
        <Text color="white" fontSize={18} fontWeight="900">
          {item.match ? `${item.match.homeScore} - ${item.match.awayScore}` : '-'}
        </Text>
      </XStack>
    ))}
  </YStack>
)

const TournamentStatsPanel = ({ stats }: { stats: any }) => {
  const [statTab, setStatTab] = useState<'overview' | 'teams' | 'players' | 'discipline' | 'matches'>('overview')
  const summary = stats.summary || {}
  const topScorers = stats.topScorers || []
  const cards = stats.cards || []
  const teamStats = stats.teamStats || []
  const highlights = stats.highlights || {}
  const leader = topScorers[0]
  const bestAttack = [...teamStats].sort((a: any, b: any) => (b.goalsFor || 0) - (a.goalsFor || 0))[0]
  const bestDefense = [...teamStats].filter((t: any) => (t.played || 0) > 0).sort((a: any, b: any) => (a.goalsAgainst || 0) - (b.goalsAgainst || 0))[0]
  const fairPlay = [...teamStats].sort((a: any, b: any) => (a.fairPlayPoints || 0) - (b.fairPlayPoints || 0))
  const matchHighlights = [
    { label: 'Nhiều bàn nhất', match: highlights.highestScoring },
    { label: 'Thắng đậm nhất', match: highlights.biggestWin },
    { label: 'Nhiều thẻ nhất', match: highlights.mostCards },
    { label: 'Trận đã đá gần nhất', match: highlights.latestFinished },
  ].filter((item) => item.match)

  return (
    <YStack gap="$4">
      <XStack gap="$3" flexWrap={"wrap" as any}>
        <StatSummaryCard label="Trận đã đá" value={summary.finishedMatches ?? summary.playedMatches ?? 0} sub={`${summary.totalMatches || 0} trận toàn giải`} />
        <StatSummaryCard label="Bàn thắng" value={summary.totalGoals ?? 0} sub={`${summary.goalsPerMatch || 0} bàn/trận`} />
        <StatSummaryCard label="Vua phá lưới" value={leader?.goals ?? 0} sub={leader ? `${leader.playerName} - ${leader.teamName}` : 'Chưa có cầu thủ'} />
        <StatSummaryCard label="Thẻ phạt" value={`${summary.totalYellowCards || 0}/${summary.totalRedCards || 0}`} sub="Vàng / Đỏ" />
      </XStack>

      <XStack backgroundColor={"rgba(255,255,255,0.03)" as any} borderRadius={12}
        padding={3} gap={3} borderWidth={1} borderColor={"rgba(255,255,255,0.06)" as any}
        flexWrap={"wrap" as any}>
        {[
          { key: 'overview', label: 'Tổng quan' },
          { key: 'teams', label: 'Đội bóng' },
          { key: 'players', label: 'Cầu thủ' },
          { key: 'discipline', label: 'Kỷ luật' },
          { key: 'matches', label: 'Trận đấu' },
        ].map((tab) => {
          const active = statTab === tab.key
          return (
            <XStack key={tab.key} flex={1} minWidth={92} justifyContent="center" paddingVertical="$2.5"
              borderRadius={9} backgroundColor={(active ? C.primary : 'transparent') as any}
              onPress={() => setStatTab(tab.key as any)}
              style={{ cursor: 'pointer' }}>
              <Text color={active ? 'black' : '#777'} fontSize={12} fontWeight={active ? '900' : '700'}>
                {tab.label}
              </Text>
            </XStack>
          )
        })}
      </XStack>

      {statTab === 'overview' && (
        <YStack gap="$3">
          <XStack gap="$3" flexWrap={"wrap" as any}>
            <StatSummaryCard label="Đang live" value={summary.liveMatches || 0} sub="Trận đang diễn ra" />
            <StatSummaryCard label="Sắp đá" value={summary.scheduledMatches || 0} sub="Trận còn lại" />
            <StatSummaryCard label="Thẻ/trận" value={summary.cardsPerMatch || 0} sub="Theo dữ liệu sự kiện" />
          </XStack>
          <MatchHighlightList rows={matchHighlights.slice(0, 2)} />
        </YStack>
      )}

      {statTab === 'teams' && (
        <YStack gap="$3">
          <XStack gap="$3" flexWrap={"wrap" as any}>
            <StatSummaryCard label="Hàng công" value={bestAttack?.goalsFor ?? 0} sub={bestAttack?.teamName || 'Chưa có đội'} />
            <StatSummaryCard label="Hàng thủ" value={bestDefense?.goalsAgainst ?? 0} sub={bestDefense?.teamName || 'Chưa có đội'} />
            <StatSummaryCard label="Sạch lưới" value={[...teamStats].sort((a: any, b: any) => (b.cleanSheets || 0) - (a.cleanSheets || 0))[0]?.cleanSheets ?? 0} sub="Dẫn đầu giải" />
          </XStack>
          <TeamStatsList title="Đội ghi bàn nhiều nhất" rows={[...teamStats].sort((a: any, b: any) => (b.goalsFor || 0) - (a.goalsFor || 0)).slice(0, 10)} valueKey="goalsFor" valueLabel="Bàn" />
        </YStack>
      )}

      {statTab === 'players' && (
        <StatList title="Vua phá lưới" rows={topScorers} valueKey="goals" valueLabel="Bàn" />
      )}

      {statTab === 'discipline' && (
        <YStack gap="$3">
          <StatList
            title="Cầu thủ nhận thẻ"
            rows={cards}
            valueLabel="V / Đ"
            renderValue={(row: any) => `${row.yellowCards || 0} / ${row.redCards || 0}`}
          />
          <TeamStatsList title="Bảng fair-play" rows={fairPlay.slice(0, 10)} valueKey="fairPlayPoints" valueLabel="Điểm" />
        </YStack>
      )}

      {statTab === 'matches' && (
        <MatchHighlightList rows={matchHighlights} />
      )}
    </YStack>
  )
}

const TournamentMatchRowDesktop = ({ m, isLast, isOrganizer, isDragOver, onEdit, onDragStart, onDragOver, onDragLeave, onDrop }: any) => {
  const isLive = m.status === 'Ongoing'
  const isFinished = m.status === 'Finished'
  const timeLabel = isLive 
    ? (m.currentMinute ? `${m.currentMinute}'` : "🔴 LIVE") 
    : isFinished 
      ? "FT" 
      : m.timeString || "Chưa đấu"

  const homeName = m.homeTeam?.name || 'TBA'
  const awayName = m.awayTeam?.name || 'TBA'
  const homeLogo = m.homeTeam?.logo || m.homeTeam?.photo || 'https://phuiscore.com/default-logo.png' 
  const awayLogo = m.awayTeam?.logo || m.awayTeam?.photo || 'https://phuiscore.com/default-logo.png'

  const scoreText = (isFinished || isLive) ? `${m.homeScore} - ${m.awayScore}` : 'VS'

  const blinkStyles = `
    @keyframes blinker {
      0% { opacity: 1; }
      50% { opacity: 0.3; }
      100% { opacity: 1; }
    }
  `;

  return (
    <View
      style={{ cursor: isOrganizer ? 'grab' : 'pointer' } as any}
      onPress={isOrganizer ? onEdit : undefined}
      {...(isOrganizer ? {
        draggable: true,
        onDragStart, onDragOver, onDragLeave, onDrop
      } : {})}
    >
      <style>{blinkStyles}</style>
      <XStack
        alignItems="center"
        paddingVertical="$3"
        paddingHorizontal="$4"
        backgroundColor={(isDragOver ? "#1f5133" : "transparent") as any}
        borderBottomWidth={isLast ? 0 : 1}
        borderColor={(isDragOver ? "#2ecc71" : "#1a1a1a") as any}
        hoverStyle={{ backgroundColor: "#1c1c1c" } as any}
        width="100%"
        style={{ transition: 'all 0.2s ease' } as any}
      >
        <YStack width={80} alignItems="center" gap="$1">
          <Text
            fontSize={13}
            fontWeight="800"
            color={isLive ? "#f5a623" : "#888"}
            style={isLive ? { animation: 'blinker 1s linear infinite' } : {}}
          >
            {timeLabel}
          </Text>
          <Text color="#666" fontSize={10} textAlign="center" numberOfLines={2}>
            {m.pitchNumber || m.stadium}
          </Text>
        </YStack>

        <XStack flex={1} flexDirection="row" alignItems="center" justifyContent="center" gap="$6">
          <XStack flex={1} justifyContent="flex-end" alignItems="center" gap="$3" maxWidth={300}>
            <Text fontSize={15} fontWeight="700" numberOfLines={1} textAlign="right" color="white">
              {homeName}
            </Text>
            {m.homeTeam?.logo ? (
              <Image src={m.homeTeam.logo} width={32} height={32} style={{ objectFit: 'contain' } as any} />
            ) : (
              <View width={32} height={32} borderRadius={16} backgroundColor="rgba(255,255,255,0.1)" alignItems="center" justifyContent="center">
                <Text color="white" fontSize={12}>⚽</Text>
              </View>
            )}
          </XStack>

          <View width={140} alignItems="center">
            <YStack
              backgroundColor={isLive ? "#f5a623" : "#1f1f1f"}
              paddingHorizontal="$5"
              paddingVertical="$2"
              borderRadius={10}
              minWidth={90}
              alignItems="center"
              justifyContent="center"
              gap="$1"
            >
              <Text fontSize={16} fontWeight="900" color={isLive ? "#000" : "#fff"}>
                {scoreText}
              </Text>
              {m.round && (
                <Text fontSize={9} fontWeight="700" color={isLive ? "rgba(0,0,0,0.6)" : "#888"}>
                  {m.round.toUpperCase()}
                </Text>
              )}
            </YStack>
          </View>

          <XStack flex={1} justifyContent="flex-start" alignItems="center" gap="$3" maxWidth={300}>
            {m.awayTeam?.logo ? (
              <Image src={m.awayTeam.logo} width={32} height={32} style={{ objectFit: 'contain' } as any} />
            ) : (
              <View width={32} height={32} borderRadius={16} backgroundColor="rgba(255,255,255,0.1)" alignItems="center" justifyContent="center">
                <Text color="white" fontSize={12}>⚽</Text>
              </View>
            )}
            <Text fontSize={15} fontWeight="700" numberOfLines={1} textAlign="left" color="white">
              {awayName}
            </Text>
          </XStack>
        </XStack>
      </XStack>
    </View>
  )
}

const TournamentMatchRowMobile = ({ m, isLast, isOrganizer, isDragOver, onEdit, onDragStart, onDragOver, onDragLeave, onDrop }: any) => {
  const isLive = m.status === 'Ongoing'
  const isFinished = m.status === 'Finished'
  const timeLabel = isLive 
    ? (m.currentMinute ? `${m.currentMinute}'` : "🔴 LIVE") 
    : isFinished 
      ? "FT" 
      : m.timeString || "Chưa đấu"

  const blinkStyles = `
    @keyframes blinker {
      50% { opacity: 0; }
    }
  `;

  return (
    <View
      style={{ cursor: isOrganizer ? 'grab' : 'pointer', width: '100%' } as any}
      onPress={isOrganizer ? onEdit : undefined}
      {...(isOrganizer ? {
        draggable: true,
        onDragStart, onDragOver, onDragLeave, onDrop
      } : {})}
    >
      <style>{blinkStyles}</style>
      <YStack
        backgroundColor={(isDragOver ? "#1f5133" : "#0f0f0f") as any}
        borderRadius={14}
        paddingVertical="$3"
        paddingHorizontal="$3"
        marginBottom={isLast ? 0 : "$3"}
        borderWidth={1}
        borderColor={(isDragOver ? "#2ecc71" : "#1e1e1e") as any}
        width="100%"
      >
        <XStack alignItems="center" gap="$3">
          <YStack width={45} alignItems="center" gap="$1">
            <Text
              fontWeight="800"
              fontSize={12}
              color={isLive ? "#f5a623" : "#888"}
              style={isLive ? { animation: 'blinker 1s linear infinite' } : {}}
              textAlign="center"
            >
              {timeLabel}
            </Text>
            <Text color="#555" fontSize={9} textAlign="center" numberOfLines={2}>
              {m.pitchNumber || m.stadium}
            </Text>
          </YStack>

          <YStack flex={1} gap="$2">
            <XStack alignItems="center" gap="$3">
              {m.homeTeam?.logo ? (
                <Image src={m.homeTeam.logo} width={24} height={24} style={{ objectFit: 'contain' } as any} />
              ) : (
                <View width={24} height={24} borderRadius={12} backgroundColor="rgba(255,255,255,0.1)" alignItems="center" justifyContent="center">
                  <Text color="white" fontSize={10}>⚽</Text>
                </View>
              )}
              <Text color="#eaeaea" fontSize={14} fontWeight="700" numberOfLines={0} flex={1} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' } as any}>
                {m.homeTeam?.name || 'TBA'}
              </Text>
            </XStack>

            <XStack alignItems="center" gap="$3">
              {m.awayTeam?.logo ? (
                <Image src={m.awayTeam.logo} width={24} height={24} style={{ objectFit: 'contain' } as any} />
              ) : (
                <View width={24} height={24} borderRadius={12} backgroundColor="rgba(255,255,255,0.1)" alignItems="center" justifyContent="center">
                  <Text color="white" fontSize={10}>⚽</Text>
                </View>
              )}
              <Text color="#cfcfcf" fontSize={14} fontWeight="700" numberOfLines={0} flex={1} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' } as any}>
                {m.awayTeam?.name || 'TBA'}
              </Text>
            </XStack>
          </YStack>

          <YStack
            backgroundColor="#111"
            borderRadius={10}
            minWidth={44}
            paddingVertical="$2"
            alignItems="center"
            justifyContent="center"
            borderWidth={1}
            borderColor={(isLive ? "#f5a623" : "#2a2a2a") as any}
          >
            <Text fontSize={16} fontWeight="900" color={isLive ? "#f5a623" : "#fff"}>
              {(!isLive && !isFinished) ? "-" : (m.homeScore ?? "-")}
            </Text>
            <Text fontSize={16} fontWeight="900" color={isLive ? "#f5a623" : "#fff"}>
              {(!isLive && !isFinished) ? "-" : (m.awayScore ?? "-")}
            </Text>
          </YStack>
        </XStack>
      </YStack>
    </View>
  )
}

const TournamentMatchRow = (props: any) => {
  return props.isMobile ? <TournamentMatchRowMobile {...props} /> : <TournamentMatchRowDesktop {...props} />
}
