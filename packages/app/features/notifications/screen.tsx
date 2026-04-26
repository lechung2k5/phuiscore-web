"use client"
import React, { useState, useEffect } from 'react'
import {
  YStack, XStack, Text, Button, View, ScrollView, Spinner, Image
} from 'tamagui'
import {
  Bell, Check, Trophy, Users, AlertCircle, Calendar, ChevronRight
} from '@tamagui/lucide-icons'
import axios from 'axios'
import { Link } from 'solito/link'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Design Tokens (đồng bộ phong cách dark mode)
const C = {
  bg: '#07090a',
  surface: '#0d1117',
  card: '#0d1117',
  cardBorder: '#1a2030',
  accent: '#00e676',
  white: '#ffffff',
  textSub: '#6b7a8d',
  unreadBg: 'rgba(0,230,118,0.03)'
}

export const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const res = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      })
      if (res.data.success) {
        setNotifications(res.data.data || [])
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải thông báo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAsRead = async (id: string, currentStatus: boolean, link?: string) => {
    if (!currentStatus) {
      try {
        const token = localStorage.getItem('token')
        await axios.patch(`${API}/notifications/${id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      } catch (e) {
        console.error("Lỗi mark as read:", e)
      }
    }
    // Chuyển hướng nếu có link
    if (link) {
      window.location.href = link
    }
  }

  const getIconForType = (type: string, title?: string) => {
    const lowerTitle = title?.toLowerCase() || ''
    
    // Ưu tiên trạng thái đặc biệt dựa trên tiêu đề
    if (lowerTitle.includes('đã duyệt')) return <Check size={18} color="#28a745" />
    if (lowerTitle.includes('bị từ chối')) return <AlertCircle size={18} color="#ff4d4f" />
    if (lowerTitle.includes('cần bổ sung') || lowerTitle.includes('yêu cầu')) return <AlertCircle size={18} color="#fa8c16" />
    if (lowerTitle.includes('thành công')) return <Check size={18} color="#28a745" />

    switch (type) {
      case 'TOURNAMENT': return <Trophy size={18} color="#ffc400" />
      case 'TEAM': return <Users size={18} color="#448aff" />
      case 'MATCH': return <Calendar size={18} color="#e53935" />
      case 'SYSTEM': return <Bell size={18} color="#6b7a8d" />
      default: return <Bell size={18} color={C.accent as any} />
    }
  }

  return (
    <View flex={1} backgroundColor={C.bg as any} minHeight="100vh" style={{ fontFamily: "var(--font-barlow, 'Barlow', sans-serif)" } as any}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack maxWidth={800} marginHorizontal="auto" width="100%" padding="$5" gap="$5">
          
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center" paddingBottom="$4" borderBottomWidth={1} borderColor={C.cardBorder as any}>
            <XStack alignItems="center" gap="$3">
              <View width={40} height={40} borderRadius={20} backgroundColor={"rgba(255,255,255,0.05)" as any} alignItems="center" justifyContent="center">
                <Bell size={20} color={C.white as any} />
              </View>
              <YStack>
                <Text color={C.white as any} fontSize={24} fontWeight="900">Thông báo</Text>
                <Text color={C.textSub as any} fontSize={13}>Cập nhật mới nhất từ hệ thống</Text>
              </YStack>
            </XStack>
            
            {/* TODO: Nút Đánh dấu đọc tất cả có thể thêm sau */}
          </XStack>

          {/* List */}
          {loading ? (
            <YStack padding="$10" alignItems="center" justifyContent="center">
              <Spinner size="large" color={C.accent as any} />
              <Text color={C.textSub as any} marginTop="$3">Đang tải...</Text>
            </YStack>
          ) : error ? (
            <YStack backgroundColor={"rgba(255,68,68,0.1)" as any} padding="$4" borderRadius={12} borderWidth={1} borderColor={"rgba(255,68,68,0.3)" as any} alignItems="center">
              <AlertCircle color="#ff4444" size={24} />
              <Text color="#ff4444" fontWeight="700" marginTop="$2">{error}</Text>
            </YStack>
          ) : notifications.length === 0 ? (
            <YStack padding="$10" alignItems="center" justifyContent="center" gap="$3" opacity={0.5}>
              <Bell size={48} color={C.textSub as any} />
              <Text color={C.textSub as any} fontSize={15} fontWeight="600">Bạn chưa có thông báo nào cả.</Text>
            </YStack>
          ) : (
            <YStack gap="$2" paddingBottom="$10">
              {notifications.map(notif => (
                <View
                  key={notif.id}
                  backgroundColor={(notif.isRead ? C.card : C.unreadBg) as any}
                  borderRadius={14}
                  borderWidth={1}
                  borderColor={(notif.isRead ? C.cardBorder : 'rgba(0,230,118,0.15)') as any}
                  padding="$4"
                  hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.02)' } as any}
                  cursor={notif.link ? 'pointer' : 'default'}
                  onPress={() => handleMarkAsRead(notif.id, notif.isRead, notif.link)}
                  style={{ transition: 'all 0.2s', position: 'relative' } as any}
                >
                  <XStack gap="$3" alignItems="flex-start">
                    {/* Chấm tròn báo chưa đọc báo chưa đọc */}
                    {!notif.isRead && (
                       <View position="absolute" top={16} left={10} width={8} height={8} borderRadius={4} backgroundColor={C.accent as any} />
                    )}

                    {/* Icon */}
                     <View 
                       width={44} height={44} borderRadius={22} 
                       backgroundColor={"rgba(255,255,255,0.05)" as any} 
                       alignItems="center" justifyContent="center"
                       marginLeft={!notif.isRead ? 18 : 0}
                     >
                       {getIconForType(notif.type, notif.title)}
                     </View>

                    {/* Content */}
                    <YStack flex={1} gap="$1">
                      <Text color={C.white as any} fontSize={15} fontWeight={notif.isRead ? "600" : "800"}>
                        {notif.title}
                      </Text>
                      <Text color={C.textSub as any} fontSize={14} lineHeight={20}>
                        {notif.message}
                      </Text>
                      <Text color={"#445" as any} fontSize={12} marginTop="$1">
                         {notif.createdAt && formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                      </Text>
                    </YStack>
                    
                    {/* Mũi tên điều hướng */}
                    {notif.link && (
                      <View opacity={0.5} padding="$2">
                        <ChevronRight size={16} color={C.white as any} />
                      </View>
                    )}
                  </XStack>
                </View>
              ))}
            </YStack>
          )}

        </YStack>
      </ScrollView>
    </View>
  )
}

