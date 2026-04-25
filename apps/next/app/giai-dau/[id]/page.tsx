import TournamentDetailScreen from 'app/components/Tournaments/TournamentDetailScreen'

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  return <TournamentDetailScreen id={params.id} />
}
