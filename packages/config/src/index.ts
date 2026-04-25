// packages/config/src/index.ts
import { config } from './tamagui.config'

export * from './tamagui.config'
export default config

export type Conf = typeof config

// Khai báo chồng lên tất cả các package lõi của Tamagui
declare module 'tamagui' {
    interface TamaguiCustomConfig extends Conf { }
}

declare module '@tamagui/core' {
    interface TamaguiCustomConfig extends Conf { }
}

declare module '@tamagui/web' {
    interface TamaguiCustomConfig extends Conf { }
}