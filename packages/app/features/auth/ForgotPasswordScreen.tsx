"use client"
import React, { useState } from 'react'
import { YStack, XStack, Text, Input, Button, Card, View, Label, H2, Image, ScrollView, AnimatePresence } from 'tamagui'
import { Mail, ArrowRight, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, ChevronLeft } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import { apiForgotPassword, apiResetPassword } from '../../services/auth.api'
import LogoAsset from '../../assets/logo.svg'

const COLORS: any = {
  green: '#28a745', bgDark: '#0a0f0d', cardBg: '#111613',
  borderDark: '#1a221e', textGray: '#888', inputBg: '#151a17', errorRed: '#ff4d4d',
}
const FONT_BODY = 'var(--font-be-vietnam), sans-serif' as any
const STRONG_PASS = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

export const ForgotPasswordScreen = () => {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [otp, setOtp] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const getImageUrl = (asset: any) => {
    if (typeof asset === 'string') return asset
    return asset?.src || asset?.default?.src || asset
  }

  const handleSendOtp = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.")
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiForgotPassword(email)
      // Server trả về username để dùng ở bước reset
      if (res.username) setUsername(res.username)
      setStep('otp')
    } catch (e: any) {
      setError(e.message || "Yêu cầu thất bại.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!otp || otp.length !== 6) { setError("Vui lòng nhập OTP 6 chữ số."); return }
    if (!STRONG_PASS.test(newPass)) {
      setError("Mật khẩu phải dài ≥8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.")
      return
    }
    if (newPass !== confirmPass) { setError("Mật khẩu xác nhận không khớp."); return }
    setLoading(true)
    setError('')
    try {
      await apiResetPassword(username, otp, newPass)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (e: any) {
      setError(e.message || "Đặt lại mật khẩu thất bại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View flex={1} backgroundColor={COLORS.bgDark}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" py="$10">

          {/* BG Glow */}
          <View position="absolute" top="-10%" left="-5%" width={500} height={500}
            backgroundColor="#f4a261" opacity={0.04} borderRadius={250}
            style={{ filter: 'blur(100px)' } as any}
          />

          {/* LOGO */}
          <YStack alignItems="center" marginBottom="$8" gap="$3">
            <Image src={getImageUrl(LogoAsset) as any} width={220} height={70} alt="Phui Score Logo" style={{ objectFit: 'contain' } as any} />
            <View backgroundColor={COLORS.green} height={2} width={40} borderRadius={1} />
          </YStack>

          <Card
            {...({ animation: "bouncy", enterStyle: { opacity: 0, scale: 0.95, y: 20 } } as any)}
            width="100%" maxWidth={480} padding="$10" $ltSm={{ padding: "$6" } as any}
            borderRadius="$12" borderWidth={1} borderColor={COLORS.borderDark}
            backgroundColor={COLORS.cardBg} elevation={25}
          >
            {step === 'email' ? (
              /* ─── BƯỚC 1: NHẬP EMAIL ─── */
              <YStack gap="$7">
                <YStack alignItems="center" gap="$3">
                  <View width={72} height={72} borderRadius={36}
                    backgroundColor="rgba(244,162,97,0.12)"
                    justifyContent="center" alignItems="center"
                    borderWidth={1} borderColor="rgba(244,162,97,0.3)"
                  >
                    <Mail size={36} color={"#f4a261" as any} />
                  </View>
                  <H2 color="white" fontWeight="900" fontSize={28} fontFamily={FONT_BODY} textAlign="center">Quên mật khẩu?</H2>
                  <Text color={COLORS.textGray} fontSize={14} fontWeight="600" textAlign="center" fontFamily={FONT_BODY} lineHeight={22 as any}>
                    Nhập email bạn đã đăng ký. Chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
                  </Text>
                </YStack>

                <YStack gap="$2">
                  <Label color={COLORS.textGray} fontSize={11} fontWeight="900" letterSpacing={1} fontFamily={FONT_BODY} marginLeft="$1">ĐỊA CHỈ EMAIL</Label>
                  <XStack backgroundColor={COLORS.inputBg} borderRadius="$6" borderWidth={1}
                    borderColor={error ? COLORS.errorRed : COLORS.borderDark}
                    alignItems="center" paddingHorizontal="$4"
                  >
                    <Mail size={18} color={COLORS.textGray as any} />
                    <Input
                      flex={1} marginLeft="$3" borderWidth={0} backgroundColor="transparent"
                      color="white" height={52} fontSize={15} fontWeight="600" fontFamily={FONT_BODY}
                      placeholderTextColor={"#333" as any} placeholder="email@example.com"
                      focusStyle={{ outlineWidth: 0 } as any}
                      value={email}
                      onChange={(e: any) => { setEmail(e.target.value); setError('') }}
                    />
                  </XStack>
                  {error && <Text color={COLORS.errorRed} fontSize={12} fontWeight="700" marginLeft="$1">{error}</Text>}
                </YStack>

                <Button
                  backgroundColor="#f4a261" borderRadius="$10" height={56} unstyled
                  flexDirection="row" justifyContent="center" alignItems="center" gap="$2"
                  onPress={handleSendOtp} opacity={loading ? 0.7 : 1} disabled={loading}
                  hoverStyle={{ backgroundColor: '#e76f51' } as any}
                >
                  <Text color="white" fontWeight="900" fontSize={16} fontFamily={FONT_BODY} letterSpacing={1}>
                    {loading ? "ĐANG GỬI..." : "GỬI MÃ OTP"}
                  </Text>
                  {!loading && <ArrowRight size={20} color="white" />}
                </Button>

                <Button unstyled onPress={() => router.push('/login')} flexDirection="row" justifyContent="center" alignItems="center" gap="$1">
                  <ChevronLeft size={16} color={COLORS.textGray as any} />
                  <Text color={COLORS.textGray} fontSize={13} fontWeight="600" fontFamily={FONT_BODY} hoverStyle={{ color: 'white' } as any}>
                    Quay lại đăng nhập
                  </Text>
                </Button>
              </YStack>
            ) : (
              /* ─── BƯỚC 2: NHẬP OTP + MẬT KHẨU MỚI ─── */
              <YStack gap="$6">
                <YStack alignItems="center" gap="$2">
                  <View width={72} height={72} borderRadius={36}
                    backgroundColor="rgba(40,167,69,0.12)"
                    justifyContent="center" alignItems="center"
                    borderWidth={1} borderColor="rgba(40,167,69,0.3)"
                  >
                    <ShieldCheck size={36} color={COLORS.green as any} />
                  </View>
                  <H2 color="white" fontWeight="900" fontSize={26} fontFamily={FONT_BODY} textAlign="center">Đặt lại mật khẩu</H2>
                  <Text color={COLORS.textGray} fontSize={13} textAlign="center" fontFamily={FONT_BODY} lineHeight={20 as any}>
                    Nhập mã OTP gửi đến <Text color="white" fontWeight="800">{email}</Text>{'\n'}và mật khẩu mới của bạn.
                  </Text>
                </YStack>

                {/* OTP */}
                <YStack gap="$2">
                  <Label color={COLORS.textGray} fontSize={11} fontWeight="900" letterSpacing={1} fontFamily={FONT_BODY} marginLeft="$1">MÃ OTP</Label>
                  <XStack backgroundColor={COLORS.inputBg} borderRadius="$6" borderWidth={1}
                    borderColor={COLORS.borderDark} alignItems="center" paddingHorizontal="$4"
                  >
                    <ShieldCheck size={18} color={COLORS.textGray as any} />
                    <Input
                      flex={1} marginLeft="$3" borderWidth={0} backgroundColor="transparent"
                      color="white" height={56} fontSize={28} fontWeight="800" letterSpacing={8}
                      textAlign="center" fontFamily={FONT_BODY} placeholderTextColor={"#333" as any}
                      placeholder="______" maxLength={6}
                      focusStyle={{ outlineWidth: 0 } as any}
                      value={otp}
                      onChange={(e: any) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </XStack>
                </YStack>

                {/* New pass */}
                <YStack gap="$2">
                  <Label color={COLORS.textGray} fontSize={11} fontWeight="900" letterSpacing={1} fontFamily={FONT_BODY} marginLeft="$1">MẬT KHẨU MỚI</Label>
                  <XStack backgroundColor={COLORS.inputBg} borderRadius="$6" borderWidth={1}
                    borderColor={COLORS.borderDark} alignItems="center" paddingHorizontal="$4"
                  >
                    <Lock size={18} color={COLORS.textGray as any} />
                    <Input
                      flex={1} marginLeft="$3" borderWidth={0} backgroundColor="transparent"
                      color="white" height={52} fontSize={15} fontWeight="600" fontFamily={FONT_BODY}
                      placeholderTextColor={"#333" as any} placeholder="Mật khẩu mới"
                      type={showPass ? 'text' : 'password'}
                      focusStyle={{ outlineWidth: 0 } as any}
                      value={newPass}
                      onChange={(e: any) => setNewPass(e.target.value)}
                    />
                    <Button unstyled onPress={() => setShowPass(v => !v)} p="$2">
                      {showPass ? <EyeOff size={18} color={COLORS.textGray as any} /> : <Eye size={18} color={COLORS.textGray as any} />}
                    </Button>
                  </XStack>
                </YStack>

                {/* Confirm pass */}
                <YStack gap="$2">
                  <Label color={COLORS.textGray} fontSize={11} fontWeight="900" letterSpacing={1} fontFamily={FONT_BODY} marginLeft="$1">XÁC NHẬN MẬT KHẨU MỚI</Label>
                  <XStack backgroundColor={COLORS.inputBg} borderRadius="$6" borderWidth={1}
                    borderColor={COLORS.borderDark} alignItems="center" paddingHorizontal="$4"
                  >
                    <Lock size={18} color={COLORS.textGray as any} />
                    <Input
                      flex={1} marginLeft="$3" borderWidth={0} backgroundColor="transparent"
                      color="white" height={52} fontSize={15} fontWeight="600" fontFamily={FONT_BODY}
                      placeholderTextColor={"#333" as any} placeholder="Nhập lại mật khẩu mới"
                      type={showConfirmPass ? 'text' : 'password'}
                      focusStyle={{ outlineWidth: 0 } as any}
                      value={confirmPass}
                      onChange={(e: any) => setConfirmPass(e.target.value)}
                    />
                    <Button unstyled onPress={() => setShowConfirmPass(v => !v)} p="$2">
                      {showConfirmPass ? <EyeOff size={18} color={COLORS.textGray as any} /> : <Eye size={18} color={COLORS.textGray as any} />}
                    </Button>
                  </XStack>
                </YStack>

                {error && <Text color={COLORS.errorRed} fontSize={12} fontWeight="700" textAlign="center">{error}</Text>}

                <Button
                  backgroundColor={COLORS.green} borderRadius="$10" height={56} unstyled
                  flexDirection="row" justifyContent="center" alignItems="center" gap="$2"
                  onPress={handleResetPassword} opacity={loading ? 0.7 : 1} disabled={loading}
                  hoverStyle={{ backgroundColor: '#1e7e34' } as any}
                >
                  <Text color="white" fontWeight="900" fontSize={16} fontFamily={FONT_BODY} letterSpacing={1}>
                    {loading ? "ĐANG XỬ LÝ..." : "ĐẶT LẠI MẬT KHẨU"}
                  </Text>
                </Button>

                <Button unstyled onPress={() => setStep('email')} flexDirection="row" justifyContent="center" alignItems="center" gap="$1">
                  <ChevronLeft size={16} color={COLORS.textGray as any} />
                  <Text color={COLORS.textGray} fontSize={13} fontWeight="600" fontFamily={FONT_BODY}>Nhập lại email khác</Text>
                </Button>
              </YStack>
            )}
          </Card>

          <Text color="#222" fontSize={12} marginTop="$8" fontWeight="800" fontFamily={FONT_BODY}>© 2026 PHỦI SCORE • IUH IT STUDENT PROJECT</Text>
        </YStack>
      </ScrollView>

      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {success && (
          <View key="success" position="absolute" top={50} left={0} right={0} alignItems="center" zIndex={1000}
            {...({ animation: "bouncy", enterStyle: { opacity: 0, y: -20 }, exitStyle: { opacity: 0, y: -20 } } as any)}
          >
            <Card backgroundColor={COLORS.green} paddingVertical="$3" paddingHorizontal="$5" borderRadius="$10" elevation={15} flexDirection="row" alignItems="center" gap="$3">
              <CheckCircle2 size={24} color="white" />
              <Text color="white" fontWeight="800" fontSize={15} fontFamily={FONT_BODY}>🎉 Đặt lại mật khẩu thành công! Đang chuyển đến đăng nhập...</Text>
            </Card>
          </View>
        )}
      </AnimatePresence>
    </View>
  )
}
