"use client"
import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, Input, Button, Card, View, Label, H2, Image, ScrollView, AnimatePresence } from 'tamagui'
import { Eye, EyeOff, ArrowRight, Gift, Facebook, Chrome, User, Lock, Mail, Phone, Contact, CheckCircle2 } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'

// Import Logo Asset chuẩn
import LogoAsset from '../../assets/logo.svg' 

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

export const RegisterScreen = () => {
  const router = useRouter()
  const [role, setRole] = useState('USER') 
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  
  const [errors, setErrors] = useState<any>({})
  const [formData, setFormData] = useState({ 
    fullName: '', email: '', phoneNumber: '', username: '', password: '', confirmPassword: '' 
  })

  // Điều hướng sau 2 giây khi đăng ký thành công
  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        setShowSuccessPopup(false)
        router.push('/login')
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
    if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Định dạng Email không hợp lệ."
    if (formData.phoneNumber.length < 10) newErrors.phoneNumber = "Số điện thoại không hợp lệ."
    if (!formData.username.trim()) newErrors.username = "Vui lòng nhập tên đăng nhập."
    
    const passRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    if (!passRegex.test(formData.password)) {
      newErrors.password = "Mật khẩu tối thiểu 8 ký tự, bao gồm cả chữ và số."
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu không trùng khớp."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validate()) return
    setLoading(true)
    const API = process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }) 
      })
      if (response.ok) {
        setShowSuccessPopup(true)
      } else {
        const data = await response.json()
        setErrors({ username: data.message || "Tên đăng nhập đã tồn tại." })
      }
    } catch (error) {
      setErrors({ global: "Lỗi kết nối hệ thống. Vui lòng thử lại sau." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View flex={1} backgroundColor={COLORS.bgDark}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" py="$10">
          
          <View position="absolute" top="-5%" right="-5%" width={500} height={500} backgroundColor={COLORS.green} opacity={0.05} borderRadius={250} style={{ filter: 'blur(100px)' } as any} />

          {/* BRANDING */}
          <YStack alignItems="center" marginBottom="$8" gap="$3">
            <Image src={getImageUrl(LogoAsset) as any} width={240} height={75} alt="Phui Score Logo" resizeMode="contain" />
            <View backgroundColor={COLORS.green} height={2} width={40} borderRadius={1} />
            <Text color={COLORS.textGray} fontSize={14} fontWeight="800" letterSpacing={3} fontFamily={FONT_BODY}>HỆ THỐNG QUẢN LÝ BÓNG ĐÁ PHONG TRÀO</Text>
          </YStack>

          {/* MAIN CARD - ĐÃ BỌC AS ANY CHO ANIMATION */}
          <Card
            {...({ 
              animation: "bouncy", 
              enterStyle: { opacity: 0, scale: 0.95, y: 20 } 
            } as any)}
            width="100%" maxWidth={580} padding="$10" $ltSm={{ padding: "$6" } as any}
            borderRadius="$12" borderWidth={1} borderColor={COLORS.borderDark} backgroundColor={COLORS.cardBg} elevation={25}
          >
            <YStack gap="$7">
              <YStack alignItems="center" gap="$2">
                <H2 color="white" fontWeight="900" fontSize={32} fontFamily={FONT_BODY}>Đăng ký tài khoản</H2>
                <Text color={COLORS.textGray} fontSize={15} fontWeight="600" textAlign="center" fontFamily={FONT_BODY}>Vui lòng hoàn tất các thông tin bên dưới</Text>
              </YStack>

              {/* ROLE TOGGLE */}
              <XStack backgroundColor={COLORS.inputBg} p="$1.5" borderRadius="$10" borderWidth={1} borderColor={COLORS.borderDark} height={58}>
                <Button flex={1} unstyled borderRadius="$8" backgroundColor={(role === 'USER' ? COLORS.green : 'transparent') as any} onPress={() => setRole('USER')} justifyContent="center" alignItems="center">
                  <Text color={(role === 'USER' ? 'white' : COLORS.textGray) as any} fontWeight="900" fontSize={14} fontFamily={FONT_BODY}>CẦU THỦ</Text>
                </Button>
                <Button flex={1} unstyled borderRadius="$8" backgroundColor={(role === 'MANAGER' ? COLORS.green : 'transparent') as any} onPress={() => setRole('MANAGER')} justifyContent="center" alignItems="center">
                  <Text color={(role === 'MANAGER' ? 'white' : COLORS.textGray) as any} fontWeight="900" fontSize={14} fontFamily={FONT_BODY}>ĐỘI TRƯỞNG</Text>
                </Button>
                <Button flex={1} unstyled borderRadius="$8" backgroundColor={(role === 'MEDIA' ? COLORS.green : 'transparent') as any} onPress={() => setRole('MEDIA')} justifyContent="center" alignItems="center">
                  <Text color={(role === 'MEDIA' ? 'white' : COLORS.textGray) as any} fontWeight="900" fontSize={14} fontFamily={FONT_BODY}>MEDIA</Text>
                </Button>
              </XStack>

              {/* INPUTS SECTION */}
              <YStack gap="$4">
                <InputField label="HỌ VÀ TÊN" error={errors.fullName} iconLeft={<Contact size={18} color={COLORS.textGray as any}/>} placeholder="Nhập họ và tên" value={formData.fullName} onChangeText={(t: string) => setFormData({...formData, fullName: t})} />
                <InputField label="EMAIL" error={errors.email} iconLeft={<Mail size={18} color={COLORS.textGray as any}/>} placeholder="email@example.com" value={formData.email} onChangeText={(t: string) => setFormData({...formData, email: t})} keyboardType="email-address" />
                <InputField label="SỐ ĐIỆN THOẠI" error={errors.phoneNumber} iconLeft={<Phone size={18} color={COLORS.textGray as any}/>} placeholder="Nhập số điện thoại" value={formData.phoneNumber} onChangeText={(t: string) => setFormData({...formData, phoneNumber: t})} keyboardType="phone-pad" />
                
                <View height={1} backgroundColor={COLORS.borderDark} marginVertical="$2" />
                
                <InputField label="TÊN ĐĂNG NHẬP" error={errors.username} iconLeft={<User size={18} color={COLORS.textGray as any}/>} placeholder="Nhập tên đăng nhập" value={formData.username} onChangeText={(t: string) => setFormData({...formData, username: t})} />
                
                <InputField 
                  label="MẬT KHẨU" error={errors.password} iconLeft={<Lock size={18} color={COLORS.textGray as any}/>} 
                  type={showPass ? "text" : "password"} 
                  placeholder="••••••••" value={formData.password} 
                  onChangeText={(t: string) => setFormData({...formData, password: t})} 
                  iconRight={
                    <Button unstyled onPress={() => setShowPass(v => !v)} p="$2">
                      {showPass ? <EyeOff size={18} color={COLORS.textGray as any}/> : <Eye size={18} color={COLORS.textGray as any}/>}
                    </Button>
                  } 
                />
                
                <InputField 
                  label="XÁC NHẬN MẬT KHẨU" error={errors.confirmPassword} iconLeft={<Lock size={18} color={COLORS.textGray as any}/>} 
                  type={showConfirmPass ? "text" : "password"} 
                  placeholder="••••••••" value={formData.confirmPassword} 
                  onChangeText={(t: string) => setFormData({...formData, confirmPassword: t})} 
                  iconRight={
                    <Button unstyled onPress={() => setShowConfirmPass(v => !v)} p="$2">
                      {showConfirmPass ? <EyeOff size={18} color={COLORS.textGray as any}/> : <Eye size={18} color={COLORS.textGray as any}/>}
                    </Button>
                  } 
                />
              </YStack>

              {errors.global && <Text color={COLORS.errorRed} fontSize={12} textAlign="center" fontWeight="700">{errors.global}</Text>}

              {/* REGISTER BUTTON */}
              <Button backgroundColor={COLORS.green} borderRadius="$10" height={58} unstyled flexDirection="row" justifyContent="center" alignItems="center" gap="$2" onPress={handleRegister} opacity={loading ? 0.7 : 1} disabled={loading} hoverStyle={{ backgroundColor: '#1e7e34', scale: 1.01 } as any}>
                <Text color="white" fontWeight="900" fontSize={16} fontFamily={FONT_BODY} letterSpacing={1}>{loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐĂNG KÝ"}</Text>
                {!loading && <ArrowRight size={20} color="white"/>}
              </Button>

              {/* SOCIAL LOGIN */}
              <YStack gap="$4">
                <XStack alignItems="center" gap="$3">
                  <View height={1} flex={1} backgroundColor={COLORS.borderDark} />
                  <Text color={COLORS.textGray} fontSize={12} fontWeight="800" fontFamily={FONT_BODY}>HOẶC ĐĂNG KÝ VỚI</Text>
                  <View height={1} flex={1} backgroundColor={COLORS.borderDark} />
                </XStack>
                <XStack gap="$3">
                  <SocialButton icon={<Chrome size={18} color={COLORS.google as any}/>} label="Google" />
                  <SocialButton icon={<Facebook size={18} color={COLORS.facebook as any}/>} label="Facebook" />
                </XStack>
              </YStack>

              <XStack justifyContent="center" gap="$2">
                <Text color={COLORS.textGray} fontSize={14} fontWeight="600" fontFamily={FONT_BODY}>Đã có tài khoản?</Text>
                <Text color={COLORS.green} fontSize={14} fontWeight="900" cursor="pointer" fontFamily={FONT_BODY} hoverStyle={{ textDecorationLine: 'underline' } as any} onPress={() => router.push('/login')}>Đăng nhập</Text>
              </XStack>
            </YStack>
          </Card>
          <Text color="#222" fontSize={12} marginTop="$8" fontWeight="800" fontFamily={FONT_BODY}>© 2026 PHỦI SCORE • IUH IT STUDENT PROJECT</Text>
        </YStack>
      </ScrollView>

      {/* SUCCESS POPUP (TOAST) */}
      <AnimatePresence>
        {showSuccessPopup && (
          <View key="success-popup" position="absolute" top={50} left={0} right={0} alignItems="center" zIndex={1000} {...({ animation: "bouncy", enterStyle: { opacity: 0, y: -20 }, exitStyle: { opacity: 0, y: -20 } } as any)}>
            <Card backgroundColor={COLORS.green} paddingVertical="$3" paddingHorizontal="$5" borderRadius="$10" elevation={15} flexDirection="row" alignItems="center" gap="$3">
              <CheckCircle2 size={24} color="white" />
              <Text color="white" fontWeight="800" fontSize={16} fontFamily={FONT_BODY}>Đăng ký thành công! Đang chuyển hướng...</Text>
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
    <Label color={COLORS.textGray} fontSize={11} fontWeight="900" letterSpacing={1} fontFamily={FONT_BODY} marginLeft="$1">{label}</Label>
    <XStack 
      backgroundColor={COLORS.inputBg} 
      borderRadius="$6" 
      borderWidth={1} 
      borderColor={error ? COLORS.errorRed : COLORS.borderDark}
      alignItems="center" 
      paddingHorizontal="$4" 
      focusStyle={{ borderColor: COLORS.green, backgroundColor: '#1a1f1c' } as any}
    >
      {iconLeft && <View marginRight="$3">{iconLeft}</View>}
      <Input flex={1} borderWidth={0} backgroundColor="transparent" color="white" height={50} fontSize={15} fontWeight="600" fontFamily={FONT_BODY} placeholderTextColor="#333" focusStyle={{ outlineWidth: 0 } as any} onChange={(e: any) => props.onChangeText?.(e.target.value)} {...props} />
      {iconRight}
    </XStack>
    {error && <Text color={COLORS.errorRed} fontSize={11} fontWeight="700" marginLeft="$1" marginTop="$0.5">{error}</Text>}
  </YStack>
)

/* COMPONENT CON: SOCIAL BUTTON */
const SocialButton = ({ icon, label }: any) => (
  <Button flex={1} height={50} backgroundColor={COLORS.inputBg} borderWidth={1} borderColor={COLORS.borderDark} unstyled flexDirection="row" justifyContent="center" alignItems="center" gap="$2" borderRadius="$6" hoverStyle={{ backgroundColor: COLORS.borderDark, borderColor: '#333' } as any}>
    {icon}
    <Text color="white" fontWeight="700" fontSize={14} fontFamily={FONT_BODY}>{label}</Text>
  </Button>
)