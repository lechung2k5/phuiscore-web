import { HomeClient } from './HomeClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Phủi Score | Nền tảng tỉ số bóng đá phủi hàng đầu Việt Nam',
  description: 'Cập nhật trực tiếp kết quả, bảng xếp hạng và tin tức các giải bóng đá phủi HPL, SPL và nhiều giải đấu phong trào khác.',
}

export default function UserPage() {
    return <HomeClient />
}