import { createMedia } from '@tamagui/react-native-media-driver' // THÊM DÒNG NÀY
import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui } from 'tamagui'
import { bodyFont, headingFont } from './fonts'
import { animations } from './animations'

export const config = createTamagui({
  ...defaultConfig, // Để default lên đầu
  animations,
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
  // Đưa Media xuống dưới để nó override (ghi đè) các mốc mặc định
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1024 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    // Các mốc "Lớn hơn" (Greater than)
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1024 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    // Các mốc "Nhỏ hơn" (Less than) - Để dứt điểm lỗi $ltMd
    ltSm: { maxWidth: 800 - 1 },
    ltMd: { maxWidth: 1024 - 1 },
    ltLg: { maxWidth: 1280 - 1 },

    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
  },
})

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf { }
}