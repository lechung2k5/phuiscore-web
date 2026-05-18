"use client"

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

// Các trang không cần Header (auth pages)
const NO_HEADER_PATHS = ['/login', '/register']

// ── Skeleton Header: hiển thị trong khi Header thật đang load ──
const HeaderSkeleton = () => (
  <div style={{
    height: 75,
    backgroundColor: '#0a0f0d',
    borderBottom: '1px solid #1a1f1c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  }}>
    {/* Logo placeholder */}
    <div style={{ width: 160, height: 40, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8 }} />
    {/* Nav placeholder */}
    <div style={{ display: 'flex', gap: 16 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ width: 60, height: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
      ))}
    </div>
    {/* User placeholder */}
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)' }} />
      <div style={{ width: 80, height: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
    </div>
  </div>
)

// ── Skeleton Footer ──
const FooterSkeleton = () => (
  <div style={{
    backgroundColor: '#020604',
    borderTop: '1px solid #121714',
    padding: '48px 24px 32px',
  }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 40, flexWrap: 'wrap' as const }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ width: 160, height: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 16 }} />
        <div style={{ width: '80%', height: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 4 }} />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ flex: 1, minWidth: 120 }}>
          <div style={{ width: 80, height: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 4, marginBottom: 16 }} />
          {[1, 2, 3].map(j => (
            <div key={j} style={{ width: '70%', height: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 4, marginBottom: 10 }} />
          ))}
        </div>
      ))}
    </div>
  </div>
)

// Load Header chỉ phía client (ssr: false) vì:
// 1. Header dùng localStorage, useState, useEffect — toàn bộ là client-only API
// 2. Tránh lỗi "Cannot read properties of null (reading 'useState')" khi SSR
//    do Tamagui trong packages/app resolve React theo đường khác với Next.js server runtime
const Header = dynamic(
  () => import('app/components/Header').then((mod) => mod.Header),
  { ssr: false, loading: () => <HeaderSkeleton /> }
)

const Footer = dynamic(
  () => import('app/components/Footer').then((mod) => mod.Footer),
  { ssr: false, loading: () => <FooterSkeleton /> }
)

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPath = pathname.startsWith('/admin')
  const showHeader = !NO_HEADER_PATHS.includes(pathname) && !isAdminPath
  const [layoutReady, setLayoutReady] = useState(false)

  useEffect(() => {
    // Chờ Header/Footer load xong (dynamic import) trước khi hiện nội dung chính
    // 300ms đủ để dynamic import resolve và skeleton chuyển thành component thật
    const timer = setTimeout(() => setLayoutReady(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {showHeader && <Header />} 
      <div style={{ 
        visibility: layoutReady ? 'visible' : 'hidden',
        opacity: layoutReady ? 1 : 0, 
        transition: 'opacity 0.2s ease-in',
        minHeight: showHeader ? 'calc(100vh - 75px)' : '100vh'
      }}>
        {children}
      </div>
      {showHeader && <Footer />}
    </>
  )
}
