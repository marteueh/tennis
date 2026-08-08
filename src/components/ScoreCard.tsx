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
  featured?: boolean
}

export function ScoreCard({ match, showNumber, featured = false }: ScoreCardProps) {
  const winner = match.winner
  const loser  = match.loser
  const sets   = formatScore(match.score)
  const isFinal = match.round === 'F'

  return (
    <Link
      href={`/partite/${match.slug}`}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      <article
        className="group lift-on-hover"
        style={{
          background: featured ? 'var(--ink)' : '#FFFFFF',
          border: featured ? 'none' : '1px solid rgba(var(--ink-rgb),0.08)',
          borderTop: featured ? '3px solid var(--gold)' : undefined,
          borderRadius: 2,
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        {/* Barra laterale — oro per le finali, neutra per il resto */}
        {!featured && (
          <div style={{ width: 4, flexShrink: 0, background: isFinal ? 'var(--gold)' : 'rgba(var(--ink-rgb),0.12)' }} />
        )}

        <div style={{ flex: 1, padding: featured ? '32px 36px' : '18px 20px', position: 'relative', minWidth: 0 }}>
          {/* Numero partita decorativo */}
          {showNumber !== undefined && !featured && (
            <span
              style={{
                position: 'absolute',
                top: 14,
                right: 18,
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                fontSize: 32,
                color: 'rgba(var(--ink-rgb),0.06)',
                lineHeight: 1,
                transition: 'color 0.15s',
                userSelect: 'none',
              }}
              className="group-hover:text-accent/15"
            >
              {String(showNumber).padStart(2, '0')}
            </span>
          )}

          {/* Meta info */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: featured ? 24 : 14, flexWrap: 'wrap' }}>
            {featured && (
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                  marginRight: 4,
                }}
              >
                Partita della settimana
              </span>
            )}
            <span
              style={{
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                fontSize: featured ? 15 : 12,
                letterSpacing: '0.08em',
                color: isFinal ? 'var(--gold)' : featured ? 'rgba(255,255,255,0.5)' : 'var(--muted)',
              }}
            >
              {ROUND_LABELS[match.round] ?? match.round}
            </span>
            <span style={{ color: featured ? 'rgba(255,255,255,0.2)' : 'rgba(var(--ink-rgb),0.2)', fontSize: 10 }}>·</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: featured ? 13 : 11,
                fontWeight: 500,
                color: featured ? 'rgba(255,255,255,0.6)' : 'var(--muted)',
              }}
            >
              {match.tournament?.name_it ?? match.tournament?.name ?? ''}
            </span>
            <span style={{ color: featured ? 'rgba(255,255,255,0.2)' : 'rgba(var(--ink-rgb),0.2)', fontSize: 10 }}>·</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: featured ? 13 : 11,
                color: featured ? 'rgba(255,255,255,0.4)' : 'rgba(var(--ink-rgb),0.4)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {match.year}
            </span>
          </div>

          {/* Players e score */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: featured ? 14 : 6 }}>
            {/* Winner row */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: featured ? 30 : 16,
                  fontWeight: 600,
                  color: featured ? '#FFFFFF' : 'var(--ink)',
                  lineHeight: 1.15,
                  minWidth: 0,
                }}
              >
                {winner ? `${winner.first_name} ${winner.last_name}` : 'N/D'}
              </span>
              <div style={{ display: 'flex', gap: featured ? 16 : 10, flexShrink: 0 }}>
                {sets.map((s, i) => {
                  const { w, l } = parseSet(s)
                  const wonSet = w > l
                  return (
                    <span
                      key={i}
                      style={{
                        display: 'inline-block',
                        minWidth: featured ? 20 : 14,
                        textAlign: 'center',
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                        fontSize: featured ? 30 : 20,
                        color: wonSet ? 'var(--accent)' : featured ? 'rgba(255,255,255,0.3)' : 'rgba(var(--ink-rgb),0.25)',
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
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: featured ? 20 : 14,
                  fontWeight: 400,
                  color: featured ? 'rgba(255,255,255,0.45)' : 'rgba(var(--ink-rgb),0.5)',
                  lineHeight: 1.2,
                }}
              >
                {loser ? `${loser.first_name} ${loser.last_name}` : 'N/D'}
              </span>
              <div style={{ display: 'flex', gap: featured ? 16 : 10, flexShrink: 0 }}>
                {sets.map((s, i) => {
                  const { w, l, tb } = parseSet(s)
                  const wonSet = l > w
                  return (
                    <span
                      key={i}
                      style={{
                        display: 'inline-block',
                        minWidth: featured ? 20 : 14,
                        textAlign: 'center',
                        position: 'relative',
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                        fontSize: featured ? 22 : 20,
                        color: wonSet ? (featured ? 'rgba(255,255,255,0.6)' : 'rgba(var(--ink-rgb),0.55)') : featured ? 'rgba(255,255,255,0.15)' : 'rgba(var(--ink-rgb),0.2)',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {l}
                      {tb !== null && (
                        <sup style={{
                          position: 'absolute',
                          top: -2,
                          right: -9,
                          fontSize: 8,
                          fontFamily: "var(--font-sans)",
                          color: featured ? 'rgba(255,255,255,0.4)' : 'rgba(var(--ink-rgb),0.35)',
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
          {(match.youtube_video_id || match.clerici_excerpt_it || match.clerici_source?.startsWith('free:')) && (
            <div
              style={{
                display: 'flex',
                gap: 16,
                marginTop: featured ? 24 : 12,
                paddingTop: featured ? 20 : 10,
                borderTop: featured ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(var(--ink-rgb),0.06)',
              }}
            >
              {match.youtube_video_id && (
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: featured ? 11 : 10,
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                  }}
                >
                  ▶ Video
                </span>
              )}
              {(match.clerici_excerpt_it || match.clerici_source?.startsWith('free:')) && (
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: featured ? 11 : 10,
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--gold)',
                  }}
                >
                  ✒ Clerici
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
