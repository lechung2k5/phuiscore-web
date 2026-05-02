import MediaDashboard from 'app/components/Media/MediaDashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bảng Điều Khiển Media | Phủi Score',
  description: 'Quản lý livestream, tỉ số và thông số trận đấu trực tiếp.'
}

export default function Page() {
  return <MediaDashboard />
}
