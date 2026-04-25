import React from 'react'
import { View, YStack, XStack, Text, Button } from 'tamagui'
import { AlertCircle, AlertTriangle, CheckCircle, Info } from '@tamagui/lucide-icons'

export const AppConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmText = 'Xác nhận', cancelText = 'Hủy', danger = false }: any) => {
  if (!open) return null
  return (
    <View position="fixed" top={0} left={0} right={0} bottom={0}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <YStack backgroundColor="#111" borderRadius={16} borderWidth={1} borderColor={danger ? 'rgba(255,77,79,0.3)' : 'rgba(255,255,255,0.1)'}
        width={400} maxWidth="100%" padding="$5" gap="$4" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.9)', animation: 'fadeSlideUp 0.2s cubic-bezier(0.22,1,0.36,1)' }}>
        <XStack gap="$3" alignItems="center">
          {danger ? <AlertTriangle size={24} color="#ff4d4f" /> : <AlertCircle size={24} color="#fa8c16" />}
          <Text color="white" fontSize={16} fontWeight="900" flex={1}>{title}</Text>
        </XStack>
        <Text color="#bbb" fontSize={14} lineHeight={20}>{message}</Text>
        <XStack gap="$3" marginTop="$2" justifyContent="flex-end">
          <Button size="$3" backgroundColor="rgba(255,255,255,0.05)" onPress={onCancel} borderRadius={8} hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <Text color="#ccc" fontWeight="700">{cancelText}</Text>
          </Button>
          <Button size="$3" backgroundColor={danger ? '#ff4d4f' : '#28a745'} onPress={onConfirm} borderRadius={8} hoverStyle={{ opacity: 0.8 }}>
            <Text color="white" fontWeight="800">{confirmText}</Text>
          </Button>
        </XStack>
      </YStack>
    </View>
  )
}

export const AppAlertDialog = ({ open, title, message, onClose, type = 'info' }: any) => {
  if (!open) return null
  const colors = {
    info: '#2980b9', success: '#28a745', error: '#ff4d4f', warning: '#fa8c16'
  }
  const icons = {
    info: <Info size={24} color={colors.info as any} />,
    success: <CheckCircle size={24} color={colors.success as any} />,
    error: <AlertCircle size={24} color={colors.error as any} />,
    warning: <AlertTriangle size={24} color={colors.warning as any} />
  }
  return (
    <View position="fixed" top={0} left={0} right={0} bottom={0}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <YStack backgroundColor="#111" borderRadius={16} borderWidth={1} borderColor="rgba(255,255,255,0.1)"
        width={360} maxWidth="100%" padding="$5" gap="$4" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.9)', animation: 'fadeSlideUp 0.2s cubic-bezier(0.22,1,0.36,1)' }}>
        <XStack gap="$3" alignItems="center">
          {icons[type as keyof typeof icons] || icons.info}
          <Text color="white" fontSize={16} fontWeight="900" flex={1}>{title}</Text>
        </XStack>
        <Text color="#bbb" fontSize={14} lineHeight={20}>{message}</Text>
        <Button size="$3" backgroundColor="rgba(255,255,255,0.1)" hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.15)' }} onPress={onClose} borderRadius={8} marginTop="$2">
          <Text color="white" fontWeight="800">Đóng</Text>
        </Button>
      </YStack>
    </View>
  )
}
