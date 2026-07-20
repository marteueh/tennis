import type { Metadata } from 'next'
import Link from 'next/link'
import { getAdminYoutubeMatches, type AdminYoutubeRow } from '@/lib/supabase'
import { saveYoutube, removeYoutube } from './actions'

export const metadata: Metadata = { title: 'Admin — Video YouTube' }
export const dynamic = 'force-dynamic'

const ROUND_LABELS: Record<string, string> = {
  F: 'Finale', SF: 'Semifinale', QF: 'Quarti',
}

const TOURNAMENTS = [
  { slug: '',                label: 'Tutti' },
  { slug: 'wimbledon',       label: 'Wimbledon' },
  { slug: 'australian-open', label: 'Australian Open' },
  { slug: 'roland-garros',   label: 'Roland Garros' },
  { slug: 'us-open',         label: 'US Open' },
]

interface Props {
  searchParams: Promise<{ tourn?: string; con?: string }>
}

export default async function AdminYoutubePage({ searchParams }: Props) {
  const { tourn = '', con } = await searchParams
  const withVideo = con === '1'

  let matches: AdminYoutubeRow[] = []
  let error: string | null = null
  try {
    matches = await getAdminYoutubeMatches({
      tournamentSlug: tourn || undefined,
      withVideo,
    })
  } catch (e) {
    error = (e as Error).message
  }

  const activeTourn = tourn || ''

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7870' }}>
            Admin
          </p>
          <Link href="/admin/clerici" style={{ fontSize: 10, color: '#534AB7', textDecoration: 'none', letterSpacing: '0.08em' }}>
            → Clerici
          </Link>
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: '#1A1A1A', marginBottom: 4 }}>
          Video YouTube
        </h1>
        <p style={{ fontSize: 13, color: '#7A7870' }}>
          Inserimento manuale link YouTube (F · SF · QF)
        </p>
      </div>

      {/* Filtri torneo */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {TOURNAMENTS.map(t => (
          <Link
            key={t.slug}
            href={`/admin/youtube?tourn=${t.slug}${withVideo ? '&con=1' : ''}`}
            style={{
              fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '5px 14px', borderRadius: 2, textDecoration: 'none',
              background: activeTourn === t.slug ? '#1A1A1A' : 'transparent',
              color: activeTourn === t.slug ? '#FFFFFF' : '#7A7870',
              border: '1px solid',
              borderColor: activeTourn === t.slug ? '#1A1A1A' : 'rgba(26,26,26,0.15)',
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Toggle senza/con video */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        <Link
          href={`/admin/youtube?tourn=${activeTourn}`}
          style={{
            fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '5px 14px', borderRadius: 2, textDecoration: 'none',
            background: !withVideo ? '#534AB7' : 'transparent',
            color: !withVideo ? '#FFFFFF' : '#7A7870',
            border: `1px solid ${!withVideo ? '#534AB7' : 'rgba(26,26,26,0.15)'}`,
          }}
        >
          Senza video ({!withVideo ? matches.length : '…'})
        </Link>
        <Link
          href={`/admin/youtube?tourn=${activeTourn}&con=1`}
          style={{
            fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '5px 14px', borderRadius: 2, textDecoration: 'none',
            background: withVideo ? '#16A34A' : 'transparent',
            color: withVideo ? '#FFFFFF' : '#7A7870',
            border: `1px solid ${withVideo ? '#16A34A' : 'rgba(26,26,26,0.15)'}`,
          }}
        >
          Con video ({withVideo ? matches.length : '…'})
        </Link>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 4, marginBottom: 24, fontSize: 13, color: '#991B1B' }}>
          Errore DB: {error}
        </div>
      )}

      {matches.length === 0 && !error && (
        <p style={{ fontSize: 13, color: '#9CA3AF', padding: '32px 0', textAlign: 'center' }}>
          Nessuna partita trovata con questi filtri.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map(m => (
          <MatchRow key={m.id} match={m} />
        ))}
      </div>
    </div>
  )
}

function MatchRow({ match: m }: { match: AdminYoutubeRow }) {
  const hasVideo = !!m.youtube_video_id

  return (
    <details
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(26,26,26,0.1)',
        borderLeft: `3px solid ${hasVideo ? '#16A34A' : m.tournament_slug === 'wimbledon' ? '#C8A85C' : 'rgba(26,26,26,0.15)'}`,
        borderRadius: 2,
      }}
    >
      <summary
        style={{
          padding: '10px 16px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          listStyle: 'none',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
            {m.year}
          </span>
          <span style={{ fontSize: 11, color: '#C8A85C', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
            {ROUND_LABELS[m.round] ?? m.round}
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m.winner_name} vs {m.loser_name}
          </span>
          <span style={{ fontSize: 11, color: '#7A7870', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {m.tournament_name}
          </span>
        </div>

        <div style={{ flexShrink: 0 }}>
          {hasVideo ? (
            <span style={{
              fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 2,
              background: 'rgba(34,197,94,0.1)', color: '#16A34A', border: '1px solid rgba(34,197,94,0.25)',
            }}>
              ▶ {m.youtube_video_id}
            </span>
          ) : (
            <span style={{
              fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 2,
              background: 'rgba(26,26,26,0.04)', color: '#9CA3AF', border: '1px solid rgba(26,26,26,0.08)',
            }}>
              Senza video
            </span>
          )}
        </div>
      </summary>

      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(26,26,26,0.05)' }}>
        {/* Link apertura YouTube se già presente */}
        {hasVideo && (
          <div style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <a
              href={`https://www.youtube.com/watch?v=${m.youtube_video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 500, color: '#16A34A', textDecoration: 'none',
                padding: '6px 12px', background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)', borderRadius: 2,
              }}
            >
              ▶ Guarda su YouTube →
            </a>
            {m.youtube_channel && (
              <span style={{ fontSize: 11, color: '#7A7870' }}>
                Canale: {m.youtube_channel}
              </span>
            )}
          </div>
        )}

        {/* Form inserimento/aggiornamento */}
        <form action={saveYoutube} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="hidden" name="id" value={m.id} />

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7870', marginBottom: 5 }}>
                URL YouTube o Video ID
              </label>
              <input
                type="text"
                name="youtube_url"
                defaultValue={m.youtube_video_id ? `https://www.youtube.com/watch?v=${m.youtube_video_id}` : ''}
                placeholder="https://www.youtube.com/watch?v=… oppure ID diretto"
                style={{
                  width: '100%', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  padding: '7px 10px', border: '1px solid rgba(26,26,26,0.15)',
                  borderRadius: 2, boxSizing: 'border-box', color: '#1A1A1A',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7870', marginBottom: 5 }}>
                Canale (opzionale)
              </label>
              <input
                type="text"
                name="youtube_channel"
                defaultValue={m.youtube_channel ?? ''}
                placeholder="es. Wimbledon"
                style={{
                  width: '100%', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  padding: '7px 10px', border: '1px solid rgba(26,26,26,0.15)',
                  borderRadius: 2, boxSizing: 'border-box', color: '#1A1A1A',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '7px 18px', background: '#534AB7', color: '#FFFFFF',
                border: 'none', borderRadius: 2, cursor: 'pointer',
              }}
            >
              Salva
            </button>

            {hasVideo && (
              <button
                type="submit"
                formAction={removeYoutube}
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '7px 14px', background: 'transparent', color: '#9CA3AF',
                  border: '1px solid rgba(26,26,26,0.12)', borderRadius: 2, cursor: 'pointer',
                }}
              >
                Rimuovi
              </button>
            )}

            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${m.winner_name} ${m.loser_name} ${m.tournament_name} ${m.year}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '7px 14px', background: 'transparent', color: '#7A7870',
                border: '1px solid rgba(26,26,26,0.12)', borderRadius: 2,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
              }}
            >
              🔍 Cerca su YouTube
            </a>
          </div>
        </form>
      </div>
    </details>
  )
}
