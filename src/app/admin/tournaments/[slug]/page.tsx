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
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px', fontFamily: "var(--font-sans)" }}>
      <nav style={{ marginBottom: 18, fontSize: 12, color: 'var(--muted)' }}>
        <Link href="/admin/tournaments" style={{ color: 'var(--accent)', textDecoration: 'none' }}>← Tutti i tornei</Link>
        <span style={{ margin: '0 8px', color: 'rgba(var(--ink-rgb),0.2)' }}>·</span>
        <Link href={`/tornei/${tournament.slug}`} target="_blank" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
          Vedi pagina pubblica ↗
        </Link>
      </nav>

      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
          Scheda torneo · {tournament.category}
        </p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: 'var(--ink)', lineHeight: 1.1 }}>
          {tournament.name_it ?? tournament.name}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
          {tournament.city ?? ''} {tournament.country_code ? `· ${tournament.country_code}` : ''}
          {tournament.surface && ` · ${SURFACE_LABELS[tournament.surface] ?? tournament.surface}`}
        </p>
      </div>

      <Section title="Riquadri culturali (libri, film, pubblicità...)">
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
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
        fontFamily: "var(--font-serif)",
        fontSize: 18, fontWeight: 600, color: 'var(--ink)',
        marginBottom: 14, paddingBottom: 8,
        borderBottom: '1px solid rgba(var(--ink-rgb),0.12)',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}
