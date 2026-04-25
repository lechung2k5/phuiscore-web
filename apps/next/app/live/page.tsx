import LiveScreen from 'app/components/Live/LiveScreen'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trực Tiếp | PhuiScore',
  description: 'Theo dõi các trận cầu nảy lửa từ các giải đấu phủi hàng đầu Việt Nam'
}

export default function LivePage() {
  return <LiveScreen />
}
