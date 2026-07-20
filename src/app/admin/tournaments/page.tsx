import Link from 'next/link'
import { getTournaments } from '@/lib/supabase'
import { SURFACE_LABELS } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminTournamentsListPage() {
  const tournaments = await getTournaments().catch(() => [])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7C7568', marginBottom: 6 }}>
          Admin · Tornei
        </p>
        <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 30, color: '#1C1A17' }}>
          Schede tornei
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 10 }}>
        {tournaments.map(t => (
          <Link
            key={t.id}
            href={`/admin/tournaments/${t.slug}`}
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(28,26,23,0.08)',
              borderLeft: t.category === 'GrandSlam' ? '3px solid #9C7C3E' : '3px solid rgba(28,26,23,0.15)',
              borderRadius: 2,
              padding: '14px 16px',
              textDecoration: 'none',
            }}
            className="hover:border-accent/30"
          >
            <p style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: 17, fontWeight: 600, color: '#1C1A17',
              marginBottom: 4,
            }}>
              {t.name_it ?? t.name}
            </p>
            <p style={{ fontSize: 11, color: '#7C7568' }}>
              {t.category} · {t.city ?? ''} {t.country_code ? `(${t.country_code})` : ''}
              {t.surface && ` · ${SURFACE_LABELS[t.surface] ?? t.surface}`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
