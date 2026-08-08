import Link from 'next/link'
import { getAdminPlayers } from '@/lib/supabase'
import type { Player } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminPlayersListPage({ searchParams }: Props) {
  const { q } = await searchParams
  let players: Player[] = []
  let error: string | null = null
  try {
    players = await getAdminPlayers({ search: q, limit: 200 })
  } catch (e) {
    error = (e as Error).message
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7C7568', marginBottom: 6 }}>
          Admin · Giocatori
        </p>
        <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 30, color: '#1C1A17' }}>
          Schede atleti
        </h1>
      </div>

      <form method="get" style={{ marginBottom: 18 }}>
        <input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Cerca giocatore..."
          style={{
            width: 320, fontSize: 13, padding: '8px 12px',
            border: '1px solid rgba(28,26,23,0.15)', borderRadius: 2,
            color: '#1C1A17', fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        />
      </form>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 4, fontSize: 13, color: '#991B1B' }}>
          DB: {error}
        </div>
      )}

      <p style={{ fontSize: 11, color: '#7C7568', marginBottom: 12 }}>
        {players.length} risultat{players.length === 1 ? 'o' : 'i'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 8 }}>
        {players.map(p => {
          const hasPhoto = !!p.photo_url
          const hasBio   = !!(p.bio_it || p.bio_en)
          return (
            <Link
              key={p.id}
              href={`/admin/players/${p.slug}`}
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(28,26,23,0.08)',
                borderRadius: 2,
                padding: '10px 14px',
                textDecoration: 'none',
                display: 'flex',
                gap: 6,
                flexDirection: 'column',
              }}
              className="hover:border-accent/30"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#1C1A17' }}>
                  {p.first_name} {p.last_name}
                </span>
                <span style={{ fontSize: 11, color: '#7C7568' }}>
                  {p.country_code}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, fontSize: 9, fontWeight: 500, letterSpacing: '0.06em' }}>
                <span style={{
                  padding: '2px 6px', borderRadius: 2,
                  background: hasPhoto ? 'rgba(34,197,94,0.1)' : 'rgba(28,26,23,0.04)',
                  color: hasPhoto ? '#16A34A' : '#9CA3AF',
                }}>
                  {hasPhoto ? '✓ FOTO' : 'NO FOTO'}
                </span>
                <span style={{
                  padding: '2px 6px', borderRadius: 2,
                  background: hasBio ? 'rgba(34,197,94,0.1)' : 'rgba(28,26,23,0.04)',
                  color: hasBio ? '#16A34A' : '#9CA3AF',
                }}>
                  {hasBio ? '✓ BIO' : 'NO BIO'}
                </span>
                {p.grand_slams > 0 && (
                  <span style={{
                    padding: '2px 6px', borderRadius: 2,
                    background: 'rgba(156,124,62,0.12)', color: '#92400E',
                  }}>
                    {p.grand_slams} SLAM
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
