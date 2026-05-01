"use client"
import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, Input, Button, Card, View, Label, H2, Image, ScrollView, AnimatePresence } from 'tamagui'
import { Eye, EyeOff, ArrowRight, Facebook, Chrome, User, Lock, LogIn, CheckCircle2 } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'

// 1. IMPORT LOGO ASSET
import LogoAsset from '../../assets/logo.svg' 
import { API_BASE } from '../../utils/api-config'

const COLORS: any = {
  green: '#28a745',
  greenGlow: 'rgba(40, 167, 69, 0.15)',
  bgDark: '#0a0f0d',
  cardBg: '#111613',
  borderDark: '#1a221e',
  textGray: '#888',
  inputBg: '#151a17',
  errorRed: '#ff4d4d',
  facebook: '#1877F2',
  google: '#DB4437'
}

const FONT_BODY = 'var(--font-be-vietnam), sans-serif' as any

export const LoginScreen = () => {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [formData, setFormData] = useState({ username: '', password: '' })

  // Xử lý chuyển hướng sau khi đăng nhập thành công 2s
 useEffect(() => {
  if (showSuccessPopup) {
    const timer = setTimeout(() => {
      setShowSuccessPopup(false)
      window.location.href = '/' 
      
    }, 2000)
    return () => clearTimeout(timer)
  }
}, [showSuccessPopup])

  const getImageUrl = (asset: any) => {
    if (typeof asset === 'string') return asset
    return asset?.src || asset?.default?.src || asset
  }

  const validate = () => {
    let newErrors: any = {}
    if (!formData.username.trim()) newErrors.username = "Vui lòng nhập tên đăng nhập."
    if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu."
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // --- LOGIC KẾT NỐI BACKEND ---
  const handleLogin = async () => {
    if (!validate()) return

    setLoading(true)
    const API = API_BASE
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Lưu token và thông tin user vào localStorage để đồng bộ Header
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user)) 
        setShowSuccessPopup(true)
      } else {
        // Hiển thị lỗi tổng quát từ server (sai pass/user)
        setErrors({ global: data.message || "Tài khoản hoặc mật khẩu không chính xác." })
      }
    } catch (error) {
      setErrors({ global: "Lỗi kết nối hệ thống. Vui lòng thử lại sau." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View flex={1} backgroundColor={COLORS.bgDark as any}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 } as any}>
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" py="$10">
          
          {/* Hiệu ứng Glow nền */}
          <View 
            position="absolute" top="-10%" left="-5%" width={500 as any} height={500 as any} 
            backgroundColor={COLORS.green as any} opacity={0.05 as any} borderRadius={250 as any} style={{ filter: 'blur(100px)' } as any} 
          />

          {/* BRANDING */}
          <YStack alignItems="center" marginBottom="$8" gap="$3">
            <Image src={getImageUrl(LogoAsset) as any} width={220 as any} height={70 as any} alt="Phui Score Logo" resizeMode="contain" />
            <View backgroundColor={COLORS.green as any} height={2 as any} width={40 as any} borderRadius={1 as any} />
            <Text color={COLORS.textGray as any} fontSize={14 as any} fontWeight="800" letterSpacing={3 as any} fontFamily={FONT_BODY}>
              HỆ THỐNG QUẢN LÝ BÓNG ĐÁ PHONG TRÀO
            </Text>
          </YStack>

          {/* LOGIN CARD */}
          <Card
            {...({ 
              animation: "bouncy", 
              enterStyle: { opacity: 0, scale: 0.95, y: 20 } 
            } as any)}
            width="100%" maxWidth={480 as any} 
            padding="$10" $ltSm={{ padding: "$6" } as any}
            borderRadius="$12" borderWidth={1 as any} borderColor={COLORS.borderDark as any}
            backgroundColor={COLORS.cardBg as any}
            elevation={25 as any} shadowColor={"black" as any} shadowRadius={50 as any}
          >
            <YStack gap="$7">
              
              <YStack alignItems="center" gap="$2">
                <H2 color="white" fontWeight="900" fontSize={32 as any} fontFamily={FONT_BODY} letterSpacing={-1 as any}>
                  Đăng nhập
                </H2>
                <Text color={COLORS.textGray as any} fontSize={15 as any} fontWeight="600" textAlign="center" fontFamily={FONT_BODY}>
                  Tiếp tục hành trình chinh phục sân cỏ
                </Text>
              </YStack>

              <YStack gap="$5">
                <InputField 
                  label="TÊN ĐĂNG NHẬP" 
                  error={errors.username}
                  iconLeft={<User size={18} color={COLORS.textGray as any}/>}
                  placeholder="Nhập tên đăng nhập" value={formData.username}
                  onChangeText={(t: string) => setFormData({...formData, username: t})}
                />

                <InputField 
                  label="MẬT KHẨU" 
                  error={errors.password}
                  iconLeft={<Lock size={18} color={COLORS.textGray as any}/>}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••" value={formData.password}
                  onChangeText={(t: string) => setFormData({...formData, password: t})}
                  iconRight={
                    <Button unstyled onPress={() => setShowPass(v => !v)} p="$2">
                      {showPass ? <EyeOff size={18} color={COLORS.textGray as any}/> : <Eye size={18} color={COLORS.textGray as any}/>}
                    </Button>
                  }
                />
                
                {/* HIỂN THỊ LỖI TỔNG HỢP */}
                {errors.global && (
                  <Text color={COLORS.errorRed as any} fontSize={12 as any} fontWeight="700" textAlign="center">
                    {errors.global}
                  </Text>
                )}

                <XStack justifyContent="flex-end">
                  <Text color={COLORS.green as any} fontSize={13 as any} fontWeight="700" fontFamily={FONT_BODY} cursor="pointer" hoverStyle={{ opacity: 0.8 } as any}>
                    Quên mật khẩu?
                  </Text>
                </XStack>
              </YStack>

              <Button
                backgroundColor={COLORS.green as any} borderRadius="$10" height={58 as any} unstyled
                flexDirection="row" justifyContent="center" alignItems="center" gap="$2"
                onPress={handleLogin}
                opacity={loading ? 0.7 : 1 as any} disabled={loading}
                hoverStyle={{ backgroundColor: '#1e7e34', scale: 1.01 } as any}
                pressStyle={{ scale: 0.98 } as any}
                shadowColor={COLORS.green as any} shadowRadius={20 as any} shadowOpacity={0.2 as any}
              >
                <Text color="white" fontWeight="900" fontSize={16 as any} fontFamily={FONT_BODY} letterSpacing={1 as any}>
                  {loading ? "ĐANG XÁC THỰC..." : "ĐĂNG NHẬP NGAY"}
                </Text>
                {!loading && <LogIn size={20} color={"white" as any}/>}
              </Button>

              {/* SOCIAL LOGIN */}
              <YStack gap="$4">
                <XStack alignItems="center" gap="$3">
                  <View height={1 as any} flex={1} backgroundColor={COLORS.borderDark as any} />
                  <Text color={COLORS.textGray as any} fontSize={12 as any} fontWeight="800" fontFamily={FONT_BODY}>HOẶC ĐĂNG NHẬP VỚI</Text>
                  <View height={1 as any} flex={1} backgroundColor={COLORS.borderDark as any} />
                </XStack>
                <XStack gap="$3">
                  <SocialButton icon={<Chrome size={18} color={COLORS.google as any}/>} label="Google" />
                  <SocialButton icon={<Facebook size={18} color={COLORS.facebook as any}/>} label="Facebook" />
                </XStack>
              </YStack>

              <XStack justifyContent="center" gap="$2">
                <Text color={COLORS.textGray as any} fontSize={14 as any} fontWeight="600" fontFamily={FONT_BODY}>Chưa có tài khoản?</Text>
                <Text 
                  color={COLORS.green as any} fontSize={14 as any} fontWeight="900" cursor="pointer" 
                  fontFamily={FONT_BODY} hoverStyle={{ textDecorationLine: 'underline' } as any}
                  onPress={() => router.push('/register' as any)} // Chuyển hướng về trang đăng ký
                >
                  Đăng ký ngay
                </Text>
              </XStack>

            </YStack>
          </Card>

          <Text color="#222" fontSize={12 as any} marginTop="$8" fontWeight="800" fontFamily={FONT_BODY}>
            © 2026 PHỦI SCORE • IUH IT STUDENT PROJECT
          </Text>
        </YStack>
      </ScrollView>

      {/* SUCCESS POPUP (TOAST) */}
      <AnimatePresence>
        {showSuccessPopup && (
          <View 
            key="success-popup" 
            position="absolute" top={50 as any} left={0} right={0} alignItems="center" zIndex={1000}
            {...({ 
              animation: "bouncy", 
              enterStyle: { opacity: 0, y: -20 }, 
              exitStyle: { opacity: 0, y: -20 } 
            } as any)}
          >
            <Card backgroundColor={COLORS.green as any} paddingVertical="$3" paddingHorizontal="$5" borderRadius="$10" elevation={15 as any} flexDirection="row" alignItems="center" gap="$3">
              <CheckCircle2 size={24} color={"white" as any} />
              <Text color="white" fontWeight="800" fontSize={16 as any} fontFamily={FONT_BODY}>Đăng nhập thành công! Đang vào sân...</Text>
            </Card>
          </View>
        )}
      </AnimatePresence>
    </View>
  )
}

/* COMPONENT CON: INPUT FIELD */
const InputField = ({ label, error, iconLeft, iconRight, ...props }: any) => (
  <YStack gap="$1.5">
    <Label color={COLORS.textGray} fontSize={11 as any} fontWeight="900" letterSpacing={1 as any} fontFamily={FONT_BODY} marginLeft="$1">{label}</Label>
    <XStack 
      backgroundColor={COLORS.inputBg} 
      borderRadius="$6" 
      borderWidth={1 as any} 
      borderColor={error ? COLORS.errorRed : COLORS.borderDark}
      alignItems="center" 
      paddingHorizontal="$4" 
      focusStyle={{ borderColor: COLORS.green, backgroundColor: '#1a1f1c' } as any}
    >
      {iconLeft && <View marginRight="$3">{iconLeft}</View>}
      <Input flex={1} borderWidth={0} backgroundColor="transparent" color="white" height={50 as any} fontSize={15 as any} fontWeight="600" fontFamily={FONT_BODY} placeholderTextColor="#333" focusStyle={{ outlineWidth: 0 } as any} onChange={(e: any) => props.onChangeText?.(e.target.value)} {...props} />
      {iconRight}
    </XStack>
    {error && <Text color={COLORS.errorRed as any} fontSize={11 as any} fontWeight="700" marginLeft="$1" marginTop="$0.5">{error}</Text>}
  </YStack>
)

/* COMPONENT CON: SOCIAL BUTTON */
const SocialButton = ({ icon, label }: any) => (
  <Button flex={1} height={50 as any} backgroundColor={COLORS.inputBg as any} borderWidth={1 as any} borderColor={COLORS.borderDark as any} unstyled flexDirection="row" justifyContent="center" alignItems="center" gap="$2" borderRadius="$6" hoverStyle={{ backgroundColor: COLORS.borderDark, borderColor: '#333' } as any}>
    {icon}
    <Text color="white" fontWeight="700" fontSize={14 as any} fontFamily={FONT_BODY}>{label}</Text>
  </Button>
)