"use client"

import React, { useRef, useCallback } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────
type Team = { name: string; logo: string }
type Match = {
  homeTeam: Team
  awayTeam: Team
  homeScore: string | number
  awayScore: string | number
  homePenalty?: number | null
  awayPenalty?: number | null
}
type Round = { roundName: string; matches: Match[] }

// ─── Constants (defaults — overridden by compact prop) ─────────────────────
const CARD_W_FULL = 240
const CARD_W_COMPACT = 160
const CARD_H = 96
const MATCH_GAP = 16
const ROUND_GAP_FULL = 56
const ROUND_GAP_COMPACT = 36
const HEADER_H = 32

// ─── Helpers ────────────────────────────────────────────────────────────────
function getWinner(m: Match): 'home' | 'away' | 'none' {
  const h = Number(m.homeScore)
  const a = Number(m.awayScore)
  if (isNaN(h) || isNaN(a)) return 'none'
  if (h > a) return 'home'
  if (a > h) return 'away'
  // Tie — check penalties
  if (m.homePenalty != null && m.awayPenalty != null) {
    return m.homePenalty > m.awayPenalty ? 'home' : 'away'
  }
  return 'none'
}

// Green gradient colors for each round depth
const ROUND_COLORS = ['#28a745', '#34c85a', '#52d968', '#6fe482', '#28a745']

// ─── TeamRow ────────────────────────────────────────────────────────────────
function TeamRow({
  team, score, penalty, isWinner, dimmed, compact,
}: {
  team: Team; score: string | number; penalty?: number | null
  isWinner: boolean; dimmed: boolean; compact?: boolean
}) {
  const isPending = score === '-' || score === undefined || score === null
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      height: '50%', padding: compact ? '0 8px' : '0 10px', gap: compact ? 6 : 8,
      backgroundColor: isWinner ? 'rgba(40,167,69,0.10)' : 'transparent',
    }}>
      {/* Logo */}
      <img
        src={team.logo} alt=""
        style={{ width: compact ? 18 : 22, height: compact ? 18 : 22, objectFit: 'contain', flexShrink: 0, borderRadius: 4 }}
        onError={(e: any) => { e.target.style.visibility = 'hidden' }}
      />
      {/* Name */}
      <span style={{
        flex: 1, fontSize: compact ? 10 : 12,
        fontWeight: isWinner ? 800 : 600,
        color: isWinner ? '#ffffff' : dimmed ? '#555' : '#aaa',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {team.name}
      </span>
      {/* Score + penalties */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {penalty != null && !compact && (
          <span style={{ fontSize: 10, color: '#666', fontWeight: 700 }}>({penalty})</span>
        )}
        <span style={{
          fontSize: compact ? 14 : 16, fontWeight: 900, minWidth: compact ? 16 : 20, textAlign: 'center',
          color: isPending ? '#333' : isWinner ? '#28a745' : '#888',
        }}>
          {isPending ? '—' : score}
        </span>
      </div>
    </div>
  )
}

// ─── MatchCard ───────────────────────────────────────────────────────────────
function MatchCard({ match, x, y, roundColor, compact }: {
  match: Match; x: number; y: number; roundColor: string; compact?: boolean
}) {
  const winner = getWinner(match)
  const hasResult = winner !== 'none' || (match.homeScore !== '-' && match.homeScore !== undefined)

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: compact ? CARD_W_COMPACT : CARD_W_FULL, height: CARD_H,
      backgroundColor: '#0f0f0f',
      borderRadius: 10,
      border: '1px solid #1e1e1e',
      overflow: 'hidden',
      boxShadow: hasResult ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        backgroundColor: hasResult ? roundColor : '#1e1e1e',
        borderRadius: '12px 0 0 12px',
      }} />
      <div style={{ marginLeft: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TeamRow team={match.homeTeam} score={match.homeScore} penalty={match.homePenalty} isWinner={winner === 'home'} dimmed={winner === 'away'} compact={compact} />
        <div style={{ height: 1, backgroundColor: '#1a1a1a', marginLeft: 10, marginRight: 10 }} />
        <TeamRow team={match.awayTeam} score={match.awayScore} penalty={match.awayPenalty} isWinner={winner === 'away'} dimmed={winner === 'home'} compact={compact} />
      </div>
    </div>
  )
}

// ─── Connectors SVG ─────────────────────────────────────────────────────────
function ConnectorLines({
  leftCenters, rightCenters, x, totalH, roundGap, cardW,
}: {
  leftCenters: number[]; rightCenters: number[]; x: number; totalH: number
  roundGap: number; cardW: number
}) {
  if (leftCenters.length < 2 || rightCenters.length < 1) return null

  const halfGap = roundGap / 2

  return (
    <svg
      style={{
        position: 'absolute',
        left: x + cardW,
        top: HEADER_H,
        width: roundGap,
        height: totalH,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {rightCenters.map((rightY, idx) => {
        const top = leftCenters[idx * 2]
        const bot = leftCenters[idx * 2 + 1]
        if (top == null || bot == null) return null
        const midY = (top + bot) / 2

        return (
          <g key={idx}>
            <path d={`M 0 ${top} H ${halfGap} V ${midY}`} fill="none" stroke="#2a2a2a" strokeWidth={1.5} strokeLinecap="round" />
            <path d={`M 0 ${bot} H ${halfGap} V ${midY}`} fill="none" stroke="#2a2a2a" strokeWidth={1.5} strokeLinecap="round" />
            <path d={`M ${halfGap} ${midY} H ${roundGap}`} fill="none" stroke="#2a2a2a" strokeWidth={1.5} strokeLinecap="round" />
            <circle cx={halfGap} cy={midY} r={2.5} fill="#333" />
          </g>
        )
      })}
    </svg>
  )
}

// ─── KnockoutBracket (main) ─────────────────────────────────────────────────
import { Plus, Minus, Maximize, MousePointer2 } from '@tamagui/lucide-icons'

export function KnockoutBracket({ rounds, compact = false }: { rounds: Round[]; compact?: boolean }) {
  const [scale, setScale] = React.useState(compact ? 0.8 : 1)
  
  const CARD_W = compact ? CARD_W_COMPACT : CARD_W_FULL
  const ROUND_GAP = compact ? ROUND_GAP_COMPACT : ROUND_GAP_FULL
  const COL_W = CARD_W + ROUND_GAP
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const startX = useRef(0)
  const scrollL = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return
    dragging.current = true
    startX.current = e.pageX - scrollRef.current.getBoundingClientRect().left
    scrollL.current = scrollRef.current.scrollLeft
    scrollRef.current.style.cursor = 'grabbing'
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.getBoundingClientRect().left
    scrollRef.current.scrollLeft = scrollL.current - (x - startX.current)
  }, [])

  const stopDrag = useCallback(() => {
    dragging.current = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
  }, [])

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 1.5))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.4))
  const resetZoom = () => setScale(compact ? 0.7 : 1)

  if (!rounds || rounds.length === 0) return null

  // Max matches = bracket height base
  const maxMatches = Math.max(...rounds.map(r => r.matches.length))
  const totalH = maxMatches * (CARD_H + MATCH_GAP)

  // Compute Y center of each match per round (centered vertically in totalH)
  const roundCenters: number[][] = rounds.map((round) => {
    const n = round.matches.length
    const blockH = n * CARD_H + (n - 1) * MATCH_GAP
    const startY = (totalH - blockH) / 2
    return round.matches.map((_, i) => startY + i * (CARD_H + MATCH_GAP) + CARD_H / 2)
  })

  const canvasW = rounds.length * COL_W + ROUND_GAP
  const canvasH = totalH + HEADER_H + 24

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Zoom Controls */}
      <div style={{ 
        position: 'absolute', right: 10, top: -50, zIndex: 100,
        display: 'flex', gap: 8, backgroundColor: '#111', padding: 6, borderRadius: 12,
        border: '1px solid #222', boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <button onClick={zoomOut} style={btnZoomStyle} title="Thu nhỏ"><Minus size={16} color="#aaa" /></button>
        <button onClick={resetZoom} style={btnZoomStyle} title="Reset"><Maximize size={16} color="#aaa" /></button>
        <button onClick={zoomIn} style={btnZoomStyle} title="Phóng to"><Plus size={16} color="#28a745" /></button>
      </div>

      {/* Scroll hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginLeft: 4 }}>
        <MousePointer2 size={12} color="#444" />
        <span style={{ fontSize: 10, color: '#444', fontWeight: 900, letterSpacing: 1 }}>
          KÉO TRÁI-PHẢI ĐỂ XEM SƠ ĐỒ
        </span>
      </div>

      {/* Scrollable bracket container */}
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          cursor: 'grab',
          userSelect: 'none',
          WebkitOverflowScrolling: 'touch' as any,
          scrollbarWidth: 'thin' as any,
          scrollbarColor: '#222 #0a0a0a' as any,
          paddingBottom: 20,
          border: '1px solid #111',
          borderRadius: 16,
          backgroundColor: '#050807'
        }}
      >
        <div style={{ 
          position: 'relative', 
          width: canvasW * scale, 
          height: canvasH * scale,
          minWidth: '100%'
        }}>
          <div style={{ 
            position: 'absolute', 
            left: 0, top: 0, 
            transform: `scale(${scale})`, 
            transformOrigin: 'top left',
            width: canvasW,
            height: canvasH,
            transition: 'transform 0.2s ease-out'
          }}>
            {rounds.map((round, rIdx) => {
              const x = rIdx * COL_W
              const centers = roundCenters[rIdx]
              const nextCenters = rIdx < rounds.length - 1 ? roundCenters[rIdx + 1] : null
              const roundColor = ROUND_COLORS[Math.min(rIdx, ROUND_COLORS.length - 1)]

              const shouldConnect = nextCenters != null &&
                round.matches.length >= nextCenters.length * 2 - 1

              return (
                <div key={rIdx}>
                  {/* Round header */}
                  <div style={{
                    position: 'absolute', left: x, top: 0, width: CARD_W,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: HEADER_H,
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 900, letterSpacing: 2,
                      color: roundColor,
                      textTransform: 'uppercase',
                      borderBottom: `2px solid ${roundColor}`,
                      paddingBottom: 2,
                    }}>
                      {round.roundName}
                    </span>
                  </div>

                  {/* Match cards */}
                  {round.matches.map((match, mIdx) => {
                    const cy = centers[mIdx]
                    const cardY = cy - CARD_H / 2 + HEADER_H
                    return (
                      <MatchCard key={mIdx} match={match} x={x} y={cardY} roundColor={roundColor} compact={compact} />
                    )
                  })}

                  {/* SVG Connectors */}
                  {shouldConnect && nextCenters && (
                    <ConnectorLines
                      leftCenters={centers}
                      rightCenters={nextCenters}
                      x={x}
                      totalH={totalH}
                      roundGap={ROUND_GAP}
                      cardW={CARD_W}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 20, marginLeft: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: 'rgba(40,167,69,0.15)', border: '1px solid #28a745' }} />
          <span style={{ fontSize: 11, color: '#555', fontWeight: 700 }}>Đội thắng</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#555', fontWeight: 700 }}>(n) = Loạt penalty</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#444', fontWeight: 700 }}>—  = Chưa đấu</span>
        </div>
      </div>
    </div>
  )
}

const btnZoomStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: 'none',
  backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', outline: 'none'
}
