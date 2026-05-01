import LiveMatchDetailScreen from 'app/components/Live/LiveMatchDetailScreen'
import { parseMatchSlug } from 'app/utils/slug'
import { Metadata } from 'next'

const API = process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id: matchId, date } = parseMatchSlug(params.id)
  
  try {
    const res = await fetch(`${API}/matches/detail/${matchId}?date=${date}`, { next: { revalidate: 60 } })
    const json = await res.json()
    
    if (json.success && json.data) {
      const match = json.data
      const title = `Trực tiếp ${match.homeTeam.name} vs ${match.awayTeam.name} | PhuiScore`
      const description = `Xem trực tiếp trận đấu ${match.homeTeam.name} vs ${match.awayTeam.name} ngày ${date}. Cập nhật tỉ số, diễn biến và thông số chi tiết tại PhuiScore.`
      
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          images: [match.homeTeam.logo, match.awayTeam.logo],
        }
      }
    }
  } catch (e) {
    console.error('Metadata fetch error:', e)
  }

  return {
    title: 'Chi Tiết Trận Đấu | PhuiScore',
    description: 'Theo dõi diễn biến trực tiếp trận đấu, xem video và thống kê'
  }
}

export default async function MatchDetailPage({ params }: { params: { id: string } }) {
  const { id: matchId, date } = parseMatchSlug(params.id)
  
  let initialData = null
  try {
    const res = await fetch(`${API}/matches/detail/${matchId}?date=${date}`, { 
      next: { revalidate: 60 },
      // Thêm timeout để không treo page quá lâu nếu crawler bị chậm
      signal: AbortSignal.timeout(8000) 
    })
    const json = await res.json()
    if (json.success) {
      initialData = json.data
    }
  } catch (e) {
    console.error('Server-side fetch error:', e)
  }

  return <LiveMatchDetailScreen matchId={matchId} overrideDate={date} initialData={initialData} />
}
