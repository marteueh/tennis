import type { Metadata } from 'next'
import { getAdminClericiMatches, type AdminClericiRow } from '@/lib/supabase'
import { saveClerici } from './actions'

export const metadata: Metadata = { title: 'Admin — Clerici excerpts' }

export const dynamic = 'force-dynamic'

const ROUND_LABELS: Record<string, string> = {
  F: 'Finale', SF: 'Semifinale', QF: 'Quarti', R16: 'Ottavi',
  R32: '3° turno', R64: '2° turno', R128: '1° turno',
}

function getSourceStatus(m: AdminClericiRow): 'excerpt' | 'free' | 'repubblica' | 'search' | 'none' {
  if (m.clerici_excerpt_it) return 'excerpt'
  if (m.clerici_source?.startsWith('free:')) return 'free'
  if (m.clerici_source === 'repubblica_verified') return 'repubblica'
  if (m.clerici_article_url) return 'search'
  return 'none'
}

const STATUS_CONFIG = {
  excerpt:    { label: 'Estratto',   color: '#16A34A', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',  leftBar: '#22C55E' },
  free:       { label: 'Libero',     color: '#0369A1', bg: 'rgba(14,165,233,0.1)',  border: 'rgba(14,165,233,0.25)', leftBar: '#0EA5E9' },
  repubblica: { label: 'Repubblica', color: '#92400E', bg: 'rgba(var(--gold-rgb),0.12)', border: 'rgba(var(--gold-rgb),0.3)',  leftBar: 'var(--gold)' },
  search:     { label: 'Ricerca',    color: '#6B7280', bg: 'rgba(var(--ink-rgb),0.05)',   border: 'rgba(var(--ink-rgb),0.1)',   leftBar: '#D1D5DB' },
  none:       { label: 'Assente',    color: '#9CA3AF', bg: 'rgba(var(--ink-rgb),0.03)',   border: 'rgba(var(--ink-rgb),0.07)',  leftBar: '#E5E7EB' },
}

export default async function AdminClericiPage() {
  let matches: AdminClericiRow[] = []
  let error: string | null = null

  try {
    matches = await getAdminClericiMatches()
  } catch (e) {
    error = (e as Error).message
  }

  const counts = {
    excerpt:    matches.filter(m => getSourceStatus(m) === 'excerpt').length,
    free:       matches.filter(m => getSourceStatus(m) === 'free').length,
    repubblica: matches.filter(m => getSourceStatus(m) === 'repubblica').length,
    search:     matches.filter(m => getSourceStatus(m) === 'search').length,
    none:       matches.filter(m => getSourceStatus(m) === 'none').length,
  }

  // Ordina: prima i più utili (repubblica → free → search → none → excerpt già fatto)
  const ordered = [...matches].sort((a, b) => {
    const order = { repubblica: 0, free: 1, search: 2, none: 3, excerpt: 4 }
    return order[getSourceStatus(a)] - order[getSourceStatus(b)]
  })

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px', fontFamily: "var(--font-sans)" }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
          Admin
        </p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: 'var(--ink)', marginBottom: 16 }}>
          Estratti Clerici
        </h1>

        {/* Contatori per stato */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(Object.entries(counts) as [keyof typeof STATUS_CONFIG, number][]).map(([key, n]) => (
            <div
              key={key}
              style={{
                padding: '6px 14px',
                borderRadius: 2,
                background: STATUS_CONFIG[key].bg,
                border: `1px solid ${STATUS_CONFIG[key].border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: STATUS_CONFIG[key].color, lineHeight: 1 }}>
                {n}
              </span>
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: STATUS_CONFIG[key].color }}>
                {STATUS_CONFIG[key].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 4, marginBottom: 24, fontSize: 13, color: '#991B1B' }}>
          Errore DB: {error}
        </div>
      )}

      {counts.none > 0 && (
        <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>
          Esegui <code style={{ background: '#F3F4F6', padding: '1px 6px', borderRadius: 3 }}>node database/search_clerici.mjs</code> per aggiornare la disponibilità su Repubblica e trovare articoli liberi.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ordered.map(m => (
          <MatchRow key={m.id} match={m} />
        ))}
      </div>
    </div>
  )
}

function MatchRow({ match: m }: { match: AdminClericiRow }) {
  const status = getSourceStatus(m)
  const cfg = STATUS_CONFIG[status]
  const domain = m.clerici_source?.startsWith('free:') ? m.clerici_source.slice(5) : null

  return (
    <details
      style={{
        background: '#FFFFFF',
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.leftBar}`,
        borderRadius: 2,
      }}
    >
      <summary
        style={{
          padding: '12px 18px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          listStyle: 'none',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: '0.08em', color: 'var(--muted)', flexShrink: 0 }}>
            {m.year}
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m.winner_name} vs {m.loser_name}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
            {m.tournament_name} · {ROUND_LABELS[m.round] ?? m.round}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {/* Badge stato principale */}
          <span style={{
            fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '2px 8px', borderRadius: 2,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          }}>
            {status === 'free' && domain ? `Libero · ${domain}` : cfg.label}
          </span>
          {/* Secondo badge se ha anche estratto */}
          {status !== 'excerpt' && status !== 'none' && status !== 'search' && m.clerici_excerpt_it && (
            <span style={{
              fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 2,
              background: STATUS_CONFIG.excerpt.bg, color: STATUS_CONFIG.excerpt.color, border: `1px solid ${STATUS_CONFIG.excerpt.border}`,
            }}>
              Estratto
            </span>
          )}
        </div>
      </summary>

      <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(var(--ink-rgb),0.05)' }}>
        {/* Link rapidi */}
        {(status === 'repubblica' || status === 'free') && m.clerici_article_url && (
          <div style={{ paddingTop: 12, marginBottom: 12 }}>
            <a
              href={m.clerici_article_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 500, color: cfg.color,
                textDecoration: 'none', padding: '6px 12px',
                background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 2,
              }}
            >
              {status === 'repubblica' ? '📰 Apri su Repubblica (paywall) →' : `🔗 Apri articolo libero su ${domain} →`}
            </a>
          </div>
        )}

        <form action={saveClerici} style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: status === 'none' || status === 'search' ? 14 : 0 }}>
          <input type="hidden" name="id" value={m.id} />

          <Field label="URL articolo" name="clerici_article_url" defaultValue={m.clerici_article_url ?? ''} placeholder="https://…" type="url" />
          <Field label="Fonte" name="clerici_source" defaultValue={m.clerici_source ?? ''} placeholder={`La Repubblica, ${m.match_date ?? m.year}`} />

          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
              Estratto Clerici (italiano)
            </label>
            <textarea
              name="clerici_excerpt_it"
              defaultValue={m.clerici_excerpt_it ?? ''}
              rows={5}
              style={{
                width: '100%', fontSize: 13, fontFamily: "var(--font-sans)",
                lineHeight: 1.6, padding: '10px 12px',
                border: '1px solid rgba(var(--ink-rgb),0.15)', borderRadius: 2,
                resize: 'vertical', boxSizing: 'border-box', color: 'var(--ink)',
              }}
              placeholder="Incolla qui l'estratto dall'articolo di Gianni Clerici…"
            />
          </div>

          <button
            type="submit"
            style={{
              alignSelf: 'flex-start',
              fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '8px 20px', background: 'var(--accent)', color: '#FFFFFF',
              border: 'none', borderRadius: 2, cursor: 'pointer',
            }}
          >
            Salva
          </button>
        </form>
      </div>
    </details>
  )
}

function Field({ label, name, defaultValue, placeholder, type = 'text' }: {
  label: string; name: string; defaultValue: string; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type} name={name} defaultValue={defaultValue} placeholder={placeholder}
        style={{
          width: '100%', fontSize: 13, fontFamily: "var(--font-sans)",
          padding: '8px 12px', border: '1px solid rgba(var(--ink-rgb),0.15)',
          borderRadius: 2, boxSizing: 'border-box', color: 'var(--ink)',
        }}
      />
    </div>
  )
}
