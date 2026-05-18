"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UserProfileRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user')
      const user = savedUser ? JSON.parse(savedUser) : null
      const username = user?.username

      if (username) {
        router.replace(`/user/${encodeURIComponent(username)}`)
        return
      }
    } catch (error) {
      console.error('Cannot resolve current profile route', error)
    }

    router.replace('/login')
  }, [router])

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#050706',
        color: '#f7faf7',
        fontWeight: 800,
      }}
    >
      Đang mở hồ sơ...
    </main>
  )
}
