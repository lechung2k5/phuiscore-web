"use client"
import React, { useState } from 'react'
import { YStack, XStack, Text, Input, Button, Card, View, Label, H2, ScrollView, AnimatePresence } from 'tamagui'
import { Lock, Eye, EyeOff, CheckCircle2, ChevronLeft, KeyRound } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import { apiChangePassword } from '../../services/auth.api'

const COLORS: any = {
  green: '#28a745', bgDark: '#0a0f0d', cardBg: '#111613',
  borderDark: '#1a221e', textGray: '#888', inputBg: '#151a17', errorRed: '#ff4d4d',
}
const FONT_BODY = 'var(--font-be-vietnam), sans-serif' as any
const STRONG_PASS = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

export const ChangePasswordScreen = () => {
  const router = useRouter()
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = async () => {
    if (!oldPass) { setError("Vui lòng nhập mật khẩu hiện tại."); return }
    if (!STRONG_PASS.test(newPass)) {
      setError("Mật khẩu mới phải dài ≥8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.")
      return
    }
    if (newPass !== confirmPass) { setError("Xác nhận mật khẩu không khớp."); return }
    if (oldPass === newPass) { setError("Mật khẩu mới phải khác mật khẩu hiện tại."); return }

    setLoading(true)
    setError('')
    try {
      const res = await apiChangePassword(oldPass, newPass)
      // Cập nhật accessToken mới nếu server trả về
      if (res.accessToken) localStorage.setItem('accessToken', res.accessToken)
      setSuccess(true)
      setTimeout(() => router.push('/'), 2500)
    } catch (e: any) {
      setError(e.message || "Đổi mật khẩu thất bại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View flex={1} backgroundColor={COLORS.bgDark}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" py="$10">

          {/* BG Glow */}
          <View position="absolute" bottom="-10%" right="-5%" width={400} height={400}
            backgroundColor={COLORS.green} opacity={0.05} borderRadius={200}
            style={{ filter: 'blur(100px)' } as any}
          />

          <Card
            {...({ animation: "bouncy", enterStyle: { opacity: 0, scale: 0.95, y: 20 } } as any)}
            width="100%" maxWidth={480} padding="$10" $ltSm={{ padding: "$6" } as any}
            borderRadius="$12" borderWidth={1} borderColor={COLORS.borderDark}
            backgroundColor={COLORS.cardBg} elevation={25}
          >
            <YStack gap="$7">

              {/* HEADER */}
              <YStack alignItems="center" gap="$3">
                <View width={72} height={72} borderRadius={36}
                  backgroundColor="rgba(40,167,69,0.12)"
                  justifyContent="center" alignItems="center"
                  borderWidth={1} borderColor="rgba(40,167,69,0.3)"
                >
                  <KeyRound size={36} color={COLORS.green as any} />
                </View>
                <H2 color="white" fontWeight="900" fontSize={28} fontFamily={FONT_BODY} textAlign="center">Đổi mật khẩu</H2>
                <Text color={COLORS.textGray} fontSize={14} fontWeight="600" textAlign="center" fontFamily={FONT_BODY} lineHeight={22 as any}>
                  Thay đổi mật khẩu để bảo vệ tài khoản của bạn
                </Text>
              </YStack>

              {/* INPUTS */}
              <YStack gap="$4">
                {/* Mật khẩu hiện tại */}
                <YStack gap="$2">
                  <Label color={COLORS.textGray} fontSize={11} fontWeight="900" letterSpacing={1} fontFamily={FONT_BODY} marginLeft="$1">MẬT KHẨU HIỆN TẠI</Label>
                  <XStack backgroundColor={COLORS.inputBg} borderRadius="$6" borderWidth={1}
                    borderColor={COLORS.borderDark} alignItems="center" paddingHorizontal="$4"
                  >
                    <Lock size={18} color={COLORS.textGray as any} />
                    <Input
                      flex={1} marginLeft="$3" borderWidth={0} backgroundColor="transparent"
                      color="white" height={52} fontSize={15} fontWeight="600" fontFamily={FONT_BODY}
                      placeholderTextColor={"#333" as any} placeholder="Mật khẩu hiện tại"
                      type={showOld ? 'text' : 'password'}
                      focusStyle={{ outlineWidth: 0 } as any}
                      value={oldPass}
                      onChange={(e: any) => { setOldPass(e.target.value); setError('') }}
                    />
                    <Button unstyled onPress={() => setShowOld(v => !v)} p="$2">
                      {showOld ? <EyeOff size={18} color={COLORS.textGray as any} /> : <Eye size={18} color={COLORS.textGray as any} />}
                    </Button>
                  </XStack>
                </YStack>

                <View height={1} backgroundColor={COLORS.borderDark} />

                {/* Mật khẩu mới */}
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
                      type={showNew ? 'text' : 'password'}
                      focusStyle={{ outlineWidth: 0 } as any}
                      value={newPass}
                      onChange={(e: any) => { setNewPass(e.target.value); setError('') }}
                    />
                    <Button unstyled onPress={() => setShowNew(v => !v)} p="$2">
                      {showNew ? <EyeOff size={18} color={COLORS.textGray as any} /> : <Eye size={18} color={COLORS.textGray as any} />}
                    </Button>
                  </XStack>
                </YStack>

                {/* Xác nhận mật khẩu mới */}
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
                      type={showConfirm ? 'text' : 'password'}
                      focusStyle={{ outlineWidth: 0 } as any}
                      value={confirmPass}
                      onChange={(e: any) => { setConfirmPass(e.target.value); setError('') }}
                    />
                    <Button unstyled onPress={() => setShowConfirm(v => !v)} p="$2">
                      {showConfirm ? <EyeOff size={18} color={COLORS.textGray as any} /> : <Eye size={18} color={COLORS.textGray as any} />}
                    </Button>
                  </XStack>
                </YStack>

                {/* Hint */}
                <View backgroundColor="#0d1f12" borderRadius="$4" padding="$3" borderWidth={1} borderColor="#1a3320">
                  <Text color={COLORS.textGray} fontSize={11} fontFamily={FONT_BODY} lineHeight={18 as any}>
                    🔒 Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa (A-Z), chữ thường (a-z), số (0-9) và ký tự đặc biệt (!@#$%...).
                  </Text>
                </View>

                {/* Strength bar */}
                {newPass.length > 0 && (
                  <YStack gap="$1">
                    <XStack gap="$1">
                      {[1,2,3,4].map(i => {
                        const strength = [
                          newPass.length >= 8,
                          /[A-Z]/.test(newPass),
                          /\d/.test(newPass),
                          /[!@#$%^&*()]/.test(newPass),
                        ]
                        const filled = strength.filter(Boolean).length >= i
                        const colors = ['#ff4d4d','#f4a261','#ffd166','#28a745']
                        return (
                          <View key={i} flex={1} height={4} borderRadius={2}
                            backgroundColor={filled ? colors[Math.min(strength.filter(Boolean).length - 1, 3)] : COLORS.borderDark}
                          />
                        )
                      })}
                    </XStack>
                    <Text color={COLORS.textGray} fontSize={11} fontFamily={FONT_BODY}>
                      {(() => {
                        const s = [newPass.length >= 8, /[A-Z]/.test(newPass), /\d/.test(newPass), /[!@#$%^&*()]/.test(newPass)].filter(Boolean).length
                        return ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh ✓'][s]
                      })()}
                    </Text>
                  </YStack>
                )}
              </YStack>

              {error && <Text color={COLORS.errorRed} fontSize={12} fontWeight="700" textAlign="center">{error}</Text>}

              {/* BUTTONS */}
              <YStack gap="$3">
                <Button
                  backgroundColor={COLORS.green} borderRadius="$10" height={56} unstyled
                  flexDirection="row" justifyContent="center" alignItems="center" gap="$2"
                  onPress={handleChange} opacity={loading ? 0.7 : 1} disabled={loading}
                  hoverStyle={{ backgroundColor: '#1e7e34' } as any}
                >
                  <Text color="white" fontWeight="900" fontSize={16} fontFamily={FONT_BODY} letterSpacing={1}>
                    {loading ? "ĐANG XỬ LÝ..." : "CẬP NHẬT MẬT KHẨU"}
                  </Text>
                </Button>

                <Button unstyled onPress={() => router.back()} flexDirection="row" justifyContent="center" alignItems="center" gap="$1">
                  <ChevronLeft size={16} color={COLORS.textGray as any} />
                  <Text color={COLORS.textGray} fontSize={13} fontWeight="600" fontFamily={FONT_BODY} hoverStyle={{ color: 'white' } as any}>
                    Quay lại
                  </Text>
                </Button>
              </YStack>

            </YStack>
          </Card>
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
              <Text color="white" fontWeight="800" fontSize={15} fontFamily={FONT_BODY}>✅ Đổi mật khẩu thành công!</Text>
            </Card>
          </View>
        )}
      </AnimatePresence>
    </View>
  )
}
