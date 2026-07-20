import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTournamentBySlug, getCulturalImpactsForTournament } from '@/lib/supabase'
import type { CulturalImpact } from '@/lib/types'
import { SURFACE_LABELS } from '@/lib/types'
import { CulturalImpactsManager } from '../../_components/CulturalImpactsManager'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AdminTournamentEditPage({ params }: Props) {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)
  if (!tournament) notFound()

  let impacts: CulturalImpact[] = []
  try { impacts = await getCulturalImpactsForTournament(tournament.id) } catch { /* ok */ }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <nav style={{ marginBottom: 18, fontSize: 12, color: '#7C7568' }}>
        <Link href="/admin/tournaments" style={{ color: '#B54A2C', textDecoration: 'none' }}>← Tutti i tornei</Link>
        <span style={{ margin: '0 8px', color: 'rgba(28,26,23,0.2)' }}>·</span>
        <Link href={`/tornei/${tournament.slug}`} target="_blank" style={{ color: '#7C7568', textDecoration: 'none' }}>
          Vedi pagina pubblica ↗
        </Link>
      </nav>

      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7C7568', marginBottom: 6 }}>
          Scheda torneo · {tournament.category}
        </p>
        <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 32, color: '#1C1A17', lineHeight: 1.1 }}>
          {tournament.name_it ?? tournament.name}
        </h1>
        <p style={{ fontSize: 12, color: '#7C7568', marginTop: 4 }}>
          {tournament.city ?? ''} {tournament.country_code ? `· ${tournament.country_code}` : ''}
          {tournament.surface && ` · ${SURFACE_LABELS[tournament.surface] ?? tournament.surface}`}
        </p>
      </div>

      <Section title="Riquadri culturali (libri, film, pubblicità...)">
        <p style={{ fontSize: 12, color: '#7C7568', marginBottom: 14, lineHeight: 1.5 }}>
          Riquadri visibili sulla scheda torneo. Per riquadri legati a una specifica edizione/partita, usa la pagina della singola partita.
        </p>
        <CulturalImpactsManager
          items={impacts}
          context={{ kind: 'tournament', id: tournament.id }}
        />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: 18, fontWeight: 600, color: '#1C1A17',
        marginBottom: 14, paddingBottom: 8,
        borderBottom: '1px solid rgba(28,26,23,0.12)',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}
