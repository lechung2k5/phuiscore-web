import MediaDashboard from 'app/components/Media/MediaDashboard'

export default function Page({ params }: { params: { slug: string[] } }) {
  return <MediaDashboard params={params} />
}
