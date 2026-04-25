import { createInterFont } from '@tamagui/font-inter'

export const headingFont = createInterFont({
  size: {
    6: 15,
    11: 42,
    14: 64,
    15: 72, 
  },
  transform: {
    6: 'uppercase',
    7: 'none',
  },
  weight: {
    6: '400',
    7: '700',
    8: '800',
    9: '900', 
  },
  color: {
    6: '$colorFocus',
    7: '$color',
  },
  letterSpacing: {
    5: 2, 6: 1, 7: 0, 8: -1, 9: -2, 10: -3, 12: -4, 14: -5, 15: -6,
  },
  face: {
    // SỬA TẠI ĐÂY: Đổi 'InterBold' thành 'Inter' để trình duyệt nhận diện đúng
    700: { normal: 'Inter' }, 
    800: { normal: 'Inter' },
    900: { normal: 'Inter' }, 
  },
})

export const bodyFont = createInterFont(
  {
    weight: {
      4: '400',
      7: '700',
      8: '800',
    },
    face: {
      // Đảm bảo body font cũng dùng đúng tên 'Inter'
      400: { normal: 'Inter' },
      700: { normal: 'Inter' },
      800: { normal: 'Inter' },
    },
  },
  {
    sizeSize: (size) => Math.round(size * 1.1),
    sizeLineHeight: (size) => Math.round(size * 1.1 + (size > 20 ? 10 : 10)),
  }
)