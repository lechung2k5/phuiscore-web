"use client"
import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, View, Image, Button, useMedia } from 'tamagui'
import { ChevronRight, Clock, User } from '@tamagui/lucide-icons'
import { API_BASE } from '../../utils/api-config'
import { Link } from 'solito/link'

export const NewsSection = () => {
    const [news, setNews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const media = useMedia()
    const isMobile = !media.gtMd

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch(`${API_BASE}/news?page=1&limit=3`)
                const json = await res.json()
                if (json.success) {
                    setNews(json.data)
                }
            } catch (e) {
                console.error("Fetch home news error:", e)
            } finally {
                setNewsLoading(false)
            }
        }
        fetchNews()
    }, [])

    const [newsLoading, setNewsLoading] = useState(true)

    return (
        <YStack width="100%" marginTop="$10" marginBottom="$10" gap="$6">
            <XStack justifyContent="space-between" alignItems="flex-end" paddingHorizontal={isMobile ? "$2" : "$0"}>
                <YStack gap="$1">
                    <XStack alignItems="center" gap="$2">
                        <View width={12} height={2} backgroundColor="#22c55e" borderRadius={2} />
                        <Text color="#22c55e" fontSize={11} fontWeight="900" letterSpacing={1.5}>TIN TỨC MỚI NHẤT</Text>
                    </XStack>
                    <Text color="white" fontSize={isMobile ? 28 : 36} fontWeight="900" letterSpacing={-1}>CẬP NHẬT PHỦI SCORE</Text>
                </YStack>
                
                {!isMobile && (
                    <Link href="/tin-tuc">
                        <Button 
                            backgroundColor="rgba(255,255,255,0.05)" 
                            borderWidth={1} 
                            borderColor="rgba(255,255,255,0.1)" 
                            borderRadius="$10"
                            iconAfter={<ChevronRight size={16} color="#22c55e" />}
                        >
                            <Text color="white" fontSize={13} fontWeight="800">XEM TẤT CẢ</Text>
                        </Button>
                    </Link>
                )}
            </XStack>

            <XStack 
                flexWrap="wrap" 
                gap="$5" 
                width="100%"
            >
                {newsLoading ? (
                    [0,1,2].map(i => (
                        <View key={i} flex={1} minWidth={isMobile ? "100%" : 300} height={380} backgroundColor="rgba(255,255,255,0.03)" borderRadius={24} style={{ animation: 'pulse 1.5s infinite' }} />
                    ))
                ) : (
                    news.map((item) => (
                        <NewsCard key={item.id} item={item} isMobile={isMobile} />
                    ))
                )}
            </XStack>
            
            {isMobile && (
                <Link href="/tin-tuc">
                    <Button width="100%" backgroundColor="rgba(255,255,255,0.05)" borderRadius="$10" marginTop="$2">
                        <Text color="#22c55e" fontWeight="900">XEM TẤT CẢ TIN TỨC</Text>
                    </Button>
                </Link>
            )}
        </YStack>
    )
}

const NewsCard = ({ item, isMobile }: any) => {
    return (
        <Link href={`/tin-tuc/${item.slug}`} style={{ flex: 1, minWidth: isMobile ? "100%" : 300, textDecoration: 'none' }}>
            <YStack 
                group
                backgroundColor="rgba(18, 24, 20, 0.9)" 
                borderRadius={32} 
                overflow="hidden" 
                borderWidth={1}
                borderColor="rgba(34,197,94,0.3)"
                hoverStyle={{ y: -6, scale: 1.01, borderColor: '#22c55e' } as any}
                pressStyle={{ scale: 0.98 } as any}
                style={{ 
                    transition: 'all 0.3s ease',
                    background: 'linear-gradient(180deg, #052c16 0%, #020f08 45%, #010502 100%)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.6), 0 0 20px rgba(34,197,94,0.1)'
                } as any}
                paddingBottom="$2"
            >
                <View width="100%" height={180} overflow="hidden" position="relative">
                    <Image 
                        src={item.thumbnail} 
                        width="100%" height="100%" 
                        style={{ objectFit: 'cover', transition: 'transform 0.5s' } as any}
                        hoverStyle={{ scale: 1.1 } as any}
                    />
                    {/* Badge Category */}
                    <View 
                        position="absolute" top={16} left={16} 
                        backgroundColor="rgba(0,0,0,0.6)" 
                        paddingHorizontal="$3" paddingVertical="$1" 
                        borderRadius={12} borderWidth={1} borderColor="rgba(34,197,94,0.4)"
                        style={{ backdropFilter: 'blur(8px)' }}
                    >
                        <Text color="#22c55e" fontSize={10} fontWeight="900" letterSpacing={1}>TIN TỨC</Text>
                    </View>
                </View>
                
                <YStack padding="$5" gap="$3">
                    <XStack gap="$4">
                        <XStack alignItems="center" gap="$1.5">
                            <Clock size={12} color="#22c55e" />
                            <Text color="#5a6a5e" fontSize={11} fontWeight="800">{new Date(item.published_at || item.createdAt).toLocaleDateString('vi-VN')}</Text>
                        </XStack>
                        <XStack alignItems="center" gap="$1.5">
                            <User size={12} color="#22c55e" />
                            <Text color="#5a6a5e" fontSize={11} fontWeight="800">{item.author || 'BTV PHỦI'}</Text>
                        </XStack>
                    </XStack>
                    
                    <Text 
                        color="white" 
                        fontSize={18} 
                        fontWeight="900" 
                        lineHeight={26}
                        numberOfLines={2}
                        style={{ letterSpacing: -0.5 }}
                    >
                        {item.title}
                    </Text>
                    
                    <Text 
                        color="#7a8c7e" 
                        fontSize={13} 
                        lineHeight={20}
                        numberOfLines={2}
                        fontWeight="500"
                    >
                        {item.excerpt || item.summary || item.content?.substring(0, 100).replace(/<[^>]*>/g, '') + '...'}
                    </Text>

                    <XStack alignItems="center" gap="$2" marginTop="$2">
                        <Text color="#22c55e" fontSize={12} fontWeight="900">ĐỌC CHI TIẾT</Text>
                        <ChevronRight size={14} color="#22c55e" />
                    </XStack>
                </YStack>
            </YStack>
        </Link>
    )
}
