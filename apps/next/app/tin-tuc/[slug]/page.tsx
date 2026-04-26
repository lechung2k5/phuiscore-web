import NewsDetailScreen from 'app/components/News/NewsDetailScreen'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface Props {
  params: { slug: string }
}

const API = process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res = await fetch(`${API}/news/${params.slug}`, { next: { revalidate: 60 } })
    if (!res.ok) return { title: 'Not Found' }
    
    const json = await res.json()
    const news = json.data
    
    // Tạo plain text summary từ HTML title và summary
    const plainTitle = news.title.replace(/<[^>]*>?/gm, '')
    const plainDesc = news.summary.replace(/<[^>]*>?/gm, '')

    return {
      title: `${plainTitle} | PhuiScore`,
      description: plainDesc,
      openGraph: {
        images: [news.thumbnail || ''],
      },
    }
  } catch (e) {
    return { title: 'Chi tiết tin tức' }
  }
}

export default function NewsDetailPage({ params }: Props) {
  return <NewsDetailScreen slug={params.slug} />
}
