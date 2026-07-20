import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ScoreCard } from '@/components/ScoreCard'
import { CulturalImpactSection } from '@/components/CulturalImpactCard'
import { getTournamentBySlug, getMatchesByTournament, getCulturalImpactsForTournamentYear } from '@/lib/supabase'
import type { Tournament, Match, CulturalImpact } from '@/lib/types'
import { ROUND_LABELS } from '@/lib/types'

const ROUND_ORDER = ['F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128']

const MOCK_TOURNAMENT: Tournament = {
  id: 4, slug: 'us-open', name: 'US Open', name_it: 'US Open',
  surface: 'Hard', category: 'GrandSlam', country_code: 'USA', city: 'New York',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; anno: string }>
}): Promise<Metadata> {
  const { slug, anno } = await params
  const t = await getTournamentBySlug(slug).catch(() => null)
  const name = t?.name_it ?? t?.name ?? slug
  return {
    title: `${name} ${anno} — Tabellone completo`,
    description: `Tutte le partite del ${name} ${anno}. Tabellone completo con statistiche.`,
  }
}

export default async function TorneoAnnoPage({
  params,
}: {
  params: Promise<{ slug: string; anno: string }>
}) {
  const { slug, anno } = await params
  const year = parseInt(anno)

  if (isNaN(year) || year < 1968 || year > 2030) notFound()

  let tournament: Tournament | null = null
  let matches: Match[] = []
  let culturalItems: CulturalImpact[] = []

  try {
    tournament = await getTournamentBySlug(slug)
    if (tournament) {
      matches = await getMatchesByTournament(slug, year)
    }
  } catch {
    // fall through
  }

  try {
    if (tournament) {
      culturalItems = await getCulturalImpactsForTournamentYear(slug, year)
    }
  } catch { /* cultural impacts non bloccanti */ }

  if (!tournament) {
    if (slug === MOCK_TOURNAMENT.slug) tournament = MOCK_TOURNAMENT
    else notFound()
  }

  const name = tournament.name_it ?? tournament.name

  // Raggruppa per turno nell'ordine corretto
  const byRound: Record<string, Match[]> = {}
  for (const round of ROUND_ORDER) {
    const ms = matches.filter(m => m.round === round)
    if (ms.length > 0) byRound[round] = ms
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <nav style={{ marginBottom: 32, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/tornei" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#7A7870', textDecoration: 'none' }}>Tornei</Link>
        <span style={{ color: 'rgba(26,26,26,0.2)', fontSize: 12 }}>›</span>
        <Link href={`/tornei/${slug}`} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#7A7870', textDecoration: 'none' }}>{name}</Link>
        <span style={{ color: 'rgba(26,26,26,0.2)', fontSize: 12 }}>›</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#1A1A1A' }}>{anno}</span>
      </nav>

      <div style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8A85C', marginBottom: 8 }}>
          Tabellone completo
        </p>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, lineHeight: 1.1, color: '#1A1A1A' }}>
          {name} <span style={{ color: '#534AB7' }}>{anno}</span>
        </h1>
        <p style={{ marginTop: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#7A7870' }}>
          {matches.length} partite in archivio
        </p>
      </div>

      <CulturalImpactSection items={culturalItems} title="Eco culturale" />

      {matches.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic', fontSize: 16, color: '#7A7870', marginBottom: 8 }}>
            Le partite di questa edizione non sono ancora disponibili nell&#39;archivio.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(26,26,26,0.35)' }}>
            Il database viene aggiornato progressivamente con il dataset Sackmann.
          </p>
        </div>
      ) : (
        Object.entries(byRound).map(([round, roundMatches]) => (
          <section key={round} style={{ marginBottom: 40 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                marginBottom: 20,
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'rgba(26,26,26,0.08)' }} />
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: round === 'F' ? '#C8A85C' : '#7A7870',
                  padding: '0 16px',
                  whiteSpace: 'nowrap',
                }}
              >
                {ROUND_LABELS[round] ?? round}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(26,26,26,0.08)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
              {roundMatches.map(m => (
                <ScoreCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
