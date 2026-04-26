"use client"
import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, View, Image, Spinner, Input, Button, useMedia, Card } from 'tamagui'
import { Plus, Trash2, Shield, Users, MapPin, Phone, Calendar } from '@tamagui/lucide-icons'
import axios from 'axios'
import Link from 'next/link'
import { CreateTeamModal } from './CreateTeamModal'
import { AppConfirmDialog, AppAlertDialog } from '../layout/AppDialog'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
const C = { primary: '#28a745', bg: '#050807', card: 'rgba(15,22,18,0.85)', border: 'rgba(255,255,255,0.07)' }

const YS: any = YStack; const XS: any = XStack; const T: any = Text; const V: any = View;

const TeamCardSkeleton = ({ isMobile, media }: any) => (
  <Card
    width={isMobile ? '100%' : media.gtLg ? '31.5%' : '48%'}
    borderRadius={32}
    overflow="hidden"
    borderWidth={1}
    borderColor="rgba(255,255,255,0.05)"
    padding="$5"
    backgroundColor="rgba(255,255,255,0.02)"
    height={350}
    justifyContent="space-between"
  >
    <YStack gap="$4">
      <YStack alignItems="center" gap="$3" marginTop="$2">
        <View width={90} height={90} borderRadius={45} backgroundColor="rgba(255,255,255,0.05)" opacity={0.5} />
        <YStack alignItems="center" gap="$1" width="100%">
          <View width="70%" height={24} borderRadius={4} backgroundColor="rgba(255,255,255,0.05)" />
          <View width="40%" height={16} borderRadius={4} backgroundColor="rgba(255,255,255,0.05)" marginTop="$2" />
        </YStack>
      </YStack>
      <YStack gap="$2" paddingHorizontal="$2">
        <View width="50%" height={14} borderRadius={4} backgroundColor="rgba(255,255,255,0.03)" />
        <XStack justifyContent="space-between">
            <View width="30%" height={12} borderRadius={4} backgroundColor="rgba(255,255,255,0.03)" />
            <View width="30%" height={12} borderRadius={4} backgroundColor="rgba(255,255,255,0.03)" />
        </XStack>
      </YStack>
    </YStack>
    <YStack gap="$2" marginTop="$4">
       <View width="100%" height={40} borderRadius={12} backgroundColor="rgba(255,255,255,0.04)" />
       <View width="50%" height={14} borderRadius={4} alignSelf="center" backgroundColor="rgba(255,255,255,0.02)" marginTop="$2" />
    </YStack>
  </Card>
)

export default function MyTeamsScreen() {
  const media = useMedia()
  const isMobile = !media.gtMd

  const [myTeams, setMyTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Token & Headers
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const fetchMyTeams = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) return
      const res = await axios.get(`${API}/teams/my-teams/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMyTeams(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const [confirmConfig, setConfirmConfig] = useState<any>({ open: false, title: '', message: '', onConfirm: null, danger: false })
  const [alertConfig, setAlertConfig] = useState<any>({ open: false, title: '', message: '', type: 'info' })

  const handleDeleteTeam = (id: string, name: string) => {
    setConfirmConfig({
      open: true,
      title: 'Xóa đội bóng',
      message: `Bạn có chắc chắn muốn xóa đội "${name}" không? Hành động này không thể hoàn tác.`,
      danger: true,
      onConfirm: async () => {
        setConfirmConfig(c => ({...c, open: false}))
        try {
          const token = getToken()
          await axios.delete(`${API}/teams/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setAlertConfig({ open: true, title: 'Thành công', message: 'Đã xóa đội bóng thành công!', type: 'success' })
          fetchMyTeams()
        } catch (error: any) {
          setAlertConfig({ open: true, title: 'Lỗi xóa đội', message: error.response?.data?.message || 'Vui lòng thử lại', type: 'error' })
        }
      }
    })
  }

  useEffect(() => { 
    setMounted(true)
    fetchMyTeams()
    window.scrollTo(0, 0)
  }, [])


  if (!mounted) return null

  return (
    <YStack flex={1} backgroundColor={C.bg as any} minHeight="100vh">
      <YS maxWidth={1000} width="100%" marginHorizontal="auto" 
          paddingHorizontal={isMobile ? '$4' : '$6'} 
          paddingTop={isMobile ? '$6' : '$10'} 
          paddingBottom="$10" gap="$6">
        
        <XS justifyContent="space-between" alignItems="center">
          <T color="white" fontSize={isMobile ? 24 : 32} fontWeight="900">Quản Lý Đội</T>
          <XS backgroundColor={C.primary as any} paddingHorizontal="$4" paddingVertical="$2.5" borderRadius={8} gap="$2" style={{ cursor: 'pointer' }} onPress={() => setOpenCreateModal(true)}>
            <Plus size={18} color="white" />
            <T color="white" fontWeight="800">Tạo Đội Mới</T>
          </XS>
        </XS>

        {loading ? (
          <XS flexWrap="wrap" gap="$5" justifyContent={isMobile ? "center" : "flex-start"}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <TeamCardSkeleton key={i} isMobile={isMobile} media={media} />
            ))}
          </XS>
        ) : myTeams.length === 0 ? (
          <YS backgroundColor={C.card as any} padding="$10" borderRadius={16} borderWidth={1} borderColor={C.border as any} alignItems="center" gap="$4">
            <Shield size={64} color="#333" />
            <T color="white" fontSize={18} fontWeight="700">Bạn chưa quản lý đội bóng nào</T>
            <T color="#888" fontSize={14} textAlign={"center" as any}>Tạo đội bóng của bạn để tham gia các giải đấu hệ thống và quản lý hồ sơ cầu thủ chuyên nghiệp.</T>
          </YS>
        ) : (
          <XS flexWrap="wrap" gap="$5" justifyContent={isMobile ? "center" : "flex-start"}>
            {myTeams.map(team => (
              <Card
                key={team.id}
                {...({
                  animation: "lazy",
                  hoverStyle: { y: -4, scale: 1.01 },
                  pressStyle: { scale: 0.98 },
                  width: isMobile ? '100%' : media.gtLg ? '31.5%' : '48%',
                  borderRadius: 32,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "rgba(34,197,94,0.3)",
                  padding: "$5",
                  justifyContent: "space-between",
                  style: {
                    background: 'linear-gradient(180deg, #052c16 0%, #020f08 45%, #010502 100%)',
                    boxShadow: '0 0 20px rgba(34,197,94,0.15), 0 12px 30px rgba(0,0,0,0.6)'
                  }
                } as any)}
              >
                <YStack gap="$4">
                  {/* Center: Logo & Name */}
                  <YStack alignItems="center" gap="$3" marginTop="$2">
                    <View 
                      width={90} 
                      height={90} 
                      borderRadius={45} 
                      backgroundColor="rgba(255,255,255,0.05)"
                      alignItems="center" 
                      justifyContent="center"
                      borderWidth={2}
                      borderColor="rgba(255,255,255,0.08)"
                      style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}
                    >
                      {(team.logo_url || team.logo) ? (
                        <Image src={team.logo_url || team.logo} width={55} height={55} style={{ objectFit: 'contain' } as any} />
                      ) : (
                        <Shield size={40} color="#555" />
                      )}
                    </View>
                    <YStack alignItems="center" gap="$1">
                      <Text color="white" fontSize={18} fontWeight="900" textAlign="center" numberOfLines={2} height={48}>
                        {team.name}
                      </Text>
                      <Text color="#888" fontSize={12} fontWeight="700">HLV: {team.leader || 'Chưa cập nhật'}</Text>
                    </YStack>
                  </YStack>

                  {/* Additional Info */}
                  <YStack gap="$2" paddingHorizontal="$2">
                    {team.area && (
                      <XStack alignItems="center" gap="$2">
                        <MapPin size={14} color={C.primary as any} />
                        <Text color="#aaa" fontSize={13} numberOfLines={1}>{team.area}</Text>
                      </XStack>
                    )}
                    <XStack justifyContent="space-between" alignItems="center">
                      {team.founded_year && (
                        <XStack alignItems="center" gap="$2">
                          <Calendar size={14} color="#888" />
                          <Text color="#888" fontSize={12}>Est. {team.founded_year}</Text>
                        </XStack>
                      )}
                      {team.phone && (
                        <XStack alignItems="center" gap="$2">
                          <Phone size={14} color="#888" />
                          <Text color="#888" fontSize={12}>{team.phone}</Text>
                        </XStack>
                      )}
                    </XStack>
                  </YStack>
                </YStack>

                {/* Footer Buttons */}
                <YStack gap="$2" marginTop="$4">
                  <Link href={`/user/my-teams/${team.id}/manage`} style={{ textDecoration: 'none' }}>
                    <XStack 
                        height={40} 
                        borderRadius={12} 
                        alignItems="center" 
                        justifyContent="center" 
                        gap="$2"
                        style={{ 
                          background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
                          boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
                        } as any}
                    >
                        <Text color="black" fontSize={12} fontWeight="900">QUẢN LÝ</Text>
                    </XStack>
                  </Link>
                  
                  <XStack 
                    justifyContent="center" 
                    paddingVertical="$2"
                    onPress={() => handleDeleteTeam(team.id, team.name)}
                    style={{ cursor: 'pointer' }}
                    hoverStyle={{ opacity: 0.7 } as any}
                  >
                    <Trash2 size={14} color="#dc3545" opacity={0.6} />
                    <Text color="#dc3545" fontSize={11} fontWeight="700" marginLeft="$2" opacity={0.6}>Xóa đội bóng</Text>
                  </XStack>
                </YStack>
              </Card>
            ))}
          </XS>
        )}

      </YS>

      <CreateTeamModal 
        open={openCreateModal} 
        setOpen={setOpenCreateModal} 
        onSuccess={fetchMyTeams}
      />

      <AppConfirmDialog {...confirmConfig} onCancel={() => setConfirmConfig((c: any) => ({...c, open: false}))} />
      <AppAlertDialog {...alertConfig} onClose={() => setAlertConfig((c: any) => ({...c, open: false}))} />
    </YStack>
  )
}
