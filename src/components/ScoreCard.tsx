import Link from 'next/link'
import type { Match } from '@/lib/types'
import { ROUND_LABELS } from '@/lib/types'
import { formatScore } from '@/lib/utils'

function parseSet(s: string): { w: number; l: number; tb: number | null } {
  const tb = s.match(/\((\d+)\)/)
  const clean = s.replace(/\(\d+\)/, '')
  const parts = clean.split('-')
  const w = parseInt(parts[0], 10)
  const l = parseInt(parts[1] ?? '', 10)
  const t = tb ? parseInt(tb[1], 10) : null
  return { w: isNaN(w) ? 0 : w, l: isNaN(l) ? 0 : l, tb: t !== null && !isNaN(t) ? t : null }
}

interface ScoreCardProps {
  match: Match
  showNumber?: number
}

export function ScoreCard({ match, showNumber }: ScoreCardProps) {
  const winner = match.winner
  const loser  = match.loser
  const sets   = formatScore(match.score)

  return (
    <Link
      href={`/partite/${match.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <article
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(26,26,26,0.08)',
          borderRadius: 2,
          padding: '20px 24px',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          cursor: 'pointer',
          position: 'relative',
        }}
        className="group hover:border-accent/30 hover:shadow-sm"
      >
        {/* Numero partita decorativo */}
        {showNumber !== undefined && (
          <span
            style={{
              position: 'absolute',
              top: 16,
              right: 20,
              fontFamily: "'Playfair Display', sans-serif",
              fontSize: 28,
              color: 'rgba(26,26,26,0.08)',
              lineHeight: 1,
              transition: 'color 0.15s',
              userSelect: 'none',
            }}
            className="group-hover:text-accent/20"
          >
            {String(showNumber).padStart(2, '0')}
          </span>
        )}

        {/* Meta info */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#7A7870',
            }}
          >
            {match.tournament?.name_it ?? match.tournament?.name ?? ''}
          </span>
          <span style={{ color: 'rgba(26,26,26,0.2)', fontSize: 10 }}>·</span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#7A7870',
            }}
          >
            {match.year}
          </span>
          <span style={{ color: 'rgba(26,26,26,0.2)', fontSize: 10 }}>·</span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#534AB7',
            }}
          >
            {ROUND_LABELS[match.round] ?? match.round}
          </span>
        </div>

        {/* Players e score */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Winner row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: 'rgba(83,74,183,0.08)',
              borderRadius: 2,
              padding: '8px 12px',
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 17,
                fontWeight: 600,
                color: '#534AB7',
                lineHeight: 1.1,
              }}
            >
              {winner ? `${winner.first_name} ${winner.last_name}` : 'N/D'}
            </span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {sets.map((s, i) => {
                const { w, l } = parseSet(s)
                const wonSet = w > l
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      width: 28,
                      textAlign: 'center',
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 22,
                      fontWeight: wonSet ? 600 : 400,
                      color: wonSet ? '#1A1A1A' : 'rgba(26,26,26,0.3)',
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {w}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Loser row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '6px 12px',
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 16,
                fontWeight: 400,
                color: 'rgba(26,26,26,0.45)',
                lineHeight: 1.1,
              }}
            >
              {loser ? `${loser.first_name} ${loser.last_name}` : 'N/D'}
            </span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {sets.map((s, i) => {
                const { w, l, tb } = parseSet(s)
                const wonSet = l > w
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      width: 28,
                      textAlign: 'center',
                      position: 'relative',
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 22,
                      fontWeight: wonSet ? 600 : 400,
                      color: wonSet ? 'rgba(26,26,26,0.55)' : 'rgba(26,26,26,0.2)',
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {l}
                    {tb !== null && (
                      <sup style={{
                        position: 'absolute',
                        top: -1,
                        right: -10,
                        fontSize: 9,
                        fontFamily: "'DM Sans', sans-serif",
                        color: 'rgba(26,26,26,0.35)',
                        fontWeight: 400,
                      }}>
                        {tb}
                      </sup>
                    )}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom indicators */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(26,26,26,0.06)',
          }}
        >
          {match.youtube_video_id && (
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#534AB7',
              }}
            >
              ▶ Video
            </span>
          )}
          {(match.clerici_excerpt_it || match.clerici_source?.startsWith('free:')) && (
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#C8A85C',
              }}
            >
              ✒ Clerici
            </span>
          )}
        </div>
      </article>
    </Link>
  )
}
