"use client"

import { useColorScheme } from 'react-native'
import {
  CustomToast,
  TamaguiProvider,
  type TamaguiProviderProps,
  ToastProvider,
  config,
  isWeb,
} from '@my/ui'
import { Theme } from 'tamagui'
import { ToastViewport } from './ToastViewport'

// 1. SILENCE WARNING: Bịt miệng cái warning "ref is not a prop" ngay tại đây
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn
  console.warn = (...args) => {
    if (args[0]?.includes?.('ref` is not a prop')) return
    originalWarn(...args)
  }
}

// 2. TYPES: Định nghĩa Type sạch sẽ
type ProviderProps = Omit<TamaguiProviderProps, 'config' | 'defaultTheme'> & {
  defaultTheme?: 'light' | 'dark'
}

export function Provider({
  children,
  defaultTheme = 'dark', // Đổi mặc định thành DARK cho đúng style PHUISCORE
  ...rest
}: ProviderProps) {
  const colorScheme = useColorScheme()

  // Xác định theme thực tế: Ưu tiên prop truyền vào > Hệ thống
  const theme = defaultTheme || (colorScheme === 'dark' ? 'dark' : 'light')

  return (
    <TamaguiProvider
      config={config}
      defaultTheme={theme}
      disableRootThemeClass // Giúp tối ưu hóa CSS trên Web
      {...rest}
    >
      {/* Bọc Theme ở đây giúp toàn bộ các token màu ($) 
         của các component con (Header, Card, etc.) hoạt động chính xác
      */}
      <Theme name={theme}>
        <ToastProvider
          swipeDirection="horizontal"
          duration={6000}
          native={isWeb ? [] : ['mobile']}
        >
          {children}

          <CustomToast />

          {/* ToastViewport: Đặt ở cuối cùng. 
            Nếu file ToastViewport.tsx của bạn có nhận props, hãy truyền vào.
            Nếu không, để trống như vầy là an toàn nhất để tránh lỗi Type.
          */}
          <ToastViewport />
        </ToastProvider>
      </Theme>
    </TamaguiProvider>
  )
}

