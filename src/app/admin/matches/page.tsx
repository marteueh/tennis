import Link from 'next/link'
import { getAdminMatches, type AdminMatchRow } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ROUND_LABELS: Record<string, string> = {
  F: 'F', SF: 'SF', QF: 'QF', R16: 'R16', R32: 'R32', R64: 'R64', R128: 'R128',
}

interface Props {
  searchParams: Promise<{ q?: string; year?: string }>
}

export default async function AdminMatchesListPage({ searchParams }: Props) {
  const { q, year } = await searchParams
  const yearNum = year ? parseInt(year, 10) : undefined

  let matches: AdminMatchRow[] = []
  let error: string | null = null
  try {
    matches = await getAdminMatches({ search: q, year: yearNum, limit: 200 })
  } catch (e) {
    error = (e as Error).message
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7870', marginBottom: 6 }}>
          Admin · Partite
        </p>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: '#1A1A1A' }}>
          Schede partite
        </h1>
      </div>

      <form method="get" style={{ marginBottom: 18, display: 'flex', gap: 8 }}>
        <input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Cerca per nome giocatore..."
          style={{
            flex: 1, maxWidth: 320, fontSize: 13, padding: '8px 12px',
            border: '1px solid rgba(26,26,26,0.15)', borderRadius: 2,
            color: '#1A1A1A',
          }}
        />
        <input
          type="number"
          name="year"
          defaultValue={year ?? ''}
          placeholder="Anno"
          style={{
            width: 100, fontSize: 13, padding: '8px 12px',
            border: '1px solid rgba(26,26,26,0.15)', borderRadius: 2,
            color: '#1A1A1A',
          }}
        />
        <button type="submit" style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '8px 18px', background: '#1A1A1A', color: '#FFFFFF',
          border: 'none', borderRadius: 2, cursor: 'pointer',
        }}>Cerca</button>
      </form>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 4, fontSize: 13, color: '#991B1B' }}>
          DB: {error}
        </div>
      )}

      <p style={{ fontSize: 11, color: '#7A7870', marginBottom: 12 }}>
        {matches.length} risultat{matches.length === 1 ? 'o' : 'i'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {matches.map(m => {
          const hasVideo = !!m.youtube_video_id
          const hasNote  = !!m.editorial_note_it
          return (
            <Link
              key={m.id}
              href={`/admin/matches/${m.slug}`}
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(26,26,26,0.06)',
                borderLeft: m.featured ? '3px solid #C8A85C' : '3px solid transparent',
                borderRadius: 2,
                padding: '10px 14px',
                textDecoration: 'none',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}
              className="hover:border-accent/30"
            >
              <span style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 14, fontWeight: 600, color: '#1A1A1A',
                width: 50, fontVariantNumeric: 'tabular-nums',
              }}>
                {m.year}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 500, letterSpacing: '0.06em',
                color: '#C8A85C', width: 32,
              }}>
                {ROUND_LABELS[m.round] ?? m.round}
              </span>
              <span style={{ fontSize: 13, color: '#1A1A1A', flex: 1 }}>
                <strong>{m.winner_name}</strong> b. {m.loser_name}
              </span>
              <span style={{ fontSize: 11, color: '#7A7870', minWidth: 130 }}>
                {m.tournament_name}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <Pill ok={hasVideo} label={hasVideo ? 'VIDEO' : 'NO VID'} />
                <Pill ok={hasNote}  label={hasNote  ? 'NOTA'  : '—'} />
                {m.featured && <Pill gold label="FEAT" />}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function Pill({ ok, gold, label }: { ok?: boolean; gold?: boolean; label: string }) {
  const bg = gold ? 'rgba(200,168,92,0.15)' : ok ? 'rgba(34,197,94,0.1)' : 'rgba(26,26,26,0.04)'
  const fg = gold ? '#92400E' : ok ? '#16A34A' : '#9CA3AF'
  return (
    <span style={{
      fontSize: 9, fontWeight: 500, letterSpacing: '0.06em',
      padding: '2px 6px', borderRadius: 2,
      background: bg, color: fg, minWidth: 38, textAlign: 'center',
    }}>
      {label}
    </span>
  )
}
