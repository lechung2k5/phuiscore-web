"use client"
import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, Input, Button, Card, View, Label, H2, Image, ScrollView, AnimatePresence } from 'tamagui'
import { Eye, EyeOff, ArrowRight, Gift, Facebook, Chrome, User, Lock, Mail, Phone, Contact, CheckCircle2, ShieldCheck } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import { apiRegister, apiVerifyEmail } from '../../services/auth.api'

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

// Mật khẩu mạnh: ít nhất 8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt
const STRONG_PASS = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

export const RegisterScreen = () => {
  const router = useRouter()
  const [role, setRole] = useState('USER') 
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  
  // Bước 1: điền form | Bước 2: xác minh OTP email
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [registeredUsername, setRegisteredUsername] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  const [errors, setErrors] = useState<any>({})
  const [formData, setFormData] = useState({ 
    fullName: '', email: '', phoneNumber: '', username: '', password: '', confirmPassword: '' 
  })

  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        setShowSuccessPopup(false)
        router.push('/login')
      }, 2500)
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
    if (!STRONG_PASS.test(formData.password)) {
      newErrors.password = "Mật khẩu phải dài ≥8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$...)."
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
    try {
      const res = await apiRegister({ ...formData, role } as any)
      // Đăng ký thành công → sang bước xác minh OTP
      setRegisteredUsername(res.username || formData.username)
      setStep('otp')
    } catch (error: any) {
      setErrors({ global: error.message || "Đăng ký thất bại. Vui lòng thử lại." })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setOtpError("Vui lòng nhập đúng mã OTP 6 chữ số.")
      return
    }
    setOtpLoading(true)
    setOtpError('')
    try {
      await apiVerifyEmail(registeredUsername, otp)
      setShowSuccessPopup(true)
    } catch (error: any) {
      setOtpError(error.message || "Mã OTP không đúng hoặc đã hết hạn.")
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <View flex={1} backgroundColor={COLORS.bgDark}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" py="$10">
          
          <View position="absolute" top="-5%" right="-5%" width={500} height={500} backgroundColor={COLORS.green} opacity={0.05} borderRadius={250} style={{ filter: 'blur(100px)' } as any} />

          {/* BRANDING */}
          <YStack alignItems="center" marginBottom="$8" gap="$3">
            <Image src={getImageUrl(LogoAsset) as any} width={240} height={75} alt="Phui Score Logo" style={{ objectFit: 'contain' } as any} />
            <View backgroundColor={COLORS.green} height={2} width={40} borderRadius={1} />
            <Text color={COLORS.textGray} fontSize={14} fontWeight="800" letterSpacing={3} fontFamily={FONT_BODY}>HỆ THỐNG QUẢN LÝ BÓNG ĐÁ PHONG TRÀO</Text>
          </YStack>

          {step === 'form' ? (
            /* ─── BƯỚC 1: FORM ĐĂNG KÝ ─── */
            <Card
              {...({ animation: "bouncy", enterStyle: { opacity: 0, scale: 0.95, y: 20 } } as any)}
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
                  <InputField label="EMAIL" error={errors.email} iconLeft={<Mail size={18} color={COLORS.textGray as any}/>} placeholder="email@example.com" value={formData.email} onChangeText={(t: string) => setFormData({...formData, email: t})} />
                  <InputField label="SỐ ĐIỆN THOẠI" error={errors.phoneNumber} iconLeft={<Phone size={18} color={COLORS.textGray as any}/>} placeholder="Nhập số điện thoại" value={formData.phoneNumber} onChangeText={(t: string) => setFormData({...formData, phoneNumber: t})} />
                  
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

                {/* Hint mật khẩu */}
                <View backgroundColor="#0d1f12" borderRadius="$4" padding="$3" borderWidth={1} borderColor="#1a3320">
                  <Text color={COLORS.textGray} fontSize={11} fontFamily={FONT_BODY} lineHeight={18 as any}>
                    🔒 Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa (A-Z), chữ thường (a-z), số (0-9) và ký tự đặc biệt (!@#$%...).
                  </Text>
                </View>

                {/* REGISTER BUTTON */}
                <Button backgroundColor={COLORS.green} borderRadius="$10" height={58} unstyled flexDirection="row" justifyContent="center" alignItems="center" gap="$2" onPress={handleRegister} opacity={loading ? 0.7 : 1} disabled={loading} hoverStyle={{ backgroundColor: '#1e7e34', scale: 1.01 } as any}>
                  <Text color="white" fontWeight="900" fontSize={16} fontFamily={FONT_BODY} letterSpacing={1}>{loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐĂNG KÝ"}</Text>
                  {!loading && <ArrowRight size={20} color="white"/>}
                </Button>

                <XStack justifyContent="center" gap="$2">
                  <Text color={COLORS.textGray} fontSize={14} fontWeight="600" fontFamily={FONT_BODY}>Đã có tài khoản?</Text>
                  <Text color={COLORS.green} fontSize={14} fontWeight="900" cursor="pointer" fontFamily={FONT_BODY} hoverStyle={{ textDecorationLine: 'underline' } as any} onPress={() => router.push('/login')}>Đăng nhập</Text>
                </XStack>
              </YStack>
            </Card>
          ) : (
            /* ─── BƯỚC 2: XÁC MINH OTP EMAIL ─── */
            <Card
              {...({ animation: "bouncy", enterStyle: { opacity: 0, scale: 0.95, y: 20 } } as any)}
              width="100%" maxWidth={480} padding="$10" $ltSm={{ padding: "$6" } as any}
              borderRadius="$12" borderWidth={1} borderColor={COLORS.borderDark} backgroundColor={COLORS.cardBg} elevation={25}
            >
              <YStack gap="$7" alignItems="center">
                {/* Icon */}
                <View
                  width={80} height={80} borderRadius={40}
                  backgroundColor="rgba(40,167,69,0.12)"
                  justifyContent="center" alignItems="center"
                  borderWidth={1} borderColor="rgba(40,167,69,0.3)"
                >
                  <ShieldCheck size={40} color={COLORS.green as any} />
                </View>

                <YStack alignItems="center" gap="$2">
                  <H2 color="white" fontWeight="900" fontSize={28} fontFamily={FONT_BODY} textAlign="center">Xác minh Email</H2>
                  <Text color={COLORS.textGray} fontSize={14} fontWeight="600" textAlign="center" fontFamily={FONT_BODY} lineHeight={22 as any}>
                    Chúng tôi đã gửi mã OTP 6 chữ số đến email{'\n'}
                    <Text color="white" fontWeight="800">{formData.email}</Text>
                  </Text>
                </YStack>

                {/* OTP INPUT */}
                <YStack width="100%" gap="$2">
                  <Label color={COLORS.textGray} fontSize={11} fontWeight="900" letterSpacing={1} fontFamily={FONT_BODY} marginLeft="$1">MÃ XÁC MINH OTP</Label>
                  <XStack
                    backgroundColor={COLORS.inputBg}
                    borderRadius="$6"
                    borderWidth={1}
                    borderColor={otpError ? COLORS.errorRed : COLORS.borderDark}
                    alignItems="center"
                    paddingHorizontal="$4"
                    focusStyle={{ borderColor: COLORS.green } as any}
                  >
                    <ShieldCheck size={18} color={COLORS.textGray as any} />
                    <Input
                      flex={1}
                      marginLeft="$3"
                      borderWidth={0}
                      backgroundColor="transparent"
                      color="white"
                      height={58}
                      fontSize={28}
                      fontWeight="800"
                      letterSpacing={8}
                      textAlign="center"
                      fontFamily={FONT_BODY}
                      placeholderTextColor={"#333" as any}
                      placeholder="______"
                      maxLength={6}
                      focusStyle={{ outlineWidth: 0 } as any}
                      value={otp}
                      onChange={(e: any) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </XStack>
                  {otpError && <Text color={COLORS.errorRed} fontSize={12} fontWeight="700" marginLeft="$1">{otpError}</Text>}
                </YStack>

                <Text color={COLORS.textGray} fontSize={12} textAlign="center" fontFamily={FONT_BODY}>
                  ⏱️ Mã có hiệu lực trong 5 phút. Không nhận được? Kiểm tra thư mục Spam.
                </Text>

                {/* VERIFY BUTTON */}
                <Button
                  width="100%" backgroundColor={COLORS.green} borderRadius="$10" height={58} unstyled
                  flexDirection="row" justifyContent="center" alignItems="center" gap="$2"
                  onPress={handleVerifyOtp}
                  opacity={otpLoading ? 0.7 : 1} disabled={otpLoading}
                  hoverStyle={{ backgroundColor: '#1e7e34' } as any}
                >
                  <Text color="white" fontWeight="900" fontSize={16} fontFamily={FONT_BODY} letterSpacing={1}>
                    {otpLoading ? "ĐANG XÁC MINH..." : "KÍCH HOẠT TÀI KHOẢN"}
                  </Text>
                  {!otpLoading && <ShieldCheck size={20} color="white" />}
                </Button>

                <Button unstyled onPress={() => setStep('form')}>
                  <Text color={COLORS.textGray} fontSize={13} fontWeight="600" fontFamily={FONT_BODY} hoverStyle={{ color: 'white' } as any}>
                    ← Quay lại chỉnh sửa thông tin
                  </Text>
                </Button>
              </YStack>
            </Card>
          )}

          <Text color="#222" fontSize={12} marginTop="$8" fontWeight="800" fontFamily={FONT_BODY}>© 2026 PHỦI SCORE • IUH IT STUDENT PROJECT</Text>
        </YStack>
      </ScrollView>

      {/* SUCCESS POPUP */}
      <AnimatePresence>
        {showSuccessPopup && (
          <View key="success-popup" position="absolute" top={50} left={0} right={0} alignItems="center" zIndex={1000} {...({ animation: "bouncy", enterStyle: { opacity: 0, y: -20 }, exitStyle: { opacity: 0, y: -20 } } as any)}>
            <Card backgroundColor={COLORS.green} paddingVertical="$3" paddingHorizontal="$5" borderRadius="$10" elevation={15} flexDirection="row" alignItems="center" gap="$3">
              <CheckCircle2 size={24} color="white" />
              <Text color="white" fontWeight="800" fontSize={16} fontFamily={FONT_BODY}>🎉 Tài khoản đã kích hoạt! Đang chuyển đến đăng nhập...</Text>
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
      <Input flex={1} borderWidth={0} backgroundColor="transparent" color="white" height={50} fontSize={15} fontWeight="600" fontFamily={FONT_BODY} placeholderTextColor={"#333" as any} focusStyle={{ outlineWidth: 0 } as any} onChange={(e: any) => props.onChangeText?.(e.target.value)} {...props} />
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
