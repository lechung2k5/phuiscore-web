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

// Tamagui 2.0.0-rc.0 ToastViewport triggers a React dev-only warning inside
// @tamagui/web Slot by reading children.props.ref. This keeps the console usable
// until Tamagui is upgraded; production behavior is unchanged.
if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'development' &&
  !(window as any).__phuiscoreFilteredTamaguiRefWarning
) {
  ;(window as any).__phuiscoreFilteredTamaguiRefWarning = true

  const isKnownTamaguiRefWarning = (args: unknown[]) =>
    args.some((arg) => String(arg).includes('`ref` is not a prop'))

  const originalWarn = console.warn
  console.warn = (...args) => {
    if (isKnownTamaguiRefWarning(args)) return
    originalWarn(...args)
  }

  const originalError = console.error
  console.error = (...args) => {
    if (isKnownTamaguiRefWarning(args)) return
    originalError(...args)
  }
}

type ProviderProps = Omit<TamaguiProviderProps, 'config' | 'defaultTheme'> & {
  defaultTheme?: 'light' | 'dark'
}

export function Provider({
  children,
  defaultTheme = 'dark', // Đổi mặc định thành DARK cho đúng style PHUISCORE
  ...rest
}: ProviderProps) {
  // Tránh dùng hook native trên server để ngăn lỗi useContext
  const colorScheme = typeof window !== 'undefined' ? useColorScheme() : 'dark'

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
