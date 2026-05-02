"use client"
import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, View, ScrollView, Button, Separator, useMedia } from 'tamagui'
import { 
    Monitor, 
    Smartphone, 
    Database, 
    Zap, 
    Shield, 
    Activity, 
    Layout, 
    FileText, 
    Code2, 
    CheckCircle2,
    Layers,
    Globe,
    Cpu,
    Target,
    Users,
    Server,
    Trophy,
    Video,
    Cloud,
    Lock,
    Box,
    Bell,
    Smartphone as PhoneIcon,
    Search,
    Network,
    ChevronRight
} from '@tamagui/lucide-icons'

export const AcademicIntro = () => {
    const media = useMedia()
    const isMobile = !media.gtMd
    const [count, setCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (count < 100) {
            const timer = setTimeout(() => setCount(prev => prev + 1), 6)
            return () => clearTimeout(timer)
        } else {
            setTimeout(() => setIsLoading(false), 500)
        }
    }, [count])

    if (isLoading) {
        return (
            <YStack fullscreen backgroundColor="#0a0a0a" alignItems="center" justifyContent="center" zIndex={9999}>
                <Text color="white" fontSize={isMobile ? 100 : 200} fontWeight="100" style={{ fontFamily: 'serif', fontStyle: 'italic' }}>
                    {String(count).padStart(3, '0')}
                </Text>
            </YStack>
        )
    }

    return (
        <ScrollView backgroundColor="#0a0a0a">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@200;400;600;800&display=swap');
                .font-display { font-family: 'Instrument Serif', serif; }
                .font-body { font-family: 'Inter', sans-serif; }
                .glass-card { 
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .slide-title {
                    font-size: ${isMobile ? '40px' : '72px'};
                    line-height: ${isMobile ? '48px' : '84px'};
                }
                .slide-desc {
                    font-size: ${isMobile ? '16px' : '22px'};
                    line-height: ${isMobile ? '24px' : '34px'};
                }
            `}</style>

            <YStack paddingHorizontal="$5" maxWidth={1300} width="100%" marginHorizontal="auto" paddingBottom={200}>
                
                {/* --- SLIDE 0: COVER --- */}
                <YStack height={isMobile ? 600 : 900} justifyContent="center" alignItems="center" gap="$6">
                    <Text color="#4E85BF" fontSize={16} letterSpacing={8} fontWeight="800">BÁO CÁO ĐỒ ÁN TỐT NGHIỆP</Text>
                    <Text color="white" className="slide-title font-display" fontStyle="italic" textAlign="center">
                        Phủi Score: <br/> Hệ sinh thái Digital Football
                    </Text>
                    <YStack alignItems="center" gap="$2">
                        <Text color="#555" fontSize={18}>Sinh viên thực hiện: <Text color="white" fontWeight="600">Lê Công Chung</Text></Text>
                        <Text color="#555" fontSize={18}>Mã số sinh viên: <Text color="white" fontWeight="600">21110xxx</Text></Text>
                    </YStack>
                    <ChevronRight size={40} color="#333" marginTop="$10" />
                </YStack>

                {/* --- CHƯƠNG 1: GIỚI THIỆU --- */}
                <SectionHeader num="01" title="GIỚI THIỆU" />
                <YStack gap="$12" paddingBottom={100}>
                    <XStack flexWrap="wrap" gap="$10">
                        <BigChapterItem 
                            title="1.1 Tổng quan đề tài" 
                            desc="Số hóa bóng đá phong trào, giải quyết bài toán quản lý dữ liệu phân tán và cập nhật tỉ số chậm trễ bằng công nghệ thời gian thực." 
                        />
                        <BigChapterItem 
                            title="1.2 Mục tiêu" 
                            desc="Xây dựng hệ thống đa nền tảng (Web & Mobile) với khả năng đồng bộ sự kiện tức thì và tích hợp Livestream chất lượng cao." 
                        />
                    </XStack>

                    <YStack className="glass-card" padding="$12" borderRadius={40} gap="$8">
                        <Text color="white" fontSize={32} fontWeight="800">1.3 Kiến trúc hệ thống: Client-Server</Text>
                        <XStack flexWrap="wrap" gap="$10">
                            <ArchSlideStep icon={<Monitor size={32} color="#4E85BF"/>} label="Client Side" desc="Next.js & Expo App" tech="Solito / Tamagui" />
                            <ArchSlideStep icon={<Zap size={32} color="#22c55e"/>} label="Hub Side" desc="Node.js & Socket.io" tech="Real-time Engine" />
                            <ArchSlideStep icon={<Database size={32} color="#eab308"/>} label="Data Side" desc="AWS DynamoDB" tech="Serverless NoSQL" />
                        </XStack>
                    </YStack>

                    <YStack gap="$6" marginTop="$10">
                        <Text color="white" fontSize={32} fontWeight="800">1.4 Mô tả yêu cầu hệ thống</Text>
                        <XStack flexWrap="wrap" gap="$6">
                            <LargeInfoCard title="Chức năng" items={["Quản lý giải đấu & cầu thủ", "Live Match Center (Real-time)", "Livestreaming (LiveKit)", "News CMS & Media Hub"]} />
                            <LargeInfoCard title="Phi chức năng" items={["Độ trễ dữ liệu < 200ms", "Bảo mật AWS & JWT", "Khả năng mở rộng Serverless", "Giao diện Responsive 100%"]} />
                        </XStack>
                    </YStack>
                </YStack>

                {/* --- CHƯƠNG 2: CƠ SỞ LÝ THUYẾT --- */}
                <SectionHeader num="02" title="CƠ SỞ LÝ THUYẾT" />
                <YStack paddingBottom={100} gap="$12">
                    <YStack gap="$8">
                        <Text color="#555" fontSize={14} fontWeight="800" letterSpacing={3}>HỆ SINH THÁI CÔNG NGHỆ</Text>
                        <XStack flexWrap="wrap" gap="$6">
                            <BigTechCard icon={<Monitor size={40} color="#4E85BF"/>} title="Next.js 14" desc="Framework Web mạnh mẽ nhất hiện nay cho SEO & SSR." />
                            <BigTechCard icon={<Smartphone size={40} color="#4E85BF"/>} title="Expo" desc="Phát triển Mobile App Native tốc độ cao." />
                            <BigTechCard icon={<Database size={40} color="#4E85BF"/>} title="AWS DynamoDB" desc="Cơ sở dữ liệu NoSQL với độ trễ cực thấp." />
                            <BigTechCard icon={<Zap size={40} color="#4E85BF"/>} title="Socket.io" desc="Đẩy dữ liệu thời gian thực cho hàng ngàn User." />
                            <BigTechCard icon={<Video size={40} color="#4E85BF"/>} title="LiveKit" desc="Hạ tầng livestream WebRTC hiện đại nhất." />
                            <BigTechCard icon={<Code2 size={40} color="#4E85BF"/>} title="TypeScript" desc="Ngôn ngữ đảm bảo tính ổn định của hệ thống." />
                        </XStack>
                    </YStack>
                </YStack>

                {/* --- CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ --- */}
                <SectionHeader num="03" title="PHÂN TÍCH VÀ THIẾT KẾ" />
                <YStack gap="$12" paddingBottom={100}>
                    <YStack className="glass-card" padding="$12" borderRadius={40} gap="$8">
                        <Text color="white" fontSize={32} fontWeight="800">3.1 Phân tích Use Case</Text>
                        <XStack flexWrap="wrap" gap="$12">
                            <UseCaseSlide role="Bình luận viên" desc="Cập nhật sự kiện Live qua bàn điều khiển LiveControl." icon={<Users size={32} color="#4E85BF"/>} />
                            <UseCaseSlide role="Ban tổ chức" desc="Quản lý toàn bộ giải đấu, đội hình và lịch thi đấu." icon={<Trophy size={32} color="#4E85BF"/>} />
                            <UseCaseSlide role="Người hâm mộ" desc="Theo dõi tỉ số, nhận thông báo và xem trực tiếp." icon={<Search size={32} color="#4E85BF"/>} />
                        </XStack>
                    </YStack>
                    <YStack className="glass-card" padding="$12" borderRadius={40} gap="$6">
                        <Text color="white" fontSize={32} fontWeight="800">3.2 Thiết kế hệ thống (Repository Pattern)</Text>
                        <Text color="#777" fontSize={22} lineHeight={34}>
                            Tách biệt logic truy vấn dữ liệu từ DynamoDB khỏi logic nghiệp vụ, giúp mã nguồn sạch (Clean Code) và dễ dàng kiểm thử (Testing).
                        </Text>
                    </YStack>
                </YStack>

                {/* --- CHƯƠNG 4: HIỆN THỰC --- */}
                <SectionHeader num="04" title="HIỆN THỰC" />
                <YStack gap="$12" paddingBottom={100}>
                    <XStack flexWrap="wrap" gap="$8">
                        <BigModuleBox title="4.2.1 Giao diện Web" desc="LiveControl Dashboard cho BLV, Media Dashboard cho quản trị tin tức." isMobile={isMobile} />
                        <BigModuleBox title="4.2.2 Giao diện App" desc="Ứng dụng Expo mượt mà tích hợp LiveKit Player xem livestream cực đỉnh." isMobile={isMobile} />
                    </XStack>
                    <YStack className="glass-card" padding="$12" borderRadius={40} gap="$8">
                        <Text color="white" fontSize={32} fontWeight="800">4.3 Kết quả kiểm thử</Text>
                        <XStack flexWrap="wrap" gap="$15">
                            <SlideMetric label="Code Reuse" value="~ 92%" />
                            <SlideMetric label="Socket Latency" value="< 200ms" />
                            <SlideMetric label="Security" value="JWT/AWS" />
                            <SlideMetric label="Uptime" value="99.9%" />
                        </XStack>
                    </YStack>
                </YStack>

                {/* --- CHƯƠNG 5: KẾT LUẬN --- */}
                <SectionHeader num="05" title="KẾT LUẬN" />
                <YStack gap="$15" paddingBottom={200}>
                    <XStack flexWrap="wrap" gap="$15">
                        <YStack flex={1} gap="$6">
                            <Text color="white" fontSize={36} fontWeight="800">5.1 Kết quả đạt được</Text>
                            <Text color="#777" fontSize={24} lineHeight={38}>Xây dựng thành công hệ sinh thái Phủi Score ổn định, hiệu năng cao trên nền tảng AWS Serverless.</Text>
                        </YStack>
                        <YStack flex={1} gap="$6">
                            <Text color="white" fontSize={36} fontWeight="800">5.3 Hướng phát triển</Text>
                            <Text color="#777" fontSize={24} lineHeight={38}>Tích hợp AI để tự động hóa hoàn toàn việc ghi nhận bàn thắng qua video từ LiveKit.</Text>
                        </YStack>
                    </XStack>
                    <Separator borderColor="#222" />
                    <YStack alignItems="center" gap="$4">
                        <Text color="#4E85BF" fontSize={16} letterSpacing={8} fontWeight="800">CẢM ƠN QUÝ HỘI ĐỒNG ĐÃ LẮNG NGHE</Text>
                        <Text color="#333" fontSize={14}>DESIGNED BY LE CONG CHUNG • 2026</Text>
                    </YStack>
                </YStack>

            </YStack>
        </ScrollView>
    )
}

const SectionHeader = ({ num, title }: any) => (
    <XStack alignItems="center" gap="$6" marginVertical="$20">
        <Text color="#4E85BF" fontSize={24} fontWeight="900" letterSpacing={4}>{num}</Text>
        <Text color="white" fontSize={48} fontWeight="800" letterSpacing={2}>{title}</Text>
        <View flex={1} height={2} backgroundColor="#1a1a1a" />
    </XStack>
)

const BigChapterItem = ({ title, desc }: any) => (
    <YStack flex={1} minWidth={350} gap="$4">
        <Text color="white" fontSize={32} fontWeight="800">{title}</Text>
        <Text color="#777" fontSize={20} lineHeight={32}>{desc}</Text>
    </YStack>
)

const ArchSlideStep = ({ icon, label, desc, tech }: any) => (
    <YStack flex={1} minWidth={250} gap="$3">
        <XStack alignItems="center" gap="$4">
            <View>{icon}</View>
            <Text color="white" fontWeight="800" fontSize={24}>{label}</Text>
        </XStack>
        <Text color="#555" fontSize={18}>{desc}</Text>
        <Text color="#4E85BF" fontSize={14} fontWeight="800">{tech.toUpperCase()}</Text>
    </YStack>
)

const LargeInfoCard = ({ title, items }: any) => (
    <YStack flex={1} minWidth={300} padding="$10" backgroundColor="rgba(255,255,255,0.02)" borderRadius={32} gap="$6">
        <Text color="white" fontSize={24} fontWeight="800" borderBottomWidth={1} borderColor="#222" paddingBottom="$4">{title}</Text>
        {items.map((item: string) => (
            <XStack key={item} gap="$4" alignItems="center">
                <CheckCircle2 size={20} color="#22c55e" />
                <Text color="#888" fontSize={18}>{item}</Text>
            </XStack>
        ))}
    </YStack>
)

const BigTechCard = ({ icon, title, desc }: any) => (
    <YStack width={media.gtMd ? "calc(33.33% - 16px)" : "100%"} padding="$10" className="glass-card" borderRadius={32} gap="$4">
        <View>{icon}</View>
        <Text color="white" fontWeight="800" fontSize={28}>{title}</Text>
        <Text color="#555" fontSize={16} lineHeight={24}>{desc}</Text>
    </YStack>
)

const UseCaseSlide = ({ role, desc, icon }: any) => (
    <YStack flex={1} minWidth={300} gap="$5">
        <XStack alignItems="center" gap="$4">
            <View padding="$4" backgroundColor="rgba(255,255,255,0.05)" borderRadius={20}>{icon}</View>
            <Text color="white" fontSize={28} fontWeight="800">{role}</Text>
        </XStack>
        <Text color="#666" fontSize={18} lineHeight={28}>{desc}</Text>
    </YStack>
)

const BigModuleBox = ({ title, desc, isMobile }: any) => (
    <YStack flex={1} minWidth={isMobile ? "100%" : 450} padding="$12" className="glass-card" borderRadius={40} gap="$6">
        <Text color="white" fontSize={36} fontWeight="800">{title}</Text>
        <Text color="#777" fontSize={20} lineHeight={32}>{desc}</Text>
    </YStack>
)

const SlideMetric = ({ label, value }: any) => (
    <YStack gap="$2">
        <Text color="#555" fontSize={14} fontWeight="800" letterSpacing={3}>{label.toUpperCase()}</Text>
        <Text color="white" fontSize={56} fontWeight="100">{value}</Text>
    </YStack>
)

// Simplified placeholder for inner components logic
const isMobile = false; 
const media = { gtMd: true }; // Placeholder
